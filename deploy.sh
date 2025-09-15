#!/bin/bash

# Celiador Deployment Script
# This script deploys all services to production

set -e

echo "🚀 Celiador Deployment Script"
echo "============================="

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

# Function to build and publish a package
publish_package() {
    local package_name=$1
    local package_path="bether_nextjs/packages/$package_name"
    
    print_status "Building and publishing $package_name..."
    
    if [ ! -d "$package_path" ]; then
        print_error "Package directory $package_path does not exist"
        return 1
    fi
    
    cd "$package_path"
    
    # Install dependencies
    npm install
    
    # Build the package
    if npm run build; then
        print_success "✅ $package_name built successfully"
    else
        print_error "❌ Failed to build $package_name"
        return 1
    fi
    
    # Publish to NPM
    if npm publish --access public; then
        print_success "✅ $package_name published to NPM"
    else
        print_error "❌ Failed to publish $package_name"
        return 1
    fi
    
    cd - > /dev/null
}

# Function to deploy a service
deploy_service() {
    local service_name=$1
    local service_path=$2
    
    print_status "Deploying $service_name..."
    
    if [ ! -d "$service_path" ]; then
        print_error "Service directory $service_path does not exist"
        return 1
    fi
    
    cd "$service_path"
    
    # Install dependencies
    npm install
    
    # Build the service
    if npm run build; then
        print_success "✅ $service_name built successfully"
    else
        print_error "❌ Failed to build $service_name"
        return 1
    fi
    
    # Check if it's a Vercel project (has vercel.json)
    if [ -f "vercel.json" ]; then
        print_status "Deploying $service_name to Vercel..."
        if command_exists vercel; then
            vercel --prod
            print_success "✅ $service_name deployed to Vercel"
        else
            print_warning "⚠️  Vercel CLI not found. Please deploy manually to Vercel."
        fi
    else
        print_status "Deploying $service_name to Railway..."
        if command_exists railway; then
            railway up
            print_success "✅ $service_name deployed to Railway"
        else
            print_warning "⚠️  Railway CLI not found. Please deploy manually to Railway."
        fi
    fi
    
    cd - > /dev/null
}

# Function to check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    # Check if Node.js is installed
    if ! command_exists node; then
        print_error "Node.js is not installed. Please install Node.js 18+ and try again."
        exit 1
    fi
    
    # Check if npm is installed
    if ! command_exists npm; then
        print_error "npm is not installed. Please install npm and try again."
        exit 1
    fi
    
    # Check if we're logged into NPM
    if ! npm whoami >/dev/null 2>&1; then
        print_error "Not logged into NPM. Please run 'npm login' first."
        exit 1
    fi
    
    print_success "Prerequisites check passed"
}

# Main execution
main() {
    # Check prerequisites
    check_prerequisites
    
    echo ""
    print_status "Starting deployment process..."
    echo ""
    
    # Publish shared packages first
    print_status "Publishing shared packages..."
    publish_package "shared"
    publish_package "agent-tools"
    publish_package "templates"
    echo ""
    
    # Deploy services
    print_status "Deploying services..."
    deploy_service "Web App" "celiador-web"
    deploy_service "Orchestrator" "celiador-orchestrator"
    deploy_service "Preview Service" "celiador-preview-service"
    deploy_service "Codegen Worker" "celiador-codegen-worker"
    echo ""
    
    echo "============================="
    print_success "🎉 Deployment completed!"
    echo "============================="
    echo ""
    echo "📦 Published packages:"
    echo "   @celiador/shared"
    echo "   @celiador/agent-tools"
    echo "   @celiador/templates"
    echo ""
    echo "🚀 Deployed services:"
    echo "   Frontend:     https://yourdomain.com (Vercel)"
    echo "   API:          https://api.yourdomain.com (Railway)"
    echo "   Preview:      https://preview.yourdomain.com (Railway)"
    echo "   Worker:       Running on Railway"
    echo ""
    print_status "Monitor deployments in your platform dashboards"
}

# Run main function
main "$@"
