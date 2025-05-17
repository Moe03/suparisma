// Configuration
export const PRISMA_SCHEMA_PATH = process.env.SUPARISMA_PRISMA_SCHEMA_PATH || 'prisma/schema.prisma';
export const OUTPUT_DIR = process.env.SUPARISMA_OUTPUT_DIR || 'src/suparisma/generated';
export const TYPES_DIR = `${OUTPUT_DIR}/types`;
export const HOOKS_DIR = `${OUTPUT_DIR}/hooks`;
export const UTILS_DIR = `${OUTPUT_DIR}/utils`;
export const HOOK_NAME_PREFIX = 'useSuparisma';
