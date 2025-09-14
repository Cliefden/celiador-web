'use client';

import Link from 'next/link';
import { useState } from 'react';

interface ContactFormData {
  name: string;
  email: string;
  company: string;
  role: string;
  subject: string;
  message: string;
}

export default function ContactView() {
  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    email: '',
    company: '',
    role: '',
    subject: '',
    message: ''
  });
  const [showingAlert, setShowingAlert] = useState(false);

  const contactInfo = [
    {
      icon: "✉️",
      title: "Email Us",
      details: "contact@celiador.com",
      description: "Get in touch for general inquiries"
    },
    {
      icon: "📞",
      title: "Call Us", 
      details: "+1 (555) 123-4567",
      description: "Speak with our sales team"
    },
    {
      icon: "📍",
      title: "Visit Us",
      details: "123 Tech Street, Innovation City",
      description: "Our headquarters location"
    },
    {
      icon: "🕒",
      title: "Business Hours",
      details: "Mon-Fri: 9AM-6PM EST",
      description: "We're here to help during business hours"
    }
  ];

  const isFormValid = formData.name && formData.email && formData.subject && formData.message;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    setShowingAlert(true);
    setFormData({ name: '', email: '', company: '', role: '', subject: '', message: '' });
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="text-xl font-bold text-blue-600">Celiador</Link>
            <div className="flex space-x-8">
              <Link href="/about" className="text-gray-600 hover:text-gray-900">About</Link>
              <Link href="/solutions" className="text-gray-600 hover:text-gray-900">Solutions</Link>
              <Link href="/contact" className="text-blue-600 font-medium">Contact</Link>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                Sign In
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main>
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-blue-50 to-green-50 pt-16 pb-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
              Get in Touch
            </h1>
            <p className="text-xl text-gray-600">
              Ready to transform your development workflow? We&apos;re here to help you get started and answer any questions about our platform.
            </p>
          </div>
        </section>

        {/* Contact Info Section */}
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {contactInfo.map((info) => (
                <div key={info.title} className="bg-white p-6 rounded-xl shadow-sm text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <span className="text-xl">{info.icon}</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{info.title}</h3>
                  <p className="font-medium text-blue-600 mb-1">{info.details}</p>
                  <p className="text-sm text-gray-600">{info.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Contact Form Section */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white p-8 rounded-2xl shadow-sm">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Send Us a Message</h2>
                <p className="text-gray-600">
                  Fill out the form below and we&apos;ll get back to you within 24 hours.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Name and Email */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="Your full name"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      placeholder="your@email.com"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>

                {/* Company and Role */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Company
                    </label>
                    <input
                      type="text"
                      value={formData.company}
                      onChange={(e) => setFormData({...formData, company: e.target.value})}
                      placeholder="Your company name"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Your Role
                    </label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({...formData, role: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select your role</option>
                      <option value="developer">Developer</option>
                      <option value="team_lead">Team Lead</option>
                      <option value="product_manager">Product Manager</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                {/* Subject */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Subject *
                  </label>
                  <select
                    value={formData.subject}
                    onChange={(e) => setFormData({...formData, subject: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">What can we help you with?</option>
                    <option value="demo">Schedule a Demo</option>
                    <option value="pricing">Pricing Information</option>
                    <option value="support">Technical Support</option>
                    <option value="partnership">Partnership Inquiry</option>
                    <option value="general">General Question</option>
                  </select>
                </div>

                {/* Message */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Message *
                  </label>
                  <textarea
                    value={formData.message}
                    onChange={(e) => setFormData({...formData, message: e.target.value})}
                    placeholder="Tell us about your project or question..."
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={!isFormValid}
                  className="w-full bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
                >
                  Send Message
                </button>
              </form>
            </div>

            {/* Additional Information */}
            <div className="mt-16 space-y-8">
              <div className="bg-white p-6 rounded-xl shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 mb-3">Sales Inquiries</h3>
                <p className="text-gray-600 mb-4">
                  Interested in learning more about our platform? Our sales team is ready to show you how Celiador can transform your development workflow.
                </p>
                <div className="text-sm text-gray-500 space-y-1">
                  <p><span className="font-medium">Email:</span> sales@celiador.com</p>
                  <p><span className="font-medium">Phone:</span> +1 (555) 123-4567</p>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 mb-3">Technical Support</h3>
                <p className="text-gray-600 mb-4">
                  Already using Celiador? Our technical support team is available 24/7 to help you with any platform-related questions or issues.
                </p>
                <div className="text-sm text-gray-500 space-y-1">
                  <p><span className="font-medium">Email:</span> support@celiador.com</p>
                  <p><span className="font-medium">Portal:</span> Available in your dashboard</p>
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-green-50 p-6 rounded-xl shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 mb-3">Partnership Opportunities</h3>
                <p className="text-gray-600 mb-4">
                  Interested in partnering with Celiador? We&apos;re always looking for strategic partnerships that can benefit our mutual developers.
                </p>
                <button className="border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 font-medium">
                  Learn About Partnerships
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Alert Modal */}
      {showingAlert && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Message Sent</h3>
            <p className="text-gray-600 mb-4">
              Thank you for your message. We&apos;ll get back to you within 24 hours.
            </p>
            <button
              onClick={() => setShowingAlert(false)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 w-full"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}