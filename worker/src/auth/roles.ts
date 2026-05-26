/**
 * D-19: Role-based access control.
 *
 * `role` lives on the D1 `users` row (migration 13). Single source of truth
 * for who may edit exam content / manage users. Replaces the static
 * ADMIN_TOKEN shipped in the client bundle.
 */

export type Role = 'user' | 'editor' | 'admin';

const VALID_ROLES: readonly Role[] = ['user', 'editor', 'admin'];

export function isRole(v: unknown): v is Role {
  return typeof v === 'string' && (VALID_ROLES as readonly string[]).includes(v);
}

/** Look up a user's role from D1. Returns 'user' if unknown / column missing. */
export async function getUserRole(
  db: D1Database | undefined,
  userId: string,
): Promise<Role> {
  if (!db) return 'user';
  try {
    const row = await db
      .prepare(`SELECT role FROM users WHERE id = ?`)
      .bind(userId)
      .first<{ role?: string }>();
    return isRole(row?.role) ? (row!.role as Role) : 'user';
  } catch {
    // Column may not exist yet (pre-migration) — fail closed to 'user'.
    return 'user';
  }
}

/** editor or admin — may edit exam content. */
export function canEdit(role: Role): boolean {
  return role === 'editor' || role === 'admin';
}

/** admin only — may manage users/roles. */
export function isAdmin(role: Role): boolean {
  return role === 'admin';
}
