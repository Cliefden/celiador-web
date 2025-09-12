'use client'

import { useState } from 'react'
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js'
import { LockClosedIcon } from '@heroicons/react/24/outline'

interface StripeCheckoutFormProps {
  amount: number
  onSuccess: (paymentIntentId: string) => void
  onError: (error: string) => void
}

const cardElementOptions = {
  style: {
    base: {
      fontSize: '16px',
      color: '#424770',
      '::placeholder': {
        color: '#aab7c4',
      },
    },
    invalid: {
      color: '#9e2146',
    },
  },
}

export default function StripeCheckoutForm({ amount, onSuccess, onError }: StripeCheckoutFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [isProcessing, setIsProcessing] = useState(false)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setIsProcessing(true)

    const cardElement = elements.getElement(CardElement)

    if (!cardElement) {
      setIsProcessing(false)
      onError('Card element not found')
      return
    }

    try {
      // In a real implementation, you would:
      // 1. Create a payment intent on your server
      // 2. Confirm the payment with Stripe
      // 3. Handle the result

      // For demo purposes, we'll simulate a successful payment
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Simulate successful payment
      const mockPaymentIntentId = `pi_${Math.random().toString(36).substr(2, 24)}`
      onSuccess(mockPaymentIntentId)
    } catch (error) {
      onError('Payment failed. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Card Details
        </label>
        <div className="border border-gray-300 rounded-lg p-4 bg-white">
          <CardElement options={cardElementOptions} />
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
        <p className="text-sm text-yellow-800">
          <strong>Demo Mode:</strong> This is a demonstration. No actual payment will be processed.
          In production, this would integrate with your Stripe account.
        </p>
      </div>

      <button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full btn-primary flex items-center justify-center py-3 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <LockClosedIcon className="h-5 w-5 mr-2" />
        {isProcessing ? 'Processing...' : `Pay $${amount.toFixed(2)}`}
      </button>

      <div className="text-center">
        <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
          <LockClosedIcon className="h-4 w-4" />
          <span>Secured by Stripe</span>
        </div>
      </div>
    </form>
  )
}