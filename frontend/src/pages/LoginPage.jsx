import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/client';

const features = [
  { icon: '📁', title: '포트폴리오 관리', desc: 'AI가 프로젝트를 자동으로 구조화' },
  { icon: '📄', title: '맞춤 이력서', desc: '직무별 최적화된 이력서 생성' },
  { icon: '✍️', title: '자소서 작성', desc: 'RAG 기반 맞춤형 답변' },
  { icon: '🎤', title: '면접 연습', desc: 'AI 면접관과 실전 연습' },
];

const inputCls = 'w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white transition';
const smallInputCls = 'w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [passwordConfirm, setPasswordConfirm] = useState('');

  // Registration fields
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [usernameChecked, setUsernameChecked] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState(false);

  const pwValid = /^(?=.*[a-zA-Z])(?=.*\d).{8,}$/.test(password);
  const pwTouched = password.length > 0;
  const pwConfirmTouched = passwordConfirm.length > 0;
  const pwMatch = password === passwordConfirm;

  // Recovery
  const [recoveryMode, setRecoveryMode] = useState(null);
  const [recoveryName, setRecoveryName] = useState('');
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoveryUsername, setRecoveryUsername] = useState('');
  const [recoveryNewPw, setRecoveryNewPw] = useState('');
  const [recoveryResult, setRecoveryResult] = useState('');
  const [recoveryLoading, setRecoveryLoading] = useState(false);

  // OAuth config
  const [oauthConfig, setOauthConfig] = useState(null);

  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/auth/oauth/config').then(res => setOauthConfig(res.data)).catch(() => {});
  }, []);

  const checkUsername = async () => {
    if (!username.trim()) return;
    try {
      const res = await api.post('/auth/check-username', { username });
      setUsernameChecked(true);
      setUsernameAvailable(!res.data.exists);
    } catch {
      setUsernameChecked(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (isRegister) {
      if (!regName.trim()) { setError('이름을 입력해주세요.'); return; }
      if (!regEmail.trim()) { setError('이메일을 입력해주세요.'); return; }
      if (!usernameChecked || !usernameAvailable) { setError('아이디 중복확인을 해주세요.'); return; }
      if (!pwValid) { setError('비밀번호는 영문+숫자 포함 8자 이상이어야 합니다.'); return; }
      if (!pwMatch) { setError('비밀번호가 일치하지 않습니다.'); return; }
    }
    setLoading(true);
    try {
      if (isRegister) {
        await api.post('/auth/register', {
          username, password,
          display_name: regName,
          email: regEmail,
        });
        const loginRes = await api.post('/auth/login', { username, password });
        login(loginRes.data);
      } else {
        const res = await api.post('/auth/login', { username, password });
        login(res.data);
      }
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.detail || '오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleFindUsername = async (e) => {
    e.preventDefault();
    setRecoveryResult('');
    setRecoveryLoading(true);
    try {
      const res = await api.post('/auth/find-username', { display_name: recoveryName, email: recoveryEmail });
      setRecoveryResult(`아이디: ${res.data.username}`);
    } catch (err) {
      setRecoveryResult(err.response?.data?.detail || '계정을 찾을 수 없습니다.');
    } finally {
      setRecoveryLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setRecoveryResult('');
    if (!/^(?=.*[a-zA-Z])(?=.*\d).{8,}$/.test(recoveryNewPw)) { setRecoveryResult('비밀번호는 영문+숫자 포함 8자 이상이어야 합니다.'); return; }
    setRecoveryLoading(true);
    try {
      await api.post('/auth/reset-password', {
        username: recoveryUsername, display_name: recoveryName,
        email: recoveryEmail, new_password: recoveryNewPw,
      });
      setRecoveryResult('비밀번호가 재설정되었습니다. 로그인해주세요.');
      // 로그인 입력칸 초기화 + 복구 모달 닫기 + 화면 상단 이동
      setTimeout(() => {
        setUsername(recoveryUsername);
        setPassword('');
        setRecoveryMode(null);
        setRecoveryResult('');
        setRecoveryName('');
        setRecoveryEmail('');
        setRecoveryUsername('');
        setRecoveryNewPw('');
        window.scrollTo(0, 0);
      }, 1500);
    } catch (err) {
      setRecoveryResult(err.response?.data?.detail || '비밀번호 재설정 실패');
    } finally {
      setRecoveryLoading(false);
    }
  };

  const handleKakaoLogin = () => {
    if (!oauthConfig?.kakao_client_id) return;
    const url = `https://kauth.kakao.com/oauth/authorize?client_id=${oauthConfig.kakao_client_id}&redirect_uri=${encodeURIComponent(oauthConfig.kakao_redirect_uri)}&response_type=code`;
    window.location.href = url;
  };

  const handleNaverLogin = () => {
    if (!oauthConfig?.naver_client_id) return;
    const state = Math.random().toString(36).substring(2);
    const url = `https://nid.naver.com/oauth2.0/authorize?client_id=${oauthConfig.naver_client_id}&redirect_uri=${encodeURIComponent(oauthConfig.naver_redirect_uri)}&response_type=code&state=${state}`;
    window.location.href = url;
  };

  const hasKakao = oauthConfig?.kakao_client_id;
  const hasNaver = oauthConfig?.naver_client_id;
  const hasSocial = hasKakao || hasNaver;

  return (
    <div className="min-h-screen flex">
      {/* Left - Branding */}
      <div className="hidden lg:flex lg:w-1/2 gradient-login relative overflow-hidden">
        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          <h1 className="text-4xl font-extrabold tracking-tight mb-3">
            Recruit<span className="text-white/80">AI</span>
          </h1>
          <p className="text-lg text-white/70 mb-12">AI 기반 취업 준비 플랫폼</p>
          <div className="flex flex-col gap-5 stagger-children">
            {features.map((f, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center text-lg shrink-0">{f.icon}</div>
                <div>
                  <p className="text-[15px] font-semibold text-white">{f.title}</p>
                  <p className="text-sm text-white/60">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/5 rounded-full" />
        <div className="absolute -bottom-32 -left-16 w-80 h-80 bg-white/5 rounded-full" />
      </div>

      {/* Right - Form */}
      <div className="flex-1 flex items-center justify-center px-6 bg-white">
        <div className="w-full max-w-[400px] animate-fade-in">
          <div className="lg:hidden text-center mb-10">
            <h1 className="text-[28px] font-extrabold tracking-tight text-gray-900 mb-1">
              Recruit<span className="text-primary">AI</span>
            </h1>
            <p className="text-gray-500 text-sm">AI 기반 취업 준비 플랫폼</p>
          </div>

          <div className="hidden lg:block mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-1">
              {isRegister ? '회원가입' : '로그인'}
            </h2>
            <p className="text-sm text-gray-500">
              {isRegister ? '계정을 만들고 시작하세요' : '계정에 로그인하세요'}
            </p>
          </div>

          <div className="lg:hidden mb-6">
            <h2 className="text-lg font-bold text-gray-900">{isRegister ? '회원가입' : '로그인'}</h2>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {isRegister && (
              <>
                <div>
                  <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">이름 *</label>
                  <input type="text" value={regName} onChange={(e) => setRegName(e.target.value)}
                    className={inputCls} placeholder="실명을 입력하세요" required />
                </div>
                <div>
                  <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">이메일 *</label>
                  <input type="email" value={regEmail} onChange={(e) => setRegEmail(e.target.value)}
                    className={inputCls} placeholder="이메일을 입력하세요" required />
                </div>
              </>
            )}

            <div>
              <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">아이디 {isRegister && '*'}</label>
              <div className={isRegister ? 'flex gap-2' : ''}>
                <input type="text" value={username}
                  onChange={(e) => { setUsername(e.target.value); setUsernameChecked(false); }}
                  className={`${inputCls} ${isRegister ? 'flex-1' : ''}`}
                  placeholder="아이디를 입력하세요" required />
                {isRegister && (
                  <button type="button" onClick={checkUsername}
                    className="px-3 py-2 text-xs font-semibold text-primary border border-primary rounded-xl hover:bg-primary/5 transition whitespace-nowrap shrink-0">
                    중복확인
                  </button>
                )}
              </div>
              {isRegister && usernameChecked && (
                <p className={`text-xs mt-1 ${usernameAvailable ? 'text-green-600' : 'text-red-500'}`}>
                  {usernameAvailable ? '사용 가능한 아이디입니다.' : '이미 사용 중인 아이디입니다.'}
                </p>
              )}
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">비밀번호 {isRegister && '*'}</label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`${inputCls} pr-11 ${isRegister && pwTouched && !pwValid ? '!border-red-400 !ring-red-100' : ''}`}
                  placeholder="비밀번호를 입력하세요" required />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition" tabIndex={-1}>
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" /><line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
              {isRegister && pwTouched && !pwValid && (
                <p className="text-xs text-red-500 mt-1">영문과 숫자를 포함하여 8자 이상 입력해주세요.</p>
              )}
            </div>

            {isRegister && (
              <div>
                <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">비밀번호 확인 *</label>
                <input type="password" value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  className={`${inputCls} ${pwConfirmTouched && !pwMatch ? '!border-red-400 !ring-red-100' : ''}`}
                  placeholder="비밀번호를 다시 입력하세요" required />
                {pwConfirmTouched && !pwMatch && (
                  <p className="text-xs text-red-500 mt-1">비밀번호가 일치하지 않습니다.</p>
                )}
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-100 rounded-xl animate-fade-in">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full py-3.5 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition disabled:opacity-50 text-[15px]">
              {loading ? '처리 중...' : isRegister ? '가입하기' : '로그인'}
            </button>
          </form>

          {/* Social Login */}
          {!isRegister && hasSocial && (
            <div className="mt-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs text-gray-400">또는</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>
              <div className="flex flex-col gap-2.5">
                {hasKakao && (
                  <button onClick={handleKakaoLogin}
                    className="w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition hover:brightness-95"
                    style={{ backgroundColor: '#FEE500', color: '#191919' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#191919" d="M12 3C6.48 3 2 6.36 2 10.44c0 2.62 1.75 4.93 4.38 6.24l-1.12 4.16c-.1.36.32.65.64.44l4.84-3.2c.41.04.83.06 1.26.06 5.52 0 10-3.36 10-7.5S17.52 3 12 3z"/></svg>
                    카카오로 로그인
                  </button>
                )}
                {hasNaver && (
                  <button onClick={handleNaverLogin}
                    className="w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 text-white transition hover:brightness-95"
                    style={{ backgroundColor: '#03C75A' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24"><path fill="white" d="M14.4 12.6L9.38 5H5v14h4.6v-7.6L14.62 19H19V5h-4.6v7.6z"/></svg>
                    네이버로 로그인
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="mt-5 text-center space-y-2">
            <button
              onClick={() => { setIsRegister(!isRegister); setError(''); setRecoveryMode(null); setUsernameChecked(false); }}
              className="text-[13px] text-gray-500 hover:text-primary transition">
              {isRegister ? '이미 계정이 있으신가요? 로그인' : '계정이 없으신가요? 회원가입'}
            </button>
            {!isRegister && !recoveryMode && (
              <div className="flex justify-center gap-3">
                <button onClick={() => { setRecoveryMode('find-id'); setRecoveryResult(''); }} className="text-[12px] text-gray-400 hover:text-gray-600 transition">아이디 찾기</button>
                <span className="text-gray-300">|</span>
                <button onClick={() => { setRecoveryMode('reset-pw'); setRecoveryResult(''); }} className="text-[12px] text-gray-400 hover:text-gray-600 transition">비밀번호 찾기</button>
              </div>
            )}
          </div>

          {/* Recovery forms */}
          {recoveryMode && (
            <div className="mt-5 p-4 bg-gray-50 rounded-xl border border-gray-200 animate-fade-in">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-gray-800">{recoveryMode === 'find-id' ? '아이디 찾기' : '비밀번호 재설정'}</h3>
                <button onClick={() => { setRecoveryMode(null); setRecoveryResult(''); }} className="text-xs text-gray-400 hover:text-gray-600">닫기</button>
              </div>
              {recoveryMode === 'find-id' ? (
                <form onSubmit={handleFindUsername} className="flex flex-col gap-3">
                  <div>
                    <label className="block text-[12px] font-semibold text-gray-600 mb-1">이름</label>
                    <input value={recoveryName} onChange={(e) => setRecoveryName(e.target.value)}
                      className={smallInputCls} placeholder="가입 시 입력한 이름" required />
                  </div>
                  <div>
                    <label className="block text-[12px] font-semibold text-gray-600 mb-1">이메일</label>
                    <input type="email" value={recoveryEmail} onChange={(e) => setRecoveryEmail(e.target.value)}
                      className={smallInputCls} placeholder="가입 시 입력한 이메일" required />
                  </div>
                  <button type="submit" disabled={recoveryLoading}
                    className="w-full py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary-dark transition disabled:opacity-50">
                    {recoveryLoading ? '찾는 중...' : '아이디 찾기'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleResetPassword} className="flex flex-col gap-3">
                  <div>
                    <label className="block text-[12px] font-semibold text-gray-600 mb-1">아이디</label>
                    <input value={recoveryUsername} onChange={(e) => setRecoveryUsername(e.target.value)}
                      className={smallInputCls} placeholder="아이디를 입력하세요" required />
                  </div>
                  <div>
                    <label className="block text-[12px] font-semibold text-gray-600 mb-1">이름</label>
                    <input value={recoveryName} onChange={(e) => setRecoveryName(e.target.value)}
                      className={smallInputCls} placeholder="가입 시 입력한 이름" required />
                  </div>
                  <div>
                    <label className="block text-[12px] font-semibold text-gray-600 mb-1">이메일</label>
                    <input type="email" value={recoveryEmail} onChange={(e) => setRecoveryEmail(e.target.value)}
                      className={smallInputCls} placeholder="가입 시 입력한 이메일" required />
                  </div>
                  <div>
                    <label className="block text-[12px] font-semibold text-gray-600 mb-1">새 비밀번호</label>
                    <input type="password" value={recoveryNewPw} onChange={(e) => setRecoveryNewPw(e.target.value)}
                      className={smallInputCls} placeholder="4자 이상" required />
                  </div>
                  <button type="submit" disabled={recoveryLoading}
                    className="w-full py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary-dark transition disabled:opacity-50">
                    {recoveryLoading ? '처리 중...' : '비밀번호 재설정'}
                  </button>
                </form>
              )}
              {recoveryResult && (
                <div className="mt-3 px-3 py-2 bg-white border border-gray-200 rounded-lg">
                  <p className="text-sm text-gray-700">{recoveryResult}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
