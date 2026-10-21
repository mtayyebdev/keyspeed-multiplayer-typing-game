import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useRegisterMutation } from '../features/auth/authApi';
import { Zap, Mail, Lock, Eye, EyeOff, User, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';

export default function RegisterPage() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [register, { isLoading }] = useRegisterMutation();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      await register({ username, email, password }).unwrap();
      navigate('/lobby', { replace: true });
    } catch (err) {
      const msg = err.data?.message;
      if (Array.isArray(msg)) {
        setErrorMsg(msg.join(', '));
      } else {
        setErrorMsg(msg || 'Registration failed. Username or email may already be taken.');
      }
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center py-8">
      <div className="w-full max-w-md">
        <div className="bg-surface rounded-2xl p-8 border border-border shadow-card relative overflow-hidden">
          {/* Heading */}
          <div className="text-center mb-8">
            <div className="w-12 h-12 rounded-2xl bg-accent-soft border border-accent/20 flex items-center justify-center mx-auto mb-4 text-accent shadow-sm">
              <Zap className="w-6 h-6 text-accent" />
            </div>
            <h1 className="text-2xl font-bold text-fg tracking-tight">Create Racer <span className="text-accent">Account</span></h1>
            <p className="text-sm text-fg/60 mt-1">Join the multiplayer typing arena</p>
          </div>

          {/* Error notice */}
          {errorMsg && (
            <div className="mb-6 p-3.5 rounded-xl bg-danger-soft border border-danger/30 text-danger text-sm flex items-center gap-2.5 shadow-sm">
              <AlertCircle className="w-4 h-4 shrink-0 text-danger" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-fg/70 mb-1.5">
                Racer Handle (Username)
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-fg/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  minLength={3}
                  maxLength={20}
                  pattern="^[a-zA-Z0-9_]{3,20}$"
                  title="Alphanumeric characters and underscores only (3-20 characters)"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="VelocityKing"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-bg border border-border text-fg placeholder-fg/40 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all duration-150 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-fg/70 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-fg/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="racer@example.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-bg border border-border text-fg placeholder-fg/40 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all duration-150 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-fg/70 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-fg/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-bg border border-border text-fg placeholder-fg/40 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all duration-150 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-fg/40 hover:text-fg transition-colors p-1 rounded-md cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-accent text-bg font-bold text-sm hover:bg-accent-hover hover:-translate-y-[1px] active:scale-[0.98] transition-all duration-150 flex items-center justify-center gap-2 shadow-sm cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <span>Create Account & Play</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer switch */}
          <div className="mt-6 pt-6 border-t border-border text-center text-xs text-fg/60">
            Already have an account?{' '}
            <Link to="/login" className="text-accent font-semibold hover:underline cursor-pointer">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

