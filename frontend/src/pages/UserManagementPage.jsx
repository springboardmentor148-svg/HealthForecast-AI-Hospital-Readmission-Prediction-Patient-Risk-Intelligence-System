import React, { useState } from 'react';
import { 
  StatCard, 
  DataTable, 
  Badge, 
  Button, 
  Select, 
  Input,
  ConfirmDialog,
  useToast
} from '../components';
import { 
  Users as UsersIcon, 
  UserCheck, 
  UserPlus, 
  Shield, 
  X, 
  Lock, 
  Check, 
  ChevronDown, 
  ChevronUp 
} from 'lucide-react';
import { ROLES, ROLE_PERMISSIONS, PERMISSIONS } from '../config/rbac';

// Mock platform users dataset (10 records)
const initialUsers = [
  { id: '1', name: 'Sarah Reed', email: 's.reed@forecast.ai', initials: 'SR', role: 'Doctor', dept: 'Endocrinology', status: 'active', lastLogin: '2026-07-22' },
  { id: '2', name: 'Albert Luan', email: 'a.luan@forecast.ai', initials: 'AL', role: 'Doctor', dept: 'Internal Medicine', status: 'active', lastLogin: '2026-07-21' },
  { id: '3', name: 'Marcus Sterling', email: 'm.sterling@forecast.ai', initials: 'MS', role: 'Hospital Administrator', dept: 'Hospital-wide', status: 'active', lastLogin: '2026-07-22' },
  { id: '4', name: 'Elena Rostova', email: 'e.rostova@forecast.ai', initials: 'ER', role: 'Healthcare Researcher', dept: 'Anonymized Research Pool', status: 'active', lastLogin: '2026-07-19' },
  { id: '5', name: 'Thomas Vance', email: 't.vance@forecast.ai', initials: 'TV', role: 'System Administrator', dept: 'Platform', status: 'active', lastLogin: '2026-07-22' },
  { id: '6', name: 'Clara Jenkins', email: 'c.jenkins@forecast.ai', initials: 'CJ', role: 'Doctor', dept: 'Cardiology', status: 'active', lastLogin: '2026-07-20' },
  { id: '7', name: 'Victor Vance', email: 'v.vance@forecast.ai', initials: 'VV', role: 'Healthcare Researcher', dept: 'Anonymized Research Pool', status: 'pending', lastLogin: 'Never' },
  { id: '8', name: 'Simon Templar', email: 's.templar@forecast.ai', initials: 'ST', role: 'Hospital Administrator', dept: 'Hospital-wide', status: 'inactive', lastLogin: '2026-06-30' },
  { id: '9', name: 'Raymond Reddington', email: 'r.red@forecast.ai', initials: 'RR', role: 'Doctor', dept: 'Emergency Care', status: 'active', lastLogin: '2026-07-18' },
  { id: '10', name: 'Julianna Margulies', email: 'j.marg@forecast.ai', initials: 'JM', role: 'Healthcare Researcher', dept: 'Anonymized Research Pool', status: 'pending', lastLogin: 'Never' }
];

