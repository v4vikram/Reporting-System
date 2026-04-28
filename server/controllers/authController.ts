import { Request, Response } from 'express';
import * as authService from '../services/authService';
import User from '../models/User';

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const { user, token } = await authService.login(email, password);
    
    // Remove password from response
    const userObj = user.toObject();
    delete userObj.password;

    res.json({ user: userObj, token });
  } catch (err: any) {
    res.status(401).json({ message: err.message });
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const origin = req.get('origin') || req.get('referer');
    // If referer, strip the path to get just the origin
    const baseUrl = origin ? new URL(origin).origin : undefined;
    
    await authService.forgotPassword(email, baseUrl);
    res.json({ message: 'If an account exists with that email, a password reset link has been sent.' });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, password } = req.body;
    await authService.resetPassword(token, password);
    res.json({ message: 'Password has been reset successfully. You can now login with your new password.' });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const getCurrentUser = async (req: any, res: Response) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const createManagedUser = async (req: any, res: Response) => {
  try {
    const user = await authService.createUser(
      req.body,
      req.user.role,
      req.user.clientId
    );
    res.status(201).json(user);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const updateManagedUser = async (req: any, res: Response) => {
  try {
    const user = await authService.updateUser(
      req.params.id,
      req.body,
      req.user.role
    );
    res.json(user);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const deleteManagedUser = async (req: any, res: Response) => {
  try {
    await authService.deleteUser(
      req.params.id,
      req.user.role
    );
    res.json({ message: 'User deleted successfully' });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const getUsers = async (req: any, res: Response) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const getClients = async (req: any, res: Response) => {
  try {
    const clients = await User.find({ role: 'client' }).select('-password');
    res.json(clients);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const getEmployees = async (req: any, res: Response) => {
  try {
    const employees = await User.find({ role: 'employee' }).select('-password');
    res.json(employees);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};
