import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { buildUserPermissions } from "@/lib/tenant";
import { authConfig } from "@/lib/auth/auth.config";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const parsed = loginSchema.safeParse(credentials);

        if (!parsed.success) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email.toLowerCase() },
        });

        if (!user || !user.isActive) {
          return null;
        }

        const valid = await bcrypt.compare(parsed.data.password, user.passwordHash);

        if (!valid) {
          return null;
        }

        const permissions = await buildUserPermissions(user.id, user.role);

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          permissions,
        };
      },
    }),
  ],
});
