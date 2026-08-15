import type { SessionPermissions } from "@/lib/permissions";
import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface User {
    role: string;
    permissions: SessionPermissions;
  }

  interface Session {
    user: {
      id: string;
      email?: string | null;
      name?: string | null;
      role: string;
      permissions: SessionPermissions;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    permissions: SessionPermissions;
  }
}
