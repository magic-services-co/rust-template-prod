import { permissions as knownPermissions } from "@/lib/roles";

export type RoleLike = {
  role?: {
    name?: string;
    permissions?: Array<{ resource?: string; action?: string; id?: string } | string>;
  };
};

type PermissionCheck = { resource: string; action: string };

function resolvePermissionId(id: string): PermissionCheck | null {
  const p = knownPermissions.find((perm) => perm.id === id);
  if (p && p.resource != null && p.action != null) {
    return { resource: p.resource, action: p.action };
  }
  const [resource, action] = id.split(":");
  if (resource && action) return { resource, action };
  return null;
}

export function hasPermission(
  roles: RoleLike[] | undefined | null,
  check: PermissionCheck
): boolean | Promise<boolean> {
  if (!roles || !Array.isArray(roles) || roles.length === 0) {
    return false;
  }

  const { resource, action } = check;

  for (const r of roles) {
    const role = r?.role;
    if (!role) continue;

    if (role.name === "Owner") {
      return true;
    }

    const perms = role.permissions;
    if (!Array.isArray(perms)) continue;

    for (const p of perms) {
      if (typeof p === "string") {
        const resolved = resolvePermissionId(p);
        if (resolved && resolved.resource === resource && resolved.action === action) {
          return true;
        }
      } else if (p && typeof p === "object") {
        const pResource = p.resource ?? (p.id ? resolvePermissionId(p.id)?.resource : undefined);
        const pAction = p.action ?? (p.id ? resolvePermissionId(p.id)?.action : undefined);
        if (pResource === resource && pAction === action) {
          return true;
        }
      }
    }
  }

  return false;
}
