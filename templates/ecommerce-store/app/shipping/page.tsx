import { TruckIcon, ClockIcon, MapPinIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

const shippingOptions = [
  {
    name: 'Standard Shipping',
    price: 'FREE over $50',
    time: '3-5 business days',
    description: 'Our most popular shipping option with reliable delivery.',
    icon: TruckIcon,
  },
  {
    name: 'Express Shipping',
    price: '$9.99',
    time: '1-2 business days',
    description: 'Faster delivery for when you need it quickly.',
    icon: ClockIcon,
  },
  {
    name: 'Overnight Shipping',
    price: '$19.99',
    time: 'Next business day',
    description: 'Get your order the next business day.',
    icon: ClockIcon,
  },
  {
    name: 'International Shipping',
    price: 'Varies by location',
    time: '7-14 business days',
    description: 'We ship to over 25 countries worldwide.',
    icon: MapPinIcon,
  },
]

const countries = [
  'United States', 'Canada', 'United Kingdom', 'Australia', 'Germany',
  'France', 'Italy', 'Spain', 'Netherlands', 'Belgium', 'Sweden',
  'Norway', 'Denmark', 'Japan', 'South Korea', 'Singapore', 'Hong Kong',
  'New Zealand', 'Switzerland', 'Austria', 'Ireland', 'Portugal',
  'Finland', 'Luxembourg', 'Mexico'
]

export default function ShippingPage() {
  return (
    <>
      <Navbar />
      
      <main className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Shipping Information
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We offer fast, reliable shipping options to get your order to you quickly and safely.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6 mb-16">
            {shippingOptions.map((option) => (
              <div key={option.name} className="bg-white rounded-lg shadow-sm p-6 text-center">
                <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <option.icon className="h-8 w-8 text-primary-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {option.name}
                </h3>
                <p className="text-2xl font-bold text-primary-600 mb-2">
                  {option.price}
                </p>
                <p className="text-gray-500 font-medium mb-3">
                  {option.time}
                </p>
                <p className="text-gray-600 text-sm">
                  {option.description}
                </p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
            <div className="bg-white rounded-lg shadow-sm p-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                Shipping Policies
              </h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Processing Time</h3>
                  <p className="text-gray-600">
                    Orders are typically processed within 1-2 business days. Orders placed on weekends or holidays will be processed the next business day.
                  </p>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Free Shipping Threshold</h3>
                  <p className="text-gray-600">
                    Enjoy free standard shipping on all orders over $50 within the United States. Orders under $50 will be charged a flat rate of $5.99 for standard shipping.
                  </p>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Order Tracking</h3>
                  <p className="text-gray-600">
                    Once your order ships, you'll receive a confirmation email with tracking information. You can track your package through our website or directly with the shipping carrier.
                  </p>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Shipping Restrictions</h3>
                  <p className="text-gray-600">
                    Some items may have shipping restrictions based on size, weight, or local regulations. We'll notify you during checkout if any items in your cart have special shipping requirements.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                International Shipping
              </h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Available Countries</h3>
                  <p className="text-gray-600 mb-4">
                    We ship to the following countries and regions:
                  </p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-gray-600">
                    {countries.map((country) => (
                      <div key={country} className="flex items-center">
                        <span className="w-2 h-2 bg-primary-600 rounded-full mr-2"></span>
                        {country}
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Customs and Duties</h3>
                  <p className="text-gray-600">
                    International customers are responsible for any customs duties, taxes, or fees imposed by their country. These charges are not included in our shipping costs and vary by destination.
                  </p>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Delivery Times</h3>
                  <p className="text-gray-600">
                    International delivery times vary by destination and can take 7-14 business days. Some remote locations may take longer.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-8 mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6 text-center">
              Shipping FAQ
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Can I change my shipping address after placing an order?</h3>
                  <p className="text-gray-600">
                    If your order hasn't shipped yet, contact us immediately and we'll do our best to update your shipping address. Once shipped, we cannot modify the delivery address.
                  </p>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">What happens if I'm not home for delivery?</h3>
                  <p className="text-gray-600">
                    Most carriers will leave a delivery notice and attempt redelivery. You can also arrange to pick up your package at a local carrier facility or request delivery to a different address.
                  </p>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Do you ship to P.O. Boxes?</h3>
                  <p className="text-gray-600">
                    Yes, we can ship most items to P.O. Boxes using USPS. Some large or fragile items may require delivery to a street address.
                  </p>
                </div>
              </div>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">How can I track my order?</h3>
                  <p className="text-gray-600">
                    You'll receive a tracking number via email once your order ships. You can track your package on our website or directly on the carrier's website.
                  </p>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">What if my package is damaged or lost?</h3>
                  <p className="text-gray-600">
                    If your package arrives damaged or goes missing, contact us within 48 hours of the expected delivery date. We'll work with the carrier to resolve the issue or send a replacement.
                  </p>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Can I expedite my order after it's placed?</h3>
                  <p className="text-gray-600">
                    If your order hasn't shipped yet, contact us and we may be able to upgrade your shipping method for an additional fee.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-primary-600 text-white rounded-lg p-8 text-center">
            <div className="flex items-center justify-center mb-4">
              <CurrencyDollarIcon className="h-8 w-8 mr-3" />
              <h2 className="text-2xl font-semibold">Free Shipping Over $50</h2>
            </div>
            <p className="text-primary-100 mb-6">
              Enjoy free standard shipping on all orders over $50. No code needed!
            </p>
            <a href="/products" className="bg-white text-primary-600 hover:bg-gray-100 font-medium py-3 px-8 rounded-lg transition-colors">
              Start Shopping
            </a>
          </div>
        </div>
      </main>
      
      <Footer />
    </>
  )
}