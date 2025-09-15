#!/bin/bash

# Celiador Update Dependencies Script
# This script updates dependencies for all services and packages

set -e

echo "📦 Celiador Update Dependencies"
echo "==============================="

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

# Function to update dependencies for a service
update_service_deps() {
    local service_name=$1
    local service_path="services/$service_name"
    
    print_status "Updating dependencies for $service_name..."
    
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
    
    # Update dependencies
    if npm update; then
        print_success "✅ $service_name dependencies updated"
    else
        print_error "❌ Failed to update $service_name dependencies"
        return 1
    fi
    
    cd - > /dev/null
}

# Function to update dependencies for a package
update_package_deps() {
    local package_name=$1
    local package_path="packages/$package_name"
    
    print_status "Updating dependencies for $package_name..."
    
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
    
    # Update dependencies
    if npm update; then
        print_success "✅ $package_name dependencies updated"
    else
        print_error "❌ Failed to update $package_name dependencies"
        return 1
    fi
    
    cd - > /dev/null
}

# Function to check for outdated packages
check_outdated() {
    local path=$1
    local name=$2
    
    print_status "Checking for outdated packages in $name..."
    
    cd "$path"
    
    # Check for outdated packages
    local outdated=$(npm outdated 2>/dev/null || true)
    
    if [ -z "$outdated" ]; then
        print_success "✅ $name has no outdated packages"
    else
        print_warning "⚠️  $name has outdated packages:"
        echo "$outdated"
    fi
    
    cd - > /dev/null
}

# Function to audit dependencies
audit_deps() {
    local path=$1
    local name=$2
    
    print_status "Auditing dependencies for $name..."
    
    cd "$path"
    
    # Run npm audit
    if npm audit; then
        print_success "✅ $name has no security vulnerabilities"
    else
        print_warning "⚠️  $name has security vulnerabilities"
    fi
    
    cd - > /dev/null
}

# Function to update to latest versions
update_to_latest() {
    local path=$1
    local name=$2
    
    print_status "Updating $name to latest versions..."
    
    cd "$path"
    
    # Update to latest versions
    if npm update --save; then
        print_success "✅ $name updated to latest versions"
    else
        print_error "❌ Failed to update $name to latest versions"
        return 1
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
    
    # Check Node.js version
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        print_error "Node.js version 18+ is required. Current version: $(node -v)"
        exit 1
    fi
    
    # Check if npm is installed
    if ! command_exists npm; then
        print_error "npm is not installed. Please install npm and try again."
        exit 1
    fi
    
    print_success "Prerequisites check passed"
}

# Function to show dependency summary
show_dependency_summary() {
    print_status "Dependency Summary:"
    
    echo ""
    echo "📦 Services:"
    for service in services/*/; do
        if [ -d "$service" ] && [ -f "$service/package.json" ]; then
            service_name=$(basename "$service")
            cd "$service"
            local deps=$(npm list --depth=0 2>/dev/null | grep -c "├──\|└──" || echo "0")
            echo "   $service_name: $deps dependencies"
            cd - > /dev/null
        fi
    done
    
    echo ""
    echo "📦 Packages:"
    for package in packages/*/; do
        if [ -d "$package" ] && [ -f "$package/package.json" ]; then
            package_name=$(basename "$package")
            cd "$package"
            local deps=$(npm list --depth=0 2>/dev/null | grep -c "├──\|└──" || echo "0")
            echo "   $package_name: $deps dependencies"
            cd - > /dev/null
        fi
    done
}

