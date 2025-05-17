// Configuration
import path from 'path';

// Use current working directory for all paths
const CWD = process.cwd();

export const PRISMA_SCHEMA_PATH = process.env.SUPARISMA_PRISMA_SCHEMA_PATH || path.join(CWD, 'prisma/schema.prisma');
export const OUTPUT_DIR = process.env.SUPARISMA_OUTPUT_DIR || path.join(CWD, 'src/suparisma/generated');
export const TYPES_DIR = `${OUTPUT_DIR}/types`;
export const HOOKS_DIR = `${OUTPUT_DIR}/hooks`;
export const UTILS_DIR = `${OUTPUT_DIR}/utils`;
export const HOOK_NAME_PREFIX = 'useSuparisma';
