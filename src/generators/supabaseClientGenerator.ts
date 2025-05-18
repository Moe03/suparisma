import fs from 'fs';
import path from 'path';
import { UTILS_DIR } from '../config'; // Ensure this is UTILS_DIR

export function generateSupabaseClientFile() {
  const supabaseClientContent = `// THIS FILE IS AUTO-GENERATED - DO NOT EDIT DIRECTLY
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
`;

  // Output to the UTILS_DIR
  const outputPath = path.join(UTILS_DIR, 'supabase-client.ts');

  if (!fs.existsSync(UTILS_DIR)) {
    fs.mkdirSync(UTILS_DIR, { recursive: true });
  }

  fs.writeFileSync(outputPath, supabaseClientContent);
  console.log(`🚀 Generated Supabase client file at: ${outputPath}`);
} 