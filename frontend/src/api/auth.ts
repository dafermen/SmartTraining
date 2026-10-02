import { apiClient } from "./client";
import type { ApiResponse, AuthUser, LoginResult } from "../types/api";

export const authApi = {
  async login(username: string, password: string): Promise<LoginResult> {
    const response = await apiClient.post<ApiResponse<LoginResult>>(
      "/auth/login",
      {
        username,
        password,
      },
    );
    return response.data.data;
  },

  async me(): Promise<AuthUser> {
    const response =
      await apiClient.get<ApiResponse<{ user: AuthUser }>>("/auth/me");
    return response.data.data.user;
  },

  async logout(): Promise<void> {
    await apiClient.post("/auth/logout");
  },
};
