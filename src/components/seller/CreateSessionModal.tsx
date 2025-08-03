import React, { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { X, Radio } from 'lucide-react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'

const API_BASE_URL = 'http://127.0.0.1:5174' // Your Python backend URL

interface LiveSession {
  id: number
  seller_id: string
  title: string | null
  status: 'active' | 'ended'
  created_at: string
  ended_at: string | null
}

interface CreateSessionModalProps {
  isOpen: boolean
  onClose: () => void
  onSessionCreated: (session: LiveSession) => void
}

export function CreateSessionModal({ isOpen, onClose, onSessionCreated }: CreateSessionModalProps) {
  const { profile } = useAuth()
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if (!profile) {
      toast.error('Please sign in to create a session')
      return
    }

    setLoading(true)
    
    try {
      const sessionData = {
        seller_id: profile.user_id,
        title: title.trim() || `${profile.full_name}'s Live Session`,
        status: 'active'
      }

      const response = await fetch(`${API_BASE_URL}/live_sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sessionData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create session')
      }

      const data = await response.json()

      toast.success('Live session created successfully!')
      onSessionCreated(data)
      onClose()
    } catch (error: any) {
      console.error('Error creating session:', error)
      toast.error(error.message || 'Failed to create session')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl p-6 w-full max-w-md"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 flex items-center">
            <Radio className="h-6 w-6 mr-2 text-purple-600" />
            Go Live
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Session Title (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g., Fashion Flash Sale, Tech Gadgets Live"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              maxLength={100}
            />
            <p className="text-xs text-gray-500 mt-1">
              Leave empty to use your name as the session title
            </p>
          </div>

          <div className="bg-purple-50 p-4 rounded-xl">
            <h3 className="font-medium text-purple-900 mb-2">Ready to go live?</h3>
            <ul className="text-sm text-purple-800 space-y-1">
              <li>• Share products with photos and prices</li>
              <li>• Chat with interested buyers in real-time</li>
              <li>• Manage reservations instantly</li>
            </ul>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-xl font-medium hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Starting...' : 'Start Live Session'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}
