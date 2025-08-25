#!/usr/bin/env node

// Command-line script to upload Next.js files for project preview
// Usage: node upload-nextjs-files.js <AUTH_TOKEN>
// Get AUTH_TOKEN from browser dev tools: localStorage or sessionStorage, or from network requests

const https = require('https');
const http = require('http');

const projectId = '0e98a0bd-7747-4c24-bfed-3682f2dbbe97';
const baseUrl = 'http://localhost:4000';

// Get auth token from command line argument
const authToken = process.argv[2];
if (!authToken) {
  console.error('Usage: node upload-nextjs-files.js <AUTH_TOKEN>');
  console.error('');
  console.error('To get the auth token:');
  console.error('1. Open browser dev tools while logged into the web app');
  console.error('2. Go to Network tab and find a request to the API');
  console.error('3. Copy the Bearer token from Authorization header');
  console.error('4. Or check Application > Local Storage > supabase.auth.token');
  process.exit(1);
}

// Define the files to upload
const files = [
  {
    fileName: 'layout.tsx',
    path: 'src/app',
    content: `import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Bether Preview - Next.js App',
  description: 'A preview of your Next.js application built with Bether',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
          {children}
        </div>
      </body>
    </html>
  )
}
`
  },
  {
    fileName: 'page.tsx',
    path: 'src/app',
    content: `'use client'

import { useState, useEffect } from 'react'

export default function Home() {
  const [mounted, setMounted] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    setMounted(true)
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  if (!mounted) return null

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="max-w-4xl w-full text-center">
        {/* Hero Section */}
        <div className="mb-12">
          <h1 className="text-6xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6">
            Bether Preview
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Welcome to your Next.js application preview! This demo showcases a modern, 
            responsive interface built with React, TypeScript, and Tailwind CSS.
          </p>
          <div className="inline-flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium">
            ✅ Live Preview Active
          </div>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
              ⚡
            </div>
            <h3 className="text-lg font-semibold mb-2">Fast Development</h3>
            <p className="text-gray-600 text-sm">
              Hot reload and instant feedback for rapid development cycles.
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
              🎨
            </div>
            <h3 className="text-lg font-semibold mb-2">Beautiful UI</h3>
            <p className="text-gray-600 text-sm">
              Modern design with Tailwind CSS and responsive layouts.
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
              🚀
            </div>
            <h3 className="text-lg font-semibold mb-2">Production Ready</h3>
            <p className="text-gray-600 text-sm">
              Optimized builds and deployment-ready configurations.
            </p>
          </div>
        </div>

        {/* Live Clock */}
        <div className="bg-white rounded-xl p-8 shadow-lg border border-gray-100 mb-8">
          <h3 className="text-lg font-semibold mb-4">Live Clock</h3>
          <div className="text-4xl font-mono text-blue-600">
            {currentTime.toLocaleTimeString()}
          </div>
          <div className="text-sm text-gray-500 mt-2">
            {currentTime.toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="text-gray-500 text-sm">
          <p>Built with Next.js 14, React 18, TypeScript, and Tailwind CSS</p>
          <p className="mt-1">Powered by Bether Preview System</p>
        </div>
      </div>
    </main>
  )
}
`
  },
  {
    fileName: 'globals.css',
    path: 'src/app',
    content: `@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --foreground-rgb: 0, 0, 0;
  --background-start-rgb: 214, 219, 220;
  --background-end-rgb: 255, 255, 255;
}

@media (prefers-color-scheme: dark) {
  :root {
    --foreground-rgb: 255, 255, 255;
    --background-start-rgb: 0, 0, 0;
    --background-end-rgb: 0, 0, 0;
  }
}

body {
  color: rgb(var(--foreground-rgb));
  background: linear-gradient(
      to bottom,
      transparent,
      rgb(var(--background-end-rgb))
    )
    rgb(var(--background-start-rgb));
}

@layer utilities {
  .text-balance {
    text-wrap: balance;
  }
}
`
  },
  {
    fileName: 'next.config.js',
    path: '',
    content: `/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    appDir: true,
  },
  images: {
    domains: ['localhost'],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
}

module.exports = nextConfig
`
  },
  {
    fileName: 'tsconfig.json',
    path: '',
    content: `{
  "compilerOptions": {
    "lib": ["dom", "dom.iterable", "es6"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
`
  },
  {
    fileName: 'tailwind.config.ts',
    path: '',
    content: `import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
}
export default config
`
  }
];

// Function to make HTTP POST request
function uploadFile(file) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      fileName: file.fileName,
      content: file.content,
      path: file.path || undefined
    });

    const options = {
      hostname: 'localhost',
      port: 4000,
      path: \`/projects/\${projectId}/files/upload\`,
      method: 'POST',
      headers: {
        'Authorization': \`Bearer \${authToken}\`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ success: true, data: JSON.parse(data) });
        } else {
          reject(new Error(\`HTTP \${res.statusCode}: \${data}\`));
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.write(postData);
    req.end();
  });
}

// Main upload function
async function uploadAllFiles() {
  console.log(\`Starting upload of \${files.length} files to project \${projectId}...\`);
  console.log(\`Using auth token: \${authToken.substring(0, 20)}...\`);
  console.log('');

  for (const file of files) {
    try {
      const filePath = file.path ? \`\${file.path}/\${file.fileName}\` : file.fileName;
      process.stdout.write(\`Uploading \${filePath}... \`);
      
      await uploadFile(file);
      console.log('✅ Success');
    } catch (error) {
      console.log('❌ Failed');
      console.error(\`  Error: \${error.message}\`);
    }
  }

  console.log('');
  console.log('Upload process completed!');
  console.log('You can now start a preview for this project.');
}

// Run the upload
uploadAllFiles().catch(console.error);