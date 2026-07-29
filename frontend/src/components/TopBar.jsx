import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { X, Search, Bell, Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { usePatient } from '../contexts/PatientContext';

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
            }}
            className={`p-2 rounded-xl transition-all cursor-pointer relative ${
              showNotifications ? 'bg-bg-app text-txt-primary' : 'text-txt-muted hover:text-txt-primary hover:bg-bg-app'
            }`}
          >
            <Bell className="w-4.5 h-4.5" />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-danger rounded-full" />
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-10 w-80 bg-surface border border-borderColor rounded-2xl shadow-xl p-4 z-40 space-y-3">
              <div className="flex items-center justify-between border-b border-borderColor/60 pb-2">
                <span className="text-[12px] font-bold text-txt-primary">Clinical System Alerts</span>
                <button onClick={() => setShowNotifications(false)} className="text-txt-muted hover:text-txt-primary bg-transparent border-none">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto">
                <div className="p-2.5 bg-danger-bg/20 border border-danger/10 rounded-xl space-y-1">
                  <span className="text-[12px] font-bold text-danger block">🚨 New High-Risk Alert</span>
                  <p className="text-[11px] text-txt-primary leading-tight font-semibold">Anthony Nelson flagged at 63.80% readmission risk.</p>
                </div>
                <div className="p-2.5 bg-success-bg/20 border border-success/10 rounded-xl space-y-1">
                  <span className="text-[12px] font-bold text-success block">✅ Deployment Completed</span>
                  <p className="text-[11px] text-txt-primary leading-tight font-semibold">Weighted Stacking Ensemble v1.2 is active.</p>
                </div>
                <div className="p-2.5 bg-[#EDE9FE] border border-[#7A5AF8]/10 rounded-xl space-y-1">
                  <span className="text-[12px] font-bold text-info block">⚠️ Operational Alert</span>
                  <p className="text-[11px] text-txt-primary leading-tight font-semibold">Hospital-wide high-risk alerts rate increased (+4.8%).</p>
                </div>
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
                  <span className="text-[10px] text-txt-muted">Thursday, Jul 23, 2026</span>
                </div>
                <button onClick={() => setShowCalendar(false)} className="text-txt-muted hover:text-txt-primary bg-transparent border-none">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2">
                <div className="p-2.5 bg-bg-app border border-borderColor rounded-xl space-y-1">
                  <span className="text-[11px] font-bold text-txt-primary block">Clara Oswald — Follow-up</span>
                  <span className="text-[10px] text-txt-muted block">Jul 24 at 10:00 AM | Endocrine Outpatient</span>
                </div>
                <div className="p-2.5 bg-bg-app border border-borderColor rounded-xl space-y-1">
                  <span className="text-[11px] font-bold text-txt-primary block">Franklin Myers — Consult</span>
                  <span className="text-[10px] text-txt-muted block">Jul 24 at 11:30 AM | Nephrology Clinic</span>
                </div>
                <div className="p-2.5 bg-bg-app border border-borderColor rounded-xl space-y-1">
                  <span className="text-[11px] font-bold text-txt-primary block">Discharge Briefing Meeting</span>
                  <span className="text-[10px] text-txt-muted block">Jul 23 at 2:00 PM | Conference Room B</span>
                </div>
              </div>
            </div>
          )}
        </div>

      </div>
    </header>
  );
}
