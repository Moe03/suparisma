#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import * as dotenv from 'dotenv';
dotenv.config();

// Import configuration
import { PRISMA_SCHEMA_PATH, OUTPUT_DIR, TYPES_DIR, HOOKS_DIR, UTILS_DIR } from './config';

// Import type definitions
import { ProcessedModelInfo } from './types';

// Import parsers and generators
import { parsePrismaSchema } from './parser';
import { generateCoreFile } from './generators/coreGenerator';
import { generateModelTypesFile } from './generators/typeGenerator';
import { generateModelHookFile } from './generators/hookGenerator';
import { generateMainIndexFile } from './generators/indexGenerator';
import { generateSupabaseClientFile } from './generators/supabaseClientGenerator';

/**
 * Prints the help message showing available commands
 */
function printHelp() {
  console.log(`
Suparisma - Typesafe React realtime CRUD hooks generator for Supabase, powered by Prisma.

Usage:
  npx suparisma <command>

Commands:
  generate    Generate hooks based on your Prisma schema (runs in current directory)
  help        Show this help message

Example:
  npx suparisma generate
  `);
}

/**
 * Checks for essential environment variables and throws an error if any are missing.
 */
function checkEnvironmentVariables() {
  const requiredEnvVars = [
    'DATABASE_URL',
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  ];
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

  if (missingVars.length > 0) {
    let errorMessage = 'Error: Missing required environment variables:\n';
    missingVars.forEach(varName => {
      errorMessage += `- ${varName}: This variable is essential for the generator to function correctly. `;      
      if (varName === 'DATABASE_URL') {
        errorMessage += 'It is used by Prisma to connect to your database. Please ensure it is set in your .env file or as an environment variable (e.g., postgresql://user:password@host:port/database).\n';
      } else if (varName === 'NEXT_PUBLIC_SUPABASE_URL') {
        errorMessage += 'This is your Supabase project URL. It is required by the Supabase client. Please set it in your .env file or as an environment variable (e.g., https://your-project-id.supabase.co).\n';
      } else if (varName === 'NEXT_PUBLIC_SUPABASE_ANON_KEY') {
        errorMessage += 'This is your Supabase project public anonymous key. It is required by the Supabase client. Please set it in your .env file or as an environment variable.\n';
      }
    });
    errorMessage += '\nPlease add these variables to your .env file or ensure they are available in your environment and try again.';
    throw new Error(errorMessage);
  }
  console.log('✅ All required environment variables are set.');
}

/**
 * Extracts comments from a Prisma schema
 * Looks for // @disableRealtime (to opt out) and // @enableSearch
 */
interface ModelInfo {
  name: string;
  tableName: string;
  enableRealtime: boolean;
  searchFields: Array<{
    name: string;
    type: string;
  }>;
}

