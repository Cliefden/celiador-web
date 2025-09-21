'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Settings, X } from 'lucide-react';
import { Button } from '../ui/button';
import { useSettings } from '../../contexts/SettingsContext';

function SettingsModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { settings, updateSettings, isLoading, error } = useSettings();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = 'unset';
      };
    }
  }, [isOpen]);

  if (!isOpen || typeof window === 'undefined') return null;

  const handleClose = () => {
    console.log('Modal closing via X button');
    onClose();
  };

  const modalContent = (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        zIndex: 2147483647,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
    >
      <div 
        style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '900px',
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
        }}
        onClick={(e) => {
          // Prevent any event bubbling that might trigger external close handlers
          e.stopPropagation();
          e.preventDefault();
        }}
      >
        {/* Header */}
        <div style={{
          padding: '24px',
          borderBottom: '1px solid #e5e7eb',
          background: 'linear-gradient(to right, #dbeafe, #e0e7ff)',
          borderRadius: '12px 12px 0 0',
          position: 'relative'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              padding: '8px',
              background: 'linear-gradient(to right, #2563eb, #4f46e5)',
              borderRadius: '8px'
            }}>
              <Settings style={{ width: '20px', height: '20px', color: 'white' }} />
            </div>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#111827', margin: 0 }}>
                Settings
              </h2>
              <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
                Customize your Celiador experience
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              width: '32px',
              height: '32px',
              border: 'none',
              backgroundColor: 'rgba(255, 255, 255, 0.8)',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0'
            }}
          >
            <X style={{ width: '16px', height: '16px' }} />
          </button>
        </div>

        {/* Content */}
        <div style={{ 
          flex: 1, 
          overflow: 'auto', 
          padding: '24px'
        }}>
          {isLoading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px' }}>
              <p>Loading settings...</p>
            </div>
          ) : (
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: '#111827' }}>
                🎨 Appearance Settings
              </h3>
              {error && (
                <div style={{ 
                  backgroundColor: '#fef2f2', 
                  border: '1px solid #fecaca', 
                  borderRadius: '8px', 
                  padding: '12px', 
                  marginBottom: '16px' 
                }}>
                  <p style={{ color: '#dc2626', fontSize: '14px', margin: 0 }}>
                    ⚠️ API Connection Issue: {error}
                  </p>
                  <p style={{ color: '#7f1d1d', fontSize: '12px', margin: '4px 0 0 0' }}>
                    Showing demo settings. Changes won't be saved until the API is connected.
                  </p>
                </div>
              )}
              
              {/* Simple Theme Section */}
              <div style={{ marginBottom: '32px' }}>
                <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', color: '#111827' }}>
                  Theme
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                  {['light', 'dark', 'system'].map((theme) => (
                    <button
                      key={theme}
                      onClick={() => updateSettings({ theme: theme as any })}
                      style={{
                        padding: '16px',
                        borderRadius: '8px',
                        border: '2px solid',
                        borderColor: settings?.theme === theme ? '#3b82f6' : '#e5e7eb',
                        backgroundColor: settings?.theme === theme ? '#eff6ff' : 'white',
                        cursor: 'pointer',
                        textAlign: 'center',
                        fontSize: '14px',
                        fontWeight: '500',
                        textTransform: 'capitalize',
                        color: settings?.theme === theme ? '#1e40af' : '#374151'
                      }}
                    >
                      {theme}
                    </button>
                  ))}
                </div>
              </div>

              {/* Font Size Section */}
              <div style={{ marginBottom: '32px' }}>
                <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', color: '#111827' }}>
                  Editor Font Size: {settings?.editor_font_size || 14}px
                </h4>
                <input
                  type="range"
                  min="8"
                  max="32"
                  value={settings?.editor_font_size || 14}
                  onChange={(e) => updateSettings({ editor_font_size: parseInt(e.target.value) })}
                  style={{
                    width: '100%',
                    height: '6px',
                    borderRadius: '3px',
                    background: '#ddd',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                  <span>8px</span>
                  <span>32px</span>
                </div>
              </div>

              {/* Boolean Settings */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                {[
                  { key: 'editor_line_numbers', label: 'Line Numbers' },
                  { key: 'editor_minimap', label: 'Minimap' },
                  { key: 'auto_save_enabled', label: 'Auto Save' },
                  { key: 'preview_auto_refresh', label: 'Auto Refresh' }
                ].map(({ key, label }) => (
                  <div key={key} style={{
                    padding: '16px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                      {label}
                    </span>
                    <input
                      type="checkbox"
                      checked={settings?.[key] || false}
                      onChange={(e) => updateSettings({ [key]: e.target.checked })}
                      style={{
                        width: '18px',
                        height: '18px',
                        cursor: 'pointer'
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

export function SettingsPanel() {
  const [isOpen, setIsOpen] = useState(false);

  const handleCloseModal = () => {
    console.log('SettingsPanel: Modal close requested');
    setIsOpen(false);
  };

  const handleOpenModal = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('SettingsPanel: Opening modal');
    setIsOpen(true);
  };

  return (
    <>
      <Button 
        variant="ghost" 
        size="sm" 
        className="h-8 w-8 p-0 hover:bg-gray-100 rounded-md transition-colors"
        onClick={handleOpenModal}
      >
        <Settings className="h-4 w-4" />
        <span className="sr-only">Open settings</span>
      </Button>

      <SettingsModal isOpen={isOpen} onClose={handleCloseModal} />
    </>
  );
}