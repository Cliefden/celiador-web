'use client';

import { useState } from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { 
  X,
  Rocket,
  Github,
  Globe,
  ArrowRight,
  Sparkles,
  CheckCircle,
  BarChart3
} from 'lucide-react';

interface WelcomeBannerProps {
  userName?: string;
  hasCreatedFirstProject: boolean;
  hasConnectedGitHub: boolean;
  hasDeployedProject: boolean;
  onCreateProject: () => void;
  onDismiss: () => void;
}

export function WelcomeBanner({ 
  userName,
  hasCreatedFirstProject,
  hasConnectedGitHub, 
  hasDeployedProject,
  onCreateProject,
  onDismiss 
}: WelcomeBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) return null;

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss();
  };

  // Calculate progress
  const steps = [
    { label: 'Create project', completed: hasCreatedFirstProject },
    { label: 'Connect GitHub', completed: hasConnectedGitHub },
    { label: 'Deploy app', completed: hasDeployedProject },
  ];
  
  const completedSteps = steps.filter(s => s.completed).length;
  const progress = (completedSteps / steps.length) * 100;

  // Determine the main action based on progress
  const getMainAction = () => {
    if (!hasCreatedFirstProject) {
      return {
        label: 'Create Your First Project',
        icon: Rocket,
        onClick: onCreateProject,
        variant: 'default' as const
      };
    }
    
    if (!hasConnectedGitHub) {
      return {
        label: 'Connect to GitHub',
        icon: Github,
        onClick: () => {}, // This would open project settings
        variant: 'secondary' as const
      };
    }
    
    if (!hasDeployedProject) {
      return {
        label: 'Deploy Your App',
        icon: Globe,
        onClick: () => {}, // This would open deployment panel
        variant: 'secondary' as const
      };
    }

    return null;
  };

  const mainAction = getMainAction();

  // Different banner variants based on user progress
  if (!hasCreatedFirstProject) {
    // New user banner
    return (
      <Card className="border-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white mx-6 mb-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative p-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="absolute top-4 right-4 text-white/80 hover:text-white hover:bg-white/20"
          >
            <X className="w-4 h-4" />
          </Button>
          
          <div className="flex items-start space-x-4 pr-12">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold mb-2">
                Welcome to Celiador{userName ? `, ${userName}` : ''}! 🎉
              </h3>
              <p className="text-white/90 mb-4">
                You're all set up! Let's create your first AI-powered web application in under 2 minutes.
              </p>
              <div className="flex items-center space-x-3">
                <Button
                  onClick={onCreateProject}
                  className="!bg-white !text-blue-600 hover:!bg-blue-50 hover:!text-blue-700 font-medium !border !border-blue-200 !shadow-sm"
                >
                  <Rocket className="w-4 h-4 mr-2" />
                  Create Your First Project
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                  Free to start
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  // Progress banner for returning users
  return (
    <Card className="border border-gray-200 bg-gradient-to-r from-gray-50 to-blue-50 mx-6 mb-4 relative">
      <div className="p-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDismiss}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
        >
          <X className="w-4 h-4" />
        </Button>
        
        <div className="flex items-start space-x-4 pr-12">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <BarChart3 className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <h3 className="font-semibold text-gray-900">
                Welcome back{userName ? `, ${userName}` : ''}!
              </h3>
              <Badge variant="outline" className="text-xs">
                {completedSteps}/{steps.length} completed
              </Badge>
            </div>
            
            <p className="text-gray-600 text-sm mb-4">
              Continue setting up your development workflow to get the most out of Celiador.
            </p>
            
            {/* Progress Steps */}
            <div className="flex items-center space-x-4 mb-4">
              {steps.map((step, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                    step.completed 
                      ? 'bg-green-100 text-green-600' 
                      : 'bg-gray-100 text-gray-400'
                  }`}>
                    {step.completed ? (
                      <CheckCircle className="w-3 h-3" />
                    ) : (
                      <span className="text-xs font-medium">{index + 1}</span>
                    )}
                  </div>
                  <span className={`text-xs font-medium ${
                    step.completed ? 'text-green-600' : 'text-gray-500'
                  }`}>
                    {step.label}
                  </span>
                  {index < steps.length - 1 && (
                    <ArrowRight className="w-3 h-3 text-gray-300" />
                  )}
                </div>
              ))}
            </div>
            
            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
              <div 
                className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            
            {mainAction && (
              <Button
                onClick={mainAction.onClick}
                variant={mainAction.variant}
                size="sm"
                className="font-medium"
              >
                <mainAction.icon className="w-4 h-4 mr-2" />
                {mainAction.label}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}