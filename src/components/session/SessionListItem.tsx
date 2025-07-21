import React from 'react'
import { LiveSession } from '../../lib/supabase'
import { Circle, Users, Clock, Package, MessageSquare } from 'lucide-react'
import { motion } from 'framer-motion'

interface SessionListItemProps {
  session: LiveSession & {
    seller_name: string
    participant_count: number
    last_message?: {
      content: string | null
      message_type: string
      created_at: string
      product_name?: string
    }
  }
  onClick: () => void
}

export function SessionListItem({ session, onClick }: SessionListItemProps) {
  const isActive = session.status === 'active'
  
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) {
      return 'now'
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes}m`
    } else if (diffInMinutes < 1440) { // 24 hours
      return `${Math.floor(diffInMinutes / 60)}h`
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      })
    }
  }

  const getLastMessagePreview = () => {
    if (!session.last_message) {
      return 'No messages yet'
    }
    
    if (session.last_message.message_type === 'product') {
      return `📦 ${session.last_message.product_name || 'New product posted'}`
    }
    
    return session.last_message.content || 'Message'
  }

  const getLastActivity = () => {
    if (session.last_message) {
      return formatTime(session.last_message.created_at)
    }
    return formatTime(session.created_at)
  }

  return (
    <motion.div
      whileHover={{ backgroundColor: '#f9fafb' }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="flex items-center p-4 hover:bg-gray-50 cursor-pointer transition-colors active:bg-gray-100"
    >
      {/* Status Indicator & Avatar */}
      <div className="relative flex-shrink-0 mr-4">
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full h-12 w-12 flex items-center justify-center font-semibold text-lg">
          {session.seller_name.charAt(0).toUpperCase()}
        </div>
        
        {/* Status Dot */}
        <div className={`absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-white ${
          isActive ? 'bg-green-500' : 'bg-gray-400'
        }`}>
          {isActive && (
            <div className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-75"></div>
          )}
        </div>
      </div>

      {/* Session Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-semibold text-gray-900 truncate">
            {session.title || `${session.seller_name}'s Session`}
          </h3>
          <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
            {getLastActivity()}
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center text-sm text-gray-600">
            <span className="font-medium">{session.seller_name}</span>
            {isActive && (
              <>
                <span className="mx-2">•</span>
                <span className="text-green-600 font-medium">Live</span>
              </>
            )}
          </div>
          
          {session.participant_count > 0 && (
            <div className="flex items-center text-xs text-gray-500">
              <Users className="h-3 w-3 mr-1" />
              <span>{session.participant_count}</span>
            </div>
          )}
        </div>
        
        {/* Last Message Preview */}
        <p className="text-sm text-gray-600 truncate mt-1">
          {getLastMessagePreview()}
        </p>
      </div>

      {/* Status Badge */}
      <div className="flex-shrink-0 ml-3">
        {isActive ? (
          <div className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium flex items-center">
            <Circle className="h-2 w-2 mr-1 fill-current" />
            Live
          </div>
        ) : (
          <div className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs font-medium">
            Ended
          </div>
        )}
      </div>
    </motion.div>
  )
}
