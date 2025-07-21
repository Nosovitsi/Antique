import React, { useState, useEffect } from 'react'
import { supabase, Product } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { ProductCard } from './ProductCard'
import { Search, Filter, Sparkles } from 'lucide-react'
import toast from 'react-hot-toast'

interface GlobalFeedProps {
  onJoinSession: (sessionId: number) => void
}

export function GlobalFeed({ onJoinSession }: GlobalFeedProps) {
  const { profile } = useAuth()
  const [products, setProducts] = useState<(Product & { seller_name: string })[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState<'all' | 'available' | 'reserved'>('all')

  useEffect(() => {
    loadProducts()
    setupRealTimeSubscription()
  }, [])

  async function loadProducts() {
    try {
      setLoading(true)
      
      // Get products from active sessions only
      const { data: products, error } = await supabase
        .from('products')
        .select(`
          *,
          live_sessions!inner(status)
        `)
        .eq('live_sessions.status', 'active')
        .order('created_at', { ascending: false })

      if (error) throw error

      // Get seller names
      if (products && products.length > 0) {
        const sellerIds = [...new Set(products.map(p => p.seller_id))]
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, full_name')
          .in('user_id', sellerIds)

        const productsWithSellers = products.map(product => ({
          ...product,
          seller_name: profiles?.find(p => p.user_id === product.seller_id)?.full_name || 'Unknown Seller'
        }))

        setProducts(productsWithSellers)
      } else {
        setProducts([])
      }
    } catch (error: any) {
      console.error('Error loading products:', error)
      toast.error('Failed to load products')
    } finally {
      setLoading(false)
    }
  }

  function setupRealTimeSubscription() {
    // Listen for new products
    const productSubscription = supabase
      .channel('products_feed')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'products'
        },
        async (payload) => {
          console.log('Product change:', payload)
          await loadProducts() // Reload to get updated data
        }
      )
      .subscribe()

    // Listen for session status changes
    const sessionSubscription = supabase
      .channel('sessions_feed')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'live_sessions'
        },
        async (payload) => {
          console.log('Session change:', payload)
          await loadProducts() // Reload to filter out ended sessions
        }
      )
      .subscribe()

    return () => {
      productSubscription.unsubscribe()
      sessionSubscription.unsubscribe()
    }
  }

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.seller_name.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesFilter = filter === 'all' || product.status === filter
    
    return matchesSearch && matchesFilter
  })

  async function handleReserveProduct(productId: number) {
    if (!profile) {
      toast.error('Please sign in to reserve products')
      return
    }

    if (profile.role !== 'buyer') {
      toast.error('Only buyers can reserve products')
      return
    }

    try {
      const product = products.find(p => p.id === productId)
      if (!product) return

      // Create reservation
      const { error: reservationError } = await supabase
        .from('reservations')
        .insert({
          product_id: productId,
          buyer_id: profile.user_id,
          seller_id: product.seller_id,
          status: 'active'
        })

      if (reservationError) throw reservationError

      // Update product status
      const { error: updateError } = await supabase
        .from('products')
        .update({ status: 'reserved' })
        .eq('id', productId)

      if (updateError) throw updateError

      toast.success('Product reserved successfully!')
    } catch (error: any) {
      console.error('Error reserving product:', error)
      toast.error('Failed to reserve product')
    }
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
      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Search products, sellers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>
        
        <div className="flex items-center space-x-2 overflow-x-auto pb-2">
          <Filter className="h-5 w-5 text-gray-400 flex-shrink-0" />
          {['all', 'available', 'reserved'].map((filterOption) => (
            <button
              key={filterOption}
              onClick={() => setFilter(filterOption as any)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                filter === filterOption
                  ? 'bg-purple-100 text-purple-700 border-2 border-purple-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Products Grid */}
      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onJoinSession={() => onJoinSession(product.session_id)}
              onReserve={() => handleReserveProduct(product.id)}
              showReserveButton={profile?.role === 'buyer' && product.status === 'available'}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Sparkles className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm || filter !== 'all' ? 'No products found' : 'No live sessions yet'}
          </h3>
          <p className="text-gray-600">
            {searchTerm || filter !== 'all'
              ? 'Try adjusting your search or filters'
              : 'Be the first to start a live shopping session!'}
          </p>
        </div>
      )}
    </div>
  )
}
