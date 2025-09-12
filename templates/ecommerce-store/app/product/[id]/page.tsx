'use client'

import { useState } from 'react'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { 
  StarIcon, 
  HeartIcon, 
  ShoppingCartIcon, 
  TruckIcon,
  ShieldCheckIcon,
  ArrowPathIcon,
  CheckIcon
} from '@heroicons/react/24/outline'
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import ProductCard from '@/components/ProductCard'
import ProductImageGallery from '@/components/ProductImageGallery'
import { featuredProducts } from '@/lib/data'
import { useCartStore } from '@/store/cart'
import { Product } from '@/types'

const allProducts = [
  ...featuredProducts,
  {
    id: '5',
    name: 'Professional Camera',
    description: 'High-resolution DSLR camera perfect for photography enthusiasts and professionals. Features advanced autofocus system, 4K video recording, and weather-sealed body construction.',
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
  }
]

export default function ProductPage({ params }: { params: { id: string } }) {
  const [selectedVariants, setSelectedVariants] = useState<{ [key: string]: string }>({})
  const [quantity, setQuantity] = useState(1)
  const [isWishlisted, setIsWishlisted] = useState(false)
  const [activeTab, setActiveTab] = useState('description')
  
  const { addItem } = useCartStore()

  const product = allProducts.find(p => p.id === params.id)

  if (!product) {
    notFound()
  }

  const handleVariantChange = (variantName: string, value: string) => {
    setSelectedVariants(prev => ({
      ...prev,
      [variantName]: value
    }))
  }

  const handleAddToCart = () => {
    addItem(product, quantity, selectedVariants)
  }

  const relatedProducts = allProducts
    .filter(p => p.id !== product.id && p.category === product.category)
    .slice(0, 4)

  const tabs = [
    { id: 'description', label: 'Description' },
    { id: 'reviews', label: `Reviews (${product.reviewCount})` },
    { id: 'shipping', label: 'Shipping & Returns' },
  ]

  return (
    <>
      <Navbar />
      
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-8">
            <Link href="/" className="hover:text-primary-600">Home</Link>
            <span>/</span>
            <Link href="/products" className="hover:text-primary-600">Products</Link>
            <span>/</span>
            <Link href={`/category/${product.category.toLowerCase().replace(/\s+/g, '-')}`} className="hover:text-primary-600">
              {product.category}
            </Link>
            <span>/</span>
            <span className="text-gray-900">{product.name}</span>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
            <div>
              <ProductImageGallery images={product.images} productName={product.name} />
            </div>
            
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-500 font-medium">{product.brand}</span>
                  <button
                    onClick={() => setIsWishlisted(!isWishlisted)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    {isWishlisted ? (
                      <HeartIconSolid className="h-6 w-6 text-red-500" />
                    ) : (
                      <HeartIcon className="h-6 w-6 text-gray-400" />
                    )}
                  </button>
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-4">{product.name}</h1>
                
                <div className="flex items-center space-x-4 mb-4">
                  <div className="flex items-center space-x-1">
                    {[...Array(5)].map((_, i) => (
                      <StarIcon
                        key={i}
                        className={`h-5 w-5 ${
                          i < Math.floor(product.rating) 
                            ? 'text-yellow-400 fill-current' 
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                    <span className="text-gray-600 ml-2">{product.rating}</span>
                  </div>
                  <span className="text-gray-400">•</span>
                  <span className="text-gray-600">{product.reviewCount} reviews</span>
                </div>
                
                <div className="flex items-center space-x-4 mb-6">
                  <span className="text-3xl font-bold text-gray-900">
                    ${product.price.toFixed(2)}
                  </span>
                  {product.originalPrice && (
                    <>
                      <span className="text-xl text-gray-500 line-through">
                        ${product.originalPrice.toFixed(2)}
                      </span>
                      <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-sm font-medium">
                        Save {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}%
                      </span>
                    </>
                  )}
                </div>
                
                <p className="text-gray-600 leading-relaxed mb-6">
                  {product.description}
                </p>
              </div>

              {product.variants && product.variants.length > 0 && (
                <div className="space-y-4">
                  {Object.entries(
                    product.variants.reduce((acc, variant) => {
                      if (!acc[variant.name]) {
                        acc[variant.name] = []
                      }
                      acc[variant.name].push(variant)
                      return acc
                    }, {} as { [key: string]: typeof product.variants })
                  ).map(([variantName, variants]) => (
                    <div key={variantName}>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        {variantName}
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {variants.map((variant) => (
                          <button
                            key={variant.id}
                            onClick={() => handleVariantChange(variantName, variant.value)}
                            disabled={!variant.inStock}
                            className={`px-4 py-2 border rounded-lg text-sm font-medium transition-colors ${
                              selectedVariants[variantName] === variant.value
                                ? 'border-primary-600 bg-primary-600 text-white'
                                : variant.inStock
                                ? 'border-gray-300 text-gray-900 hover:border-gray-400'
                                : 'border-gray-200 text-gray-400 cursor-not-allowed'
                            }`}
                          >
                            {variant.value}
                            {!variant.inStock && (
                              <span className="ml-1 text-xs">(Out of stock)</span>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Quantity
                </label>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center border border-gray-300 rounded-lg">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="p-2 hover:bg-gray-50 transition-colors"
                    >
                      -
                    </button>
                    <span className="px-4 py-2 border-x border-gray-300">{quantity}</span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="p-2 hover:bg-gray-50 transition-colors"
                    >
                      +
                    </button>
                  </div>
                  {product.inStock && (
                    <span className="flex items-center text-green-600 text-sm">
                      <CheckIcon className="h-4 w-4 mr-1" />
                      In Stock
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <button
                  onClick={handleAddToCart}
                  disabled={!product.inStock}
                  className="w-full btn-primary flex items-center justify-center py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ShoppingCartIcon className="h-5 w-5 mr-2" />
                  {product.inStock ? 'Add to Cart' : 'Out of Stock'}
                </button>
                
                <button className="w-full btn-outline py-3">
                  Buy Now
                </button>
              </div>

              <div className="border-t pt-6 space-y-4">
                <div className="flex items-center space-x-3 text-sm text-gray-600">
                  <TruckIcon className="h-5 w-5 text-primary-600" />
                  <span>Free shipping on orders over $50</span>
                </div>
                <div className="flex items-center space-x-3 text-sm text-gray-600">
                  <ArrowPathIcon className="h-5 w-5 text-primary-600" />
                  <span>30-day return policy</span>
                </div>
                <div className="flex items-center space-x-3 text-sm text-gray-600">
                  <ShieldCheckIcon className="h-5 w-5 text-primary-600" />
                  <span>2-year warranty included</span>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t bg-white rounded-lg shadow-sm p-8 mb-16">
            <div className="flex border-b">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-primary-600 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            
            <div className="pt-6">
              {activeTab === 'description' && (
                <div className="prose max-w-none">
                  <p className="text-gray-600 leading-relaxed">
                    {product.description}
                  </p>
                  <div className="mt-6">
                    <h4 className="font-semibold text-gray-900 mb-3">Features:</h4>
                    <ul className="space-y-2 text-gray-600">
                      <li>• Premium materials and construction</li>
                      <li>• Advanced technology and innovation</li>
                      <li>• Ergonomic design for comfort</li>
                      <li>• Comprehensive warranty coverage</li>
                    </ul>
                  </div>
                </div>
              )}
              
              {activeTab === 'reviews' && (
                <div className="space-y-6">
                  <div className="text-center py-8 text-gray-500">
                    Customer reviews coming soon...
                  </div>
                </div>
              )}
              
              {activeTab === 'shipping' && (
                <div className="space-y-4 text-gray-600">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Shipping Information</h4>
                    <p>Free standard shipping on orders over $50. Express shipping available for an additional fee.</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Return Policy</h4>
                    <p>30-day return policy. Items must be in original condition and packaging.</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {relatedProducts.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-8">Related Products</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {relatedProducts.map((relatedProduct) => (
                  <ProductCard key={relatedProduct.id} product={relatedProduct} />
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
      
      <Footer />
    </>
  )
}