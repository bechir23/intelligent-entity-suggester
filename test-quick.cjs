const { default: fetch } = require('node-fetch');

async function quickTest() {
  console.log('Quick validation test');
  
  try {
    const response = await fetch('http://localhost:3001/api/chat/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: "my tasks" })
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('Response:', result.response);
      console.log('Data count:', result.data ? result.data.length : 0);
      console.log('Entities:', result.entities ? result.entities.map(e => `${e.text}(${e.type})`).join(', ') : 'none');
    } else {
      console.log('API Error:', response.status);
    }
  } catch (error) {
    console.log('Error:', error.message);
  }
}

quickTest();
