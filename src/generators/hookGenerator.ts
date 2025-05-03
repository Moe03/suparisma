import fs from 'fs';
import path from 'path';
import { OUTPUT_DIR, HOOK_NAME_PREFIX } from '../config';
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
  const { modelName, tableName, hasCreatedAt, hasUpdatedAt, searchFields, defaultValues } =
    modelInfo;

  // Configure search fields if available
  const searchConfig =
    searchFields && searchFields.length > 0
      ? `,\n  // Configure search for fields with @enableSearch annotation\n  searchFields: ${JSON.stringify(searchFields)}`
      : '';

  // Add default values config if available
  const defaultValuesConfig = defaultValues
    ? `,\n  // Default values from schema\n  defaultValues: ${JSON.stringify(defaultValues)}`
    : '';

  // Generate the hook content
  const hookContent = `// THIS FILE IS AUTO-GENERATED - DO NOT EDIT DIRECTLY
// Edit the generator script instead: scripts/generate-realtime-hooks.ts

import { createSuparismaHook } from './core';
import type {
  ${modelName}WithRelations,
  ${modelName}CreateInput,
  ${modelName}UpdateInput,
  ${modelName}WhereInput,
  ${modelName}WhereUniqueInput,
  ${modelName}OrderByInput,
  ${modelName}HookApi,
  Use${modelName}Options
} from './${modelName}Types';

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
 *   orderBy: { created_at: 'desc' },
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
  hasUpdatedAt: ${hasUpdatedAt}${searchConfig}${defaultValuesConfig}
}) as (options?: Use${modelName}Options) => ${modelName}HookApi;
`;

  const outputPath = path.join(OUTPUT_DIR, `${HOOK_NAME_PREFIX}${modelName}.ts`);
  fs.writeFileSync(outputPath, hookContent);
  console.log(`Generated hook for ${modelName} at ${outputPath}`);
}
