#!/bin/bash

# Celiador Test All Services Script
# This script runs tests for all services in the development monorepo

set -e

echo "🧪 Testing All Celiador Services"
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

# Test results tracking
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Function to run tests for a service
test_service() {
    local service_name=$1
    local service_path="services/$service_name"
    
    print_status "Testing $service_name..."
    
    # Check if service directory exists
    if [ ! -d "$service_path" ]; then
        print_error "Service directory $service_path does not exist"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        return 1
    fi
    
    # Check if service has package.json
    if [ ! -f "$service_path/package.json" ]; then
        print_error "Service $service_name does not have package.json"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        return 1
    fi
    
    cd "$service_path"
    
    # Install dependencies if node_modules doesn't exist
    if [ ! -d "node_modules" ]; then
        print_status "Installing dependencies for $service_name..."
        npm install
    fi
    
    # Check if test script exists
    if npm run test --if-present; then
        print_success "✅ $service_name tests passed"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        print_error "❌ $service_name tests failed"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    cd - > /dev/null
}

# Function to run tests for a package
test_package() {
    local package_name=$1
    local package_path="packages/$package_name"
    
    print_status "Testing package $package_name..."
    
    # Check if package directory exists
    if [ ! -d "$package_path" ]; then
        print_error "Package directory $package_path does not exist"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        return 1
    fi
    
    # Check if package has package.json
    if [ ! -f "$package_path/package.json" ]; then
        print_error "Package $package_name does not have package.json"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        return 1
    fi
    
    cd "$package_path"
    
    # Install dependencies if node_modules doesn't exist
    if [ ! -d "node_modules" ]; then
        print_status "Installing dependencies for $package_name..."
        npm install
    fi
    
    # Check if test script exists
    if npm run test --if-present; then
        print_success "✅ Package $package_name tests passed"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        print_error "❌ Package $package_name tests failed"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    cd - > /dev/null
}

# Function to run linting for a service
lint_service() {
    local service_name=$1
    local service_path="services/$service_name"
    
    print_status "Linting $service_name..."
    
    # Check if service directory exists
    if [ ! -d "$service_path" ]; then
        print_error "Service directory $service_path does not exist"
        return 1
    fi
    
    cd "$service_path"
    
    # Install dependencies if node_modules doesn't exist
    if [ ! -d "node_modules" ]; then
        print_status "Installing dependencies for $service_name..."
        npm install
    fi
    
    # Check if lint script exists
    if npm run lint --if-present; then
        print_success "✅ $service_name linting passed"
    else
        print_warning "⚠️  $service_name linting failed (non-blocking)"
    fi
    
    cd - > /dev/null
}

# Function to run type checking for a service
typecheck_service() {
    local service_name=$1
    local service_path="services/$service_name"
    
    print_status "Type checking $service_name..."
    
    # Check if service directory exists
    if [ ! -d "$service_path" ]; then
        print_error "Service directory $service_path does not exist"
        return 1
    fi
    
    cd "$service_path"
    
    # Install dependencies if node_modules doesn't exist
    if [ ! -d "node_modules" ]; then
        print_status "Installing dependencies for $service_name..."
        npm install
    fi
    
    # Check if typecheck script exists
    if npm run typecheck --if-present; then
        print_success "✅ $service_name type checking passed"
    else
        print_warning "⚠️  $service_name type checking failed (non-blocking)"
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

# Function to run integration tests
run_integration_tests() {
    print_status "Running integration tests..."
    
    # Check if services are running
    local services_running=true
    
    # Check if orchestrator is running
    if ! curl -s -f "http://localhost:4000/health" >/dev/null 2>&1; then
        print_warning "Orchestrator is not running. Skipping integration tests."
        services_running=false
    fi
    
    # Check if web app is running
    if ! curl -s -f "http://localhost:3000" >/dev/null 2>&1; then
        print_warning "Web app is not running. Skipping integration tests."
        services_running=false
    fi
    
    if [ "$services_running" = true ]; then
        print_status "Services are running. Running integration tests..."
        
        # Run integration tests if they exist
        if [ -f "tests/integration.test.js" ]; then
            if npm test tests/integration.test.js; then
                print_success "✅ Integration tests passed"
            else
                print_error "❌ Integration tests failed"
                FAILED_TESTS=$((FAILED_TESTS + 1))
            fi
            TOTAL_TESTS=$((TOTAL_TESTS + 1))
        else
            print_warning "No integration tests found"
        fi
    else
        print_warning "Skipping integration tests (services not running)"
    fi
}

# Main execution
main() {
    # Check prerequisites
    check_prerequisites
    
    # Parse command line arguments
    LINT=false
    TYPECHECK=false
    INTEGRATION=false
    PACKAGES_ONLY=false
    SERVICES_ONLY=false
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --lint)
                LINT=true
                shift
                ;;
            --typecheck)
                TYPECHECK=true
                shift
                ;;
            --integration)
                INTEGRATION=true
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
                echo "  --lint           Run linting checks"
                echo "  --typecheck      Run TypeScript type checking"
                echo "  --integration    Run integration tests"
                echo "  --packages-only  Test only shared packages"
                echo "  --services-only  Test only services"
                echo "  --help           Show this help message"
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                exit 1
                ;;
        esac
    done
    
    # Test shared packages first (unless services-only)
    if [ "$SERVICES_ONLY" = false ]; then
        print_status "Testing shared packages..."
        test_package "shared"
        test_package "agent-tools"
        test_package "templates"
    fi
    
    # Test services (unless packages-only)
    if [ "$PACKAGES_ONLY" = false ]; then
        print_status "Testing services..."
        test_service "web"
        test_service "orchestrator"
        test_service "preview-service"
        test_service "codegen-worker"
    fi
    
    # Run linting if requested
    if [ "$LINT" = true ]; then
        print_status "Running linting checks..."
        lint_service "web"
        lint_service "orchestrator"
        lint_service "preview-service"
        lint_service "codegen-worker"
    fi
    
    # Run type checking if requested
    if [ "$TYPECHECK" = true ]; then
        print_status "Running type checking..."
        typecheck_service "web"
        typecheck_service "orchestrator"
        typecheck_service "preview-service"
        typecheck_service "codegen-worker"
    fi
    
    # Run integration tests if requested
    if [ "$INTEGRATION" = true ]; then
        run_integration_tests
    fi
    
    echo ""
    echo "==============================="
    echo "📊 Test Results Summary:"
    echo "==============================="
    echo "Total tests: $TOTAL_TESTS"
    echo "Passed: $PASSED_TESTS"
    echo "Failed: $FAILED_TESTS"
    echo ""
    
    if [ $FAILED_TESTS -eq 0 ]; then
        print_success "🎉 All tests passed!"
        exit 0
    else
        print_error "❌ $FAILED_TESTS tests failed"
        exit 1
    fi
}

# Run main function
main "$@"
