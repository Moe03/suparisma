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
};

// Search field information
export type SearchFieldInfo = {
  name: string;
  type: string;
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
}
