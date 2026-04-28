import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import User, { IUser } from '../models/User';

const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_jwt_key_here';
const APP_URL = process.env.APP_URL || 'http://localhost:3000';

let transporter: nodemailer.Transporter | null = null;

const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }
  return transporter;
};

const sendEmail = async (options: { email: string; subject: string; html: string }) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM || '"Reporting System" <noreply@example.com>',
    to: options.email,
    subject: options.subject,
    html: options.html,
  };

  await getTransporter().sendMail(mailOptions);
};

export const generateToken = (user: IUser) => {
  return jwt.sign(
    { id: user._id, role: user.role, clientId: user.clientId },
    JWT_SECRET,
    { expiresIn: '1d' }
  );
};

export const forgotPassword = async (email: string, baseUrl?: string) => {
  const user = await User.findOne({ email });
  
  if (process.env.NODE_ENV === 'development' && (!process.env.EMAIL_USER || !process.env.EMAIL_PASS)) {
    console.log('\n--- FORGOT PASSWORD DEBUG INFO ---');
    if (!user) {
      console.log(`❌ ERROR: No user found with email: ${email}`);
    } else {
      console.log(`✅ User found: ${user.name} (${user.email})`);
    }
    console.log('----------------------------------\n');
  }

  if (!user) {
    return;
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  user.resetPasswordToken = hashedToken;
  user.resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hour

  await user.save();

  const finalBaseUrl = baseUrl || APP_URL;
  const resetUrl = `${finalBaseUrl}/reset-password/${resetToken}`;
  
  const message = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
      <h2 style="color: #3b82f6;">Reset Your Password</h2>
      <p>Hello,</p>
      <p>You requested a password reset for your account. Please click the button below to set a new password:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetUrl}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Reset Password</a>
      </div>
      <p>If you didn't request this, you can safely ignore this email.</p>
      <p>This link will expire in 1 hour.</p>
      <hr style="border: 0; border-top: 1px solid #eee; margin-top: 30px;">
      <p style="font-size: 12px; color: #666; text-align: center;">Reporting System</p>
    </div>
  `;

  if (process.env.NODE_ENV === 'development' && (!process.env.EMAIL_USER || !process.env.EMAIL_PASS)) {
    console.log('\n--- SIMULATED EMAIL SENT ---');
    console.log(`To: ${user.email}`);
    console.log(`Reset Link: ${resetUrl}`);
    console.log('----------------------------\n');
  } else {
    await sendEmail({
      email: user.email,
      subject: 'Password Reset Request',
      html: message,
    });
  }

  return resetUrl;
};

export const resetPassword = async (token: string, password: string) => {
  const hashedToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpires: { $gt: Date.now() }
  }).select('+resetPasswordToken +resetPasswordExpires');

  if (!user) {
    throw new Error('Token is invalid or has expired');
  }

  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;

  await user.save();
  return user;
};

export const login = async (email: string, password: string) => {
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    throw new Error('Invalid email or password');
  }
  if (!user.isActive) {
    throw new Error('Account is deactivated');
  }

  const token = generateToken(user);
  return { user, token };
};

export const createUser = async (userData: any, creatorRole: string, creatorClientId: string) => {
  // Logic for admin creating users
  if (creatorRole !== 'super_admin') {
    throw new Error('Unauthorized to create users');
  }

  const existingUser = await User.findOne({ email: userData.email });
  if (existingUser) {
    throw new Error('User already exists');
  }

  const user = new User(userData);
  await user.save();
  return user;
};

export const updateUser = async (id: string, userData: any, updaterRole: string) => {
  if (updaterRole !== 'super_admin') {
    throw new Error('Unauthorized to update users');
  }

  const user = await User.findById(id).select('+password');
  if (!user) {
    throw new Error('User not found');
  }

  if (userData.email && userData.email !== user.email) {
    const existingUser = await User.findOne({ email: userData.email });
    if (existingUser) {
      throw new Error('Email already in use');
    }
  }

  // Update fields
  if (userData.name) user.name = userData.name;
  if (userData.email) user.email = userData.email;
  if (userData.role) user.role = userData.role;
  if (userData.clientId) user.clientId = userData.clientId;
  if (userData.isActive !== undefined) user.isActive = userData.isActive;
  
  // Only update password if provided
  if (userData.password && userData.password.trim() !== '') {
    user.password = userData.password;
  }

  await user.save();
  return user;
};

export const deleteUser = async (id: string, deleterRole: string) => {
  if (deleterRole !== 'super_admin') {
    throw new Error('Unauthorized to delete users');
  }

  const user = await User.findByIdAndDelete(id);
  if (!user) {
    throw new Error('User not found');
  }
  return user;
};
