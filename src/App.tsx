import React, { useState, useEffect } from 'react'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { AuthWrapper } from './components/auth/AuthWrapper'
import { Header } from './components/layout/Header'
import { Navigation } from './components/layout/Navigation'
import { SessionsList } from './components/session/SessionsList'
import { LiveSessionChat } from './components/session/LiveSessionChat'
import { SellerDashboard } from './components/seller/SellerDashboard'
import { CreateSessionModal } from './components/seller/CreateSessionModal'
import './index.css'

function AppContent() {
  const { user, profile, loading } = useAuth()
  const [currentView, setCurrentView] = useState('sessions')
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)

  // Reset to sessions view when user changes
  useEffect(() => {
    if (!loading) {
      setCurrentView('sessions')
      setCurrentSessionId(null)
    }
  }, [user, loading])

  const handleJoinSession = (sessionId: number) => {
    setCurrentSessionId(sessionId)
    setCurrentView('chat')
  }

  const handleBackToSessions = () => {
    setCurrentSessionId(null)
    setCurrentView('sessions')
  }

  const handleCreateSession = () => {
    setShowCreateModal(true)
  }

  const handleSessionCreated = (sessionId: number) => {
    setShowCreateModal(false)
    handleJoinSession(sessionId)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  if (!user || !profile) {
    return <AuthWrapper />
  }

  // If in chat view, show full-screen chat
  if (currentView === 'chat' && currentSessionId) {
    return (
      <div className="h-screen bg-gray-50">
        <LiveSessionChat 
          sessionId={currentSessionId} 
          onBack={handleBackToSessions}
        />
        <Toaster position="top-center" />
      </div>
    )
  }

  const getHeaderProps = () => {
    switch (currentView) {
      case 'sessions':
        return {
          title: 'Live Sessions',
          subtitle: 'Join live shopping conversations'
        }
      case 'dashboard':
        return {
          title: 'Seller Dashboard',
          subtitle: 'Manage your live sessions'
        }
      case 'profile':
        return {
          title: 'Profile',
          subtitle: `${profile.full_name} • ${profile.role}`
        }
      default:
        return {
          title: 'LiveMarket',
          subtitle: 'Live shopping marketplace'
        }
    }
  }

  const renderCurrentView = () => {
    switch (currentView) {
      case 'sessions':
        return (
          <SessionsList 
            onJoinSession={handleJoinSession}
            onCreateSession={profile.role === 'seller' ? handleCreateSession : undefined}
          />
        )
      case 'dashboard':
        if (profile.role !== 'seller') {
          return (
            <div className="flex items-center justify-center py-12">
              <p className="text-gray-600">Only sellers can access the dashboard</p>
            </div>
          )
        }
        return (
          <SellerDashboard 
            onStartSession={handleCreateSession}
            onJoinSession={handleJoinSession}
          />
        )
      case 'profile':
        return (
          <div className="p-6">
            <div className="bg-white rounded-2xl p-6 border border-gray-200">
              <div className="flex items-center mb-6">
                <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full h-16 w-16 flex items-center justify-center font-bold text-xl mr-4">
                  {profile.full_name?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{profile.full_name}</h2>
                  <p className="text-gray-600">{profile.email}</p>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium mt-2 ${
                    profile.role === 'seller' 
                      ? 'bg-purple-100 text-purple-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {profile.role === 'seller' ? '🛍️ Seller' : '🛒 Buyer'}
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-xl">
                  <h3 className="font-semibold text-gray-900 mb-2">Account Type</h3>
                  <p className="text-gray-600">
                    {profile.role === 'seller' 
                      ? 'You can create live sessions and sell products'
                      : 'You can join sessions and buy products'}
                  </p>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-xl">
                  <h3 className="font-semibold text-gray-900 mb-2">Member Since</h3>
                  <p className="text-gray-600">
                    {new Date(profile.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header {...getHeaderProps()} />
      
      <main className="flex-1 overflow-hidden">
        {renderCurrentView()}
      </main>
      
      <Navigation 
        currentView={currentView} 
        onViewChange={setCurrentView}
      />
      
      {/* Create Session Modal */}
      <CreateSessionModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSessionCreated={handleSessionCreated}
      />
      
      <Toaster position="top-center" />
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App
