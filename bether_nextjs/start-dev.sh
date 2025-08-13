#!/bin/bash

echo "🧹 Cleaning up existing processes..."
pkill -f "node" 2>/dev/null
pkill -f "next" 2>/dev/null
pkill -f "tsx" 2>/dev/null
sleep 2

echo "🔍 Checking if ports are free..."
if lsof -i:3000 >/dev/null 2>&1; then
    echo "❌ Port 3000 is still in use"
    lsof -i:3000
    exit 1
fi

if lsof -i:4000 >/dev/null 2>&1; then
    echo "❌ Port 4000 is still in use"
    lsof -i:4000
    exit 1
fi

echo "✅ Ports are free"

echo "🚀 Starting development services..."

echo "1️⃣ Starting Orchestrator on port 4001..."
cd apps/orchestrator
PORT=4001 pnpm dev &
ORCHESTRATOR_PID=$!

echo "2️⃣ Starting Worker..."
cd ../../workers/codegen
pnpm dev &
WORKER_PID=$!

echo "3️⃣ Starting Web App on port 3001..."
cd ../../apps/web
PORT=3001 pnpm dev &
WEB_PID=$!

echo "⏳ Waiting for services to start..."
sleep 5

echo "📊 Service Status:"
echo "   - Orchestrator (port 4001): PID $ORCHESTRATOR_PID"
echo "   - Worker: PID $WORKER_PID"
echo "   - Web App (port 3001): PID $WEB_PID"

echo ""
echo "🌐 Access your application at:"
echo "   - Web App: http://localhost:3001"
echo "   - Orchestrator API: http://localhost:4001"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for user to stop
wait
