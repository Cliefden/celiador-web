#!/bin/bash

# Bash script to upload Next.js files using curl
# Usage: ./upload-nextjs-files.sh <AUTH_TOKEN>

if [ -z "$1" ]; then
    echo "Usage: ./upload-nextjs-files.sh <AUTH_TOKEN>"
    echo ""
    echo "To get the auth token:"
    echo "1. Open browser dev tools while logged into the web app"
    echo "2. Go to Network tab and find a request to the API"
    echo "3. Copy the Bearer token from Authorization header"
    echo "4. Or run this in browser console: (await supabase.auth.getSession()).data.session.access_token"
    exit 1
fi

AUTH_TOKEN="$1"
PROJECT_ID="0e98a0bd-7747-4c24-bfed-3682f2dbbe97"
BASE_URL="http://localhost:4000"

echo "Uploading Next.js files to project $PROJECT_ID..."
echo "Using auth token: ${AUTH_TOKEN:0:20}..."
echo ""

# Function to upload a file
upload_file() {
    local filename="$1"
    local path="$2"
    local content="$3"
    
    local display_path=""
    if [ -n "$path" ]; then
        display_path="$path/"
    fi
    
    printf "Uploading %s%s... " "$display_path" "$filename"
    
    local response=$(curl -s -w "%{http_code}" \
        -X POST \
        -H "Authorization: Bearer $AUTH_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{\"fileName\":\"$filename\",\"content\":\"$content\",\"path\":\"$path\"}" \
        "$BASE_URL/projects/$PROJECT_ID/files/upload")
    
    local http_code="${response: -3}"
    local body="${response%???}"
    
    if [ "$http_code" -eq 200 ] || [ "$http_code" -eq 201 ]; then
        echo "✅ Success"
    else
        echo "❌ Failed (HTTP $http_code)"
        if [ -n "$body" ]; then
            echo "  Error: $body"
        fi
    fi
}

# Upload layout.tsx
upload_file "layout.tsx" "src/app" "import type { Metadata } from 'next'
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
    <html lang=\"en\">
      <body className={inter.className}>
        <div className=\"min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100\">
          {children}
        </div>
      </body>
    </html>
  )
}"

# Upload page.tsx
upload_file "page.tsx" "src/app" "'use client'

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
    <main className=\"min-h-screen flex flex-col items-center justify-center p-8\">
      <div className=\"max-w-4xl w-full text-center\">
        {/* Hero Section */}
        <div className=\"mb-12\">
          <h1 className=\"text-6xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6\">
            Bether Preview
          </h1>
          <p className=\"text-xl text-gray-600 mb-8 max-w-2xl mx-auto\">
            Welcome to your Next.js application preview! This demo showcases a modern, 
            responsive interface built with React, TypeScript, and Tailwind CSS.
          </p>
          <div className=\"inline-flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium\">
            ✅ Live Preview Active
          </div>
        </div>

        {/* Feature Cards */}
        <div className=\"grid md:grid-cols-3 gap-6 mb-12\">
          <div className=\"bg-white rounded-xl p-6 shadow-lg border border-gray-100\">
            <div className=\"w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 mx-auto\">
              ⚡
            </div>
            <h3 className=\"text-lg font-semibold mb-2\">Fast Development</h3>
            <p className=\"text-gray-600 text-sm\">
              Hot reload and instant feedback for rapid development cycles.
            </p>
          </div>

          <div className=\"bg-white rounded-xl p-6 shadow-lg border border-gray-100\">
            <div className=\"w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4 mx-auto\">
              🎨
            </div>
            <h3 className=\"text-lg font-semibold mb-2\">Beautiful UI</h3>
            <p className=\"text-gray-600 text-sm\">
              Modern design with Tailwind CSS and responsive layouts.
            </p>
          </div>

          <div className=\"bg-white rounded-xl p-6 shadow-lg border border-gray-100\">
            <div className=\"w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4 mx-auto\">
              🚀
            </div>
            <h3 className=\"text-lg font-semibold mb-2\">Production Ready</h3>
            <p className=\"text-gray-600 text-sm\">
              Optimized builds and deployment-ready configurations.
            </p>
          </div>
        </div>

        {/* Live Clock */}
        <div className=\"bg-white rounded-xl p-8 shadow-lg border border-gray-100 mb-8\">
          <h3 className=\"text-lg font-semibold mb-4\">Live Clock</h3>
          <div className=\"text-4xl font-mono text-blue-600\">
            {currentTime.toLocaleTimeString()}
          </div>
          <div className=\"text-sm text-gray-500 mt-2\">
            {currentTime.toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </div>
        </div>

        {/* Footer */}
        <div className=\"text-gray-500 text-sm\">
          <p>Built with Next.js 14, React 18, TypeScript, and Tailwind CSS</p>
          <p className=\"mt-1\">Powered by Bether Preview System</p>
        </div>
      </div>
    </main>
  )
}"

# Upload globals.css
upload_file "globals.css" "src/app" "@tailwind base;
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
}"

# Upload next.config.js
upload_file "next.config.js" "" "/** @type {import('next').NextConfig} */
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

module.exports = nextConfig"

# Upload tsconfig.json
upload_file "tsconfig.json" "" "{
  \"compilerOptions\": {
    \"lib\": [\"dom\", \"dom.iterable\", \"es6\"],
    \"allowJs\": true,
    \"skipLibCheck\": true,
    \"strict\": true,
    \"noEmit\": true,
    \"esModuleInterop\": true,
    \"module\": \"esnext\",
    \"moduleResolution\": \"bundler\",
    \"resolveJsonModule\": true,
    \"isolatedModules\": true,
    \"jsx\": \"preserve\",
    \"incremental\": true,
    \"plugins\": [
      {
        \"name\": \"next\"
      }
    ],
    \"baseUrl\": \".\",
    \"paths\": {
      \"@/*\": [\"./src/*\"]
    }
  },
  \"include\": [\"next-env.d.ts\", \"**/*.ts\", \"**/*.tsx\", \".next/types/**/*.ts\"],
  \"exclude\": [\"node_modules\"]
}"

# Upload tailwind.config.ts
upload_file "tailwind.config.ts" "" "import type { Config } from 'tailwindcss'

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
export default config"

echo ""
echo "Upload process completed!"
echo "You can now start a preview for this project."