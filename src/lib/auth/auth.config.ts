import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [],
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        token.id = user.id ?? "";
        token.role = user.role;
        token.permissions = user.permissions;
      }

      return token;
    },
    session: async ({ session, token }) => {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.permissions = token.permissions;
      }

      return session;
    },
    authorized: ({ auth, request }) => {
      const { pathname } = request.nextUrl;
      const isLoggedIn = !!auth?.user;

      const publicPaths = ["/", "/login", "/invite"];
      const isPublic = publicPaths.some(
        (path) => pathname === path || pathname.startsWith(`${path}/`),
      );

      if (!isLoggedIn && !isPublic) {
        return false;
      }

      if (isLoggedIn && (pathname === "/login" || pathname === "/")) {
        return Response.redirect(
          new URL(auth?.user?.role === "SUPERUSER" ? "/superadmin" : "/dashboard", request.url),
        );
      }

      if (isLoggedIn && pathname.startsWith("/superadmin") && auth?.user?.role !== "SUPERUSER") {
        return Response.redirect(new URL("/dashboard", request.url));
      }

      if (isLoggedIn && pathname.startsWith("/dashboard") && auth?.user?.role === "SUPERUSER") {
        return Response.redirect(new URL("/superadmin", request.url));
      }

      return true;
    },
  },
} satisfies NextAuthConfig;
