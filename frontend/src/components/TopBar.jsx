import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { X, Search, Bell, Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { usePatient } from '../contexts/PatientContext';
import { useAuth } from '../contexts/AuthContext';
import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead } from '../api/notifications';

const ROUTE_LABELS = {
  '/dashboard': 'Dashboard',
  '/patients': 'Patients',
  '/predict': 'Predictions',
  '/predictions': 'Predictions',
  '/predictions/history': 'Prediction History',
  '/clinical-support': 'Clinical Support',
  '/treatment-effectiveness': 'Treatment Metrics',
  '/analytics': 'Analytics',
  '/model-performance': 'AI Model Management',
  '/model-management': 'AI Model Management',
  '/user-management': 'User Directory Management',
  '/profile': 'Profile',
};

const getTabLabel = (pathname) => {
  if (ROUTE_LABELS[pathname]) return ROUTE_LABELS[pathname];
  
  // Matches patient detail: /patients/:id
  const detailMatch = pathname.match(/^\/patients\/([^/]+)$/);
  if (detailMatch) return `Patient Dossier #${detailMatch[1]}`;
  
  // Matches predict form: /patients/:id/predict
  const predictMatch = pathname.match(/^\/patients\/([^/]+)\/predict$/);
  if (predictMatch) return `Risk Predictor #${predictMatch[1]}`;
  
  // Matches predict result: /patients/:id/predict/result
  const resultMatch = pathname.match(/^\/patients\/([^/]+)\/predict\/result$/);
  if (resultMatch) return `Outcomes #${resultMatch[1]}`;

  // Matches predict result by ID: /predictions/:id
  const predictionsIdMatch = pathname.match(/^\/predictions\/([^/]+)$/);
  if (predictionsIdMatch && predictionsIdMatch[1] !== 'history') {
    return `Result #${predictionsIdMatch[1]}`;
  }
  
  return pathname;
};

