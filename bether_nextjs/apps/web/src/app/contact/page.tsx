'use client';

import { useState } from 'react';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
import { Button } from '../../components/ui/button';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setSubmitStatus('success');
    setIsSubmitting(false);
    
    // Reset form after 3 seconds
    setTimeout(() => {
      setFormData({ name: '', email: '', company: '', message: '' });
      setSubmitStatus('idle');
    }, 3000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const contactMethods = [
    {
      title: 'Email Support',
      description: 'Get help with your account or technical questions',
      value: 'support@bether.com',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      )
    },
    {
      title: 'Sales Inquiries',
      description: 'Learn about enterprise plans and custom solutions',
      value: 'sales@bether.com',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      )
    },
    {
      title: 'General Inquiries',
      description: 'Questions about our platform or company',
      value: 'hello@bether.com',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      )
    }
  ];

  const offices = [
    {
      city: 'Stockholm',
      country: 'Sweden',
      address: 'Innovation District, 111 22 Stockholm',
      timezone: 'CET (UTC+1)',
      icon: '🇸🇪'
    },
    {
      city: 'San Francisco',
      country: 'United States',
      address: 'Tech Hub, CA 94105',
      timezone: 'PST (UTC-8)',
      icon: '🇺🇸'
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      {/* Hero Section */}
      <div className="pt-16 bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
              Get in
              <span className="text-blue-600"> Touch</span>
            </h1>
            <p className="mt-6 max-w-2xl mx-auto text-xl text-gray-500">
                             Have questions about Bether? We\'d love to hear from you. Send us a message and we\'ll respond as soon as possible.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* Contact Form */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-8">Send us a message</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Your full name"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="your.email@company.com"
                />
              </div>

              <div>
                <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-2">
                  Company
                </label>
                <input
                  type="text"
                  id="company"
                  name="company"
                  value={formData.company}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Your company (optional)"
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Tell us how we can help you..."
                />
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3"
              >
                {isSubmitting ? 'Sending...' : 'Send Message'}
              </Button>

              {submitStatus === 'success' && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-800">Thank you! Your message has been sent successfully.</p>
                </div>
              )}

              {submitStatus === 'error' && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-800">Sorry, there was an error sending your message. Please try again.</p>
                </div>
              )}
            </form>
          </div>

          {/* Contact Information */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-8">Contact Information</h2>
            
            <div className="space-y-8">
              {/* Contact Methods */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Get in touch</h3>
                <div className="space-y-4">
                  {contactMethods.map((method) => (
                    <div key={method.title} className="flex items-start space-x-4">
                      <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center text-white">
                        {method.icon}
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">{method.title}</h4>
                        <p className="text-sm text-gray-600">{method.description}</p>
                        <a href={`mailto:${method.value}`} className="text-sm text-blue-600 hover:text-blue-500">
                          {method.value}
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Office Locations */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Our Offices</h3>
                <div className="space-y-4">
                  {offices.map((office) => (
                    <div key={office.city} className="flex items-start space-x-4">
                      <div className="flex-shrink-0 w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-xl">
                        {office.icon}
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">{office.city}, {office.country}</h4>
                        <p className="text-sm text-gray-600">{office.address}</p>
                        <p className="text-sm text-gray-500">{office.timezone}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Support Links */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Support Resources</h3>
                <div className="space-y-2">
                  <a href="/docs" className="block text-sm text-blue-600 hover:text-blue-500">
                    📚 Documentation
                  </a>
                  <a href="/help" className="block text-sm text-blue-600 hover:text-blue-500">
                    ❓ Help Center
                  </a>
                  <a href="/status" className="block text-sm text-blue-600 hover:text-blue-500">
                    📊 System Status
                  </a>
                  <a href="/blog" className="block text-sm text-blue-600 hover:text-blue-500">
                    📝 Blog & Updates
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Frequently Asked Questions
            </h2>
            <p className="mt-4 text-xl text-gray-500">
              Quick answers to common questions
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">How do I get started with Bether?</h3>
              <p className="text-gray-600">Sign up for a free account and start building your first project. Our AI will guide you through the process.</p>
            </div>
            
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">What programming languages do you support?</h3>
              <p className="text-gray-600">We support JavaScript, TypeScript, Python, and many other popular languages and frameworks.</p>
            </div>
            
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Is there a free tier available?</h3>
              <p className="text-gray-600">Yes! We offer a generous free tier that includes basic AI code generation and project templates.</p>
            </div>
            
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">How secure is my code?</h3>
              <p className="text-gray-600">We take security seriously. All code is encrypted in transit and at rest, and we never store sensitive information.</p>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
