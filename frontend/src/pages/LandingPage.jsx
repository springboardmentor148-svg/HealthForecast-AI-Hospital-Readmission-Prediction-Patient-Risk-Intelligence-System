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

import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAnalytics } from '../contexts/AnalyticsContext';
import { 
  Activity, 
  Cpu, 
  HeartPulse, 
  BarChart3, 
  ArrowRight,
} from 'lucide-react';
import Button from '../components/Button';
import Footer from '../components/Footer';
import Badge from '../components/Badge';

export default function LandingPage() {
  const navigate = useNavigate();
  const { modelSummary } = useAnalytics();
  const currentModel = modelSummary?.current_model || null;

  const features = [
    {
      icon: Cpu,
      title: 'Predictive Risk Scoring',
      desc: 'AI-powered patient readmission prediction.',
      color: 'text-info bg-info-bg'
    },
    {
      icon: HeartPulse,
      title: 'Clinical Decision Support',
      desc: 'Supports healthcare professionals with intelligent recommendations.',
      color: 'text-success bg-[#D1FADF]/45'
    },
    {
      icon: Activity,
      title: 'Treatment Effectiveness',
      desc: 'Monitor treatment outcomes and patient recovery trends.',
      color: 'text-secondary bg-[#FCE7F6]/60'
    },
    {
      icon: BarChart3,
      title: 'Healthcare Analytics',
      desc: 'Hospital-wide insights and performance visualization.',
      color: 'text-warning bg-[#FEF0C7]/45'
    }
  ];

  const metrics = [
    { label: 'Final Active Model', value: currentModel?.version || 'No active model yet', desc: 'Ensemble pipeline configuration' },
    { label: 'Discriminative AUC', value: currentModel?.roc_auc || '0.00%', desc: 'Discriminative classification index' },
    { label: 'Classification Accuracy', value: currentModel?.accuracy || '0.00%', desc: 'Optimized decision threshold index' },
    { label: 'Decision Threshold', value: currentModel ? 'Live prediction response' : '—', desc: 'Readmission probability trigger cut' }
  ];

  return (
    <div className="min-h-screen bg-bg-app flex flex-col justify-between font-sans">
      
      {/* 1. Navigation Bar */}
      <nav className="h-16 border-b border-borderColor bg-surface flex items-center justify-between px-6 md:px-12 w-full flex-shrink-0 z-30 sticky top-0 shadow-sm">
        {/* Brand Logo */}
        <div className="flex items-center gap-2.5">
          <div className="bg-info text-surface p-1.5 rounded-lg">
            <Activity className="w-5 h-5" />
          </div>
          <span className="text-[16px] font-bold text-txt-primary leading-none tracking-tight">
            HealthForecast AI
          </span>
        </div>

        {/* Anchor Links */}
        <div className="hidden md:flex items-center gap-8 text-[13px] font-semibold text-txt-muted">
          <a href="#features" className="hover:text-txt-primary transition-colors">Features</a>
          <a href="#highlights" className="hover:text-txt-primary transition-colors">Platform Highlights</a>
          <a href="#about" className="hover:text-txt-primary transition-colors">About</a>
        </div>

        {/* Call to Actions */}
        <div className="flex items-center gap-3">
          <Link to="/login">
            <Button variant="ghost" className="text-[12px] font-bold px-4 py-2 hover:bg-bg-app border border-borderColor rounded-xl">
              Sign In
            </Button>
          </Link>
          <Link to="/register">
            <Button variant="primary" className="text-[12px] font-bold px-4 py-2 rounded-xl">
              Register
            </Button>
          </Link>
        </div>
      </nav>

      {/* Main Contents Container */}
      <main className="flex-1 space-y-20 pb-16">
        
        {/* 2. Hero Section */}
        <section className="max-w-4xl mx-auto text-center pt-20 px-6 space-y-6">
          <Badge tone="info" className="uppercase font-bold tracking-wider px-3.5 py-1 text-[10px]">
            Clinical Decision Intelligence
          </Badge>
          
          <h1 className="text-[28px] md:text-[36px] font-extrabold text-txt-primary leading-tight max-w-2xl mx-auto">
            AI-Powered Hospital Readmission Prediction System
          </h1>
          
          <p className="text-[14px] md:text-[16px] text-txt-muted leading-relaxed max-w-xl mx-auto">
            HealthForecast AI helps healthcare professionals identify patients at risk of hospital readmission using machine learning, enabling earlier intervention and better clinical decision-making.
          </p>

          <div className="flex items-center justify-center gap-4 pt-4">
            <Button 
              onClick={() => navigate('/login')}
              variant="primary" 
              className="flex items-center gap-1.5 font-bold px-8 py-3 rounded-xl shadow-md"
            >
              <span>Sign In</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
            <Button 
              onClick={() => navigate('/register')}
              variant="ghost" 
              className="font-bold px-8 py-3 bg-surface border border-borderColor rounded-xl hover:bg-bg-app transition-colors shadow-sm"
            >
              Create Account
            </Button>
          </div>
        </section>

        {/* 3. Features Section */}
        <section id="features" className="max-w-6xl mx-auto px-6 space-y-10 scroll-mt-20">
          <div className="text-center space-y-2">
            <h2 className="text-[22px] font-bold text-txt-primary">Clinical Feature Modules</h2>
            <p className="text-[13px] text-txt-muted">Intelligent systems designed to optimize discharge workflows.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <div 
                  key={idx} 
                  className="bg-surface border border-borderColor rounded-2xl p-6 shadow-card space-y-4 hover:border-info/30 transition-all duration-200"
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${feat.color}`}>
                    <Icon className="w-5.5 h-5.5" />
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="text-[14px] font-bold text-txt-primary">{feat.title}</h3>
                    <p className="text-[12px] text-txt-muted leading-normal">{feat.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 4. Platform Highlights Section */}
        <section id="highlights" className="max-w-6xl mx-auto px-6 space-y-10 scroll-mt-20">
          <div className="bg-surface border border-borderColor rounded-2xl p-8 shadow-card space-y-8">
            <div className="text-center space-y-2 border-b border-borderColor/60 pb-5">
              <h2 className="text-[20px] font-bold text-txt-primary">Proven Decision Predictors</h2>
              <p className="text-[13px] text-txt-muted">Core machine learning parameters serving active patient evaluations.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-center">
              {metrics.map((metric, idx) => (
                <div key={idx} className="space-y-2 bg-bg-app/50 border border-borderColor/50 p-5 rounded-2xl">
                  <span className="text-[11px] font-bold text-txt-muted uppercase tracking-wider block">
                    {metric.label}
                  </span>
                  <span className="text-[18px] md:text-[20px] font-extrabold text-txt-primary block leading-none font-mono">
                    {metric.value}
                  </span>
                  <span className="text-[11px] text-txt-muted block leading-tight">
                    {metric.desc}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

      </main>

      {/* 5. Footer */}
      <div id="about" className="scroll-mt-10">
        <Footer />
      </div>

    </div>
  );
}
