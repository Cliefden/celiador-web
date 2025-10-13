import { CeliadorLogo } from '../ui/celiador-logo';
import { Sparkles, Code, Zap, Users, Rocket, BarChart3, Terminal, Palette, Eye, GitBranch } from 'lucide-react';

const features = [
  {
    name: 'AI-Powered Code Generation',
    description: 'Transform natural language into production-ready code with Claude and ChatGPT integration. From simple components to complex full-stack applications.',
    icon: <Sparkles className="w-8 h-8" />,
    color: 'from-teal-500 to-cyan-500',
  },
  {
    name: 'Live Preview & Inspection',
    description: 'See your code come to life instantly with real-time previews. Inspect and modify UI elements directly in the browser.',
    icon: <Eye className="w-8 h-8" />,
    color: 'from-cyan-500 to-teal-500',
  },
  {
    name: 'Magic Templates',
    description: 'Start with stunning templates: SaaS starters, AI chat apps, e-commerce stores, and landing pages. Launch in minutes, not weeks.',
    icon: <Palette className="w-8 h-8" />,
    color: 'from-teal-600 to-cyan-600',
  },
  {
    name: 'Smart File Management',
    description: 'Intelligent file organization with AI-powered suggestions. Edit, create, and manage your project structure effortlessly.',
    icon: <Terminal className="w-8 h-8" />,
    color: 'from-cyan-600 to-teal-600',
  },
  {
    name: 'One-Click Deployment',
    description: 'Deploy to Vercel, Netlify, and other platforms with a single click. Automated CI/CD pipeline included.',
    icon: <Rocket className="w-8 h-8" />,
    color: 'from-teal-500 to-cyan-400',
  },
  {
    name: 'Real-time Collaboration',
    description: 'Work with your team in real-time. Share projects, review code, and build together with seamless collaboration tools.',
    icon: <Users className="w-8 h-8" />,
    color: 'from-cyan-500 to-teal-400',
  },
];

export default function Features() {
  return (
    <div className="py-20 bg-gradient-to-r from-teal-600 via-cyan-600 to-teal-600 relative overflow-hidden" id="features">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-1/4 right-1/4 w-40 h-40">
          <CeliadorLogo size="2xl" variant="icon" />
        </div>
        <div className="absolute bottom-1/4 left-1/4 w-32 h-32">
          <CeliadorLogo size="xl" variant="icon" />
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 mb-6">
            <CeliadorLogo size="sm" variant="icon" className="mr-2" />
            <span className="text-sm font-semibold text-white">Powerful Features</span>
          </div>
          <h2 className="text-4xl font-bold text-white sm:text-5xl mb-6">
            Everything you need to build
            <span className="block text-teal-100">
              truly lovable apps
            </span>
          </h2>
          <p className="max-w-3xl mx-auto text-xl text-teal-100 leading-relaxed">
            Our AI-powered platform combines intelligent code generation, real-time collaboration, 
            and seamless deployment to transform how you build applications.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <div 
              key={feature.name} 
              className="relative group bg-white/10 backdrop-blur-sm rounded-2xl p-8 shadow-lg shadow-black/10 hover:shadow-xl hover:shadow-black/20 transition-all duration-300 hover:-translate-y-1 border border-white/20"
            >
              <div className={`flex items-center justify-center w-16 h-16 rounded-2xl bg-white text-teal-600 shadow-lg shadow-black/25 mb-6 group-hover:scale-110 transition-transform duration-300`}>
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-white mb-4">{feature.name}</h3>
              <p className="text-teal-100 leading-relaxed">{feature.description}</p>
              
              {/* Decorative element */}
              <div className="absolute top-4 right-4 w-20 h-20 bg-white/5 rounded-full opacity-20 group-hover:opacity-30 transition-opacity duration-300"></div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <p className="text-lg text-teal-100 mb-4">Ready to experience the magic?</p>
          <div className="inline-flex items-center text-white font-semibold hover:text-teal-100 transition-colors duration-200 cursor-pointer">
            <span>Start building for free</span>
            <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
