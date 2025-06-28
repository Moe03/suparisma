// Define field types and metadata
export type FieldInfo = {
  name: string;
  type: string;
  isRequired: boolean;
  isOptional: boolean;
  isId: boolean;
  isUnique: boolean;
  isUpdatedAt: boolean;
  isCreatedAt: boolean;
  hasDefaultValue: boolean;
  defaultValue?: string; // Added to track the actual default value
  isRelation: boolean;
  isList?: boolean;
  // Add zod directive support
  zodDirective?: string; // e.g., "z.string().min(3)" or "z.array(LLMNodeSchema).nullable()"
};

// Composite ID information
export type CompositeIdInfo = {
  fields: string[]; // Array of field names that make up the composite ID
};

// Search field information
export type SearchFieldInfo = {
  name: string;
  type: string;
};

// Zod import information
export type ZodImportInfo = {
  importStatement: string; // e.g., "import { LLMNodeSchema } from '../commonTypes'"
  types: string[]; // e.g., ["LLMNodeSchema"] - extracted type names for reference
};

// Search query type
export type SearchQuery = {
  field: string;
  value: string;
};

// Complete search state
export type SearchState = {
  queries: SearchQuery[];
  loading: boolean;
  setQueries: (queries: SearchQuery[]) => void;
  addQuery: (query: SearchQuery) => void;
  removeQuery: (field: string) => void;
  clearQueries: () => void;
};

// Model information
export type ModelInfo = {
  name: string;
  mappedName: string;
  fields: FieldInfo[];
  // Fields marked with @enableSearch annotation
  searchFields?: SearchFieldInfo[];
  // Add zod import support at model level
  zodImports?: ZodImportInfo[];
  // Add composite ID support
  compositeId?: CompositeIdInfo;
};

/**
 * Processed information about a model that has been parsed
 */
export interface ProcessedModelInfo {
  modelName: string;
  tableName: string;
  hasCreatedAt: boolean;
  hasUpdatedAt: boolean;
  searchFields?: string[];
  defaultValues?: Record<string, string>;
  createdAtField?: string; // Add field name for createdAt
  updatedAtField?: string; // Add field name for updatedAt
  // Add zod import support for processed models
  zodImports?: ZodImportInfo[];
  // Add composite ID support for processed models
  compositeId?: CompositeIdInfo;
}
