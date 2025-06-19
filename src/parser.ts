import fs from 'fs';
import { ModelInfo, FieldInfo, SearchFieldInfo, ZodImportInfo } from './types';

/**
 * Parse zod directive from comment
 * Supports formats like:
 * /// @zod.custom.use(z.string().refine(...))
 * /// @zod.string.min(3).max(10)
 */
function parseZodDirective(comment: string): string | undefined {
  // Remove leading /// and whitespace
  const cleanComment = comment.replace(/^\/\/\/?\s*/, '').trim();
  
  // Look for @zod.custom.use() format
  const customUseMatch = cleanComment.match(/@zod\.custom\.use\((.+)\)$/);
  if (customUseMatch) {
    return customUseMatch[1].trim();
  }
  
  // Look for other @zod patterns like @zod.string.min(3)
  const zodMatch = cleanComment.match(/@zod\.(.+)$/);
  if (zodMatch) {
    const zodChain = zodMatch[1].trim();
    // Convert to actual zod syntax - this is a basic implementation
    // For more complex cases, you might want to build a more sophisticated parser
    return `z.${zodChain}`;
  }
  
  return undefined;
}

/**
 * Parse zod import from comment
 * Supports format like:
 * /// @zod.import(["import { LLMNodeSchema } from '../commonTypes'"])
 */
function parseZodImport(comment: string): ZodImportInfo[] {
  const cleanComment = comment.replace(/^\/\/\/?\s*/, '').trim();
  
  // Look for @zod.import([...]) format
  const importMatch = cleanComment.match(/@zod\.import\(\[(.*)\]\)/);
  if (!importMatch) {
    return [];
  }
  
  const importsString = importMatch[1];
  const imports: ZodImportInfo[] = [];
  
  // Parse individual import statements within the array
  // Handle nested quotes properly - look for quoted strings that start with "import"
  const importRegex = /"(import\s+[^"]+)"|'(import\s+[^']+)'/g;
  let match;
  
  while ((match = importRegex.exec(importsString)) !== null) {
    // Get the import statement from either the double-quoted or single-quoted group
    const importStatement = match[1] || match[2];
    
    // Extract types from import statement
    // e.g., "import { LLMNodeSchema, AnotherType } from '../commonTypes'"
    const typeMatch = importStatement.match(/import\s+{\s*([^}]+)\s*}\s+from/);
    const types: string[] = [];
    
    if (typeMatch) {
      // Split by comma and clean up whitespace
      types.push(...typeMatch[1].split(',').map(t => t.trim()));
    }
    
    imports.push({
      importStatement,
      types
    });
  }
  
  return imports;
}

/**
 * Parse Prisma schema to extract model information including search annotations and zod directives
 */
