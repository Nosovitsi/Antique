import React from 'react'
import { Product } from '../../lib/supabase'
import { MessageCircle, Tag, User, Clock } from 'lucide-react'
import { motion } from 'framer-motion'

interface ProductCardProps {
  product: Product & { seller_name: string }
  onJoinSession: () => void
  onReserve: () => void
  showReserveButton: boolean
}

export function ProductCard({ product, onJoinSession, onReserve, showReserveButton }: ProductCardProps) {
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

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) {
      return 'Just now'
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`
    } else {
      return date.toLocaleDateString()
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 hover:shadow-xl transition-all"
    >
      {/* Product Image */}
      <div className="relative aspect-square overflow-hidden">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
            <Tag className="h-12 w-12 text-white" />
          </div>
        )}
        
        {/* Status Badge */}
        <div className={`absolute top-3 left-3 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(product.status)}`}>
          {product.status.charAt(0).toUpperCase() + product.status.slice(1)}
        </div>
        
        {/* Price Badge */}
        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full">
          <span className="text-lg font-bold text-gray-900">${product.price}</span>
        </div>
      </div>
      
      {/* Product Info */}
      <div className="p-4 space-y-3">
        <div>
          <h3 className="font-semibold text-gray-900 line-clamp-1">{product.name}</h3>
          {product.description && (
            <p className="text-gray-600 text-sm line-clamp-2 mt-1">{product.description}</p>
          )}
        </div>
        
        {/* Seller Info */}
        <div className="flex items-center text-sm text-gray-600">
          <User className="h-4 w-4 mr-1" />
          <span className="font-medium">{product.seller_name}</span>
          <Clock className="h-4 w-4 ml-3 mr-1" />
          <span>{formatTime(product.created_at)}</span>
        </div>
        
        {/* Action Buttons */}
        <div className="flex space-x-2 pt-2">
          <button
            onClick={onJoinSession}
            className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-2 px-4 rounded-xl font-medium hover:from-purple-700 hover:to-pink-700 transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center"
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            Join Chat
          </button>
          
          {showReserveButton && (
            <button
              onClick={onReserve}
              className="bg-white border-2 border-purple-200 text-purple-600 py-2 px-4 rounded-xl font-medium hover:bg-purple-50 hover:border-purple-300 transition-all transform hover:scale-105 active:scale-95"
            >
              Reserve
            </button>
          )}
        </div>
      </div>
    </motion.div>
  )
}
