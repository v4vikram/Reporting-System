import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Lock, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { authService } from '../api/authService.ts';

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setMessage('Passwords do not match');
      setStatus('error');
      return;
    }

    if (password.length < 6) {
      setMessage('Password must be at least 6 characters');
      setStatus('error');
      return;
    }

    setStatus('loading');
    try {
      const data = await authService.resetPassword(token!, password);
      setMessage(data.message);
      setStatus('success');
      setTimeout(() => navigate('/login'), 5000);
    } catch (err: any) {
      setMessage(err.response?.data?.message || 'Something went wrong');
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg p-4">
        <div className="bg-card p-8 rounded-xl border border-border w-full max-w-md text-center">
          <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-500" />
          </div>
          <h1 className="text-2xl font-bold text-text-primary">Password Reset!</h1>
          <p className="text-text-secondary mt-2 mb-8">
            Your password has been reset successfully. Redirecting you to login...
          </p>
          <Link
            to="/login"
            className="inline-block w-full bg-accent hover:bg-accent/90 text-white px-4 py-2 rounded-lg transition-all font-medium"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg p-4">
      <div className="bg-card p-8 rounded-xl border border-border w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-accent" />
          </div>
          <h1 className="text-2xl font-bold text-text-primary">Set New Password</h1>
          <p className="text-text-secondary mt-2">
            Please choose a strong password that you haven't used before.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {status === 'error' && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-4 rounded-lg text-center text-sm">
              {message}
            </div>
          )}
          
          <div className="space-y-1">
            <label className="block text-sm font-medium text-text-secondary">New Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-bg border border-border rounded-lg pl-4 pr-12 py-2 text-text-primary focus:ring-1 focus:ring-accent outline-none"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary transition-colors"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-text-secondary">Confirm New Password</label>
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-bg border border-border rounded-lg px-4 py-2 text-text-primary focus:ring-1 focus:ring-accent outline-none"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={status === 'loading'}
            className="w-full bg-accent hover:bg-accent/90 disabled:opacity-50 text-white px-4 py-2 rounded-lg transition-all font-medium mt-2"
          >
            {status === 'loading' ? 'Resetting...' : 'Reset password'}
          </button>
        </form>
      </div>
    </div>
  );
}
