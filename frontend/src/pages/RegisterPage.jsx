import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Activity, User, Mail, Shield, CheckCircle2, Building, ArrowLeft } from 'lucide-react';
import Button from '../components/Button';
import Input from '../components/Input';
import Select from '../components/Select';
import Footer from '../components/Footer';
import { useToast } from '../components/Toast';
import { useAuth } from '../contexts/AuthContext';
import { ROLES } from '../config/rbac';
import { uiRoleToBackendRole } from '../utils/auth';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [organization, setOrganization] = useState('');
  const [department, setDepartment] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [requestedRole, setRequestedRole] = useState(ROLES.DOCTOR);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const { showToast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fullName || !email || !employeeId || !password || !confirmPassword) {
      const message = 'Please fill out all required fields.';
      setFormError(message);
      showToast({ message, variant: 'error' });
      return;
    }
    if (password !== confirmPassword) {
      const message = 'Passwords do not match.';
      setFormError(message);
      showToast({ message, variant: 'error' });
      return;
    }

    setIsSubmitting(true);
    setFormError('');

    try {
      await register({
        full_name: fullName,
        email,
        password,
        role: uiRoleToBackendRole(requestedRole),
        department,
      });
      setIsSubmitted(true);
    } catch (error) {
      const message = error?.message || 'Unable to create account.';
      setFormError(message);
      showToast({ message, variant: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const roleOptions = [
    { value: ROLES.DOCTOR, label: 'Doctor' },
    { value: ROLES.ADMINISTRATOR, label: 'Hospital Administrator' },
    { value: ROLES.RESEARCHER, label: 'Healthcare Researcher' },
    { value: ROLES.SYSTEM_ADMIN, label: 'System Administrator' }
  ];

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
                <h2 className="text-[20px] font-bold text-txt-primary">Registration Submitted Successfully</h2>
                <p className="text-[13px] text-txt-muted leading-relaxed">
                  Your registration request has been received. A System Administrator will review and approve your requested role before your account becomes active.
                </p>
              </div>

              <Button
                onClick={() => navigate('/login')}
                variant="primary"
                className="w-full font-bold py-2 rounded-xl mt-4"
              >
                Back to Login
              </Button>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // RENDER REGISTRATION FORM
  return (
    <div className="min-h-screen bg-bg-app flex flex-col justify-between">
      <div className="flex-1 flex flex-col justify-center items-center px-6 py-12">
        <div className="max-w-xl w-full space-y-6">
          
          {/* Header */}
          <div className="flex flex-col items-center text-center space-y-2">
            <Link to="/" className="flex items-center gap-2 bg-surface border border-borderColor p-2.5 rounded-2xl shadow-sm">
              <Activity className="w-6 h-6 text-info animate-pulse" />
            </Link>
            <h2 className="text-[20px] font-extrabold text-txt-primary">Create Clinician Account</h2>
            <p className="text-[13px] text-txt-muted">Submit details to register credential tokens with HealthForecast AI.</p>
          </div>

          {/* Registration Card */}
          <div className="bg-surface border border-borderColor rounded-2xl p-6 md:p-8 shadow-card">
            <form onSubmit={handleSubmit} className="space-y-4">
              {formError && (
                <div className="rounded-xl border border-danger/15 bg-danger-bg/20 px-3.5 py-2 text-[12px] font-semibold text-danger">
                  {formError}
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[12px] font-bold text-txt-muted block pl-1" htmlFor="reg-name">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-2.5 w-4 h-4 text-txt-muted" />
                    <Input
                      id="reg-name"
                      type="text"
                      placeholder="Dr. John Doe"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="pl-10 h-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[12px] font-bold text-txt-muted block pl-1" htmlFor="reg-email">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-2.5 w-4 h-4 text-txt-muted" />
                    <Input
                      id="reg-email"
                      type="email"
                      placeholder="j.doe@organization.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 h-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[12px] font-bold text-txt-muted block pl-1" htmlFor="reg-empid">Employee ID</label>
                  <div className="relative">
                    <Shield className="absolute left-3.5 top-2.5 w-4 h-4 text-txt-muted" />
                    <Input
                      id="reg-empid"
                      type="text"
                      placeholder="EMP-9201"
                      value={employeeId}
                      onChange={(e) => setEmployeeId(e.target.value)}
                      className="pl-10 h-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[12px] font-bold text-txt-muted block pl-1" htmlFor="reg-org">Hospital / Organization</label>
                  <div className="relative">
                    <Building className="absolute left-3.5 top-2.5 w-4 h-4 text-txt-muted" />
                    <Input
                      id="reg-org"
                      type="text"
                      placeholder="Metropolitan Hospital"
                      value={organization}
                      onChange={(e) => setOrganization(e.target.value)}
                      className="pl-10 h-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[12px] font-bold text-txt-muted block pl-1" htmlFor="reg-dept">Department</label>
                  <Input
                    id="reg-dept"
                    type="text"
                    placeholder="e.g. Cardiology"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="h-10"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[12px] font-bold text-txt-muted block pl-1" htmlFor="reg-role">Requested Access Role</label>
                  <Select
                    id="reg-role"
                    options={roleOptions}
                    value={requestedRole}
                    onChange={(e) => setRequestedRole(e.target.value)}
                    className="h-10"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[12px] font-bold text-txt-muted block pl-1" htmlFor="reg-pass">Password</label>
                  <Input
                    id="reg-pass"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-10"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[12px] font-bold text-txt-muted block pl-1" htmlFor="reg-confpass">Confirm Password</label>
                  <Input
                    id="reg-confpass"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="h-10"
                    required
                  />
                </div>
              </div>

              {/* Requested Role alert warning */}
              <div className="bg-bg-app border border-borderColor p-3.5 rounded-xl text-[11px] text-txt-muted font-semibold leading-relaxed mt-2.5">
                ⚠️ <strong>Notice:</strong> Requested access is subject to approval by a System Administrator. Permissions will not be active until verification is signed.
              </div>

              <div className="pt-4 flex items-center justify-between gap-4">
                <Link 
                  to="/login"
                  className="text-[12px] font-bold text-txt-muted hover:text-txt-primary flex items-center gap-1 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Return to Sign In</span>
                </Link>
                
                <Button
                  type="submit"
                  variant="primary"
                  disabled={isSubmitting}
                  className="font-bold px-8 py-2 rounded-xl"
                >
                  {isSubmitting ? 'Creating...' : 'Create Account'}
                </Button>
              </div>

            </form>
          </div>

        </div>
      </div>
      <Footer />
    </div>
  );
}
