import type {
  ApiResponse,
  AuthUser,
  UserAuditEvent,
  UserRole,
} from "../types/api";
import { apiClient } from "./client";

export interface CreateUserInput {
  username: string;
  displayName: string;
  role: UserRole;
  password: string;
}

export interface UpdateUserInput {
  displayName: string;
  role: UserRole;
  active: boolean;
}

export const usersApi = {
  async list(): Promise<AuthUser[]> {
    const response =
      await apiClient.get<ApiResponse<{ users: AuthUser[] }>>("/users");
    return response.data.data.users;
  },

  async create(input: CreateUserInput): Promise<AuthUser> {
    const response = await apiClient.post<ApiResponse<{ user: AuthUser }>>(
      "/users",
      input,
    );
    return response.data.data.user;
  },

  async update(id: string, input: UpdateUserInput): Promise<AuthUser> {
    const response = await apiClient.put<ApiResponse<{ user: AuthUser }>>(
      `/users/${encodeURIComponent(id)}`,
      input,
    );
    return response.data.data.user;
  },

  async resetPassword(id: string, password: string): Promise<void> {
    await apiClient.put(`/users/${encodeURIComponent(id)}/password`, {
      password,
    });
  },

  async audit(limit = 30): Promise<UserAuditEvent[]> {
    const response = await apiClient.get<
      ApiResponse<{ events: UserAuditEvent[] }>
    >("/users/audit", { params: { limit } });
    return response.data.data.events;
  },
};
