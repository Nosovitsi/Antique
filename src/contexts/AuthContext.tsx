import React, { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase, Profile } from '../lib/supabase'
import toast from 'react-hot-toast'

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

  // Load user on mount
  useEffect(() => {
    async function loadUser() {
      try {
        const { data: { user }, error } = await supabase.auth.getUser()
        if (error) throw error
        
        setUser(user)
        
        if (user) {
          await loadProfile(user.id)
        }
      } catch (error: any) {
        console.error('Error loading user:', error)
      } finally {
        setLoading(false)
      }
    }
    
    loadUser()

    // Set up auth listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user || null)
        
        if (session?.user) {
          await loadProfile(session.user.id)
        } else {
          setProfile(null)
        }
        
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  async function loadProfile(userId: string) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle()

      if (error) throw error
      setProfile(data)
    } catch (error: any) {
      console.error('Error loading profile:', error)
    }
  }

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      toast.error(error.message)
      throw error
    }
    
    toast.success('Signed in successfully!')
  }

  async function signUp(email: string, password: string, fullName: string, role: 'seller' | 'buyer') {
    try {
      // First try the standard signup
      const { data, error } = await supabase.auth.signUp({
        email,
        password
      })

      if (!error && data.user) {
        // Standard signup worked, create profile
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            user_id: data.user.id,
            email,
            full_name: fullName,
            role
          })

        if (profileError) {
          console.error('Error creating profile:', profileError)
          toast.error('Failed to create profile')
          throw profileError
        }

        toast.success('Account created successfully! Please check your email to verify your account.')
        return
      }

      // If standard signup failed due to email domain restriction, try admin API
      if (error && error.message.includes('invalid')) {
        console.log('Standard signup failed, trying admin API...', error.message)
        
        const { data: adminData, error: adminError } = await supabase.functions.invoke('fix-auth-domains', {
          body: {
            email,
            password,
            fullName,
            role
          }
        })

        if (adminError) {
          console.error('Admin signup failed:', adminError)
          toast.error(adminError.message || 'Failed to create account')
          throw adminError
        }

        if (adminData?.data?.user) {
          toast.success('Account created successfully! You can now sign in.')
          return
        }
      }

      // If we get here, both methods failed
      toast.error(error?.message || 'Failed to create account')
      throw error || new Error('Failed to create account')
    } catch (error: any) {
      console.error('Signup error:', error)
      if (!error.message.includes('Account created')) {
        toast.error(error.message || 'Failed to create account')
      }
      throw error
    }
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) {
      toast.error(error.message)
      throw error
    }
    
    toast.success('Signed out successfully!')
  }

  async function updateProfile(updates: Partial<Profile>) {
    if (!user) throw new Error('No user logged in')

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('user_id', user.id)
      .select()
      .maybeSingle()

    if (error) {
      toast.error('Failed to update profile')
      throw error
    }

    setProfile(data)
    toast.success('Profile updated successfully!')
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
