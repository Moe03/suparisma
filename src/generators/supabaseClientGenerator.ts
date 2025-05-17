import fs from 'fs';
import path from 'path';
import { OUTPUT_DIR } from '../config'; // Assuming OUTPUT_DIR is defined in config.ts

export function generateSupabaseClientFile() {
  const supabaseClientContent = `// THIS FILE IS AUTO-GENERATED - DO NOT EDIT DIRECTLY
import { createClient } from '@supabase/supabase-js';

console.log(\`NEXT_PUBLIC_SUPABASE_URL: \${process.env.NEXT_PUBLIC_SUPABASE_URL}\`);
console.log(\`NEXT_PUBLIC_SUPABASE_ANON_KEY: \${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}\`);
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
`;

  const outputPath = path.join(OUTPUT_DIR, 'supabase-client-generated.ts');

  // Ensure the output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  fs.writeFileSync(outputPath, supabaseClientContent);
  console.log(`🚀 Generated Supabase client file at: ${outputPath}`);
} 