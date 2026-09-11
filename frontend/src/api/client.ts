import axios from "axios";

// Typed adapter around the real backend. Base URL comes from the
// environment so demo/staging/prod can point at different services
// without a code change.
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15_000,
});

export class ApiError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const detail =
        (error.response?.data as { detail?: string } | undefined)?.detail ??
        error.message;
      return Promise.reject(new ApiError(detail, status));
    }
    return Promise.reject(error);
  }
);
