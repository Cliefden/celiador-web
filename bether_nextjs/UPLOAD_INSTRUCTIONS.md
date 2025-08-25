# Next.js File Upload Instructions

This guide explains how to upload the necessary Next.js files to complete the project structure for the preview system.

## Project Details
- **Project ID**: `0e98a0bd-7747-4c24-bfed-3682f2dbbe97`
- **Orchestrator API**: `http://localhost:4000`
- **Endpoint**: `POST /projects/:id/files/upload`

## Files to Upload

The following files will be created to complete the Next.js application structure:

1. **src/app/layout.tsx** - Root layout component with styling
2. **src/app/page.tsx** - Home page with a beautiful demo UI featuring:
   - Hero section with gradient text
   - Feature cards showcasing app capabilities
   - Live clock component
   - Responsive design with Tailwind CSS
3. **src/app/globals.css** - Tailwind CSS base styles
4. **next.config.js** - Next.js configuration for standalone builds
5. **tsconfig.json** - TypeScript configuration
6. **tailwind.config.ts** - Tailwind CSS configuration

## Getting the Authentication Token

### Method 1: Browser Console (Recommended)
1. Open the web application in your browser and make sure you're logged in
2. Open browser dev tools (F12)
3. Go to the Console tab
4. Run this command to get your auth token:
   ```javascript
   (await supabase.auth.getSession()).data.session.access_token
   ```
5. Copy the token (it will be a long JWT string)

### Method 2: Network Tab
1. Open browser dev tools (F12)
2. Go to the Network tab
3. Make any API request (e.g., navigate around the app)
4. Find a request to the orchestrator API
5. Look for the `Authorization` header in the request
6. Copy the token after "Bearer " (everything after "Bearer ")

### Method 3: Local Storage (if available)
1. Open browser dev tools (F12)
2. Go to Application > Local Storage
3. Look for Supabase auth data (keys starting with `supabase.auth`)
4. Extract the access_token from the session data

## Upload Methods

### Option 1: Browser Console Script (Easiest)
1. Make sure you're on the web application and logged in
2. Open browser dev tools console
3. Copy and paste the contents of `apps/web/src/scripts/upload-nextjs-files.js`
4. Run: `await uploadNextJSFiles()`

### Option 2: Node.js Script
```bash
node upload-nextjs-files.js YOUR_AUTH_TOKEN_HERE
```

### Option 3: Bash Script with curl
```bash
./upload-nextjs-files.sh YOUR_AUTH_TOKEN_HERE
```

### Option 4: Manual curl Commands

Replace `YOUR_AUTH_TOKEN_HERE` with your actual token:

```bash
# Upload layout.tsx
curl -X POST http://localhost:4000/projects/0e98a0bd-7747-4c24-bfed-3682f2dbbe97/files/upload \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "fileName": "layout.tsx",
    "path": "src/app",
    "content": "import type { Metadata } from '\''next'\''\nimport { Inter } from '\''next/font/google'\''\nimport '\''./globals.css'\''\n\nconst inter = Inter({ subsets: ['\''latin'\''] })\n\nexport const metadata: Metadata = {\n  title: '\''Bether Preview - Next.js App'\'',\n  description: '\''A preview of your Next.js application built with Bether'\'',\n}\n\nexport default function RootLayout({\n  children,\n}: {\n  children: React.ReactNode\n}) {\n  return (\n    <html lang=\"en\">\n      <body className={inter.className}>\n        <div className=\"min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100\">\n          {children}\n        </div>\n      </body>\n    </html>\n  )\n}"
  }'

# Continue with other files...
```

## Using the API Client in Web App

The web application has been updated with a new `uploadFile` method in the ApiClient. You can use it programmatically:

```javascript
import { ApiClient } from '../lib/api';

// Upload a single file
await ApiClient.uploadFile(
  '0e98a0bd-7747-4c24-bfed-3682f2dbbe97', // project ID
  'page.tsx',                              // filename
  'export default function...',            // content
  'src/app'                               // path (optional)
);
```

## After Upload

Once all files are uploaded:

1. Use the preview API to start a preview:
   ```javascript
   await ApiClient.startPreview('0e98a0bd-7747-4c24-bfed-3682f2dbbe97', {
     name: 'Next.js Demo Preview',
     type: 'nextjs'
   });
   ```

2. Check the preview status:
   ```javascript
   await ApiClient.getPreviewStatus(projectId, previewId);
   ```

3. The preview should build and deploy automatically, providing a live URL

## Troubleshooting

### Authentication Issues
- Make sure your auth token is valid and not expired
- Ensure you're logged into the web application
- Check that the token includes the full JWT string

### Upload Failures
- Verify the orchestrator service is running on `localhost:4000`
- Check the console/network tab for detailed error messages
- Ensure the project ID is correct: `0e98a0bd-7747-4c24-bfed-3682f2dbbe97`

### File Structure
The uploaded files will create this structure in your project:
```
project-root/
├── src/
│   └── app/
│       ├── layout.tsx
│       ├── page.tsx
│       └── globals.css
├── next.config.js
├── tsconfig.json
├── tailwind.config.ts
└── package.json (already exists)
```

This structure provides a complete, working Next.js application ready for preview deployment.