import React from 'react';
import PropTypes from 'prop-types';

export default function Badge({ children, tone = 'info', className = '' }) {
  let toneClasses = '';
  switch (tone) {
    case 'danger':
      toneClasses = 'bg-danger-bg text-danger border border-danger/10';
      break;
    case 'warning':
      toneClasses = 'bg-warning-bg text-warning border border-warning/10';
      break;
    case 'success':
      toneClasses = 'bg-success-bg text-success border border-success/10';
      break;
    case 'info':
      toneClasses = 'bg-info-bg text-info border border-info/10';
      break;
    case 'secondary':
      toneClasses = 'bg-secondary-brand-bg text-secondary-brand border border-secondary-brand/10';
      break;
    default:
      toneClasses = 'bg-info-bg text-info border border-info/10';
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[12px] font-medium leading-none ${toneClasses} ${className}`}
    >
      {children}
    </span>
  );
}

Badge.propTypes = {
  children: PropTypes.node.isRequired,
  tone: PropTypes.oneOf(['danger', 'warning', 'success', 'info', 'secondary']),
  className: PropTypes.string,
};