# Main execution
main() {
    # Check prerequisites
    check_prerequisites
    
    # Parse command line arguments
    UPDATE=false
    CHECK_OUTDATED=false
    AUDIT=false
    LATEST=false
    PACKAGES_ONLY=false
    SERVICES_ONLY=false
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --update)
                UPDATE=true
                shift
                ;;
            --check-outdated)
                CHECK_OUTDATED=true
                shift
                ;;
            --audit)
                AUDIT=true
                shift
                ;;
            --latest)
                LATEST=true
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
                echo "  --update          Update dependencies to compatible versions"
                echo "  --check-outdated  Check for outdated packages"
                echo "  --audit           Audit dependencies for security vulnerabilities"
                echo "  --latest          Update to latest versions (may break compatibility)"
                echo "  --packages-only   Update only shared packages"
                echo "  --services-only   Update only services"
                echo "  --help            Show this help message"
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                exit 1
                ;;
        esac
    done
    
    # If no options specified, show help
    if [ "$UPDATE" = false ] && [ "$CHECK_OUTDATED" = false ] && [ "$AUDIT" = false ] && [ "$LATEST" = false ]; then
        echo "Usage: $0 [OPTIONS]"
        echo ""
        echo "Options:"
        echo "  --update          Update dependencies to compatible versions"
        echo "  --check-outdated  Check for outdated packages"
        echo "  --audit           Audit dependencies for security vulnerabilities"
        echo "  --latest          Update to latest versions (may break compatibility)"
        echo "  --packages-only   Update only shared packages"
        echo "  --services-only   Update only services"
        echo "  --help            Show this help message"
        echo ""
        echo "Examples:"
        echo "  $0 --update --audit              # Update and audit all dependencies"
        echo "  $0 --check-outdated              # Check for outdated packages"
        echo "  $0 --latest --services-only      # Update services to latest versions"
        exit 0
    fi
    
    # Show current dependency summary
    show_dependency_summary
    echo ""
    
    # Update dependencies (unless services-only)
    if [ "$UPDATE" = true ] && [ "$SERVICES_ONLY" = false ]; then
        print_status "Updating shared packages..."
        update_package_deps "shared"
        update_package_deps "agent-tools"
        update_package_deps "templates"
        echo ""
    fi
    
    # Update services (unless packages-only)
    if [ "$UPDATE" = true ] && [ "$PACKAGES_ONLY" = false ]; then
        print_status "Updating services..."
        update_service_deps "web"
        update_service_deps "orchestrator"
        update_service_deps "preview-service"
        update_service_deps "codegen-worker"
        echo ""
    fi
    
    # Update to latest versions
    if [ "$LATEST" = true ]; then
        if [ "$SERVICES_ONLY" = false ]; then
            print_status "Updating packages to latest versions..."
            update_to_latest "packages/shared" "shared"
            update_to_latest "packages/agent-tools" "agent-tools"
            update_to_latest "packages/templates" "templates"
            echo ""
        fi
        
        if [ "$PACKAGES_ONLY" = false ]; then
            print_status "Updating services to latest versions..."
            update_to_latest "services/web" "web"
            update_to_latest "services/orchestrator" "orchestrator"
            update_to_latest "services/preview-service" "preview-service"
            update_to_latest "services/codegen-worker" "codegen-worker"
            echo ""
        fi
    fi
    
    # Check for outdated packages
    if [ "$CHECK_OUTDATED" = true ]; then
        if [ "$SERVICES_ONLY" = false ]; then
            print_status "Checking packages for outdated dependencies..."
            check_outdated "packages/shared" "shared"
            check_outdated "packages/agent-tools" "agent-tools"
            check_outdated "packages/templates" "templates"
            echo ""
        fi
        
        if [ "$PACKAGES_ONLY" = false ]; then
            print_status "Checking services for outdated dependencies..."
            check_outdated "services/web" "web"
            check_outdated "services/orchestrator" "orchestrator"
            check_outdated "services/preview-service" "preview-service"
            check_outdated "services/codegen-worker" "codegen-worker"
            echo ""
        fi
    fi
    
    # Audit dependencies
    if [ "$AUDIT" = true ]; then
        if [ "$SERVICES_ONLY" = false ]; then
            print_status "Auditing packages for security vulnerabilities..."
            audit_deps "packages/shared" "shared"
            audit_deps "packages/agent-tools" "agent-tools"
            audit_deps "packages/templates" "templates"
            echo ""
        fi
        
        if [ "$PACKAGES_ONLY" = false ]; then
            print_status "Auditing services for security vulnerabilities..."
            audit_deps "services/web" "web"
            audit_deps "services/orchestrator" "orchestrator"
            audit_deps "services/preview-service" "preview-service"
            audit_deps "services/codegen-worker" "codegen-worker"
            echo ""
        fi
    fi
    
    # Show final dependency summary
    print_status "Final dependency summary:"
    show_dependency_summary
    
    echo ""
    echo "==============================="
    print_success "🎉 Dependency update completed!"
    echo "==============================="
}

# Run main function
main "$@"
