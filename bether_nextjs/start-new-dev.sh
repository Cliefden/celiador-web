#!/bin/bash

echo "🧹 Cleaning up existing processes..."
pkill -f "next.*3000" 2>/dev/null
sleep 2

echo "🔍 Checking if port 3000 is free..."
if lsof -i:3000 >/dev/null 2>&1; then
    echo "❌ Port 3000 is still in use"
    lsof -i:3000
    exit 1
fi

echo "✅ Port is free"

echo "🚀 Starting bether_nextjs web app..."

echo "1️⃣ Starting Web App on port 3000..."
cd apps/web
PORT=3000 pnpm dev &
WEB_PID=$!

echo "⏳ Waiting for service to start..."
sleep 5

echo "📊 Service Status:"
echo "   - Web App (port 3000): PID $WEB_PID"

echo ""
echo "🌐 Access your application at:"
echo "   - Web App: http://localhost:3000"
echo ""
echo "📋 External Services (must be running separately):"
echo "   - Orchestrator: http://localhost:4000 (celiador-orchestrator)"
echo "   - Preview Service: http://localhost:4001 (celiador-preview-service)"
echo "   - Codegen Worker: (celiador-codegen-worker)"
echo ""
echo "Press Ctrl+C to stop the web app"

# Wait for user to stop
wait