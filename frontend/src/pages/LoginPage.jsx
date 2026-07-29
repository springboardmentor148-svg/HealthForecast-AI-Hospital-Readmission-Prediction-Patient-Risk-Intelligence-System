import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Activity, Lock, Mail, ArrowRight } from 'lucide-react';
import Button from '../components/Button';
import Input from '../components/Input';
import Footer from '../components/Footer';
import { useToast } from '../components/Toast';
import { useAuth } from '../contexts/AuthContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const { showToast } = useToast();

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      const message = 'Please fill out all credentials.';
      setFormError(message);
      showToast({ message, variant: 'error' });
      return;
    }

    setIsSubmitting(true);
    setFormError('');

    try {
      await login(email, password);
      navigate('/dashboard', { replace: true });
    } catch (error) {
      const message = error?.message || 'Unable to sign in.';
      setFormError(message);
      showToast({ message, variant: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-app flex flex-col justify-between">
      <div className="flex-1 flex flex-col justify-center items-center px-6 py-12">
        <div className="max-w-md w-full space-y-6">
          
          {/* Brand Header */}
          <div className="flex flex-col items-center text-center space-y-2">
            <Link to="/" className="flex items-center gap-2 bg-surface border border-borderColor p-2.5 rounded-2xl shadow-sm">
              <Activity className="w-6 h-6 text-info animate-pulse" />
            </Link>
            <h2 className="text-[20px] font-extrabold text-txt-primary">Sign In to HealthForecast AI</h2>
            <p className="text-[13px] text-txt-muted">Enter your email and credentials to access risk scoring models.</p>
          </div>

          {/* Login Card */}
          <div className="bg-surface border border-borderColor rounded-2xl p-6 md:p-8 shadow-card space-y-6">
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              {formError && (
                <div className="rounded-xl border border-danger/15 bg-danger-bg/20 px-3.5 py-2 text-[12px] font-semibold text-danger">
                  {formError}
                </div>
              )}
              
              <div className="space-y-1.5">
                <label className="text-[12px] font-bold text-txt-muted block pl-1" htmlFor="email-input">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-2.5 w-4 h-4 text-txt-muted" />
                  <Input
                    id="email-input"
                    type="email"
                    placeholder="name@organization.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center pl-1">
                  <label className="text-[12px] font-bold text-txt-muted" htmlFor="password-input">
                    Password
                  </label>
                  <Link 
                    to="/forgot-password" 
                    className="text-[11px] font-bold text-info hover:text-info/80 hover:underline"
                  >
                    Forgot Password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-2.5 w-4 h-4 text-txt-muted" />
                  <Input
                    id="password-input"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 h-10"
                    required
                  />
                </div>
              </div>

              {/* Remember Me Toggle */}
              <div className="flex items-center gap-2 pl-1 pt-1.5">
                <input
                  id="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 accent-info bg-surface border-borderColor rounded cursor-pointer"
                />
                <label 
                  htmlFor="remember-me" 
                  className="text-[12px] font-semibold text-txt-muted select-none cursor-pointer"
                >
                  Remember this device for 30 days
                </label>
              </div>

              <div className="pt-4">
                <Button
                  type="submit"
                  variant="primary"
                  disabled={isSubmitting}
                  className="w-full font-bold flex items-center justify-center gap-1.5 h-10 rounded-xl"
                >
                  <span>{isSubmitting ? 'Signing In...' : 'Sign In'}</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>

            </form>
          </div>

          {/* bottom helper links */}
          <div className="text-center text-[12px] font-semibold text-txt-muted">
            <span>Don't have an account? </span>
            <Link to="/register" className="text-info hover:underline hover:text-info/80 font-bold ml-0.5">
              Create Account
            </Link>
          </div>

        </div>
      </div>
      <Footer />
    </div>
  );
}
