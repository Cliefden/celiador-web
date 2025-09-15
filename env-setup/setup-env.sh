#!/bin/bash

# Celiador Environment Setup Script
# This script helps you set up environment variables for all services

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

echo "🔧 Celiador Environment Setup"
echo "============================="
echo ""

# Check if we're in the right directory
if [ ! -d "../celiador-web" ] || [ ! -d "../celiador-orchestrator" ]; then
    print_error "Please run this script from the env-setup directory"
    exit 1
fi

# Function to create environment file for a service
create_env_file() {
    local service_name=$1
    local env_file=$2
    local template_file=$3
    
    print_status "Setting up environment for $service_name..."
    
    if [ -f "$env_file" ]; then
        print_warning "$env_file already exists. Backing up to ${env_file}.backup"
        cp "$env_file" "${env_file}.backup"
    fi
    
    if [ -f "$template_file" ]; then
        cp "$template_file" "$env_file"
        print_success "Created $env_file from template"
    else
        print_error "Template file $template_file not found"
        return 1
    fi
}

# Function to prompt for missing values
prompt_for_values() {
    local env_file=$1
    local service_name=$2
    
    print_status "Checking $service_name environment variables..."
    
    # Check for placeholder values and prompt for real ones
    if grep -q "your.*here" "$env_file"; then
        print_warning "Found placeholder values in $env_file"
        echo ""
        echo "Please edit $env_file and replace the following placeholders:"
        grep "your.*here" "$env_file" | sed 's/^/  - /'
        echo ""
        read -p "Press Enter when you've updated the values..."
    fi
}

# Create environment files for each service
echo "📝 Creating environment files..."

# Frontend (celiador-web)
create_env_file "Frontend" "../celiador-web/.env.local" "web.env.template"

# Orchestrator
create_env_file "Orchestrator" "../celiador-orchestrator/.env" "orchestrator.env.template"

# Preview Service
create_env_file "Preview Service" "../celiador-preview-service/.env" "preview.env.template"

# Codegen Worker
create_env_file "Codegen Worker" "../celiador-codegen-worker/.env" "worker.env.template"

echo ""
print_success "✅ Environment files created!"

# Prompt for missing values
echo ""
echo "🔍 Checking for placeholder values..."
prompt_for_values "../celiador-web/.env.local" "Frontend"
prompt_for_values "../celiador-orchestrator/.env" "Orchestrator"
prompt_for_values "../celiador-preview-service/.env" "Preview Service"
prompt_for_values "../celiador-codegen-worker/.env" "Codegen Worker"

echo ""
print_success "🎉 Environment setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Make sure Redis is running: redis-server"
echo "2. Start the services using the dev scripts"
echo "3. Check the logs for any missing environment variables"
echo ""
echo "🚀 To start all services:"
echo "   ./scripts/dev-all.sh"
