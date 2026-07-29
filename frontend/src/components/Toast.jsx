import React, { createContext, useContext, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

function ToastItem({ toast, onDismiss }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss();
    }, 4000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  const { message, variant } = toast;
  
  // Icon and border configuration based on variant
  let icon = <Info className="w-4.5 h-4.5 text-info" />;
  let accentBorder = 'border-l-info';

  if (variant === 'success') {
    icon = <CheckCircle2 className="w-4.5 h-4.5 text-success" />;
    accentBorder = 'border-l-success';
  } else if (variant === 'error') {
    icon = <AlertCircle className="w-4.5 h-4.5 text-danger" />;
    accentBorder = 'border-l-danger';
  }

  return (
    <div 
      className={`pointer-events-auto flex items-start justify-between gap-3 min-w-[300px] max-w-md bg-surface border border-borderColor border-l-4 ${accentBorder} rounded-xl p-3.5 shadow-lg animate-slideIn text-left`}
    >
      <div className="flex gap-2.5 mt-0.5">
        {icon}
        <div className="text-[12px] font-bold text-txt-primary leading-tight select-none">
          {message.split('\n').map((line, idx) => (
            <div key={idx}>{line}</div>
          ))}
        </div>
      </div>
      
      <button 
        onClick={onDismiss}
        className="text-txt-muted hover:text-txt-primary cursor-pointer p-0.5 rounded hover:bg-bg-app transition-colors flex-shrink-0"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

ToastItem.propTypes = {
  toast: PropTypes.shape({
    id: PropTypes.string.isRequired,
    message: PropTypes.string.isRequired,
    variant: PropTypes.oneOf(['success', 'error', 'info']).isRequired
  }).isRequired,
  onDismiss: PropTypes.func.isRequired
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = ({ message, variant = 'info' }) => {
    const id = Date.now() + Math.random().toString(36).substr(2, 9);
    setToasts((prev) => {
      const updated = [...prev, { id, message, variant }];
      // Keep only the latest 3 toasts
      if (updated.length > 3) {
        return updated.slice(updated.length - 3);
      }
      return updated;
    });
  };

  const dismissToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      
      {/* Toast Portals Layer */}
      <div className="fixed top-6 right-6 z-50 flex flex-col gap-3 pointer-events-none">
        {toasts.map((toast) => (
          <ToastItem 
            key={toast.id} 
            toast={toast} 
            onDismiss={() => dismissToast(toast.id)} 
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

ToastProvider.propTypes = {
  children: PropTypes.node.isRequired
};
