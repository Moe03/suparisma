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
      
      // Split model body into lines to check preceding line for @enableSearch
      const bodyLines = modelBody.trim().split('\n');
      for (let i = 0; i < bodyLines.length; i++) {
        const currentLine = bodyLines[i].trim();
        const previousLine = i > 0 ? bodyLines[i-1].trim() : "";

        // Check if the PREVIOUS line contains the @enableSearch comment
        if (previousLine.includes('// @enableSearch')) {
          // Try to parse the CURRENT line as a field definition
          // Basic regex: fieldName fieldType (optional attributes/comments)
          const fieldMatch = currentLine.match(/^(\w+)\s+(\w+)/);
          if (fieldMatch) {
            const fieldName = fieldMatch[1];
            const fieldType = fieldMatch[2];
            if (fieldName && fieldType) {
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
            // Create search function
            const createFunctionQuery = `
              CREATE OR REPLACE FUNCTION "public"."${functionName}"(search_prefix text)
              RETURNS SETOF "public"."${actualTableName}" AS $$
              BEGIN
                RETURN QUERY
                SELECT * FROM "public"."${actualTableName}"
                WHERE to_tsvector('english', "${actualColumnName}") @@ to_tsquery('english', search_prefix || ':*');
              END;
              $$ LANGUAGE plpgsql STABLE;`; // Added STABLE for potential performance benefits
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

    const modelInfos: ProcessedModelInfo[] = [];
    for (const model of models) {
      const modelInfo = generateModelTypesFile(model);
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
