'use client';

import { useState, useEffect, useRef } from 'react';
import { useLivingEcosystem } from '@/hooks/useLivingEcosystem';

interface IntentPrediction {
  completion: string;
  confidence: number;
  requiredAgents: string[];
  estimatedComplexity: number;
}

interface QuickIntent {
  label: string;
  intent: string;
  icon: string;
  category: 'design' | 'performance' | 'security' | 'feature';
}

interface EcosystemConversationEnhancerProps {
  projectId: string;
  userId: string;
  currentInput: string;
  onIntentSelect: (intent: string) => void;
  onSendMessage: (message: string, useEcosystem?: boolean) => Promise<void>;
  className?: string;
}

const quickIntents: QuickIntent[] = [
  {
    label: 'Make it modern',
    intent: 'Make this design more modern and professional',
    icon: '✨',
    category: 'design'
  },
  {
    label: 'Optimize speed',
    intent: 'Optimize the performance and loading speed',
    icon: '⚡',
    category: 'performance'
  },
  {
    label: 'Fix accessibility',
    intent: 'Improve accessibility and add ARIA labels',
    icon: '♿',
    category: 'design'
  },
  {
    label: 'Mobile responsive',
    intent: 'Make this fully responsive for mobile devices',
    icon: '📱',
    category: 'design'
  },
  {
    label: 'Security review',
    intent: 'Review and improve security of this component',
    icon: '🔒',
    category: 'security'
  },
  {
    label: 'Add tests',
    intent: 'Generate comprehensive tests for this code',
    icon: '🧪',
    category: 'feature'
  }
];

const getCategoryColor = (category: QuickIntent['category']) => {
  switch (category) {
    case 'design': return 'bg-purple-100 text-purple-700 border-purple-200';
    case 'performance': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    case 'security': return 'bg-red-100 text-red-700 border-red-200';
    case 'feature': return 'bg-green-100 text-green-700 border-green-200';
    default: return 'bg-gray-100 text-gray-700 border-gray-200';
  }
};