export default function UserManagementPage() {
  const [users, setUsers] = useState(initialUsers);
  const { showToast } = useToast();
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmLabel: 'Confirm',
    cancelLabel: 'Cancel',
    onConfirm: () => {},
    variant: 'default'
  });
  const [editingUser, setEditingUser] = useState(null);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState(ROLES.DOCTOR);
  
  // Dynamic search/filters toolbar state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('all');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('all');

  // Tracking open actions dropdown
  const [openMenuUserId, setOpenMenuUserId] = useState(null);

  // Edit Role modal state
  const [selectedRole, setSelectedRole] = useState('');
  const [showRbacMatrix, setShowRbacMatrix] = useState(false);

  // Shorten department strings
  const getShortDept = (dept) => {
    const map = {
      'Hospital-wide': 'Hospital-wide',
      'Anonymized Research Pool': 'Research Pool',
      'Internal Medicine': 'Internal Med.',
      'General Medicine': 'Internal Med.',
      'Emergency Care': 'Emergency',
      'Cardiology': 'Cardiology',
      'Endocrinology': 'Endocrinology',
      'Platform': 'Platform'
    };
    return map[dept] || dept;
  };

  // Convert date format e.g. 2026-07-22 to 22 Jul 2026
  const formatLastLogin = (dateStr) => {
    if (dateStr === 'Never') return 'Never';
    const dateMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (dateMatch) {
      const [_, year, month, day] = dateMatch;
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthName = months[parseInt(month, 10) - 1];
      return `${parseInt(day, 10)} ${monthName} ${year}`;
    }
    return dateStr;
  };

  // Invite user submit handler
  const handleInviteUser = (e) => {
    e.preventDefault();
    if (!inviteName || !inviteEmail) {
      showToast({ message: 'Please fill out name and email.', variant: 'error' });
      return;
    }

    const deptMap = {
      [ROLES.DOCTOR]: 'General Medicine',
      [ROLES.ADMINISTRATOR]: 'Hospital-wide',
      [ROLES.RESEARCHER]: 'Anonymized Research Pool',
      [ROLES.SYSTEM_ADMIN]: 'Platform'
    };

    const newUser = {
      id: String(users.length + 1),
      name: inviteName,
      email: inviteEmail,
      initials: inviteName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2),
      role: inviteRole,
      dept: deptMap[inviteRole] || 'General',
      status: 'pending',
      lastLogin: 'Never'
    };

    setUsers([...users, newUser]);
    setShowInviteModal(false);
    setInviteName('');
    setInviteEmail('');
    setInviteRole(ROLES.DOCTOR);
    showToast({ message: `Invitation sent successfully to ${newUser.email}`, variant: 'success' });
  };

  // Edit Role update submit handler
  const handleUpdateRole = (e) => {
    e.preventDefault();
    if (!editingUser || !selectedRole) return;

    const deptMap = {
      [ROLES.DOCTOR]: 'General Medicine',
      [ROLES.ADMINISTRATOR]: 'Hospital-wide',
      [ROLES.RESEARCHER]: 'Anonymized Research Pool',
      [ROLES.SYSTEM_ADMIN]: 'Platform'
    };

    const updated = users.map(u => {
      if (u.id === editingUser.id) {
        return { 
          ...u, 
          role: selectedRole,
          dept: deptMap[selectedRole] || u.dept
        };
      }
      return u;
    });

    setUsers(updated);
    setEditingUser(null);
    showToast({ message: `Account role profile for ${editingUser.name} updated to ${selectedRole}.`, variant: 'success' });
  };

  const handleDeactivate = (userId, userName) => {
    const targetUser = users.find(u => u.id === userId);
    if (!targetUser) return;
    
    const isCurrentlyActive = targetUser.status === 'active';
    const actionLabel = isCurrentlyActive ? 'Deactivate' : 'Activate';
    const dialogVariant = isCurrentlyActive ? 'danger' : 'default';
    
    setConfirmDialog({
      isOpen: true,
      title: `${actionLabel} User Account`,
      message: `Are you sure you want to ${actionLabel.toLowerCase()} the account for user: ${userName}?`,
      confirmLabel: actionLabel,
      cancelLabel: 'Cancel',
      variant: dialogVariant,
      onConfirm: async () => {
        await new Promise((resolve) => setTimeout(resolve, 400));
        const updated = users.map(u => {
          if (u.id === userId) {
            return { ...u, status: u.status === 'active' ? 'inactive' : 'active' };
          }
          return u;
        });
        setUsers(updated);
        showToast({ message: `Account for ${userName} has been successfully ${isCurrentlyActive ? 'deactivated' : 'activated'}.`, variant: 'success' });
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleResetPassword = (email, userName) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Reset User Password',
      message: `Are you sure you want to dispatch a password reset link to ${userName} (${email})? This will invalidate their current password.`,
      confirmLabel: 'Reset Password',
      cancelLabel: 'Cancel',
      variant: 'danger',
      onConfirm: async () => {
        await new Promise((resolve) => setTimeout(resolve, 450));
        showToast({ message: `Reset password email link successfully dispatched to ${email}`, variant: 'success' });
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const getPermissionsPreview = (role) => {
    switch (role) {
      case ROLES.DOCTOR:
        return {
          can: ['View patient directory (assigned)', 'Access medical history (assigned)', 'Run readmission predictions', 'View treatment effectiveness reports'],
          cannot: ['Edit/Add patients', 'View hospital-wide analytics', 'Export research datasets', 'Manage user directory', 'Configure model parameters']
        };
      case ROLES.ADMINISTRATOR:
        return {
          can: ['View patient directory (hospital-wide)', 'View medical history logs (view-only)', 'Run predictions', 'View treatment effectiveness', 'Access hospital-wide analytics'],
          cannot: ['Add/Edit patient records', 'Export research datasets', 'Manage user directory', 'Configure model parameters']
        };
      case ROLES.RESEARCHER:
        return {
          can: ['View patient directory (anonymized)', 'View treatment effectiveness', 'Access aggregate analytics', 'Export anonymized research datasets'],
          cannot: ['View patient PII / identities', 'View individual medical history details', 'Run individual predictions', 'Manage user directory', 'Configure model parameters']
        };
      case ROLES.SYSTEM_ADMIN:
        return {
          can: ['Full access to all platform modules', 'Add/Edit patient records', 'Manage user accounts directory', 'Configure and deploy machine learning models'],
          cannot: []
        };
      default:
        return { can: [], cannot: [] };
    }
  };

  const preview = getPermissionsPreview(selectedRole || editingUser?.role);

  // Columns definition mapping
  const columns = [
    {
      key: 'user',
      label: 'User',
      render: (row) => (
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-info-bg text-info font-bold text-[11px] flex items-center justify-center border border-info/10 flex-shrink-0">
            {row.initials}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[13px] font-bold text-txt-primary leading-tight">{row.name}</span>
            <span className="text-[10px] text-txt-muted/80 leading-none">{row.email}</span>
          </div>
        </div>
      )
    },
    {
      key: 'role',
      label: 'Role',
      render: (row) => {
        const shortRoles = {
          [ROLES.DOCTOR]: 'Doctor',
          [ROLES.ADMINISTRATOR]: 'Hospital Admin',
          [ROLES.RESEARCHER]: 'Researcher',
          [ROLES.SYSTEM_ADMIN]: 'System Admin'
        };
        const tone = 
          row.role === ROLES.SYSTEM_ADMIN ? 'danger' :
          row.role === ROLES.ADMINISTRATOR ? 'warning' :
          row.role === ROLES.RESEARCHER ? 'secondary' : 'info';
        return (
          <Badge tone={tone} className="text-[9px] font-bold uppercase py-0 px-2 whitespace-nowrap">
            {shortRoles[row.role] || row.role}
          </Badge>
        );
      }
    },
    { 
      key: 'dept', 
      label: 'Department/Scope',
      render: (row) => (
        <span className="whitespace-nowrap text-[13px] text-txt-primary">
          {getShortDept(row.dept)}
        </span>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => (
        <Badge 
          tone={row.status === 'active' ? 'success' : row.status === 'pending' ? 'warning' : 'danger'} 
          className="text-[9px] font-bold uppercase py-0 px-2 whitespace-nowrap"
        >
          {row.status}
        </Badge>
      )
    },
    { 
      key: 'lastLogin', 
      label: 'Last Login',
      render: (row) => (
        <span className="font-mono text-txt-muted text-[12px] whitespace-nowrap">
          {formatLastLogin(row.lastLogin)}
        </span>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      align: 'right',
      render: (row) => (
        <div className="flex items-center gap-1.5 justify-end relative">
          <Button
            onClick={() => {
              setEditingUser(row);
              setSelectedRole(row.role);
            }}
            variant="ghost"
            className="text-[11px] py-1 px-2.5 border border-borderColor rounded-lg text-txt-primary hover:bg-bg-app font-bold cursor-pointer transition-colors"
          >
            Edit
          </Button>

          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setOpenMenuUserId(openMenuUserId === row.id ? null : row.id);
              }}
              className="p-1 text-txt-muted hover:text-txt-primary hover:bg-bg-app rounded-lg transition-colors cursor-pointer select-none font-bold"
            >
              ⋮
            </button>
            
            {openMenuUserId === row.id && (
              <div className="absolute right-0 mt-1 bg-surface border border-borderColor rounded-xl shadow-lg py-1 w-36 z-50 text-left">
                <button
                  onClick={() => {
                    handleDeactivate(row.id, row.name);
                    setOpenMenuUserId(null);
                  }}
                  className="w-full text-left px-3 py-1.5 text-[11px] hover:bg-bg-app font-semibold text-txt-primary bg-transparent border-none cursor-pointer"
                >
                  {row.status === 'active' ? 'Deactivate' : 'Activate'}
                </button>
                <button
                  onClick={() => {
                    handleResetPassword(row.email, row.name);
                    setOpenMenuUserId(null);
                  }}
                  className="w-full text-left px-3 py-1.5 text-[11px] hover:bg-bg-app font-semibold text-txt-primary bg-transparent border-none cursor-pointer"
                >
                  Reset Password
                </button>
                <button
                  onClick={() => {
                    showToast({
                      message: `User Profile Overview:\nName: ${row.name}\nEmail: ${row.email}\nAssigned Scope: ${row.dept}`,
                      variant: 'info'
                    });
                    setOpenMenuUserId(null);
                  }}
                  className="w-full text-left px-3 py-1.5 text-[11px] hover:bg-bg-app font-semibold text-txt-primary bg-transparent border-none cursor-pointer"
                >
                  View User
                </button>
              </div>
            )}
          </div>
        </div>
      )
    }
  ];

  const roleSelectOptions = [
    { value: ROLES.DOCTOR, label: ROLES.DOCTOR },
    { value: ROLES.ADMINISTRATOR, label: ROLES.ADMINISTRATOR },
    { value: ROLES.RESEARCHER, label: ROLES.RESEARCHER },
    { value: ROLES.SYSTEM_ADMIN, label: ROLES.SYSTEM_ADMIN }
  ];

  // Filtering Logic
  const filteredUsers = users.filter((u) => {
    const matchesSearch = 
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      u.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRole = selectedRoleFilter === 'all' || u.role === selectedRoleFilter;
    const matchesStatus = selectedStatusFilter === 'all' || u.status === selectedStatusFilter;
    const matchesDept = selectedDeptFilter === 'all' || u.dept === selectedDeptFilter;

    return matchesSearch && matchesRole && matchesStatus && matchesDept;
  });

  // Totals calculations
  const totalUsersCount = users.length;
  const activeCount = users.filter(u => u.status === 'active').length;
  const pendingCount = users.filter(u => u.status === 'pending').length;

  return (
    <div className="space-y-6" onClick={() => setOpenMenuUserId(null)}>
      {/* Title Header */}
      <div>
        <h1 className="text-[20px] font-semibold text-txt-primary">User Management</h1>
        <p className="text-[14px] text-txt-muted mt-1">Manage platform accounts, roles, and access permissions.</p>
      </div>

      {/* 1. Summary StatCards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          icon={UsersIcon}
          title="Total User Accounts"
          value={String(totalUsersCount)}
          subtitle="Registered accounts in system"
          trend={{ value: 'Accounts total', isPositive: true }}
          tone="info"
        />
        <StatCard
          icon={UserCheck}
          title="Active Sessions"
          value={String(activeCount)}
          subtitle="Users with login permissions"
          trend={{ value: 'Serving', isPositive: true }}
          tone="success"
        />
        <StatCard
          icon={UserPlus}
          title="Pending Invitations"
          value={String(pendingCount)}
          subtitle="Invitations awaiting signup"
          trend={{ value: 'Awaiting action', isPositive: false }}
          tone="warning"
        />
        <StatCard
          icon={Shield}
          title="Access Roles Configured"
          value="4 Roles"
          subtitle="Clearance matrix profiles"
          trend={{ value: 'RBAC enforced', isPositive: true }}
          tone="secondary"
        />
      </div>

      {/* 2. Platform Users DataTable */}
      <div className="bg-surface border border-borderColor rounded-2xl p-5 shadow-card space-y-4">
        
        {/* 7. Toolbar Block */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-borderColor/60 pb-4">
          <div className="flex flex-col sm:flex-row gap-2 flex-1 max-w-xl">
            {/* Search Input */}
            <div className="relative flex-1">
              <Input
                type="text"
                placeholder="Search users by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8.5 text-[12px] pl-3"
              />
            </div>
            
            {/* Dropdown Filters */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="w-28 sm:w-32">
                <Select
                  id="role-filter"
                  options={[
                    { value: 'all', label: 'All Roles' },
                    { value: ROLES.DOCTOR, label: 'Doctor' },
                    { value: ROLES.ADMINISTRATOR, label: 'Hospital Admin' },
                    { value: ROLES.RESEARCHER, label: 'Researcher' },
                    { value: ROLES.SYSTEM_ADMIN, label: 'System Admin' }
                  ]}
                  value={selectedRoleFilter}
                  onChange={(e) => setSelectedRoleFilter(e.target.value)}
                  className="h-8.5 text-[11px]"
                />
              </div>

              <div className="w-28 sm:w-32">
                <Select
                  id="status-filter"
                  options={[
                    { value: 'all', label: 'All Status' },
                    { value: 'active', label: 'Active' },
                    { value: 'inactive', label: 'Inactive' },
                    { value: 'pending', label: 'Pending' }
                  ]}
                  value={selectedStatusFilter}
                  onChange={(e) => setSelectedStatusFilter(e.target.value)}
                  className="h-8.5 text-[11px]"
                />
              </div>

              <div className="w-32 sm:w-36">
                <Select
                  id="dept-filter"
                  options={[
                    { value: 'all', label: 'All Depts' },
                    { value: 'Hospital-wide', label: 'Hospital-wide' },
                    { value: 'Anonymized Research Pool', label: 'Research Pool' },
                    { value: 'Internal Medicine', label: 'Internal Med.' },
                    { value: 'Emergency Care', label: 'Emergency' },
                    { value: 'Cardiology', label: 'Cardiology' },
                    { value: 'Endocrinology', label: 'Endocrinology' }
                  ]}
                  value={selectedDeptFilter}
                  onChange={(e) => setSelectedDeptFilter(e.target.value)}
                  className="h-8.5 text-[11px]"
                />
              </div>
            </div>
          </div>

          <Button 
            onClick={() => setShowInviteModal(true)} 
            variant="primary"
            className="font-bold flex items-center gap-1.5 h-8.5 text-[12px] px-4 rounded-xl self-start lg:self-auto shrink-0 shadow-sm"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Invite New User</span>
          </Button>
        </div>

        {/* 9. Scrollable Compact Table */}
        <div className="overflow-x-auto">
          <DataTable columns={columns} rows={filteredUsers} itemsPerPage={10} density="compact" />
        </div>
      </div>

      {/* 5. Role Permissions Reference Card (Collapsible) */}
      <div className="bg-surface border border-borderColor rounded-2xl p-5 shadow-card space-y-4">
        <button
          onClick={() => setShowRbacMatrix(!showRbacMatrix)}
          className="w-full flex items-center justify-between border-none bg-transparent text-left cursor-pointer p-0"
        >
          <div>
            <h3 className="text-[15px] font-bold text-txt-primary">RBAC Permissions Matrix Reference</h3>
            <p className="text-[12px] text-txt-muted mt-0.5">Platform feature access authorization levels by user security role.</p>
          </div>
          {showRbacMatrix ? <ChevronUp className="w-5 h-5 text-txt-muted" /> : <ChevronDown className="w-5 h-5 text-txt-muted" />}
        </button>

        {showRbacMatrix && (
          <div className="border-t border-borderColor/60 pt-4 overflow-x-auto">
            <table className="w-full text-left text-[12px] border-collapse min-w-[700px] font-semibold text-txt-primary">
              <thead>
                <tr className="border-b border-borderColor/60 text-txt-muted text-[10px] uppercase tracking-wider">
                  <th className="py-2.5">Feature Module</th>
                  <th className="py-2.5">Doctor</th>
                  <th className="py-2.5">Hospital Administrator</th>
                  <th className="py-2.5">Healthcare Researcher</th>
                  <th className="py-2.5">System Administrator</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-borderColor/40">
                <tr>
                  <td className="py-3">View Patient Directory</td>
                  <td className="py-3 text-info">Yes (Assigned)</td>
                  <td className="py-3 text-info">Yes (Full)</td>
                  <td className="py-3 text-secondary">Yes (Anonymized)</td>
                  <td className="py-3 text-success">Yes</td>
                </tr>
                <tr>
                  <td className="py-3">Add/Edit Patient Records</td>
                  <td className="py-3 text-danger">No</td>
                  <td className="py-3 text-danger">No</td>
                  <td className="py-3 text-danger">No</td>
                  <td className="py-3 text-success">Yes</td>
                </tr>
                <tr>
                  <td className="py-3">View Medical History</td>
                  <td className="py-3 text-info">Yes (Assigned)</td>
                  <td className="py-3 text-info">Yes (View-only)</td>
                  <td className="py-3 text-danger">No</td>
                  <td className="py-3 text-success">Yes</td>
                </tr>
                <tr>
                  <td className="py-3">Run Readmission Predictor</td>
                  <td className="py-3 text-info">Yes</td>
                  <td className="py-3 text-info">Yes</td>
                  <td className="py-3 text-danger">No</td>
                  <td className="py-3 text-success">Yes</td>
                </tr>
                <tr>
                  <td className="py-3">Treatment Effectiveness</td>
                  <td className="py-3 text-info">Yes</td>
                  <td className="py-3 text-info">Yes</td>
                  <td className="py-3 text-info">Yes</td>
                  <td className="py-3 text-success">Yes</td>
                </tr>
                <tr>
                  <td className="py-3">Analytics & Population Reports</td>
                  <td className="py-3 text-info">Yes (Limited Scope)</td>
                  <td className="py-3 text-info">Yes (Full)</td>
                  <td className="py-3 text-secondary">Yes (Aggregated)</td>
                  <td className="py-3 text-success">Yes</td>
                </tr>
                <tr>
                  <td className="py-3">Export Research Dataset</td>
                  <td className="py-3 text-danger">No</td>
                  <td className="py-3 text-danger">No</td>
                  <td className="py-3 text-success">Yes</td>
                  <td className="py-3 text-success">Yes</td>
                </tr>
                <tr>
                  <td className="py-3">User Accounts Directory Management</td>
                  <td className="py-3 text-danger">No</td>
                  <td className="py-3 text-danger">No</td>
                  <td className="py-3 text-danger">No</td>
                  <td className="py-3 text-success">Yes</td>
                </tr>
                <tr>
                  <td className="py-3">AI Pipeline & Model Management</td>
                  <td className="py-3 text-danger">No</td>
                  <td className="py-3 text-danger">No</td>
                  <td className="py-3 text-danger">No</td>
                  <td className="py-3 text-success">Yes</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 4. Invite User Modal Overlay */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <form onSubmit={handleInviteUser} className="bg-surface border border-borderColor rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4 relative" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setShowInviteModal(false)}
              className="absolute right-4 top-4 text-txt-muted hover:text-txt-primary cursor-pointer p-1 rounded-lg hover:bg-bg-app"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <span className="text-[11px] text-info font-bold uppercase tracking-wider block">Invite Member</span>
              <h3 className="text-[16px] font-bold text-txt-primary">Create Pending Invitation</h3>
            </div>

            <div className="border-t border-borderColor/60 pt-4 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[12px] font-bold text-txt-muted" htmlFor="invite-name">Full Name</label>
                <Input
                  id="invite-name"
                  type="text"
                  placeholder="e.g. John Doe"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[12px] font-bold text-txt-muted" htmlFor="invite-email">Email Address</label>
                <Input
                  id="invite-email"
                  type="email"
                  placeholder="e.g. j.doe@forecast.ai"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[12px] font-bold text-txt-muted" htmlFor="invite-role">Platform Access Role</label>
                <Select
                  id="invite-role"
                  options={roleSelectOptions}
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-3">
              <Button
                type="button"
                onClick={() => setShowInviteModal(false)}
                variant="ghost"
                className="font-bold border border-borderColor hover:bg-bg-app px-4"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                className="font-bold px-5"
              >
                Send Invite
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* 3. Edit Role Modal Overlay */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={(e) => e.stopPropagation()}>
          <form onSubmit={handleUpdateRole} className="bg-surface border border-borderColor rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4 relative">
            <button
              type="button"
              onClick={() => setEditingUser(null)}
              className="absolute right-4 top-4 text-txt-muted hover:text-txt-primary cursor-pointer p-1 rounded-lg hover:bg-bg-app"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <span className="text-[11px] text-info font-bold uppercase tracking-wider block">Access Adjustment</span>
              <h3 className="text-[16px] font-bold text-txt-primary">Edit Role: {editingUser.name}</h3>
            </div>

            <div className="border-t border-borderColor/60 pt-4 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[12px] font-bold text-txt-muted" htmlFor="edit-role-select">Select New Role</label>
                <Select
                  id="edit-role-select"
                  options={roleSelectOptions}
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                />
              </div>

              {/* RBAC dynamic permissions preview */}
              <div className="bg-bg-app border border-borderColor p-4 rounded-xl space-y-3">
                <div className="flex items-center gap-1.5 text-info font-bold text-[13px]">
                  <Shield className="w-4 h-4" />
                  <span>Effective Permissions Preview:</span>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[12px] leading-relaxed">
                  <div className="space-y-1">
                    <span className="font-bold text-success block">Authorized Access:</span>
                    {preview.can.length > 0 ? (
                      <ul className="list-disc list-inside space-y-0.5 text-txt-primary font-medium">
                        {preview.can.map((c, i) => (
                          <li key={i} className="marker:text-success">{c}</li>
                        ))}
                      </ul>
                    ) : (
                      <span className="text-txt-muted italic">None</span>
                    )}
                  </div>

                  <div className="space-y-1">
                    <span className="font-bold text-danger block">Restricted Access:</span>
                    {preview.cannot.length > 0 ? (
                      <ul className="list-disc list-inside space-y-0.5 text-txt-muted font-medium">
                        {preview.cannot.map((c, i) => (
                          <li key={i} className="marker:text-danger">{c}</li>
                        ))}
                      </ul>
                    ) : (
                      <span className="text-success font-bold flex items-center gap-0.5">
                        <Check className="w-3.5 h-3.5" /> Full Unrestricted Access
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="text-[13px] text-txt-muted hover:text-txt-primary bg-transparent border-none font-bold cursor-pointer"
              >
                Cancel
              </button>
              <Button
                type="submit"
                variant="primary"
                className="font-bold px-6"
              >
                Save Role Config
              </Button>
            </div>
          </form>
        </div>
      )}

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmLabel={confirmDialog.confirmLabel}
        cancelLabel={confirmDialog.cancelLabel}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
        variant={confirmDialog.variant}
      />
    </div>
  );
}
