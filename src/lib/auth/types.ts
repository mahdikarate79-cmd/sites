import { User } from "@/lib/types";

export type LoginMethod = "guest" | "telegram";

export interface AuthUser extends User {
  loginMethod?: LoginMethod;
}

export interface AuthMeResponse {
  user: AuthUser | null;
  loginMethod: LoginMethod;
}
