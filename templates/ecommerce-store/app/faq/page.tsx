'use client'

import { useState } from 'react'
import { ChevronDownIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

const faqCategories = [
  {
    title: 'Orders & Checkout',
    faqs: [
      {
        question: 'How do I place an order?',
        answer: 'Simply browse our products, add items to your cart, and proceed to checkout. You\'ll need to create an account or sign in, then provide shipping and payment information to complete your purchase.',
      },
      {
        question: 'Can I modify or cancel my order after placing it?',
        answer: 'You can modify or cancel your order within 1 hour of placing it, as long as it hasn\'t been processed yet. Contact our customer service team immediately for assistance.',
      },
      {
        question: 'What payment methods do you accept?',
        answer: 'We accept all major credit cards (Visa, MasterCard, American Express, Discover), PayPal, Apple Pay, Google Pay, and Shop Pay.',
      },
      {
        question: 'Is it safe to enter my credit card information?',
        answer: 'Yes, absolutely. We use industry-standard SSL encryption to protect your personal and payment information. Your data is secure when shopping with us.',
      },
    ],
  },
  {
    title: 'Shipping & Delivery',
    faqs: [
      {
        question: 'How long does shipping take?',
        answer: 'Standard shipping takes 3-5 business days, Express shipping takes 1-2 business days, and Overnight shipping delivers the next business day. International shipping varies by location.',
      },
      {
        question: 'Do you offer free shipping?',
        answer: 'Yes! We offer free standard shipping on all orders over $50 within the United States. Orders under $50 have a flat shipping rate of $5.99.',
      },
      {
        question: 'Can I track my order?',
        answer: 'Absolutely. Once your order ships, you\'ll receive an email with tracking information. You can track your package on our website or directly with the shipping carrier.',
      },
      {
        question: 'Do you ship internationally?',
        answer: 'Yes, we ship to over 25 countries worldwide. International shipping costs and delivery times vary by destination. Customers are responsible for any customs duties or taxes.',
      },
    ],
  },
  {
    title: 'Returns & Exchanges',
    faqs: [
      {
        question: 'What is your return policy?',
        answer: 'We offer a 30-day return policy for most items. Items must be in original condition with tags attached. We provide free return shipping labels for US customers.',
      },
      {
        question: 'How do I return an item?',
        answer: 'Contact us or use our online return form to initiate the process. We\'ll provide a prepaid return label. Pack your items securely and ship them back to us.',
      },
      {
        question: 'How long does it take to process a refund?',
        answer: 'Once we receive your return, we\'ll inspect it and process your refund within 3-5 business days. Refunds are issued to the original payment method.',
      },
      {
        question: 'Can I exchange an item for a different size or color?',
        answer: 'We don\'t offer direct exchanges. Please return your original item for a refund and place a new order for your preferred item.',
      },
    ],
  },
  {
    title: 'Account & Technical',
    faqs: [
      {
        question: 'Do I need an account to make a purchase?',
        answer: 'While you can browse our products without an account, you\'ll need to create one to complete a purchase. This helps us track your orders and provide better customer service.',
      },
      {
        question: 'How do I reset my password?',
        answer: 'Click on "Sign In" then "Forgot Password" on the login page. Enter your email address and we\'ll send you instructions to reset your password.',
      },
      {
        question: 'Can I save items for later?',
        answer: 'Yes! You can add items to your wishlist by clicking the heart icon on any product. You can access your wishlist from your account dashboard.',
      },
      {
        question: 'The website is not working properly. What should I do?',
        answer: 'Try clearing your browser cache and cookies, or try using a different browser. If the problem persists, contact our technical support team.',
      },
    ],
  },
  {
    title: 'Products & Inventory',
    faqs: [
      {
        question: 'Are your product images accurate?',
        answer: 'We strive to display accurate colors and details in our product photos. However, colors may appear slightly different due to monitor settings and lighting conditions.',
      },
      {
        question: 'What if an item is out of stock?',
        answer: 'Out of stock items are marked on the product page. You can sign up for restock notifications to be alerted when the item becomes available again.',
      },
      {
        question: 'Do you offer product warranties?',
        answer: 'Many of our products come with manufacturer warranties. Warranty information is provided on individual product pages. We also offer our own satisfaction guarantee.',
      },
      {
        question: 'Can I get product recommendations?',
        answer: 'Our website shows personalized recommendations based on your browsing history. You can also contact our customer service team for personalized product suggestions.',
      },
    ],
  },
]

export default function FAQPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedItems, setExpandedItems] = useState<string[]>([])

  const toggleExpanded = (id: string) => {
    setExpandedItems(prev =>
      prev.includes(id)
        ? prev.filter(item => item !== id)
        : [...prev, id]
    )
  }

  const filteredFAQs = faqCategories.map(category => ({
    ...category,
    faqs: category.faqs.filter(
      faq =>
        faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
    ),
  })).filter(category => category.faqs.length > 0)

  return (
    <>
      <Navbar />
      
      <main className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Find answers to common questions about shopping, shipping, returns, and more.
            </p>
          </div>

          <div className="mb-12">
            <div className="relative max-w-lg mx-auto">
              <input
                type="text"
                placeholder="Search FAQs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <MagnifyingGlassIcon className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
            </div>
          </div>

          {filteredFAQs.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
              <p className="text-gray-600 mb-6">
                Try adjusting your search terms or browse all categories below.
              </p>
              <button
                onClick={() => setSearchTerm('')}
                className="btn-primary"
              >
                Show All FAQs
              </button>
            </div>
          ) : (
            <div className="space-y-8">
              {filteredFAQs.map((category) => (
                <div key={category.title} className="bg-white rounded-lg shadow-sm">
                  <div className="p-6 border-b border-gray-200">
                    <h2 className="text-2xl font-semibold text-gray-900">
                      {category.title}
                    </h2>
                  </div>
                  
                  <div className="divide-y divide-gray-200">
                    {category.faqs.map((faq, faqIndex) => {
                      const itemId = `${category.title}-${faqIndex}`
                      const isExpanded = expandedItems.includes(itemId)
                      
                      return (
                        <div key={faqIndex}>
                          <button
                            onClick={() => toggleExpanded(itemId)}
                            className="w-full px-6 py-4 text-left focus:outline-none focus:bg-gray-50 hover:bg-gray-50 transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              <h3 className="text-lg font-medium text-gray-900 pr-8">
                                {faq.question}
                              </h3>
                              <ChevronDownIcon
                                className={`h-5 w-5 text-gray-500 transform transition-transform ${
                                  isExpanded ? 'rotate-180' : ''
                                }`}
                              />
                            </div>
                          </button>
                          
                          {isExpanded && (
                            <div className="px-6 pb-4">
                              <p className="text-gray-600 leading-relaxed">
                                {faq.answer}
                              </p>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-16 bg-primary-600 text-white rounded-lg p-8 text-center">
            <h2 className="text-2xl font-semibold mb-4">
              Still Need Help?
            </h2>
            <p className="text-primary-100 mb-6">
              Can't find the answer you're looking for? Our customer service team is here to help.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="/contact" className="bg-white text-primary-600 hover:bg-gray-100 font-medium py-3 px-8 rounded-lg transition-colors">
                Contact Support
              </a>
              <a href="mailto:support@shopnow.com" className="border border-white text-white hover:bg-white hover:text-primary-600 font-medium py-3 px-8 rounded-lg transition-colors">
                Email Us
              </a>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </>
  )
}