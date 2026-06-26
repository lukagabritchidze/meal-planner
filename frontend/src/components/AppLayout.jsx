import { useEffect, useState } from 'react';
import { ThemeToggle } from './ThemeToggle';

const navigationItems = [
  { id: 'dashboard', label: 'Dashboard', icon: <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></svg> },
  { id: 'recipes', label: 'Recipes', icon: <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"></path><path d="M7 2v20"></path><path d="M21 15V2v0a5 5 0 0 0-5 5v8c0 1.1.9 2 2 2h3Z"></path><path d="M19 17v5"></path></svg> },
  { id: 'planner', label: 'Meal Planner', icon: <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> },
  { id: 'shopping', label: 'Shopping List', icon: <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4H6z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg> },
  { id: 'holidays', label: 'Holidays', icon: <span aria-hidden="true" className="nav-emoji-icon">🎉</span> },
];

const PlateWiseLogo = ({ compact = false }) => (
  <div className={`brand-header ${compact ? 'brand-header--compact' : ''}`}>
    <div className="brand-icon">
      <svg xmlns="http://www.w3.org/2000/svg" width={compact ? 16 : 20} height={compact ? 16 : 20} viewBox="0 0 24 24" fill="none" stroke="var(--color-text-inverse)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 18V9a6 6 0 0 1 12 0v9" />
        <path d="M3 18h18a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1v-2a1 1 0 0 1 1-1z" />
      </svg>
    </div>
    <div className="brand-text-wrapper">
      <span className="brand-title">PlateWise</span>
      {!compact && <span className="brand-subtitle">Recipes & meals</span>}
    </div>
  </div>
);

export const AppLayout = ({ activeNavigationTab, setActiveNavigationTab, currentUser, onLogout, children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const userInitial = currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'U';

  const closeMobileMenu = () => setIsMobileMenuOpen(false);
  const openMobileMenu = () => setIsMobileMenuOpen(true);

  const handleNavigate = (tabId) => {
    setActiveNavigationTab(tabId);
    closeMobileMenu();
  };

  const handleLogout = () => {
    closeMobileMenu();
    onLogout();
  };

  useEffect(() => {
    if (!isMobileMenuOpen) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        closeMobileMenu();
      }
    };

    document.body.classList.add('mobile-menu-open');
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.classList.remove('mobile-menu-open');
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMobileMenuOpen]);

  return (
    <div className="app-container">
      <header className="mobile-top-header">
        <button
          type="button"
          className="mobile-hamburger-btn"
          onClick={openMobileMenu}
          aria-label="Open menu"
          aria-expanded={isMobileMenuOpen}
          aria-controls="app-sidebar"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        <PlateWiseLogo compact />
      </header>

      {isMobileMenuOpen && (
        <div
          className="mobile-sidebar-overlay"
          onClick={closeMobileMenu}
          aria-hidden="false"
        />
      )}

      <aside
        id="app-sidebar"
        className={`desktop-sidebar ${isMobileMenuOpen ? 'mobile-open' : ''}`}
      >
        <div className="mobile-sidebar-header">
          <span className="mobile-sidebar-title">Menu</span>
          <button
            type="button"
            className="mobile-sidebar-close"
            onClick={closeMobileMenu}
            aria-label="Close menu"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="sidebar-brand-desktop">
          <PlateWiseLogo />
        </div>

        <nav className="sidebar-navigation" aria-label="Main navigation">
          {navigationItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`nav-item ${activeNavigationTab === item.id ? 'active' : ''}`}
              onClick={() => handleNavigate(item.id)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-promo-card">
          <strong>Cooking tonight?</strong>
          <p>Plan your week and we&apos;ll generate a shopping list automatically.</p>
        </div>

        <ThemeToggle className="desktop-theme-toggle" />

        {currentUser && (
          <div className="sidebar-user-footer">
            <div className="user-info-badge">
              <div className="user-avatar">{userInitial}</div>
              <div className="user-details">
                <span className="user-name" title={currentUser.name}>{currentUser.name}</span>
                <span className="user-email" title={currentUser.email}>{currentUser.email}</span>
              </div>
            </div>
            <button
              type="button"
              className="btn-logout-sidebar"
              onClick={handleLogout}
              title="Sign Out"
              aria-label="Sign out"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          </div>
        )}
      </aside>

      <main className="main-content">{children}</main>
    </div>
  );
};
