// Test script for Supabase Storage implementation
// Run with: node test-storage.js

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.log('Please ensure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in your .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testStorageSetup() {
  console.log('🧪 Testing Supabase Storage Setup...\n');

  try {
    // Test 1: Check if bucket exists
    console.log('1️⃣ Testing bucket existence...');
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
    
    if (bucketError) {
      console.error('❌ Failed to list buckets:', bucketError);
      return false;
    }

    const projectFilesBucket = buckets.find(bucket => bucket.id === 'project-files');
    if (!projectFilesBucket) {
      console.error('❌ project-files bucket not found');
      console.log('Available buckets:', buckets.map(b => b.id));
      return false;
    }

    console.log('✅ project-files bucket found');
    console.log('   - Name:', projectFilesBucket.name);
    console.log('   - Public:', projectFilesBucket.public);
    console.log('   - File size limit:', projectFilesBucket.file_size_limit);

    // Test 2: Test file upload
    console.log('\n2️⃣ Testing file upload...');
    const testUserId = 'test-user-123';
    const testProjectId = 'test-project-456';
    const testFilePath = `${testUserId}/${testProjectId}/test-file.txt`;
    const testContent = 'Hello, this is a test file!';

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('project-files')
      .upload(testFilePath, testContent, {
        contentType: 'text/plain',
        upsert: true
      });

    if (uploadError) {
      console.error('❌ Failed to upload test file:', uploadError);
      return false;
    }

    console.log('✅ Test file uploaded successfully');
    console.log('   - Path:', uploadData.path);

    // Test 3: Test file download
    console.log('\n3️⃣ Testing file download...');
    const { data: downloadData, error: downloadError } = await supabase.storage
      .from('project-files')
      .download(testFilePath);

    if (downloadError) {
      console.error('❌ Failed to download test file:', downloadError);
      return false;
    }

    const downloadedContent = await downloadData.text();
    if (downloadedContent === testContent) {
      console.log('✅ Test file downloaded successfully');
      console.log('   - Content matches:', downloadedContent);
    } else {
      console.error('❌ Downloaded content does not match');
      console.log('   - Expected:', testContent);
      console.log('   - Got:', downloadedContent);
      return false;
    }

    // Test 4: Test file listing
    console.log('\n4️⃣ Testing file listing...');
    const { data: listData, error: listError } = await supabase.storage
      .from('project-files')
      .list(`${testUserId}/${testProjectId}`);

    if (listError) {
      console.error('❌ Failed to list files:', listError);
      return false;
    }

    if (listData && listData.length > 0) {
      console.log('✅ Files listed successfully');
      console.log('   - Files found:', listData.length);
      listData.forEach(file => {
        console.log(`   - ${file.name} (${file.metadata?.size || 'unknown'} bytes)`);
      });
    } else {
      console.error('❌ No files found in listing');
      return false;
    }

    // Test 5: Test file deletion
    console.log('\n5️⃣ Testing file deletion...');
    const { error: deleteError } = await supabase.storage
      .from('project-files')
      .remove([testFilePath]);

    if (deleteError) {
      console.error('❌ Failed to delete test file:', deleteError);
      return false;
    }

    console.log('✅ Test file deleted successfully');

    // Test 6: Verify deletion
    console.log('\n6️⃣ Verifying deletion...');
    const { data: verifyData, error: verifyError } = await supabase.storage
      .from('project-files')
      .list(`${testUserId}/${testProjectId}`);

    if (verifyError) {
      console.error('❌ Failed to verify deletion:', verifyError);
      return false;
    }

    if (!verifyData || verifyData.length === 0) {
      console.log('✅ File deletion verified - no files remain');
    } else {
      console.error('❌ Files still exist after deletion');
      return false;
    }

    console.log('\n🎉 All storage tests passed!');
    return true;

  } catch (error) {
    console.error('❌ Test failed with error:', error);
    return false;
  }
}

async function testFileStorageService() {
  console.log('\n🧪 Testing FileStorageService...\n');

  try {
    // Import the FileStorageService
    const { FileStorageService } = await import('./packages/shared/src/storage.js');
    
    const storageService = new FileStorageService();
    
    // Test data
    const testUserId = 'test-user-789';
    const testProjectId = 'test-project-101';
    const testFiles = [
      {
        path: 'package.json',
        content: JSON.stringify({ name: 'test-project', version: '1.0.0' }),
        contentType: 'application/json'
      },
      {
        path: 'src/app/page.tsx',
        content: 'export default function Page() { return <div>Hello World</div>; }',
        contentType: 'text/typescript'
      },
      {
        path: 'README.md',
        content: '# Test Project\n\nThis is a test project.',
        contentType: 'text/markdown'
      }
    ];

    // Test upload
    console.log('1️⃣ Testing FileStorageService upload...');
    const uploadResult = await storageService.uploadProjectFiles(testUserId, testProjectId, testFiles);
    console.log('✅ Files uploaded:', uploadResult.length);
    uploadResult.forEach(result => {
      console.log(`   - ${result.path} -> ${result.url}`);
    });

    // Test file tree
    console.log('\n2️⃣ Testing file tree generation...');
    const fileTree = await storageService.getProjectFileTree(testProjectId, testUserId);
    console.log('✅ File tree generated:', fileTree.length, 'root items');
    fileTree.forEach(item => {
      console.log(`   - ${item.name} (${item.type})`);
    });

    // Test download
    console.log('\n3️⃣ Testing file download...');
    const downloadedFiles = await storageService.downloadProjectFiles(testProjectId, testUserId);
    console.log('✅ Files downloaded:', downloadedFiles.length);
    downloadedFiles.forEach(file => {
      console.log(`   - ${file.path} (${file.content.length} chars)`);
    });

    // Test single file access
    console.log('\n4️⃣ Testing single file access...');
    const singleFile = await storageService.getFile(testProjectId, testUserId, 'package.json');
    if (singleFile) {
      console.log('✅ Single file accessed:', singleFile.path);
      console.log('   - Content preview:', singleFile.content.substring(0, 50) + '...');
    } else {
      console.error('❌ Failed to access single file');
      return false;
    }

    // Test cleanup
    console.log('\n5️⃣ Testing cleanup...');
    await storageService.deleteProjectFiles(testProjectId, testUserId);
    console.log('✅ Project files deleted');

    console.log('\n🎉 All FileStorageService tests passed!');
    return true;

  } catch (error) {
    console.error('❌ FileStorageService test failed:', error);
    return false;
  }
}

// Run tests
async function runTests() {
  console.log('🚀 Starting Supabase Storage Tests\n');
  
  const storageSetupPassed = await testStorageSetup();
  const serviceTestsPassed = await testFileStorageService();

  console.log('\n📊 Test Results:');
  console.log('   - Storage Setup:', storageSetupPassed ? '✅ PASSED' : '❌ FAILED');
  console.log('   - FileStorageService:', serviceTestsPassed ? '✅ PASSED' : '❌ FAILED');

  if (storageSetupPassed && serviceTestsPassed) {
    console.log('\n🎉 All tests passed! Your Supabase Storage is working correctly.');
    console.log('\nNext steps:');
    console.log('1. Start your development servers');
    console.log('2. Create a new project in the web interface');
    console.log('3. Run a Scaffold job to test the full flow');
  } else {
    console.log('\n❌ Some tests failed. Please check the errors above.');
    process.exit(1);
  }
}

runTests().catch(console.error);
