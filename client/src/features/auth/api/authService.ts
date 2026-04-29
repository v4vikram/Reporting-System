import api from '../../../api/axios';
import { User } from '../../../types/index.ts';

export const authService = {
  login: async (credentials: Pick<User, 'email'> & { password?: string }) => {
    const { data } = await api.post<any>('/auth/login', credentials);
    return data;
  },
  forgotPassword: async (email: string) => {
    const { data } = await api.post<{ message: string }>('/auth/forgot-password', { email });
    return data;
  },
  resetPassword: async (token: string, password: string) => {
    const { data } = await api.post<{ message: string }>('/auth/reset-password', { token, password });
    return data;
  },
  getMe: async () => {
    const { data } = await api.get<User>('/auth/me');
    return data;
  },
  getClients: async () => {
    const { data } = await api.get<User[]>('/auth/clients');
    return data;
  },
  getEmployees: async () => {
    const { data } = await api.get<User[]>('/auth/employees');
    return data;
  }
};
