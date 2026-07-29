import React from 'react';
import PropTypes from 'prop-types';

export default function Button({ 
  children, 
  variant = 'primary', 
  type = 'button', 
  onClick, 
  disabled = false, 
  className = '' 
}) {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-150 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed text-[14px] px-4 py-2.5';
  
  let variantClasses = '';
  switch (variant) {
    case 'primary':
      variantClasses = 'bg-txt-primary text-surface hover:bg-opacity-90 focus:ring-2 focus:ring-txt-primary/20';
      break;
    case 'ghost':
      variantClasses = 'bg-transparent border border-borderColor text-txt-primary hover:bg-bg-app focus:ring-2 focus:ring-borderColor';
      break;
    case 'danger':
      variantClasses = 'bg-danger text-surface hover:bg-opacity-95 focus:ring-2 focus:ring-danger/20';
      break;
    default:
      variantClasses = 'bg-txt-primary text-surface';
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses} ${className}`}
    >
      {children}
    </button>
  );
}

Button.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf(['primary', 'ghost', 'danger']),
  type: PropTypes.oneOf(['button', 'submit', 'reset']),
  onClick: PropTypes.func,
  disabled: PropTypes.bool,
  className: PropTypes.string,
};
