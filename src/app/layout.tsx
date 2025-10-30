import './globals.css';
import { Inter } from 'next/font/google';
import { AuthProvider } from '../contexts/AuthContext';
import { SettingsProvider } from '../contexts/SettingsContext';
import { SettingsPanelProvider } from '../contexts/SettingsPanelContext';
// import { WebSocketProvider } from '../contexts/WebSocketContext';
import { SettingsWindow } from '../components/settings/SettingsPanel';

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata = { 
  title: 'Celiador Studio', 
  description: 'AI-powered development platform',
  icons: {
    icon: [
      { url: '/icons/icon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/icons/icon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/icon-48x48.png', sizes: '48x48', type: 'image/png' },
      { url: '/icons/icon-64x64.png', sizes: '64x64', type: 'image/png' },
      { url: '/icons/icon-128x128.png', sizes: '128x128', type: 'image/png' },
      { url: '/icons/icon-256x256.png', sizes: '256x256', type: 'image/png' }
    ],
    apple: [
      { url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }
    ],
    other: [
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' }
    ]
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#00CED1" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Celiador" />
      </head>
      <body className={inter.className}>
        <AuthProvider>
          <SettingsProvider>
            <SettingsPanelProvider>
              {children}
              <SettingsWindow />
            </SettingsPanelProvider>
          </SettingsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
