-- Populate template categories
INSERT INTO template_categories (key, name, description, icon, color_primary, sort_order) VALUES
('saas', 'SaaS', 'Software as a Service applications with subscriptions and user management', 'cloud', '#3B82F6', 1),
('ecommerce', 'E-commerce', 'Online stores and marketplace applications', 'cart', '#10B981', 2),
('ai', 'AI Apps', 'Artificial intelligence and machine learning applications', 'brain', '#8B5CF6', 3),
('landing', 'Landing Pages', 'Marketing and promotional landing pages', 'doc.text', '#06B6D4', 4),
('dashboard', 'Dashboards', 'Analytics and admin dashboard applications', 'chart.bar', '#F59E0B', 5),
('mobile', 'Mobile', 'Mobile-first and responsive applications', 'iphone', '#EF4444', 6);

-- Populate template features
INSERT INTO template_features (name, description, icon, category) VALUES
-- Authentication & User Management
('User Authentication', 'Complete user registration, login, and session management', 'shield.checkered', 'auth'),
('OAuth Integration', 'Social login with Google, GitHub, Discord, etc.', 'person.2', 'auth'),
('Role-Based Access', 'User roles and permission management system', 'person.badge.key', 'auth'),
('User Profiles', 'Customizable user profile pages and settings', 'person.crop.circle', 'auth'),

-- Payment & Billing
('Stripe Integration', 'Complete payment processing with Stripe', 'creditcard', 'payment'),
('Subscription Management', 'Recurring billing and subscription plans', 'calendar.badge.clock', 'payment'),
('Billing Dashboard', 'Invoice management and payment history', 'doc.text.below.ecg', 'payment'),
('Free Trial Support', 'Trial periods and freemium models', 'gift', 'payment'),

-- UI & Design
('Responsive Design', 'Mobile-first responsive layouts', 'iphone.and.ipad', 'ui'),
('Dark Mode', 'Light and dark theme switching', 'moon', 'ui'),
('Component Library', 'Pre-built reusable UI components', 'square.grid.3x3', 'ui'),
('Admin Dashboard', 'Administrative interface and controls', 'gear', 'ui'),
('Real-time Updates', 'Live data updates using WebSockets', 'bolt', 'ui'),

-- Data & Storage
('Database Schema', 'Pre-configured database structure and migrations', 'externaldrive', 'database'),
('File Uploads', 'Image and document upload functionality', 'square.and.arrow.up', 'database'),
('Data Export', 'CSV, JSON, and PDF export capabilities', 'square.and.arrow.down', 'database'),
('Search Functionality', 'Full-text search and filtering', 'magnifyingglass', 'database'),

-- Communication
('Email Templates', 'Transactional email templates and sending', 'envelope', 'communication'),
('Push Notifications', 'Browser and mobile push notifications', 'bell', 'communication'),
('Chat System', 'Real-time messaging and chat features', 'message', 'communication'),
('Contact Forms', 'Contact and feedback form handling', 'mail', 'communication'),

-- E-commerce Specific
('Shopping Cart', 'Add to cart and checkout functionality', 'cart', 'ecommerce'),
('Product Catalog', 'Product listings and category management', 'square.grid.2x2', 'ecommerce'),
('Order Management', 'Order tracking and fulfillment system', 'shippingbox', 'ecommerce'),
('Inventory Tracking', 'Stock management and notifications', 'cube.box', 'ecommerce'),
('Customer Accounts', 'Customer registration and order history', 'person.circle', 'ecommerce'),

-- AI & Analytics
('OpenAI Integration', 'GPT model integration for AI features', 'brain', 'ai'),
('Custom AI Personas', 'Configurable AI character personalities', 'theatermasks', 'ai'),
('Voice Input', 'Speech recognition and voice commands', 'mic', 'ai'),
('Interactive Charts', 'Dynamic data visualization and charts', 'chart.line.uptrend.xyaxis', 'analytics'),
('Custom Widgets', 'Drag-and-drop dashboard widgets', 'rectangle.3.group', 'analytics'),

-- Development & Deployment
('API Documentation', 'Auto-generated API docs and testing', 'doc.text', 'development'),
('Testing Suite', 'Unit and integration test setup', 'checkmark.seal', 'development'),
('CI/CD Pipeline', 'Automated testing and deployment', 'arrow.triangle.2.circlepath', 'development'),
('Docker Support', 'Containerization and deployment configs', 'cube', 'development'),

-- SEO & Marketing
('SEO Optimized', 'Search engine optimization and meta tags', 'globe', 'marketing'),
('Analytics Integration', 'Google Analytics and tracking setup', 'chart.bar', 'marketing'),
('A/B Testing', 'Split testing and conversion optimization', 'slider.horizontal.below.rectangle', 'marketing'),
('Social Sharing', 'Social media integration and sharing', 'square.and.arrow.up', 'marketing');

-- Populate template tech stack
INSERT INTO template_tech_stack (name, description, icon, category, website_url) VALUES
-- Frontend Frameworks
('Next.js', 'React framework for production applications', 'globe', 'frontend', 'https://nextjs.org'),
('React', 'JavaScript library for building user interfaces', 'atom', 'frontend', 'https://react.dev'),
('Vue.js', 'Progressive JavaScript framework', 'v.circle', 'frontend', 'https://vuejs.org'),
('Svelte', 'Cybernetically enhanced web apps', 'sparkles', 'frontend', 'https://svelte.dev'),
('Angular', 'Platform for building mobile and desktop web applications', 'triangle', 'frontend', 'https://angular.io'),

