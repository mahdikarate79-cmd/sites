import { User } from "@/lib/types";

export type LoginMethod = "guest" | "telegram";

export interface AuthUser extends User {
  loginMethod?: LoginMethod;
  verificationRequestPending?: boolean;
  banned?: boolean;
}

export interface AuthMeResponse {
  user: AuthUser | null;
  loginMethod: LoginMethod;
  verificationMinFollowers?: number;
}
