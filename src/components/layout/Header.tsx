'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '../ui/button';
import { CeliadorLogo } from '../ui/celiador-logo';
import { useAuth } from '../../contexts/AuthContext';
import { SettingsPanel } from '../settings/SettingsPanel';
import SignInModal from '../auth/SignInModal';
import SignUpModal from '../auth/SignUpModal';

export default function Header() {
  const { user, profile, signOut } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSignInModalOpen, setIsSignInModalOpen] = useState(false);
  const [isSignUpModalOpen, setIsSignUpModalOpen] = useState(false);

  const navigation = [
    { name: 'Solutions', href: '/solutions' },
    { name: 'About Us', href: '/about' },
    { name: 'Contact', href: '/contact' },
  ];

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-gray-900/50 backdrop-blur-md border-b border-gray-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex-shrink-0">
              <Link href="/" className="flex items-center">
                <CeliadorLogo size="md" variant="icon" className="hover:scale-105 transition-transform duration-200" animate />
                <span className="ml-3 text-xl font-bold text-white hidden sm:block">Celiador</span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-8">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="text-gray-300 hover:text-white px-3 py-2 text-sm font-medium transition-colors duration-200"
                >
                  {item.name}
                </Link>
              ))}
            </nav>

            {/* Desktop Auth Buttons */}
            <div className="hidden md:flex items-center space-x-4">
              {user ? (
                <>
                  <div className="flex items-center space-x-3">
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {profile?.full_name || profile?.username || user.email}
                      </p>
                      <p className="text-xs text-gray-500 capitalize">
                        {profile?.role || 'user'}
                      </p>
                    </div>
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-xs">
                        {(profile?.full_name || profile?.username || user.email || 'U').charAt(0).toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <SettingsPanel />
                  <Button 
                    variant="ghost" 
                    className="text-gray-300 hover:text-white"
                    onClick={() => window.location.href = '/dashboard'}
                  >
                    Dashboard
                  </Button>
                  <Button 
                    variant="outline"
                    className="text-gray-300 hover:text-white border-gray-600 hover:border-gray-400"
                    onClick={handleLogout}
                  >
                    Sign Out
                  </Button>
                </>
              ) : (
                <>
                  <Button 
                    variant="ghost" 
                    className="text-gray-300 hover:text-white"
                    onClick={() => setIsSignInModalOpen(true)}
                  >
                    Sign In
                  </Button>
                  <Button 
                    variant="celiador"
                    onClick={() => setIsSignUpModalOpen(true)}
                  >
                    Get Started
                  </Button>
                </>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="text-gray-300 hover:text-white focus:outline-none focus:text-white"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {isMobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {isMobileMenuOpen && (
            <div className="md:hidden">
              <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-gray-800/95 backdrop-blur-md border-t border-gray-700/50">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="text-gray-300 hover:text-white block px-3 py-2 text-base font-medium transition-colors duration-200"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                ))}
                
                <div className="pt-4 space-y-2">
                  {user ? (
                    <>
                      <div className="px-3 py-2 border-t border-gray-700/50">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-white">
                              {profile?.full_name || profile?.username || user.email}
                            </p>
                            <p className="text-xs text-gray-400 capitalize">
                              {profile?.role || 'user'}
                            </p>
                          </div>
                          <SettingsPanel />
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        className="w-full text-gray-300 hover:text-white"
                        onClick={() => window.location.href = '/dashboard'}
                      >
                        Dashboard
                      </Button>
                      <Button 
                        variant="outline"
                        className="w-full text-gray-300 hover:text-white border-gray-600 hover:border-gray-400"
                        onClick={handleLogout}
                      >
                        Sign Out
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button 
                        variant="ghost" 
                        className="w-full text-gray-300 hover:text-white"
                        onClick={() => setIsSignInModalOpen(true)}
                      >
                        Sign In
                      </Button>
                      <Button 
                        variant="celiador"
                        className="w-full"
                        onClick={() => setIsSignUpModalOpen(true)}
                      >
                        Get Started
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

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
    </>
  );
}
