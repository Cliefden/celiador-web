#!/bin/bash

# Celiador Development Environment Setup Script
# This script sets up the development environment for the hybrid monorepo

set -e

echo "🛠️  Setting Up Celiador Development Environment"
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if a port is in use
check_port() {
    local port=$1
    if lsof -i:$port >/dev/null 2>&1; then
        return 0  # Port is in use
    else
        return 1  # Port is free
    fi
}

# Function to install Node.js
install_nodejs() {
    print_status "Installing Node.js..."
    
    if command_exists brew; then
        print_status "Using Homebrew to install Node.js..."
        brew install node
    elif command_exists apt-get; then
        print_status "Using apt-get to install Node.js..."
        curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
        sudo apt-get install -y nodejs
    elif command_exists yum; then
        print_status "Using yum to install Node.js..."
        curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
        sudo yum install -y nodejs
    else
        print_error "Cannot install Node.js automatically. Please install Node.js 18+ manually."
        exit 1
    fi
}

# Function to install Redis
install_redis() {
    print_status "Installing Redis..."
    
    if command_exists brew; then
        print_status "Using Homebrew to install Redis..."
        brew install redis
        brew services start redis
    elif command_exists apt-get; then
        print_status "Using apt-get to install Redis..."
        sudo apt-get update
        sudo apt-get install -y redis-server
        sudo systemctl start redis-server
        sudo systemctl enable redis-server
    elif command_exists yum; then
        print_status "Using yum to install Redis..."
        sudo yum install -y redis
        sudo systemctl start redis
        sudo systemctl enable redis
    else
        print_error "Cannot install Redis automatically. Please install Redis manually."
        exit 1
    fi
}

# Function to check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    # Check if Node.js is installed
    if ! command_exists node; then
        print_warning "Node.js is not installed"
        read -p "Install Node.js 18+? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            install_nodejs
        else
            print_error "Node.js is required. Please install Node.js 18+ and try again."
            exit 1
        fi
    else
        # Check Node.js version
        NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
        if [ "$NODE_VERSION" -lt 18 ]; then
            print_error "Node.js version 18+ is required. Current version: $(node -v)"
            exit 1
        else
            print_success "Node.js $(node -v) is installed"
        fi
    fi
    
    # Check if npm is installed
    if ! command_exists npm; then
        print_error "npm is not installed. Please install npm and try again."
        exit 1
    else
        print_success "npm $(npm -v) is installed"
    fi
    
    # Check if git is installed
    if ! command_exists git; then
        print_error "Git is not installed. Please install git and try again."
        exit 1
    else
        print_success "Git $(git --version) is installed"
    fi
    
    # Check if Redis is installed and running
    if ! command_exists redis-cli; then
        print_warning "Redis is not installed"
        read -p "Install Redis? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            install_redis
        else
            print_warning "Redis is required for the development environment"
        fi
    else
        if redis-cli ping >/dev/null 2>&1; then
            print_success "Redis is running"
        else
            print_warning "Redis is installed but not running"
            if command_exists brew; then
                print_status "Starting Redis with Homebrew..."
                brew services start redis
            elif command_exists systemctl; then
                print_status "Starting Redis with systemctl..."
                sudo systemctl start redis
            else
                print_warning "Please start Redis manually"
            fi
        fi
    fi
}

# Function to create directory structure
create_directory_structure() {
    print_status "Creating directory structure..."
    
    # Create services directories
    mkdir -p services/web
    mkdir -p services/orchestrator
    mkdir -p services/preview-service
    mkdir -p services/codegen-worker
    
    # Create packages directories
    mkdir -p packages/shared
    mkdir -p packages/agent-tools
    mkdir -p packages/templates
    
    # Create other directories
    mkdir -p logs
    mkdir -p scripts
    mkdir -p tests
    
    print_success "Directory structure created"
}

