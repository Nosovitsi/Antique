import React, { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { Radio, Plus, Clock, Users, Package } from 'lucide-react'
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

interface SellerDashboardProps {
  onStartSession: () => void
  onJoinSession: (sessionId: number) => void
}

export function SellerDashboard({ onStartSession, onJoinSession }: SellerDashboardProps) {
  const { profile } = useAuth()
  const [activeSession, setActiveSession] = useState<LiveSession | null>(null)
  const [recentSessions, setRecentSessions] = useState<LiveSession[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalSales: 0,
    activeReservations: 0
  })

  useEffect(() => {
    loadDashboardData()
  }, [profile]) // Add profile to dependency array

  async function loadDashboardData() {
    if (!profile) return
    
    try {
      setLoading(true)
      
      // Load active session
      const activeSessionsResponse = await fetch(`${API_BASE_URL}/live_sessions?seller_id=${profile.user_id}&status=active&limit=1&order_by=created_at&order_direction=desc`)
      if (!activeSessionsResponse.ok) throw new Error('Failed to fetch active sessions')
      const activeSessions: LiveSession[] = await activeSessionsResponse.json()
      
      if (activeSessions && activeSessions.length > 0) {
        setActiveSession(activeSessions[0])
      }
      
      // Load recent sessions
      const recentSessionsResponse = await fetch(`${API_BASE_URL}/live_sessions?seller_id=${profile.user_id}&limit=5&order_by=created_at&order_direction=desc`)
      if (!recentSessionsResponse.ok) throw new Error('Failed to fetch recent sessions')
      const sessions: LiveSession[] = await recentSessionsResponse.json()
      
      if (sessions) {
        setRecentSessions(sessions)
      }
      
      // Load stats (These will still use Supabase directly for now, or require new backend endpoints)
      // For now, we'll mock these or keep them as is if they are not critical for the immediate migration
      // You would create new backend endpoints for these if needed.
      
    } catch (error: any) {
      console.error('Error loading dashboard data:', error)
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  async function handleEndSession() {
    if (!activeSession) return
    
    try {
      const response = await fetch(`${API_BASE_URL}/live_sessions/end/${activeSession.id}`, {
        method: 'POST',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to end session')
      }
      
      setActiveSession(null) // Immediately clear active session state
      toast.success('Session ended successfully!')
      await loadDashboardData()
    } catch (error: any) {
      console.error('Error ending session:', error)
      toast.error(error.message || 'Failed to end session')
    }
  }

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.totalProducts}</p>
              <p className="text-sm text-gray-600">Products</p>
            </div>
            <Package className="h-8 w-8 text-purple-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.activeReservations}</p>
              <p className="text-sm text-gray-600">Reservations</p>
            </div>
            <Users className="h-8 w-8 text-green-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-gray-900">${stats.totalSales}</p>
              <p className="text-sm text-gray-600">Sales</p>
            </div>
            <Radio className="h-8 w-8 text-blue-600" />
          </div>
        </div>
      </div>

      {/* Active Session or Go Live Button */}
      {activeSession ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-6 text-white"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div className="bg-white/20 p-2 rounded-full mr-3">
                <Radio className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">You're Live!</h3>
                <p className="text-green-100 text-sm">
                  Started {formatDate(activeSession.created_at)}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="bg-red-500 h-3 w-3 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium">LIVE</span>
            </div>
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={() => onJoinSession(activeSession.id)}
              className="flex-1 bg-white/20 backdrop-blur-sm text-white py-3 rounded-xl font-medium hover:bg-white/30 transition-all"
            >
              Manage Session
            </button>
            <button
              onClick={handleEndSession}
              className="bg-red-500/20 backdrop-blur-sm text-white py-3 px-6 rounded-xl font-medium hover:bg-red-500/30 transition-all"
            >
              End Session
            </button>
          </div>
        </motion.div>
      ) : (
        <motion.button
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onStartSession}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white p-8 rounded-2xl font-semibold text-xl hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg"
        >
          <div className="flex items-center justify-center mb-2">
            <Plus className="h-8 w-8 mr-3" />
            <span>Go Live</span>
          </div>
          <p className="text-purple-100 text-sm font-normal">
            Start a live session to showcase and sell your products
          </p>
        </motion.button>
      )}

      {/* Recent Sessions */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
          <Clock className="h-5 w-5 mr-2" />
          Recent Sessions
        </h3>
        
        {recentSessions.length > 0 ? (
          <div className="space-y-3">
            {recentSessions.map((session) => (
              <div
                key={session.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"
              >
                <div className="flex items-center">
                  <div className={`h-3 w-3 rounded-full mr-3 ${
                    session.status === 'active' ? 'bg-green-500' : 'bg-gray-400'
                  }`}></div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {session.title || `Session #${session.id}`}
                    </p>
                    <p className="text-sm text-gray-600">
                      {formatDate(session.created_at)}
                    </p>
                  </div>
                </div>
                
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  session.status === 'active' 
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {session.status}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-600 text-center py-4">
            No sessions yet. Start your first live session!
          </p>
        )}
      </div>
    </div>
  )
}
