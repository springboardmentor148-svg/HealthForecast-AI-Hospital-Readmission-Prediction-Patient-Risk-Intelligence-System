import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { useAuth } from './AuthContext';
import { getDashboardSummary } from '../api/dashboard';
import { getAnalyticsOverview } from '../api/analytics';
import { getModelSummary } from '../api/models';

const AnalyticsContext = createContext(null);

export function AnalyticsProvider({ children }) {
  const { isAuthReady, isAuthenticated } = useAuth();
  const [dashboardSummary, setDashboardSummary] = useState(null);
  const [analyticsOverview, setAnalyticsOverview] = useState(null);
  const [modelSummary, setModelSummary] = useState(null);
  const [isAnalyticsLoading, setIsAnalyticsLoading] = useState(false);
  const [analyticsError, setAnalyticsError] = useState('');

  const loadAnalytics = async () => {
    setIsAnalyticsLoading(true);
    setAnalyticsError('');

    try {
      const [dashboard, overview, model] = await Promise.all([
        getDashboardSummary(),
        getAnalyticsOverview(),
        getModelSummary().catch((error) => ({
          error: true,
          status: error.status || 500,
          message: error.message || 'Failed to load model summary',
          model_loaded: null,
        })),
      ]);
      setDashboardSummary(dashboard);
      setAnalyticsOverview(overview);
      setModelSummary(model);
      return { dashboard, overview };
    } catch (error) {
      setAnalyticsError(error?.message || 'Unable to load analytics.');
      throw error;
    } finally {
      setIsAnalyticsLoading(false);
    }
  };

  useEffect(() => {
    let isActive = true;

    async function initializeAnalytics() {
      if (!isAuthReady) return;
      if (!isAuthenticated) {
        if (!isActive) return;
        setDashboardSummary(null);
        setAnalyticsOverview(null);
        setAnalyticsError('');
        setIsAnalyticsLoading(true);
        try {
          const model = await getModelSummary().catch(() => null);
          if (isActive) {
            setModelSummary(model);
          }
        } catch {
          if (isActive) {
            setModelSummary(null);
          }
        } finally {
          if (isActive) {
            setIsAnalyticsLoading(false);
          }
        }
        return;
      }

      try {
        await loadAnalytics();
      } catch {
        if (!isActive) return;
      }
    }

    initializeAnalytics();

    return () => {
      isActive = false;
    };
    // loadAnalytics is intentionally omitted so the bootstrap effect only tracks auth state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthReady, isAuthenticated]);

  const refreshAnalytics = async () => loadAnalytics();

  const value = useMemo(() => ({
    dashboardSummary,
    analyticsOverview,
    modelSummary,
    isAnalyticsLoading,
    analyticsError,
    loadAnalytics: refreshAnalytics,
    refreshAnalytics,
  }), [analyticsError, analyticsOverview, dashboardSummary, isAnalyticsLoading, modelSummary]);

  return <AnalyticsContext.Provider value={value}>{children}</AnalyticsContext.Provider>;
}

AnalyticsProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export function useAnalytics() {
  const context = useContext(AnalyticsContext);
  if (!context) {
    throw new Error('useAnalytics must be used within an AnalyticsProvider');
  }
  return context;
}
