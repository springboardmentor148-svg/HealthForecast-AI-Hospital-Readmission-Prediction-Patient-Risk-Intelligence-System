import React from 'react';
import PropTypes from 'prop-types';

export default function Select({
  id,
  options = [],
  value,
  onChange,
  disabled = false,
  required = false,
  className = '',
}) {
  const baseClasses = 'w-full h-10 px-3.5 bg-surface border border-borderColor rounded-xl text-[14px] text-txt-primary font-normal focus:outline-none focus:border-info focus:ring-1 focus:ring-info transition-all disabled:bg-bg-app disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer';

  return (
    <select
      id={id}
      value={value}
      onChange={onChange}
      disabled={disabled}
      required={required}
      className={`${baseClasses} ${className}`}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

Select.propTypes = {
  id: PropTypes.string,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      label: PropTypes.string.isRequired,
    })
  ).isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func,
  disabled: PropTypes.bool,
  required: PropTypes.bool,
  className: PropTypes.string,
};
