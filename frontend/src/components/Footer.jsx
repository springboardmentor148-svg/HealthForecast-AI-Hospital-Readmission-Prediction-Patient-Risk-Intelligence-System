import React from 'react';
import { Activity } from 'lucide-react';
import { useToast } from './Toast';

export default function Footer() {
  const { showToast } = useToast();
  return (
    <footer className="border-t border-borderColor/60 bg-surface/50 py-3 px-6 w-full mt-auto flex-shrink-0 z-20">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-center text-[11px] font-semibold text-txt-muted">
        
        {/* Left segment: Logo, copyright, and system summary in one line */}
        <div className="flex items-center gap-2 flex-wrap justify-center">
          <div className="bg-info text-surface p-0.5 rounded">
            <Activity className="w-3 h-3" />
          </div>
          <span className="font-bold text-txt-primary">HealthForecast AI</span>
          <span className="text-borderColor">•</span>
          <span>© 2026. All Rights Reserved.</span>
          <span className="text-borderColor hidden md:inline">•</span>
          <span className="hidden md:inline">AI-powered Patient Risk Intelligence System.</span>
        </div>

        {/* Right segment: Navigation links and version in one line */}
        <div className="flex items-center gap-3 flex-wrap justify-center">
          <div className="flex items-center gap-2">
            <a 
              href="#privacy" 
              onClick={(e) => { e.preventDefault(); showToast({ message: 'Privacy Policy document reference.', variant: 'info' }); }}
              className="hover:text-txt-primary hover:underline transition-colors"
            >
              Privacy Policy
            </a>
            <span className="text-borderColor">•</span>
            <a 
              href="#terms" 
              onClick={(e) => { e.preventDefault(); showToast({ message: 'Terms of Service document reference.', variant: 'info' }); }}
              className="hover:text-txt-primary hover:underline transition-colors"
            >
              Terms of Service
            </a>
            <span className="text-borderColor">•</span>
            <a 
              href="#contact" 
              onClick={(e) => { e.preventDefault(); showToast({ message: 'Helpdesk Support ticket portal.', variant: 'info' }); }}
              className="hover:text-txt-primary hover:underline transition-colors"
            >
              Contact
            </a>
          </div>
          <span className="text-borderColor">•</span>
          <span className="font-mono bg-bg-app border border-borderColor/40 px-1.5 py-0.5 rounded text-[10px]">
            v1.2.0
          </span>
        </div>

      </div>
    </footer>
  );
}
