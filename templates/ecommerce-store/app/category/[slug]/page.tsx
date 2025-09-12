'use client'

import { notFound } from 'next/navigation'
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import ProductCard from '@/components/ProductCard'
import { categories, featuredProducts } from '@/lib/data'

export default function CategoryPage({ params }: { params: { slug: string } }) {
  const category = categories.find(cat => cat.slug === params.slug)
  
  if (!category) {
    notFound()
  }

  // Filter products by category
  const categoryProducts = featuredProducts.filter(
    product => product.category.toLowerCase().replace(/\s+/g, '-') === params.slug
  )

  return (
    <>
      <Navbar />
      
      <main className="min-h-screen bg-gray-50">
        <div className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                {category.name}
              </h1>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                {category.description}
              </p>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {category.subcategories && category.subcategories.length > 0 && (
            <div className="mb-12">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                Shop by Subcategory
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {category.subcategories.map((subcategory) => (
                  <a
                    key={subcategory.id}
                    href={`/category/${subcategory.slug}`}
                    className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow text-center"
                  >
                    <h3 className="font-medium text-gray-900 text-sm">
                      {subcategory.name}
                    </h3>
                  </a>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-semibold text-gray-900">
              {category.name} Products
            </h2>
            <p className="text-gray-600">
              {categoryProducts.length} product{categoryProducts.length !== 1 ? 's' : ''} found
            </p>
          </div>

          {categoryProducts.length === 0 ? (
            <div className="text-center py-16">
              <MagnifyingGlassIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No products found in this category
              </h3>
              <p className="text-gray-500 mb-8">
                Check back soon as we're always adding new products!
              </p>
              <a href="/products" className="btn-primary">
                Browse All Products
              </a>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {categoryProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          <div className="mt-16 bg-white rounded-lg shadow-sm p-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              About {category.name}
            </h3>
            <p className="text-gray-600 mb-6">
              Discover our carefully curated collection of {category.name.toLowerCase()} products. 
              We work with trusted brands and emerging designers to bring you the latest trends and 
              highest quality items in the {category.name.toLowerCase()} category.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div>
                <div className="text-2xl font-bold text-primary-600 mb-2">✓</div>
                <h4 className="font-medium text-gray-900 mb-1">Quality Guaranteed</h4>
                <p className="text-sm text-gray-600">All products are carefully selected for quality</p>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary-600 mb-2">🚚</div>
                <h4 className="font-medium text-gray-900 mb-1">Fast Shipping</h4>
                <p className="text-sm text-gray-600">Free shipping on orders over $50</p>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary-600 mb-2">↩️</div>
                <h4 className="font-medium text-gray-900 mb-1">Easy Returns</h4>
                <p className="text-sm text-gray-600">30-day return policy on all items</p>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </>
  )
}