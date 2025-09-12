import { ArrowPathIcon, ShieldCheckIcon, ClockIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

const returnSteps = [
  {
    step: '1',
    title: 'Initiate Return',
    description: 'Contact us or use our online return form to start the process.',
  },
  {
    step: '2',
    title: 'Pack Your Items',
    description: 'Securely pack your items in their original packaging if possible.',
  },
  {
    step: '3',
    title: 'Ship Back to Us',
    description: 'Use the prepaid return label we provide or ship using your preferred method.',
  },
  {
    step: '4',
    title: 'Processing',
    description: 'We inspect your return and process your refund within 3-5 business days.',
  },
]

const eligibleItems = [
  'Clothing and accessories in original condition',
  'Electronics with all original components',
  'Books and media in resalable condition',
  'Home goods and decorative items',
  'Beauty products (unopened)',
]

const nonReturnableItems = [
  'Personalized or custom-made items',
  'Perishable goods',
  'Intimate apparel and swimwear',
  'Digital downloads',
  'Gift cards and vouchers',
  'Items damaged by misuse',
]

export default function ReturnsPage() {
  return (
    <>
      <Navbar />
      
      <main className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Returns & Exchanges
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We want you to be completely satisfied with your purchase. Here's everything you need to know about our return policy.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <div className="bg-white rounded-lg shadow-sm p-6 text-center">
              <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <ClockIcon className="h-8 w-8 text-primary-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                30-Day Returns
              </h3>
              <p className="text-gray-600">
                You have 30 days from delivery to return most items for a full refund.
              </p>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-6 text-center">
              <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <ArrowPathIcon className="h-8 w-8 text-primary-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Free Returns
              </h3>
              <p className="text-gray-600">
                We provide prepaid return labels for all eligible returns within the US.
              </p>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-6 text-center">
              <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShieldCheckIcon className="h-8 w-8 text-primary-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Quality Guarantee
              </h3>
              <p className="text-gray-600">
                If you're not satisfied with your purchase, we'll make it right.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-8 mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-8 text-center">
              How to Return Your Order
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {returnSteps.map((step, index) => (
                <div key={step.step} className="text-center">
                  <div className="bg-primary-600 text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-lg font-semibold">
                    {step.step}
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {step.title}
                  </h3>
                  <p className="text-gray-600 text-sm">
                    {step.description}
                  </p>
                  {index < returnSteps.length - 1 && (
                    <div className="hidden md:block absolute top-6 left-full w-full h-0.5 bg-gray-200 transform -translate-x-1/2" />
                  )}
                </div>
              ))}
            </div>
            
            <div className="mt-8 text-center">
              <a href="/contact" className="btn-primary">
                Start a Return
              </a>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
            <div className="bg-white rounded-lg shadow-sm p-8">
              <div className="flex items-center mb-6">
                <ShieldCheckIcon className="h-6 w-6 text-green-600 mr-2" />
                <h2 className="text-2xl font-semibold text-gray-900">
                  Returnable Items
                </h2>
              </div>
              
              <p className="text-gray-600 mb-6">
                The following items are eligible for return within 30 days of delivery:
              </p>
              
              <ul className="space-y-3">
                {eligibleItems.map((item) => (
                  <li key={item} className="flex items-center text-gray-700">
                    <div className="w-2 h-2 bg-green-600 rounded-full mr-3"></div>
                    {item}
                  </li>
                ))}
              </ul>
              
              <div className="mt-6 p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-green-800">
                  <strong>Important:</strong> Items must be in original condition with tags attached and in original packaging when possible.
                </p>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-8">
              <div className="flex items-center mb-6">
                <ExclamationTriangleIcon className="h-6 w-6 text-red-600 mr-2" />
                <h2 className="text-2xl font-semibold text-gray-900">
                  Non-Returnable Items
                </h2>
              </div>
              
              <p className="text-gray-600 mb-6">
                For hygiene and safety reasons, the following items cannot be returned:
              </p>
              
              <ul className="space-y-3">
                {nonReturnableItems.map((item) => (
                  <li key={item} className="flex items-center text-gray-700">
                    <div className="w-2 h-2 bg-red-600 rounded-full mr-3"></div>
                    {item}
                  </li>
                ))}
              </ul>
              
              <div className="mt-6 p-4 bg-red-50 rounded-lg">
                <p className="text-sm text-red-800">
                  <strong>Note:</strong> Items received damaged or defective are always eligible for return or exchange, regardless of the above restrictions.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-8 mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">
              Return Policy Details
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Return Window</h3>
                  <p className="text-gray-600">
                    You have 30 days from the delivery date to initiate a return. The return window starts from the date your order is delivered, not the purchase date.
                  </p>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Refund Processing</h3>
                  <p className="text-gray-600">
                    Once we receive your return, we'll inspect it and process your refund within 3-5 business days. Refunds are issued to the original payment method.
                  </p>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Return Shipping</h3>
                  <p className="text-gray-600">
                    We provide free return shipping labels for all returns within the United States. International customers are responsible for return shipping costs.
                  </p>
                </div>
              </div>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Exchanges</h3>
                  <p className="text-gray-600">
                    We don't offer direct exchanges. If you need a different size or color, please return your original item and place a new order for your preferred item.
                  </p>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Damaged Items</h3>
                  <p className="text-gray-600">
                    If you receive a damaged or defective item, contact us immediately. We'll provide a prepaid return label and send a replacement or issue a full refund.
                  </p>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Gift Returns</h3>
                  <p className="text-gray-600">
                    Gift recipients can return items for store credit. Original purchasers can return gifts for a refund to the original payment method.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-primary-600 text-white rounded-lg p-8 text-center">
            <h2 className="text-2xl font-semibold mb-4">
              Need Help with Your Return?
            </h2>
            <p className="text-primary-100 mb-6">
              Our customer service team is here to help make your return process as smooth as possible.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="/contact" className="bg-white text-primary-600 hover:bg-gray-100 font-medium py-3 px-8 rounded-lg transition-colors">
                Contact Support
              </a>
              <a href="mailto:returns@shopnow.com" className="border border-white text-white hover:bg-white hover:text-primary-600 font-medium py-3 px-8 rounded-lg transition-colors">
                Email Returns Team
              </a>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </>
  )
}