'use client';

import { useState } from 'react';
import { Brain, Star, MessageSquare, Sparkles, ArrowRight } from 'lucide-react';
import clsx from 'clsx';

interface LandingPageProps {
  onStartChat: () => void;
}

export function LandingPage({ onStartChat }: LandingPageProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-purple-700 to-purple-800 flex items-center justify-center p-6">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-400 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000"></div>
      </div>

      {/* Main card */}
      <div className="relative z-10 max-w-md w-full">
        <div 
          className={clsx(
            'bg-white rounded-3xl shadow-2xl overflow-hidden transition-all duration-500 transform',
            isHovered ? 'scale-105 shadow-purple-500/25' : 'hover:scale-105'
          )}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Header with icon */}
          <div className="bg-gradient-to-br from-purple-500 to-purple-700 px-8 py-12 text-center relative overflow-hidden">
            {/* Background pattern */}
            <div className="absolute inset-0 bg-white/10 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent)]"></div>
            
            {/* Main icon */}
            <div className="relative z-10 mb-6">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl shadow-lg mb-2">
                <Brain className="h-12 w-12 text-white" />
              </div>
              {/* Floating OpenAI logo simulation */}
              <div className="absolute top-12 right-6 w-8 h-8 bg-white/30 rounded-lg flex items-center justify-center backdrop-blur-sm">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
            </div>
            
            <h1 className="text-2xl font-bold text-white mb-2">AI Chat Assistant</h1>
            <p className="text-purple-100 text-sm leading-relaxed">
              Smart chatbot with OpenAI integration and beautiful UI
            </p>
          </div>

          {/* Content */}
          <div className="px-8 py-6">
            {/* Rating */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-1">
                <Star className="h-4 w-4 text-yellow-400 fill-current" />
                <span className="text-lg font-semibold text-gray-900">4.9</span>
                <span className="text-gray-500 text-sm ml-1">(2.1k reviews)</span>
              </div>
              <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-medium">
                Advanced
              </span>
            </div>

            {/* Features */}
            <div className="space-y-3 mb-8">
              <div className="flex items-center space-x-3 text-gray-700">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span className="text-sm">Real-time AI conversations</span>
              </div>
              <div className="flex items-center space-x-3 text-gray-700">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span className="text-sm">Beautiful modern interface</span>
              </div>
              <div className="flex items-center space-x-3 text-gray-700">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span className="text-sm">Typing indicators & animations</span>
              </div>
              <div className="flex items-center space-x-3 text-gray-700">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span className="text-sm">Works with or without API key</span>
              </div>
            </div>

            {/* CTA Button */}
            <button
              onClick={onStartChat}
              className={clsx(
                'w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white py-4 rounded-2xl font-semibold text-lg transition-all duration-300 flex items-center justify-center space-x-2 shadow-lg',
                'hover:from-purple-700 hover:to-purple-800 hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]'
              )}
            >
              <MessageSquare className="h-5 w-5" />
              <span>Start Chatting</span>
              <ArrowRight className="h-5 w-5" />
            </button>

            {/* Footer note */}
            <p className="text-xs text-gray-500 text-center mt-4">
              Demo mode available without API key
            </p>
          </div>
        </div>

        {/* Bottom decoration */}
        <div className="text-center mt-8">
          <p className="text-purple-200 text-sm">
            Built with ❤️ using Celiador
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}