import apiClient from './client';
import type { LoginRequest, RegisterRequest, TokenResponse, User, MessageResponse } from '../types/api';

export const authApi = {
  login: async (data: LoginRequest): Promise<TokenResponse> => {
    const res = await apiClient.post<TokenResponse>('/auth/login', data);
    return res.data;
  },

  register: async (data: RegisterRequest): Promise<User> => {
    const res = await apiClient.post<User>('/auth/register', data);
    return res.data;
  },

  me: async (): Promise<User> => {
    const res = await apiClient.get<User>('/auth/me');
    return res.data;
  },

  logout: async (): Promise<MessageResponse> => {
    const res = await apiClient.post<MessageResponse>('/auth/logout');
    return res.data;
  },

  changePassword: async (old_password: string, new_password: string): Promise<MessageResponse> => {
    const res = await apiClient.post<MessageResponse>('/auth/change-password', {
      old_password,
      new_password,
    });
    return res.data;
  },

  forgotPassword: async (email: string): Promise<MessageResponse> => {
    const res = await apiClient.post<MessageResponse>('/auth/forgot-password', { email });
    return res.data;
  },
};
