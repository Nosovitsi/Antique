import React from 'react'
import { SessionMessage, Product } from '../../lib/supabase'
import { Tag, Clock, DollarSign } from 'lucide-react'
import { motion } from 'framer-motion'

interface ChatMessageProps {
  message: SessionMessage & { sender_name: string, product?: Product }
  currentUserId?: string
  onReserveProduct?: (productId: number) => void
}

export function ChatMessage({ message, currentUserId, onReserveProduct }: ChatMessageProps) {
  const isOwnMessage = message.sender_id === currentUserId
  const isProductMessage = message.message_type === 'product'

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'reserved':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'sold':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
    >
      <div className={`max-w-xs lg:max-w-md ${isOwnMessage ? 'order-2' : 'order-1'}`}>
        {/* Sender Name */}
        {!isOwnMessage && (
          <p className="text-xs text-gray-600 mb-1 px-3">{message.sender_name}</p>
        )}
        
        {/* Message Content */}
        <div
          className={`rounded-2xl px-4 py-3 ${
            isOwnMessage
              ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
              : 'bg-white border border-gray-200 text-gray-900'
          }`}
        >
          {isProductMessage && message.product ? (
            <div className="space-y-3">
              {/* Product Image */}
              {message.product.image_url && (
                <div className="rounded-xl overflow-hidden">
                  <img
                    src={message.product.image_url}
                    alt={message.product.name}
                    className="w-full h-32 object-cover"
                  />
                </div>
              )}
              
              {/* Product Info */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold">{message.product.name}</h4>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium border ${
                    isOwnMessage 
                      ? 'bg-white/20 text-white border-white/30'
                      : getStatusColor(message.product.status)
                  }`}>
                    {message.product.status}
                  </div>
                </div>
                
                {message.product.description && (
                  <p className={`text-sm mb-2 ${
                    isOwnMessage ? 'text-purple-100' : 'text-gray-600'
                  }`}>
                    {message.product.description}
                  </p>
                )}
                
                <div className="flex items-center justify-between">
                  <div className={`flex items-center ${
                    isOwnMessage ? 'text-white' : 'text-purple-600'
                  }`}>
                    <DollarSign className="h-4 w-4 mr-1" />
                    <span className="font-bold text-lg">${message.product.price}</span>
                  </div>
                  
                  {!isOwnMessage && message.product.status === 'available' && onReserveProduct && (
                    <button 
                      onClick={() => onReserveProduct(message.product!.id)}
                      className="bg-purple-600 text-white px-3 py-1 rounded-full text-xs font-medium hover:bg-purple-700 transition-colors"
                    >
                      Reserve
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <p>{message.content}</p>
          )}
        </div>
        
        {/* Timestamp */}
        <p className={`text-xs text-gray-500 mt-1 px-3 ${
          isOwnMessage ? 'text-right' : 'text-left'
        }`}>
          {formatTime(message.created_at)}
        </p>
      </div>
    </motion.div>
  )
}
