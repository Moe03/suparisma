import fs from 'fs';
import path from 'path';
import { UTILS_DIR, PLATFORM } from '../config';

/**
 * Generate the Supabase client file based on the target platform.
 * Supports both web (Next.js, etc.) and React Native/Expo.
 */
export function generateSupabaseClientFile() {
  let supabaseClientContent: string;

  if (PLATFORM === 'react-native') {
    // React Native / Expo compatible client
    supabaseClientContent = `// THIS FILE IS AUTO-GENERATED - DO NOT EDIT DIRECTLY
// Platform: React Native / Expo
//
// IMPORTANT: Before using Suparisma in React Native, ensure you have:
// 1. Installed required dependencies:
//    pnpm install @supabase/supabase-js @react-native-async-storage/async-storage react-native-url-polyfill
//
// 2. Added polyfills at your app's entry point (e.g., App.tsx or index.js):
//    import 'react-native-url-polyfill/auto';
//
// 3. Set your Supabase credentials below or via environment variables

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// Option 1: Set your Supabase credentials directly (for quick setup)
// const SUPABASE_URL = 'https://your-project.supabase.co';
// const SUPABASE_ANON_KEY = 'your-anon-key';

// Option 2: Use environment variables (recommended for production)
// With Expo, use expo-constants or babel-plugin-inline-dotenv
// With bare React Native, use react-native-dotenv
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn(
    '[Suparisma] Supabase credentials not found. Please set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY ' +
    'in your environment variables, or update the credentials directly in this file.'
  );
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // Important for React Native
  },
});
`;
  } else {
    // Web platform (Next.js, Remix, etc.)
    supabaseClientContent = `// THIS FILE IS AUTO-GENERATED - DO NOT EDIT DIRECTLY
// Platform: Web (Next.js, Remix, etc.)
import { createClient } from '@supabase/supabase-js';

// For Next.js, use NEXT_PUBLIC_ prefix
// For other frameworks, adjust the environment variable names as needed
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn(
    '[Suparisma] Supabase credentials not found. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY ' +
    '(or SUPABASE_URL and SUPABASE_ANON_KEY) in your environment variables.'
  );
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
`;
  }

  // Output to the UTILS_DIR
  const outputPath = path.join(UTILS_DIR, 'supabase-client.ts');

  if (!fs.existsSync(UTILS_DIR)) {
    fs.mkdirSync(UTILS_DIR, { recursive: true });
  }

  fs.writeFileSync(outputPath, supabaseClientContent);
  console.log(`🚀 Generated Supabase client file at: ${outputPath} (platform: ${PLATFORM})`);
} 