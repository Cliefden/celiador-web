'use client';

import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Sparkles, ShoppingCart, MessageSquare, BarChart3, Palette, Briefcase, Globe, Zap, ArrowRight } from 'lucide-react';

const templates = [
  {
    key: 'next-saas-starter',
    name: '🚀 SaaS MVP Starter',
    description: 'Complete SaaS boilerplate with auth, payments, and dashboard',
    icon: <Sparkles className="w-6 h-6 text-purple-500" />,
    color: 'from-purple-500 to-pink-500',
    features: ['Next.js 14', 'Stripe', 'Auth', 'Database'],
    preview: '/api/placeholder/400/300'
  },
  {
    key: 'ecommerce-storefront',
    name: '🛍️ E-commerce Store',
    description: 'Modern online store with cart, checkout, and admin panel',
    icon: <ShoppingCart className="w-6 h-6 text-green-500" />,
    color: 'from-green-500 to-emerald-500',
    features: ['React', 'Payment', 'Inventory', 'Orders'],
    preview: '/api/placeholder/400/300'
  },
  {
    key: 'ai-chat-app',
    name: '🤖 AI Chat App',
    description: 'ChatGPT-style interface with real-time conversations',
    icon: <MessageSquare className="w-6 h-6 text-blue-500" />,
    color: 'from-blue-500 to-cyan-500',
    features: ['OpenAI', 'Real-time', 'Chat UI', 'History'],
    preview: '/api/placeholder/400/300'
  },
  {
    key: 'dashboard-analytics',
    name: '📊 Analytics Dashboard',
    description: 'Beautiful data visualization with charts and metrics',
    icon: <BarChart3 className="w-6 h-6 text-orange-500" />,
    color: 'from-orange-500 to-red-500',
    features: ['Chart.js', 'Real-time', 'KPIs', 'Export'],
    preview: '/api/placeholder/400/300'
  },
  {
    key: 'portfolio-website',
    name: '🎨 Portfolio Site',
    description: 'Stunning personal portfolio with animations and CMS',
    icon: <Palette className="w-6 h-6 text-indigo-500" />,
    color: 'from-indigo-500 to-purple-500',
    features: ['Framer Motion', 'CMS', 'SEO', 'Mobile'],
    preview: '/api/placeholder/400/300'
  },
  {
    key: 'business-landing',
    name: '💼 Business Landing',
    description: 'High-converting landing page with contact forms',
    icon: <Briefcase className="w-6 h-6 text-slate-600" />,
    color: 'from-slate-600 to-slate-800',
    features: ['Lead Gen', 'Analytics', 'Forms', 'SEO'],
    preview: '/api/placeholder/400/300'
  }
];

export default function Templates() {
  return (
    <div className="py-16 bg-gradient-to-br from-slate-50 to-blue-50" id="templates">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4" />
            Professional Templates
          </div>
          <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-gray-900 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-6">
            Launch Your Dream Project
            <br />
            <span className="text-3xl md:text-4xl">In Minutes, Not Months</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Choose from our collection of professionally crafted templates. Each one is designed to get you from idea to deployment faster than ever.
          </p>
        </div>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {templates.map((template) => (
            <Card key={template.key} className="group hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 overflow-hidden border-0 bg-white/60 backdrop-blur-sm">
              {/* Template Preview */}
              <div className="relative h-48 bg-gradient-to-r overflow-hidden">
                <div className={`absolute inset-0 bg-gradient-to-r ${template.color} opacity-90`} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-white text-center">
                    <div className="mb-4">
                      {template.icon}
                    </div>
                    <div className="text-lg font-semibold">{template.name}</div>
                  </div>
                </div>
                <div className="absolute top-4 right-4">
                  <div className="bg-white/20 backdrop-blur-sm rounded-full p-2">
                    <ArrowRight className="w-4 h-4 text-white group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>

              {/* Template Info */}
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {template.name}
                </h3>
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {template.description}
                </p>
                
                {/* Features */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {template.features.map((feature, idx) => (
                    <span
                      key={idx}
                      className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600"
                    >
                      {feature}
                    </span>
                  ))}
                </div>

                <Button
                  variant="outline"
                  className="w-full group-hover:bg-gradient-to-r group-hover:from-purple-500 group-hover:to-pink-500 group-hover:text-white group-hover:border-transparent transition-all"
                  onClick={() => window.location.href = '/dashboard'}
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Start with this template
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-8 text-white">
            <h3 className="text-2xl font-bold mb-4">
              Ready to Build Something Amazing?
            </h3>
            <p className="text-purple-100 mb-6 max-w-2xl mx-auto">
              Join thousands of developers who are building faster with our AI-powered templates. 
              Start your project today and see the magic happen.
            </p>
            <Button
              size="lg"
              className="bg-white text-purple-600 hover:bg-purple-50 px-8 py-3 text-lg font-semibold"
              onClick={() => window.location.href = '/dashboard'}
            >
              <Sparkles className="w-5 h-5 mr-2" />
              Get Started Free
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}