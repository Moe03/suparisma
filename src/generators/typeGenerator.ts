import fs from 'fs';
import path from 'path';
import { OUTPUT_DIR } from '../config';
import { ModelInfo, ProcessedModelInfo, SearchQuery, SearchState } from '../types';

/**
 * Generate model-specific types for a model
 */
export function generateModelTypesFile(model: ModelInfo): ProcessedModelInfo {
  const modelName = model.name || '';
  const tableName = model.mappedName || modelName;

  // Identify foreign key fields (these end with _id)
  const foreignKeyFields = model.fields
    .filter((field) => field.name.endsWith('_id') || field.name === 'userId')
    .map((field) => field.name);

  // Identify relation object fields (these are relation fields but not foreign keys)
  const relationObjectFields = model.fields
    .filter((field) => field.isRelation && !foreignKeyFields.includes(field.name))
    .map((field) => field.name);

  // Fields that have default values (should be optional in CreateInput)
  const defaultValueFields = model.fields
    .filter((field) => field.hasDefaultValue)
    .map((field) => field.name);

  // Timestamps should be excluded completely
  const autoTimestampFields = model.fields
    .filter((field) => field.isCreatedAt || field.isUpdatedAt)
    .map((field) => field.name);

  // Collect default values into a map (will be passed to the hook)
  const defaultValues: Record<string, string> = {};
  model.fields
    .filter((field) => field.hasDefaultValue && field.defaultValue !== undefined)
    .forEach((field) => {
      defaultValues[field.name] = field.defaultValue!;
    });

  // Extract searchable fields from annotations
  const searchFields = model.searchFields?.map((field) => field.name) || [];

  // Create a manual property list for WithRelations interface
  const withRelationsProps = model.fields
    .filter(
      (field) =>
        !relationObjectFields.includes(field.name) && !foreignKeyFields.includes(field.name)
    )
    .map((field) => {
      const isOptional = field.isOptional;
      const type =
        field.type === 'Int'
          ? 'number'
          : field.type === 'Float'
            ? 'number'
            : field.type === 'Boolean'
              ? 'boolean'
              : 'string';
      return `  ${field.name}${isOptional ? '?' : ''}: ${type};`;
    });

  // Add foreign key fields
  foreignKeyFields.forEach((field) => {
    const fieldInfo = model.fields.find((f) => f.name === field);
    if (fieldInfo) {
      withRelationsProps.push(
        `  ${field}${fieldInfo.isOptional ? '?' : ''}: ${fieldInfo.type === 'Int' ? 'number' : 'string'};`
      );
    }
  });

  // Create a manual property list for CreateInput
  const createInputProps = model.fields
    .filter(
      (field) =>
        !relationObjectFields.includes(field.name) &&
        !autoTimestampFields.includes(field.name) &&
        !foreignKeyFields.includes(field.name)
    )
    .map((field) => {
      // Make fields with default values optional in CreateInput
      const isOptional = field.isOptional || defaultValueFields.includes(field.name);
      const type =
        field.type === 'Int'
          ? 'number'
          : field.type === 'Float'
            ? 'number'
            : field.type === 'Boolean'
              ? 'boolean'
              : 'string';
      return `  ${field.name}${isOptional ? '?' : ''}: ${type};`;
    });

  // Add foreign key fields to CreateInput
  foreignKeyFields.forEach((field) => {
    const fieldInfo = model.fields.find((f) => f.name === field);
    if (fieldInfo) {
      // Make foreign key fields with default values optional
      const isOptional = fieldInfo.isOptional || defaultValueFields.includes(field);
      createInputProps.push(
        `  ${field}${isOptional ? '?' : ''}: ${fieldInfo.type === 'Int' ? 'number' : 'string'};`
      );
    }
  });

  // Generate the type content with TSDoc comments
  const typeContent = `// THIS FILE IS AUTO-GENERATED - DO NOT EDIT DIRECTLY
// Edit the generator script instead

import type { ${modelName} } from '@prisma/client';
import type { ModelResult, SuparismaOptions, SearchQuery, SearchState } from './core';

/**
 * Extended ${modelName} type that includes relation fields.
 * This represents the complete shape of ${modelName} records returned from the database.
 */
export interface ${modelName}WithRelations {
${withRelationsProps.join('\n')}
}

/**
 * Input type for creating a new ${modelName} record.
 * Fields with default values are optional and will be filled automatically if not provided.
 * 
 * @example
 * // Create a minimal ${modelName.toLowerCase()}
 * ${modelName.toLowerCase()}.create({
 *   // Required fields only
${createInputProps
  .filter((p) => !p.includes('?'))
  .slice(0, 2)
  .map((p) => ' *   ' + p.trim().replace(';', ','))
  .join('\n')}
 * });
 * 
 * @example
 * // Create with optional fields
 * ${modelName.toLowerCase()}.create({
 *   // All fields including optional ones
${createInputProps
  .slice(0, 3)
  .map((p) => ' *   ' + p.trim().replace(';', ','))
  .join('\n')}
 * });
 */
export interface ${modelName}CreateInput {
${createInputProps.join('\n')}
}

/**
 * Input type for updating an existing ${modelName} record.
 * All fields are optional since you only need to specify the fields you want to change.
 * 
 * @example
 * // Update a ${modelName.toLowerCase()}'s fields
 * ${modelName.toLowerCase()}.update({
 *   where: { id: "123" },
 *   data: {
${createInputProps
  .slice(0, 2)
  .map((p) => ' *     ' + p.trim().replace(';', ','))
  .join('\n')}
 *   }
 * });
 */
export type ${modelName}UpdateInput = Partial<${modelName}CreateInput>;

/**
 * Filter type for querying ${modelName} records.
 * You can filter by any field in the model using equality or advanced filter operators.
 * 
 * @example
 * // Basic filtering
 * ${modelName.toLowerCase()}.findMany({
 *   where: {
${withRelationsProps
  .slice(0, 2)
  .map((p) => {
    const field = p.trim().split(':')[0].trim();
    return ` *     ${field}: "value"`;
  })
  .join(',\n')}
 *   }
 * });
 * 
 * @example
 * // Advanced filtering
 * ${modelName.toLowerCase()}.findMany({
 *   where: {
 *     // Use advanced operators
${withRelationsProps
  .slice(0, 1)
  .map((p) => {
    const field = p.trim().split(':')[0].trim();
    return ` *     ${field}: { contains: "partial" }`;
  })
  .join(',\n')}
 *   }
 * });
 */
export type ${modelName}WhereInput = Partial<${modelName}WithRelations>;

/**
 * Unique identifier for finding a specific ${modelName} record.
 * Usually uses the ID field but can be any field marked as @unique in the schema.
 * 
 * @example
 * // Find by ID
 * ${modelName.toLowerCase()}.findUnique({ id: "123" });
 * 
 * @example
 * // Delete by ID
 * ${modelName.toLowerCase()}.delete({ id: "123" });
 */
export type ${modelName}WhereUniqueInput = { 
  ${model.fields
    .filter((field) => field.isId)
    .map((field) => {
      return `${field.name}${field.isOptional ? '?' : ''}: ${field.type === 'Int' ? 'number' : 'string'};`;
    })
    .join('\n  ')}
};

/**
 * Sort options for ${modelName} queries.
 * Specify the field to sort by and the direction ('asc' or 'desc').
 * 
 * @example
 * // Sort by creation date, newest first
 * ${modelName.toLowerCase()}.findMany({
 *   orderBy: { created_at: 'desc' }
 * });
 * 
 * @example
 * // Sort alphabetically
 * ${modelName.toLowerCase()}.findMany({
 *   orderBy: { name: 'asc' }
 * });
 */
export type ${modelName}OrderByInput = {
  [key in keyof ${modelName}WithRelations]?: 'asc' | 'desc';
};

/**
 * Result type for operations that return a single ${modelName} record.
 */
export type ${modelName}SingleResult = ModelResult<${modelName}WithRelations>;

/**
 * Result type for operations that return multiple ${modelName} records.
 */
export type ${modelName}ManyResult = ModelResult<${modelName}WithRelations[]>;

/**
 * Configuration options for the ${modelName} hook.
 */
export type Use${modelName}Options = SuparismaOptions<${modelName}WhereInput, ${modelName}OrderByInput>;

/**
 * The complete API for interacting with ${modelName} records.
 * This interface defines all available operations and state properties.
 */
export interface ${modelName}HookApi {
  /**
   * Current array of ${modelName} records.
   * This is automatically updated when:
   * - The initial data is loaded
   * - Mutations are performed (create, update, delete)
   * - Real-time updates are received from other clients
   * - The refresh method is called
   * 
   * @example
   * // Render a list of ${modelName.toLowerCase()} records
   * const { data } = ${modelName.toLowerCase()};
   * return (
   *   <ul>
   *     {data.map(item => (
   *       <li key={item.id}>{item.name}</li>
   *     ))}
   *   </ul>
   * );
   */
  data: ${modelName}WithRelations[];
  
  /**
   * Error object if the last operation failed, null otherwise.
   * 
   * @example
   * // Handle potential errors
   * const { error } = ${modelName.toLowerCase()};
   * if (error) {
   *   return <div>Error: {error.message}</div>;
   * }
   */
  error: Error | null;
  
  /**
   * Boolean indicating if an operation is in progress.
   * 
   * @example
   * // Show loading state
   * const { loading } = ${modelName.toLowerCase()};
   * if (loading) {
   *   return <div>Loading...</div>;
   * }
   */
  loading: boolean;
  
  ${
    searchFields.length > 0
      ? `/**
   * Search functionality for ${modelName} records.
   * Only available for models with @enableSearch fields.
   * 
   * @example
   * // Search for records containing a term
   * ${modelName.toLowerCase()}.search.addQuery({ field: "name", value: "smith" });
   * 
   * @example
   * // Clear search and return to normal data
   * ${modelName.toLowerCase()}.search.clearQueries();
   */
  search: SearchState;`
      : ''
  }
  
  /**
   * Find a single ${modelName} record by its unique identifier.
   * 
   * @param where - The unique identifier to find the record by
   * @returns A promise with the found record or error
   * 
   * @example
   * // Find ${modelName.toLowerCase()} by ID
   * const result = await ${modelName.toLowerCase()}.findUnique({ id: "123" });
   * if (result.data) {
   *   console.log("Found ${modelName.toLowerCase()}:", result.data);
   * }
   */
  findUnique: (where: ${modelName}WhereUniqueInput) => ${modelName}SingleResult;
  
  /**
   * Find multiple ${modelName} records matching the filter criteria.
   * Supports filtering, sorting, and pagination.
   * 
   * @param params - Optional query parameters
   * @returns A promise with the matching records or error
   * 
   * @example
   * // Get all ${modelName.toLowerCase()} records
   * const result = await ${modelName.toLowerCase()}.findMany();
   * 
   * @example
   * // Filter and sort records
   * const result = await ${modelName.toLowerCase()}.findMany({
   *   where: { active: true },
   *   orderBy: { created_at: 'desc' },
   *   take: 10,
   *   skip: 0
   * });
   */
  findMany: (params?: {
    where?: ${modelName}WhereInput;
    orderBy?: ${modelName}OrderByInput;
    take?: number;
    skip?: number;
  }) => ${modelName}ManyResult;
  
  /**
   * Find the first ${modelName} record matching the filter criteria.
   * 
   * @param params - Optional query parameters
   * @returns A promise with the first matching record or error
   * 
   * @example
   * // Find the first active ${modelName.toLowerCase()}
   * const result = await ${modelName.toLowerCase()}.findFirst({
   *   where: { active: true }
   * });
   * 
   * @example
   * // Find the oldest ${modelName.toLowerCase()}
   * const result = await ${modelName.toLowerCase()}.findFirst({
   *   orderBy: { created_at: 'asc' }
   * });
   */
  findFirst: (params?: {
    where?: ${modelName}WhereInput;
    orderBy?: ${modelName}OrderByInput;
  }) => ${modelName}SingleResult;
  
  /**
   * Create a new ${modelName} record.
   * Fields with default values are optional and will use their defaults if not provided.
   * 
   * @param data - The data for the new record
   * @returns A promise with the created record or error
   * 
   * @example
   * // Create a new ${modelName.toLowerCase()}
   * const result = await ${modelName.toLowerCase()}.create({
${createInputProps
  .filter((p) => !p.includes('?'))
  .slice(0, 2)
  .map((p) => {
    const field = p.trim().split(':')[0].trim();
    const type = p.includes('number') ? 42 : p.includes('boolean') ? 'true' : '"value"';
    return `   *   ${field}: ${type}`;
  })
  .join(',\n')}
   * });
   * 
   * @example
   * // Create with custom ID (overriding default)
   * const result = await ${modelName.toLowerCase()}.create({
   *   id: "custom-id",
${createInputProps
  .filter((p) => !p.includes('?'))
  .slice(0, 1)
  .map((p) => {
    const field = p.trim().split(':')[0].trim();
    if (field === 'id') return '';
    const type = p.includes('number') ? 42 : p.includes('boolean') ? 'true' : '"value"';
    return `   *   ${field}: ${type}`;
  })
  .join(',\n')}
   * });
   */
  create: (data: ${modelName}CreateInput) => ${modelName}SingleResult;
  
  /**
   * Update an existing ${modelName} record.
   * 
   * @param params - Object with the record identifier and fields to update
   * @returns A promise with the updated record or error
   * 
   * @example
   * // Update a ${modelName.toLowerCase()}'s fields
   * const result = await ${modelName.toLowerCase()}.update({
   *   where: { id: "123" },
   *   data: {
${createInputProps
  .slice(0, 2)
  .map((p) => {
    const field = p.trim().split(':')[0].trim();
    if (field === 'id') return '';
    const type = p.includes('number') ? 42 : p.includes('boolean') ? 'true' : '"updated value"';
    return `   *     ${field}: ${type}`;
  })
  .filter(Boolean)
  .join(',\n')}
   *   }
   * });
   */
  update: (params: {
    where: ${modelName}WhereUniqueInput;
    data: ${modelName}UpdateInput;
  }) => ${modelName}SingleResult;
  
  /**
   * Delete a ${modelName} record by its unique identifier.
   * 
   * @param where - The unique identifier of the record to delete
   * @returns A promise with the deleted record or error
   * 
   * @example
   * // Delete a ${modelName.toLowerCase()} by ID
   * const result = await ${modelName.toLowerCase()}.delete({ id: "123" });
   * if (result.data) {
   *   console.log("Deleted ${modelName.toLowerCase()}:", result.data);
   * }
   */
  delete: (where: ${modelName}WhereUniqueInput) => ${modelName}SingleResult;
  
  /**
   * Delete multiple ${modelName} records matching the filter criteria.
   * 
   * @param params - Optional filter parameters
   * @returns A promise with the count of deleted records or error
   * 
   * @example
   * // Delete all inactive ${modelName.toLowerCase()} records
   * const result = await ${modelName.toLowerCase()}.deleteMany({
   *   where: { active: false }
   * });
   * console.log(\`Deleted \${result.count} records\`);
   * 
   * @example
   * // Delete all ${modelName.toLowerCase()} records (use with caution!)
   * const result = await ${modelName.toLowerCase()}.deleteMany();
   */
  deleteMany: (params?: {
    where?: ${modelName}WhereInput;
  }) => Promise<{ count: number; error: Error | null }>;
  
  /**
   * Create a record if it doesn't exist, or update it if it does.
   * 
   * @param params - Object with the identifier, update data, and create data
   * @returns A promise with the created or updated record or error
   * 
   * @example
   * // Upsert a ${modelName.toLowerCase()} by ID
   * const result = await ${modelName.toLowerCase()}.upsert({
   *   where: { id: "123" },
   *   update: { name: "Updated Name" },
   *   create: {
   *     id: "123",
   *     name: "New Name"${createInputProps.filter((p) => !p.includes('?') && !p.includes('id') && !p.includes('name')).length > 0 ? ',' : ''}
${createInputProps
  .filter((p) => !p.includes('?') && !p.includes('id') && !p.includes('name'))
  .slice(0, 1)
  .map((p) => {
    const field = p.trim().split(':')[0].trim();
    const type = p.includes('number') ? 42 : p.includes('boolean') ? 'true' : '"value"';
    return `   *     ${field}: ${type}`;
  })
  .join(',\n')}
   *   }
   * });
   */
  upsert: (params: {
    where: ${modelName}WhereUniqueInput;
    update: ${modelName}UpdateInput;
    create: ${modelName}CreateInput;
  }) => ${modelName}SingleResult;
  
  /**
   * Count the number of ${modelName} records matching the filter criteria.
   * 
   * @param params - Optional filter parameters
   * @returns A promise with the count of matching records
   * 
   * @example
   * // Count all ${modelName.toLowerCase()} records
   * const count = await ${modelName.toLowerCase()}.count();
   * 
   * @example
   * // Count active ${modelName.toLowerCase()} records
   * const activeCount = await ${modelName.toLowerCase()}.count({
   *   where: { active: true }
   * });
   */
  count: (params?: {
    where?: ${modelName}WhereInput;
  }) => Promise<number>;
  
  /**
   * Manually refresh the data with current filter settings.
   * Useful after external operations or when realtime is disabled.
   * 
   * @param params - Optional override parameters for this specific refresh
   * @returns A promise with the refreshed data or error
   * 
   * @example
   * // Refresh with current filter settings
   * await ${modelName.toLowerCase()}.refresh();
   * 
   * @example
   * // Refresh with different filters for this call only
   * await ${modelName.toLowerCase()}.refresh({
   *   where: { active: true },
   *   orderBy: { name: 'asc' }
   * });
   */
  refresh: (params?: {
    where?: ${modelName}WhereInput;
    orderBy?: ${modelName}OrderByInput;
    take?: number;
    skip?: number;
  }) => ${modelName}ManyResult;
}`;

  const outputPath = path.join(OUTPUT_DIR, `${modelName}Types.ts`);
  fs.writeFileSync(outputPath, typeContent);
  console.log(`Generated type definitions for ${modelName} at ${outputPath}`);

  return {
    modelName,
    tableName,
    hasCreatedAt: model.fields.some((field) => field.isCreatedAt),
    hasUpdatedAt: model.fields.some((field) => field.isUpdatedAt),
    searchFields,
    defaultValues: Object.keys(defaultValues).length > 0 ? defaultValues : undefined,
  };
}
