import Link from 'next/link'
import { CheckCircleIcon, TruckIcon, EnvelopeIcon } from '@heroicons/react/24/solid'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export default function OrderConfirmationPage() {
  const orderNumber = Math.random().toString(36).substr(2, 9).toUpperCase()

  return (
    <>
      <Navbar />
      
      <main className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-6">
              <CheckCircleIcon className="w-full h-full text-green-500" />
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Order Confirmed!
            </h1>
            
            <p className="text-lg text-gray-600 mb-2">
              Thank you for your purchase
            </p>
            
            <p className="text-sm text-gray-500 mb-8">
              Order #{orderNumber}
            </p>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
              <div className="flex items-start space-x-4">
                <TruckIcon className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
                <div className="text-left">
                  <h3 className="font-medium text-green-900 mb-1">
                    Your order is being processed
                  </h3>
                  <p className="text-sm text-green-700">
                    You'll receive a shipping confirmation email with tracking information once your order ships. 
                    Estimated delivery: 3-5 business days.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
              <div className="flex items-start space-x-4">
                <EnvelopeIcon className="h-6 w-6 text-blue-600 flex-shrink-0 mt-1" />
                <div className="text-left">
                  <h3 className="font-medium text-blue-900 mb-1">
                    Order confirmation sent
                  </h3>
                  <p className="text-sm text-blue-700">
                    We've sent a detailed order confirmation to your email address. 
                    Please keep it for your records.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="space-y-4 mb-8">
              <h3 className="text-lg font-semibold text-gray-900">What's next?</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="font-medium text-gray-900 mb-1">1. Processing</div>
                  <div className="text-gray-600">We prepare your order for shipment</div>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="font-medium text-gray-900 mb-1">2. Shipping</div>
                  <div className="text-gray-600">Your order is shipped with tracking</div>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="font-medium text-gray-900 mb-1">3. Delivery</div>
                  <div className="text-gray-600">Your package arrives at your door</div>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/account" className="btn-primary">
                View Order Status
              </Link>
              <Link href="/products" className="btn-outline">
                Continue Shopping
              </Link>
            </div>
            
            <div className="mt-8 pt-8 border-t text-sm text-gray-500">
              <p>Questions about your order? <Link href="/contact" className="text-primary-600 hover:text-primary-800">Contact our support team</Link></p>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </>
  )
}