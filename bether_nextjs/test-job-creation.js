// Test script to check job creation and processing
// Run with: node test-job-creation.js

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testJobCreation() {
  console.log('🧪 Testing Job Creation and Processing...\n');

  try {
    // Step 1: Get user session
    console.log('1️⃣ Getting user session...');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      console.error('❌ No valid session found');
      console.log('Please log in to the web app first');
      return;
    }

    console.log('✅ Session found for user:', session.user.email);

    // Step 2: Get user's projects
    console.log('\n2️⃣ Getting user projects...');
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('*')
      .eq('userid', session.user.id);

    if (projectsError) {
      console.error('❌ Failed to get projects:', projectsError);
      return;
    }

    if (!projects || projects.length === 0) {
      console.log('❌ No projects found. Please create a project first.');
      return;
    }

    const project = projects[0];
    console.log('✅ Found project:', project.name);

    // Step 3: Create a test job
    console.log('\n3️⃣ Creating test job...');
    const jobData = {
      projectid: project.id,
      type: 'SCAFFOLD',
      prompt: 'Create a simple test app',
      status: 'PENDING'
    };

    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .insert(jobData)
      .select()
      .single();

    if (jobError) {
      console.error('❌ Failed to create job:', jobError);
      return;
    }

    console.log('✅ Job created:', job.id);

    // Step 4: Check if job is being processed
    console.log('\n4️⃣ Monitoring job status...');
    let attempts = 0;
    const maxAttempts = 10;

    const checkJobStatus = async () => {
      const { data: updatedJob, error: statusError } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', job.id)
        .single();

      if (statusError) {
        console.error('❌ Failed to get job status:', statusError);
        return;
      }

      console.log(`   Attempt ${attempts + 1}: Status = ${updatedJob.status}`);

      if (updatedJob.status === 'COMPLETED') {
        console.log('✅ Job completed successfully!');
        console.log('   Output:', updatedJob.output);
        console.log('   Metadata:', updatedJob.metadata);
        return true;
      } else if (updatedJob.status === 'FAILED') {
        console.log('❌ Job failed:', updatedJob.error);
        return true;
      }

      attempts++;
      if (attempts >= maxAttempts) {
        console.log('❌ Job did not complete within expected time');
        return true;
      }

      return false;
    };

    // Check status every 2 seconds
    const interval = setInterval(async () => {
      const isDone = await checkJobStatus();
      if (isDone) {
        clearInterval(interval);
      }
    }, 2000);

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testJobCreation().catch(console.error);