export function parsePrismaSchema(schemaPath: string): ModelInfo[] {
  const schema = fs.readFileSync(schemaPath, 'utf-8');
  const modelRegex = /model\s+(\w+)\s+{([^}]*)}/gs;
  const models: ModelInfo[] = [];

  // Extract enum names from the schema
  const enumRegex = /enum\s+(\w+)\s+{[^}]*}/gs;
  const enumNames: string[] = [];
  let enumMatch;
  while ((enumMatch = enumRegex.exec(schema)) !== null) {
    const enumName = enumMatch[1];
    if (enumName) {
      enumNames.push(enumName);
    }
  }

  let match;
  while ((match = modelRegex.exec(schema)) !== null) {
    const modelName = match[1] || '';
    const modelBody = match[2] || '';

    // Extract custom table name if provided with @@map
    const mapMatch = modelBody.match(/@@map\("([^"]+)"\)/);
    const mappedName = mapMatch ? mapMatch[1] : modelName;

    // Extract field info
    const fields: FieldInfo[] = [];
    // Track fields with @enableSearch annotation
    const searchFields: SearchFieldInfo[] = [];
    // Track zod imports at model level
    const zodImports: ZodImportInfo[] = [];

    const lines = modelBody.split('\n');
    let lastFieldName = '';
    let lastFieldType = '';
    let pendingZodDirective: string | undefined;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]?.trim();

      // Skip blank lines and non-field lines
      if (!line || line.startsWith('@@')) {
        continue;
      }

      // Check for standalone @enableSearch comment
      if (line === '// @enableSearch' && lastFieldName) {
        searchFields.push({
          name: lastFieldName,
          type: lastFieldType,
        });
        continue;
      }

      // Check if line is a comment
      if (line.startsWith('//')) {
        // Parse zod directives from comments
        const zodDirective = parseZodDirective(line);
        if (zodDirective) {
          pendingZodDirective = zodDirective;
        }
        
        // Parse zod imports from comments
        const zodImportInfos = parseZodImport(line);
        zodImports.push(...zodImportInfos);
        
        continue;
      }

      // Parse field definition - Updated to handle array types
      const fieldMatch = line.match(/\s*(\w+)\s+(\w+)(\[\])?(\?)?\s*(?:@[^)]+)?/);
      if (fieldMatch) {
        const fieldName = fieldMatch[1];
        const baseFieldType = fieldMatch[2]; // e.g., "String" from "String[]"
        const isArray = !!fieldMatch[3]; // [] makes it an array
        const isOptional = !!fieldMatch[4]; // ? makes it optional

        // Store for potential standalone @enableSearch comment
        lastFieldName = fieldName || '';
        lastFieldType = baseFieldType || '';

        // Detect special fields
        const isId = line.includes('@id');
        const isCreatedAt = fieldName === 'created_at' || fieldName === 'createdAt';
        const isUpdatedAt = fieldName === 'updated_at' || fieldName === 'updatedAt';
        const hasDefaultValue = line.includes('@default');

        // Extract default value if present
        let defaultValue;
        if (hasDefaultValue) {
          const defaultMatch = line.match(/@default\(\s*(.+?)\s*\)/);
          if (defaultMatch) {
            defaultValue = defaultMatch[1];
          }
        }

        // Improved relation detection
        const primitiveTypes = ['String', 'Int', 'Float', 'Boolean', 'DateTime', 'Json', 'Bytes', 'Decimal', 'BigInt'];
        const isRelation =
          line.includes('@relation') ||
          (!!fieldName &&
            (fieldName.endsWith('_id') || fieldName === 'userId' || fieldName === 'user_id')) ||
          // Also detect relation fields by checking if the type is not a primitive type and not an enum
          (!!baseFieldType && !primitiveTypes.includes(baseFieldType) && !enumNames.includes(baseFieldType));

        // Check for inline @enableSearch comment
        if (line.includes('// @enableSearch')) {
          searchFields.push({
            name: fieldName || '',
            type: baseFieldType || '',
          });
        }

        // Check for inline zod directive
        let fieldZodDirective = pendingZodDirective;
        if (line.includes('/// @zod.')) {
          const inlineZodDirective = parseZodDirective(line);
          if (inlineZodDirective) {
            fieldZodDirective = inlineZodDirective;
          }
        }

        if (fieldName && baseFieldType) {
          fields.push({
            name: fieldName,
            type: baseFieldType, // Store the base type (String, not String[])
            isRequired: false,
            isOptional,
            isId,
            isUnique: false,
            isUpdatedAt,
            isCreatedAt,
            hasDefaultValue,
            defaultValue, // Add the extracted default value
            isRelation,
            isList: isArray, // Add the isList property
            zodDirective: fieldZodDirective, // Add zod directive
          });
        }

        // Clear pending zod directive after using it
        pendingZodDirective = undefined;
      }
    }

    // Check for model-level @enableSearch before the model definition
    if (schema.includes(`// @enableSearch\nmodel ${modelName}`)) {
      // Add all string fields as searchable
      fields.forEach((field) => {
        if (
          field.type.toLowerCase() === 'string' &&
          !searchFields.some((sf) => sf.name === field.name)
        ) {
          searchFields.push({
            name: field.name,
            type: field.type,
          });
        }
      });
    }

    // Also check for model-level zod imports before the model definition
    const modelStartIndex = schema.indexOf(`model ${modelName}`);
    if (modelStartIndex !== -1) {
      // Look backwards for any /// @zod.import directives before this model
      const beforeModel = schema.substring(0, modelStartIndex);
      const lines = beforeModel.split('\n').reverse(); // Start from model and go backwards
      
      for (const line of lines) {
        const trimmedLine = line.trim();
        if (trimmedLine.startsWith('///') && trimmedLine.includes('@zod.import')) {
          const modelLevelImports = parseZodImport(trimmedLine);
          zodImports.push(...modelLevelImports);
        } else if (trimmedLine && !trimmedLine.startsWith('///') && !trimmedLine.startsWith('//')) {
          // Stop if we hit a non-comment line (another model or other content)
          break;
        }
      }
    }

    models.push({
      name: modelName,
      mappedName: mappedName || '',
      fields,
      searchFields: searchFields.length > 0 ? searchFields : undefined,
      zodImports: zodImports.length > 0 ? zodImports : undefined,
    });
  }

  return models;
}
