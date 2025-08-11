import OpenAI from 'openai';

// Test function to verify OpenAI API key
async function testOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey || apiKey === 'your_openai_api_key_here') {
    console.log('❌ No valid OpenAI API key found');
    console.log('Please set OPENAI_API_KEY environment variable');
    return false;
  }
  
  try {
    const openai = new OpenAI({
      apiKey,
    });
    
    console.log('🔑 Testing OpenAI API key...');
    
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'user', content: 'Say "Hello from Bether!"' }
      ],
      max_tokens: 10,
    });
    
    const result = response.choices[0]?.message?.content;
    console.log('✅ OpenAI API key is valid!');
    console.log('Response:', result);
    return true;
    
  } catch (error) {
    console.log('❌ OpenAI API key test failed:');
    console.log(error.message);
    return false;
  }
}

// Run the test
testOpenAI().then(success => {
  if (success) {
    console.log('\n🎉 LLM integration is ready to use!');
  } else {
    console.log('\n🔧 Please add a valid OpenAI API key to .env');
  }
  process.exit(success ? 0 : 1);
});
