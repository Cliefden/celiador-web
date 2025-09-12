'use client'

import { useState } from 'react'
import { ChevronDownIcon, FunnelIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { categories } from '@/lib/data'

interface FilterOptions {
  category: string
  priceRange: [number, number]
  sortBy: string
  inStock: boolean
  rating: number
}

interface ProductFiltersProps {
  filters: FilterOptions
  onFiltersChange: (filters: FilterOptions) => void
}

const sortOptions = [
  { value: 'featured', label: 'Featured' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
  { value: 'name', label: 'Name A-Z' },
  { value: 'rating', label: 'Highest Rated' },
  { value: 'newest', label: 'Newest' },
]

const priceRanges = [
  { min: 0, max: 50, label: 'Under $50' },
  { min: 50, max: 100, label: '$50 - $100' },
  { min: 100, max: 200, label: '$100 - $200' },
  { min: 200, max: 500, label: '$200 - $500' },
  { min: 500, max: 9999, label: 'Over $500' },
]

export default function ProductFilters({ filters, onFiltersChange }: ProductFiltersProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [expandedSections, setExpandedSections] = useState<string[]>(['category', 'price'])

  const toggleSection = (section: string) => {
    setExpandedSections(prev => 
      prev.includes(section)
        ? prev.filter(s => s !== section)
        : [...prev, section]
    )
  }

  const updateFilter = (key: keyof FilterOptions, value: any) => {
    onFiltersChange({ ...filters, [key]: value })
  }

  const clearAllFilters = () => {
    onFiltersChange({
      category: '',
      priceRange: [0, 9999],
      sortBy: 'featured',
      inStock: false,
      rating: 0,
    })
  }

  return (
    <>
      <div className="lg:hidden mb-6">
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center justify-center w-full py-2 px-4 border border-gray-300 rounded-lg bg-white text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <FunnelIcon className="h-5 w-5 mr-2" />
          Filters & Sort
        </button>
      </div>

      <div className={`
        lg:block lg:relative lg:bg-transparent lg:p-0 lg:shadow-none
        ${isOpen ? 'fixed inset-0 z-50 bg-white p-6 overflow-y-auto' : 'hidden'}
      `}>
        <div className="lg:hidden flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold">Filters</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sort By
            </label>
            <select
              value={filters.sortBy}
              onChange={(e) => updateFilter('sortBy', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <button
              onClick={() => toggleSection('category')}
              className="flex items-center justify-between w-full py-2 text-left font-medium text-gray-900"
            >
              Category
              <ChevronDownIcon 
                className={`h-5 w-5 transform transition-transform ${
                  expandedSections.includes('category') ? 'rotate-180' : ''
                }`}
              />
            </button>
            {expandedSections.includes('category') && (
              <div className="mt-2 space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="category"
                    value=""
                    checked={filters.category === ''}
                    onChange={(e) => updateFilter('category', e.target.value)}
                    className="h-4 w-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">All Categories</span>
                </label>
                {categories.map((category) => (
                  <label key={category.id} className="flex items-center">
                    <input
                      type="radio"
                      name="category"
                      value={category.slug}
                      checked={filters.category === category.slug}
                      onChange={(e) => updateFilter('category', e.target.value)}
                      className="h-4 w-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">{category.name}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div>
            <button
              onClick={() => toggleSection('price')}
              className="flex items-center justify-between w-full py-2 text-left font-medium text-gray-900"
            >
              Price Range
              <ChevronDownIcon 
                className={`h-5 w-5 transform transition-transform ${
                  expandedSections.includes('price') ? 'rotate-180' : ''
                }`}
              />
            </button>
            {expandedSections.includes('price') && (
              <div className="mt-2 space-y-2">
                {priceRanges.map((range) => (
                  <label key={`${range.min}-${range.max}`} className="flex items-center">
                    <input
                      type="radio"
                      name="priceRange"
                      checked={
                        filters.priceRange[0] === range.min && 
                        filters.priceRange[1] === range.max
                      }
                      onChange={() => updateFilter('priceRange', [range.min, range.max])}
                      className="h-4 w-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">{range.label}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div>
            <button
              onClick={() => toggleSection('availability')}
              className="flex items-center justify-between w-full py-2 text-left font-medium text-gray-900"
            >
              Availability
              <ChevronDownIcon 
                className={`h-5 w-5 transform transition-transform ${
                  expandedSections.includes('availability') ? 'rotate-180' : ''
                }`}
              />
            </button>
            {expandedSections.includes('availability') && (
              <div className="mt-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.inStock}
                    onChange={(e) => updateFilter('inStock', e.target.checked)}
                    className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">In Stock Only</span>
                </label>
              </div>
            )}
          </div>

          <div>
            <button
              onClick={() => toggleSection('rating')}
              className="flex items-center justify-between w-full py-2 text-left font-medium text-gray-900"
            >
              Customer Rating
              <ChevronDownIcon 
                className={`h-5 w-5 transform transition-transform ${
                  expandedSections.includes('rating') ? 'rotate-180' : ''
                }`}
              />
            </button>
            {expandedSections.includes('rating') && (
              <div className="mt-2 space-y-2">
                {[4, 3, 2, 1].map((rating) => (
                  <label key={rating} className="flex items-center">
                    <input
                      type="radio"
                      name="rating"
                      value={rating}
                      checked={filters.rating === rating}
                      onChange={(e) => updateFilter('rating', Number(e.target.value))}
                      className="h-4 w-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                    />
                    <span className="ml-2 flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <svg
                          key={i}
                          className={`h-4 w-4 ${
                            i < rating ? 'text-yellow-400' : 'text-gray-300'
                          }`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                      <span className="ml-1 text-sm text-gray-600">& up</span>
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 flex space-x-4">
          <button
            onClick={clearAllFilters}
            className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Clear All
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="flex-1 lg:hidden btn-primary"
          >
            Apply Filters
          </button>
        </div>
      </div>

      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  )
}