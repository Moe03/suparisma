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

// Processed model info with additional metadata
export type ProcessedModelInfo = {
  modelName: string;
  tableName: string;
  hasCreatedAt: boolean;
  hasUpdatedAt: boolean;
  // All searchable fields
  searchFields?: string[];
  // Add default values map
  defaultValues?: Record<string, string>;
};
