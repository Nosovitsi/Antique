import React, { useState, useEffect, useRef } from 'react'
import { supabase, SessionMessage, Product } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { Send, Image, ArrowLeft, Users, Package, Circle } from 'lucide-react'
import { ProductPostModal } from './ProductPostModal'
import { ChatMessage } from './ChatMessage'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'

interface LiveSessionChatProps {
  sessionId: number
  onBack: () => void
}

export function LiveSessionChat({ sessionId, onBack }: LiveSessionChatProps) {
  const { profile } = useAuth()
  const [messages, setMessages] = useState<(SessionMessage & { sender_name: string, product?: Product })[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [showProductModal, setShowProductModal] = useState(false)
  const [sessionInfo, setSessionInfo] = useState<any>(null)
  const [participants, setParticipants] = useState<any[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadSessionData()
    const cleanup = setupRealTimeSubscription()

    return () => {
      cleanup()
    }
  }, [sessionId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  async function loadSessionData() {
    try {
      setLoading(true)
      
      // Step 1: Load session info
      const { data: session, error: sessionError } = await supabase
        .from('live_sessions')
        .select('*')
        .eq('id', sessionId)
        .single()
      
      if (sessionError) throw sessionError
      
      // Step 2: If session exists, fetch seller's profile separately
      if (session) {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('user_id', session.seller_id)
          .single()

        // Step 3: Combine session data with seller's name
        setSessionInfo({
          ...session,
          seller_name: profileError ? 'Unknown' : profileData?.full_name
        })
      } else {
        setSessionInfo(null)
      }
      
      // Load messages
      const { data: messagesData, error: messagesError } = await supabase
        .from('session_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true })
      
      if (messagesError) throw messagesError
      
      // Get sender names and product data
      if (messagesData && messagesData.length > 0) {
        const senderIds = [...new Set(messagesData.map(m => m.sender_id))]
        const productIds = messagesData.filter(m => m.product_id).map(m => m.product_id)
        
        const [profilesRes, productsRes] = await Promise.all([
          supabase
            .from('profiles')
            .select('user_id, full_name')
            .in('user_id', senderIds),
          productIds.length > 0 ? supabase
            .from('products')
            .select('*')
            .in('id', productIds) : { data: [] }
        ])
        
        const messagesWithData = messagesData.map(message => ({
          ...message,
          sender_name: profilesRes.data?.find(p => p.user_id === message.sender_id)?.full_name || 'Unknown',
          product: message.product_id ? productsRes.data?.find(p => p.id === message.product_id) : undefined
        }))
        
        setMessages(messagesWithData)
      }
    } catch (error: any) {
      console.error('Error loading session data:', error)
      toast.error('Failed to load session')
    } finally {
      setLoading(false)
    }
  }

  function setupRealTimeSubscription() {
    const messageChannel = supabase
      .channel(`session_${sessionId}_messages`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'session_messages',
          filter: `session_id=eq.${sessionId}`
        },
        async (payload) => {
          const newMessage = payload.new as SessionMessage

          // Ignore messages sent by the current user
          if (profile && newMessage.sender_id === profile.user_id) {
            return
          }
          
          // Get sender name
          const { data: senderProfile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('user_id', newMessage.sender_id)
            .single()
          
          // Get product data if it's a product message
          let product = undefined
          if (newMessage.product_id) {
            const { data: productData } = await supabase
              .from('products')
              .select('*')
              .eq('id', newMessage.product_id)
              .single()
            product = productData
          }
          
          const messageWithData = {
            ...newMessage,
            sender_name: senderProfile?.full_name || 'Unknown',
            product
          }
          
          setMessages(prev => [...prev, messageWithData])
        }
      )
      .subscribe()

    // Listen for product status changes to update existing messages
    const productChannel = supabase
      .channel(`session_${sessionId}_products`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'products'
        },
        async (payload) => {
          const updatedProduct = payload.new as Product
          
          // Update any existing messages that reference this product
          setMessages(prev => prev.map(message => {
            if (message.product && message.product.id === updatedProduct.id) {
              return {
                ...message,
                product: updatedProduct
              }
            }
            return message
          }))
        }
      )
      .subscribe()

    return () => {
      messageChannel.unsubscribe()
      productChannel.unsubscribe()
    }
  }

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault()
    
    if (!newMessage.trim() || !profile) return
    
    setSending(true)
    
    try {
      const { data: newMessages, error } = await supabase
        .from('session_messages')
        .insert({
          session_id: sessionId,
          sender_id: profile.user_id,
          message_type: 'text',
          content: newMessage.trim()
        })
        .select()

      if (error) throw error

      if (newMessages && newMessages.length > 0) {
        const messageWithData = {
          ...(newMessages[0] as SessionMessage),
          sender_name: profile.full_name || 'You',
          product: undefined
        }
        setMessages(prev => [...prev, messageWithData])
      }
      
      setNewMessage('')
    } catch (error: any) {
      console.error('Error sending message:', error)
      toast.error('Failed to send message')
    } finally {
      setSending(false)
    }
  }

  async function handleProductPosted(productId: number) {
    try {
      const { error } = await supabase
        .from('session_messages')
        .insert({
          session_id: sessionId,
          sender_id: profile!.user_id,
          message_type: 'product',
          content: 'Posted a new product',
          product_id: productId
        })
      
      if (error) throw error
    } catch (error: any) {
      console.error('Error posting product message:', error)
      toast.error('Failed to announce product')
    }
  }

  async function handleReserveProduct(productId: number) {
    if (!profile) {
      toast.error('Please sign in to reserve products')
      return
    }

    if (profile.role !== 'buyer') {
      toast.error('Only buyers can reserve products')
      return
    }

    try {
      // Get product details first
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single()

      if (productError) throw productError
      
      if (!product) {
        toast.error('Product not found')
        return
      }

      if (product.status !== 'available') {
        toast.error('Product is no longer available')
        return
      }

      // Create reservation
      const { error: reservationError } = await supabase
        .from('reservations')
        .insert({
          product_id: productId,
          buyer_id: profile.user_id,
          seller_id: product.seller_id,
          status: 'active'
        })

      if (reservationError) throw reservationError

      // Update product status
      const { error: updateError } = await supabase
        .from('products')
        .update({ 
          status: 'reserved',
          updated_at: new Date().toISOString()
        })
        .eq('id', productId)

      if (updateError) throw updateError

      // Send chat message about the reservation
      const { error: messageError } = await supabase
        .from('session_messages')
        .insert({
          session_id: sessionId,
          sender_id: profile.user_id,
          message_type: 'text',
          content: `Reserved "${product.name}" for $${product.price}`
        })

      if (messageError) {
        console.error('Error sending reservation message:', messageError)
      }

      toast.success('Product reserved successfully!')
    } catch (error: any) {
      console.error('Error reserving product:', error)
      toast.error('Failed to reserve product')
    }
  }

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  const isSeller = profile?.user_id === sessionInfo?.seller_id

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={onBack}
              className="mr-3 p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            
            <div className="flex items-center">
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-2 rounded-xl mr-3">
                <Circle className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="font-semibold text-gray-900">
                  {sessionInfo?.title || 'Live Session'}
                </h1>
                <p className="text-sm text-gray-600">
                  by {sessionInfo?.seller_name || '...'}
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="bg-red-500 h-2 w-2 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-red-600">LIVE</span>
            <div className="flex items-center text-gray-600 ml-4">
              <Users className="h-4 w-4 mr-1" />
              <span className="text-sm">{participants.length + 1}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <ChatMessage 
            key={message.id} 
            message={message} 
            currentUserId={profile?.user_id}
            onReserveProduct={handleReserveProduct}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-white border-t border-gray-200 p-4">
        <form onSubmit={handleSendMessage} className="flex items-center space-x-3">
          {isSeller && (
            <button
              type="button"
              onClick={() => setShowProductModal(true)}
              className="bg-purple-600 text-white p-3 rounded-xl hover:bg-purple-700 transition-colors"
            >
              <Package className="h-5 w-5" />
            </button>
          )}
          
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              disabled={sending}
            />
          </div>
          
          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-3 rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="h-5 w-5" />
          </button>
        </form>
      </div>

      {/* Product Post Modal */}
      {showProductModal && (
        <ProductPostModal
          sessionId={sessionId}
          isOpen={showProductModal}
          onClose={() => setShowProductModal(false)}
          onProductPosted={handleProductPosted}
        />
      )}
    </div>
  )
}