# Function to create package.json files
create_package_json_files() {
    print_status "Creating package.json files..."
    
    # Root package.json
    cat > package.json << 'EOF'
{
  "name": "celiador-dev",
  "version": "1.0.0",
  "private": true,
  "description": "Celiador Development Monorepo",
  "scripts": {
    "dev": "npm run dev:all",
    "dev:all": "./scripts/dev-all.sh",
    "dev:web": "cd services/web && npm run dev",
    "dev:orchestrator": "cd services/orchestrator && npm run dev",
    "dev:preview": "cd services/preview-service && npm run dev",
    "dev:worker": "cd services/codegen-worker && npm run dev",
    "build": "./scripts/build-all.sh",
    "test": "./scripts/test-all.sh",
    "sync:deploy": "./scripts/sync-to-repos.sh",
    "setup": "./scripts/setup-dev.sh"
  },
  "workspaces": [
    "services/*",
    "packages/*"
  ],
  "devDependencies": {
    "concurrently": "^9.2.0",
    "tsx": "^4.7.0",
    "typescript": "^5.4.0"
  },
  "engines": {
    "node": ">=18.0.0",
    "npm": ">=8.0.0"
  }
}
EOF

    # Web service package.json
    cat > services/web/package.json << 'EOF'
{
  "name": "celiador-web",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev --turbopack",
    "build": "next build --turbopack",
    "start": "next start",
    "lint": "eslint .",
    "test": "jest"
  },
  "dependencies": {
    "@celiador/shared": "^1.0.0",
    "@radix-ui/react-dialog": "^1.1.15",
    "@radix-ui/react-label": "^2.1.7",
    "@radix-ui/react-tabs": "^1.1.13",
    "@supabase/supabase-js": "^2.57.0",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "lucide-react": "^0.542.0",
    "next": "15.5.2",
    "react": "19.1.0",
    "react-dom": "19.1.0",
    "tailwind-merge": "^3.3.1"
  },
  "devDependencies": {
    "@eslint/eslintrc": "^3",
    "@tailwindcss/postcss": "^4",
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "eslint": "^9",
    "eslint-config-next": "15.5.2",
    "jest": "^29.0.0",
    "tailwindcss": "^4",
    "typescript": "^5"
  }
}
EOF

    # Orchestrator service package.json
    cat > services/orchestrator/package.json << 'EOF'
{
  "name": "celiador-orchestrator",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "tsx src/index.ts",
    "build": "tsc -p tsconfig.json",
    "start": "node dist/index.js",
    "test": "jest",
    "lint": "eslint ."
  },
  "dependencies": {
    "@celiador/shared": "^1.0.0",
    "@celiador/agent-tools": "^1.0.0",
    "@celiador/templates": "^1.0.0",
    "@anthropic-ai/sdk": "^0.60.0",
    "@octokit/oauth-app": "^8.0.1",
    "@octokit/rest": "^22.0.0",
    "@supabase/supabase-js": "^2.54.0",
    "axios": "^1.7.0",
    "bullmq": "^5.7.0",
    "cors": "^2.8.5",
    "dotenv": "^16.4.1",
    "express": "^4.19.2",
    "morgan": "^1.10.0",
    "openai": "^5.12.2",
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "@types/cors": "^2.8.19",
    "@types/express": "^4.17.21",
    "@types/morgan": "^1.9.10",
    "@types/node": "^20.11.30",
    "eslint": "^9.0.0",
    "jest": "^29.0.0",
    "tsx": "^4.7.0",
    "typescript": "^5.4.0"
  }
}
EOF

    # Preview service package.json
    cat > services/preview-service/package.json << 'EOF'
{
  "name": "celiador-preview-service",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "test": "jest",
    "lint": "eslint ."
  },
  "dependencies": {
    "@celiador/shared": "^1.0.0",
    "@supabase/supabase-js": "^2.54.0",
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "dotenv": "^17.2.1"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/cors": "^2.8.17",
    "@types/node": "^20.11.30",
    "eslint": "^9.0.0",
    "jest": "^29.0.0",
    "tsx": "^4.7.0",
    "typescript": "^5.4.0"
  }
}
EOF

    # Codegen worker package.json
    cat > services/codegen-worker/package.json << 'EOF'
{
  "name": "celiador-codegen-worker",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "tsx src/index.ts",
    "build": "tsc -p tsconfig.json",
    "start": "node dist/index.js",
    "test": "jest",
    "lint": "eslint ."
  },
  "dependencies": {
    "@celiador/shared": "^1.0.0",
    "@celiador/agent-tools": "^1.0.0",
    "@celiador/templates": "^1.0.0",
    "@supabase/supabase-js": "^2.54.0",
    "bullmq": "^5.7.0",
    "dotenv": "^16.4.1",
    "openai": "^5.12.2",
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "@types/node": "^20.11.30",
    "eslint": "^9.0.0",
    "jest": "^29.0.0",
    "tsx": "^4.7.0",
    "typescript": "^5.4.0"
  }
}
EOF

    # Shared package package.json
    cat > packages/shared/package.json << 'EOF'
{
  "name": "@celiador/shared",
  "version": "1.0.0",
  "type": "module",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "dev": "tsc -p tsconfig.json --watch",
    "test": "jest",
    "lint": "eslint ."
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.54.0",
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "@types/node": "^20.11.30",
    "eslint": "^9.0.0",
    "jest": "^29.0.0",
    "typescript": "^5.4.0"
  },
  "publishConfig": {
    "access": "public"
  }
}
EOF

    # Agent tools package package.json
    cat > packages/agent-tools/package.json << 'EOF'
{
  "name": "@celiador/agent-tools",
  "version": "1.0.0",
  "type": "module",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "dev": "tsc -p tsconfig.json --watch",
    "test": "jest",
    "lint": "eslint ."
  },
  "dependencies": {
    "@celiador/shared": "^1.0.0",
    "@anthropic-ai/sdk": "^0.60.0",
    "openai": "^5.12.2"
  },
  "devDependencies": {
    "@types/node": "^20.11.30",
    "eslint": "^9.0.0",
    "jest": "^29.0.0",
    "typescript": "^5.4.0"
  },
  "publishConfig": {
    "access": "public"
  }
}
EOF

    # Templates package package.json
    cat > packages/templates/package.json << 'EOF'
{
  "name": "@celiador/templates",
  "version": "1.0.0",
  "type": "module",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "dev": "tsc -p tsconfig.json --watch",
    "test": "jest",
    "lint": "eslint ."
  },
  "dependencies": {
    "@celiador/shared": "^1.0.0"
  },
  "devDependencies": {
    "@types/node": "^20.11.30",
    "eslint": "^9.0.0",
    "jest": "^29.0.0",
    "typescript": "^5.4.0"
  },
  "publishConfig": {
    "access": "public"
  }
}
EOF

    print_success "Package.json files created"
}

