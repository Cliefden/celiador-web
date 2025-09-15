#!/bin/bash

# Quick Environment Setup for Celiador
# Run this from the root directory to set up all environment variables

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

echo "🔧 Celiador Environment Quick Setup"
echo "==================================="
echo ""

# Check if we're in the right directory
if [ ! -d "celiador-web" ] || [ ! -d "celiador-orchestrator" ]; then
    print_error "Please run this script from the root bether directory"
    exit 1
fi

# Check if env-setup directory exists
if [ ! -d "env-setup" ]; then
    print_error "env-setup directory not found. Please ensure it exists."
    exit 1
fi

print_status "Setting up environment files..."

# Run the environment setup script
cd env-setup
./setup-env.sh

print_success "✅ Environment files created!"

echo ""
print_warning "⚠️  IMPORTANT: You need to update the following API keys:"
echo ""
echo "1. OpenAI API Key (Required for code generation):"
echo "   - Get from: https://platform.openai.com/api-keys"
echo "   - Update in: celiador-orchestrator/.env and celiador-codegen-worker/.env"
echo ""
echo "2. GitHub OAuth App (Optional, for GitHub integration):"
echo "   - Create at: https://github.com/settings/applications/new"
echo "   - Update in: celiador-orchestrator/.env"
echo ""
echo "3. Anthropic API Key (Optional, for Claude integration):"
echo "   - Get from: https://console.anthropic.com/"
echo "   - Update in: celiador-orchestrator/.env"
echo ""

# Validate the environment
print_status "Validating environment configuration..."
./validate-env.sh

echo ""
print_success "🎉 Environment setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Update the API keys mentioned above"
echo "2. Start Redis: redis-server"
echo "3. Start all services: ./scripts/dev-all.sh"
echo ""
echo "📚 For detailed setup instructions, see: env-setup/README.md"
