// TODO (Phase 6)
//
// Replace mock authentication with backend JWT authentication.
//
// Persist registration using backend APIs.
//
// Authenticate users from the database.
//
// Determine user role after login.
//
// Enable RBAC based on authenticated user.
//
// Remove the developer role-switcher once backend authentication is complete.

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Activity, Mail, CheckCircle2, ArrowLeft } from 'lucide-react';
import Button from '../components/Button';
import Input from '../components/Input';
import Footer from '../components/Footer';
import { useToast } from '../components/Toast';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { showToast } = useToast();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email) {
      showToast({ message: 'Please fill out your registered email address.', variant: 'error' });
      return;
    }
    setIsSubmitted(true);
  };

  // RENDER FORGOT PASSWORD SUCCESS CARD
  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-bg-app flex flex-col justify-between">
        <div className="flex-1 flex flex-col justify-center items-center px-6 py-12">
          <div className="max-w-md w-full text-center space-y-6">
            <div className="bg-surface border border-borderColor rounded-2xl p-8 shadow-card flex flex-col items-center space-y-5">
              <div className="w-12 h-12 rounded-full bg-[#D1FADF] text-[#12B76A] flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              
              <div className="space-y-2">
                <h2 className="text-[20px] font-bold text-txt-primary">Instructions Sent</h2>
                <p className="text-[13px] text-txt-muted leading-relaxed">
                  Password reset instructions have been sent to your registered email address: <strong>{email}</strong>.
                </p>
              </div>

              <Button
                onClick={() => navigate('/login')}
                variant="primary"
                className="w-full font-bold py-2 rounded-xl mt-4"
              >
                Return to Login
              </Button>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // RENDER FORGOT PASSWORD FORM CARD
  return (
    <div className="min-h-screen bg-bg-app flex flex-col justify-between">
      <div className="flex-1 flex flex-col justify-center items-center px-6 py-12">
        <div className="max-w-md w-full space-y-6">
          
          {/* Header */}
          <div className="flex flex-col items-center text-center space-y-2">
            <Link to="/" className="flex items-center gap-2 bg-surface border border-borderColor p-2.5 rounded-2xl shadow-sm">
              <Activity className="w-6 h-6 text-info animate-pulse" />
            </Link>
            <h2 className="text-[20px] font-extrabold text-txt-primary">Reset Password</h2>
            <p className="text-[13px] text-txt-muted">Provide your clinician account email address to receive reset links.</p>
          </div>

          {/* Card */}
          <div className="bg-surface border border-borderColor rounded-2xl p-6 md:p-8 shadow-card">
            <form onSubmit={handleSubmit} className="space-y-4">
              
              <div className="space-y-1.5">
                <label className="text-[12px] font-bold text-txt-muted block pl-1" htmlFor="reset-email">
                  Registered Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-2.5 w-4 h-4 text-txt-muted" />
                  <Input
                    id="reset-email"
                    type="email"
                    placeholder="name@organization.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-10"
                    required
                  />
                </div>
              </div>

              <div className="pt-4 space-y-3">
                <Button
                  type="submit"
                  variant="primary"
                  className="w-full font-bold h-10 rounded-xl"
                >
                  Send Reset Link
                </Button>
                
                <Link 
                  to="/login"
                  className="text-[12px] font-bold text-txt-muted hover:text-txt-primary flex items-center justify-center gap-1.5 pt-2 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Return to Sign In</span>
                </Link>
              </div>

            </form>
          </div>

        </div>
      </div>
      <Footer />
    </div>
  );
}
