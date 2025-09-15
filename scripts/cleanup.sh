#!/bin/bash

# Celiador Cleanup Script
# This script cleans up the development environment

set -e

echo "🧹 Celiador Cleanup Script"
echo "========================="

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

# Function to kill processes on a port
kill_port() {
    local port=$1
    local pids=$(lsof -ti:$port 2>/dev/null)
    if [ ! -z "$pids" ]; then
        print_status "Killing processes on port $port: $pids"
        kill -9 $pids 2>/dev/null || true
        sleep 2
    fi
}

# Function to kill all Node.js processes
kill_node_processes() {
    print_status "Killing all Node.js processes..."
    
    local node_pids=$(pgrep -f "node" 2>/dev/null || true)
    if [ ! -z "$node_pids" ]; then
        print_status "Found Node.js processes: $node_pids"
        kill -9 $node_pids 2>/dev/null || true
        sleep 2
    else
        print_status "No Node.js processes found"
    fi
}

# Function to clean build artifacts
clean_build_artifacts() {
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
            rm -rf "$service/.turbo"
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

# Function to clean node_modules
clean_node_modules() {
    print_status "Cleaning node_modules..."
    
    # Clean root node_modules
    if [ -d "node_modules" ]; then
        print_status "Removing root node_modules..."
        rm -rf node_modules
    fi
    
    # Clean service node_modules
    for service in services/*/; do
        if [ -d "$service" ] && [ -d "$service/node_modules" ]; then
            service_name=$(basename "$service")
            print_status "Removing $service_name node_modules..."
            rm -rf "$service/node_modules"
        fi
    done
    
    # Clean package node_modules
    for package in packages/*/; do
        if [ -d "$package" ] && [ -d "$package/node_modules" ]; then
            package_name=$(basename "$package")
            print_status "Removing $package_name node_modules..."
            rm -rf "$package/node_modules"
        fi
    done
    
    print_success "node_modules cleaned"
}

# Function to clean logs
clean_logs() {
    print_status "Cleaning logs..."
    
    if [ -d "logs" ]; then
        print_status "Removing log files..."
        rm -rf logs/*
        print_success "Logs cleaned"
    else
        print_status "No logs directory found"
    fi
}

# Function to clean temporary files
clean_temp_files() {
    print_status "Cleaning temporary files..."
    
    # Clean common temporary files
    find . -name "*.log" -type f -delete 2>/dev/null || true
    find . -name "*.tmp" -type f -delete 2>/dev/null || true
    find . -name "*.temp" -type f -delete 2>/dev/null || true
    find . -name ".DS_Store" -type f -delete 2>/dev/null || true
    find . -name "Thumbs.db" -type f -delete 2>/dev/null || true
    
    # Clean npm cache
    if command -v npm >/dev/null 2>&1; then
        print_status "Cleaning npm cache..."
        npm cache clean --force 2>/dev/null || true
    fi
    
    print_success "Temporary files cleaned"
}

# Function to clean Docker containers and images
clean_docker() {
    print_status "Cleaning Docker containers and images..."
    
    if command -v docker >/dev/null 2>&1; then
        # Stop and remove containers
        print_status "Stopping and removing containers..."
        docker-compose -f docker-compose.dev.yml down 2>/dev/null || true
        
        # Remove unused images
        print_status "Removing unused images..."
        docker image prune -f 2>/dev/null || true
        
        # Remove unused volumes
        print_status "Removing unused volumes..."
        docker volume prune -f 2>/dev/null || true
        
        print_success "Docker cleaned"
    else
        print_status "Docker not found, skipping Docker cleanup"
    fi
}

# Function to clean Redis data
clean_redis() {
    print_status "Cleaning Redis data..."
    
    if command -v redis-cli >/dev/null 2>&1; then
        if redis-cli ping >/dev/null 2>&1; then
            print_status "Flushing Redis database..."
            redis-cli FLUSHALL 2>/dev/null || true
            print_success "Redis data cleaned"
        else
            print_warning "Redis is not running, skipping Redis cleanup"
        fi
    else
        print_status "Redis CLI not found, skipping Redis cleanup"
    fi
}

# Function to clean Git
clean_git() {
    print_status "Cleaning Git..."
    
    if [ -d ".git" ]; then
        # Clean untracked files
        print_status "Cleaning untracked files..."
        git clean -fd 2>/dev/null || true
        
        # Reset to last commit
        print_status "Resetting to last commit..."
        git reset --hard HEAD 2>/dev/null || true
        
        print_success "Git cleaned"
    else
        print_status "Not a Git repository, skipping Git cleanup"
    fi
}

# Function to show disk usage
show_disk_usage() {
    print_status "Current disk usage:"
    
    if command -v du >/dev/null 2>&1; then
        echo "   Total size: $(du -sh . 2>/dev/null | cut -f1)"
        echo "   Services: $(du -sh services/ 2>/dev/null | cut -f1)"
        echo "   Packages: $(du -sh packages/ 2>/dev/null | cut -f1)"
        echo "   Logs: $(du -sh logs/ 2>/dev/null | cut -f1)"
        echo "   node_modules: $(du -sh node_modules/ 2>/dev/null | cut -f1)"
    else
        print_warning "Cannot show disk usage (du command not found)"
    fi
}

# Function to confirm action
confirm_action() {
    local action=$1
    read -p "Are you sure you want to $action? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_status "Action cancelled"
        return 1
    fi
    return 0
}

# Main execution
main() {
    # Parse command line arguments
    CLEAN_BUILDS=false
    CLEAN_NODE_MODULES=false
    CLEAN_LOGS=false
    CLEAN_TEMP=false
    CLEAN_DOCKER=false
    CLEAN_REDIS=false
    CLEAN_GIT=false
    KILL_PROCESSES=false
    ALL=false
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --builds)
                CLEAN_BUILDS=true
                shift
                ;;
            --node-modules)
                CLEAN_NODE_MODULES=true
                shift
                ;;
            --logs)
                CLEAN_LOGS=true
                shift
                ;;
            --temp)
                CLEAN_TEMP=true
                shift
                ;;
            --docker)
                CLEAN_DOCKER=true
                shift
                ;;
            --redis)
                CLEAN_REDIS=true
                shift
                ;;
            --git)
                CLEAN_GIT=true
                shift
                ;;
            --kill-processes)
                KILL_PROCESSES=true
                shift
                ;;
            --all)
                ALL=true
                shift
                ;;
            --help)
                echo "Usage: $0 [OPTIONS]"
                echo ""
                echo "Options:"
                echo "  --builds          Clean build artifacts"
                echo "  --node-modules    Clean node_modules directories"
                echo "  --logs            Clean log files"
                echo "  --temp            Clean temporary files"
                echo "  --docker          Clean Docker containers and images"
                echo "  --redis           Clean Redis data"
                echo "  --git             Clean Git (untracked files, reset)"
                echo "  --kill-processes  Kill all Node.js processes"
                echo "  --all             Clean everything"
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
    if [ "$CLEAN_BUILDS" = false ] && [ "$CLEAN_NODE_MODULES" = false ] && [ "$CLEAN_LOGS" = false ] && [ "$CLEAN_TEMP" = false ] && [ "$CLEAN_DOCKER" = false ] && [ "$CLEAN_REDIS" = false ] && [ "$CLEAN_GIT" = false ] && [ "$KILL_PROCESSES" = false ] && [ "$ALL" = false ]; then
        echo "Usage: $0 [OPTIONS]"
        echo ""
        echo "Options:"
        echo "  --builds          Clean build artifacts"
        echo "  --node-modules    Clean node_modules directories"
        echo "  --logs            Clean log files"
        echo "  --temp            Clean temporary files"
        echo "  --docker          Clean Docker containers and images"
        echo "  --redis           Clean Redis data"
        echo "  --git             Clean Git (untracked files, reset)"
        echo "  --kill-processes  Kill all Node.js processes"
        echo "  --all             Clean everything"
        echo "  --help            Show this help message"
        echo ""
        echo "Examples:"
        echo "  $0 --all                    # Clean everything"
        echo "  $0 --builds --logs          # Clean builds and logs"
        echo "  $0 --kill-processes         # Kill all Node.js processes"
        exit 0
    fi
    
    # Show current disk usage
    show_disk_usage
    echo ""
    
    # If --all is specified, set all flags
    if [ "$ALL" = true ]; then
        CLEAN_BUILDS=true
        CLEAN_NODE_MODULES=true
        CLEAN_LOGS=true
        CLEAN_TEMP=true
        CLEAN_DOCKER=true
        CLEAN_REDIS=true
        CLEAN_GIT=true
        KILL_PROCESSES=true
    fi
    
    # Kill processes first
    if [ "$KILL_PROCESSES" = true ]; then
        if confirm_action "kill all Node.js processes"; then
            kill_node_processes
            kill_port 3000
            kill_port 4000
            kill_port 4001
        fi
        echo ""
    fi
    
    # Clean builds
    if [ "$CLEAN_BUILDS" = true ]; then
        if confirm_action "clean build artifacts"; then
            clean_build_artifacts
        fi
        echo ""
    fi
    
    # Clean node_modules
    if [ "$CLEAN_NODE_MODULES" = true ]; then
        if confirm_action "clean node_modules directories"; then
            clean_node_modules
        fi
        echo ""
    fi
    
    # Clean logs
    if [ "$CLEAN_LOGS" = true ]; then
        if confirm_action "clean log files"; then
            clean_logs
        fi
        echo ""
    fi
    
    # Clean temporary files
    if [ "$CLEAN_TEMP" = true ]; then
        if confirm_action "clean temporary files"; then
            clean_temp_files
        fi
        echo ""
    fi
    
    # Clean Docker
    if [ "$CLEAN_DOCKER" = true ]; then
        if confirm_action "clean Docker containers and images"; then
            clean_docker
        fi
        echo ""
    fi
    
    # Clean Redis
    if [ "$CLEAN_REDIS" = true ]; then
        if confirm_action "clean Redis data"; then
            clean_redis
        fi
        echo ""
    fi
    
    # Clean Git
    if [ "$CLEAN_GIT" = true ]; then
        if confirm_action "clean Git (untracked files, reset)"; then
            clean_git
        fi
        echo ""
    fi
    
    # Show final disk usage
    print_status "Final disk usage:"
    show_disk_usage
    
    echo ""
    echo "========================="
    print_success "🎉 Cleanup completed!"
    echo "========================="
}

# Run main function
main "$@"
