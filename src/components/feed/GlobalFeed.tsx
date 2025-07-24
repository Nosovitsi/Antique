import React, { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { ProductCard } from './ProductCard'
import { Search, Filter, Sparkles } from 'lucide-react'
import toast from 'react-hot-toast'

const API_BASE_URL = 'http://127.0.0.1:5174' // Your Python backend URL

interface Product {
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
    // Real-time subscriptions will be handled later with WebSockets
  }, [])

  async function loadProducts() {
    try {
      setLoading(true)
      
      // Get products from active sessions only
      const productsResponse = await fetch(`${API_BASE_URL}/products`)
      if (!productsResponse.ok) throw new Error('Failed to fetch products')
      const productsData: Product[] = await productsResponse.json()

      // Filter products by active sessions (this logic might need to be moved to backend)
      // For now, we'll assume backend returns only products from active sessions or handle filtering here
      const activeProducts = productsData // Placeholder for now

      // Get seller names
      if (activeProducts && activeProducts.length > 0) {
        const sellerIds = [...new Set(activeProducts.map(p => p.seller_id))]
        const profilesPromises = sellerIds.map(id => fetch(`${API_BASE_URL}/auth/profile/${id}`).then(res => res.json()))
        const profiles = await Promise.all(profilesPromises)

        const productsWithSellers = activeProducts.map(product => ({
          ...product,
          seller_name: profiles.find(p => p.user_id === product.seller_id)?.full_name || 'Unknown Seller'
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

  // function setupRealTimeSubscription() {
  //   // This will be implemented later with WebSockets
  //   return () => {}
  // }

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
      const reservationResponse = await fetch(`${API_BASE_URL}/reservations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          product_id: productId,
          buyer_id: profile.user_id,
          seller_id: product.seller_id,
          status: 'active'
        }),
      })

      if (!reservationResponse.ok) {
        const errorData = await reservationResponse.json()
        throw new Error(errorData.error || 'Failed to create reservation')
      }

      // Update product status
      const updateStatusResponse = await fetch(`${API_BASE_URL}/products/status/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'reserved' }),
      })

      if (!updateStatusResponse.ok) {
        const errorData = await updateStatusResponse.json()
        throw new Error(errorData.error || 'Failed to update product status')
      }

      toast.success('Product reserved successfully!')
      loadProducts() // Reload products to reflect status change
    } catch (error: any) {
      console.error('Error reserving product:', error)
      toast.error(error.message || 'Failed to reserve product')
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
