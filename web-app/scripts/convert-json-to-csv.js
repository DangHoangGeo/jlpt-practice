const fs = require('fs');
const path = require('path');

// Function to escape CSV fields
function escapeCsvField(field) {
  if (field == null) return '';
  const str = String(field);
  // If field contains comma, newline, or quote, wrap in quotes and escape internal quotes
  if (str.includes(',') || str.includes('\n') || str.includes('"')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

// Function to convert JSON array to CSV
function jsonToCsv(jsonArray, section) {
  if (!jsonArray || jsonArray.length === 0) return [];
  
  const csvRows = [];
  
  jsonArray.forEach(item => {
    let term, reading, meaningEn, meaningVi, exampleJp;
    
    // Map fields based on the JSON structure
    if (section === 'word') {
      term = item.word;
      reading = item.furigana;
      meaningEn = item.english;
      meaningVi = item.vietnamese;
      exampleJp = item.example_jp;
    } else if (section === 'kanji') {
      term = item.kanji;
      reading = item.furigana;
      meaningEn = item.english;
      meaningVi = item.vietnamese;
      exampleJp = item.example_jp;
    } else if (section === 'phrase') {
      term = item.phrase;
      reading = item.furigana;
      meaningEn = item.english;
      meaningVi = item.vietnamese;
      exampleJp = item.example_jp;
    }
    
    // Create CSV row
    const csvRow = [
      escapeCsvField(term),
      escapeCsvField(reading),
      escapeCsvField(meaningEn),
      escapeCsvField(meaningVi),
      escapeCsvField(exampleJp),
      escapeCsvField(section)
    ].join(',');
    
    csvRows.push(csvRow);
  });
  
  return csvRows;
}

// Function to process all JSON files in a directory
function processDirectory(dirPath, section) {
  const csvRows = [];
  
  try {
    const files = fs.readdirSync(dirPath);
    const jsonFiles = files.filter(file => file.endsWith('.json')).sort();
    
    console.log(`Processing ${jsonFiles.length} files in ${section} directory...`);
    
    jsonFiles.forEach(file => {
      const filePath = path.join(dirPath, file);
      console.log(`  Reading ${file}...`);
      
      try {
        const jsonData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        const rows = jsonToCsv(jsonData, section);
        csvRows.push(...rows);
        console.log(`    Added ${rows.length} items from ${file}`);
      } catch (error) {
        console.error(`    Error processing ${file}:`, error.message);
      }
    });
    
    console.log(`Total items from ${section}: ${csvRows.length}\n`);
  } catch (error) {
    console.error(`Error reading directory ${dirPath}:`, error.message);
  }
  
  return csvRows;
}

// Main function
function main() {
  const dataDir = path.join(__dirname, '..', 'data');
  const outputPath = path.join(dataDir, 'vocabulary_items_converted.csv');
  
  console.log('Starting JSON to CSV conversion...\n');
  
  // CSV header
  const csvHeader = 'term,reading,meaning_en,meaning_vi,example_jp,section';
  const allCsvRows = [csvHeader];
  
  // Process each directory
  const directories = [
    { path: path.join(dataDir, 'vocabulary'), section: 'word' },
    { path: path.join(dataDir, 'kanji'), section: 'kanji' },
    { path: path.join(dataDir, 'phases'), section: 'phrase' }
  ];
  
  directories.forEach(({ path: dirPath, section }) => {
    if (fs.existsSync(dirPath)) {
      const rows = processDirectory(dirPath, section);
      allCsvRows.push(...rows);
    } else {
      console.log(`Directory ${dirPath} does not exist, skipping...\n`);
    }
  });
  
  // Write to CSV file
  try {
    const csvContent = allCsvRows.join('\n');
    fs.writeFileSync(outputPath, csvContent, 'utf8');
    
    console.log(`✅ Conversion completed successfully!`);
    console.log(`📁 Output file: ${outputPath}`);
    console.log(`📊 Total items: ${allCsvRows.length - 1} (excluding header)`);
    
    // Show breakdown by section
    const wordCount = allCsvRows.filter(row => row.endsWith(',word')).length;
    const kanjiCount = allCsvRows.filter(row => row.endsWith(',kanji')).length;
    const phraseCount = allCsvRows.filter(row => row.endsWith(',phrase')).length;
    
    console.log('\n📈 Breakdown by section:');
    console.log(`  - Words: ${wordCount}`);
    console.log(`  - Kanji: ${kanjiCount}`);
    console.log(`  - Phrases: ${phraseCount}`);
    
  } catch (error) {
    console.error('❌ Error writing CSV file:', error.message);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { jsonToCsv, processDirectory, escapeCsvField };
