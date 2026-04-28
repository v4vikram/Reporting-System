import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '../features/users/api/userService.ts';
import { User } from '../types/index.ts';

export const useUsers = (params?: any) => {
  return useQuery({
    queryKey: ['users', params],
    queryFn: () => userService.getUsers(params)
  });
};

export const useCreateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<User> & { password?: string }) => userService.createUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    }
  });
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<User> & { password?: string } }) => userService.updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    }
  });
};

export const useDeleteUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => userService.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    }
  });
};

// --- Auth specific role fetches ---
import { authService } from '../features/auth/api/authService.ts';

export const useClients = (options: any = {}) => {
  return useQuery<any[], Error>({
    queryKey: ['clients'],
    queryFn: authService.getClients,
    ...options
  });
};

export const useEmployees = (options: any = {}) => {
  return useQuery<any[], Error>({
    queryKey: ['employees'],
    queryFn: authService.getEmployees,
    ...options
  });
};