# Function to create environment files
create_environment_files() {
    print_status "Creating environment files..."
    
    # Root .env.example
    cat > .env.example << 'EOF'
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Redis Configuration
REDIS_URL=redis://localhost:6379

# AI Services
OPENAI_API_KEY=your-openai-key
ANTHROPIC_API_KEY=your-anthropic-key

# GitHub Integration
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# Development URLs
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_PREVIEW_URL=http://localhost:4001
EOF

    # Web service .env.local.example
    cat > services/web/.env.local.example << 'EOF'
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_PREVIEW_URL=http://localhost:4001
EOF

    # Orchestrator service .env.example
    cat > services/orchestrator/.env.example << 'EOF'
# Server Configuration
NODE_ENV=development
PORT=4000

# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Redis Configuration
REDIS_URL=redis://localhost:6379

# AI Services
OPENAI_API_KEY=your-openai-key
ANTHROPIC_API_KEY=your-anthropic-key

# GitHub Integration
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# CORS Configuration
CORS_ORIGIN=http://localhost:3000
EOF

    # Preview service .env.example
    cat > services/preview-service/.env.example << 'EOF'
# Server Configuration
NODE_ENV=development
PORT=4001

# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Preview Configuration
PREVIEW_BASE_URL=http://localhost:4001
PREVIEW_PORT_RANGE=8000-9000
PREVIEW_TIMEOUT=3600000
EOF

    # Codegen worker .env.example
    cat > services/codegen-worker/.env.example << 'EOF'
# Server Configuration
NODE_ENV=development

# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Redis Configuration
REDIS_URL=redis://localhost:6379

# AI Services
OPENAI_API_KEY=your-openai-key
ANTHROPIC_API_KEY=your-anthropic-key

# Worker Configuration
WORKER_CONCURRENCY=1
JOB_TIMEOUT=300000
MAX_RETRIES=3
EOF

    print_success "Environment files created"
}

# Function to create TypeScript configuration files
create_typescript_configs() {
    print_status "Creating TypeScript configuration files..."
    
    # Root tsconfig.json
    cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "node",
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true,
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "incremental": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve"
  },
  "include": [
    "services/**/*",
    "packages/**/*"
  ],
  "exclude": [
    "node_modules",
    "dist",
    "build"
  ]
}
EOF

    print_success "TypeScript configuration files created"
}

