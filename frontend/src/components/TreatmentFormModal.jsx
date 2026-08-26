import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import Button from './Button';
import Select from './Select';
import Input from './Input';

const effectivenessOptions = [
  { value: '', label: 'Select Effectiveness' },
  { value: 'poor', label: 'Poor' },
  { value: 'fair', label: 'Fair' },
  { value: 'good', label: 'Good' },
  { value: 'excellent', label: 'Excellent' },
];

export default function TreatmentFormModal({
  isOpen,
  treatment,
  onClose,
  onSubmit,
}) {
  const [status, setStatus] = useState('active');
  const [endDate, setEndDate] = useState('');
  const [outcomeScore, setOutcomeScore] = useState('70');
  const [effectivenessLevel, setEffectivenessLevel] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    if (treatment) {
      setStatus(treatment.status || 'active');
      setEndDate(treatment.end_date || new Date().toISOString().split('T')[0]);
      setOutcomeScore(treatment.outcome_score !== null && treatment.outcome_score !== undefined ? String(treatment.outcome_score) : '70');
      setEffectivenessLevel(treatment.effectiveness_level || '');
      setNotes(treatment.notes || '');
    } else {
      setStatus('active');
      setEndDate(new Date().toISOString().split('T')[0]);
      setOutcomeScore('70');
      setEffectivenessLevel('');
      setNotes('');
    }
    setValidationError('');
  }, [treatment, isOpen]);

  if (!isOpen) return null;

  const isCompletedAlready = treatment?.status === 'completed';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError('');
    setIsSubmitting(true);

    try {
      if (status === 'completed') {
        if (!endDate) {
          throw new Error('End date is required to complete treatment.');
        }
        if (outcomeScore === '' || isNaN(Number(outcomeScore)) || Number(outcomeScore) < 0 || Number(outcomeScore) > 100) {
          throw new Error('Outcome score must be a number between 0 and 100.');
        }
        if (!effectivenessLevel) {
          throw new Error('Effectiveness level is required to complete treatment.');
        }
        if (treatment?.start_date && endDate < treatment.start_date) {
          throw new Error(`End date cannot be before start date (${treatment.start_date}).`);
        }
      }

      await onSubmit({
        status,
        end_date: status === 'completed' ? endDate : null,
        outcome_score: status === 'completed' ? Number(outcomeScore) : null,
        effectiveness_level: status === 'completed' ? effectivenessLevel : null,
        notes,
      });
      onClose();
    } catch (err) {
      setValidationError(err.message || 'Validation failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-[2px]">
      <div className="bg-surface max-w-md w-full border border-borderColor rounded-2xl p-5 shadow-card flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-borderColor/60 pb-2">
          <h2 className="text-[16px] font-bold text-txt-primary">
            {isCompletedAlready ? 'View Treatment Details' : 'View / Update Treatment'}
          </h2>
          <button
            onClick={onClose}
            className="text-txt-muted hover:text-txt-primary text-[13px] font-semibold"
          >
            Close
          </button>
        </div>

        {validationError && (
          <div className="bg-danger/10 border border-danger/30 text-danger rounded-xl p-3 text-[12px] font-semibold">
            {validationError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-txt-muted uppercase tracking-wider block">
              Treatment Protocol Name
            </span>
            <span className="text-[13px] font-bold text-txt-primary block bg-bg-app border border-borderColor/60 rounded-xl px-3 py-2">
              {treatment?.treatment_name || treatment?.treatment || 'Unknown Protocol'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-txt-muted uppercase tracking-wider block">
                Start Date
              </span>
              <span className="text-[12px] font-medium text-txt-primary block bg-bg-app border border-borderColor/60 rounded-xl px-3 py-2">
                {treatment?.start_date || 'N/A'}
              </span>
            </div>
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-txt-muted uppercase tracking-wider block">
                Status
              </span>
              {isCompletedAlready ? (
                <span className="text-[12px] font-bold text-success-bg block bg-success/10 border border-success/30 rounded-xl px-3 py-2 capitalize">
                  Completed
                </span>
              ) : (
                <Select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  options={[
                    { value: 'active', label: 'Active / Ongoing' },
                    { value: 'completed', label: 'Completed' },
                  ]}
                />
              )}
            </div>
          </div>

          {status === 'completed' && (
            <div className="space-y-4 border-t border-borderColor/60 pt-4 animate-in slide-in-from-top-2 duration-200">
              <div className="space-y-1.5">
                <label className="text-[12px] font-bold text-txt-muted block" htmlFor="end-date">
                  End Date / Completion Date
                </label>
                <input
                  id="end-date"
                  type="date"
                  disabled={isCompletedAlready}
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-surface border border-borderColor rounded-xl text-[13px] text-txt-primary focus:outline-none focus:border-info focus:ring-1 focus:ring-info disabled:bg-bg-app disabled:opacity-60 disabled:cursor-not-allowed"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[12px] font-bold text-txt-muted block" htmlFor="outcome-score">
                    Outcome Score (0-100)
                  </label>
                  <Input
                    id="outcome-score"
                    type="number"
                    min="0"
                    max="100"
                    disabled={isCompletedAlready}
                    value={outcomeScore}
                    onChange={(e) => setOutcomeScore(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[12px] font-bold text-txt-muted block" htmlFor="effectiveness">
                    Effectiveness Level
                  </label>
                  <Select
                    id="effectiveness"
                    disabled={isCompletedAlready}
                    value={effectivenessLevel}
                    onChange={(e) => setEffectivenessLevel(e.target.value)}
                    options={effectivenessOptions}
                  />
                </div>
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[12px] font-bold text-txt-muted block" htmlFor="treatment-notes">
              Treatment Notes / Annotations
            </label>
            <textarea
              id="treatment-notes"
              disabled={isCompletedAlready}
              placeholder="Record any clinical notes, dosage transitions, or recovery feedback..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full min-h-24 px-3.5 py-3 bg-surface border border-borderColor rounded-xl text-[13px] text-txt-primary focus:outline-none focus:border-info focus:ring-1 focus:ring-info disabled:bg-bg-app disabled:opacity-60 disabled:cursor-not-allowed"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-borderColor/60">
            <Button type="button" variant="ghost" onClick={onClose}>
              {isCompletedAlready ? 'Close' : 'Cancel'}
            </Button>
            {!isCompletedAlready && (
              <Button type="submit" variant="primary" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Update Treatment'}
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

TreatmentFormModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  treatment: PropTypes.object,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
};
