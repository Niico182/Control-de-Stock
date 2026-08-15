import type { CompanyMember, UserRole } from "@/generated/prisma/client";

export type SessionPermissions = {
  role: UserRole;
  companyId?: string;
  canManageProducts: boolean;
  canCreateOrders: boolean;
  canViewReports: boolean;
  canManageMembers: boolean;
};

export function permissionsFromMembership(
  role: UserRole,
  membership?: CompanyMember | null,
): SessionPermissions {
  if (role === "SUPERUSER") {
    return {
      role,
      canManageProducts: true,
      canCreateOrders: true,
      canViewReports: true,
      canManageMembers: true,
    };
  }

  if (role === "ADMIN" && membership) {
    return {
      role,
      companyId: membership.companyId,
      canManageProducts: true,
      canCreateOrders: true,
      canViewReports: true,
      canManageMembers: true,
    };
  }

  return {
    role,
    companyId: membership?.companyId,
    canManageProducts: membership?.canManageProducts ?? false,
    canCreateOrders: membership?.canCreateOrders ?? false,
    canViewReports: membership?.canViewReports ?? false,
    canManageMembers: membership?.canManageMembers ?? false,
  };
}

export function assertPermission(
  permissions: SessionPermissions,
  key: keyof Omit<SessionPermissions, "role" | "companyId">,
) {
  if (!permissions[key]) {
    throw new Error("No tenés permisos para realizar esta acción.");
  }
}
