// Test script to add a job directly to the queue
// Run with: node test-queue.js

import { Queue } from 'bullmq';
import dotenv from 'dotenv';

dotenv.config();

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

async function testQueue() {
  console.log('🧪 Testing Queue Directly...\n');

  try {
    // Create queue
    const jobQueue = new Queue('codegen-jobs', {
      connection: { url: redisUrl }
    });

    console.log('✅ Queue created');

    // Add a test job
    const job = await jobQueue.add('codegen-jobs', {
      jobId: 'test-job-123',
      projectId: 'test-project-456',
      userId: 'test-user-789',
      type: 'SCAFFOLD',
      prompt: 'Test prompt',
      templateKey: 'next-prisma-supabase',
      repo: {
        provider: 'github',
        owner: 'test',
        name: 'test-repo'
      }
    });

    console.log('✅ Job added to queue:', job.id);
    console.log('   - Name:', job.name);
    console.log('   - Data:', job.data);

    // Check queue length
    const waiting = await jobQueue.getWaiting();
    console.log('📊 Jobs waiting:', waiting.length);

    // Wait a bit and check if job was processed
    console.log('\n⏳ Waiting 5 seconds to see if worker processes the job...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    const completed = await jobQueue.getCompleted();
    const failed = await jobQueue.getFailed();

    console.log('📊 Jobs completed:', completed.length);
    console.log('📊 Jobs failed:', failed.length);

    if (completed.length > 0) {
      console.log('✅ Worker processed the job!');
      console.log('   Result:', completed[0].returnvalue);
    } else if (failed.length > 0) {
      console.log('❌ Job failed:', failed[0].failedReason);
    } else {
      console.log('❌ Job was not processed by worker');
    }

    // Clean up
    await jobQueue.close();
    console.log('\n✅ Test completed');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testQueue().catch(console.error);
