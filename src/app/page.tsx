'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import Hero from '../components/landing/Hero';
import Features from '../components/landing/Features';
import Templates from '../components/landing/Templates';
import { Button } from '../components/ui/button';
import { useAuth } from '../contexts/AuthContext';

export default function HomePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  
  // Force Vercel redeploy to fix TypeError: Load failed

  useEffect(() => {
    console.log('HomePage: Auth state changed', { user: !!user, isLoading });
    
    // If user is authenticated, redirect to dashboard
    if (!isLoading && user) {
      console.log('HomePage: Redirecting to dashboard');
      router.push('/dashboard');
    }
  }, [user, isLoading, router]);

  // Debug: show current state
  console.log('HomePage render: isLoading:', isLoading, 'user:', !!user);

  // Show loading state while checking authentication (with timeout)
  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <span className="text-white font-bold text-lg">C</span>
          </div>
          <p className="text-gray-600">Loading...</p>
          <p className="text-xs text-gray-400 mt-2">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // If user is authenticated, show redirect message
  if (user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-lg">C</span>
          </div>
          <p className="text-gray-600">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      {/* Hero Section */}
      <Hero />
      
      {/* Features Section */}
      <Features />
      
      {/* Templates Section */}
      <Templates />
      
      {/* How It Works Section */}
      <div className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center">
            <h2 className="text-base text-blue-600 font-semibold tracking-wide uppercase">How It Works</h2>
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              Get started in minutes, not hours
            </p>
            <p className="mt-4 max-w-2xl text-xl text-gray-500 lg:mx-auto">
              Our streamlined process makes it easy to go from idea to deployed application.
            </p>
          </div>

          <div className="mt-10">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              <div className="text-center">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-600 text-white mx-auto">
                  <span className="text-xl font-bold">1</span>
                </div>
                <h3 className="mt-4 text-lg font-medium text-gray-900">Describe Your App</h3>
                <p className="mt-2 text-base text-gray-500">
                  Tell us what you want to build. Our AI understands natural language and generates the perfect starting point.
                </p>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-600 text-white mx-auto">
                  <span className="text-xl font-bold">2</span>
                </div>
                <h3 className="mt-4 text-lg font-medium text-gray-900">Generate & Customize</h3>
                <p className="mt-2 text-base text-gray-500">
                  Review the generated code, customize it to your needs, and add your own features and styling.
                </p>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-600 text-white mx-auto">
                  <span className="text-xl font-bold">3</span>
                </div>
                <h3 className="mt-4 text-lg font-medium text-gray-900">Deploy & Scale</h3>
                <p className="mt-2 text-base text-gray-500">
                  Deploy your application with one click. Our platform handles hosting, scaling, and monitoring.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8 lg:flex lg:items-center lg:justify-between">
          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            <span className="block">Ready to build better apps?</span>
            <span className="block text-blue-200">Start your free trial today.</span>
          </h2>
          <div className="mt-8 flex lg:mt-0 lg:flex-shrink-0">
            <div className="inline-flex rounded-md shadow">
              <Button 
                className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-blue-600 bg-white hover:bg-blue-50"
                onClick={() => window.location.href = '/dashboard'}
              >
                Get Started Free
              </Button>
            </div>
            <div className="ml-3 inline-flex rounded-md shadow">
              <Button 
                variant="outline" 
                className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                onClick={() => window.location.href = '/solutions'}
              >
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}