// THIS FILE IS AUTO-GENERATED - DO NOT EDIT DIRECTLY
// Edit the generator script instead

import type { User } from '@prisma/client';
import type { ModelResult, SuparismaOptions, SearchQuery, SearchState } from '../utils/core';

/**
 * Extended User type that includes relation fields.
 * This represents the complete shape of User records returned from the database.
 */
export interface UserWithRelations {
  id: string;
  email: string;
  name?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Input type for creating a new User record.
 * Fields with default values are optional and will be filled automatically if not provided.
 * 
 * @example
 * // Create a minimal user
 * user.create({
 *   // Required fields only
 *   email: string,
 * });
 * 
 * @example
 * // Create with optional fields
 * user.create({
 *   // All fields including optional ones
 *   id?: string,
 *   email: string,
 *   name?: string,
 * });
 */
export interface UserCreateInput {
  id?: string;
  email: string;
  name?: string;
}

/**
 * Input type for updating an existing User record.
 * All fields are optional since you only need to specify the fields you want to change.
 * 
 * @example
 * // Update a user's fields
 * user.update({
 *   where: { id: "123" },
 *   data: {
 *     id?: string,
 *     email: string,
 *   }
 * });
 */
export type UserUpdateInput = Partial<UserCreateInput>;

/**
 * Filter type for querying User records.
 * You can filter by any field in the model using equality or advanced filter operators.
 * 
 * @example
 * // Basic filtering
 * user.findMany({
 *   where: {
 *     id: "value",
 *     email: "value"
 *   }
 * });
 * 
 * @example
 * // Advanced filtering
 * user.findMany({
 *   where: {
 *     // Use advanced operators
 *     id: { contains: "partial" }
 *   }
 * });
 */
export type UserWhereInput = Partial<UserWithRelations>;

/**
 * Unique identifier for finding a specific User record.
 * Usually uses the ID field but can be any field marked as @unique in the schema.
 * 
 * @example
 * // Find by ID
 * user.findUnique({ id: "123" });
 * 
 * @example
 * // Delete by ID
 * user.delete({ id: "123" });
 */
export type UserWhereUniqueInput = { 
  id: string;
};

/**
 * Sort options for User queries.
 * Specify the field to sort by and the direction ('asc' or 'desc').
 * 
 * @example
 * // Sort by creation date, newest first
 * user.findMany({
 *   orderBy: { created_at: 'desc' }
 * });
 * 
 * @example
 * // Sort alphabetically
 * user.findMany({
 *   orderBy: { name: 'asc' }
 * });
 */
export type UserOrderByInput = {
  [key in keyof UserWithRelations]?: 'asc' | 'desc';
};

/**
 * Result type for operations that return a single User record.
 */
export type UserSingleResult = ModelResult<UserWithRelations>;

/**
 * Result type for operations that return multiple User records.
 */
export type UserManyResult = ModelResult<UserWithRelations[]>;

/**
 * Configuration options for the User hook.
 */
export type UseUserOptions = SuparismaOptions<UserWhereInput, UserOrderByInput>;

/**
 * The complete API for interacting with User records.
 * This interface defines all available operations and state properties.
 */
export interface UserHookApi {
  /**
   * Current array of User records.
   * This is automatically updated when:
   * - The initial data is loaded
   * - Mutations are performed (create, update, delete)
   * - Real-time updates are received from other clients
   * - The refresh method is called
   * 
   * @example
   * // Render a list of user records
   * const { data } = user;
   * return (
   *   <ul>
   *     {data.map(item => (
   *       <li key={item.id}>{item.name}</li>
   *     ))}
   *   </ul>
   * );
   */
  data: UserWithRelations[];
  
  /**
   * Error object if the last operation failed, null otherwise.
   * 
   * @example
   * // Handle potential errors
   * const { error } = user;
   * if (error) {
   *   return <div>Error: {error.message}</div>;
   * }
   */
  error: Error | null;
  
  /**
   * Boolean indicating if an operation is in progress.
   * 
   * @example
   * // Show loading state
   * const { loading } = user;
   * if (loading) {
   *   return <div>Loading...</div>;
   * }
   */
  loading: boolean;
  
  
  
  /**
   * Find a single User record by its unique identifier.
   * 
   * @param where - The unique identifier to find the record by
   * @returns A promise with the found record or error
   * 
   * @example
   * // Find user by ID
   * const result = await user.findUnique({ id: "123" });
   * if (result.data) {
   *   console.log("Found user:", result.data);
   * }
   */
  findUnique: (where: UserWhereUniqueInput) => UserSingleResult;
  
