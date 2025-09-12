'use client'

import { useState } from 'react'
import { HeartIcon, ShoppingCartIcon } from '@heroicons/react/24/outline'
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import ProductCard from '@/components/ProductCard'
import { featuredProducts } from '@/lib/data'
import { useCartStore } from '@/store/cart'

export default function WishlistPage() {
  // Mock wishlist items (in a real app, this would come from a wishlist store)
  const [wishlistItems, setWishlistItems] = useState(featuredProducts.slice(0, 2))
  const { addItem } = useCartStore()

  const removeFromWishlist = (productId: string) => {
    setWishlistItems(prev => prev.filter(item => item.id !== productId))
  }

  const addAllToCart = () => {
    wishlistItems.forEach(item => {
      addItem(item)
    })
  }

  if (wishlistItems.length === 0) {
    return (
      <>
        <Navbar />
        
        <main className="min-h-screen bg-gray-50 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">My Wishlist</h1>
            
            <div className="text-center py-12">
              <HeartIcon className="h-24 w-24 text-gray-300 mx-auto mb-6" />
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Your wishlist is empty</h2>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                Save items you love for later by clicking the heart icon on any product.
              </p>
              <a href="/products" className="btn-primary">
                Start Shopping
              </a>
            </div>
          </div>
        </main>
        
        <Footer />
      </>
    )
  }

  return (
    <>
      <Navbar />
      
      <main className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">My Wishlist</h1>
              <p className="text-gray-600">{wishlistItems.length} item{wishlistItems.length !== 1 ? 's' : ''} saved</p>
            </div>
            
            {wishlistItems.length > 0 && (
              <button
                onClick={addAllToCart}
                className="btn-primary flex items-center"
              >
                <ShoppingCartIcon className="h-5 w-5 mr-2" />
                Add All to Cart
              </button>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {wishlistItems.map((product) => (
                <div key={product.id} className="relative">
                  <ProductCard product={product} />
                  <button
                    onClick={() => removeFromWishlist(product.id)}
                    className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors z-10"
                  >
                    <HeartIconSolid className="h-5 w-5 text-red-500" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">You might also like</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredProducts.slice(2, 6).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </>
  )
}