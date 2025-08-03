import { supabase } from '../../lib/supabase'
import React, { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { Send, Image, ArrowLeft, Users, Package, Circle } from 'lucide-react'
import { ProductPostModal } from './ProductPostModal'
import { ChatMessage } from './ChatMessage'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'

const API_BASE_URL = 'http://127.0.0.1:5174' // Your Python backend URL

interface SessionMessage {
  id: number
  session_id: number
  sender_id: string
  message_type: 'text' | 'product'
  content: string | null
  product_id: number | null
  created_at: string
}

interface Product {
  id: number
  session_id: number
  seller_id: string
  name: string
  description: string | null
  price: number
  image_url: string | null
  status: 'available' | 'reserved' | 'sold'
  created_at: string
  updated_at: string
}

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
      const sessionResponse = await fetch(`${API_BASE_URL}/live_sessions?id=${sessionId}`)
      if (!sessionResponse.ok) throw new Error('Failed to fetch session')
      const sessionData = await sessionResponse.json()
      const session = sessionData[0] // Assuming it returns an array
      
      if (!session) {
        setSessionInfo(null)
        return
      }
      
      // Step 2: If session exists, fetch seller's profile separately
      const profileResponse = await fetch(`${API_BASE_URL}/auth/profile/${session.seller_id}`)
      if (!profileResponse.ok) throw new Error('Failed to fetch profile')
      const profileData = await profileResponse.json()

      // Step 3: Combine session data with seller's name
      setSessionInfo({
        ...session,
        seller_name: profileData?.full_name || 'Unknown'
      })
      
      // Load messages
      const messagesResponse = await fetch(`${API_BASE_URL}/messages/${sessionId}`)
      if (!messagesResponse.ok) throw new Error('Failed to fetch messages')
      const messagesData: SessionMessage[] = await messagesResponse.json()
      
      // Get sender names and product data
      if (messagesData && messagesData.length > 0) {
        const senderIds = [...new Set(messagesData.map(m => m.sender_id))]
        const productIds = messagesData.filter(m => m.product_id).map(m => m.product_id)
        
        const profilesPromises = senderIds.map(id => fetch(`${API_BASE_URL}/auth/profile/${id}`).then(res => res.json()))
        const productsPromises = productIds.length > 0 ? productIds.map(id => fetch(`${API_BASE_URL}/products?id=${id}`).then(res => res.json())) : []
        
        const [profilesRes, productsRes] = await Promise.all([
          Promise.all(profilesPromises),
          Promise.all(productsPromises)
        ])
        
        const messagesWithData = messagesData.map(message => ({
          ...message,
          sender_name: profilesRes.find(p => p.user_id === message.sender_id)?.full_name || 'Unknown',
          product: message.product_id ? productsRes.find((p: Product[]) => p[0].id === message.product_id)?.[0] : undefined
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
    const channel = supabase.channel(`session-chat-${sessionId}`)

    channel
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'session_messages', filter: `session_id=eq.${sessionId}` },
        (payload) => {
          console.log('New message received:', payload)
          loadSessionData() // Reload all data for simplicity
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'products' },
        (payload) => {
          console.log('Product updated:', payload)
          loadSessionData() // Reload all data for simplicity
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault()
    
    if (!newMessage.trim() || !profile) return
    
    setSending(true)
    
    try {
      const response = await fetch(`${API_BASE_URL}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: sessionId,
          sender_id: profile.user_id,
          message_type: 'text',
          content: newMessage.trim()
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to send message')
      }
      
      setNewMessage('')
    } catch (error: any) {
      console.error('Error sending message:', error)
      toast.error(error.message || 'Failed to send message')
    } finally {
      setSending(false)
    }
  }

  async function handleProductPosted(productId: number) {
    try {
      const response = await fetch(`${API_BASE_URL}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: sessionId,
          sender_id: profile!.user_id,
          message_type: 'product',
          content: 'Posted a new product',
          product_id: productId
        }),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to announce product')
      }

      // Reload session data to get the new product message
      await loadSessionData()
    } catch (error: any) {
      console.error('Error posting product message:', error)
      toast.error(error.message || 'Failed to announce product')
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
      const productResponse = await fetch(`${API_BASE_URL}/products?id=${productId}`)
      if (!productResponse.ok) throw new Error('Failed to fetch product')
      const productData = await productResponse.json()
      const product = productData[0] // Assuming it returns an array

      if (!product) {
        toast.error('Product not found')
        return
      }

      if (product.status !== 'available') {
        toast.error('Product is no longer available')
        return
      }

      // Create reservation
      const reservationResponse = await fetch(`${API_BASE_URL}/reservations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          product_id: productId,
          buyer_id: profile.user_id,
          seller_id: product.seller_id,
          status: 'active'
        }),
      })

      if (!reservationResponse.ok) {
        const errorData = await reservationResponse.json()
        throw new Error(errorData.error || 'Failed to create reservation')
      }

      // Update product status
      const updateStatusResponse = await fetch(`${API_BASE_URL}/products/status/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'reserved' }),
      })

      if (!updateStatusResponse.ok) {
        const errorData = await updateStatusResponse.json()
        throw new Error(errorData.error || 'Failed to update product status')
      }

      // Send chat message about the reservation
      const messageResponse = await fetch(`${API_BASE_URL}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: sessionId,
          sender_id: profile.user_id,
          message_type: 'text',
          content: `Reserved "${product.name}" for ${product.price}`
        }),
      })

      if (!messageResponse.ok) {
        console.error('Error sending reservation message:', await messageResponse.json())
      }

      toast.success('Product reserved successfully!')
    } catch (error: any) {
      console.error('Error reserving product:', error)
      toast.error(error.message || 'Failed to reserve product')
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
