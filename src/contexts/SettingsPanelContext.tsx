'use client';

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

interface SettingsPanelContextType {
  isOpen: boolean;
  openPanel: () => void;
  closePanel: () => void;
}

const SettingsPanelContext = createContext<SettingsPanelContextType | undefined>(undefined);

export function SettingsPanelProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const openPanel = () => setIsOpen(true);
  const closePanel = () => setIsOpen(false);

  // Listen for floating window events and close settings panel
  useEffect(() => {
    const handleFloatingWindowOpen = () => {
      if (isOpen) {
        console.log('Floating window opened, closing settings panel');
        setIsOpen(false);
      }
    };

    // Listen for custom events from FloatingWindowController
    window.addEventListener('floating-window-opened', handleFloatingWindowOpen);
    
    return () => {
      window.removeEventListener('floating-window-opened', handleFloatingWindowOpen);
    };
  }, [isOpen]);

  return (
    <SettingsPanelContext.Provider value={{ isOpen, openPanel, closePanel }}>
      {children}
    </SettingsPanelContext.Provider>
  );
}

export function useSettingsPanel() {
  const context = useContext(SettingsPanelContext);
  if (context === undefined) {
    throw new Error('useSettingsPanel must be used within a SettingsPanelProvider');
  }
  return context;
}