function analyzePrismaSchema(schemaPath: string): ModelInfo[] {
  try {
    const schemaContent = fs.readFileSync(schemaPath, 'utf8');
    const modelInfos: ModelInfo[] = [];

    const modelRegex = /(?:\/\/\s*@disableRealtime\s*)?\s*model\s+(\w+)\s*{([\s\S]*?)}/g;
    let modelMatch;

    while ((modelMatch = modelRegex.exec(schemaContent)) !== null) {
      const modelName = modelMatch[1];
      const modelBodyWithComments = modelMatch[0]; // Includes the model keyword and its comments
      const modelBody = modelMatch[2]; // Just the content within {}
      
      if (!modelName || !modelBody) {
        console.error('Model name or body not found');
        continue;
      }
      const tableName = modelBodyWithComments.includes('@map')
        ? modelBodyWithComments.match(/@map\s*\(\s*["'](.+?)["']\s*\)/)?.at(1) || modelName
        : modelName;

      const enableRealtime = !modelBodyWithComments.includes('// @disableRealtime');
      const searchFields: Array<{ name: string; type: string }> = [];
      
      // Split model body into lines to check for @enableSearch directives
      const bodyLines = modelBody.trim().split('\n');
      let nextFieldShouldBeSearchable = false;
      
      for (let i = 0; i < bodyLines.length; i++) {
        const currentLine = bodyLines[i]?.trim() || '';

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
          continue;
        }

        // Parse field definition - Updated to handle array types and inline comments  
        const fieldMatch = currentLine.match(/^\s*(\w+)\s+(\w+)(\[\])?(\?)?\s*/);
        if (fieldMatch) {
          const fieldName = fieldMatch[1];
          const fieldType = fieldMatch[2];

          // Check if this field should be searchable due to @enableSearch directive
          if (nextFieldShouldBeSearchable && fieldName && fieldType) {
            searchFields.push({
              name: fieldName,
              type: fieldType,
            });
            nextFieldShouldBeSearchable = false; // Reset flag
          }

          // Check for inline // @enableSearch comment
          if (currentLine.includes('// @enableSearch')) {
            if (fieldName && fieldType && !searchFields.some(f => f.name === fieldName)) {
              searchFields.push({
                name: fieldName,
                type: fieldType,
              });
            }
          }
        }
      }
      
      modelInfos.push({
        name: modelName,
        tableName,
        enableRealtime,
        searchFields,
      });
    }

    return modelInfos;
  } catch (error) {
    console.error('Error analyzing Prisma schema:', error);
    return [];
  }
}

/**
 * Configure database tables for proper realtime functionality and search
 * 1. Sets REPLICA IDENTITY FULL and enables realtime for all models (unless they have @disableRealtime)
 * 2. Creates search functions for fields with @enableSearch
 */
async function configurePrismaTablesForSuparisma(schemaPath: string) {
  try {
    // COMPLETELY BYPASS NORMAL OPERATION FOR SIMPLICITY
    console.log('🔧 Using direct SQL approach to avoid PostgreSQL case sensitivity issues...');

    // Load environment variables
    dotenv.config();

    // Get direct PostgreSQL connection URL
    const directUrl = process.env.DIRECT_URL;
    if (!directUrl) {
      throw new Error(
        '❌ Error: DIRECT_URL environment variable not found. This is required for database configuration (e.g., setting up realtime). Please define it in your .env file or as an environment variable and try again. This should be a direct PostgreSQL connection string.\n'
      );
    }

    // Analyze Prisma schema for models, realtime and search annotations
    const modelInfos = analyzePrismaSchema(schemaPath);
    const pg = await import('pg');
    const { Pool } = pg.default || pg;
    const pool = new Pool({ connectionString: process.env.DIRECT_URL });

    console.log('🔌 Connected to PostgreSQL database for configuration.');

    const { rows: allTables } = await pool.query(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`
    );

    for (const model of modelInfos) {
      const matchingTable = allTables.find(
        (t: any) => t.table_name.toLowerCase() === model.tableName.toLowerCase()
      );

      if (!matchingTable) {
        console.warn(`🟠 Skipping model ${model.name}: Corresponding table ${model.tableName} not found in database.`);
        continue;
      }
      const actualTableName = matchingTable.table_name;
      console.log(`Processing model ${model.name} (table: "${actualTableName}")`);

      // Realtime setup (existing logic)
      if (model.enableRealtime) {
        const alterPublicationQuery = `ALTER PUBLICATION supabase_realtime ADD TABLE "${actualTableName}";`;
        try {
          await pool.query(alterPublicationQuery);
          console.log(`  ✅ Added "${actualTableName}" to supabase_realtime publication for real-time updates.`);
        } catch (err: any) {
          if (err.message.includes('already member')) {
            console.log(`  ℹ️ Table "${actualTableName}" was already in supabase_realtime publication.`);
          } else {
            console.error(`  ❌ Failed to add "${actualTableName}" to supabase_realtime: ${err.message}`);
          }
        }
      } else {
        console.log(`  ℹ️ Realtime disabled for model ${model.name}.`);
      }

      // Search setup
      if (model.searchFields.length > 0) {
        console.log(`  🔍 Setting up full-text search for model ${model.name}:`);
        const { rows: columns } = await pool.query(
          `SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = $1`,
          [actualTableName]
        );

        // Create individual field search functions
        for (const searchField of model.searchFields) {
          const matchingColumn = columns.find(
            (c: any) => c.column_name.toLowerCase() === searchField.name.toLowerCase()
          );

          if (!matchingColumn) {
            console.warn(`    🟠 Skipping search for field ${searchField.name}: Column not found in table "${actualTableName}".`);
            continue;
          }
          const actualColumnName = matchingColumn.column_name;
          const functionName = `search_${actualTableName.toLowerCase()}_by_${actualColumnName.toLowerCase()}_prefix`;
          const indexName = `idx_gin_search_${actualTableName.toLowerCase()}_${actualColumnName.toLowerCase()}`;

          console.log(`    ➡️ Configuring field "${actualColumnName}":`);
          try {
            // Create search function with improved partial search and error handling
            const createFunctionQuery = `
              CREATE OR REPLACE FUNCTION "public"."${functionName}"(search_prefix text)
              RETURNS SETOF "public"."${actualTableName}" AS $$
              DECLARE
                clean_prefix text;
                words text[];
                word text;
                tsquery_str text := '';
              BEGIN
                -- Handle empty or null search terms
                IF search_prefix IS NULL OR trim(search_prefix) = '' THEN
                  RETURN;
                END IF;
                
                -- Clean the search prefix: remove special characters, normalize spaces
                clean_prefix := regexp_replace(trim(search_prefix), '[^a-zA-Z0-9\\s]', ' ', 'g');
                clean_prefix := regexp_replace(clean_prefix, '\\s+', ' ', 'g');
                clean_prefix := trim(clean_prefix);
                
                -- Handle empty string after cleaning
                IF clean_prefix = '' THEN
                  RETURN;
                END IF;
                
                -- Split into words and build partial search query
                words := string_to_array(clean_prefix, ' ');
                
                -- Build tsquery for partial matching
                FOR i IN 1..array_length(words, 1) LOOP
                  word := words[i];
                  IF word != '' THEN
                    IF tsquery_str != '' THEN
                      tsquery_str := tsquery_str || ' & ';
                    END IF;
                    -- Add prefix matching for each word
                    tsquery_str := tsquery_str || word || ':*';
                  END IF;
                END LOOP;
                
                -- Return query with proper error handling
                RETURN QUERY
                SELECT * FROM "public"."${actualTableName}"
                WHERE 
                  "${actualColumnName}" IS NOT NULL 
                  AND "${actualColumnName}" != ''
                  AND (
                    -- Use the built tsquery for structured search
                    to_tsvector('english', "${actualColumnName}") @@ to_tsquery('english', tsquery_str)
                    OR
                    -- Fallback to simple text matching for very partial matches
                    "${actualColumnName}" ILIKE '%' || search_prefix || '%'
                  );
              EXCEPTION
                WHEN others THEN
                  -- Log error and return empty result set instead of failing
                  RAISE NOTICE 'Search function error: %, falling back to simple ILIKE search', SQLERRM;
                  -- Fallback to simple pattern matching
                  RETURN QUERY
                  SELECT * FROM "public"."${actualTableName}"
                  WHERE 
                    "${actualColumnName}" IS NOT NULL 
                    AND "${actualColumnName}" != ''
                    AND "${actualColumnName}" ILIKE '%' || search_prefix || '%';
                  RETURN;
              END;
              $$ LANGUAGE plpgsql STABLE;`; // Added STABLE for performance
            await pool.query(createFunctionQuery);
            console.log(`      ✅ Created/Replaced RPC function: "${functionName}"(search_prefix text)`);

            // Create GIN index
            const createIndexQuery = `
              DO $$
              BEGIN
                IF NOT EXISTS (
                  SELECT 1 FROM pg_indexes 
                  WHERE schemaname = 'public' 
                  AND tablename = '${actualTableName}'
                  AND indexname = '${indexName}'
                ) THEN
                  CREATE INDEX "${indexName}" ON "public"."${actualTableName}" USING GIN (to_tsvector('english', "${actualColumnName}"));
                  RAISE NOTICE '      ✅ Created GIN index: "${indexName}" on "${actualTableName}"("${actualColumnName}")';
                ELSE
                  RAISE NOTICE '      ℹ️ GIN index "${indexName}" on "${actualTableName}"("${actualColumnName}") already exists.';
                END IF;
              END;
              $$;`;
            const indexResult = await pool.query(createIndexQuery);
            // Output notices from the DO $$ block (PostgreSQL specific)
            if (indexResult.rows.length > 0 && indexResult.rows[0].notice) {
                console.log(indexResult.rows[0].notice.replace(/^NOTICE:  /, ''));
            } else if (!indexResult.rows.find((r: any) => r.notice?.includes('Created GIN index'))) {
                // If DO $$ block doesn't emit specific notice for creation and it didn't say exists.
                // This is a fallback log, actual creation/existence is handled by the DO block.
                // The important part is that the index will be there.
            }

          } catch (err: any) {
            console.error(`      ❌ Failed to set up search for "${actualTableName}"."${actualColumnName}": ${err.message}`);
          }
        }
        
        // Create multi-field search function if there are multiple searchable fields
        if (model.searchFields.length > 1) {
          console.log(`    ➡️ Creating multi-field search function:`);
          try {
            const validSearchFields = model.searchFields.filter(field => 
              columns.find(c => c.column_name.toLowerCase() === field.name.toLowerCase())
            );
            
            if (validSearchFields.length > 1) {
              const multiFieldFunctionName = `search_${actualTableName.toLowerCase()}_multi_field`;
              const multiFieldIndexName = `idx_gin_search_${actualTableName.toLowerCase()}_multi_field`;
              
              // Get actual column names
              const actualColumnNames = validSearchFields.map(field => {
                const matchingColumn = columns.find(c => c.column_name.toLowerCase() === field.name.toLowerCase());
                return matchingColumn.column_name;
              });
              
              // Create multi-field search function with improved partial search
              const createMultiFieldFunctionQuery = `
                CREATE OR REPLACE FUNCTION "public"."${multiFieldFunctionName}"(search_prefix text)
                RETURNS SETOF "public"."${actualTableName}" AS $$
                DECLARE
                  clean_prefix text;
                  words text[];
                  word text;
                  tsquery_str text := '';
                  combined_text text;
                BEGIN
                  -- Handle empty or null search terms
                  IF search_prefix IS NULL OR trim(search_prefix) = '' THEN
                    RETURN;
                  END IF;
                  
                  -- Clean the search prefix: remove special characters, normalize spaces
                  clean_prefix := regexp_replace(trim(search_prefix), '[^a-zA-Z0-9\\s]', ' ', 'g');
                  clean_prefix := regexp_replace(clean_prefix, '\\s+', ' ', 'g');
                  clean_prefix := trim(clean_prefix);
                  
                  -- Handle empty string after cleaning
                  IF clean_prefix = '' THEN
                    RETURN;
                  END IF;
                  
                  -- Split into words and build partial search query
                  words := string_to_array(clean_prefix, ' ');
                  
                  -- Build tsquery for partial matching
                  FOR i IN 1..array_length(words, 1) LOOP
                    word := words[i];
                    IF word != '' THEN
                      IF tsquery_str != '' THEN
                        tsquery_str := tsquery_str || ' & ';
                      END IF;
                      -- Add prefix matching for each word
                      tsquery_str := tsquery_str || word || ':*';
                    END IF;
                  END LOOP;
                  
                  -- Return query searching across all searchable fields
                  RETURN QUERY
                  SELECT * FROM "public"."${actualTableName}"
                  WHERE 
                    (
                      -- Use the built tsquery for structured search
                      to_tsvector('english', 
                        COALESCE("${actualColumnNames.join('", \'\') || \' \' || COALESCE("')}", '')
                      ) @@ to_tsquery('english', tsquery_str)
                      OR
                      -- Fallback to simple text matching across all fields
                      (${actualColumnNames.map(col => `"${col}" ILIKE '%' || search_prefix || '%'`).join(' OR ')})
                    );
                EXCEPTION
                  WHEN others THEN
                    -- Log error and return empty result set instead of failing
                    RAISE NOTICE 'Multi-field search function error: %, falling back to simple ILIKE search', SQLERRM;
                    -- Fallback to simple pattern matching across all fields
                    RETURN QUERY
                    SELECT * FROM "public"."${actualTableName}"
                    WHERE 
                      (${actualColumnNames.map(col => `"${col}" ILIKE '%' || search_prefix || '%'`).join(' OR ')});
                    RETURN;
                END;
                $$ LANGUAGE plpgsql STABLE;`;
              
              await pool.query(createMultiFieldFunctionQuery);
              console.log(`      ✅ Created multi-field search function: "${multiFieldFunctionName}"(search_prefix text)`);
              
              // Create multi-field GIN index
              const createMultiFieldIndexQuery = `
                DO $$
                BEGIN
                  IF NOT EXISTS (
                    SELECT 1 FROM pg_indexes 
                    WHERE schemaname = 'public' 
                    AND tablename = '${actualTableName}'
                    AND indexname = '${multiFieldIndexName}'
                  ) THEN
                    CREATE INDEX "${multiFieldIndexName}" ON "public"."${actualTableName}" 
                    USING GIN (to_tsvector('english', 
                      COALESCE("${actualColumnNames.join('", \'\') || \' \' || COALESCE("')}", '')
                    ));
                    RAISE NOTICE '      ✅ Created multi-field GIN index: "${multiFieldIndexName}"';
                  ELSE
                    RAISE NOTICE '      ℹ️ Multi-field GIN index "${multiFieldIndexName}" already exists.';
                  END IF;
                END;
                $$;`;
              
              await pool.query(createMultiFieldIndexQuery);
            }
          } catch (err: any) {
            console.error(`      ❌ Failed to set up multi-field search for "${actualTableName}": ${err.message}`);
          }
        }
      } else {
        console.log(`  ℹ️ No fields marked with // @enableSearch for model ${model.name}.`);
      }
      console.log('---------------------------------------------------');
    }

    await pool.end();
    console.log('🎉 Database configuration complete.');
  } catch (err) {
    console.error('❌ Error during database configuration:', err);
    console.log('⚠️ Hook generation will continue, but database features like search or realtime might not be fully configured.');
  }
}