-- Languages
('TypeScript', 'Typed superset of JavaScript', 'curlybraces', 'language', 'https://typescriptlang.org'),
('JavaScript', 'Programming language of the web', 'curlybraces', 'language', 'https://javascript.info'),
('Python', 'High-level programming language', 'snake', 'language', 'https://python.org'),
('Go', 'Fast and simple programming language', 'goforward', 'language', 'https://golang.org'),

-- Styling & UI
('Tailwind CSS', 'Utility-first CSS framework', 'paintbrush', 'styling', 'https://tailwindcss.com'),
('Styled Components', 'CSS-in-JS library for styling React components', 'paintbrush', 'styling', 'https://styled-components.com'),
('Chakra UI', 'Modular and accessible component library', 'square.grid.3x3', 'styling', 'https://chakra-ui.com'),
('Material UI', 'React components implementing Google Material Design', 'square.grid.3x3', 'styling', 'https://mui.com'),

-- Backend & APIs
('Node.js', 'JavaScript runtime for server-side development', 'server.rack', 'backend', 'https://nodejs.org'),
('Express', 'Fast, minimalist web framework for Node.js', 'server.rack', 'backend', 'https://expressjs.com'),
('tRPC', 'End-to-end typesafe APIs', 'arrow.left.arrow.right', 'backend', 'https://trpc.io'),
('GraphQL', 'Query language and runtime for APIs', 'arrow.triangle.merge', 'backend', 'https://graphql.org'),
('REST API', 'Representational State Transfer API architecture', 'arrow.left.arrow.right', 'backend', null),

-- Databases
('Supabase', 'Open source Firebase alternative with PostgreSQL', 'externaldrive.connected.to.line.below', 'database', 'https://supabase.com'),
('PostgreSQL', 'Advanced open source relational database', 'externaldrive', 'database', 'https://postgresql.org'),
('MongoDB', 'Document-based NoSQL database', 'externaldrive', 'database', 'https://mongodb.com'),
('Redis', 'In-memory data structure store', 'externaldrive.badge.timemachine', 'database', 'https://redis.io'),
('Prisma', 'Next-generation ORM for Node.js and TypeScript', 'externaldrive.connected.to.line.below', 'database', 'https://prisma.io'),
('MySQL', 'Popular open source relational database', 'externaldrive', 'database', 'https://mysql.com'),

-- Authentication & Services
('NextAuth.js', 'Complete authentication solution for Next.js', 'key', 'auth', 'https://next-auth.js.org'),
('Clerk', 'Complete user management and authentication', 'person.badge.key', 'auth', 'https://clerk.com'),
('Auth0', 'Identity platform for application builders', 'shield', 'auth', 'https://auth0.com'),

-- Payment Processing
('Stripe', 'Online payment processing platform', 'creditcard', 'payment', 'https://stripe.com'),
('PayPal', 'Digital payment platform', 'dollarsign.circle', 'payment', 'https://paypal.com'),
('Lemon Squeezy', 'All-in-one platform for digital product sales', 'dollarsign.circle', 'payment', 'https://lemonsqueezy.com'),

-- AI & ML
('OpenAI API', 'GPT models and AI completion services', 'brain', 'ai', 'https://openai.com'),
('Anthropic Claude', 'Constitutional AI assistant', 'brain.head.profile', 'ai', 'https://anthropic.com'),
('Hugging Face', 'Machine learning model hub and inference', 'face.smiling', 'ai', 'https://huggingface.co'),

-- Real-time & Communication
('WebSocket', 'Real-time bidirectional communication', 'wifi', 'communication', null),
('Socket.io', 'Real-time application framework', 'wifi', 'communication', 'https://socket.io'),
('Pusher', 'Real-time messaging service', 'bell.badge', 'communication', 'https://pusher.com'),

-- Charts & Visualization
('Chart.js', 'Simple yet flexible JavaScript charting library', 'chart.line.uptrend.xyaxis', 'visualization', 'https://chartjs.org'),
('D3.js', 'Data-driven documents for dynamic visualizations', 'chart.bar', 'visualization', 'https://d3js.org'),
('Recharts', 'Composable charting library for React', 'chart.line.uptrend.xyaxis', 'visualization', 'https://recharts.org'),

-- Deployment & Infrastructure
('Vercel', 'Platform for frontend frameworks and static sites', 'cloud', 'deployment', 'https://vercel.com'),
('Netlify', 'Platform for web applications and static sites', 'cloud', 'deployment', 'https://netlify.com'),
('Docker', 'Containerization platform', 'cube', 'deployment', 'https://docker.com'),
('AWS', 'Amazon Web Services cloud platform', 'cloud', 'deployment', 'https://aws.amazon.com'),

-- Testing & Development
('Jest', 'JavaScript testing framework', 'checkmark.seal', 'testing', 'https://jestjs.io'),
('Cypress', 'End-to-end testing framework', 'checkmark.seal', 'testing', 'https://cypress.io'),
('Playwright', 'Cross-browser testing framework', 'checkmark.seal', 'testing', 'https://playwright.dev'),
('ESLint', 'JavaScript and TypeScript linting utility', 'exclamationmark.triangle', 'development', 'https://eslint.org'),
('Prettier', 'Code formatter for consistent style', 'textformat', 'development', 'https://prettier.io'),

-- CSS & Animation
('Framer Motion', 'Production-ready motion library for React', 'wand.and.stars', 'animation', 'https://framer.com/motion'),
('Alpine.js', 'Lightweight JavaScript framework', 'mountain.2', 'frontend', 'https://alpinejs.dev'),

-- State Management
('Zustand', 'Small, fast, and scalable state management', 'square.stack.3d.up', 'state', 'https://zustand-demo.pmnd.rs'),
('Redux Toolkit', 'Efficient Redux for modern applications', 'square.stack.3d.up', 'state', 'https://redux-toolkit.js.org');