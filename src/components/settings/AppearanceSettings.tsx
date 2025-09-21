'use client';

import { useSettings } from '../../contexts/SettingsContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Slider } from '../ui/slider';
import { Switch } from '../ui/switch';
import { Sun, Moon, Monitor, Layout, Code, Palette } from 'lucide-react';

export function AppearanceSettings() {
  const { settings, updateSettings } = useSettings();

  if (!settings) return null;

  const themeOptions = [
    { value: 'light', label: 'Light', icon: Sun, description: 'Clean and bright' },
    { value: 'dark', label: 'Dark', icon: Moon, description: 'Easy on the eyes' },
    { value: 'system', label: 'System', icon: Monitor, description: 'Matches your OS' }
  ];

  return (
    <div className="space-y-8">
      {/* Theme Section */}
      <div>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
            <Palette className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Theme</h3>
            <p className="text-sm text-gray-600">Choose your preferred color scheme</p>
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-4">
          {themeOptions.map((option) => {
            const Icon = option.icon;
            const isSelected = settings.theme === option.value;
            
            return (
              <button
                key={option.value}
                onClick={() => updateSettings({ theme: option.value as any })}
                className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                  isSelected 
                    ? 'border-blue-500 bg-blue-50 shadow-md' 
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="text-center">
                  <div className={`w-10 h-10 rounded-lg mx-auto mb-3 flex items-center justify-center ${
                    isSelected ? 'bg-blue-500' : 'bg-gray-100'
                  }`}>
                    <Icon className={`h-5 w-5 ${isSelected ? 'text-white' : 'text-gray-600'}`} />
                  </div>
                  <h4 className={`font-medium ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                    {option.label}
                  </h4>
                  <p className={`text-xs mt-1 ${isSelected ? 'text-blue-600' : 'text-gray-500'}`}>
                    {option.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Layout Section */}
      <div>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg">
            <Layout className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Layout</h3>
            <p className="text-sm text-gray-600">Customize spacing and layout preferences</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Layout Density</CardTitle>
              <CardDescription>Adjust spacing between interface elements</CardDescription>
            </CardHeader>
            <CardContent>
              <Select
                value={settings.layout_density}
                onValueChange={(value: 'compact' | 'comfortable') => 
                  updateSettings({ layout_density: value })
                }
              >
                <SelectTrigger className="bg-gray-50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="compact">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-orange-500 rounded"></div>
                      Compact
                    </div>
                  </SelectItem>
                  <SelectItem value="comfortable">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded"></div>
                      Comfortable
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Sidebar Width</CardTitle>
              <CardDescription>
                <span className="font-medium text-blue-600">{settings.sidebar_width}px</span>
                <span className="text-gray-500"> - Adjust panel width</span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Slider
                min={200}
                max={600}
                step={25}
                value={[settings.sidebar_width]}
                onValueChange={([value]) => updateSettings({ sidebar_width: value })}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-2">
                <span>200px</span>
                <span>600px</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Code Editor Section */}
      <div>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg">
            <Code className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Code Editor</h3>
            <p className="text-sm text-gray-600">Configure editor appearance and behavior</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Font Size</CardTitle>
              <CardDescription>
                <span className="font-medium text-blue-600">{settings.editor_font_size}px</span>
                <span className="text-gray-500"> - Editor text size</span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Slider
                min={8}
                max={32}
                step={1}
                value={[settings.editor_font_size]}
                onValueChange={([value]) => updateSettings({ editor_font_size: value })}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-2">
                <span>8px</span>
                <span>32px</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Tab Size</CardTitle>
              <CardDescription>
                <span className="font-medium text-blue-600">{settings.editor_tab_size} spaces</span>
                <span className="text-gray-500"> - Indentation width</span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Slider
                min={1}
                max={8}
                step={1}
                value={[settings.editor_tab_size]}
                onValueChange={([value]) => updateSettings({ editor_tab_size: value })}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-2">
                <span>1 space</span>
                <span>8 spaces</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <Card className="border-gray-200 shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="line-numbers" className="text-base font-medium">Line Numbers</Label>
                  <p className="text-sm text-gray-600">Show line numbers in editor</p>
                </div>
                <Switch
                  id="line-numbers"
                  checked={settings.editor_line_numbers}
                  onCheckedChange={(checked) => updateSettings({ editor_line_numbers: checked })}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200 shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="minimap" className="text-base font-medium">Minimap</Label>
                  <p className="text-sm text-gray-600">Show code overview minimap</p>
                </div>
                <Switch
                  id="minimap"
                  checked={settings.editor_minimap}
                  onCheckedChange={(checked) => updateSettings({ editor_minimap: checked })}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}