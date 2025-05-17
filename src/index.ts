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
 * Looks for // @enableRealtime and // @enableSearch
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

    // Regular expression to match model definitions with comments
    const modelRegex = /(?:\/\/\s*@enableRealtime\s*)?\s*model\s+(\w+)\s*{([\s\S]*?)}/g;
    let modelMatch;

    while ((modelMatch = modelRegex.exec(schemaContent)) !== null) {
      const modelName = modelMatch[1];
      const modelBody = modelMatch[2];
      if (!modelName || !modelBody) {
        console.error('Model name or body not found');
        continue;
      }
      const tableName = modelMatch[0].includes('@map')
        ? modelMatch[0].match(/@map\s*\(\s*["'](.+?)["']\s*\)/)?.at(1) || modelName
        : modelName;

      // Check if model has @enableRealtime comment
      const enableRealtime = modelMatch[0].includes('// @enableRealtime');

      // Find fields with @enableSearch comment
      const searchFields: Array<{ name: string; type: string }> = [];
      const fieldRegex = /(\w+)\s+(\w+)(?:\?.+?)?\s+(?:@.+?)?\s*(?:\/\/\s*@enableSearch)?/g;
      let fieldMatch;

      while ((fieldMatch = fieldRegex.exec(modelBody)) !== null) {
        if (fieldMatch[0].includes('// @enableSearch')) {
          searchFields.push({
            name: fieldMatch[1] || '',
            type: fieldMatch[2] || '',
          });
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
 * 1. Sets REPLICA IDENTITY FULL and enables realtime for models with @enableRealtime
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
      console.warn(
        '⚠️ DIRECT_URL environment variable not found. Skipping database configuration.'
      );
      return;
    }

    // Analyze Prisma schema for models, realtime and search annotations
    const modelInfos = analyzePrismaSchema(schemaPath);

    // Dynamically import pg package
    const pg = await import('pg');
    const { Pool } = pg.default || pg;

    // Connect to PostgreSQL database
    const pool = new Pool({ connectionString: directUrl });

    console.log('🔌 Connected to PostgreSQL database');

    // Get all tables from database directly
    const { rows: allTables } = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
    `);

    console.log(`📋 Found ${allTables.length} tables in the 'public' schema`);
    allTables.forEach((t: any) => console.log(`   - ${t.table_name}`));

    // DIRECT APPROACH: Hardcode SQL for each known Prisma model type
    for (const model of modelInfos) {
      try {
        // Find the matching table regardless of case
        const matchingTable = allTables.find(
          (t: any) => t.table_name.toLowerCase() === model.tableName.toLowerCase()
        );

        if (!matchingTable) {
          console.warn(`⚠️ Could not find a table for model ${model.name}. Skipping.`);
          continue;
        }

        // Use the exact case of the table as it exists in the database
        const actualTableName = matchingTable.table_name;
        console.log(`🔍 Model ${model.name} -> Actual table: ${actualTableName}`);

        if (model.enableRealtime) {
          // Explicitly use double quotes for mixed case identifiers
          // try {
          //   await pool.query(`ALTER TABLE "${actualTableName}" REPLICA IDENTITY FULL;`);
          //   console.log(`✅ Set REPLICA IDENTITY FULL on "${actualTableName}"`);
          // } catch (err: any ) {
          //   console.error(`❌ Failed to set REPLICA IDENTITY on "${actualTableName}": ${err.message}`);
          // }

          // Directly add the table to Supabase Realtime publication
          try {
            await pool.query(`
              ALTER PUBLICATION supabase_realtime ADD TABLE "${actualTableName}";
            `);
            console.log(`✅ Added "${actualTableName}" to supabase_realtime publication`);
          } catch (err: any) {
            // If error contains "already exists", this is fine
            if (err.message.includes('already member')) {
              console.log(
                `ℹ️ Table "${actualTableName}" was already in supabase_realtime publication`
              );
            } else {
              console.error(
                `❌ Failed to add "${actualTableName}" to supabase_realtime: ${err.message}`
              );
            }
          }
        }

        // Handle search fields if any
        if (model.searchFields.length > 0) {
          // Get all columns for this table
          const { rows: columns } = await pool.query(
            `
            SELECT column_name
            FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = $1
          `,
            [actualTableName]
          );

          for (const searchField of model.searchFields) {
            // Find matching column regardless of case
            const matchingColumn = columns.find(
              (c) => c.column_name.toLowerCase() === searchField.name.toLowerCase()
            );

            if (!matchingColumn) {
              console.warn(
                `⚠️ Could not find column ${searchField.name} in table ${actualTableName}. Skipping search function.`
              );
              continue;
            }

            const actualColumnName = matchingColumn.column_name;
            const functionName = `search_${actualTableName.toLowerCase()}_by_${actualColumnName.toLowerCase()}_prefix`;
            const indexName = `idx_search_${actualTableName.toLowerCase()}_${actualColumnName.toLowerCase()}`;

            try {
              // Create search function with exact column case
              await pool.query(`
                CREATE OR REPLACE FUNCTION "public"."${functionName}"(prefix text)
                RETURNS SETOF "public"."${actualTableName}" AS $$
                BEGIN
                  RETURN QUERY
                  SELECT * FROM "public"."${actualTableName}"
                  WHERE to_tsvector('english', "${actualColumnName}") @@ to_tsquery('english', prefix || ':*');
                END;
                $$ LANGUAGE plpgsql;
              `);

              console.log(`✅ Created search function for ${actualTableName}.${actualColumnName}`);

              // FIXED: Properly quote identifiers in the index creation query
              await pool.query(`
                DO $$
                BEGIN
                  IF NOT EXISTS (
                    SELECT 1 FROM pg_indexes 
                    WHERE schemaname = 'public' 
                    AND tablename = '${actualTableName}'
                    AND indexname = '${indexName}'
                  ) THEN
                    CREATE INDEX "${indexName}" ON "public"."${actualTableName}" 
                    USING GIN (to_tsvector('english', "${actualColumnName}"));
                  END IF;
                END;
                $$;
              `);

              console.log(`✅ Created search index for ${actualTableName}.${actualColumnName}`);
            } catch (err: any) {
              console.error(
                `❌ Failed to set up search for "${actualTableName}.${actualColumnName}": ${err.message}`
              );
            }
          }
        }
      } catch (err: any) {
        console.error(`❌ Error processing model ${model.name}: ${err.message}`);
      }
    }

    await pool.end();
    console.log('🎉 Database configuration complete');
  } catch (err) {
    console.error('❌ Error configuring database:', err);
    console.log('⚠️ Continuing with hook generation anyway...');
  }
}

/**
 * Main execution function
 */
async function main() {
  try {
    console.log('🚀 Starting Suparisma hook generation...');
    
    // Check for required environment variables first
    checkEnvironmentVariables();

    console.log(`Prisma schema path: ${PRISMA_SCHEMA_PATH}`);
    console.log(`Output directory: ${OUTPUT_DIR}`);

    // Ensure output directories exist
    [OUTPUT_DIR, TYPES_DIR, HOOKS_DIR, UTILS_DIR].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });

    // Generate Supabase client file first
    generateSupabaseClientFile();

    // First, generate the core hook factory
    generateCoreFile();

    // Parse models from Prisma schema
    const models = parsePrismaSchema(PRISMA_SCHEMA_PATH);

    // Configure database tables for real-time and search functionality
    await configurePrismaTablesForSuparisma(PRISMA_SCHEMA_PATH);

    // Generate type definitions and hooks for each model
    const modelInfos: ProcessedModelInfo[] = [];
    for (const model of models) {
      const modelInfo = generateModelTypesFile(model);
      generateModelHookFile(modelInfo);
      modelInfos.push(modelInfo);
    }

    // Generate the main module file
    generateMainIndexFile(modelInfos);

    console.log(`✅ Successfully generated all suparisma hooks and types in "${OUTPUT_DIR}"!`);
  } catch (error) {
    console.error('❌ Error generating hooks:', error);
    process.exit(1);
  }
}

// Execute main function
main();