export default function TopBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const pathname = location.pathname;
  const { setSelectedPatient, patients } = usePatient();
  const tabsContainerRef = useRef(null);

  // Open tabs state: array of { id, label, href }
  const [tabs, setTabs] = useState(() => {
    const saved = window.sessionStorage.getItem('healthforecast_open_tabs');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (e) {
        console.error('Failed to parse open tabs from sessionStorage:', e);
      }
    }
    return [{ id: '/dashboard', label: 'Dashboard', href: '/dashboard' }];
  });

  useEffect(() => {
    window.sessionStorage.setItem('healthforecast_open_tabs', JSON.stringify(tabs));
  }, [tabs]);

  // Scroll Chevron visibility states
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Floating widgets toggle state
  const [showSearch, setShowSearch] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const { isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const unreadCount = notifications.filter(n => !n.read_status).length;

  const fetchNotifications = async () => {
    if (!isAuthenticated) return;
    try {
      setLoading(true);
      const data = await getNotifications();
      setNotifications(data.notifications || []);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
    } else {
      setNotifications([]);
    }
  }, [isAuthenticated, pathname]);

  useEffect(() => {
    const handleRefresh = () => {
      fetchNotifications();
    };
    window.addEventListener('refresh-notifications', handleRefresh);
    return () => {
      window.removeEventListener('refresh-notifications', handleRefresh);
    };
  }, [isAuthenticated]);

  // Check scroll container bounds
  const checkScroll = () => {
    const el = tabsContainerRef.current;
    if (el) {
      setCanScrollLeft(el.scrollLeft > 2);
      setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 2);
    }
  };

  // Scroll helpers
  const handleScroll = (direction) => {
    const el = tabsContainerRef.current;
    if (el) {
      const amount = direction === 'left' ? -180 : 180;
      el.scrollBy({ left: amount, behavior: 'smooth' });
    }
  };

  // Listen to scroll events
  useEffect(() => {
    const el = tabsContainerRef.current;
    if (el) {
      el.addEventListener('scroll', checkScroll);
      // Run once on load
      checkScroll();
    }
    return () => el?.removeEventListener('scroll', checkScroll);
  }, [tabs]);

  // Handle resizing / tab adjustments
  useEffect(() => {
    checkScroll();
  }, [tabs, pathname]);

  // Open a tab whenever pathname changes, capping total tabs at 6
  useEffect(() => {
    if (pathname && pathname !== '/login') {
      const label = getTabLabel(pathname);
      setTabs((prev) => {
        if (prev.some((t) => t.id === pathname)) {
          return prev;
        }
        const updated = [...prev, { id: pathname, label, href: pathname }];
        if (updated.length > 6) {
          // Find oldest tab that isn't active AND is not '/dashboard' (Dashboard is protected)
          const removeIdx = updated.findIndex((t) => t.id !== pathname && t.id !== '/dashboard');
          if (removeIdx !== -1) {
            return updated.filter((_, i) => i !== removeIdx);
          }
        }
        return updated;
      });
    }
  }, [pathname]);

  const handleTabClick = (href) => {
    navigate(href);
  };

  const handleCloseTab = (id, e) => {
    e.stopPropagation();
    
    const closedIndex = tabs.findIndex((t) => t.id === id);
    let nextPath = '/dashboard';
    
    const filtered = tabs.filter((t) => t.id !== id);
    if (pathname === id && filtered.length > 0) {
      const nextActiveIdx = Math.min(closedIndex, filtered.length - 1);
      nextPath = filtered[nextActiveIdx].href;
      navigate(nextPath);
    }
    
    setTabs(filtered);
  };

  const handleSearchSelect = (patient) => {
    setSelectedPatient(patient);
    setShowSearch(false);
    setSearchQuery('');
    navigate(`/patients/${patient.id}`);
  };

  // Client-side search filters
  const searchResults = searchQuery
    ? patients.filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 5)
    : [];

  return (
    <header className="h-14 border-b border-borderColor bg-surface flex items-center justify-between px-6 flex-shrink-0 relative z-30">
      
      {/* 1 & 2 & 3. Dynamic Horizontally Scrollable Tab Strip with Chevrons */}
      <div className="flex-1 h-full overflow-hidden relative mr-4 flex items-end">
        {/* Left Scroll Chevron */}
        {canScrollLeft && (
          <button
            onClick={() => handleScroll('left')}
            className="absolute left-0 bottom-1 hover:bg-borderColor/50 bg-surface/90 border border-borderColor rounded-full p-1 cursor-pointer flex items-center justify-center z-20 shadow-sm"
          >
            <ChevronLeft className="w-3.5 h-3.5 text-txt-primary" />
          </button>
        )}

        {/* Scroll Container */}
        <div
          ref={tabsContainerRef}
          className="flex items-end h-full gap-1 overflow-x-auto scrollbar-none whitespace-nowrap w-full pl-6 pr-6"
        >
          {tabs.map((tab) => {
            const isActive = pathname === tab.href;
            return (
              <div
                key={tab.id}
                onClick={() => handleTabClick(tab.href)}
                className={`flex items-center gap-2 px-3.5 py-1.5 text-[12px] font-bold rounded-t-xl transition-all duration-150 border-t border-x cursor-pointer select-none -mb-[1px] flex-shrink-0 ${
                  isActive
                    ? 'bg-surface border-borderColor text-txt-primary border-b-surface z-10'
                    : 'bg-transparent border-transparent text-txt-muted hover:bg-sidebar-bg hover:text-txt-primary border-b-borderColor'
                }`}
              >
                <span>{tab.label}</span>
                {tab.id !== '/dashboard' && tabs.length > 1 && (
                  <button
                    onClick={(e) => handleCloseTab(tab.id, e)}
                    className="p-0.5 rounded-full hover:bg-borderColor/50 text-txt-muted hover:text-txt-primary transition-colors cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Right Scroll Chevron */}
        {canScrollRight && (
          <button
            onClick={() => handleScroll('right')}
            className="absolute right-0 bottom-1 hover:bg-borderColor/50 bg-surface/90 border border-borderColor rounded-full p-1 cursor-pointer flex items-center justify-center z-20 shadow-sm"
          >
            <ChevronRight className="w-3.5 h-3.5 text-txt-primary" />
          </button>
        )}
      </div>

      {/* Global Utilities Icon Cluster */}
      <div className="flex items-center gap-4 flex-shrink-0 w-32 justify-end relative">
        
        {/* 1. Interactive Search */}
        <div className="relative">
          <button
            onClick={() => {
              setShowSearch(!showSearch);
              setShowNotifications(false);
              setShowCalendar(false);
            }}
            className={`p-2 rounded-xl transition-all cursor-pointer ${
              showSearch ? 'bg-bg-app text-txt-primary' : 'text-txt-muted hover:text-txt-primary hover:bg-bg-app'
            }`}
          >
            <Search className="w-4.5 h-4.5" />
          </button>

          {showSearch && (
            <div className="absolute right-0 top-10 w-80 bg-surface border border-borderColor rounded-2xl shadow-xl p-4 z-40 space-y-3">
              <div className="flex items-center justify-between border-b border-borderColor/60 pb-2">
                <span className="text-[12px] font-bold text-txt-primary">Search Patient Records</span>
                <button onClick={() => setShowSearch(false)} className="text-txt-muted hover:text-txt-primary bg-transparent border-none">
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <input
                type="text"
                placeholder="Type name (e.g. Oswald, Franklin)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-9 px-3 bg-bg-app border border-borderColor rounded-xl text-[12px] font-semibold text-txt-primary focus:outline-none focus:ring-1 focus:ring-info"
                autoFocus
              />

              {searchQuery && (
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {searchResults.length > 0 ? (
                    searchResults.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => handleSearchSelect(p)}
                        className="p-2 hover:bg-bg-app rounded-xl cursor-pointer text-[12px] font-bold text-txt-primary flex justify-between items-center transition-colors"
                      >
                        <span>{p.name}</span>
                        <span className={`text-[9px] py-0.5 px-2 rounded-full font-bold uppercase ${
                          p.riskBand === 'high' ? 'bg-[#FEE4E2] text-[#F97066]' :
                          p.riskBand === 'moderate' ? 'bg-[#FEF0C7] text-[#F79009]' :
                          'bg-[#D1FADF] text-[#12B76A]'
                        }`}>
                          {p.riskBand}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-[11px] text-txt-muted italic text-center py-2">No matching patients found.</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 2. Interactive Notifications Bell */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowSearch(false);
              setShowCalendar(false);
              if (!showNotifications) {
                fetchNotifications();
              }
            }}
            className={`p-2 rounded-xl transition-all cursor-pointer relative ${
              showNotifications ? 'bg-bg-app text-txt-primary' : 'text-txt-muted hover:text-txt-primary hover:bg-bg-app'
            }`}
          >
            <Bell className="w-4.5 h-4.5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-danger rounded-full" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-10 w-80 bg-surface border border-borderColor rounded-2xl shadow-xl p-4 z-40 space-y-3">
              <div className="flex items-center justify-between border-b border-borderColor/60 pb-2">
                <div className="flex items-center gap-2">
                  <span className="text-[12px] font-bold text-txt-primary">Clinical System Alerts</span>
                  {unreadCount > 0 && (
                    <span className="text-[9px] bg-danger/10 text-danger px-1.5 py-0.5 rounded-full font-extrabold">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={async () => {
                        try {
                          await markAllNotificationsAsRead();
                          fetchNotifications();
                        } catch (err) {
                          console.error(err);
                        }
                      }}
                      className="text-[10px] text-info hover:text-info-hover bg-transparent border-none cursor-pointer font-bold"
                    >
                      Mark all read
                    </button>
                  )}
                  <button onClick={() => setShowNotifications(false)} className="text-txt-muted hover:text-txt-primary bg-transparent border-none cursor-pointer">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-none">
                {notifications.length > 0 ? (
                  notifications.map((notif) => {
                    const isUnread = !notif.read_status;
                    let typeClass = "bg-[#EDE9FE] border-[#7A5AF8]/10 text-info";
                    let blockToneClass = "text-[#7A5AF8]";
                    
                    if (notif.notification_type === "HIGH_RISK_PREDICTION") {
                      typeClass = "bg-danger-bg/20 border-danger/10 text-danger";
                      blockToneClass = "text-danger";
                    } else if (
                      notif.notification_type === "TREATMENT_COMPLETED" || 
                      notif.notification_type === "CSV_IMPORT_COMPLETED"
                    ) {
                      typeClass = "bg-success-bg/20 border-success/10 text-success";
                      blockToneClass = "text-success";
                    } else if (
                      notif.notification_type === "PATIENT_UPDATED" || 
                      notif.notification_type === "CLINICAL_SUPPORT_DRAFT_SAVED"
                    ) {
                      typeClass = "bg-[#FEF0C7]/40 border-[#F79009]/10 text-warning";
                      blockToneClass = "text-[#F79009]";
                    }
                    
                    return (
                      <div
                        key={notif.id}
                        onClick={async () => {
                          if (isUnread) {
                            try {
                              await markNotificationAsRead(notif.id);
                              fetchNotifications();
                            } catch (err) {
                              console.error(err);
                            }
                          }
                        }}
                        className={`p-2.5 rounded-xl border transition-all duration-150 relative space-y-1 ${typeClass} ${
                          isUnread ? 'cursor-pointer hover:brightness-95 font-semibold' : 'opacity-65'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`text-[12px] font-bold block ${blockToneClass}`}>
                            {notif.title}
                          </span>
                          {isUnread && (
                            <span className="w-1.5 h-1.5 bg-danger rounded-full flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-[11px] text-txt-primary leading-tight font-semibold">
                          {notif.message}
                        </p>
                        <span className="text-[9px] text-txt-muted block text-right pt-0.5">
                          {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-6 text-txt-muted text-[11px] italic font-semibold">
                    No notifications yet.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 3. Interactive Calendar */}
        <div className="relative">
          <button
            onClick={() => {
              setShowCalendar(!showCalendar);
              setShowSearch(false);
              setShowNotifications(false);
            }}
            className={`p-2 rounded-xl transition-all cursor-pointer ${
              showCalendar ? 'bg-bg-app text-txt-primary' : 'text-txt-muted hover:text-txt-primary hover:bg-bg-app'
            }`}
          >
            <CalendarIcon className="w-4.5 h-4.5" />
          </button>

          {showCalendar && (
            <div className="absolute right-0 top-10 w-80 bg-surface border border-borderColor rounded-2xl shadow-xl p-4 z-40 space-y-3">
              <div className="flex items-center justify-between border-b border-borderColor/60 pb-2">
                <div className="flex flex-col">
                  <span className="text-[12px] font-bold text-txt-primary">Clinical Schedule</span>
                  <span className="text-[10px] text-txt-muted">
                    {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
                <button onClick={() => setShowCalendar(false)} className="text-txt-muted hover:text-txt-primary bg-transparent border-none">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2">
                <div className="text-center py-6 text-txt-muted text-[11px]">
                  No appointments scheduled today.
                </div>
              </div>
            </div>
          )}
        </div>

      </div>
    </header>
  );
}
