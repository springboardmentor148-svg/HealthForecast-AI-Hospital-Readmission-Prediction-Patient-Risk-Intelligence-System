import React from 'react';
import PropTypes from 'prop-types';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ROLE_PERMISSIONS } from '../config/rbac';
import EmptyState from './EmptyState';
import { ShieldAlert } from 'lucide-react';

export default function RequirePermission({ permission, children }) {
  const location = useLocation();
  const { currentRole, isAuthenticated, isAuthReady } = useAuth();

  if (!isAuthReady) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  const permissions = ROLE_PERMISSIONS[currentRole] || [];
  const hasPermission = permissions.includes(permission);

  if (!hasPermission) {
    return (
      <div className="py-12 max-w-md mx-auto">
        <EmptyState
          title="Access Restricted"
          description={`Your active clinical role profile (${currentRole}) does not have security clearance to access this module.`}
          icon={ShieldAlert}
          className="bg-surface shadow-card border border-borderColor"
        />
      </div>
    );
  }

  return children;
}

RequirePermission.propTypes = {
  permission: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
};
