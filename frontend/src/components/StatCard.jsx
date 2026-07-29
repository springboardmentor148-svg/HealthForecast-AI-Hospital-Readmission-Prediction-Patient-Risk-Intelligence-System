import React from 'react';
import PropTypes from 'prop-types';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

export default function StatCard({
  icon: Icon,
  title,
  subtitle,
  value,
  trend,
  tone = 'info',
  className = '',
}) {
  let circleColor = 'bg-info-bg text-info';
  switch (tone) {
    case 'success':
      circleColor = 'bg-success-bg text-success';
      break;
    case 'warning':
      circleColor = 'bg-warning-bg text-warning';
      break;
    case 'danger':
      circleColor = 'bg-danger-bg text-danger';
      break;
    case 'secondary':
      circleColor = 'bg-secondary-brand-bg text-secondary-brand';
      break;
    case 'info':
    default:
      circleColor = 'bg-info-bg text-info';
  }

  return (
    <div className={`bg-surface border border-borderColor rounded-2xl p-5 shadow-card space-y-3.5 ${className}`}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <span className="text-[14px] font-medium text-txt-muted block leading-none">{title}</span>
          {subtitle && <span className="text-[12px] text-txt-muted/70 block leading-none">{subtitle}</span>}
        </div>
        
        {Icon && (
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${circleColor}`}>
            <Icon className="w-5 h-5" strokeWidth={2} />
          </div>
        )}
      </div>

      <div className="flex items-baseline justify-between pt-1">
        <span className="text-[28px] font-bold text-txt-primary leading-none tracking-tight">{value}</span>
        
        {trend && (() => {
          const isUpward = trend.value.startsWith('+') || !trend.value.startsWith('-');
          return (
            <div 
              className={`inline-flex items-center gap-0.5 text-[12px] font-semibold leading-none px-2 py-1 rounded-lg ${
                trend.isPositive 
                  ? 'bg-success-bg/40 text-success' 
                  : 'bg-danger-bg/40 text-danger'
              }`}
            >
              {isUpward ? (
                <ArrowUpRight className="w-3.5 h-3.5 flex-shrink-0" strokeWidth={2.5} />
              ) : (
                <ArrowDownRight className="w-3.5 h-3.5 flex-shrink-0" strokeWidth={2.5} />
              )}
              <span>{trend.value}</span>
            </div>
          );
        })()}
      </div>
    </div>
  );
}

StatCard.propTypes = {
  icon: PropTypes.elementType,
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  trend: PropTypes.shape({
    value: PropTypes.string.isRequired,
    isPositive: PropTypes.bool.isRequired,
  }),
  tone: PropTypes.oneOf(['success', 'warning', 'danger', 'info', 'secondary']),
  className: PropTypes.string,
};
