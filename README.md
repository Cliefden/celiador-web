# Bether - AI-Powered Application Generator

A monorepo containing both the web-based application generator and the iOS mobile app.

## 🏗️ Project Structure

```
bether/
├── bether_nextjs/          # Web application (Next.js + Express + BullMQ)
│   ├── apps/
│   │   ├── web/           # Next.js frontend
│   │   └── orchestrator/  # Express.js backend + job queue
│   ├── workers/
│   │   └── codegen/       # BullMQ worker for code generation
│   └── packages/
│       ├── shared/        # Shared utilities and types
│       ├── agent-tools/   # AI agent tools
│       └── templates/     # Project templates
├── bether_swift/          # iOS mobile application
└── README.md
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and pnpm
- Redis (for job queue)
- OpenAI API key
- Supabase account (for database and auth)

### Setup

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd bether
   ```

2. **Install dependencies**
   ```bash
   cd bether_nextjs
   pnpm install
   ```

3. **Environment setup**
   ```bash
   # Copy environment examples
   cp env.example apps/orchestrator/.env
   cp env.example apps/web/.env.local
   cp env.example workers/codegen/.env
   
   # Update with your actual values
   # - OpenAI API key
   # - Supabase credentials
   # - Redis URL
   ```

4. **Start Redis**
   ```bash
   brew services start redis
   ```

5. **Start the development servers**
   ```bash
   # Terminal 1: Orchestrator (backend)
   pnpm --filter @mvp/orchestrator dev
   
   # Terminal 2: Worker (code generation)
   pnpm --filter @mvp/worker-codegen dev
   
   # Terminal 3: Web app (frontend)
   pnpm --filter @mvp/web dev
   ```

6. **Access the application**
   - Web app: http://localhost:3000
   - Backend API: http://localhost:4000

## 📱 iOS App (bether_swift)

The iOS application is located in `bether_swift/`. This will be developed as a native iOS app to complement the web-based generator.

### Setup (when ready)
```bash
cd bether_swift
# iOS development setup will be added here
```

## 🔧 Development

### Architecture

- **Frontend**: Next.js with TypeScript and Tailwind CSS
- **Backend**: Express.js with Supabase for database and auth
- **Job Queue**: BullMQ with Redis for background processing
- **AI Integration**: OpenAI API for code generation
- **Database**: Supabase (PostgreSQL) with Row Level Security
- **Authentication**: Supabase Auth with JWT tokens

### Key Features

- ✅ User authentication and authorization
- ✅ Project creation and management
- ✅ AI-powered code generation
- ✅ Background job processing
- ✅ Real-time job status updates
- ✅ Template-based project scaffolding
- ✅ File system integration
- ✅ Git repository initialization

### Environment Variables

#### Required for Web App (`apps/web/.env.local`)
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

#### Required for Orchestrator (`apps/orchestrator/.env`)
```
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
DATABASE_URL=your_postgresql_connection_string
REDIS_URL=redis://localhost:6379
```

#### Required for Worker (`workers/codegen/.env`)
```
OPENAI_API_KEY=your_openai_api_key
REDIS_URL=redis://localhost:6379
```

## 🚀 Deployment

### Web Application
The web application can be deployed to:
- **Vercel**: For the Next.js frontend
- **Railway/Render**: For the Express.js backend
- **Redis Cloud**: For the job queue

### iOS Application
The iOS app will be distributed through:
- **TestFlight**: For beta testing
- **App Store**: For production releases

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

[Add your license here]

## 🆘 Support

For support and questions:
- Create an issue in this repository
- [Add other support channels]
