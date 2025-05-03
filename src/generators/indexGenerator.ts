import fs from 'fs';
import path from 'path';
import { HOOK_NAME_PREFIX, OUTPUT_DIR } from '../config';
import { ProcessedModelInfo } from '../types';

/**
 * Generate main index file to export all hooks and types.
 *
 * This creates a central module file that exports all generated hooks
 * and their associated types, allowing for clean imports in the user's code.
 *
 * @param modelInfos - Array of processed model information
 *
 * @example
 * // The generated index allows imports like:
 * import useSuparisma from './hooks/generated';
 * // or
 * import { useSuparismaUser } from './hooks/generated';
 */
export function generateMainIndexFile(modelInfos: ProcessedModelInfo[]): void {
  // Import statements for hooks
  const imports = modelInfos
    .map(
      (info) =>
        `import { ${HOOK_NAME_PREFIX}${info.modelName} } from './${HOOK_NAME_PREFIX}${info.modelName}';`
    )
    .join('\n');

  // Import all required types
  const typeImports = modelInfos
    .map(
      (info) =>
        `import type { Use${info.modelName}Options, ${info.modelName}HookApi } from './${info.modelName}Types';`
    )
    .join('\n');

  // Model-specific type exports
  const modelTypeExports = modelInfos
    .map(
      (info) =>
        `export type { ${info.modelName}WithRelations, ${info.modelName}CreateInput, ${info.modelName}UpdateInput, ${info.modelName}WhereInput, ${info.modelName}WhereUniqueInput, ${info.modelName}OrderByInput, ${info.modelName}HookApi, Use${info.modelName}Options } from './${info.modelName}Types';`
    )
    .join('\n');

  // Create hook interface properties
  const hookProperties = modelInfos
    .map(
      (info) =>
        `  ${info.modelName.charAt(0).toLowerCase() + info.modelName.slice(1)}: (options?: Use${info.modelName}Options) => ${info.modelName}HookApi;`
    )
    .join('\n');

  // Generate hook assignments
  const hookAssignments = modelInfos
    .map(
      (info) =>
        `  ${info.modelName.charAt(0).toLowerCase() + info.modelName.slice(1)}: ${HOOK_NAME_PREFIX}${info.modelName},`
    )
    .join('\n');

  // Generated content with all necessary imports
  const content = `// THIS FILE IS AUTO-GENERATED - DO NOT EDIT DIRECTLY
// Edit the generator script instead: scripts/generate-realtime-hooks.ts

${imports}
${typeImports}
export type { SuparismaOptions, SearchQuery, SearchState, FilterOperators } from './core';
${modelTypeExports}

/**
 * Interface for all Suparisma hooks with dot notation access.
 * This provides IntelliSense for all available models.
 * 
 * @example
 * // Access hooks for different models
 * const users = useSuparisma.user();
 * const posts = useSuparisma.post();
 */
export interface SuparismaHooks {
${hookProperties}
}

/**
 * Main Suparisma hook object with dot notation access to all model hooks.
 * 
 * @example
 * // Get hooks for different models
 * import useSuparisma from './hooks/generated';
 * 
 * // Access user model with all hook methods
 * const users = useSuparisma.user();
 * const { data, loading, error } = users;
 * 
 * // Create a new record
 * await users.create({ name: "John" });
 * 
 * // Delete a record
 * await users.delete({ id: "123" });
 * 
 * @example
 * // Use with filtering and options
 * const admins = useSuparisma.user({
 *   where: { role: 'admin' },
 *   orderBy: { created_at: 'desc' }
 * });
 */
const useSuparisma: SuparismaHooks = {
${hookAssignments}
};

export default useSuparisma;
`;

  const outputPath = path.join(OUTPUT_DIR, 'index.ts');
  fs.writeFileSync(outputPath, content);
  console.log(`Generated main module file at ${outputPath}`);
}
