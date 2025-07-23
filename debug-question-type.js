const mysql = require('mysql2');

// Create connection
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'myvps',
  password: 'abcd1234',
  database: 'vocab_app'
});

console.log('=== Checking question types for TWO questions ===');

connection.query(
  `SELECT id, question_type, question_text, options 
   FROM ielts_reading_questions 
   WHERE question_text LIKE '%Test multiple choice 5%' 
      OR question_text LIKE '%Which TWO%' 
      OR question_text LIKE '%Choose TWO%'
   ORDER BY id DESC LIMIT 10`,
  (err, results) => {
    if (err) {
      console.error('Error:', err);
      connection.end();
      return;
    }
    
    console.log(`Found ${results.length} questions`);
    
    results.forEach((q, index) => {
      console.log(`\n--- Question ${index + 1} ---`);
      console.log('ID:', q.id);
      console.log('Type:', q.question_type);
      console.log('Text:', q.question_text);
      console.log('Options:', q.options);
      console.log('Options Type:', typeof q.options);
      
      // Try to parse options if it's a string
      if (typeof q.options === 'string') {
        try {
          const parsed = JSON.parse(q.options);
          console.log('Parsed Options:', parsed);
          console.log('Parsed Is Array:', Array.isArray(parsed));
        } catch (e) {
          console.log('Failed to parse options as JSON');
        }
      }
    });
    
    connection.end();
  }
);