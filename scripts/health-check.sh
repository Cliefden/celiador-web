#!/bin/bash

# Celiador Health Check Script
# This script checks the health of all services in the development environment

set -e

echo "🏥 Celiador Health Check"
echo "======================="

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

# Function to check if a service is responding
check_service() {
    local service_name=$1
    local url=$2
    local timeout=${3:-5}
    
    print_status "Checking $service_name..."
    
    if curl -s -f --max-time $timeout "$url" >/dev/null 2>&1; then
        print_success "✅ $service_name is healthy"
        return 0
    else
        print_error "❌ $service_name is not responding"
        return 1
    fi
}

# Function to check if a port is in use
check_port() {
    local port=$1
    local service_name=$2
    
    print_status "Checking port $port for $service_name..."
    
    if lsof -i:$port >/dev/null 2>&1; then
        print_success "✅ Port $port is in use by $service_name"
        return 0
    else
        print_error "❌ Port $port is not in use"
        return 1
    fi
}

# Function to check Redis
check_redis() {
    print_status "Checking Redis..."
    
    if command -v redis-cli >/dev/null 2>&1; then
        if redis-cli ping >/dev/null 2>&1; then
            print_success "✅ Redis is running and responding"
            return 0
        else
            print_error "❌ Redis is not responding"
            return 1
        fi
    else
        print_error "❌ Redis CLI is not installed"
        return 1
    fi
}

# Function to check database connection
check_database() {
    print_status "Checking database connection..."
    
    # Check if .env file exists
    if [ ! -f ".env" ]; then
        print_warning "⚠️  .env file not found"
        return 1
    fi
    
    # Source environment variables
    source .env 2>/dev/null || true
    
    # Check if Supabase URL is set
    if [ -z "$SUPABASE_URL" ]; then
        print_warning "⚠️  SUPABASE_URL not set in .env"
        return 1
    fi
    
    # Try to connect to Supabase
    if curl -s -f --max-time 10 "$SUPABASE_URL/rest/v1/" >/dev/null 2>&1; then
        print_success "✅ Database connection is healthy"
        return 0
    else
        print_error "❌ Database connection failed"
        return 1
    fi
}

