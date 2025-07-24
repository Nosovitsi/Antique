import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
})

// Types for our database tables
export interface Profile {
  id: string
  user_id: string
  email: string
  full_name: string | null
  role: 'seller' | 'buyer'
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface LiveSession {
  id: number
  seller_id: string
  title: string | null
  status: 'active' | 'ended'
  created_at: string
  ended_at: string | null
}

export interface Product {
  id: number
  session_id: number
  seller_id: string
  name: string
  description: string | null
  price: number
  image_url: string | null
  status: 'available' | 'reserved' | 'sold'
  created_at: string
  updated_at: string
}

export interface SessionMessage {
  id: number
  session_id: number
  sender_id: string
  message_type: 'text' | 'product'
  content: string | null
  product_id: number | null
  created_at: string
}

export interface Reservation {
  id: number
  product_id: number
  buyer_id: string
  seller_id: string
  status: 'active' | 'completed' | 'cancelled'
  created_at: string
  updated_at: string
}
