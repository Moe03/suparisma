import fs from 'fs';
import path from 'path';
import { HOOKS_DIR, HOOK_NAME_PREFIX } from '../config';
import { ProcessedModelInfo } from '../types';

/**
 * Generate model-specific hook for a model
 *
 * This generates a standalone hook file for each model that uses the core
 * hook factory to create a type-safe hook for that model.
 *
 * @param modelInfo - Processed model information with metadata
 */
export function generateModelHookFile(modelInfo: ProcessedModelInfo): void {
  const { 
    modelName, 
    tableName, 
    hasCreatedAt, 
    hasUpdatedAt, 
    searchFields, 
    defaultValues,
    createdAtField = 'createdAt', // Default to camelCase but use actual field name if provided
    updatedAtField = 'updatedAt'  // Default to camelCase but use actual field name if provided
  } = modelInfo;

  // Configure search fields if available
  const searchConfig =
    searchFields && searchFields.length > 0
      ? `,\n  // Configure search for fields with @enableSearch annotation\n  searchFields: ${JSON.stringify(searchFields)}`
      : '';

  // Add default values config if available
  const defaultValuesConfig = defaultValues
    ? `,\n  // Default values from schema\n  defaultValues: ${JSON.stringify(defaultValues)}`
    : '';

  // Add createdAt/updatedAt field name config
  const fieldNamesConfig = 
    `${hasCreatedAt ? `,\n  // Field name for createdAt from Prisma schema\n  createdAtField: "${createdAtField}"` : ''}${hasUpdatedAt ? `,\n  // Field name for updatedAt from Prisma schema\n  updatedAtField: "${updatedAtField}"` : ''}`;

  // Generate the hook content
  const hookContent = `// THIS FILE IS AUTO-GENERATED - DO NOT EDIT DIRECTLY
// Edit the generator script instead: scripts/generate-realtime-hooks.ts

// Corrected import for core hook factory
import { createSuparismaHook } from '../utils/core';
import type {
  ${modelName}WithRelations,
  ${modelName}CreateInput,
  ${modelName}UpdateInput,
  ${modelName}WhereInput,
  ${modelName}WhereUniqueInput,
  ${modelName}OrderByInput,
  ${modelName}HookApi,
  Use${modelName}Options
} from '../types/${modelName}Types';

/**
 * A Prisma-like hook for interacting with ${modelName} records with real-time capabilities.
 * 
 * This hook provides CRUD operations, real-time updates, and search functionality.
 *
 * @param options - Optional configuration options for the hook
 * @returns An object with data state and methods for interacting with ${modelName} records
 * 
 * @example
 * // Basic usage - get all ${modelName} records with realtime updates
 * const ${modelName.toLowerCase()} = ${HOOK_NAME_PREFIX}${modelName}();
 * const { data, loading, error } = ${modelName.toLowerCase()};
 * 
 * @example
 * // With filtering and ordering
 * const ${modelName.toLowerCase()} = ${HOOK_NAME_PREFIX}${modelName}({
 *   where: { active: true },
 *   orderBy: { createdAt: 'desc' }, // Note: Using actual Prisma field name
 *   limit: 10
 * });
 * 
 * @example
 * // Create a new record
 * const result = await ${modelName.toLowerCase()}.create({
 *   name: "Example Name",
 *   // other fields...
 * });
 * 
 * @example
 * // Update a record
 * const result = await ${modelName.toLowerCase()}.update({
 *   where: { id: "123" },
 *   data: { name: "Updated Name" }
 * });
 * 
 * @example
 * // Delete a record
 * const result = await ${modelName.toLowerCase()}.delete({ id: "123" });
 * 
 * @example
 * // Find records with specific criteria
 * const result = await ${modelName.toLowerCase()}.findMany({
 *   where: { // filters },
 *   orderBy: { // ordering },
 *   take: 20 // limit
 * });
 */
export const ${HOOK_NAME_PREFIX}${modelName} = createSuparismaHook<
  ${modelName}WithRelations,
  ${modelName}WithRelations,
  ${modelName}CreateInput,
  ${modelName}UpdateInput,
  ${modelName}WhereInput,
  ${modelName}WhereUniqueInput,
  ${modelName}OrderByInput
>({
  tableName: '${tableName}',
  hasCreatedAt: ${hasCreatedAt},
  hasUpdatedAt: ${hasUpdatedAt}${searchConfig}${defaultValuesConfig}${fieldNamesConfig}
}) as unknown as (options?: Use${modelName}Options) => ${modelName}HookApi;
`;

  // Output to the HOOKS_DIR
  const outputPath = path.join(HOOKS_DIR, `${HOOK_NAME_PREFIX}${modelName}.ts`);
  
  if (!fs.existsSync(HOOKS_DIR)) {
    fs.mkdirSync(HOOKS_DIR, { recursive: true });
  }

  fs.writeFileSync(outputPath, hookContent);
  console.log(`Generated hook for ${modelName} at ${outputPath}`);
}
