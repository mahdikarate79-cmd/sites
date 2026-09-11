import { User } from "@/lib/types";
import { currentUser, getUserByUsername, mockUsers } from "@/data/mock/users";

export async function getCurrentUser(): Promise<User> {
  // TODO: GET /api/auth/me
  return currentUser;
}

export async function getUserProfile(username: string): Promise<User | undefined> {
  // TODO: GET /api/users/:username
  return getUserByUsername(username);
}

export async function getSuggestedUsers(): Promise<User[]> {
  // TODO: GET /api/users/suggested
  return mockUsers.slice(1, 5);
}
