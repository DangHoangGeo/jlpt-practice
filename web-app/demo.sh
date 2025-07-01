#!/bin/bash

# JLPT Practice App - Demo Script
# This script demonstrates the full setup process

echo "🎌 JLPT N1 Practice App - Setup Demo"
echo "===================================="
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Please run this script from the web-app directory"
    exit 1
fi

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "⚠️  No .env.local file found"
    echo "📝 Please copy .env.example to .env.local and add your Supabase credentials"
    echo ""
    echo "Steps to get Supabase credentials:"
    echo "1. Go to https://supabase.com and create a new project"
    echo "2. Go to Project Settings > API"
    echo "3. Copy your Project URL and anon public key"
    echo "4. Update .env.local with these values"
    echo ""
    echo "Would you like to create .env.local now? (y/n)"
    read -r response
    if [[ "$response" =~ ^[Yy]$ ]]; then
        cp .env.example .env.local
        echo "✅ Created .env.local - please edit it with your Supabase credentials"
        echo "Then run this script again"
        exit 0
    else
        echo "❌ Setup cancelled"
        exit 1
    fi
fi

echo "✅ Environment file found"
echo ""

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    if [ $? -eq 0 ]; then
        echo "✅ Dependencies installed successfully"
    else
        echo "❌ Failed to install dependencies"
        exit 1
    fi
else
    echo "✅ Dependencies already installed"
fi
echo ""

# Check build
echo "🔨 Testing build..."
npm run build > /tmp/build.log 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Build successful"
else
    echo "❌ Build failed. Check logs:"
    cat /tmp/build.log
    exit 1
fi
echo ""

# Start dev server in background
echo "🚀 Starting development server..."
npm run dev > /tmp/dev.log 2>&1 &
DEV_PID=$!

# Wait for server to start
echo "⏳ Waiting for server to start..."
sleep 5

# Check if server is running
if curl -s http://localhost:3000 > /dev/null; then
    echo "✅ Development server is running at http://localhost:3000"
    echo ""
    echo "🎯 Next Steps:"
    echo "1. Open http://localhost:3000 in your browser"
    echo "2. Sign up for a new account"
    echo "3. Run 'npm run seed' in another terminal to add sample data"
    echo "4. Start practicing with quizzes and flashcards!"
    echo ""
    echo "📚 Features to try:"
    echo "- 📖 Vocabulary Quiz (/quiz/vocab)"
    echo "- 📝 Grammar Quiz (/quiz/grammar)"  
    echo "- 🧠 Flashcards (/flashcards)"
    echo "- 💡 Study Tips (/tips)"
    echo ""
    echo "📊 Database Schema:"
    echo "Don't forget to run the SQL from supabase/schema.sql in your Supabase project!"
    echo ""
    echo "Press Ctrl+C to stop the server"
    
    # Keep script running until user stops it
    trap "echo ''; echo '🛑 Stopping server...'; kill $DEV_PID; exit 0" INT
    wait $DEV_PID
else
    echo "❌ Server failed to start. Check logs:"
    cat /tmp/dev.log
    kill $DEV_PID
    exit 1
fi
