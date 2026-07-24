import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      role: "ADMIN" | "INSTRUCTOR" | "LEARNER";
    };
  }

  interface User {
    id: string;
    role: "ADMIN" | "INSTRUCTOR" | "LEARNER";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: "ADMIN" | "INSTRUCTOR" | "LEARNER";
  }
}
