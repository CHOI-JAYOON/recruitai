import { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

const navItems = [
  { path: '/', label: '홈', end: true },
  { path: '/resume', label: '이력서' },
  { path: '/career-description', label: '경력기술서' },
  { path: '/cover-letter', label: '자소서' },
  { path: '/interview', label: '면접' },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const { dark, toggle: toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Close mobile nav on route change
  useEffect(() => {
    setMobileNavOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="h-14 bg-white border-b border-gray-200/80 fixed top-0 left-0 right-0 z-50">
        <div className="max-w-5xl mx-auto h-full flex items-center justify-between px-4 sm:px-5">
          {/* Mobile hamburger + Logo */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMobileNavOpen(!mobileNavOpen)}
              className="md:hidden p-1.5 rounded-lg hover:bg-gray-100 transition"
            >
              {mobileNavOpen ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
              )}
            </button>
            <button
              onClick={() => navigate('/')}
              className="text-lg font-extrabold tracking-tight text-gray-900 hover:opacity-80 transition shrink-0"
            >
              Recruit<span className="text-primary">AI</span>
            </button>
          </div>

          {/* Nav tabs - center (hidden on mobile) */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.end}
                className={({ isActive }) =>
                  `relative px-3 lg:px-4 py-4 text-[13px] font-semibold transition ${
                    isActive
                      ? 'text-primary'
                      : 'text-gray-500 hover:text-gray-800'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {item.label}
                    {isActive && (
                      <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-5 h-[2px] bg-primary rounded-full" />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          {/* Theme toggle + User menu */}
          <div className="flex items-center gap-1">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl hover:bg-gray-100 transition"
              title={dark ? '라이트 모드' : '다크 모드'}
            >
              {dark ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-400">
                  <circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              )}
            </button>

            <div className="relative shrink-0" ref={menuRef}>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2 px-2 sm:px-3 py-1.5 rounded-xl hover:bg-gray-100 transition"
              >
                <div className="w-7 h-7 rounded-full bg-primary-light flex items-center justify-center">
                  <span className="text-primary text-xs font-bold">{(user?.display_name || user?.username)?.charAt(0)?.toUpperCase()}</span>
                </div>
                <span className="text-sm font-medium text-gray-700 hidden sm:block">{user?.display_name || user?.username}</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400 hidden sm:block">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-xl shadow-lg border border-gray-200 py-1 animate-scale-in">
                  <button
                    onClick={() => { setMenuOpen(false); navigate('/mypage'); }}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition flex items-center gap-2"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                    </svg>
                    마이페이지
                  </button>
                  <div className="border-t border-gray-100 my-1" />
                  <button
                    onClick={() => { setMenuOpen(false); handleLogout(); }}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-400 hover:text-red-500 hover:bg-red-50 transition flex items-center gap-2"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    로그아웃
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile nav dropdown */}
      {mobileNavOpen && (
        <div className="md:hidden fixed top-14 left-0 right-0 bg-white border-b border-gray-200 shadow-lg z-40 animate-fade-in">
          <nav className="flex flex-col py-2">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.end}
                onClick={() => setMobileNavOpen(false)}
                className={({ isActive }) =>
                  `px-5 py-3 text-sm font-semibold transition ${
                    isActive ? 'text-primary bg-primary-light/50' : 'text-gray-600 hover:bg-gray-50'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
            <div className="border-t border-gray-100 mt-1 pt-1">
              <button onClick={() => { setMobileNavOpen(false); navigate('/mypage'); }}
                className="w-full text-left px-5 py-3 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition">
                마이페이지
              </button>
            </div>
          </nav>
        </div>
      )}
      {mobileNavOpen && (
        <div className="md:hidden fixed inset-0 top-14 bg-black/20 z-30" onClick={() => setMobileNavOpen(false)} />
      )}

      {/* Main Content */}
      <main className="flex-1 pt-14">
        <div className="max-w-5xl mx-auto px-4 sm:px-5 py-6 sm:py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
