#!/bin/bash

# Celiador Environment Validation Script
# This script validates that all required environment variables are set

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

echo "🔍 Celiador Environment Validation"
echo "=================================="
echo ""

# Function to validate environment file
validate_env_file() {
    local env_file=$1
    local service_name=$2
    local required_vars=("$@")
    required_vars=("${required_vars[@]:2}") # Remove first two arguments
    
    print_status "Validating $service_name environment..."
    
    if [ ! -f "$env_file" ]; then
        print_error "$env_file not found"
        return 1
    fi
    
    local missing_vars=()
    local placeholder_vars=()
    
    for var in "${required_vars[@]}"; do
        if ! grep -q "^${var}=" "$env_file"; then
            missing_vars+=("$var")
        elif grep -q "^${var}=.*your.*here" "$env_file"; then
            placeholder_vars+=("$var")
        fi
    done
    
    if [ ${#missing_vars[@]} -eq 0 ] && [ ${#placeholder_vars[@]} -eq 0 ]; then
        print_success "$service_name environment is valid"
        return 0
    else
        if [ ${#missing_vars[@]} -gt 0 ]; then
            print_error "Missing variables in $service_name:"
            for var in "${missing_vars[@]}"; do
                echo "  - $var"
            done
        fi
        
        if [ ${#placeholder_vars[@]} -gt 0 ]; then
            print_warning "Placeholder values in $service_name:"
            for var in "${placeholder_vars[@]}"; do
                echo "  - $var"
            done
        fi
        
        return 1
    fi
}

# Check if we're in the right directory
if [ ! -d "../celiador-web" ] || [ ! -d "../celiador-orchestrator" ]; then
    print_error "Please run this script from the env-setup directory"
    exit 1
fi

# Validate each service
echo "📋 Validating environment files..."

# Frontend validation
validate_env_file "../celiador-web/.env.local" "Frontend" \
    "NEXT_PUBLIC_SUPABASE_URL" \
    "NEXT_PUBLIC_SUPABASE_ANON_KEY" \
    "NEXT_PUBLIC_ORCHESTRATOR_URL"

# Orchestrator validation
validate_env_file "../celiador-orchestrator/.env" "Orchestrator" \
    "SUPABASE_URL" \
    "SUPABASE_ANON_KEY" \
    "SUPABASE_SERVICE_ROLE_KEY" \
    "REDIS_URL" \
    "PORT" \
    "OPENAI_API_KEY" \
    "GITHUB_CLIENT_ID" \
    "GITHUB_CLIENT_SECRET"

# Preview Service validation
validate_env_file "../celiador-preview-service/.env" "Preview Service" \
    "SUPABASE_URL" \
    "SUPABASE_SERVICE_ROLE_KEY" \
    "PREVIEW_SERVICE_PORT"

# Worker validation
validate_env_file "../celiador-codegen-worker/.env" "Codegen Worker" \
    "SUPABASE_URL" \
    "SUPABASE_SERVICE_ROLE_KEY" \
    "REDIS_URL" \
    "OPENAI_API_KEY"

echo ""
print_success "🎉 Environment validation complete!"

# Check for external dependencies
echo ""
echo "🔧 Checking external dependencies..."

# Check Redis
if command -v redis-cli >/dev/null 2>&1; then
    if redis-cli ping >/dev/null 2>&1; then
        print_success "Redis is running"
    else
        print_warning "Redis is installed but not running. Start with: redis-server"
    fi
else
    print_warning "Redis not found. Install with: brew install redis"
fi

# Check Node.js
if command -v node >/dev/null 2>&1; then
    node_version=$(node --version)
    print_success "Node.js is installed: $node_version"
else
    print_error "Node.js not found. Please install Node.js 18+"
fi

# Check npm
if command -v npm >/dev/null 2>&1; then
    npm_version=$(npm --version)
    print_success "npm is installed: $npm_version"
else
    print_error "npm not found. Please install npm"
fi

echo ""
echo "📋 Summary:"
echo "1. Update any missing or placeholder environment variables"
echo "2. Make sure Redis is running: redis-server"
echo "3. Install dependencies: npm install (in each service directory)"
echo "4. Start services: ./scripts/dev-all.sh"
