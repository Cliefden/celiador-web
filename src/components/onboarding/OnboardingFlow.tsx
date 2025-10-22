'use client';

import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { 
  Sparkles, 
  ArrowRight, 
  ArrowLeft,
  Check,
  Rocket,
  Code,
  Globe,
  MessageSquare,
  FileText,
  Layers,
  Zap,
  Github,
  Play,
  ChevronRight,
  Heart,
  Star,
  Target,
  BookOpen
} from 'lucide-react';

interface OnboardingFlowProps {
  userName?: string;
  onComplete: () => void;
  onCreateFirstProject: () => void;
}

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  content: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'default' | 'secondary';
  };
}

export function OnboardingFlow({ userName, onComplete, onCreateFirstProject }: OnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  const steps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: `Welcome to Celiador${userName ? `, ${userName}` : ''}! 🎉`,
      description: 'Your AI-powered development platform',
      content: (
        <div className="text-center py-8">
          <div className="w-24 h-24 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Sparkles className="w-12 h-12 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Build Apps with AI
          </h3>
          <p className="text-gray-600 text-lg mb-6 max-w-md mx-auto">
            Transform your ideas into fully functional web applications using AI-powered development tools.
          </p>
          <div className="flex flex-wrap justify-center gap-3 mb-6">
            <Badge variant="secondary" className="px-3 py-1">
              <Zap className="w-3 h-3 mr-1" />
              Fast Development
            </Badge>
            <Badge variant="secondary" className="px-3 py-1">
              <Github className="w-3 h-3 mr-1" />
              Git Integration
            </Badge>
            <Badge variant="secondary" className="px-3 py-1">
              <Globe className="w-3 h-3 mr-1" />
              Auto Deployment
            </Badge>
          </div>
        </div>
      )
    },
    {
      id: 'how-it-works',
      title: 'How Celiador Works',
      description: 'Three simple steps to build your app',
      content: (
        <div className="py-6">
          <div className="space-y-6">
            <div className="flex items-start space-x-4">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-blue-600 font-semibold text-sm">1</span>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Choose a Template</h4>
                <p className="text-gray-600 text-sm">Start with professional templates for blogs, e-commerce, landing pages, or AI chat apps.</p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-purple-600 font-semibold text-sm">2</span>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Customize with AI</h4>
                <p className="text-gray-600 text-sm">Use our AI assistant to modify design, add features, and customize functionality with natural language.</p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-green-600 font-semibold text-sm">3</span>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Deploy & Share</h4>
                <p className="text-gray-600 text-sm">Automatically deploy to Vercel and GitHub. Share your live app with the world in minutes.</p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'features',
      title: 'Powerful Features',
      description: 'Everything you need to build professional apps',
      content: (
        <div className="py-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <MessageSquare className="w-8 h-8 text-blue-600 mb-2" />
              <h4 className="font-semibold text-gray-900 text-sm mb-1">AI Assistant</h4>
              <p className="text-gray-600 text-xs">Chat with AI to modify your app in real-time</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <FileText className="w-8 h-8 text-green-600 mb-2" />
              <h4 className="font-semibold text-gray-900 text-sm mb-1">Live Preview</h4>
              <p className="text-gray-600 text-xs">See changes instantly in your browser</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <Github className="w-8 h-8 text-purple-600 mb-2" />
              <h4 className="font-semibold text-gray-900 text-sm mb-1">Git Integration</h4>
              <p className="text-gray-600 text-xs">Automatic GitHub repository creation</p>
            </div>
            <div className="bg-orange-50 rounded-lg p-4">
              <Globe className="w-8 h-8 text-orange-600 mb-2" />
              <h4 className="font-semibold text-gray-900 text-sm mb-1">Auto Deploy</h4>
              <p className="text-gray-600 text-xs">One-click deployment to Vercel</p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'templates',
      title: 'Choose Your Starting Point',
      description: 'Professional templates for every use case',
      content: (
        <div className="py-6">
          <div className="space-y-3">
            <div className="border border-gray-200 rounded-lg p-3 hover:border-blue-300 transition-colors">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <FileText className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 text-sm">Blog Platform</h4>
                  <p className="text-gray-500 text-xs">Content management with SEO optimization</p>
                </div>
                <Badge variant="secondary" className="text-xs">Popular</Badge>
              </div>
            </div>
            <div className="border border-gray-200 rounded-lg p-3 hover:border-purple-300 transition-colors">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Rocket className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 text-sm">E-commerce Store</h4>
                  <p className="text-gray-500 text-xs">Full online store with Stripe integration</p>
                </div>
                <Badge variant="secondary" className="text-xs">Pro</Badge>
              </div>
            </div>
            <div className="border border-gray-200 rounded-lg p-3 hover:border-green-300 transition-colors">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                  <MessageSquare className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 text-sm">AI Chat App</h4>
                  <p className="text-gray-500 text-xs">Conversational AI interface</p>
                </div>
                <Badge variant="secondary" className="text-xs">New</Badge>
              </div>
            </div>
          </div>
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-gray-600 text-xs text-center">
              💡 Don't worry - you can always change and customize these later!
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'create-project',
      title: 'Ready to Start Building?',
      description: 'Create your first project now',
      content: (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Play className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-4">
            Let's Create Your First Project!
          </h3>
          <p className="text-gray-600 mb-6 max-w-sm mx-auto">
            Click the button below to open the project creation wizard and start building your app.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-center space-x-2 text-blue-600">
              <Star className="w-4 h-4" />
              <span className="text-sm font-medium">Pro Tip</span>
            </div>
            <p className="text-blue-700 text-sm mt-1">
              Your project will be ready in under 2 minutes!
            </p>
          </div>
        </div>
      ),
      action: {
        label: 'Create My First Project',
        onClick: () => {
          onCreateFirstProject();
          onComplete();
        }
      }
    }
  ];

  const currentStepData = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;

  const handleNext = () => {
    setCompletedSteps(prev => new Set([...prev, currentStep]));
    if (isLastStep) {
      onComplete();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(0, prev - 1));
  };

  const handleSkip = () => {
    onComplete();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] bg-white shadow-2xl border-0 overflow-hidden">
        {/* Progress Bar */}
        <div className="h-1 bg-gray-100">
          <div 
            className="h-full bg-gradient-to-r from-blue-600 to-purple-600 transition-all duration-500"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          />
        </div>

        <CardHeader className="text-center bg-gradient-to-r from-blue-50 to-purple-50 pb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-gray-500">
              Step {currentStep + 1} of {steps.length}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSkip}
              className="text-gray-500 hover:text-gray-700"
            >
              Skip tour
            </Button>
          </div>
          <CardTitle className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            {currentStepData.title}
          </CardTitle>
          <p className="text-gray-600 text-sm">
            {currentStepData.description}
          </p>
        </CardHeader>

        <CardContent className="p-6">
          <div className="min-h-[300px] flex flex-col justify-center">
            {currentStepData.content}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-100">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={isFirstStep}
              className="min-w-[100px]"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>

            <div className="flex space-x-2">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentStep
                      ? 'bg-blue-600'
                      : completedSteps.has(index)
                      ? 'bg-green-500'
                      : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>

            {currentStepData.action ? (
              <Button
                onClick={currentStepData.action.onClick}
                className="min-w-[140px] bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                <Rocket className="w-4 h-4 mr-2" />
                {currentStepData.action.label}
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                className="min-w-[100px] bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                {isLastStep ? 'Get Started' : 'Next'}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}