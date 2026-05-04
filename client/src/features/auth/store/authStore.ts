import { create } from 'zustand';
import { User } from '../../../types/index.ts';

  interface AuthState {
    user: User | null;
    token: string | null;
    login: (user: User, token: string) => void;
    logout: () => void;
  }

export const useAuthStore = create<AuthState>((set) => ({
  user: (() => {
    const user = localStorage.getItem('user');
    if (!user || user === 'undefined' || user === 'null') return null;
    try {
      return JSON.parse(user);
    } catch {
      return null;
    }
  })(),
  token: (() => {
    const token = localStorage.getItem('token');
    if (!token || token === 'undefined' || token === 'null') return null;
    return token;
  })(),
  login: (user, token) => {
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('token', token);
    set({ user, token });
  },
  logout: () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    set({ user: null, token: null });
  }
}));
