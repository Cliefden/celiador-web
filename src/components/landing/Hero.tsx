'use client';

import { Button } from '../ui/button';
import { CeliadorLogo } from '../ui/celiador-logo';
import { ArrowRight, Sparkles, Code, Zap, Play, CheckCircle, Terminal, Palette } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface HeroProps {
  onOpenSignUp?: () => void;
}

export default function Hero({ onOpenSignUp }: HeroProps) {
  const router = useRouter();

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-gray-800 via-gray-900 to-gray-700 min-h-screen">
      {/* Enhanced decorative background */}
      <div className="absolute inset-0 z-0">
        {/* Floating geometric shapes based on logo */}
        <div className="absolute top-1/4 left-1/4 w-32 h-32 opacity-20">
          <CeliadorLogo size="2xl" variant="icon" animate />
        </div>
        <div className="absolute bottom-1/4 right-1/4 w-24 h-24 opacity-15">
          <CeliadorLogo size="xl" variant="icon" />
        </div>
        
        {/* Soft gradient orbs */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-radial from-teal-500/20 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-radial from-cyan-500/20 to-transparent rounded-full blur-3xl"></div>
        
        {/* Subtle grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,_theme(colors.gray.800)_1px,_transparent_1px),linear-gradient(to_bottom,_theme(colors.gray.800)_1px,_transparent_1px)] bg-[size:3rem_3rem] opacity-30"></div>
      </div>
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="pt-32 pb-20 sm:pt-40 sm:pb-24">
          <div className="text-center">
            {/* Main logo - centered and prominent */}
            <div className="mb-12">
              <div className="flex items-center justify-center mb-6">
                <CeliadorLogo 
                  size="xl" 
                  variant="icon" 
                  className="mr-4" 
                  animate 
                />
                <div className="text-left">
                  <h2 className="text-4xl font-bold text-white tracking-tight">Celiador</h2>
                  <p className="text-sm font-medium tracking-widest text-teal-400 uppercase">Truly Lovable</p>
                </div>
              </div>
              <div className="inline-flex items-center px-6 py-3 rounded-full bg-gradient-to-r from-teal-500/20 to-cyan-500/20 border border-teal-400/30 backdrop-blur-sm">
                <Sparkles className="h-4 w-4 text-teal-400 mr-2" />
                <span className="text-sm font-semibold text-teal-300">AI-Powered Development Platform</span>
              </div>
            </div>
            
            {/* Hero headline */}
            <h1 className="text-5xl tracking-tight font-bold text-white sm:text-6xl md:text-7xl lg:text-8xl mb-8">
              <span className="block mb-4">Build</span>
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-cyan-400 to-teal-300">
                Truly Lovable Apps
              </span>
            </h1>
            
            {/* Enhanced subtitle */}
            <p className="max-w-3xl mx-auto text-xl text-gray-300 sm:text-2xl leading-relaxed mb-12">
              Transform your ideas into production-ready applications with intelligent code generation, 
              real-time previews, and seamless deployment. Experience the future of development.
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <Button
                variant="celiador"
                size="xl"
                className="text-lg px-8 py-4 shadow-xl shadow-teal-500/25 hover:shadow-2xl hover:shadow-teal-500/30 transition-all duration-300"
                onClick={() => onOpenSignUp ? onOpenSignUp() : router.push('/dashboard')}
              >
                Start Building Free
                <ArrowRight className="ml-2 h-6 w-6" />
              </Button>
              <Button
                variant="celiador-outline"
                size="xl"
                className="text-lg px-8 py-4 backdrop-blur-sm"
                onClick={() => router.push('/solutions')}
              >
                <Play className="mr-2 h-6 w-6" />
                Watch Demo
              </Button>
            </div>
            
            {/* Trust indicators */}
            <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-gray-400 mb-20">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-teal-400 mr-2" />
                No credit card required
              </div>
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-teal-400 mr-2" />
                Free tier included
              </div>
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-teal-400 mr-2" />
                Cancel anytime
              </div>
            </div>
          </div>
          
          {/* Features Grid */}
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div className="text-center group">
              <div className="flex items-center justify-center w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-500 text-white shadow-lg shadow-teal-500/25 group-hover:shadow-xl group-hover:shadow-teal-500/30 transition-all duration-300 group-hover:scale-110">
                <Sparkles className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">AI-Powered</h3>
              <p className="text-gray-300">Natural language to production-ready code</p>
            </div>
            
            <div className="text-center group">
              <div className="flex items-center justify-center w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-cyan-500 to-teal-500 text-white shadow-lg shadow-cyan-500/25 group-hover:shadow-xl group-hover:shadow-cyan-500/30 transition-all duration-300 group-hover:scale-110">
                <Code className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Live Preview</h3>
              <p className="text-gray-300">See your app come to life instantly</p>
            </div>
            
            <div className="text-center group">
              <div className="flex items-center justify-center w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-teal-600 to-cyan-600 text-white shadow-lg shadow-teal-600/25 group-hover:shadow-xl group-hover:shadow-teal-600/30 transition-all duration-300 group-hover:scale-110">
                <Terminal className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Full Control</h3>
              <p className="text-gray-300">Edit, inspect, and customize everything</p>
            </div>
            
            <div className="text-center group">
              <div className="flex items-center justify-center w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-cyan-600 to-teal-600 text-white shadow-lg shadow-cyan-600/25 group-hover:shadow-xl group-hover:shadow-cyan-600/30 transition-all duration-300 group-hover:scale-110">
                <Zap className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">One-Click Deploy</h3>
              <p className="text-gray-300">From concept to production in minutes</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
