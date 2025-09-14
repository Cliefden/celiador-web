'use client';

import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Sparkles, ShoppingCart, MessageSquare, BarChart3, Palette, Briefcase, Globe, Zap, ArrowRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Template {
  id: string;
  template_key: string;
  name: string;
  description: string;
  difficulty: string;
  icon: string;
  emoji: string;
  color_primary: string;
  color_secondary?: string;
  rating: number;
  version: string;
}

export default function Templates() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        console.log('Fetching templates for landing page...');
        const { data: templatesData, error } = await supabase
          .from('templates')
          .select('*')
          .eq('is_active', true)
          .is('deleted_at', null)
          .order('sort_order')
          .limit(6); // Show top 6 for landing page

        console.log('Templates query result:', { data: templatesData, error });
        
        if (error) throw error;
        setTemplates(templatesData || []);
        console.log('Templates set:', templatesData?.length || 0);
      } catch (error) {
        console.error('Error fetching templates:', error);
        // Fallback to empty array
        setTemplates([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTemplates();
  }, []);
  return (
    <div className="py-16 bg-gradient-to-br from-slate-50 to-blue-50" id="templates">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4" />
            Professional Templates
          </div>
          <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-gray-900 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-6">
            Launch Your Dream Project
            <br />
            <span className="text-3xl md:text-4xl">In Minutes, Not Months</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Choose from our collection of professionally crafted templates. Each one is designed to get you from idea to deployment faster than ever.
          </p>
        </div>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {loading ? (
            // Loading skeleton
            Array.from({ length: 6 }).map((_, idx) => (
              <Card key={idx} className="overflow-hidden border-0 bg-white/60 backdrop-blur-sm">
                <div className="h-48 bg-gray-200 animate-pulse" />
                <div className="p-6 space-y-3">
                  <div className="h-6 bg-gray-200 rounded animate-pulse" />
                  <div className="h-4 bg-gray-200 rounded animate-pulse" />
                  <div className="flex gap-2">
                    <div className="h-6 w-16 bg-gray-200 rounded animate-pulse" />
                    <div className="h-6 w-20 bg-gray-200 rounded animate-pulse" />
                  </div>
                </div>
              </Card>
            ))
          ) : (
            templates.map((template) => (
              <Card key={template.template_key} className="group hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 overflow-hidden border-0 bg-white/60 backdrop-blur-sm">
                {/* Template Preview */}
                <div className="relative h-48 bg-gradient-to-r overflow-hidden">
                  <div 
                    className="absolute inset-0 opacity-90"
                    style={{
                      background: `linear-gradient(135deg, ${template.color_primary}, ${template.color_secondary || template.color_primary})`
                    }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-white text-center">
                      <div className="mb-4 text-4xl">
                        {template.emoji}
                      </div>
                      <div className="text-lg font-semibold">{template.name}</div>
                    </div>
                  </div>
                  <div className="absolute top-4 right-4">
                    <div className="bg-white/20 backdrop-blur-sm rounded-full p-2">
                      <ArrowRight className="w-4 h-4 text-white group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>

                {/* Template Info */}
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {template.name}
                    </h3>
                    {template.rating > 0 && (
                      <span className="text-xs text-gray-500">⭐ {template.rating}</span>
                    )}
                  </div>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {template.description}
                  </p>
                  
                  {/* Template metadata */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                      {template.difficulty}
                    </span>
                    <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                      v{template.version}
                    </span>
                  </div>

                  <Button
                    variant="outline"
                    className="w-full group-hover:bg-gradient-to-r group-hover:from-purple-500 group-hover:to-pink-500 group-hover:text-white group-hover:border-transparent transition-all"
                    onClick={() => window.location.href = '/dashboard'}
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Start with this template
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-8 text-white">
            <h3 className="text-2xl font-bold mb-4">
              Ready to Build Something Amazing?
            </h3>
            <p className="text-purple-100 mb-6 max-w-2xl mx-auto">
              Join thousands of developers who are building faster with our AI-powered templates. 
              Start your project today and see the magic happen.
            </p>
            <Button
              size="lg"
              className="bg-white text-purple-600 hover:bg-purple-50 px-8 py-3 text-lg font-semibold"
              onClick={() => window.location.href = '/dashboard'}
            >
              <Sparkles className="w-5 h-5 mr-2" />
              Get Started Free
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}