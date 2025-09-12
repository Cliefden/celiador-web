'use client'

import { useState } from 'react'
import Image from 'next/image'
import { UserIcon, CogIcon, HeartIcon, ShoppingBagIcon, MapPinIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { useAuthStore } from '@/store/auth'
import { useRouter } from 'next/navigation'

export default function AccountPage() {
  const { user, isAuthenticated, logout } = useAuthStore()
  const [activeTab, setActiveTab] = useState('profile')
  const router = useRouter()

  if (!isAuthenticated || !user) {
    router.push('/auth/login')
    return null
  }

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  const tabs = [
    { id: 'profile', label: 'Profile', icon: UserIcon },
    { id: 'orders', label: 'Orders', icon: ShoppingBagIcon },
    { id: 'wishlist', label: 'Wishlist', icon: HeartIcon },
    { id: 'addresses', label: 'Addresses', icon: MapPinIcon },
    { id: 'settings', label: 'Settings', icon: CogIcon },
  ]

  return (
    <>
      <Navbar />
      
      <main className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-sm mb-8 p-6">
            <div className="flex items-center space-x-4">
              <div className="relative w-16 h-16">
                {user.avatar ? (
                  <Image
                    src={user.avatar}
                    alt={`${user.firstName} ${user.lastName}`}
                    fill
                    className="rounded-full object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center">
                    <UserIcon className="h-8 w-8 text-gray-600" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-900">
                  {user.firstName} {user.lastName}
                </h1>
                <p className="text-gray-600">{user.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 text-gray-600 hover:text-red-600 transition-colors"
              >
                <ArrowRightOnRectangleIcon className="h-5 w-5" />
                <span>Logout</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-1">
              <nav className="bg-white rounded-lg shadow-sm p-4">
                <ul className="space-y-1">
                  {tabs.map((tab) => (
                    <li key={tab.id}>
                      <button
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                          activeTab === tab.id
                            ? 'bg-primary-50 text-primary-600 border-r-2 border-primary-600'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <tab.icon className="h-5 w-5" />
                        <span className="font-medium">{tab.label}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>

            <div className="lg:col-span-3">
              <div className="bg-white rounded-lg shadow-sm p-6">
                {activeTab === 'profile' && (
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-6">Profile Information</h2>
                    <form className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            First Name
                          </label>
                          <input
                            type="text"
                            value={user.firstName}
                            className="input-field"
                            readOnly
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Last Name
                          </label>
                          <input
                            type="text"
                            value={user.lastName}
                            className="input-field"
                            readOnly
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email Address
                        </label>
                        <input
                          type="email"
                          value={user.email}
                          className="input-field"
                          readOnly
                        />
                      </div>
                      
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <p className="text-sm text-blue-800">
                          Profile editing is currently disabled in this demo. In a real application, 
                          you would be able to edit and save your profile information.
                        </p>
                      </div>
                    </form>
                  </div>
                )}

                {activeTab === 'orders' && (
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-6">Order History</h2>
                    <div className="text-center py-12">
                      <ShoppingBagIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500 mb-4">No orders yet</p>
                      <p className="text-sm text-gray-400 mb-4">
                        When you place your first order, it will appear here.
                      </p>
                      <a href="/products" className="btn-primary">
                        Start Shopping
                      </a>
                    </div>
                  </div>
                )}

                {activeTab === 'wishlist' && (
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-6">My Wishlist</h2>
                    <div className="text-center py-12">
                      <HeartIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500 mb-4">Your wishlist is empty</p>
                      <p className="text-sm text-gray-400">
                        Save items you love for later by clicking the heart icon.
                      </p>
                    </div>
                  </div>
                )}

                {activeTab === 'addresses' && (
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-6">Saved Addresses</h2>
                    <div className="text-center py-12">
                      <MapPinIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500 mb-4">No addresses saved</p>
                      <button className="btn-primary">Add New Address</button>
                    </div>
                  </div>
                )}

                {activeTab === 'settings' && (
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-6">Account Settings</h2>
                    <div className="space-y-6">
                      <div className="border-b pb-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Notifications</h3>
                        <div className="space-y-4">
                          <label className="flex items-center justify-between">
                            <span className="text-sm text-gray-700">Email notifications</span>
                            <input type="checkbox" className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500" defaultChecked />
                          </label>
                          <label className="flex items-center justify-between">
                            <span className="text-sm text-gray-700">Order updates</span>
                            <input type="checkbox" className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500" defaultChecked />
                          </label>
                          <label className="flex items-center justify-between">
                            <span className="text-sm text-gray-700">Marketing emails</span>
                            <input type="checkbox" className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500" />
                          </label>
                        </div>
                      </div>
                      
                      <div className="border-b pb-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Privacy</h3>
                        <div className="space-y-4">
                          <label className="flex items-center justify-between">
                            <span className="text-sm text-gray-700">Make profile public</span>
                            <input type="checkbox" className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500" />
                          </label>
                          <label className="flex items-center justify-between">
                            <span className="text-sm text-gray-700">Show online status</span>
                            <input type="checkbox" className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500" />
                          </label>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Danger Zone</h3>
                        <button className="btn-secondary text-red-600 border-red-300 hover:bg-red-50">
                          Delete Account
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </>
  )
}