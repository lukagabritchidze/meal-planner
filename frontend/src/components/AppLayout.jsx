
import { ThemeToggle } from './ThemeToggle';

const navigationItems = [
  { id: 'dashboard', label: 'Dashboard', icon: <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></svg> },
  { id: 'recipes', label: 'Recipes', icon: <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"></path><path d="M7 2v20"></path><path d="M21 15V2v0a5 5 0 0 0-5 5v8c0 1.1.9 2 2 2h3Z"></path><path d="M19 17v5"></path></svg> },
  { id: 'planner', label: 'Meal Planner', icon: <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> },
  { id: 'shopping', label: 'Shopping List', icon: <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4H6z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg> },
  { id: 'holidays', label: 'Holidays', icon: <span aria-hidden="true" style={{ fontSize: '1.25rem' }}>🎉</span> },
];

export const AppLayout = ({ activeNavigationTab, setActiveNavigationTab, currentUser, onLogout, children }) => {
  const userInitial = currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'U';

  return (
    <div className="app-container">
      {/* Mobile Top Header */}
      <header className="mobile-top-header">
        <div className="mobile-brand">
          <div className="mobile-brand-icon" style={{ borderRadius: '50%', width: '28px', height: '28px', backgroundColor: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-inverse)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 18V9a6 6 0 0 1 12 0v9" />
              <path d="M3 18h18a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1v-2a1 1 0 0 1 1-1z" />
            </svg>
          </div>
          <span className="mobile-brand-title" style={{ fontWeight: '800' }}>PlateWise</span>
        </div>
        
        <div className="mobile-user-actions">
          <div className="mobile-user-avatar" title={currentUser?.name || 'User'}>
            {userInitial}
          </div>
          <button 
            type="button" 
            className="mobile-logout-btn" 
            onClick={onLogout}
            title="Log Out"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </button>
        </div>
      </header>

      {/* Desktop Sidebar */}
      <aside className="desktop-sidebar">
        <div className="brand-header" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2.5rem' }}>
          <div className="brand-icon" style={{ backgroundColor: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '38px', height: '38px', borderRadius: '50%', flexShrink: 0 }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-inverse)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 18V9a6 6 0 0 1 12 0v9" />
              <path d="M3 18h18a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1v-2a1 1 0 0 1 1-1z" />
            </svg>
          </div>
          <div className="brand-text-wrapper" style={{ display: 'flex', flexDirection: 'column' }}>
            <span className="brand-title" style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--text-primary)', lineHeight: 1.1 }}>PlateWise</span>
            <span className="brand-subtitle" style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '600' }}>Recipes & meals</span>
          </div>
        </div>
        
        <nav className="sidebar-navigation">
          {navigationItems.map(item => (
            <button key={item.id} className={`nav-item ${activeNavigationTab === item.id ? 'active' : ''}`} onClick={() => setActiveNavigationTab(item.id)}>
              <span className="nav-icon">{item.icon}</span><span>{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Cooking tonight? Promo card */}
        <div style={{
          backgroundColor: 'var(--color-danger-light)',
          padding: '1rem',
          borderRadius: 'var(--radius)',
          marginBottom: '1.25rem',
          fontSize: '0.8rem',
          lineHeight: '1.4',
          color: 'var(--color-danger)'
        }}>
          <strong style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem', color: 'var(--color-danger)' }}>Cooking tonight?</strong>
          Plan your week and we'll generate a shopping list automatically.
        </div>

        <ThemeToggle className="desktop-theme-toggle" />

        {/* User Profile Badge (Desktop Footer) */}
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
              onClick={onLogout}
              title="Sign Out"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </button>
          </div>
        )}
      </aside>
      
      <main className="main-content">{children}</main>
      
      {/* Mobile Bottom Bar */}
      <nav className="mobile-bottom-bar">
        {navigationItems.map(item => (
          <button key={item.id} className={`mobile-nav-item ${activeNavigationTab === item.id ? 'active' : ''}`} onClick={() => setActiveNavigationTab(item.id)}>
            <span className="nav-icon">{item.icon}</span><span>{item.label}</span>
          </button>
        ))}
        <ThemeToggle className="mobile-theme-toggle" />
      </nav>
    </div>
  );
};

