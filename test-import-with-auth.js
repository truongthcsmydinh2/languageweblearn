const fs = require('fs');
const FormData = require('form-data');
const fetch = require('node-fetch');

async function testImportWithAuth() {
  try {
    // Read and parse the test JSON file
    const jsonData = fs.readFileSync('./test-new-passage.json', 'utf8');
    const parsedData = JSON.parse(jsonData);
    
    // Make the request with admin authentication
    const response = await fetch('http://localhost:3030/api/admin/ielts-reading/import', {
      method: 'POST',
      body: JSON.stringify(parsedData),
      headers: {
        'Content-Type': 'application/json',
        // Mock admin authentication
        'firebase_uid': 'test-admin-uid'
      }
    });
    
    const result = await response.text();
    console.log('Response status:', response.status);
    console.log('Response:', result);
    
    if (response.ok) {
      console.log('\n✅ Import successful!');
      
      // Parse the response to check if options were created
      try {
        const parsedResult = JSON.parse(result);
        if (parsedResult.data && parsedResult.data.questionGroups) {
          console.log('\n📋 Question Groups:');
          parsedResult.data.questionGroups.forEach((group, index) => {
            console.log(`Group ${index + 1}:`);
            console.log('  Type:', group.type);
            console.log('  Options:', group.options);
            if (group.questions) {
              group.questions.forEach((q, qIndex) => {
                console.log(`  Question ${qIndex + 1}:`);
                console.log('    Text:', q.text?.substring(0, 50) + '...');
                console.log('    Options:', q.options);
              });
            }
          });
        }
      } catch (parseError) {
        console.log('Could not parse response as JSON');
      }
    } else {
      console.log('❌ Import failed');
    }
    
  } catch (error) {
    console.error('Error testing import:', error.message);
  }
}

testImportWithAuth();