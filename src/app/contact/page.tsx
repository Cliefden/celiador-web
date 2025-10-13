'use client';

import Link from 'next/link';
import { useState } from 'react';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
import { CeliadorLogo } from '../../components/ui/celiador-logo';

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
    <div className="min-h-screen bg-black">
      <Header />

      <main>
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-teal-600 via-cyan-600 to-teal-600 relative overflow-hidden pt-16 pb-16">
          {/* Background decoration */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-1/4 right-1/4 w-40 h-40">
              <CeliadorLogo size="2xl" variant="icon" />
            </div>
            <div className="absolute bottom-1/4 left-1/4 w-32 h-32">
              <CeliadorLogo size="xl" variant="icon" />
            </div>
          </div>
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
            <CeliadorLogo size="lg" variant="icon" className="mx-auto mb-6 opacity-90" />
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-6">
              Get in Touch
            </h1>
            <p className="text-xl text-teal-100">
              Ready to build truly lovable apps? We're here to help you get started and answer any questions about our platform.
            </p>
          </div>
        </section>

        {/* Contact Info Section */}
        <section className="py-16 bg-gradient-to-br from-gray-800 to-black">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {contactInfo.map((info) => (
                <div key={info.title} className="bg-gray-900/50 backdrop-blur-sm p-6 rounded-xl shadow-lg shadow-black/20 text-center border border-gray-700/50">
                  <div className="w-12 h-12 bg-teal-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <span className="text-xl">{info.icon}</span>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">{info.title}</h3>
                  <p className="font-medium text-teal-400 mb-1">{info.details}</p>
                  <p className="text-sm text-gray-300">{info.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Contact Form Section */}
        <section className="py-16 bg-gradient-to-br from-black to-gray-900">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-gray-900/50 backdrop-blur-sm p-8 rounded-2xl shadow-lg shadow-black/20 border border-gray-700/50">
              <div className="mb-8">
                <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-teal-500/20 to-cyan-500/20 border border-teal-400/30 mb-4">
                  <CeliadorLogo size="sm" variant="icon" className="mr-2" />
                  <span className="text-sm font-semibold text-teal-300">Contact</span>
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Send Us a Message</h2>
                <p className="text-gray-300">
                  Fill out the form below and we'll get back to you within 24 hours.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Name and Email */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="Your full name"
                      className="w-full px-3 py-2 border border-gray-600 bg-gray-800/50 text-white placeholder-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      placeholder="your@email.com"
                      className="w-full px-3 py-2 border border-gray-600 bg-gray-800/50 text-white placeholder-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                      required
                    />
                  </div>
                </div>

                {/* Company and Role */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Company
                    </label>
                    <input
                      type="text"
                      value={formData.company}
                      onChange={(e) => setFormData({...formData, company: e.target.value})}
                      placeholder="Your company name"
                      className="w-full px-3 py-2 border border-gray-600 bg-gray-800/50 text-white placeholder-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Your Role
                    </label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({...formData, role: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-600 bg-gray-800/50 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
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
                  <label className="block text-sm font-medium text-white mb-2">
                    Subject *
                  </label>
                  <select
                    value={formData.subject}
                    onChange={(e) => setFormData({...formData, subject: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-600 bg-gray-800/50 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
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
                  <label className="block text-sm font-medium text-white mb-2">
                    Message *
                  </label>
                  <textarea
                    value={formData.message}
                    onChange={(e) => setFormData({...formData, message: e.target.value})}
                    placeholder="Tell us about your project or question..."
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-600 bg-gray-800/50 text-white placeholder-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    required
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={!isFormValid}
                  className="w-full bg-gradient-to-r from-teal-500 to-cyan-500 text-white px-6 py-3 rounded-md hover:from-teal-600 hover:to-cyan-600 disabled:bg-gray-600 disabled:cursor-not-allowed font-medium transition-all duration-200"
                >
                  Send Message
                </button>
              </form>
            </div>

            {/* Additional Information */}
            <div className="mt-16 space-y-8">
              <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl shadow-lg shadow-black/20 border border-gray-700/50">
                <h3 className="text-lg font-bold text-white mb-3">Sales Inquiries</h3>
                <p className="text-gray-300 mb-4">
                  Interested in learning more about our platform? Our sales team is ready to show you how Celiador can help you build truly lovable apps.
                </p>
                <div className="text-sm text-gray-400 space-y-1">
                  <p><span className="font-medium text-teal-400">Email:</span> sales@celiador.com</p>
                  <p><span className="font-medium text-teal-400">Phone:</span> +1 (555) 123-4567</p>
                </div>
              </div>

              <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl shadow-lg shadow-black/20 border border-gray-700/50">
                <h3 className="text-lg font-bold text-white mb-3">Technical Support</h3>
                <p className="text-gray-300 mb-4">
                  Already using Celiador? Our technical support team is available 24/7 to help you with any platform-related questions or issues.
                </p>
                <div className="text-sm text-gray-400 space-y-1">
                  <p><span className="font-medium text-teal-400">Email:</span> support@celiador.com</p>
                  <p><span className="font-medium text-teal-400">Portal:</span> Available in your dashboard</p>
                </div>
              </div>

              <div className="bg-gradient-to-br from-teal-600/20 to-cyan-600/20 backdrop-blur-sm p-6 rounded-xl shadow-lg shadow-black/20 border border-teal-400/30">
                <h3 className="text-lg font-bold text-white mb-3">Partnership Opportunities</h3>
                <p className="text-teal-100 mb-4">
                  Interested in partnering with Celiador? We're always looking for strategic partnerships that can benefit our mutual developers.
                </p>
                <button className="border border-teal-400 text-teal-400 px-4 py-2 rounded-md hover:bg-teal-400 hover:text-white transition-all duration-200 font-medium">
                  Learn About Partnerships
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />

      {/* Alert Modal */}
      {showingAlert && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-700 p-6 rounded-lg shadow-xl max-w-md mx-4">
            <h3 className="text-lg font-semibold text-white mb-2">Message Sent</h3>
            <p className="text-gray-300 mb-4">
              Thank you for your message. We'll get back to you within 24 hours.
            </p>
            <button
              onClick={() => setShowingAlert(false)}
              className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white px-4 py-2 rounded-md hover:from-teal-600 hover:to-cyan-600 w-full transition-all duration-200"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}