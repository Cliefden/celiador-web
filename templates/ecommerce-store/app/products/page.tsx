'use client'

import { useState, useMemo } from 'react'
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import ProductCard from '@/components/ProductCard'
import ProductFilters from '@/components/ProductFilters'
import { featuredProducts } from '@/lib/data'
import { Product } from '@/types'

interface FilterOptions {
  category: string
  priceRange: [number, number]
  sortBy: string
  inStock: boolean
  rating: number
}

const initialFilters: FilterOptions = {
  category: '',
  priceRange: [0, 9999],
  sortBy: 'featured',
  inStock: false,
  rating: 0,
}

const allProducts: Product[] = [
  ...featuredProducts,
  {
    id: '5',
    name: 'Professional Camera',
    description: 'High-resolution DSLR camera perfect for photography enthusiasts and professionals.',
    price: 899.99,
    originalPrice: 1099.99,
    images: [
      'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=600&h=600&fit=crop',
      'https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?w=600&h=600&fit=crop',
    ],
    category: 'Electronics',
    subcategory: 'Cameras',
    brand: 'PhotoPro',
    rating: 4.9,
    reviewCount: 342,
    inStock: true,
    variants: [
      { id: '5-1', name: 'Lens Kit', value: 'Body Only', inStock: true },
      { id: '5-2', name: 'Lens Kit', value: 'With 18-55mm', inStock: true },
      { id: '5-3', name: 'Lens Kit', value: 'With 18-135mm', inStock: false },
    ],
    tags: ['professional', 'DSLR', 'high-resolution']
  },
  {
    id: '6',
    name: 'Designer Handbag',
    description: 'Elegant leather handbag with premium craftsmanship and timeless design.',
    price: 299.99,
    images: [
      'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&h=600&fit=crop',
      'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600&h=600&fit=crop',
    ],
    category: 'Fashion',
    subcategory: 'Accessories',
    brand: 'LuxStyle',
    rating: 4.6,
    reviewCount: 89,
    inStock: true,
    variants: [
      { id: '6-1', name: 'Color', value: 'Black', inStock: true },
      { id: '6-2', name: 'Color', value: 'Brown', inStock: true },
      { id: '6-3', name: 'Color', value: 'Tan', inStock: false },
    ],
    tags: ['designer', 'leather', 'elegant']
  },
  {
    id: '7',
    name: 'Smart Home Speaker',
    description: 'Voice-controlled smart speaker with excellent sound quality and smart home integration.',
    price: 129.99,
    originalPrice: 179.99,
    images: [
      'https://images.unsplash.com/photo-1571130175816-61d405b8f54a?w=600&h=600&fit=crop',
      'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=600&h=600&fit=crop',
    ],
    category: 'Electronics',
    subcategory: 'Smart Home',
    brand: 'SmartTech',
    rating: 4.4,
    reviewCount: 567,
    inStock: false,
    variants: [
      { id: '7-1', name: 'Color', value: 'Charcoal', inStock: false },
      { id: '7-2', name: 'Color', value: 'Sandstone', inStock: false },
      { id: '7-3', name: 'Color', value: 'Heather Gray', inStock: false },
    ],
    tags: ['smart', 'voice-control', 'wireless']
  },
  {
    id: '8',
    name: 'Organic Cotton Bedding Set',
    description: 'Luxuriously soft organic cotton bedding set with breathable and hypoallergenic properties.',
    price: 149.99,
    images: [
      'https://images.unsplash.com/photo-1505693314120-0d443867891c?w=600&h=600&fit=crop',
      'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&h=600&fit=crop',
    ],
    category: 'Home & Garden',
    subcategory: 'Bedding',
    brand: 'EcoLiving',
    rating: 4.7,
    reviewCount: 234,
    inStock: true,
    variants: [
      { id: '8-1', name: 'Size', value: 'Queen', inStock: true },
      { id: '8-2', name: 'Size', value: 'King', inStock: true },
      { id: '8-3', name: 'Color', value: 'White', inStock: true },
      { id: '8-4', name: 'Color', value: 'Sage', inStock: true },
    ],
    tags: ['organic', 'cotton', 'hypoallergenic']
  },
]

export default function ProductsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState<FilterOptions>(initialFilters)

  const filteredAndSortedProducts = useMemo(() => {
    let filtered = allProducts.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           product.brand.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesCategory = !filters.category || product.category.toLowerCase().replace(/\s+/g, '-') === filters.category
      
      const matchesPrice = product.price >= filters.priceRange[0] && product.price <= filters.priceRange[1]
      
      const matchesStock = !filters.inStock || product.inStock
      
      const matchesRating = filters.rating === 0 || product.rating >= filters.rating

      return matchesSearch && matchesCategory && matchesPrice && matchesStock && matchesRating
    })

    switch (filters.sortBy) {
      case 'price-low':
        return filtered.sort((a, b) => a.price - b.price)
      case 'price-high':
        return filtered.sort((a, b) => b.price - a.price)
      case 'name':
        return filtered.sort((a, b) => a.name.localeCompare(b.name))
      case 'rating':
        return filtered.sort((a, b) => b.rating - a.rating)
      case 'newest':
        return filtered.reverse()
      default:
        return filtered
    }
  }, [searchQuery, filters])

  return (
    <>
      <Navbar />
      
      <main className="min-h-screen bg-gray-50">
        <div className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              All Products
            </h1>
            <p className="text-gray-600 mb-6">
              Discover our complete collection of amazing products
            </p>
            
            <div className="relative max-w-lg">
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <MagnifyingGlassIcon className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            <aside className="lg:w-64 flex-shrink-0">
              <ProductFilters filters={filters} onFiltersChange={setFilters} />
            </aside>
            
            <div className="flex-1">
              <div className="flex justify-between items-center mb-6">
                <p className="text-gray-600">
                  Showing {filteredAndSortedProducts.length} of {allProducts.length} products
                </p>
              </div>
              
              {filteredAndSortedProducts.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-gray-400 mb-4">
                    <MagnifyingGlassIcon className="h-16 w-16 mx-auto" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
                  <p className="text-gray-500">
                    Try adjusting your search or filter criteria
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredAndSortedProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </>
  )
}