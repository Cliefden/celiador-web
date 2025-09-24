'use client';

import { useEffect, useState } from 'react';
import { Settings, X } from 'lucide-react';
import { Button } from '../ui/button';
import { useSettings } from '../../contexts/SettingsContext';
import { useSettingsPanel } from '../../contexts/SettingsPanelContext';

export function SettingsWindow() {
  const { isOpen, closePanel } = useSettingsPanel();
  const { settings, updateSettings, isLoading, error } = useSettings();
  const [isAnimating, setIsAnimating] = useState(true);

  useEffect(() => {
    if (isOpen) {
      // Small delay to ensure DOM is ready, then slide in
      const timer = setTimeout(() => setIsAnimating(false), 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 z-[60] ${
          isAnimating ? 'opacity-0' : 'opacity-100'
        }`}
        onClick={closePanel}
      />
      
      {/* Settings Window */}
      <div className={`
        fixed right-0 top-0 h-full w-96 bg-white shadow-2xl z-[70]
        transform transition-transform duration-300 ease-out
        ${isAnimating ? 'translate-x-full' : 'translate-x-0'}
        flex flex-col
      `}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
              <Settings className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">Settings</h2>
              <p className="text-xs text-gray-500">Customize your Celiador experience</p>
            </div>
          </div>
          <button
            onClick={closePanel}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full overflow-y-auto p-4">
            {isLoading ? (
              <div className="flex items-center justify-center h-64 text-gray-500">
                <p>Loading settings...</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    🎨 Appearance Settings
                  </h3>
                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                      <p className="text-red-600 text-sm font-medium">
                        ⚠️ API Connection Issue: {error}
                      </p>
                      <p className="text-red-500 text-xs mt-1">
                        Showing demo settings. Changes won't be saved until the API is connected.
                      </p>
                    </div>
                  )}
                  
                  {/* Theme Section */}
                  <div className="mb-8">
                    <h4 className="text-base font-semibold text-gray-900 mb-3">
                      Theme
                    </h4>
                    <div className="grid grid-cols-3 gap-3">
                      {['light', 'dark', 'system'].map((theme) => (
                        <button
                          key={theme}
                          onClick={() => updateSettings({ theme: theme as any })}
                          className={`p-4 rounded-lg border-2 text-center text-sm font-medium capitalize transition-all ${
                            settings?.theme === theme 
                              ? 'border-blue-500 bg-blue-50 text-blue-700' 
                              : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                          }`}
                        >
                          {theme}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Font Size Section */}
                  <div className="mb-8">
                    <h4 className="text-base font-semibold text-gray-900 mb-3">
                      Editor Font Size: {settings?.editor_font_size || 14}px
                    </h4>
                    <input
                      type="range"
                      min="8"
                      max="32"
                      value={settings?.editor_font_size || 14}
                      onChange={(e) => updateSettings({ editor_font_size: parseInt(e.target.value) })}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>8px</span>
                      <span>32px</span>
                    </div>
                  </div>

                  {/* Boolean Settings */}
                  <div className="grid grid-cols-1 gap-3">
                    {[
                      { key: 'editor_line_numbers', label: 'Line Numbers' },
                      { key: 'editor_minimap', label: 'Minimap' },
                      { key: 'auto_save_enabled', label: 'Auto Save' },
                      { key: 'preview_auto_refresh', label: 'Auto Refresh' }
                    ].map(({ key, label }) => (
                      <div key={key} className="p-4 border border-gray-200 rounded-lg flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-700">
                          {label}
                        </span>
                        <input
                          type="checkbox"
                          checked={settings?.[key] || false}
                          onChange={(e) => updateSettings({ [key]: e.target.checked })}
                          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded cursor-pointer"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export function SettingsButton() {
  const { openPanel } = useSettingsPanel();

  return (
    <Button 
      variant="ghost" 
      size="sm" 
      className="h-8 w-8 p-0 hover:bg-gray-100 rounded-md transition-colors"
      onClick={openPanel}
    >
      <Settings className="h-4 w-4" />
      <span className="sr-only">Open settings</span>
    </Button>
  );
}

export function SettingsMenuItem() {
  const { openPanel } = useSettingsPanel();

  return (
    <button
      onClick={openPanel}
      className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
    >
      <Settings className="h-4 w-4" />
      <span>Settings</span>
    </button>
  );
}

// Legacy export for backwards compatibility
export const SettingsPanel = SettingsButton;