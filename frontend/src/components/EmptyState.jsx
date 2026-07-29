import React from 'react';
import PropTypes from 'prop-types';
import { Database } from 'lucide-react';

export default function EmptyState({
  title = 'No Data Available',
  description = 'There is currently no information to show in this view.',
  icon: Icon = Database,
  className = '',
}) {
  return (
    <div className={`bg-surface border border-borderColor border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center space-y-3.5 max-w-md mx-auto ${className}`}>
      <div className="w-12 h-12 rounded-full bg-bg-app flex items-center justify-center text-txt-muted">
        <Icon className="w-6 h-6" strokeWidth={1.5} />
      </div>
      <div className="space-y-1">
        <h4 className="text-[15px] font-semibold text-txt-primary leading-tight">{title}</h4>
        <p className="text-[12px] text-txt-muted max-w-[280px] mx-auto leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );
}

EmptyState.propTypes = {
  title: PropTypes.string,
  description: PropTypes.string,
  icon: PropTypes.elementType,
  className: PropTypes.string,
};
