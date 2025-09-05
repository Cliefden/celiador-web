#!/bin/bash

echo "🧹 Cleaning up existing processes..."
pkill -f "node" 2>/dev/null
pkill -f "next" 2>/dev/null
pkill -f "tsx" 2>/dev/null
sleep 2

echo "🔍 Checking if port 3000 is free..."
if lsof -i:3000 >/dev/null 2>&1; then
    echo "❌ Port 3000 is still in use"
    lsof -i:3000
    exit 1
fi

echo "✅ Port is free"

echo "🚀 Starting development services..."

echo "1️⃣ Starting Web App on port 3000..."
cd apps/web
PORT=3000 pnpm dev &
WEB_PID=$!

echo "⏳ Waiting for services to start..."
sleep 5

echo "📊 Service Status:"
echo "   - Web App (port 3000): PID $WEB_PID"
echo "   - Uses external orchestrator at http://localhost:4000"
echo "   - Uses external preview service at http://localhost:4001"
echo "   - Uses external codegen worker"

echo ""
echo "🌐 Access your application at:"
echo "   - Web App: http://localhost:3000"
echo "   - External services should be running separately"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for user to stop
wait