# Function to check environment variables
check_environment() {
    print_status "Checking environment variables..."
    
    local missing_vars=()
    
    # Check if .env file exists
    if [ ! -f ".env" ]; then
        print_error "❌ .env file not found"
        return 1
    fi
    
    # Source environment variables
    source .env 2>/dev/null || true
    
    # Check required variables
    local required_vars=(
        "SUPABASE_URL"
        "SUPABASE_ANON_KEY"
        "SUPABASE_SERVICE_ROLE_KEY"
        "REDIS_URL"
        "OPENAI_API_KEY"
        "ANTHROPIC_API_KEY"
    )
    
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            missing_vars+=("$var")
        fi
    done
    
    if [ ${#missing_vars[@]} -eq 0 ]; then
        print_success "✅ All required environment variables are set"
        return 0
    else
        print_error "❌ Missing environment variables: ${missing_vars[*]}"
        return 1
    fi
}

# Function to check service logs
check_logs() {
    print_status "Checking service logs..."
    
    local log_dir="logs"
    local services=("orchestrator" "preview-service" "codegen-worker" "web")
    
    if [ ! -d "$log_dir" ]; then
        print_warning "⚠️  Logs directory not found"
        return 1
    fi
    
    for service in "${services[@]}"; do
        local log_file="$log_dir/$service.log"
        if [ -f "$log_file" ]; then
            local log_size=$(wc -l < "$log_file")
            if [ "$log_size" -gt 0 ]; then
                print_success "✅ $service has logs ($log_size lines)"
            else
                print_warning "⚠️  $service log file is empty"
            fi
        else
            print_warning "⚠️  $service log file not found"
        fi
    done
}

# Function to check disk space
check_disk_space() {
    print_status "Checking disk space..."
    
    local available_space=$(df -h . | awk 'NR==2 {print $4}')
    local used_space=$(df -h . | awk 'NR==2 {print $3}')
    local total_space=$(df -h . | awk 'NR==2 {print $2}')
    
    print_success "✅ Disk space: $used_space used, $available_space available ($total_space total)"
}

# Function to check memory usage
check_memory() {
    print_status "Checking memory usage..."
    
    if command -v free >/dev/null 2>&1; then
        local total_mem=$(free -h | awk 'NR==2{print $2}')
        local used_mem=$(free -h | awk 'NR==2{print $3}')
        local available_mem=$(free -h | awk 'NR==2{print $7}')
        
        print_success "✅ Memory: $used_mem used, $available_mem available ($total_mem total)"
    elif command -v vm_stat >/dev/null 2>&1; then
        # macOS
        local page_size=$(vm_stat | grep "page size" | awk '{print $8}')
        local free_pages=$(vm_stat | grep "Pages free" | awk '{print $3}' | sed 's/\.//')
        local active_pages=$(vm_stat | grep "Pages active" | awk '{print $3}' | sed 's/\.//')
        
        local free_mb=$((free_pages * page_size / 1024 / 1024))
        local active_mb=$((active_pages * page_size / 1024 / 1024))
        
        print_success "✅ Memory: ${active_mb}MB active, ${free_mb}MB free"
    else
        print_warning "⚠️  Cannot check memory usage on this system"
    fi
}

# Function to check Node.js processes
check_node_processes() {
    print_status "Checking Node.js processes..."
    
    local node_processes=$(pgrep -f "node" | wc -l)
    
    if [ "$node_processes" -gt 0 ]; then
        print_success "✅ $node_processes Node.js processes running"
        
        # Show process details
        echo "   Process details:"
        pgrep -f "node" | while read pid; do
            local cmd=$(ps -p $pid -o command= 2>/dev/null || echo "Unknown")
            echo "   - PID $pid: $cmd"
        done
    else
        print_warning "⚠️  No Node.js processes running"
    fi
}

# Function to run comprehensive health check
run_comprehensive_check() {
    echo "Running comprehensive health check..."
    echo ""
    
    local total_checks=0
    local passed_checks=0
    
    # Check environment
    if check_environment; then
        passed_checks=$((passed_checks + 1))
    fi
    total_checks=$((total_checks + 1))
    echo ""
    
    # Check Redis
    if check_redis; then
        passed_checks=$((passed_checks + 1))
    fi
    total_checks=$((total_checks + 1))
    echo ""
    
    # Check database
    if check_database; then
        passed_checks=$((passed_checks + 1))
    fi
    total_checks=$((total_checks + 1))
    echo ""
    
    # Check ports
    if check_port 3000 "Web App"; then
        passed_checks=$((passed_checks + 1))
    fi
    total_checks=$((total_checks + 1))
    
    if check_port 4000 "Orchestrator"; then
        passed_checks=$((passed_checks + 1))
    fi
    total_checks=$((total_checks + 1))
    
    if check_port 4001 "Preview Service"; then
        passed_checks=$((passed_checks + 1))
    fi
    total_checks=$((total_checks + 1))
    echo ""
    
    # Check services
    if check_service "Web App" "http://localhost:3000"; then
        passed_checks=$((passed_checks + 1))
    fi
    total_checks=$((total_checks + 1))
    
    if check_service "Orchestrator" "http://localhost:4000/health"; then
        passed_checks=$((passed_checks + 1))
    fi
    total_checks=$((total_checks + 1))
    
    if check_service "Preview Service" "http://localhost:4001/health"; then
        passed_checks=$((passed_checks + 1))
    fi
    total_checks=$((total_checks + 1))
    echo ""
    
    # Check logs
    check_logs
    echo ""
    
    # Check system resources
    check_disk_space
    check_memory
    echo ""
    
    # Check Node.js processes
    check_node_processes
    echo ""
    
    # Summary
    echo "======================="
    echo "📊 Health Check Summary"
    echo "======================="
    echo "Total checks: $total_checks"
    echo "Passed: $passed_checks"
    echo "Failed: $((total_checks - passed_checks))"
    echo ""
    
    if [ $passed_checks -eq $total_checks ]; then
        print_success "🎉 All health checks passed!"
        return 0
    else
        print_error "❌ Some health checks failed"
        return 1
    fi
}

# Function to run quick health check
run_quick_check() {
    echo "Running quick health check..."
    echo ""
    
    # Check services
    check_service "Web App" "http://localhost:3000"
    check_service "Orchestrator" "http://localhost:4000/health"
    check_service "Preview Service" "http://localhost:4001/health"
    
    # Check Redis
    check_redis
}

# Main execution
main() {
    # Parse command line arguments
    QUICK=false
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --quick)
                QUICK=true
                shift
                ;;
            --help)
                echo "Usage: $0 [OPTIONS]"
                echo ""
                echo "Options:"
                echo "  --quick    Run quick health check (services only)"
                echo "  --help     Show this help message"
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                exit 1
                ;;
        esac
    done
    
    if [ "$QUICK" = true ]; then
        run_quick_check
    else
        run_comprehensive_check
    fi
}

# Run main function
main "$@"
