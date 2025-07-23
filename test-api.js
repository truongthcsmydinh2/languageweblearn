async function testAPI() {
  const fetch = (await import('node-fetch')).default;
  try {
    console.log('Testing API endpoint...');
    // Test home page first
    console.log('Testing home page...');
    const homeResponse = await fetch('http://127.0.0.1:3031/');
    console.log('Home page status:', homeResponse.status);
    
    // Test API
    console.log('Testing API...');
    const response = await fetch('http://127.0.0.1:3031/api/admin/ielts-reading/questions/1');
    const data = await response.json();
    
    console.log('API Response Status:', response.status);
    console.log('API Response Data:', JSON.stringify(data, null, 2));
    
    if (data.groups && data.groups.length > 0) {
      const firstGroup = data.groups[0];
      console.log('\nFirst group questions:');
      firstGroup.questions.forEach((q, index) => {
        console.log(`Question ${index + 1}:`);
        console.log(`  ID: ${q.id}`);
        console.log(`  Text: ${q.question_text || 'MISSING'}`);
        console.log(`  Type: ${q.question_type || 'MISSING'}`);
        console.log(`  Order: ${q.order_index || 'MISSING'}`);
        console.log('---');
      });
    }
  } catch (error) {
    console.error('Error testing API:', error.message);
  }
}

testAPI();