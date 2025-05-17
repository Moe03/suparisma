// THIS FILE IS AUTO-GENERATED - DO NOT EDIT DIRECTLY
// Edit the generator script instead: scripts/generate-realtime-hooks.ts

import { createSuparismaHook } from '../utils/core';
import type {
  UserWithRelations,
  UserCreateInput,
  UserUpdateInput,
  UserWhereInput,
  UserWhereUniqueInput,
  UserOrderByInput,
  UserHookApi,
  UseUserOptions
} from '../types/UserTypes';

/**
 * A Prisma-like hook for interacting with User records with real-time capabilities.
 * 
 * This hook provides CRUD operations, real-time updates, and search functionality.
 *
 * @param options - Optional configuration options for the hook
 * @returns An object with data state and methods for interacting with User records
 * 
 * @example
 * // Basic usage - get all User records with realtime updates
 * const user = useSuparismaUser();
 * const { data, loading, error } = user;
 * 
 * @example
 * // With filtering and ordering
 * const user = useSuparismaUser({
 *   where: { active: true },
 *   orderBy: { created_at: 'desc' },
 *   limit: 10
 * });
 * 
 * @example
 * // Create a new record
 * const result = await user.create({
 *   name: "Example Name",
 *   // other fields...
 * });
 * 
 * @example
 * // Update a record
 * const result = await user.update({
 *   where: { id: "123" },
 *   data: { name: "Updated Name" }
 * });
 * 
 * @example
 * // Delete a record
 * const result = await user.delete({ id: "123" });
 * 
 * @example
 * // Find records with specific criteria
 * const result = await user.findMany({
 *   where: { // filters },
 *   orderBy: { // ordering },
 *   take: 20 // limit
 * });
 */
export const useSuparismaUser = createSuparismaHook<
  UserWithRelations,
  UserWithRelations,
  UserCreateInput,
  UserUpdateInput,
  UserWhereInput,
  UserWhereUniqueInput,
  UserOrderByInput
>({
  tableName: 'User',
  hasCreatedAt: true,
  hasUpdatedAt: true,
  // Default values from schema
  defaultValues: {"id":"uuid(","createdAt":"now("}
}) as (options?: UseUserOptions) => UserHookApi;
