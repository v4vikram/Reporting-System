import api from '../../../api/axios';
import { User } from '../../../types/index.ts';

export const userService = {
  getUsers: async (params?: any) => {
    const { data } = await api.get<User[]>('/auth/users', { params });
    return data;
  },
  createUser: async (userData: Partial<User> & { password?: string }) => {
    const { data } = await api.post<User>('/auth/users', userData);
    return data;
  },
  updateUser: async (id: string, userData: Partial<User> & { password?: string }) => {
    const { data } = await api.put<User>(`/auth/users/${id}`, userData);
    return data;
  },
  deleteUser: async (id: string) => {
    const { data } = await api.delete(`/auth/users/${id}`);
    return data;
  }
};
