import React, { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import toast from 'react-hot-toast'

const API_BASE_URL = 'http://127.0.0.1:5174' // Your Python backend URL

interface Profile {
  id: string
  user_id: string
  email: string
  full_name: string | null
  role: 'seller' | 'buyer'
  avatar_url: string | null
  created_at: string
  updated_at: string
}

interface AuthContextType {
  user: User | null
  profile: Profile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, fullName: string, role: 'seller' | 'buyer') => Promise<void>
  signOut: () => Promise<void>
  updateProfile: (updates: Partial<Profile>) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser)
      setUser(parsedUser)
      loadProfile(parsedUser.id)
    }
    setLoading(false)
  }, [])

  async function loadProfile(userId: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/profile/${userId}`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data: Profile = await response.json()
      setProfile(data)
    } catch (error: any) {
      console.error('Error loading profile:', error)
    }
  }

  async function signIn(email: string, password: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to sign in')
      }

      const userData = await response.json()
      // Store user data in localStorage
      localStorage.setItem('user', JSON.stringify(userData))
      setUser(userData as User)
      await loadProfile(userData.id) // Load profile after successful login
      toast.success('Signed in successfully!')
    } catch (error: any) {
      toast.error(error.message)
      throw error
    }
  }

  async function signUp(email: string, password: string, fullName: string, role: 'seller' | 'buyer') {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, full_name: fullName, role }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to sign up')
      }

      const userData = await response.json()
      // Store user data in localStorage
      localStorage.setItem('user', JSON.stringify(userData))
      setUser(userData as User)
      await loadProfile(userData.id)
      toast.success('Account created successfully!')
    } catch (error: any) {
      console.error('Signup error:', error)
      toast.error(error.message || 'Failed to create account')
      throw error
    }
  }

  async function signOut() {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to sign out')
      }

      // Clear user data from localStorage
      localStorage.removeItem('user')
      setUser(null)
      setProfile(null)
      toast.success('Signed out successfully!')
    } catch (error: any) {
      toast.error(error.message)
      throw error
    }
  }

  async function updateProfile(updates: Partial<Profile>) {
    if (!user) throw new Error('No user logged in')

    try {
      const response = await fetch(`${API_BASE_URL}/auth/profile/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update profile')
      }

      const updatedProfile = await response.json()
      setProfile(updatedProfile)
      toast.success('Profile updated successfully!')
    } catch (error: any) {
      toast.error(error.message)
      throw error
    }
  }

  const value = {
    user,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    updateProfile
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
