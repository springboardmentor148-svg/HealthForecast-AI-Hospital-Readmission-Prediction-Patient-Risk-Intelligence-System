import React from 'react';
import PropTypes from 'prop-types';

export default function LoadingSkeleton({ type = 'card', count = 1, className = '' }) {
  const renderSkeleton = (idx) => {
    if (type === 'table') {
      return (
        <div key={idx} className="bg-surface border border-borderColor rounded-2xl p-5 space-y-4 shadow-card">
          <div className="h-6 bg-borderColor/50 rounded-lg w-1/4 animate-pulse" />
          <div className="space-y-3">
            {[1, 2, 3].map((row) => (
              <div key={row} className="flex gap-4">
                <div className="h-10 bg-borderColor/40 rounded-xl flex-1 animate-pulse" />
                <div className="h-10 bg-borderColor/40 rounded-xl flex-1 animate-pulse" />
                <div className="h-10 bg-borderColor/40 rounded-xl flex-1 animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (type === 'stat') {
      return (
        <div key={idx} className="bg-surface border border-borderColor rounded-2xl p-5 shadow-card space-y-3">
          <div className="flex justify-between items-center">
            <div className="h-4 bg-borderColor/50 rounded-lg w-1/2 animate-pulse" />
            <div className="w-8 h-8 rounded-xl bg-borderColor/50 animate-pulse" />
          </div>
          <div className="h-8 bg-borderColor/60 rounded-xl w-1/3 animate-pulse" />
        </div>
      );
    }

    // Default: card skeleton
    return (
      <div key={idx} className="bg-surface border border-borderColor rounded-2xl p-6 shadow-card space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-borderColor/50 animate-pulse" />
          <div className="space-y-1.5 flex-1">
            <div className="h-4 bg-borderColor/60 rounded-lg w-1/3 animate-pulse" />
            <div className="h-3 bg-borderColor/40 rounded-lg w-1/4 animate-pulse" />
          </div>
        </div>
        <div className="h-16 bg-borderColor/30 rounded-xl w-full animate-pulse" />
      </div>
    );
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {Array.from({ length: count }).map((_, idx) => renderSkeleton(idx))}
    </div>
  );
}

LoadingSkeleton.propTypes = {
  type: PropTypes.oneOf(['card', 'table', 'stat']),
  count: PropTypes.number,
  className: PropTypes.string,
};