export function EcosystemConversationEnhancer({
  projectId,
  userId,
  currentInput,
  onIntentSelect,
  onSendMessage,
  className = ''
}: EcosystemConversationEnhancerProps) {
  const {
    isEnabled,
    isConnected,
    hasActiveAgents,
    activeIntent,
    visualContext,
    projectDNA,
    processUserIntent,
    isComplexIntent
  } = useLivingEcosystem(projectId);

  const [intentPredictions, setIntentPredictions] = useState<IntentPrediction[]>([]);
  const [showPredictions, setShowPredictions] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const predictionTimeout = useRef<NodeJS.Timeout>();

  // Predict intent completions as user types
  useEffect(() => {
    if (!isEnabled || !currentInput || currentInput.length < 3) {
      setIntentPredictions([]);
      setShowPredictions(false);
      return;
    }

    if (predictionTimeout.current) {
      clearTimeout(predictionTimeout.current);
    }

    predictionTimeout.current = setTimeout(async () => {
      await generateIntentPredictions(currentInput);
    }, 500);

    return () => {
      if (predictionTimeout.current) {
        clearTimeout(predictionTimeout.current);
      }
    };
  }, [currentInput, isEnabled]);

  const generateIntentPredictions = async (input: string) => {
    if (!isComplexIntent(input)) return;

    const predictions: IntentPrediction[] = [];

    // Simple keyword-based predictions (in real implementation, use AI)
    if (input.toLowerCase().includes('make')) {
      predictions.push({
        completion: input + ' more modern and user-friendly',
        confidence: 0.85,
        requiredAgents: ['ux', 'architect'],
        estimatedComplexity: 6
      });
      predictions.push({
        completion: input + ' more accessible',
        confidence: 0.7,
        requiredAgents: ['ux'],
        estimatedComplexity: 4
      });
    }

    if (input.toLowerCase().includes('optim')) {
      predictions.push({
        completion: input + 'ize performance and loading speed',
        confidence: 0.9,
        requiredAgents: ['performance', 'architect'],
        estimatedComplexity: 7
      });
    }

    if (input.toLowerCase().includes('fix') || input.toLowerCase().includes('improv')) {
      predictions.push({
        completion: input + ' the user experience',
        confidence: 0.8,
        requiredAgents: ['ux', 'architect'],
        estimatedComplexity: 5
      });
      predictions.push({
        completion: input + ' security and validation',
        confidence: 0.75,
        requiredAgents: ['security', 'architect'],
        estimatedComplexity: 6
      });
    }

    setIntentPredictions(predictions);
    setShowPredictions(predictions.length > 0);
  };

  const handleQuickIntentClick = async (intent: QuickIntent) => {
    setIsProcessing(true);
    onIntentSelect(intent.intent);
    
    try {
      await onSendMessage(intent.intent, true);
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePredictionClick = (prediction: IntentPrediction) => {
    onIntentSelect(prediction.completion);
    setShowPredictions(false);
  };

  if (!isEnabled) {
    return null;
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Ecosystem Status */}
      <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border">
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-400'}`} />
          <span className="text-sm font-medium text-gray-700">Living Ecosystem</span>
          {hasActiveAgents && (
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
              AI working...
            </span>
          )}
        </div>
        
        <div className="text-xs text-gray-500">
          🧬 DNA: {Math.round(projectDNA.confidence * 100)}%
        </div>
      </div>

      {/* Active Intent Status */}
      {activeIntent && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-blue-900">
              🎯 Processing: "{activeIntent.userIntent}"
            </div>
            <div className="text-xs text-blue-600">
              {activeIntent.progress}%
            </div>
          </div>
          
          <div className="w-full h-2 bg-blue-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-500 transition-all duration-500"
              style={{ width: `${activeIntent.progress}%` }}
            />
          </div>
          
          {activeIntent.status === 'failed' && (
            <div className="text-xs text-red-600 mt-2">
              ❌ {activeIntent.error}
            </div>
          )}
        </div>
      )}

      {/* Visual Context Indicator */}
      {visualContext && (
        <div className="flex items-center space-x-2 p-2 bg-green-50 border border-green-200 rounded-lg">
          <span className="text-sm text-green-700">📸 Visual context available</span>
          {visualContext.uiElements && (
            <span className="text-xs text-green-600">
              {visualContext.uiElements.length} UI elements analyzed
            </span>
          )}
        </div>
      )}

      {/* Intent Predictions */}
      {showPredictions && intentPredictions.length > 0 && (
        <div className="border border-gray-200 rounded-lg p-3 bg-white shadow-sm">
          <div className="text-xs font-medium text-gray-500 mb-2">💡 Suggested completions</div>
          <div className="space-y-2">
            {intentPredictions.map((prediction, index) => (
              <button
                key={index}
                onClick={() => handlePredictionClick(prediction)}
                className="w-full text-left p-2 rounded hover:bg-gray-50 border border-gray-100 transition-colors"
              >
                <div className="text-sm text-gray-900">{prediction.completion}</div>
                <div className="flex items-center justify-between mt-1">
                  <div className="flex items-center space-x-2">
                    <div className="text-xs text-gray-500">
                      Agents: {prediction.requiredAgents.join(', ')}
                    </div>
                    <div className="text-xs text-gray-500">
                      Complexity: {prediction.estimatedComplexity}/10
                    </div>
                  </div>
                  <div className="text-xs text-blue-600">
                    {Math.round(prediction.confidence * 100)}% confident
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quick Intent Buttons */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium text-gray-700">🚀 Quick Actions</div>
          {isProcessing && (
            <div className="text-xs text-blue-600 flex items-center space-x-1">
              <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <span>Processing...</span>
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          {quickIntents.map((intent, index) => (
            <button
              key={index}
              onClick={() => handleQuickIntentClick(intent)}
              disabled={isProcessing || hasActiveAgents}
              className={`p-3 rounded-lg border text-left transition-all hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed ${getCategoryColor(intent.category)}`}
            >
              <div className="flex items-center space-x-2 mb-1">
                <span className="text-lg">{intent.icon}</span>
                <span className="font-medium text-sm">{intent.label}</span>
              </div>
              <div className="text-xs opacity-75">
                {intent.intent}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Project DNA Insights */}
      {projectDNA.patterns.length > 0 && (
        <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
          <div className="text-sm font-medium text-purple-900 mb-2">
            🧬 Project Insights
          </div>
          <div className="text-xs text-purple-700">
            {projectDNA.lastInsight}
          </div>
          <div className="flex items-center space-x-4 mt-2 text-xs text-purple-600">
            <span>Patterns: {projectDNA.patterns.length}</span>
            <span>Confidence: {Math.round(projectDNA.confidence * 100)}%</span>
          </div>
        </div>
      )}

      {/* Ecosystem Tips */}
      {!hasActiveAgents && isConnected && (
        <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="text-xs text-gray-600">
            💡 <strong>Tip:</strong> Use natural language like "make this more modern" or "optimize the performance" 
            to trigger multi-agent collaboration.
          </div>
        </div>
      )}
    </div>
  );
}