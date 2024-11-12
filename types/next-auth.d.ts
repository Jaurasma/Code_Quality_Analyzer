// types/next-auth.d.ts
import NextAuth, { DefaultSession, DefaultUser } from "next-auth";
import { JWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      /** The user's name. */
      name?: string | null;
      /** The user's email address. */
      email?: string | null;
      /** The user's image. */
      image?: string | null;
    } & DefaultSession["user"];
    accessToken?: string; // Add accessToken to Session
  }

  interface User extends DefaultUser {
    // Add any additional properties to User if needed
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string; // Add accessToken to JWT
  }
}
