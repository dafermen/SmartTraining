import axios from "axios";

export const API_BASE_URL = import.meta.env.VITE_API_URL ?? "/api";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 5_000,
  headers: { Accept: "application/json" },
});

apiClient.interceptors.request.use((configuration) => {
  const token = sessionStorage.getItem("smart-training-token");
  if (token) configuration.headers.Authorization = `Bearer ${token}`;
  return configuration;
});
