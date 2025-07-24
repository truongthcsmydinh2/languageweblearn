const fs = require('fs');
const path = require('path');

// Kiểm tra các file JSON trong thư mục data
function checkJsonFiles() {
  const dataDir = path.join(__dirname, 'src', 'data');
  
  if (!fs.existsSync(dataDir)) {
    console.log('Data directory not found');
    return;
  }
  
  const files = fs.readdirSync(dataDir).filter(file => file.endsWith('.json'));
  
  console.log(`Found ${files.length} JSON files in data directory`);
  
  files.forEach(file => {
    const filePath = path.join(dataDir, file);
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Kiểm tra xem có chứa "Answer:" không
      if (content.includes('Answer:')) {
        console.log(`\n*** FOUND "Answer:" in file: ${file} ***`);
        
        // Tìm các dòng chứa "Answer:"
        const lines = content.split('\n');
        lines.forEach((line, index) => {
          if (line.includes('Answer:')) {
            console.log(`Line ${index + 1}: ${line.trim()}`);
          }
        });
      }
      
    } catch (error) {
      console.log(`Error reading file ${file}:`, error.message);
    }
  });
}

// Kiểm tra file test
function checkTestFiles() {
  const testFiles = [
    'test-choose-two-letters-data.json',
    'test-data.json'
  ];
  
  testFiles.forEach(file => {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        
        if (content.includes('Answer:')) {
          console.log(`\n*** FOUND "Answer:" in test file: ${file} ***`);
          
          const lines = content.split('\n');
          lines.forEach((line, index) => {
            if (line.includes('Answer:')) {
              console.log(`Line ${index + 1}: ${line.trim()}`);
            }
          });
        }
        
      } catch (error) {
        console.log(`Error reading test file ${file}:`, error.message);
      }
    }
  });
}

console.log('Checking for leaked answers in JSON files...');
checkJsonFiles();
checkTestFiles();
console.log('\nCheck completed.');