// THIS FILE IS AUTO-GENERATED - DO NOT EDIT DIRECTLY
// Edit the generator script instead: scripts/generate-realtime-hooks.ts

import { useSuparismaUser } from './hooks/useSuparismaUser';
import type { UseUserOptions, UserHookApi } from './types/UserTypes';
export type { SuparismaOptions, SearchQuery, SearchState, FilterOperators } from './utils/core';
export type { UserWithRelations, UserCreateInput, UserUpdateInput, UserWhereInput, UserWhereUniqueInput, UserOrderByInput, UserHookApi, UseUserOptions } from './types/UserTypes';

/**
 * Interface for all Suparisma hooks with dot notation access.
 * This provides IntelliSense for all available models.
 * 
 * @example
 * // Access hooks for different models
 * const users = useSuparisma.user();
 * const posts = useSuparisma.post();
 */
export interface SuparismaHooks {
  user: (options?: UseUserOptions) => UserHookApi;
}

/**
 * Main Suparisma hook object with dot notation access to all model hooks.
 * 
 * @example
 * // Get hooks for different models
 * import useSuparisma from './generated';
 * 
 * // Access user model with all hook methods
 * const users = useSuparisma.user();
 * const { data, loading, error } = users;
 * 
 * // Create a new record
 * await users.create({ name: "John" });
 * 
 * // Delete a record
 * await users.delete({ id: "123" });
 * 
 * @example
 * // Use with filtering and options
 * const admins = useSuparisma.user({
 *   where: { role: 'admin' },
 *   orderBy: { created_at: 'desc' }
 * });
 */
const useSuparisma: SuparismaHooks = {
  user: useSuparismaUser,
};

export default useSuparisma;
