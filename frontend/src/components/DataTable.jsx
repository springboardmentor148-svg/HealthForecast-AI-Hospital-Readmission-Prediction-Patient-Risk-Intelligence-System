import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Badge from './Badge';

export default function DataTable({ columns = [], rows = [], itemsPerPage = 5, className = '', density = 'normal', hideFooter = false }) {
  const [currentPage, setCurrentPage] = useState(1);
  
  const totalPages = Math.max(1, Math.ceil(rows.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedRows = rows.slice(startIndex, startIndex + itemsPerPage);

  const handlePrev = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNext = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const isCompact = density === 'compact';

  return (
    <div className={`bg-surface border border-borderColor rounded-2xl shadow-card overflow-hidden flex flex-col justify-between ${className}`}>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-[14px]">
          <thead>
            <tr className="bg-sidebar-bg border-b border-borderColor text-[12px] font-bold text-txt-muted uppercase tracking-wider">
              {columns.map((col) => (
                <th key={col.key} className={`px-4 ${isCompact ? 'py-2.5' : 'py-3.5'} ${col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : ''}`}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          
          <tbody className="divide-y divide-borderColor font-normal text-txt-primary">
            {paginatedRows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center text-txt-muted">
                  No records available.
                </td>
              </tr>
            ) : (
              paginatedRows.map((row, rIdx) => (
                <tr key={rIdx} className="hover:bg-bg-app/40 transition-colors duration-150">
                  {columns.map((col) => {
                    const value = row[col.key];
                    return (
                      <td 
                        key={col.key} 
                        className={`px-4 ${isCompact ? 'py-2 text-[13px]' : 'py-3 text-[14px]'} font-semibold ${
                          col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : ''
                        }`}
                      >
                        {col.type === 'badge' ? (
                          <Badge tone={row[`${col.key}Tone`] || 'info'}>
                            {value}
                          </Badge>
                        ) : col.render ? (
                          col.render(row)
                        ) : (
                          value
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {!hideFooter && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-borderColor bg-surface">
          <span className="text-[12px] text-txt-muted font-medium">
            Showing {rows.length === 0 ? 0 : startIndex + 1} to {Math.min(startIndex + itemsPerPage, rows.length)} of {rows.length} entries
          </span>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrev}
              disabled={currentPage === 1}
              className="px-3 py-1.5 border border-borderColor rounded-xl text-[12px] font-medium hover:bg-bg-app/50 disabled:opacity-40 disabled:hover:bg-transparent transition-all cursor-pointer select-none"
            >
              Previous
            </button>
            <button
              onClick={handleNext}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 border border-borderColor rounded-xl text-[12px] font-medium hover:bg-bg-app/50 disabled:opacity-40 disabled:hover:bg-transparent transition-all cursor-pointer select-none"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

DataTable.propTypes = {
  columns: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      type: PropTypes.oneOf(['text', 'badge']),
      align: PropTypes.oneOf(['left', 'center', 'right']),
      render: PropTypes.func,
    })
  ).isRequired,
  rows: PropTypes.arrayOf(PropTypes.object).isRequired,
  itemsPerPage: PropTypes.number,
  className: PropTypes.string,
};
