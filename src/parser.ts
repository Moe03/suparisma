import fs from 'fs';
import { ModelInfo, FieldInfo, SearchFieldInfo } from './types';

/**
 * Parse Prisma schema to extract model information including search annotations
 */
export function parsePrismaSchema(schemaPath: string): ModelInfo[] {
  const schema = fs.readFileSync(schemaPath, 'utf-8');
  const modelRegex = /model\s+(\w+)\s+{([^}]*)}/gs;
  const models: ModelInfo[] = [];

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

    const lines = modelBody.split('\n');
    let lastFieldName = '';
    let lastFieldType = '';

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
        continue;
      }

      // Parse field definition - Updated to handle array types
      const fieldMatch = line.match(/\s*(\w+)\s+(\w+)(\[\])?\??(\?)?\s*(?:@[^)]+)?/);
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

        const isRelation =
          line.includes('@relation') ||
          (!!fieldName &&
            (fieldName.endsWith('_id') || fieldName === 'userId' || fieldName === 'user_id'));

        // Check for inline @enableSearch comment
        if (line.includes('// @enableSearch')) {
          searchFields.push({
            name: fieldName || '',
            type: baseFieldType || '',
          });
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
          });
        }
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

    models.push({
      name: modelName,
      mappedName: mappedName || '',
      fields,
      searchFields: searchFields.length > 0 ? searchFields : undefined,
    });
  }

  return models;
}
