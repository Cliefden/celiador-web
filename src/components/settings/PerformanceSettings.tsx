'use client';

import { useSettings } from '../../contexts/SettingsContext';
import { Card, CardContent } from '../ui/card';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { Button } from '../ui/button';
import { Trash2, RotateCcw, Zap, Bug, Database, AlertTriangle } from 'lucide-react';

export function PerformanceSettings() {
  const { settings, updateSettings, resetSettings } = useSettings();

  if (!settings) return null;

  const handleResetSettings = async () => {
    if (confirm('Are you sure you want to reset all settings to defaults? This cannot be undone.')) {
      try {
        await resetSettings();
      } catch (error) {
        console.error('Failed to reset settings:', error);
      }
    }
  };

  const handleClearCache = () => {
    if (typeof window !== 'undefined') {
      // Clear localStorage cache
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('cache_') || key.startsWith('temp_')) {
          localStorage.removeItem(key);
        }
      });
      
      // Clear sessionStorage cache
      const sessionKeys = Object.keys(sessionStorage);
      sessionKeys.forEach(key => {
        if (key.startsWith('cache_') || key.startsWith('temp_')) {
          sessionStorage.removeItem(key);
        }
      });
      
      alert('Cache cleared successfully');
    }
  };

  return (
    <div className="space-y-8">
      {/* Performance & Caching */}
      <div>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Performance</h3>
            <p className="text-sm text-gray-600">Optimize app speed and responsiveness</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-gray-200 shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-medium flex items-center gap-2">
                    <Database className="h-4 w-4 text-blue-600" />
                    Enable Caching
                  </Label>
                  <p className="text-sm text-gray-600">Cache API responses for faster loading</p>
                </div>
                <Switch
                  checked={settings.cache_enabled}
                  onCheckedChange={(checked) => updateSettings({ cache_enabled: checked })}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200 shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-medium">Clear Cache</Label>
                  <p className="text-sm text-gray-600">Remove cached data to free up space</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearCache}
                  className="flex items-center gap-2 hover:bg-red-50 hover:border-red-200"
                >
                  <Trash2 className="h-4 w-4" />
                  Clear
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Development Tools */}
      <div>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg">
            <Bug className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Development Tools</h3>
            <p className="text-sm text-gray-600">Debug and troubleshooting features</p>
          </div>
        </div>

        <Card className="border-gray-200 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-medium flex items-center gap-2">
                  <Bug className="h-4 w-4 text-orange-600" />
                  Debug Mode
                </Label>
                <p className="text-sm text-gray-600">Enable detailed logging and debug information</p>
              </div>
              <Switch
                checked={settings.debug_mode}
                onCheckedChange={(checked) => updateSettings({ debug_mode: checked })}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Danger Zone */}
      <div>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-gradient-to-r from-red-500 to-pink-500 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Danger Zone</h3>
            <p className="text-sm text-gray-600">Irreversible actions that affect all settings</p>
          </div>
        </div>

        <Card className="border-red-200 shadow-sm bg-red-50/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-medium text-red-900">Reset All Settings</Label>
                <p className="text-sm text-red-700">Restore all preferences to factory defaults</p>
                <p className="text-xs text-red-600 mt-1">⚠️ This action cannot be undone</p>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleResetSettings}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-700"
              >
                <RotateCcw className="h-4 w-4" />
                Reset All
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}