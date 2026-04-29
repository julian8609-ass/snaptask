#!/bin/bash
# Quick verification script before Vercel deployment

echo "🔍 SnapTask Pre-Deployment Verification"
echo "========================================"
echo ""

# Check Node.js
echo "✓ Checking Node.js..."
if ! command -v node &> /dev/null; then
    echo "✗ Node.js not installed"
    exit 1
fi
echo "✓ Node.js version: $(node -v)"
echo ""

# Check npm
echo "✓ Checking npm..."
if ! command -v npm &> /dev/null; then
    echo "✗ npm not installed"
    exit 1
fi
echo "✓ npm version: $(npm -v)"
echo ""

# Check .env file
echo "✓ Checking .env file..."
if [ ! -f .env ]; then
    echo "✗ .env file not found"
    echo "  Create .env with Supabase credentials"
    exit 1
fi
echo "✓ .env file exists"
echo ""

# Check .env has Supabase URL
if ! grep -q "NEXT_PUBLIC_SUPABASE_URL" .env; then
    echo "✗ NEXT_PUBLIC_SUPABASE_URL missing in .env"
    exit 1
fi
echo "✓ NEXT_PUBLIC_SUPABASE_URL configured"
echo ""

# Check .env has Supabase keys
if ! grep -q "SUPABASE_SERVICE_ROLE_KEY" .env; then
    echo "✗ SUPABASE_SERVICE_ROLE_KEY missing in .env"
    exit 1
fi
echo "✓ SUPABASE_SERVICE_ROLE_KEY configured"
echo ""

# Check node_modules
echo "✓ Checking dependencies..."
if [ ! -d "node_modules" ]; then
    echo "⚠ node_modules not found, running npm install..."
    npm install
fi
echo "✓ Dependencies installed"
echo ""

# Test build
echo "✓ Testing build..."
if npm run build 2>&1 | grep -q "error"; then
    echo "✗ Build failed - fix errors before deploying"
    exit 1
fi
echo "✓ Build successful!"
echo ""

# Check Git
echo "✓ Checking Git..."
if ! command -v git &> /dev/null; then
    echo "⚠ Git not installed - needed for Vercel"
fi
echo "✓ Git status:"
git status --short | head -5
echo ""

echo "✅ Pre-deployment verification complete!"
echo ""
echo "Next steps:"
echo "1. Verify .env values are correct"
echo "2. Create demo user in Supabase: sql/insert-demo-user.sql"
echo "3. Push to GitHub: git push origin main"
echo "4. Deploy on Vercel: https://vercel.com/new"
echo "5. Add environment variables in Vercel dashboard"
echo "6. Click Deploy!"
