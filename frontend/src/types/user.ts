/**
 * Shared types for user and role used across admin and profile.
 * Role from API includes canManage for Discord-style hierarchy (only manage roles below your highest).
 */
export type Role = {
  id: string;
  name: string;
  order?: number;
  color?: string | null;
  permissions?: { id: string; title?: string; resource?: string; action?: string }[];
  users?: { id: string; name: string | null; image: string | null }[];
  /** When false, current user cannot edit/delete this role or move it above their highest role. */
  canManage?: boolean;
  [key: string]: unknown;
};

export interface User {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  role?: string;
  /** Admin API returns pivot shape (UserRole[]); other code may use simple { id, name, color }[]. */
  roles?: UserRole[] | { id: string; name: string; color?: string | null }[];
  [key: string]: unknown;
}

export interface UserRole {
  roleId: string;
  userId?: string;
  /** When false, current user cannot revoke this role (hierarchy). */
  canManage?: boolean;
  role?: { id: string; name: string; color?: string | null; order?: number };
  [key: string]: unknown;
}
