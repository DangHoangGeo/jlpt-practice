const fs = require('fs');
const path = require('path');

// Function to escape CSV fields
function escapeCsvField(field) {
  if (field == null) return '';
  const str = String(field);
  if (str.includes(',') || str.includes('\n') || str.includes('\"')) {
    return '\"' + str.replace(/\"/g, '\"\"') + '\"';
  }
  return str;
}

const dataDir = path.join(__dirname, 'data');
const grammarDir = path.join(dataDir, 'grammar');
const outputPath = path.join(dataDir, 'grammar_converted.csv');

console.log('Converting grammar files...');

const csvHeader = 'term,reading,meaning_en,meaning_vi,example_jp,section';
const allCsvRows = [csvHeader];

const files = fs.readdirSync(grammarDir).filter(f => f.endsWith('.json')).sort();
let totalItems = 0;

files.forEach(file => {
  const filePath = path.join(grammarDir, file);
  const jsonData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  
  jsonData.forEach(item => {
    const csvRow = [
      escapeCsvField(item.grammar),
      escapeCsvField(item.furigana),
      escapeCsvField(item.english),
      escapeCsvField(item.vietnamese),
      escapeCsvField(item.example_jp),
      escapeCsvField('grammar')
    ].join(',');
    
    allCsvRows.push(csvRow);
    totalItems++;
  });
});

fs.writeFileSync(outputPath, allCsvRows.join('\n'), 'utf8');
console.log('Conversion completed! Total items:', totalItems);