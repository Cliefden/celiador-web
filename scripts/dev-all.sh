#!/bin/bash

# Celiador Development Environment Startup Script
# This script starts all services for local development

set -e

echo "🚀 Starting Celiador Development Environment..."
echo "================================================"

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

# Function to check if a port is in use
check_port() {
    local port=$1
    if lsof -i:$port >/dev/null 2>&1; then
        return 0  # Port is in use
    else
        return 1  # Port is free
    fi
}

# Function to kill processes on a port
kill_port() {
    local port=$1
    local pids=$(lsof -ti:$port 2>/dev/null)
    if [ ! -z "$pids" ]; then
        print_warning "Killing processes on port $port: $pids"
        kill -9 $pids 2>/dev/null || true
        sleep 2
    fi
}

# Function to wait for a service to be ready
wait_for_service() {
    local url=$1
    local service_name=$2
    local max_attempts=30
    local attempt=1
    
    print_status "Waiting for $service_name to be ready..."
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s -f "$url" >/dev/null 2>&1; then
            print_success "$service_name is ready!"
            return 0
        fi
        
        echo -n "."
        sleep 1
        attempt=$((attempt + 1))
    done
    
    print_error "$service_name failed to start after $max_attempts seconds"
    return 1
}

# Cleanup function
cleanup() {
    echo ""
    print_status "Shutting down all services..."
    
    # Kill all background processes
    jobs -p | xargs -r kill 2>/dev/null || true
    
    # Kill any remaining processes on our ports
    kill_port 3000
    kill_port 4000
    kill_port 4001
    
    print_success "All services stopped"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Check prerequisites
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

# Check if Redis is running
if ! pgrep -x "redis-server" > /dev/null; then
    print_warning "Redis is not running. Attempting to start Redis..."
    
    # Try to start Redis with brew (macOS)
    if command -v brew &> /dev/null; then
        brew services start redis
        sleep 3
    else
        print_error "Redis is not running and brew is not available. Please start Redis manually."
        exit 1
    fi
fi

# Check if Redis is accessible
if ! redis-cli ping >/dev/null 2>&1; then
    print_error "Redis is not accessible. Please check Redis installation and try again."
    exit 1
fi

print_success "Prerequisites check passed"

# Clean up any existing processes
print_status "Cleaning up existing processes..."
kill_port 3000
kill_port 4000
kill_port 4001

# Install dependencies if needed
print_status "Checking dependencies..."
if [ ! -d "node_modules" ]; then
    print_status "Installing root dependencies..."
    npm install
fi

# Install dependencies for each service
for service in services/*/; do
    if [ -d "$service" ] && [ -f "$service/package.json" ]; then
        service_name=$(basename "$service")
        print_status "Installing dependencies for $service_name..."
        cd "$service"
        if [ ! -d "node_modules" ]; then
            npm install
        fi
        cd - > /dev/null
    fi
done

# Start Redis if not running
print_status "Ensuring Redis is running..."
if ! redis-cli ping >/dev/null 2>&1; then
    print_error "Redis is not accessible. Please start Redis and try again."
    exit 1
fi

print_success "Redis is running"

# Start services
print_status "Starting services..."

# Start Orchestrator (API) - Port 4000
print_status "Starting Orchestrator (API) on port 4000..."
cd services/orchestrator
npm run dev > ../../logs/orchestrator.log 2>&1 &
ORCHESTRATOR_PID=$!
cd - > /dev/null

# Start Preview Service - Port 4001
print_status "Starting Preview Service on port 4001..."
cd services/preview-service
npm run dev > ../../logs/preview-service.log 2>&1 &
PREVIEW_PID=$!
cd - /dev/null

# Start Codegen Worker
print_status "Starting Codegen Worker..."
cd services/codegen-worker
npm run dev > ../../logs/codegen-worker.log 2>&1 &
WORKER_PID=$!
cd - > /dev/null

# Start Web App - Port 3000
print_status "Starting Web App on port 3000..."
cd services/web
npm run dev > ../../logs/web.log 2>&1 &
WEB_PID=$!
cd - > /dev/null

# Create logs directory if it doesn't exist
mkdir -p logs

# Wait for services to start
print_status "Waiting for services to start..."
sleep 5

# Check if services are running
print_status "Checking service status..."

# Check Orchestrator
if wait_for_service "http://localhost:4000/health" "Orchestrator"; then
    print_success "✅ Orchestrator (API): http://localhost:4000"
else
    print_error "❌ Orchestrator failed to start"
fi

# Check Preview Service
if wait_for_service "http://localhost:4001/health" "Preview Service"; then
    print_success "✅ Preview Service: http://localhost:4001"
else
    print_error "❌ Preview Service failed to start"
fi

# Check Web App
if wait_for_service "http://localhost:3000" "Web App"; then
    print_success "✅ Web App: http://localhost:3000"
else
    print_error "❌ Web App failed to start"
fi

# Check Worker (no HTTP endpoint, just check if process is running)
if kill -0 $WORKER_PID 2>/dev/null; then
    print_success "✅ Codegen Worker: Running (PID: $WORKER_PID)"
else
    print_error "❌ Codegen Worker failed to start"
fi

echo ""
echo "================================================"
print_success "🎉 Celiador Development Environment Started!"
echo "================================================"
echo ""
echo "🌐 Access your application:"
echo "   Frontend:    http://localhost:3000"
echo "   API:         http://localhost:4000"
echo "   Preview:     http://localhost:4001"
echo "   Worker:      Running in background"
echo ""
echo "📊 Service Status:"
echo "   Orchestrator PID: $ORCHESTRATOR_PID"
echo "   Preview Service PID: $PREVIEW_PID"
echo "   Codegen Worker PID: $WORKER_PID"
echo "   Web App PID: $WEB_PID"
echo ""
echo "📝 Logs are available in:"
echo "   ./logs/orchestrator.log"
echo "   ./logs/preview-service.log"
echo "   ./logs/codegen-worker.log"
echo "   ./logs/web.log"
echo ""
echo "🛑 Press Ctrl+C to stop all services"
echo ""

# Keep script running and show logs
print_status "Monitoring services... (Press Ctrl+C to stop)"
echo ""

# Function to show recent logs
show_logs() {
    echo "=== Recent Logs ==="
    echo "Orchestrator (last 5 lines):"
    tail -5 logs/orchestrator.log 2>/dev/null || echo "No logs yet"
    echo ""
    echo "Preview Service (last 5 lines):"
    tail -5 logs/preview-service.log 2>/dev/null || echo "No logs yet"
    echo ""
    echo "Codegen Worker (last 5 lines):"
    tail -5 logs/codegen-worker.log 2>/dev/null || echo "No logs yet"
    echo ""
    echo "Web App (last 5 lines):"
    tail -5 logs/web.log 2>/dev/null || echo "No logs yet"
    echo "=================="
}

# Show initial logs
show_logs

# Monitor services and show logs every 30 seconds
while true; do
    sleep 30
    show_logs
done
