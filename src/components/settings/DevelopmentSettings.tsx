'use client';

import { useSettings } from '../../contexts/SettingsContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Slider } from '../ui/slider';
import { Switch } from '../ui/switch';
import { Input } from '../ui/input';
import { Bot, Save, Eye, Zap, MessageCircle, Timer } from 'lucide-react';

export function DevelopmentSettings() {
  const { settings, updateSettings } = useSettings();

  if (!settings) return null;

  const responseStyles = [
    { value: 'concise', label: 'Concise', description: 'Brief and to the point' },
    { value: 'balanced', label: 'Balanced', description: 'Good mix of detail and brevity' },
    { value: 'detailed', label: 'Detailed', description: 'Comprehensive explanations' }
  ];

  return (
    <div className="space-y-8">
      {/* AI Configuration */}
      <div>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-gradient-to-r from-purple-500 to-violet-500 rounded-lg">
            <Bot className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">AI Assistant</h3>
            <p className="text-sm text-gray-600">Configure AI behavior and preferences</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-blue-600" />
                AI Model
              </CardTitle>
              <CardDescription>Choose the AI model for assistance</CardDescription>
            </CardHeader>
            <CardContent>
              <Input
                value={settings.ai_model}
                onChange={(e) => updateSettings({ ai_model: e.target.value })}
                placeholder="claude-3.5-sonnet"
                className="bg-gray-50"
              />
            </CardContent>
          </Card>

          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Response Style</CardTitle>
              <CardDescription>How detailed should AI responses be?</CardDescription>
            </CardHeader>
            <CardContent>
              <Select
                value={settings.ai_response_style}
                onValueChange={(value: 'concise' | 'balanced' | 'detailed') => 
                  updateSettings({ ai_response_style: value })
                }
              >
                <SelectTrigger className="bg-gray-50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {responseStyles.map((style) => (
                    <SelectItem key={style.value} value={style.value}>
                      <div>
                        <div className="font-medium">{style.label}</div>
                        <div className="text-xs text-gray-500">{style.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Auto-save */}
      <div>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg">
            <Save className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Auto-save</h3>
            <p className="text-sm text-gray-600">Automatically save your work as you type</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-gray-200 shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-medium flex items-center gap-2">
                    <Zap className="h-4 w-4 text-green-600" />
                    Enable Auto-save
                  </Label>
                  <p className="text-sm text-gray-600">Save changes automatically</p>
                </div>
                <Switch
                  checked={settings.auto_save_enabled}
                  onCheckedChange={(checked) => updateSettings({ auto_save_enabled: checked })}
                />
              </div>
            </CardContent>
          </Card>

          {settings.auto_save_enabled && (
            <Card className="border-gray-200 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Timer className="h-4 w-4 text-blue-600" />
                  Save Interval
                </CardTitle>
                <CardDescription>
                  <span className="font-medium text-blue-600">{settings.auto_save_interval}s</span>
                  <span className="text-gray-500"> - Time between saves</span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Slider
                  min={5}
                  max={300}
                  step={5}
                  value={[settings.auto_save_interval]}
                  onValueChange={([value]) => updateSettings({ auto_save_interval: value })}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-2">
                  <span>5s</span>
                  <span>5min</span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Preview */}
      <div>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg">
            <Eye className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Preview</h3>
            <p className="text-sm text-gray-600">Configure preview and development server</p>
          </div>
        </div>

        <Card className="border-gray-200 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-medium">Auto-refresh Preview</Label>
                <p className="text-sm text-gray-600">Automatically refresh when files change</p>
              </div>
              <Switch
                checked={settings.preview_auto_refresh}
                onCheckedChange={(checked) => updateSettings({ preview_auto_refresh: checked })}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}