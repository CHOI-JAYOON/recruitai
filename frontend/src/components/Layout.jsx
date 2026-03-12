import { useState, useRef, useEffect } from 'react';
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

const aiFeatures = [
  { path: '/portfolio', label: '포트폴리오', icon: 'M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z' },
  { path: '/resume', label: '이력서 생성', icon: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z|M14 2v6h6|M16 13H8|M16 17H8|M10 9H8' },
  { path: '/cover-letter', label: '자소서 작성', icon: 'M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7|M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z' },
  { path: '/career-description', label: '경력기술서', icon: 'M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2|M15 2H9a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1z' },
  { path: '/interview', label: '면접 연습', icon: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z' },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const { dark, toggle: toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [aiDropdownOpen, setAiDropdownOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const menuRef = useRef(null);
  const aiDropdownRef = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
      if (aiDropdownRef.current && !aiDropdownRef.current.contains(e.target)) {
        setAiDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Close mobile nav on route change
  useEffect(() => {
    setMobileNavOpen(false);
    setAiDropdownOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Check if current path is an AI feature page
  const isAiFeaturePage = aiFeatures.some(f =>
    location.pathname.startsWith(f.path)
  );

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="h-14 bg-white dark:bg-gray-900 border-b border-gray-200/80 dark:border-gray-700/80 fixed top-0 left-0 right-0 z-50">
        <div className="max-w-5xl mx-auto h-full flex items-center justify-between px-4 sm:px-5">
          {/* Mobile hamburger + Logo */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMobileNavOpen(!mobileNavOpen)}
              className="md:hidden p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            >
              {mobileNavOpen ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
              )}
            </button>
            <button
              onClick={() => navigate('/')}
              className="text-lg font-extrabold tracking-tight text-gray-900 dark:text-white hover:opacity-80 transition shrink-0"
            >
              Recruit<span className="text-primary">AI</span>
            </button>
          </div>

          {/* Nav tabs - center (hidden on mobile) */}
          <nav className="hidden md:flex items-center gap-1">
            {/* 소개 */}
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `relative px-3 lg:px-4 py-4 text-[13px] font-semibold transition ${
                  isActive ? 'text-primary' : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  소개
                  {isActive && <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-5 h-[2px] bg-primary rounded-full" />}
                </>
              )}
            </NavLink>

            {/* AI 기능 Dropdown */}
            <div className="relative" ref={aiDropdownRef}>
              <button
                onClick={() => setAiDropdownOpen(!aiDropdownOpen)}
                className={`flex items-center gap-1 px-3 lg:px-4 py-4 text-[13px] font-semibold transition ${
                  isAiFeaturePage ? 'text-primary' : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
              >
                AI 기능
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={`transition-transform ${aiDropdownOpen ? 'rotate-180' : ''}`}>
                  <polyline points="6 9 12 15 18 9" />
                </svg>
                {isAiFeaturePage && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-5 h-[2px] bg-primary rounded-full" />
                )}
              </button>

              {aiDropdownOpen && (
                <div className="absolute left-0 top-full mt-1 w-52 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-2 animate-scale-in">
                  {aiFeatures.map((item) => (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      end={item.end}
                      onClick={() => setAiDropdownOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-4 py-2.5 text-sm transition ${
                          isActive
                            ? 'text-primary bg-primary-light/50 dark:bg-primary/10 font-semibold'
                            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`
                      }
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        {item.icon.split('|').map((d, i) => <path key={i} d={d} />)}
                      </svg>
                      {item.label}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>

            {/* 요금제 */}
            <NavLink
              to="/pricing"
              className={({ isActive }) =>
                `relative px-3 lg:px-4 py-4 text-[13px] font-semibold transition ${
                  isActive ? 'text-primary' : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  요금제
                  {isActive && <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-5 h-[2px] bg-primary rounded-full" />}
                </>
              )}
            </NavLink>
          </nav>

          {/* Theme toggle + User menu / Login */}
          <div className="flex items-center gap-1">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition"
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

            {!user ? (
              <Link
                to="/login"
                className="ml-1 px-4 py-1.5 text-sm font-semibold text-white bg-primary rounded-lg hover:bg-primary-dark transition"
              >
                로그인
              </Link>
            ) : (
            <div className="relative shrink-0" ref={menuRef}>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2 px-2 sm:px-3 py-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              >
                <div className="w-7 h-7 rounded-full bg-primary-light flex items-center justify-center">
                  <span className="text-primary text-xs font-bold">{(user?.display_name || user?.username)?.charAt(0)?.toUpperCase()}</span>
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200 hidden sm:block">{user?.display_name || user?.username}</span>
                {user?.plan && (
                  <span className={`hidden sm:inline text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                    user.plan === 'max' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' :
                    user.plan === 'pro' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' :
                    'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                  }`}>{user.plan === 'max' ? 'MAX' : user.plan === 'pro' ? 'PRO' : 'FREE'}</span>
                )}
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400 hidden sm:block">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-full mt-1 w-44 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-1 animate-scale-in">
                  <button
                    onClick={() => { setMenuOpen(false); navigate('/mypage'); }}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition flex items-center gap-2"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                    </svg>
                    마이페이지
                  </button>
                  {user?.role === 'admin' && (
                    <button
                      onClick={() => { setMenuOpen(false); navigate('/admin'); }}
                      className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition flex items-center gap-2"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                      관리자
                    </button>
                  )}
                  <div className="border-t border-gray-100 dark:border-gray-700 my-1" />
                  <button
                    onClick={() => { setMenuOpen(false); handleLogout(); }}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition flex items-center gap-2"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    로그아웃
                  </button>
                </div>
              )}
            </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile nav dropdown */}
      {mobileNavOpen && (
        <div className="md:hidden fixed top-14 left-0 right-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shadow-lg z-40 animate-fade-in">
          <nav className="flex flex-col py-2">
            {/* 소개 */}
            <NavLink
              to="/"
              end
              onClick={() => setMobileNavOpen(false)}
              className={({ isActive }) =>
                `px-5 py-3 text-sm font-semibold transition ${
                  isActive ? 'text-primary bg-primary-light/50 dark:bg-primary/10' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`
              }
            >
              소개
            </NavLink>
            <div className="border-t border-gray-100 dark:border-gray-700 my-1" />
            {/* AI 기능 섹션 */}
            <div className="px-5 py-2 text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">AI 기능</div>
            {aiFeatures.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setMobileNavOpen(false)}
                className={({ isActive }) =>
                  `px-5 py-3 text-sm font-semibold transition flex items-center gap-3 ${
                    isActive ? 'text-primary bg-primary-light/50 dark:bg-primary/10' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`
                }
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  {item.icon.split('|').map((d, i) => <path key={i} d={d} />)}
                </svg>
                {item.label}
              </NavLink>
            ))}
            <div className="border-t border-gray-100 dark:border-gray-700 my-1" />
            <NavLink
              to="/pricing"
              onClick={() => setMobileNavOpen(false)}
              className={({ isActive }) =>
                `px-5 py-3 text-sm font-semibold transition ${
                  isActive ? 'text-primary bg-primary-light/50 dark:bg-primary/10' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`
              }
            >
              요금제
            </NavLink>
            <div className="border-t border-gray-100 dark:border-gray-700 mt-1 pt-1">
              <button onClick={() => { setMobileNavOpen(false); navigate('/mypage'); }}
                className="w-full text-left px-5 py-3 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition">
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

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-700 py-6">
        <div className="max-w-5xl mx-auto px-4 sm:px-5 flex items-center justify-between text-xs text-gray-400">
          <span>&copy; 2026 RecruitAI</span>
          <div className="flex gap-4">
            <a href="/pricing" className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors">요금제</a>
            <a href="/" className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors">소개</a>
            <a href="/privacy" className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors">개인정보처리방침</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
