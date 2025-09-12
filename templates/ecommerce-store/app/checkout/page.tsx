'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Elements } from '@stripe/react-stripe-js'
import { LockClosedIcon, CreditCardIcon, TruckIcon } from '@heroicons/react/24/outline'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import StripeCheckoutForm from '@/components/StripeCheckoutForm'
import { useCartStore } from '@/store/cart'
import { useAuthStore } from '@/store/auth'
import { useOrderStore } from '@/store/orders'
import stripePromise from '@/lib/stripe'

export default function CheckoutPage() {
  const { items, getTotal, clearCart } = useCartStore()
  const { user, isAuthenticated } = useAuthStore()
  const { createOrder } = useOrderStore()
  const router = useRouter()
  
  const [currentStep, setCurrentStep] = useState(1)
  const [isProcessing, setIsProcessing] = useState(false)
  const [formData, setFormData] = useState({
    // Shipping Information
    shippingFirstName: user?.firstName || '',
    shippingLastName: user?.lastName || '',
    shippingEmail: user?.email || '',
    shippingAddress: '',
    shippingCity: '',
    shippingState: '',
    shippingZip: '',
    
    // Billing Information
    sameAsShipping: true,
    billingFirstName: '',
    billingLastName: '',
    billingAddress: '',
    billingCity: '',
    billingState: '',
    billingZip: '',
    
    // Payment Information
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardName: '',
  })

  const subtotal = getTotal()
  const shipping = subtotal > 50 ? 0 : 9.99
  const tax = subtotal * 0.08
  const total = subtotal + shipping + tax

  if (items.length === 0) {
    router.push('/cart')
    return null
  }

  const steps = [
    { id: 1, name: 'Shipping', completed: false },
    { id: 2, name: 'Payment', completed: false },
    { id: 3, name: 'Review', completed: false },
  ]

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleNextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handlePaymentSuccess = async (paymentIntentId: string) => {
    setIsProcessing(true)
    
    try {
      const orderId = await createOrder({
        userId: user?.id || 'guest',
        items,
        total,
        subtotal,
        tax,
        shipping,
        shippingAddress: {
          id: '1',
          type: 'shipping',
          firstName: formData.shippingFirstName,
          lastName: formData.shippingLastName,
          street: formData.shippingAddress,
          city: formData.shippingCity,
          state: formData.shippingState,
          zipCode: formData.shippingZip,
          country: 'US',
          isDefault: false
        },
        billingAddress: {
          id: '1',
          type: 'billing',
          firstName: formData.sameAsShipping ? formData.shippingFirstName : formData.billingFirstName,
          lastName: formData.sameAsShipping ? formData.shippingLastName : formData.billingLastName,
          street: formData.sameAsShipping ? formData.shippingAddress : formData.billingAddress,
          city: formData.sameAsShipping ? formData.shippingCity : formData.billingCity,
          state: formData.sameAsShipping ? formData.shippingState : formData.billingState,
          zipCode: formData.sameAsShipping ? formData.shippingZip : formData.billingZip,
          country: 'US',
          isDefault: false
        }
      })
      
      clearCart()
      router.push(`/order-confirmation?orderId=${orderId}`)
    } catch (error) {
      console.error('Order creation failed:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handlePaymentError = (error: string) => {
    console.error('Payment error:', error)
    setIsProcessing(false)
  }

  return (
    <>
      <Navbar />
      
      <main className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>

          <div className="mb-8">
            <nav className="flex">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                    currentStep >= step.id 
                      ? 'bg-primary-600 border-primary-600 text-white' 
                      : 'border-gray-300 text-gray-500'
                  }`}>
                    {step.id}
                  </div>
                  <span className={`ml-2 font-medium ${
                    currentStep >= step.id ? 'text-primary-600' : 'text-gray-500'
                  }`}>
                    {step.name}
                  </span>
                  {index < steps.length - 1 && (
                    <div className={`w-16 h-0.5 mx-4 ${
                      currentStep > step.id ? 'bg-primary-600' : 'bg-gray-300'
                    }`} />
                  )}
                </div>
              ))}
            </nav>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-sm p-6">
                {currentStep === 1 && (
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-6">Shipping Information</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          First Name
                        </label>
                        <input
                          type="text"
                          value={formData.shippingFirstName}
                          onChange={(e) => handleInputChange('shippingFirstName', e.target.value)}
                          className="input-field"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Last Name
                        </label>
                        <input
                          type="text"
                          value={formData.shippingLastName}
                          onChange={(e) => handleInputChange('shippingLastName', e.target.value)}
                          className="input-field"
                          required
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email Address
                        </label>
                        <input
                          type="email"
                          value={formData.shippingEmail}
                          onChange={(e) => handleInputChange('shippingEmail', e.target.value)}
                          className="input-field"
                          required
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Street Address
                        </label>
                        <input
                          type="text"
                          value={formData.shippingAddress}
                          onChange={(e) => handleInputChange('shippingAddress', e.target.value)}
                          className="input-field"
                          placeholder="123 Main St"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          City
                        </label>
                        <input
                          type="text"
                          value={formData.shippingCity}
                          onChange={(e) => handleInputChange('shippingCity', e.target.value)}
                          className="input-field"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          State
                        </label>
                        <select
                          value={formData.shippingState}
                          onChange={(e) => handleInputChange('shippingState', e.target.value)}
                          className="input-field"
                          required
                        >
                          <option value="">Select State</option>
                          <option value="CA">California</option>
                          <option value="NY">New York</option>
                          <option value="TX">Texas</option>
                          <option value="FL">Florida</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          ZIP Code
                        </label>
                        <input
                          type="text"
                          value={formData.shippingZip}
                          onChange={(e) => handleInputChange('shippingZip', e.target.value)}
                          className="input-field"
                          required
                        />
                      </div>
                    </div>
                  </div>
                )}

                {currentStep === 2 && (
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-6">Payment Information</h2>
                    
                    <div className="mb-6">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.sameAsShipping}
                          onChange={(e) => handleInputChange('sameAsShipping', e.target.checked.toString())}
                          className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">Billing address same as shipping</span>
                      </label>
                    </div>

                    <Elements stripe={stripePromise}>
                      <StripeCheckoutForm
                        amount={total}
                        onSuccess={handlePaymentSuccess}
                        onError={handlePaymentError}
                      />
                    </Elements>
                  </div>
                )}

                {currentStep === 3 && (
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-6">Review Your Order</h2>
                    
                    <div className="space-y-6">
                      <div>
                        <h3 className="font-medium text-gray-900 mb-2">Shipping Address</h3>
                        <div className="text-sm text-gray-600">
                          <p>{formData.shippingFirstName} {formData.shippingLastName}</p>
                          <p>{formData.shippingAddress}</p>
                          <p>{formData.shippingCity}, {formData.shippingState} {formData.shippingZip}</p>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="font-medium text-gray-900 mb-2">Payment Method</h3>
                        <div className="text-sm text-gray-600">
                          <p>**** **** **** {formData.cardNumber.slice(-4)}</p>
                          <p>Expires {formData.expiryDate}</p>
                        </div>
                      </div>
                      
                      <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                        <p className="text-sm text-yellow-800">
                          <strong>Demo Mode:</strong> This is a demonstration checkout. No actual payment will be processed.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-8 flex justify-between">
                  {currentStep > 1 && (
                    <button
                      onClick={handlePrevStep}
                      className="btn-secondary"
                    >
                      Back
                    </button>
                  )}
                  
                  <div className="ml-auto">
                    {currentStep < 3 ? (
                      <button
                        onClick={handleNextStep}
                        className="btn-primary"
                      >
                        Continue
                      </button>
                    ) : (
                      <div className="text-sm text-gray-600">
                        Payment will be processed in the previous step.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm p-6 sticky top-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>
                
                <div className="space-y-4 mb-6">
                  {items.map((item) => (
                    <div key={`${item.product.id}-${JSON.stringify(item.selectedVariants)}`} className="flex space-x-3">
                      <div className="relative w-12 h-12 flex-shrink-0">
                        <Image
                          src={item.product.images[0]}
                          alt={item.product.name}
                          fill
                          className="object-cover rounded-md"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {item.product.name}
                        </p>
                        <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                      </div>
                      <p className="text-sm font-medium text-gray-900">
                        ${(item.product.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Shipping</span>
                    <span className="font-medium">
                      {shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tax</span>
                    <span className="font-medium">${tax.toFixed(2)}</span>
                  </div>
                  <hr />
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Total</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </div>
                
                <div className="mt-6 flex items-center text-sm text-gray-500">
                  <TruckIcon className="h-4 w-4 mr-2" />
                  <span>Estimated delivery: 3-5 business days</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </>
  )
}