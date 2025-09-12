'use client'

import { useState } from 'react'
import {
  ChartBarIcon,
  ShoppingBagIcon,
  CubeIcon,
  UsersIcon,
  ExclamationTriangleIcon,
  ArrowUpIcon,
  ArrowDownIcon,
} from '@heroicons/react/24/outline'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { useInventoryStore } from '@/store/inventory'
import { useOrderStore } from '@/store/orders'

const stats = [
  {
    name: 'Total Revenue',
    value: '$45,231',
    change: '+12.5%',
    changeType: 'positive',
    icon: ChartBarIcon,
  },
  {
    name: 'Orders Today',
    value: '127',
    change: '+8.2%',
    changeType: 'positive',
    icon: ShoppingBagIcon,
  },
  {
    name: 'Products in Stock',
    value: '324',
    change: '-2.1%',
    changeType: 'negative',
    icon: CubeIcon,
  },
  {
    name: 'Active Customers',
    value: '1,842',
    change: '+15.3%',
    changeType: 'positive',
    icon: UsersIcon,
  },
]

const recentOrders = [
  { id: 'ORD-001', customer: 'John Doe', amount: '$89.99', status: 'completed', date: '2024-12-01' },
  { id: 'ORD-002', customer: 'Jane Smith', amount: '$156.50', status: 'processing', date: '2024-12-01' },
  { id: 'ORD-003', customer: 'Mike Johnson', amount: '$73.25', status: 'shipped', date: '2024-11-30' },
  { id: 'ORD-004', customer: 'Sarah Wilson', amount: '$245.00', status: 'pending', date: '2024-11-30' },
  { id: 'ORD-005', customer: 'Tom Brown', amount: '$112.75', status: 'completed', date: '2024-11-29' },
]

export default function AdminDashboard() {
  const { inventory, getLowStockItems } = useInventoryStore()
  const { orders } = useOrderStore()
  const [activeTab, setActiveTab] = useState('overview')

  const lowStockItems = getLowStockItems()
  const totalInventoryValue = inventory.reduce((total, item) => total + (item.quantity * 25), 0) // Mock price calculation

  const tabs = [
    { id: 'overview', name: 'Overview' },
    { id: 'orders', name: 'Order Management' },
    { id: 'inventory', name: 'Inventory Tracking' },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'processing':
        return 'bg-blue-100 text-blue-800'
      case 'shipped':
        return 'bg-purple-100 text-purple-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <>
      <Navbar />
      
      <main className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
            <p className="text-gray-600">Manage your e-commerce store from one central location</p>
          </div>

          <div className="mb-8">
            <nav className="flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-2 px-4 text-sm font-medium rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>

          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat) => (
                  <div key={stat.name} className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex items-center">
                      <div className="bg-primary-100 p-3 rounded-lg">
                        <stat.icon className="h-6 w-6 text-primary-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                        <div className="flex items-center">
                          <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                          <div className={`ml-2 flex items-center text-sm ${
                            stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {stat.changeType === 'positive' ? (
                              <ArrowUpIcon className="h-4 w-4" />
                            ) : (
                              <ArrowDownIcon className="h-4 w-4" />
                            )}
                            <span className="ml-1">{stat.change}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Low Stock Alert */}
              {lowStockItems.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400 mr-2" />
                    <h3 className="text-sm font-medium text-yellow-800">
                      Low Stock Alert
                    </h3>
                  </div>
                  <p className="mt-1 text-sm text-yellow-700">
                    {lowStockItems.length} item{lowStockItems.length !== 1 ? 's' : ''} running low on stock.
                    <button
                      onClick={() => setActiveTab('inventory')}
                      className="ml-2 font-medium underline hover:no-underline"
                    >
                      View inventory →
                    </button>
                  </p>
                </div>
              )}

              {/* Recent Orders */}
              <div className="bg-white rounded-lg shadow-sm">
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Recent Orders</h3>
                </div>
                <div className="overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Order ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Customer
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {recentOrders.map((order) => (
                        <tr key={order.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {order.id}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {order.customer}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                            {order.amount}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                              {order.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {order.date}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Order Management</h3>
                <p className="text-gray-600 mt-1">View and manage all customer orders</p>
              </div>
              <div className="p-6">
                <div className="text-center py-12">
                  <ShoppingBagIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Order Management System</h3>
                  <p className="text-gray-500">
                    Full order management functionality would include order tracking, status updates, 
                    shipping management, and customer communication tools.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'inventory' && (
            <div className="space-y-8">
              <div className="bg-white rounded-lg shadow-sm">
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Inventory Overview</h3>
                  <p className="text-gray-600 mt-1">Current stock levels and inventory management</p>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-blue-900">Total Items</h4>
                      <p className="text-2xl font-bold text-blue-600">{inventory.length}</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-green-900">Total Stock</h4>
                      <p className="text-2xl font-bold text-green-600">
                        {inventory.reduce((total, item) => total + item.quantity, 0)}
                      </p>
                    </div>
                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-yellow-900">Low Stock Items</h4>
                      <p className="text-2xl font-bold text-yellow-600">{lowStockItems.length}</p>
                    </div>
                  </div>

                  <div className="overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Product ID
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Current Stock
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Reserved
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Available
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {inventory.map((item) => (
                          <tr key={item.productId} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              Product {item.productId}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {item.quantity}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {item.reserved}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                              {item.quantity - item.reserved}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {item.quantity <= item.reorderPoint ? (
                                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                                  Low Stock
                                </span>
                              ) : item.quantity <= item.reorderPoint * 2 ? (
                                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                  Medium Stock
                                </span>
                              ) : (
                                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                  In Stock
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </>
  )
}