import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextType {
  showToast: (type: ToastType, message: string) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  warning: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

const ICONS: Record<ToastType, React.FC<{ size: number }>> = {
  success: ({ size }) => <CheckCircle size={size} color="var(--color-accent)" />,
  error:   ({ size }) => <XCircle     size={size} color="var(--color-danger)" />,
  warning: ({ size }) => <AlertTriangle size={size} color="var(--color-warning)" />,
  info:    ({ size }) => <Info        size={size} color="var(--color-primary)" />,
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((type: ToastType, message: string) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const ctx: ToastContextType = {
    showToast,
    success: (m) => showToast('success', m),
    error:   (m) => showToast('error', m),
    warning: (m) => showToast('warning', m),
    info:    (m) => showToast('info', m),
  };

  return (
    <ToastContext.Provider value={ctx}>
      {children}
      <div className="toast-container">
        {toasts.map(({ id, type, message }) => {
          const Icon = ICONS[type];
          return (
            <div key={id} className={`toast ${type}`}>
              <Icon size={18} />
              <span style={{ flex: 1, fontSize: 14 }}>{message}</span>
              <button
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}
                onClick={() => setToasts((prev) => prev.filter((t) => t.id !== id))}
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
};
