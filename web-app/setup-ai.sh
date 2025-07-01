#!/bin/bash

# JLPT Practice App - AI Features Setup Script
# Run this script to set up the AI-powered features

echo "🚀 JLPT Practice App - AI Setup"
echo "================================"

# Check if we're in the correct directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the web-app directory"
    exit 1
fi

echo "📦 Installing required dependencies..."
npm install @google/generative-ai uuid

echo "🗃️ Setting up environment variables..."
if [ ! -f ".env.local" ]; then
    cp .env.example .env.local
    echo "✅ Created .env.local from .env.example"
    echo "⚠️  Please add your GOOGLE_AI_API_KEY to .env.local"
else
    echo "ℹ️  .env.local already exists"
fi

echo "🔑 Checking for Google AI API key..."
if grep -q "GOOGLE_AI_API_KEY=your_google_ai_api_key" .env.local 2>/dev/null; then
    echo "⚠️  Warning: Please update GOOGLE_AI_API_KEY in .env.local with your actual API key"
    echo "    Get your API key from: https://aistudio.google.com/"
elif [ -f ".env.local" ] && grep -q "GOOGLE_AI_API_KEY=AIza" .env.local; then
    echo "✅ Google AI API key appears to be configured"
else
    echo "❓ Cannot determine if Google AI API key is configured"
fi

echo ""
echo "🗄️ Database setup instructions:"
echo "1. Connect to your Supabase project"
echo "2. Go to SQL Editor"
echo "3. Run the SQL from: supabase/enhanced_schema.sql"
echo ""

echo "🎯 Next steps:"
echo "1. Configure your Google AI API key in .env.local"
echo "2. Run the enhanced database schema in Supabase"
echo "3. Start the development server: npm run dev"
echo "4. Test AI features in the dashboard"
echo ""

echo "📚 Documentation:"
echo "- Setup guide: README.md"
echo "- AI features: AI_UPGRADE_IMPLEMENTATION.md"
echo "- Database schema: supabase/enhanced_schema.sql"
echo ""

echo "✨ AI Features Available:"
echo "- Smart question generation based on weaknesses"
echo "- Personalized explanations for wrong answers"
echo "- Learning weakness analysis and recommendations"
echo "- Custom vocabulary and grammar management"
echo "- Intelligent dashboard with insights"
echo ""

# Check if Google AI API key is set and valid format
if [ -f ".env.local" ]; then
    source .env.local
    if [[ $GOOGLE_AI_API_KEY =~ ^AIza[0-9A-Za-z_-]{35}$ ]]; then
        echo "✅ Google AI API key format looks correct"
    elif [[ $GOOGLE_AI_API_KEY == "your_google_ai_api_key" ]] || [[ -z $GOOGLE_AI_API_KEY ]]; then
        echo "❌ Google AI API key needs to be configured"
        echo "   Visit: https://aistudio.google.com/ to get your API key"
    else
        echo "⚠️  Google AI API key format might be incorrect"
    fi
fi

echo ""
echo "🎉 Setup complete! Your JLPT app is ready for AI-powered learning!"
