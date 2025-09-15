#!/bin/bash

# Celiador Build All Services Script
# This script builds all services in the development monorepo

set -e

echo "🔨 Building All Celiador Services"
echo "================================="

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

# Function to build a service
build_service() {
    local service_name=$1
    local service_path="services/$service_name"
    
    print_status "Building $service_name..."
    
    # Check if service directory exists
    if [ ! -d "$service_path" ]; then
        print_error "Service directory $service_path does not exist"
        return 1
    fi
    
    # Check if service has package.json
    if [ ! -f "$service_path/package.json" ]; then
        print_error "Service $service_name does not have package.json"
        return 1
    fi
    
    cd "$service_path"
    
    # Install dependencies if node_modules doesn't exist
    if [ ! -d "node_modules" ]; then
        print_status "Installing dependencies for $service_name..."
        npm install
    fi
    
    # Run build script
    if npm run build; then
        print_success "✅ $service_name built successfully"
    else
        print_error "❌ Failed to build $service_name"
        return 1
    fi
    
    cd - > /dev/null
}

# Function to build a package
build_package() {
    local package_name=$1
    local package_path="packages/$package_name"
    
    print_status "Building package $package_name..."
    
    # Check if package directory exists
    if [ ! -d "$package_path" ]; then
        print_error "Package directory $package_path does not exist"
        return 1
    fi
    
    # Check if package has package.json
    if [ ! -f "$package_path/package.json" ]; then
        print_error "Package $package_name does not have package.json"
        return 1
    fi
    
    cd "$package_path"
    
    # Install dependencies if node_modules doesn't exist
    if [ ! -d "node_modules" ]; then
        print_status "Installing dependencies for $package_name..."
        npm install
    fi
    
    # Run build script
    if npm run build; then
        print_success "✅ Package $package_name built successfully"
    else
        print_error "❌ Failed to build package $package_name"
        return 1
    fi
    
    cd - > /dev/null
}

# Function to check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    # Check if Node.js is installed
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 18+ and try again."
        exit 1
    fi
    
    # Check Node.js version
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        print_error "Node.js version 18+ is required. Current version: $(node -v)"
        exit 1
    fi
    
    # Check if npm is installed
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed. Please install npm and try again."
        exit 1
    fi
    
    print_success "Prerequisites check passed"
}

# Function to clean build artifacts
clean_builds() {
    print_status "Cleaning build artifacts..."
    
    # Clean service builds
    for service in services/*/; do
        if [ -d "$service" ]; then
            service_name=$(basename "$service")
            print_status "Cleaning $service_name..."
            
            # Remove common build directories
            rm -rf "$service/dist"
            rm -rf "$service/build"
            rm -rf "$service/.next"
            rm -rf "$service/out"
        fi
    done
    
    # Clean package builds
    for package in packages/*/; do
        if [ -d "$package" ]; then
            package_name=$(basename "$package")
            print_status "Cleaning $package_name..."
            
            # Remove common build directories
            rm -rf "$package/dist"
            rm -rf "$package/build"
        fi
    done
    
    print_success "Build artifacts cleaned"
}

# Main execution
main() {
    # Check prerequisites
    check_prerequisites
    
    # Parse command line arguments
    CLEAN=false
    PACKAGES_ONLY=false
    SERVICES_ONLY=false
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --clean)
                CLEAN=true
                shift
                ;;
            --packages-only)
                PACKAGES_ONLY=true
                shift
                ;;
            --services-only)
                SERVICES_ONLY=true
                shift
                ;;
            --help)
                echo "Usage: $0 [OPTIONS]"
                echo ""
                echo "Options:"
                echo "  --clean          Clean build artifacts before building"
                echo "  --packages-only  Build only shared packages"
                echo "  --services-only  Build only services"
                echo "  --help           Show this help message"
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                exit 1
                ;;
        esac
    done
    
    # Clean if requested
    if [ "$CLEAN" = true ]; then
        clean_builds
    fi
    
    # Build shared packages first (unless services-only)
    if [ "$SERVICES_ONLY" = false ]; then
        print_status "Building shared packages..."
        build_package "shared"
        build_package "agent-tools"
        build_package "templates"
    fi
    
    # Build services (unless packages-only)
    if [ "$PACKAGES_ONLY" = false ]; then
        print_status "Building services..."
        build_service "web"
        build_service "orchestrator"
        build_service "preview-service"
        build_service "codegen-worker"
    fi
    
    echo ""
    echo "================================="
    print_success "🎉 All builds completed successfully!"
    echo "================================="
    echo ""
    echo "📦 Built packages:"
    echo "   @celiador/shared"
    echo "   @celiador/agent-tools"
    echo "   @celiador/templates"
    echo ""
    echo "🚀 Built services:"
    echo "   Web App (Next.js)"
    echo "   Orchestrator (Express.js)"
    echo "   Preview Service (Express.js)"
    echo "   Codegen Worker (Node.js)"
    echo ""
    print_status "Ready for deployment!"
}

# Run main function
main "$@"
