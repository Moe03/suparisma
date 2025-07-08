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
  const modelRegex = /model\s+(\w+)\s+{([^}]*)}/g;
  const models: ModelInfo[] = [];

  // Extract enum names from the schema
  const enumRegex = /enum\s+(\w+)\s+{[^}]*}/g;
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

    // Use EXACT same logic as analyzePrismaSchema for consistency
    const bodyLines = modelBody.trim().split('\n');
    let nextFieldShouldBeSearchable = false;
    let pendingZodDirective: string | undefined;
    
    for (let i = 0; i < bodyLines.length; i++) {
      const currentLine = bodyLines[i]?.trim();

      // Skip blank lines and non-field lines
      if (!currentLine || currentLine.startsWith('@@')) {
        continue;
      }

      // Check for /// @enableSearch directive (applies to NEXT field)
      if (currentLine === '/// @enableSearch') {
        nextFieldShouldBeSearchable = true;
        continue;
      }

      // Check for standalone // @enableSearch comment (applies to NEXT field)
      if (currentLine === '// @enableSearch') {
        nextFieldShouldBeSearchable = true;
        continue;
      }

             // Check if line is a comment - SKIP ALL TYPES of comments but keep search flag
       if (currentLine.startsWith('///') || currentLine.startsWith('//')) {
        // Parse zod directives from comments
        const zodDirective = parseZodDirective(currentLine);
        if (zodDirective) {
          pendingZodDirective = zodDirective;
        }
        
        // Parse zod imports from comments
        const zodImportInfos = parseZodImport(currentLine);
        zodImports.push(...zodImportInfos);
        
        continue;
      }

      // Parse field definition - Updated to handle array types and inline comments  
      const fieldMatch = currentLine.match(/^\s*(\w+)\s+(\w+)(\[\])?(\?)?\s*/);
      if (fieldMatch) {
        const fieldName = fieldMatch[1];
        const baseFieldType = fieldMatch[2];

        // Check if this field should be searchable due to @enableSearch directive
        if (nextFieldShouldBeSearchable && fieldName && baseFieldType) {
          searchFields.push({
            name: fieldName,
            type: baseFieldType,
          });
          nextFieldShouldBeSearchable = false; // Reset flag
        }

        // Check for inline // @enableSearch comment
        if (currentLine.includes('// @enableSearch')) {
          if (fieldName && baseFieldType && !searchFields.some(f => f.name === fieldName)) {
            searchFields.push({
              name: fieldName,
              type: baseFieldType,
            });
          }
        }

        // Continue with field processing for the fields array
        const isArray = !!fieldMatch[3]; // [] makes it an array
        const isOptional = !!fieldMatch[4]; // ? makes it optional

        // Detect special fields
        const isId = currentLine.includes('@id');
        const isCreatedAt = fieldName === 'created_at' || fieldName === 'createdAt';
        const isUpdatedAt = fieldName === 'updated_at' || fieldName === 'updatedAt';
        const hasDefaultValue = currentLine.includes('@default');

        // Extract default value if present
        let defaultValue;
        if (hasDefaultValue) {
          const defaultMatch = currentLine.match(/@default\(\s*(.+?)\s*\)/);
          if (defaultMatch) {
            defaultValue = defaultMatch[1];
          }
        }

        // Improved relation detection
        const primitiveTypes = ['String', 'Int', 'Float', 'Boolean', 'DateTime', 'Json', 'Bytes', 'Decimal', 'BigInt'];
        const isRelation =
          currentLine.includes('@relation') ||
          (!!fieldName &&
            (fieldName.endsWith('_id') || fieldName === 'userId' || fieldName === 'user_id')) ||
          // Also detect relation fields by checking if the type is not a primitive type and not an enum
          (!!baseFieldType && !primitiveTypes.includes(baseFieldType) && !enumNames.includes(baseFieldType));

        // Check for inline zod directive
        let fieldZodDirective = pendingZodDirective;
        if (currentLine.includes('/// @zod.')) {
          const inlineZodDirective = parseZodDirective(currentLine);
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
