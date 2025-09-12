import type { Metadata } from 'next'
import './globals.css'
import CartSidebar from '@/components/CartSidebar'

export const metadata: Metadata = {
  title: 'E-Commerce Store - Your Premium Shopping Destination',
  description: 'Discover amazing products with fast shipping and great customer service',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50">
        {children}
        <CartSidebar />
      </body>
    </html>
  )
}