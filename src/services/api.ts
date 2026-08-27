const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  timestamp?: string;
}

export interface HealthResponse {
  status: string;
  service: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export const api = {
  baseUrl: API_BASE_URL,

  async getHealth(): Promise<HealthResponse> {
    const response = await fetch(`${API_BASE_URL}/health`);
    if (!response.ok) {
      throw new Error(`Failed to check health: ${response.statusText}`);
    }
    const json: ApiResponse<HealthResponse> = await response.json();
    return json.data;
  },

  async getUsers(): Promise<User[]> {
    const response = await fetch(`${API_BASE_URL}/users`);
    if (!response.ok) {
      throw new Error(`Failed to fetch users: ${response.statusText}`);
    }
    const json: ApiResponse<User[]> = await response.json();
    return json.data;
  },

  async createUser(user: { name: string; email: string; role: string }): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(user),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.message || `Failed to create user: ${response.statusText}`);
    }
    const json: ApiResponse<User> = await response.json();
    return json.data;
  },
};
