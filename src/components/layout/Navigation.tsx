import React from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { ShoppingBag, Home, Radio, User, LogOut, Plus } from 'lucide-react'

interface NavigationProps {
  currentView: string
  onViewChange: (view: string) => void
}

export function Navigation({ currentView, onViewChange }: NavigationProps) {
  const { profile, signOut } = useAuth()

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  const navItems = [
    { id: 'sessions', icon: Home, label: 'Sessions', roles: ['buyer', 'seller'] },
    { id: 'dashboard', icon: Plus, label: 'Sell', roles: ['seller'] },
    { id: 'profile', icon: User, label: 'Profile', roles: ['buyer', 'seller'] }
  ]

  const visibleItems = navItems.filter(item => 
    item.roles.includes(profile?.role || 'buyer')
  )

  return (
    <nav className="bg-white border-t border-gray-200 px-4 py-2">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {visibleItems.map((item) => {
          const Icon = item.icon
          const isActive = currentView === item.id
          
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`flex flex-col items-center py-2 px-4 rounded-xl transition-all ${
                isActive
                  ? 'text-purple-600 bg-purple-50'
                  : 'text-gray-600 hover:text-purple-600 hover:bg-purple-50'
              }`}
            >
              <Icon className="h-5 w-5 mb-1" />
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          )
        })}
        
        <button
          onClick={handleSignOut}
          className="flex flex-col items-center py-2 px-4 rounded-xl text-gray-600 hover:text-red-600 hover:bg-red-50 transition-all"
        >
          <LogOut className="h-5 w-5 mb-1" />
          <span className="text-xs font-medium">Logout</span>
        </button>
      </div>
    </nav>
  )
}
