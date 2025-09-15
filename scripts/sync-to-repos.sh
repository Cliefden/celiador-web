#!/bin/bash

# Celiador Sync to Deployment Repositories Script
# This script syncs changes from the development monorepo to deployment repositories

set -e

echo "🔄 Syncing Celiador Development Changes to Deployment Repositories"
echo "=================================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DEPLOY_REPOS_BASE="https://github.com/yourorg"
TEMP_DIR="/tmp/celiador-sync-$(date +%s)"
NPM_REGISTRY="https://registry.npmjs.org"

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

# Function to sync a service to its deployment repository
sync_service() {
    local service_name=$1
    local deploy_repo=$2
    local service_path="services/$service_name"
    
    print_status "Syncing $service_name to $deploy_repo..."
    
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
    
    # Create temporary directory for this service
    local temp_service_dir="$TEMP_DIR/$service_name"
    mkdir -p "$temp_service_dir"
    
    # Copy service files (excluding node_modules, .git, etc.)
    print_status "Copying files for $service_name..."
    rsync -av --exclude='node_modules' --exclude='.git' --exclude='*.log' --exclude='.env*' \
        "$service_path/" "$temp_service_dir/"
    
    # Clone deployment repository
    local deploy_repo_url="$DEPLOY_REPOS_BASE/$deploy_repo.git"
    local deploy_repo_dir="$TEMP_DIR/$deploy_repo"
    
    print_status "Cloning deployment repository $deploy_repo..."
    if [ -d "$deploy_repo_dir" ]; then
        rm -rf "$deploy_repo_dir"
    fi
    
    git clone "$deploy_repo_url" "$deploy_repo_dir" || {
        print_error "Failed to clone $deploy_repo_url"
        return 1
    }
    
    # Copy files to deployment repository
    print_status "Copying files to deployment repository..."
    rsync -av --delete "$temp_service_dir/" "$deploy_repo_dir/"
    
    # Update package.json to use published shared packages
    print_status "Updating package.json for $service_name..."
    cd "$deploy_repo_dir"
    
    # Replace local package references with NPM packages
    if [ -f "package.json" ]; then
        # Replace @mvp/shared with @celiador/shared
        sed -i.bak 's/"@mvp\/shared"/"@celiador\/shared"/g' package.json
        # Replace @mvp/agent-tools with @celiador/agent-tools
        sed -i.bak 's/"@mvp\/agent-tools"/"@celiador\/agent-tools"/g' package.json
        # Replace @mvp/templates with @celiador/templates
        sed -i.bak 's/"@mvp\/templates"/"@celiador\/templates"/g' package.json
        # Remove .bak file
        rm -f package.json.bak
    fi
    
    # Commit and push changes
    print_status "Committing changes to $deploy_repo..."
    git add .
    
    # Check if there are changes to commit
    if git diff --staged --quiet; then
        print_warning "No changes to commit for $service_name"
    else
        git commit -m "Sync from development monorepo - $(date '+%Y-%m-%d %H:%M:%S')"
        git push origin main
        print_success "✅ $service_name synced to $deploy_repo"
    fi
    
    cd - > /dev/null
}

# Function to publish a shared package
publish_package() {
    local package_name=$1
    local package_path="packages/$package_name"
    
    print_status "Publishing package $package_name..."
    
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
    
    # Build the package if build script exists
    if npm run build --if-present; then
        print_status "Built package $package_name"
    fi
    
    # Check if package is already published
    local current_version=$(node -p "require('./package.json').version")
    local published_version=$(npm view "@celiador/$package_name" version 2>/dev/null || echo "not-published")
    
    if [ "$published_version" = "not-published" ]; then
        print_status "Publishing new package @celiador/$package_name@$current_version"
        npm publish --access public
    elif [ "$current_version" != "$published_version" ]; then
        print_status "Publishing updated package @celiador/$package_name@$current_version"
        npm publish --access public
    else
        print_warning "Package @celiador/$package_name@$current_version is already published"
    fi
    
    print_success "✅ Package $package_name published"
    cd - > /dev/null
}

# Function to check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    # Check if git is installed
    if ! command_exists git; then
        print_error "Git is not installed. Please install git and try again."
        exit 1
    fi
    
    # Check if npm is installed
    if ! command_exists npm; then
        print_error "npm is not installed. Please install npm and try again."
        exit 1
    fi
    
    # Check if we're in a git repository
    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        print_error "Not in a git repository. Please run this script from the root of the development monorepo."
        exit 1
    fi
    
    # Check if we have uncommitted changes
    if ! git diff --quiet || ! git diff --cached --quiet; then
        print_warning "You have uncommitted changes. Consider committing them before syncing."
        read -p "Continue anyway? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_status "Sync cancelled"
            exit 0
        fi
    fi
    
    print_success "Prerequisites check passed"
}

# Function to cleanup temporary files
cleanup() {
    print_status "Cleaning up temporary files..."
    if [ -d "$TEMP_DIR" ]; then
        rm -rf "$TEMP_DIR"
    fi
    print_success "Cleanup completed"
}

# Set up signal handlers
trap cleanup EXIT

# Main execution
main() {
    # Check prerequisites
    check_prerequisites
    
    # Create temporary directory
    mkdir -p "$TEMP_DIR"
    
    # Publish shared packages first
    print_status "Publishing shared packages..."
    publish_package "shared"
    publish_package "agent-tools"
    publish_package "templates"
    
    # Sync services
    print_status "Syncing services to deployment repositories..."
    sync_service "web" "celiador-web"
    sync_service "orchestrator" "celiador-orchestrator"
    sync_service "preview-service" "celiador-preview-service"
    sync_service "codegen-worker" "celiador-codegen-worker"
    
    echo ""
    echo "=================================================================="
    print_success "🎉 All services synced and deployed!"
    echo "=================================================================="
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
    echo "⏱️  Deployment times:"
    echo "   Vercel:       ~2-3 minutes"
    echo "   Railway:      ~3-5 minutes"
    echo ""
    print_status "Monitor deployments in your platform dashboards"
}

# Run main function
main "$@"
