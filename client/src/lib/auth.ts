import { apiRequest } from "./queryClient";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
  position?: string;
  photoUrl?: string;
}

export interface LoginResponse {
  user: AuthUser;
  token: string;
}

export const authApi = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const response = await apiRequest("POST", "/api/auth/login", { email, password });
    return response.json();
  },

  register: async (name: string, email: string, password: string): Promise<LoginResponse> => {
    const response = await apiRequest("POST", "/api/auth/register", { name, email, password });
    return response.json();
  },

  getCurrentUser: async (): Promise<AuthUser> => {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("No token");
    
    const response = await fetch("/api/auth/me", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      localStorage.removeItem("token");
      throw new Error("Invalid token");
    }
    
    return response.json();
  },

  logout: () => {
    localStorage.removeItem("token");
  },
};
