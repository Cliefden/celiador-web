import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
import { Button } from '../../components/ui/button';

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
    title: 'Bether Founded',
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
    description: 'Made Bether available to developers worldwide.'
  }
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      {/* Hero Section */}
      <div className="pt-16 bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
              About
              <span className="text-blue-600"> Bether</span>
            </h1>
            <p className="mt-6 max-w-2xl mx-auto text-xl text-gray-500">
              We\'re on a mission to make software development faster, more efficient, and more enjoyable through the power of AI.
            </p>
          </div>
        </div>
      </div>

      {/* Mission Section */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl mb-6">
                Our Mission
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                At Bether, we believe that every developer deserves tools that amplify their creativity and productivity. 
                We\'re building the future of software development by combining cutting-edge AI with intuitive design.
              </p>
              <p className="text-lg text-gray-600 mb-8">
                Our platform helps developers generate code, test applications, and deploy projects faster than ever before. 
                We\'re not just building tools—we\'re building the foundation for the next generation of software development.
              </p>
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">
                Join Our Mission
              </Button>
            </div>
            <div className="bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 rounded-2xl p-8 text-white text-center">
              <div className="text-6xl mb-4">🚀</div>
              <h3 className="text-2xl font-bold mb-4">Building the Future</h3>
              <p className="text-blue-100">
                Empowering developers to create amazing applications with AI-powered tools.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Values Section */}
      <div className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Our Values
            </h2>
            <p className="mt-4 text-xl text-gray-500">
              The principles that guide everything we do
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {values.map((value) => (
              <div key={value.title} className="bg-white rounded-xl p-8 shadow-lg text-center">
                <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg text-white mx-auto mb-6">
                  {value.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">{value.title}</h3>
                <p className="text-gray-600">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Team Section */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Meet Our Team
            </h2>
            <p className="mt-4 text-xl text-gray-500">
              The passionate people behind Bether
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {team.map((member) => (
              <div key={member.name} className="bg-white rounded-xl p-8 shadow-lg text-center border border-gray-200">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full mx-auto mb-6 flex items-center justify-center text-white text-2xl font-bold">
                  {member.name.split(' ').map(n => n[0]).join('')}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{member.name}</h3>
                <p className="text-blue-600 font-medium mb-4">{member.role}</p>
                <p className="text-gray-600">{member.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Timeline Section */}
      <div className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Our Journey
            </h2>
            <p className="mt-4 text-xl text-gray-500">
              Key milestones in our company\'s history
            </p>
          </div>

          <div className="relative">
            <div className="absolute left-1/2 transform -translate-x-1/2 w-0.5 h-full bg-gray-300"></div>
            <div className="space-y-12">
              {milestones.map((milestone, index) => (
                <div key={milestone.year} className={`relative flex items-center ${index % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
                  <div className={`w-1/2 ${index % 2 === 0 ? 'pr-8 text-right' : 'pl-8 text-left'}`}>
                    <div className="bg-white rounded-lg p-6 shadow-lg">
                      <div className="text-2xl font-bold text-blue-600 mb-2">{milestone.year}</div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">{milestone.title}</h3>
                      <p className="text-gray-600">{milestone.description}</p>
                    </div>
                  </div>
                  <div className="absolute left-1/2 transform -translate-x-1/2 w-4 h-4 bg-blue-600 rounded-full border-4 border-white"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8 text-center">
          <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
            Join us in shaping the future of development
          </h2>
          <p className="mt-4 text-xl text-blue-100">
            Be part of the revolution in software development.
          </p>
          <div className="mt-8 flex justify-center space-x-4">
            <Button className="bg-white text-blue-600 hover:bg-blue-50">
              Get Started
            </Button>
            <Button variant="outline" className="text-white border-white hover:bg-white hover:text-blue-600">
              View Careers
            </Button>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}