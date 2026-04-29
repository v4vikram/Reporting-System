import User, { IUser } from './auth.model';

export const findUserByEmailWithPassword = async (email: string) => {
  return await User.findOne({ email }).select('+password');
};

export const findUserByEmail = async (email: string) => {
  return await User.findOne({ email });
};

export const findUserByResetToken = async (hashedToken: string) => {
  return await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpires: { $gt: Date.now() }
  }).select('+resetPasswordToken +resetPasswordExpires');
};

export const findUserByIdWithPassword = async (id: string) => {
  return await User.findById(id).select('+password');
};

export const findUserById = async (id: string) => {
  return await User.findById(id);
};

export const deleteUserById = async (id: string) => {
  return await User.findByIdAndDelete(id);
};

export const findAllUsers = async () => {
  return await User.find().select('-password').lean();
};

export const findClients = async () => {
  return await User.find({ role: 'client' }).select('-password').lean();
};

export const findEmployees = async () => {
  return await User.find({ role: 'employee' }).select('-password').lean();
};

export const saveUser = async (user: any) => {
  return await user.save();
};

export const createUser = async (userData: any) => {
  const user = new User(userData);
  return await user.save();
};
