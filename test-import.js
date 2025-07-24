const fs = require('fs');
const path = require('path');

// Read the JSON file
const filePath = path.join(__dirname, 'demodata', 'cam 19 reading test 1 read 1.json');
const jsonData = JSON.parse(fs.readFileSync(filePath, 'utf8'));

console.log('=== ORIGINAL JSON DATA ===');
console.log('Metadata title:', jsonData.metadata?.title);
console.log('Reading passage title:', jsonData.content?.readingPassage?.title);

// Test the title enhancement logic
function extractCamTestInfo(metadataTitle) {
  if (!metadataTitle) return null;
  
  const camTestMatch = metadataTitle.match(/(Cambridge IELTS \d+|Cam \d+).*?(Test \d+)/i);
  if (camTestMatch) {
    const camInfo = camTestMatch[1].replace('Cambridge IELTS', 'Cam');
    const testInfo = camTestMatch[2];
    
    // Extract Reading Passage number if available
    const passageMatch = metadataTitle.match(/Reading Passage (\d+)/i);
    const passageInfo = passageMatch ? `Reading Passage ${passageMatch[1]}` : '';
    
    return {
      camInfo,
      testInfo,
      passageInfo
    };
  }
  
  return null;
}

function enhanceTitle(originalTitle, metadataTitle) {
  const camTestInfo = extractCamTestInfo(metadataTitle);
  
  if (camTestInfo) {
    if (camTestInfo.passageInfo) {
      return `${camTestInfo.camInfo} ${camTestInfo.testInfo} ${camTestInfo.passageInfo}: ${originalTitle}`;
    } else {
      return `${camTestInfo.camInfo} ${camTestInfo.testInfo}: ${originalTitle}`;
    }
  }
  
  return originalTitle;
}

// Test the enhancement
const originalTitle = jsonData.content?.readingPassage?.title || 'Unknown';
const metadataTitle = jsonData.metadata?.title;
const enhancedTitle = enhanceTitle(originalTitle, metadataTitle);

console.log('\n=== TITLE ENHANCEMENT TEST ===');
console.log('Original title:', originalTitle);
console.log('Metadata title:', metadataTitle);
console.log('Enhanced title:', enhancedTitle);

// Test cam/test extraction
const camTestInfo = extractCamTestInfo(metadataTitle);
console.log('\n=== CAM/TEST EXTRACTION ===');
console.log('Extracted info:', camTestInfo);

console.log('\n=== EXPECTED RESULT ===');
console.log('Should show: "Cam 19 Test 1 Reading Passage 1: How tennis rackets have changed"');
console.log('Actually shows:', enhancedTitle);