import React from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { ShoppingBag, Bell } from 'lucide-react'

interface HeaderProps {
  title: string
  subtitle?: string
  action?: React.ReactNode
}

export function Header({ title, subtitle, action }: HeaderProps) {
  const { profile } = useAuth()

  return (
    <header className="bg-white border-b border-gray-200 px-4 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-2 rounded-xl mr-3">
            <ShoppingBag className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{title}</h1>
            {subtitle && (
              <p className="text-sm text-gray-600">{subtitle}</p>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          {action}
          
          <button className="relative p-2 text-gray-600 hover:text-purple-600 transition-colors">
            <Bell className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
              3
            </span>
          </button>
          
          <div className="flex items-center">
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full h-8 w-8 flex items-center justify-center font-semibold text-sm">
              {profile?.full_name?.charAt(0)?.toUpperCase() || '?'}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
