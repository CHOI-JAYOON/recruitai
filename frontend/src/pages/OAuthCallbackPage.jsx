import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/client';

const providerNames = { kakao: '카카오', naver: '네이버' };

export default function OAuthCallbackPage() {
  const { provider } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [error, setError] = useState('');

  useEffect(() => {
    // Validate provider against whitelist
    const VALID_PROVIDERS = ['kakao', 'naver'];
    if (!VALID_PROVIDERS.includes(provider)) {
      navigate('/login', { replace: true });
      return;
    }

    const code = searchParams.get('code');
    const state = searchParams.get('state');

    if (!code) {
      setError('인증 코드가 없습니다.');
      return;
    }

    const body = provider === 'naver' ? { code, state } : { code };

    api.post(`/auth/oauth/${provider}`, body)
      .then((res) => {
        login(res.data);
        navigate('/', { replace: true });
      })
      .catch((err) => {
        setError(err.response?.data?.detail || '소셜 로그인에 실패했습니다.');
        setTimeout(() => navigate('/login', { replace: true }), 3000);
      });
  }, []);

  const name = providerNames[provider] || provider;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        {error ? (
          <>
            <div className="text-red-500 text-lg font-semibold mb-2">{error}</div>
            <p className="text-gray-500 text-sm">잠시 후 로그인 페이지로 이동합니다...</p>
          </>
        ) : (
          <>
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-700 font-semibold">{name} 로그인 중...</p>
          </>
        )}
      </div>
    </div>
  );
}
