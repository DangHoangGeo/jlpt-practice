#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Simple CSV parser
function parseCSV(csvText) {
  const lines = csvText.trim().split('\n');
  const headers = lines[0].split(',');
  
  return lines.slice(1).map(line => {
    const values = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"' && (i === 0 || line[i-1] === ',')) {
        inQuotes = true;
      } else if (char === '"' && inQuotes && (i === line.length - 1 || line[i+1] === ',')) {
        inQuotes = false;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());
    
    const obj = {};
    headers.forEach((header, index) => {
      obj[header.trim()] = values[index] || '';
    });
    return obj;
  });
}

async function seedData() {
  console.log('🌱 Starting database seeding...');
  
  const baseURL = 'http://localhost:3000';
  const adminKey = 'seed-initial-data-2025';
  
  try {
    // 1. Seed vocabulary items
    console.log('📚 Seeding vocabulary items...');
    const vocabCSV = fs.readFileSync(path.join(__dirname, '../data/vocabulary_items_converted.csv'), 'utf8');
    const vocabData = parseCSV(vocabCSV);
    
    const vocabResponse = await fetch(`${baseURL}/api/seed-simple`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        section: 'vocabulary',
        data: vocabData,
        admin_key: adminKey
      })
    });
    
    if (vocabResponse.ok) {
      const result = await vocabResponse.json();
      console.log(`✅ Vocabulary items seeded: ${result.inserted_count} items`);
    } else {
      const error = await vocabResponse.text();
      console.error('❌ Failed to seed vocabulary:', error);
    }
    
    // 2. Seed grammar items
    console.log('📝 Seeding grammar items...');
    const grammarCSV = fs.readFileSync(path.join(__dirname, '../data/grammar_converted.csv'), 'utf8');
    const grammarData = parseCSV(grammarCSV);
    
    const grammarResponse = await fetch(`${baseURL}/api/seed-simple`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        section: 'grammar',
        data: grammarData,
        admin_key: adminKey
      })
    });
    
    if (grammarResponse.ok) {
      const result = await grammarResponse.json();
      console.log(`✅ Grammar items seeded: ${result.inserted_count} items`);
    } else {
      const error = await grammarResponse.text();
      console.error('❌ Failed to seed grammar:', error);
    }
    
    // 3. Seed tips
    console.log('💡 Seeding tips...');
    const tipsCSV = fs.readFileSync(path.join(__dirname, '../data/tips.csv'), 'utf8');
    const tipsData = parseCSV(tipsCSV);
    
    const tipsResponse = await fetch(`${baseURL}/api/seed-simple`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        section: 'tips',
        data: tipsData,
        admin_key: adminKey
      })
    });
    
    if (tipsResponse.ok) {
      const result = await tipsResponse.json();
      console.log(`✅ Tips seeded: ${result.inserted_count} items`);
    } else {
      const error = await tipsResponse.text();
      console.error('❌ Failed to seed tips:', error);
    }
    
    console.log('🎉 Database seeding completed!');
    
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    process.exit(1);
  }
}

// Check if server is running
async function checkServer() {
  try {
    const response = await fetch('http://localhost:3000/api/health');
    return response.ok;
  } catch {
    // Try alternative check
    try {
      const response = await fetch('http://localhost:3000');
      return true;
    } catch {
      return false;
    }
  }
}

async function main() {
  console.log('🔍 Checking if development server is running...');
  
  const serverRunning = await checkServer();
  if (!serverRunning) {
    console.error('❌ Development server is not running!');
    console.log('Please start the server first with: npm run dev');
    process.exit(1);
  }
  
  console.log('✅ Server is running');
  await seedData();
}

main().catch(console.error);
