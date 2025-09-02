import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
import { Button } from '../../components/ui/button';

const solutions = [
  {
    title: 'Enterprise Solutions',
    description: 'Scale your development team with AI-powered tools designed for enterprise workflows.',
    features: [
      'Team collaboration and project management',
      'Advanced security and compliance',
      'Custom integrations and APIs',
      'Dedicated support and training',
      'SLA guarantees and uptime monitoring'
    ],
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    )
  },
  {
    title: 'Developer Tools',
    description: 'Supercharge your development workflow with intelligent code generation and testing.',
    features: [
      'AI-powered code generation',
      'Automated testing and quality assurance',
      'Real-time collaboration tools',
      'Version control integration',
      'Performance monitoring and optimization'
    ],
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
      </svg>
    )
  },
  {
    title: 'Project Templates',
    description: 'Start with proven templates and customize them to your specific needs.',
    features: [
      'Next.js and React templates',
      'Vue.js and Angular options',
      'Full-stack application templates',
      'E-commerce and SaaS starters',
      'Mobile-responsive designs'
    ],
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    )
  }
];

const useCases = [
  {
    title: 'Startups',
    description: 'Move fast and build MVPs quickly with AI-powered development.',
    benefits: ['Rapid prototyping', 'Cost-effective development', 'Scalable architecture']
  },
  {
    title: 'Agencies',
    description: 'Deliver projects faster and more efficiently for your clients.',
    benefits: ['Faster delivery times', 'Higher quality output', 'Better client satisfaction']
  },
  {
    title: 'Enterprises',
    description: 'Scale development teams and maintain code quality at enterprise level.',
    benefits: ['Team productivity', 'Code consistency', 'Security compliance']
  }
];

export default function SolutionsPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      {/* Hero Section */}
      <div className="pt-16 bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
              Solutions for Every
              <span className="text-blue-600"> Team</span>
            </h1>
            <p className="mt-6 max-w-2xl mx-auto text-xl text-gray-500">
              Whether you&apos;re a startup, agency, or enterprise, we have the tools and solutions to accelerate your development process.
            </p>
          </div>
        </div>
      </div>

      {/* Solutions Section */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Comprehensive Development Solutions
            </h2>
            <p className="mt-4 text-xl text-gray-500">
              Choose the solution that fits your team size and requirements
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {solutions.map((solution) => (
              <div key={solution.title} className="bg-white rounded-xl shadow-lg p-8 border border-gray-200 hover:shadow-xl transition-shadow duration-300">
                <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg text-white mb-6">
                  {solution.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">{solution.title}</h3>
                <p className="text-gray-600 mb-6">{solution.description}</p>
                <ul className="space-y-3">
                  {solution.features.map((feature) => (
                    <li key={feature} className="flex items-center text-sm text-gray-600">
                      <svg className="w-4 h-4 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
                <div className="mt-8">
                  <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">
                    Learn More
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Use Cases Section */}
      <div className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Perfect for Every Team
            </h2>
            <p className="mt-4 text-xl text-gray-500">
              See how different organizations use Bether to accelerate their development
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {useCases.map((useCase) => (
              <div key={useCase.title} className="bg-white rounded-xl p-8 shadow-lg">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">{useCase.title}</h3>
                <p className="text-gray-600 mb-6">{useCase.description}</p>
                <div className="space-y-2">
                  {useCase.benefits.map((benefit) => (
                    <div key={benefit} className="flex items-center text-sm text-gray-600">
                      <div className="w-2 h-2 bg-blue-600 rounded-full mr-3"></div>
                      {benefit}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8 text-center">
          <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
            Ready to accelerate your development?
          </h2>
          <p className="mt-4 text-xl text-blue-100">
            Start building better apps with AI-powered tools today.
          </p>
          <div className="mt-8 flex justify-center space-x-4">
            <Button className="bg-white text-blue-600 hover:bg-blue-50">
              Get Started Free
            </Button>
            <Button variant="outline" className="text-white border-white hover:bg-white hover:text-blue-600">
              Contact Sales
            </Button>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}