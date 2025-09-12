import { Product, Category } from '@/types'

export const categories: Category[] = [
  {
    id: '1',
    name: 'Electronics',
    slug: 'electronics',
    description: 'Latest gadgets and electronics',
    image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400&h=300&fit=crop',
    subcategories: [
      { id: '1-1', name: 'Smartphones', slug: 'smartphones' },
      { id: '1-2', name: 'Laptops', slug: 'laptops' },
      { id: '1-3', name: 'Headphones', slug: 'headphones' },
    ]
  },
  {
    id: '2',
    name: 'Fashion',
    slug: 'fashion',
    description: 'Trendy clothing and accessories',
    image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=300&fit=crop',
    subcategories: [
      { id: '2-1', name: 'Men\'s Clothing', slug: 'mens-clothing' },
      { id: '2-2', name: 'Women\'s Clothing', slug: 'womens-clothing' },
      { id: '2-3', name: 'Accessories', slug: 'accessories' },
    ]
  },
  {
    id: '3',
    name: 'Home & Garden',
    slug: 'home-garden',
    description: 'Everything for your home and garden',
    image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=300&fit=crop',
    subcategories: [
      { id: '3-1', name: 'Furniture', slug: 'furniture' },
      { id: '3-2', name: 'Decor', slug: 'decor' },
      { id: '3-3', name: 'Garden', slug: 'garden' },
    ]
  },
]

export const featuredProducts: Product[] = [
  {
    id: '1',
    name: 'Premium Wireless Headphones',
    description: 'High-quality wireless headphones with noise cancellation and premium sound quality.',
    price: 199.99,
    originalPrice: 249.99,
    images: [
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&h=600&fit=crop',
      'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=600&h=600&fit=crop',
    ],
    category: 'Electronics',
    subcategory: 'Headphones',
    brand: 'AudioTech',
    rating: 4.8,
    reviewCount: 256,
    inStock: true,
    variants: [
      { id: '1-1', name: 'Color', value: 'Black', inStock: true },
      { id: '1-2', name: 'Color', value: 'White', inStock: true },
      { id: '1-3', name: 'Color', value: 'Silver', inStock: false },
    ],
    tags: ['wireless', 'noise-cancelling', 'premium']
  },
  {
    id: '2',
    name: 'Smart Fitness Watch',
    description: 'Advanced fitness tracker with heart rate monitoring, GPS, and smart notifications.',
    price: 299.99,
    images: [
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&h=600&fit=crop',
      'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=600&h=600&fit=crop',
    ],
    category: 'Electronics',
    subcategory: 'Wearables',
    brand: 'FitTech',
    rating: 4.6,
    reviewCount: 189,
    inStock: true,
    variants: [
      { id: '2-1', name: 'Size', value: 'Small', inStock: true },
      { id: '2-2', name: 'Size', value: 'Medium', inStock: true },
      { id: '2-3', name: 'Size', value: 'Large', inStock: true },
    ],
    tags: ['fitness', 'smart', 'waterproof']
  },
  {
    id: '3',
    name: 'Minimalist Backpack',
    description: 'Sleek and functional backpack perfect for work, travel, or everyday use.',
    price: 89.99,
    originalPrice: 119.99,
    images: [
      'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&h=600&fit=crop',
      'https://images.unsplash.com/photo-1581605405669-fcdf81165afa?w=600&h=600&fit=crop',
    ],
    category: 'Fashion',
    subcategory: 'Accessories',
    brand: 'UrbanCarry',
    rating: 4.7,
    reviewCount: 124,
    inStock: true,
    variants: [
      { id: '3-1', name: 'Color', value: 'Black', inStock: true },
      { id: '3-2', name: 'Color', value: 'Gray', inStock: true },
      { id: '3-3', name: 'Color', value: 'Navy', inStock: true },
    ],
    tags: ['minimalist', 'travel', 'laptop-friendly']
  },
  {
    id: '4',
    name: 'Modern Table Lamp',
    description: 'Contemporary LED table lamp with adjustable brightness and sleek design.',
    price: 79.99,
    images: [
      'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=600&h=600&fit=crop',
      'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&h=600&fit=crop',
    ],
    category: 'Home & Garden',
    subcategory: 'Lighting',
    brand: 'LightCraft',
    rating: 4.5,
    reviewCount: 98,
    inStock: true,
    variants: [
      { id: '4-1', name: 'Finish', value: 'Brass', inStock: true },
      { id: '4-2', name: 'Finish', value: 'Black', inStock: true },
      { id: '4-3', name: 'Finish', value: 'White', inStock: false },
    ],
    tags: ['modern', 'LED', 'adjustable']
  },
]