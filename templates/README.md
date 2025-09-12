# Celiador Templates

This directory contains all template projects for the Celiador platform. Each template is a complete, working Next.js application that can be used as a starting point for user projects.

## Template Development Workflow

1. **Create Template** - Build and test the template locally in this directory
2. **Test Functionality** - Ensure the template works perfectly with `npm run dev`
3. **Upload to Supabase** - Use upload scripts to sync template files to Supabase Storage
4. **Test in Celiador** - Verify the template works through the Celiador preview system

## Template Structure

Each template should follow this structure:
```
templates/
├── template-name/
│   ├── package.json          # Dependencies and scripts
│   ├── next.config.js        # Next.js configuration
│   ├── tailwind.config.js    # Tailwind CSS configuration
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx    # Root layout
│   │   │   ├── page.tsx      # Homepage
│   │   │   └── globals.css   # Global styles
│   │   └── components/       # Reusable components
│   └── README.md             # Template-specific documentation
```

## Templates

- **ai-chat-app** - Simple AI chat interface with modern UI
- **next-prisma-supabase** - Full-stack app with database integration
- **landing-page** - Marketing landing page template
- **dashboard-app** - Admin dashboard with charts and tables

## Development Commands

```bash
# Install dependencies for a template
cd templates/template-name
npm install

# Test template locally
npm run dev

# Upload template to Supabase Storage
cd ../..
node scripts/upload-template.js template-name
```

## Best Practices

1. **Keep it Simple** - Templates should be easy to understand and extend
2. **Modern Stack** - Use Next.js 14+, React 18+, TypeScript, Tailwind CSS
3. **Responsive Design** - Ensure templates work on all devices
4. **Clean Code** - Well-organized, commented, and formatted
5. **No Secrets** - Never include API keys or sensitive data
6. **Dependencies** - Use stable, well-maintained packages only