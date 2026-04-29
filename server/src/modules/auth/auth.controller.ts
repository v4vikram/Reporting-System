import { asyncHandler } from '../../utils/asyncHandler';
import { AppError } from '../../utils/appError';
import { Request, Response } from 'express';
import * as authService from './auth.service';
import { sendResponse } from '../../utils/responseHandler';

export const login = asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;
  const { user, token } = await authService.login(email, password);
  
  // Remove password from response
  const userObj = user.toObject();
  delete userObj.password;

  sendResponse(res, 200, { user: userObj, token }, 'Login successful');
});

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body;
  const origin = req.get('origin') || req.get('referer');
  // If referer, strip the path to get just the origin
  const baseUrl = origin ? new URL(origin).origin : undefined;
  
  await authService.forgotPassword(email, baseUrl);
  sendResponse(res, 200, null, 'If an account exists with that email, a password reset link has been sent.');
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
    const { token, password } = req.body;
  await authService.resetPassword(token, password);
  sendResponse(res, 200, null, 'Password has been reset successfully.');
});

export const getCurrentUser = asyncHandler(async (req: any, res: Response) => {
    const user = await authService.getUserById(req.user.id);
  if (!user) {
    throw new AppError('User not found', 404);
  }
  sendResponse(res, 200, user, 'User fetched');
});

export const createManagedUser = asyncHandler(async (req: any, res: Response) => {
    const user = await authService.createUser(
    req.body,
    req.user.role,
    req.user.clientId
  );
  sendResponse(res, 201, user, 'User created');
});

export const updateManagedUser = asyncHandler(async (req: any, res: Response) => {
    const user = await authService.updateUser(
    req.params.id,
    req.body,
    req.user.role
  );
  sendResponse(res, 200, user, 'User updated');
});

export const deleteManagedUser = asyncHandler(async (req: any, res: Response) => {
    await authService.deleteUser(
    req.params.id,
    req.user.role
  );
  sendResponse(res, 200, null, 'User deleted successfully');
});

export const getUsers = asyncHandler(async (req: any, res: Response) => {
    const users = await authService.getUsers();
  sendResponse(res, 200, users, 'Users fetched');
});

export const getClients = asyncHandler(async (req: any, res: Response) => {
    const clients = await authService.getClients();
  sendResponse(res, 200, clients, 'Clients fetched');
});

export const getEmployees = asyncHandler(async (req: any, res: Response) => {
    const employees = await authService.getEmployees();
  sendResponse(res, 200, employees, 'Employees fetched');
});
