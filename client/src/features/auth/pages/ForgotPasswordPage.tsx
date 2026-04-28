import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Mail } from 'lucide-react';
import { authService } from '../api/authService.ts';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    try {
      const data = await authService.forgotPassword(email);
      setMessage(data.message);
      setStatus('success');
    } catch (err: any) {
      setMessage(err.response?.data?.message || 'Something went wrong');
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg p-4">
      <div className="bg-card p-8 rounded-xl border border-border w-full max-w-md">
        <div className="mb-6">
          <Link to="/login" className="inline-flex items-center text-sm text-text-secondary hover:text-accent transition-colors">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to login
          </Link>
        </div>

        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8 text-accent" />
          </div>
          <h1 className="text-2xl font-bold text-text-primary">Forgot Password?</h1>
          <p className="text-text-secondary mt-2">
            Enter your email address and we'll send you a link to reset your password.
          </p>
        </div>

        {status === 'success' ? (
          <div className="bg-green-500/10 border border-green-500/50 text-green-500 p-4 rounded-lg text-center mb-6">
            {message}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {status === 'error' && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-4 rounded-lg text-center">
                {message}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full bg-bg border border-border rounded-lg px-4 py-2 text-text-primary focus:ring-1 focus:ring-accent outline-none transition-all placeholder:text-text-secondary/50"
              />
            </div>
            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full bg-accent hover:bg-accent/90 disabled:opacity-50 text-white px-4 py-2 rounded-lg transition-all font-medium"
            >
              {status === 'loading' ? 'Sending link...' : 'Send reset link'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
