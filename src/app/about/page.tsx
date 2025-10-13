'use client';

import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
import { Button } from '../../components/ui/button';
import { CeliadorLogo } from '../../components/ui/celiador-logo';

const values = [
  {
    title: 'Innovation',
    description: 'We constantly push the boundaries of what\'s possible with AI and development tools.',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    )
  },
  {
    title: 'Quality',
    description: 'We believe in delivering tools that developers can trust and rely on every day.',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  },
  {
    title: 'User-Centric',
    description: 'Every feature we build is designed with developers\' needs and workflows in mind.',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    )
  }
];

const team = [
  {
    name: 'Stefan Crafoord-Wiklund',
    role: 'Founder & CEO',
    bio: 'Passionate about AI and developer productivity. Building tools that make development faster and more enjoyable.',
    image: '/team/stefan.jpg'
  },
  {
    name: 'AI Team',
    role: 'Machine Learning Engineers',
    bio: 'Our AI specialists work tirelessly to improve code generation, testing, and development automation.',
    image: '/team/ai.jpg'
  },
  {
    name: 'Product Team',
    role: 'Product & Design',
    bio: 'Creating intuitive interfaces and seamless user experiences that developers love to use.',
    image: '/team/product.jpg'
  }
];

const milestones = [
  {
    year: '2024',
    title: 'Celiador Founded',
    description: 'Started with a vision to revolutionize how developers build applications.'
  },
  {
    year: '2024',
    title: 'First AI Models',
    description: 'Developed and deployed our first AI-powered code generation models.'
  },
  {
    year: '2024',
    title: 'Beta Launch',
    description: 'Launched beta version with early adopters and gathered valuable feedback.'
  },
  {
    year: '2024',
    title: 'Public Launch',
    description: 'Made Celiador available to developers worldwide.'
  }
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-black">
      <Header />
      
      {/* Hero Section */}
      <div className="pt-16 bg-gradient-to-r from-teal-600 via-cyan-600 to-teal-600 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-1/4 right-1/4 w-40 h-40">
            <CeliadorLogo size="2xl" variant="icon" />
          </div>
          <div className="absolute bottom-1/4 left-1/4 w-32 h-32">
            <CeliadorLogo size="xl" variant="icon" />
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 relative z-10">
          <div className="text-center">
            <CeliadorLogo size="lg" variant="icon" className="mx-auto mb-6 opacity-90" />
            <h1 className="text-4xl font-extrabold text-white sm:text-5xl md:text-6xl">
              About
              <span className="text-teal-200"> Celiador</span>
            </h1>
            <p className="mt-6 max-w-2xl mx-auto text-xl text-teal-100">
              We're on a mission to help developers build truly lovable apps through the power of AI.
            </p>
          </div>
        </div>
      </div>

      {/* Mission Section */}
      <div className="py-16 bg-gradient-to-br from-gray-800 to-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center px-6 py-3 rounded-full bg-gradient-to-r from-teal-500/20 to-cyan-500/20 border border-teal-400/30 mb-6">
                <CeliadorLogo size="sm" variant="icon" className="mr-2" />
                <span className="text-sm font-semibold text-teal-300">Mission</span>
              </div>
              <h2 className="text-3xl font-extrabold text-white sm:text-4xl mb-6">
                Our 
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-cyan-400">
                  Mission
                </span>
              </h2>
              <p className="text-lg text-gray-300 mb-6">
                At Celiador, we believe that every developer deserves tools that amplify their creativity and productivity. 
                We're building the future of software development by combining cutting-edge AI with intuitive design.
              </p>
              <p className="text-lg text-gray-300 mb-8">
                Our platform helps developers generate code, test applications, and deploy projects faster than ever before. 
                We're not just building tools—we're building the foundation for truly lovable applications.
              </p>
              <Button variant="celiador">
                Join Our Mission
              </Button>
            </div>
            <div className="bg-gradient-to-br from-teal-600 via-cyan-600 to-teal-600 rounded-2xl p-8 text-white text-center shadow-xl">
              <CeliadorLogo size="xl" variant="icon" className="mx-auto mb-4 opacity-90" />
              <h3 className="text-2xl font-bold mb-4">Building the Future</h3>
              <p className="text-teal-100">
                Empowering developers to create truly lovable applications with AI-powered tools.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Values Section */}
      <div className="py-16 bg-gradient-to-br from-black to-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
              Our 
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-cyan-400">
                Values
              </span>
            </h2>
            <p className="mt-4 text-xl text-gray-300">
              The principles that guide everything we do
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {values.map((value) => (
              <div key={value.title} className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-8 shadow-lg shadow-black/20 text-center border border-gray-700/50">
                <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-lg text-white mx-auto mb-6">
                  {value.icon}
                </div>
                <h3 className="text-xl font-semibold text-white mb-4">{value.title}</h3>
                <p className="text-gray-300">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Team Section */}
      <div className="py-16 bg-gradient-to-br from-gray-800 to-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
              Meet Our 
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-cyan-400">
                Team
              </span>
            </h2>
            <p className="mt-4 text-xl text-gray-300">
              The passionate people behind Celiador
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {team.map((member) => (
              <div key={member.name} className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-8 shadow-lg shadow-black/20 text-center border border-gray-700/50">
                <div className="w-24 h-24 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-full mx-auto mb-6 flex items-center justify-center text-white text-2xl font-bold">
                  {member.name.split(' ').map(n => n[0]).join('')}
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">{member.name}</h3>
                <p className="text-teal-400 font-medium mb-4">{member.role}</p>
                <p className="text-gray-300">{member.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Timeline Section */}
      <div className="py-16 bg-gradient-to-br from-black to-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
              Our 
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-cyan-400">
                Journey
              </span>
            </h2>
            <p className="mt-4 text-xl text-gray-300">
              Key milestones in our company's history
            </p>
          </div>

          <div className="relative">
            <div className="absolute left-1/2 transform -translate-x-1/2 w-0.5 h-full bg-teal-400/30"></div>
            <div className="space-y-12">
              {milestones.map((milestone, index) => (
                <div key={`${milestone.year}-${index}`} className={`relative flex items-center ${index % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
                  <div className={`w-1/2 ${index % 2 === 0 ? 'pr-8 text-right' : 'pl-8 text-left'}`}>
                    <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 shadow-lg shadow-black/20 border border-gray-700/50">
                      <div className="text-2xl font-bold text-teal-400 mb-2">{milestone.year}</div>
                      <h3 className="text-xl font-semibold text-white mb-2">{milestone.title}</h3>
                      <p className="text-gray-300">{milestone.description}</p>
                    </div>
                  </div>
                  <div className="absolute left-1/2 transform -translate-x-1/2 w-4 h-4 bg-teal-400 rounded-full border-4 border-gray-800"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-teal-600 via-cyan-600 to-teal-600 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-1/4 w-32 h-32">
            <CeliadorLogo size="2xl" variant="icon" />
          </div>
          <div className="absolute bottom-0 right-1/4 w-24 h-24">
            <CeliadorLogo size="xl" variant="icon" />
          </div>
        </div>
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8 text-center relative z-10">
          <CeliadorLogo size="lg" variant="icon" className="mx-auto mb-6 opacity-90" />
          <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
            Join us in building truly lovable apps
          </h2>
          <p className="mt-4 text-xl text-teal-100">
            Be part of the revolution in software development.
          </p>
          <div className="mt-8 flex justify-center space-x-4">
            <Button className="!bg-white !text-teal-600 hover:!bg-gray-100 hover:!text-teal-700 !font-semibold">
              Get Started
            </Button>
            <Button className="!bg-transparent !text-white !border-2 !border-white hover:!bg-white hover:!text-teal-600 !font-semibold">
              View Careers
            </Button>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}