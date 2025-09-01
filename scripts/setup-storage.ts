import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables:');
  console.error('- NEXT_PUBLIC_SUPABASE_URL');
  console.error('- SUPABASE_SERVICE_ROLE_KEY');
  console.error('Please add these to your .env.local file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function setupStorage() {
  console.log('Setting up Supabase Storage bucket for VemoRable...\n');

  try {
    // Check if bucket already exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('Error listing buckets:', listError);
      return;
    }

    const bucketExists = buckets?.some(bucket => bucket.name === 'user-uploads');

    if (bucketExists) {
      console.log('✓ Storage bucket "user-uploads" already exists');
    } else {
      // Create the storage bucket
      const { error } = await supabase.storage.createBucket('user-uploads', {
        public: false,
        allowedMimeTypes: [
          'application/pdf',
          'image/jpeg',
          'image/jpg', 
          'image/png',
          'image/gif',
          'image/webp',
          'text/plain',
          'text/markdown',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ],
        fileSizeLimit: 10485760 // 10MB in bytes
      });

      if (error) {
        console.error('Error creating storage bucket:', error);
        return;
      }

      console.log('✓ Storage bucket "user-uploads" created successfully');
    }

    // Note about RLS policies
    console.log('\n📌 Important: RLS policies need to be configured manually in Supabase Dashboard:');
    console.log('   1. Go to Storage > Policies in your Supabase Dashboard');
    console.log('   2. Select the "user-uploads" bucket');
    console.log('   3. Create the following policies:');
    console.log('      - INSERT: Allow users to upload to their folder (auth.uid()::text = (storage.foldername(name))[1])');
    console.log('      - SELECT: Allow users to view their files (auth.uid()::text = (storage.foldername(name))[1])');
    console.log('      - UPDATE: Allow users to update their files (auth.uid()::text = (storage.foldername(name))[1])');
    console.log('      - DELETE: Allow users to delete their files (auth.uid()::text = (storage.foldername(name))[1])');

    console.log('\n✅ Storage setup complete!');

  } catch (error) {
    console.error('Unexpected error during storage setup:', error);
  }
}

// Run the setup
setupStorage();