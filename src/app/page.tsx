'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import Hero from '../components/landing/Hero';
import Features from '../components/landing/Features';
import Templates from '../components/landing/Templates';
import { Button } from '../components/ui/button';
import { CeliadorLogo } from '../components/ui/celiador-logo';
import { useAuth } from '../contexts/AuthContext';
import SignUpModal from '../components/auth/SignUpModal';
import SignInModal from '../components/auth/SignInModal';

export default function HomePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [isSignUpModalOpen, setIsSignUpModalOpen] = useState(false);
  const [isSignInModalOpen, setIsSignInModalOpen] = useState(false);
  
  // Testing Vercel deployment - 2025-09-16

  useEffect(() => {
    console.log('HomePage: Auth state changed', { user: !!user, isLoading, email: user?.email });
    
    // If user is authenticated, redirect to dashboard
    // Wait a bit to ensure auth state is stable
    if (!isLoading && user && user.email) {
      console.log('HomePage: User authenticated with email:', user.email, 'redirecting to dashboard');
      router.push('/dashboard');
    }
  }, [user, isLoading, router]);

  // Debug: show current state
  console.log('HomePage render: isLoading:', isLoading, 'user:', !!user);

  // Show loading state while checking authentication (with timeout)
  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <CeliadorLogo size="lg" variant="icon" className="mx-auto mb-4 animate-pulse" />
          <p className="text-gray-300">Loading...</p>
          <p className="text-xs text-gray-500 mt-2">Checking authentication...</p>
          <p className="text-xs text-red-400 mt-4">Debug: Auth timeout should trigger in 10s</p>
        </div>
      </div>
    );
  }

  // If user is authenticated, show redirect message
  if (user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <CeliadorLogo size="lg" variant="icon" className="mx-auto mb-4" />
          <p className="text-gray-300">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <Header onOpenSignUp={() => setIsSignUpModalOpen(true)} />
      
      {/* Hero Section */}
      <Hero onOpenSignUp={() => setIsSignUpModalOpen(true)} />
      
      {/* Features Section */}
      <Features />
      
      {/* Templates Section */}
      <Templates />
      
      {/* How It Works Section */}
      <div className="py-20 bg-gradient-to-br from-gray-800 to-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-6 py-3 rounded-full bg-gradient-to-r from-teal-500/20 to-cyan-500/20 border border-teal-400/30 mb-6">
              <CeliadorLogo size="sm" variant="icon" className="mr-2" />
              <span className="text-sm font-semibold text-teal-300">How It Works</span>
            </div>
            <h2 className="text-4xl font-bold text-white sm:text-5xl mb-6">
              From idea to deployment in
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-cyan-400">
                minutes, not hours
              </span>
            </h2>
            <p className="max-w-3xl mx-auto text-xl text-gray-300 leading-relaxed">
              Our streamlined process makes it effortless to go from concept to deployed application.
              Experience the magic of truly lovable development.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="text-center group">
              <div className="relative">
                <div className="flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-500 text-white mx-auto shadow-lg shadow-teal-500/25 group-hover:shadow-xl group-hover:shadow-teal-500/30 transition-all duration-300 group-hover:scale-110 mb-6">
                  <span className="text-2xl font-bold">1</span>
                </div>
                {/* Connector line */}
                <div className="hidden md:block absolute top-10 left-full w-full h-0.5 bg-gradient-to-r from-teal-400/50 to-cyan-400/50 opacity-40"></div>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Describe Your Vision</h3>
              <p className="text-gray-300 leading-relaxed">
                Tell us what you want to build in natural language. Our AI understands your vision 
                and generates the perfect starting point with intelligent scaffolding.
              </p>
            </div>
            
            <div className="text-center group">
              <div className="relative">
                <div className="flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-500 to-teal-500 text-white mx-auto shadow-lg shadow-cyan-500/25 group-hover:shadow-xl group-hover:shadow-cyan-500/30 transition-all duration-300 group-hover:scale-110 mb-6">
                  <span className="text-2xl font-bold">2</span>
                </div>
                {/* Connector line */}
                <div className="hidden md:block absolute top-10 left-full w-full h-0.5 bg-gradient-to-r from-cyan-400/50 to-teal-400/50 opacity-40"></div>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Build & Customize</h3>
              <p className="text-gray-300 leading-relaxed">
                Watch your app come to life with real-time previews. Edit code, inspect elements, 
                and customize everything with our intuitive development environment.
              </p>
            </div>
            
            <div className="text-center group">
              <div className="flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-teal-600 to-cyan-600 text-white mx-auto shadow-lg shadow-teal-600/25 group-hover:shadow-xl group-hover:shadow-teal-600/30 transition-all duration-300 group-hover:scale-110 mb-6">
                <span className="text-2xl font-bold">3</span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Deploy & Share</h3>
              <p className="text-gray-300 leading-relaxed">
                Deploy your application with one click to Vercel, Netlify, or your preferred platform. 
                Our system handles hosting, scaling, and performance optimization.
              </p>
            </div>
          </div>

          {/* Bottom feature highlight */}
          <div className="mt-16 text-center">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-gray-800/60 backdrop-blur-sm border border-teal-400/30">
              <span className="text-sm text-teal-300 font-medium">⚡ Average time from start to deployment: 10 minutes</span>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-teal-600 via-cyan-600 to-teal-600 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-32 h-32 opacity-10">
            <CeliadorLogo size="2xl" variant="icon" />
          </div>
          <div className="absolute bottom-0 right-1/4 w-24 h-24 opacity-5">
            <CeliadorLogo size="xl" variant="icon" />
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:py-20 lg:px-8 relative z-10">
          <div className="text-center">
            <CeliadorLogo size="lg" variant="icon" className="mx-auto mb-8 opacity-80" />
            <h2 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl mb-6">
              <span className="block">Ready to build</span>
              <span className="block text-teal-200">truly lovable apps?</span>
            </h2>
            <p className="max-w-3xl mx-auto text-xl text-teal-100 mb-10 leading-relaxed">
              Join thousands of developers who are building faster, better, and more lovable applications 
              with our AI-powered development platform. Start your journey today.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button 
                size="xl"
                className="!bg-white !text-teal-600 hover:!bg-gray-100 hover:!text-teal-700 px-8 py-4 text-lg !font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105"
                onClick={() => setIsSignUpModalOpen(true)}
              >
                Start Building Free
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Button>
              <Button 
                size="xl"
                className="!bg-transparent !text-white !border-2 !border-white hover:!bg-white hover:!text-teal-600 px-8 py-4 text-lg !font-semibold backdrop-blur-sm transition-all duration-300"
                onClick={() => window.location.href = '/solutions'}
              >
                Learn More
              </Button>
            </div>
            
            {/* Trust indicators */}
            <div className="mt-10 flex flex-wrap items-center justify-center gap-8 text-sm text-teal-200">
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                No credit card required
              </div>
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Free tier included
              </div>
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Cancel anytime
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
      
      {/* Auth Modals */}
      <SignInModal 
        isOpen={isSignInModalOpen}
        onClose={() => setIsSignInModalOpen(false)}
        onSwitchToSignUp={() => {
          setIsSignInModalOpen(false);
          setIsSignUpModalOpen(true);
        }}
      />
      
      <SignUpModal 
        isOpen={isSignUpModalOpen}
        onClose={() => setIsSignUpModalOpen(false)}
        onSwitchToSignIn={() => {
          setIsSignUpModalOpen(false);
          setIsSignInModalOpen(true);
        }}
      />
    </div>
  );
}