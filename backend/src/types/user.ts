export type UserRole = "ADMIN" | "LEARNER";

export interface User {
  id: string;
  username: string;
  passwordHash: string;
  role: UserRole;
  displayName: string;
  active: boolean;
  authVersion: number;
  createdAt: string;
  updatedAt: string;
}

export type PublicUser = Omit<User, "passwordHash" | "authVersion">;

export const toPublicUser = ({
  passwordHash: _passwordHash,
  authVersion: _authVersion,
  ...user
}: User): PublicUser => user;
