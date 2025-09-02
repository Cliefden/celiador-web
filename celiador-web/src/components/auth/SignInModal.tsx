'use client';

import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

interface SignInModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToSignUp: () => void;
}

export default function SignInModal({ isOpen, onClose, onSwitchToSignUp }: SignInModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { signIn } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('SignInModal: Form submitted with email:', email);
    setIsLoading(true);
    setError('');

    try {
      console.log('SignInModal: Calling signIn function...');
      const { error } = await signIn(email, password);
      console.log('SignInModal: SignIn response:', { error });

      if (error) {
        console.error('SignInModal: Sign in error:', error);
        setError(error.message || 'Failed to sign in');
      } else {
        console.log('SignInModal: Sign in successful, closing modal');
        onClose();
        // Redirect to dashboard will be handled by AuthContext
      }
    } catch (err) {
      console.error('SignInModal: Unexpected error:', err);
      setError('An unexpected error occurred');
    }

    setIsLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-8">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-lg">B</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Welcome back</h2>
          <p className="text-gray-600 mt-2">Sign in to your Bether account</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email address
            </label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              className="w-full"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              className="w-full"
            />
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3"
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-gray-600">
            Don't have an account?{' '}
            <button
              onClick={onSwitchToSignUp}
              className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
            >
              Sign up
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
