import React from 'react';
import PropTypes from 'prop-types';

export default function Input({
  id,
  type = 'text',
  placeholder = '',
  value,
  onChange,
  disabled = false,
  required = false,
  className = '',
  min,
  max,
}) {
  const baseClasses = 'w-full h-10 px-3.5 bg-surface border border-borderColor rounded-xl text-[14px] text-txt-primary font-normal focus:outline-none focus:border-info focus:ring-1 focus:ring-info transition-all placeholder:text-txt-muted/70 disabled:bg-bg-app disabled:opacity-60 disabled:cursor-not-allowed';

  return (
    <input
      id={id}
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      disabled={disabled}
      required={required}
      min={min}
      max={max}
      className={`${baseClasses} ${className}`}
    />
  );
}

Input.propTypes = {
  id: PropTypes.string,
  type: PropTypes.string,
  placeholder: PropTypes.string,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func,
  disabled: PropTypes.bool,
  required: PropTypes.bool,
  className: PropTypes.string,
  min: PropTypes.number,
  max: PropTypes.number,
};