/**
 * Main execution function for hook generation
 */
async function generateHooks() {
  try {
    console.log('🚀 Starting Suparisma hook generation...');
    
    checkEnvironmentVariables();

    console.log(`Prisma schema path: ${PRISMA_SCHEMA_PATH}`);
    console.log(`Output directory: ${OUTPUT_DIR}`);

    // Delete the entire output directory if it exists to clean up any stale files
    if (fs.existsSync(OUTPUT_DIR)) {
      console.log(`🧹 Cleaning up previous generated files in ${OUTPUT_DIR}...`);
      fs.rmSync(OUTPUT_DIR, { recursive: true, force: true });
      console.log(`✅ Removed previous generated directory`);
    }

    // Ensure all specific output directories exist, OUTPUT_DIR is the root and will be created if needed by sub-creations.
    const dirsToEnsure = [TYPES_DIR, HOOKS_DIR, UTILS_DIR];
    dirsToEnsure.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`Created directory: ${dir}`)
      }
    });

    // Generate Supabase client file (goes to UTILS_DIR)
    generateSupabaseClientFile();

    // Generate the core hook factory (goes to UTILS_DIR)
    generateCoreFile();

    const models = parsePrismaSchema(PRISMA_SCHEMA_PATH);
    await configurePrismaTablesForSuparisma(PRISMA_SCHEMA_PATH);

    // Map Prisma model name -> actual table name (respects @@map)
    const modelNameToTableName: Record<string, string> = {};
    for (const m of models) {
      modelNameToTableName[m.name] = m.mappedName || m.name;
    }

    const modelInfos: ProcessedModelInfo[] = [];
    for (const model of models) {
      const modelInfo = generateModelTypesFile(model, modelNameToTableName);
      generateModelHookFile(modelInfo);
      modelInfos.push(modelInfo);
    }

    generateMainIndexFile(modelInfos);

    console.log(`✅ Successfully generated all suparisma hooks and types in "${OUTPUT_DIR}"!`);
  } catch (error) {
    console.error('❌ Error generating hooks:', error);
    process.exit(1);
  }
}

/**
 * Main CLI entry point
 */
function run() {
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'generate':
      generateHooks();
      break;
    case 'help':
    case '--help':
    case '-h':
      printHelp();
      break;
    default:
      console.log(`Unknown command: ${command}`);
      printHelp();
      process.exit(1);
  }
}

// Execute the CLI command
run();
