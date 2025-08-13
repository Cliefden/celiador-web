// Test script to check file tree endpoint
const { createClient } = require('@supabase/supabase-js');

// Use the same values as in the web app
const supabaseUrl = 'https://your-project.supabase.co'; // Replace with your actual URL
const supabaseAnonKey = 'your-anon-key'; // Replace with your actual key

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testFileTree() {
  try {
    console.log('🔐 Logging in...');
    const { data: { session }, error: loginError } = await supabase.auth.signInWithPassword({
      email: 'stefan3@me.com',
      password: 'password123'
    });

    if (loginError) {
      console.error('❌ Login failed:', loginError);
      return;
    }

    console.log('✅ Logged in successfully');
    console.log('🔑 Access token:', session?.access_token?.substring(0, 20) + '...');

    const projectId = '23fe8ca6-d8a3-4fbb-9998-f35c4b5db7ab';
    
    console.log(`📁 Testing file tree for project: ${projectId}`);
    
    const response = await fetch(`http://localhost:4000/projects/${projectId}/files/tree`, {
      headers: {
        'Authorization': `Bearer ${session.access_token}`
      }
    });

    console.log(`📊 Response status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ File tree data:', JSON.stringify(data, null, 2));
    } else {
      const errorText = await response.text();
      console.error('❌ Error response:', errorText);
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testFileTree();
