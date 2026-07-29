import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  variant = 'default'
}) {
  const [isLoading, setIsLoading] = useState(false);

  // Reset loading status whenever modal visibility opens/closes
  useEffect(() => {
    if (!isOpen) {
      setIsLoading(false);
    }
  }, [isOpen]);

  // Bind Escape key events to call onCancel safely
  useEffect(() => {
    const handleEscapeKey = (e) => {
      if (e.key === 'Escape' && isOpen && !isLoading) {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleEscapeKey);
    return () => window.removeEventListener('keydown', handleEscapeKey);
  }, [isOpen, isLoading, onCancel]);

  if (!isOpen) return null;

  // Wrap onConfirm inside an async executor to handle loading states
  const handleConfirmClick = async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      await onConfirm();
    } catch (error) {
      console.error('Action confirmation failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelClick = () => {
    if (isLoading) return;
    onCancel();
  };

  const isDanger = variant === 'danger';

  return (
    <div 
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fadeIn"
      onClick={handleCancelClick}
    >
      <div 
        className="bg-surface border border-borderColor rounded-2xl max-w-sm w-full p-6 shadow-xl space-y-5 relative text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Text Details */}
        <div className="space-y-1.5">
          <h3 className="text-[15px] font-bold text-txt-primary leading-snug">
            {title}
          </h3>
          <p className="text-[12.5px] font-semibold text-txt-muted leading-relaxed">
            {message}
          </p>
        </div>

        {/* Buttons Controls */}
        <div className="flex justify-end items-center gap-2.5 pt-1">
          <button
            type="button"
            onClick={handleCancelClick}
            disabled={isLoading}
            className="px-4 py-2 border border-borderColor hover:bg-bg-app rounded-xl text-[12px] font-bold text-txt-muted transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none"
          >
            {cancelLabel}
          </button>
          
          <button
            type="button"
            onClick={handleConfirmClick}
            disabled={isLoading}
            className={`px-4 py-2 rounded-xl text-[12px] font-bold text-surface transition-all cursor-pointer flex items-center justify-center gap-1.5 min-w-[90px] disabled:opacity-70 disabled:cursor-not-allowed select-none ${
              isDanger 
                ? 'bg-danger hover:bg-danger/95 shadow-sm' 
                : 'bg-info hover:bg-info/95 shadow-sm'
            }`}
          >
            {isLoading && (
              <svg className="animate-spin h-3.5 w-3.5 text-surface" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            )}
            <span>{confirmLabel}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

ConfirmDialog.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  title: PropTypes.string.isRequired,
  message: PropTypes.string.isRequired,
  confirmLabel: PropTypes.string,
  cancelLabel: PropTypes.string,
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  variant: PropTypes.oneOf(['default', 'danger'])
};