  /**
   * Find multiple User records matching the filter criteria.
   * Supports filtering, sorting, and pagination.
   * 
   * @param params - Optional query parameters
   * @returns A promise with the matching records or error
   * 
   * @example
   * // Get all user records
   * const result = await user.findMany();
   * 
   * @example
   * // Filter and sort records
   * const result = await user.findMany({
   *   where: { active: true },
   *   orderBy: { created_at: 'desc' },
   *   take: 10,
   *   skip: 0
   * });
   */
  findMany: (params?: {
    where?: UserWhereInput;
    orderBy?: UserOrderByInput;
    take?: number;
    skip?: number;
  }) => UserManyResult;
  
  /**
   * Find the first User record matching the filter criteria.
   * 
   * @param params - Optional query parameters
   * @returns A promise with the first matching record or error
   * 
   * @example
   * // Find the first active user
   * const result = await user.findFirst({
   *   where: { active: true }
   * });
   * 
   * @example
   * // Find the oldest user
   * const result = await user.findFirst({
   *   orderBy: { created_at: 'asc' }
   * });
   */
  findFirst: (params?: {
    where?: UserWhereInput;
    orderBy?: UserOrderByInput;
  }) => UserSingleResult;
  
  /**
   * Create a new User record.
   * Fields with default values are optional and will use their defaults if not provided.
   * 
   * @param data - The data for the new record
   * @returns A promise with the created record or error
   * 
   * @example
   * // Create a new user
   * const result = await user.create({
   *   email: "value"
   * });
   * 
   * @example
   * // Create with custom ID (overriding default)
   * const result = await user.create({
   *   id: "custom-id",
   *   email: "value"
   * });
   */
  create: (data: UserCreateInput) => UserSingleResult;
  
  /**
   * Update an existing User record.
   * 
   * @param params - Object with the record identifier and fields to update
   * @returns A promise with the updated record or error
   * 
   * @example
   * // Update a user's fields
   * const result = await user.update({
   *   where: { id: "123" },
   *   data: {
   *     id?: "updated value",
   *     email: "updated value"
   *   }
   * });
   */
  update: (params: {
    where: UserWhereUniqueInput;
    data: UserUpdateInput;
  }) => UserSingleResult;
  
  /**
   * Delete a User record by its unique identifier.
   * 
   * @param where - The unique identifier of the record to delete
   * @returns A promise with the deleted record or error
   * 
   * @example
   * // Delete a user by ID
   * const result = await user.delete({ id: "123" });
   * if (result.data) {
   *   console.log("Deleted user:", result.data);
   * }
   */
  delete: (where: UserWhereUniqueInput) => UserSingleResult;
  
  /**
   * Delete multiple User records matching the filter criteria.
   * 
   * @param params - Optional filter parameters
   * @returns A promise with the count of deleted records or error
   * 
   * @example
   * // Delete all inactive user records
   * const result = await user.deleteMany({
   *   where: { active: false }
   * });
   * console.log(`Deleted ${result.count} records`);
   * 
   * @example
   * // Delete all user records (use with caution!)
   * const result = await user.deleteMany();
   */
  deleteMany: (params?: {
    where?: UserWhereInput;
  }) => Promise<{ count: number; error: Error | null }>;
  
  /**
   * Create a record if it doesn't exist, or update it if it does.
   * 
   * @param params - Object with the identifier, update data, and create data
   * @returns A promise with the created or updated record or error
   * 
   * @example
   * // Upsert a user by ID
   * const result = await user.upsert({
   *   where: { id: "123" },
   *   update: { name: "Updated Name" },
   *   create: {
   *     id: "123",
   *     name: "New Name",
   *     email: "value"
   *   }
   * });
   */
  upsert: (params: {
    where: UserWhereUniqueInput;
    update: UserUpdateInput;
    create: UserCreateInput;
  }) => UserSingleResult;
  
  /**
   * Count the number of User records matching the filter criteria.
   * 
   * @param params - Optional filter parameters
   * @returns A promise with the count of matching records
   * 
   * @example
   * // Count all user records
   * const count = await user.count();
   * 
   * @example
   * // Count active user records
   * const activeCount = await user.count({
   *   where: { active: true }
   * });
   */
  count: (params?: {
    where?: UserWhereInput;
  }) => Promise<number>;
  
  /**
   * Manually refresh the data with current filter settings.
   * Useful after external operations or when realtime is disabled.
   * 
   * @param params - Optional override parameters for this specific refresh
   * @returns A promise with the refreshed data or error
   * 
   * @example
   * // Refresh with current filter settings
   * await user.refresh();
   * 
   * @example
   * // Refresh with different filters for this call only
   * await user.refresh({
   *   where: { active: true },
   *   orderBy: { name: 'asc' }
   * });
   */
  refresh: (params?: {
    where?: UserWhereInput;
    orderBy?: UserOrderByInput;
    take?: number;
    skip?: number;
  }) => UserManyResult;
}