# Function to create README
create_readme() {
    print_status "Creating README..."
    
    cat > README.md << 'EOF'
# Celiador Development Environment

This is the development monorepo for the Celiador platform. It contains all services and shared packages needed for local development.

## Quick Start

1. **Setup the development environment:**
   ```bash
   ./scripts/setup-dev.sh
   ```

2. **Start all services:**
   ```bash
   npm run dev:all
   ```

3. **Access the application:**
   - Frontend: http://localhost:3000
   - API: http://localhost:4000
   - Preview: http://localhost:4001

## Available Scripts

- `npm run dev:all` - Start all services
- `npm run dev:web` - Start only the web app
- `npm run dev:orchestrator` - Start only the orchestrator
- `npm run dev:preview` - Start only the preview service
- `npm run dev:worker` - Start only the codegen worker
- `npm run build` - Build all services
- `npm run test` - Test all services
- `npm run sync:deploy` - Sync to deployment repositories

## Project Structure

```
celiador-dev/
├── services/
│   ├── web/                    # Frontend (Next.js)
│   ├── orchestrator/           # API service (Express.js)
│   ├── preview-service/        # Preview service (Express.js)
│   └── codegen-worker/         # AI worker (Node.js)
├── packages/
│   ├── shared/                 # Shared utilities
│   ├── agent-tools/           # AI agent tools
│   └── templates/             # Project templates
├── scripts/                   # Development scripts
├── logs/                      # Service logs
└── tests/                     # Integration tests
```

## Environment Setup

1. Copy environment files:
   ```bash
   cp .env.example .env
   cp services/web/.env.local.example services/web/.env.local
   cp services/orchestrator/.env.example services/orchestrator/.env
   cp services/preview-service/.env.example services/preview-service/.env
   cp services/codegen-worker/.env.example services/codegen-worker/.env
   ```

2. Update the environment files with your actual values.

## Development Workflow

1. **Make changes** to any service in the `services/` directory
2. **Test locally** using `npm run dev:all`
3. **Deploy** using `npm run sync:deploy`

## Deployment

The hybrid approach syncs changes from this development monorepo to separate deployment repositories:

- `celiador-web` → Deploys to Vercel
- `celiador-orchestrator` → Deploys to Railway
- `celiador-preview-service` → Deploys to Railway
- `celiador-codegen-worker` → Deploys to Railway

## Troubleshooting

- **Port conflicts**: Make sure ports 3000, 4000, and 4001 are free
- **Redis issues**: Ensure Redis is running (`brew services start redis`)
- **Dependencies**: Run `npm install` in the root directory
- **Logs**: Check the `logs/` directory for service logs

## Support

For issues and questions, please check the logs in the `logs/` directory or contact the development team.
EOF

    print_success "README created"
}

# Function to install dependencies
install_dependencies() {
    print_status "Installing dependencies..."
    
    # Install root dependencies
    npm install
    
    # Install dependencies for each service
    for service in services/*/; do
        if [ -d "$service" ] && [ -f "$service/package.json" ]; then
            service_name=$(basename "$service")
            print_status "Installing dependencies for $service_name..."
            cd "$service"
            npm install
            cd - > /dev/null
        fi
    done
    
    # Install dependencies for each package
    for package in packages/*/; do
        if [ -d "$package" ] && [ -f "$package/package.json" ]; then
            package_name=$(basename "$package")
            print_status "Installing dependencies for $package_name..."
            cd "$package"
            npm install
            cd - > /dev/null
        fi
    done
    
    print_success "Dependencies installed"
}

# Function to make scripts executable
make_scripts_executable() {
    print_status "Making scripts executable..."
    
    chmod +x scripts/*.sh
    
    print_success "Scripts made executable"
}

# Main execution
main() {
    # Check prerequisites
    check_prerequisites
    
    # Create directory structure
    create_directory_structure
    
    # Create package.json files
    create_package_json_files
    
    # Create environment files
    create_environment_files
    
    # Create TypeScript configuration files
    create_typescript_configs
    
    # Create README
    create_readme
    
    # Make scripts executable
    make_scripts_executable
    
    # Install dependencies
    install_dependencies
    
    echo ""
    echo "=============================================="
    print_success "🎉 Development environment setup complete!"
    echo "=============================================="
    echo ""
    echo "📝 Next steps:"
    echo "1. Copy environment files and update with your values:"
    echo "   cp .env.example .env"
    echo "   cp services/web/.env.local.example services/web/.env.local"
    echo "   cp services/orchestrator/.env.example services/orchestrator/.env"
    echo "   cp services/preview-service/.env.example services/preview-service/.env"
    echo "   cp services/codegen-worker/.env.example services/codegen-worker/.env"
    echo ""
    echo "2. Start the development environment:"
    echo "   npm run dev:all"
    echo ""
    echo "3. Access your application:"
    echo "   Frontend: http://localhost:3000"
    echo "   API: http://localhost:4000"
    echo "   Preview: http://localhost:4001"
    echo ""
    print_status "Happy coding! 🚀"
}

# Run main function
main "$@"
