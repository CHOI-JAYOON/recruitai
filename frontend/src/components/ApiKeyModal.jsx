import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function ApiKeyModal({ open, onClose, onSave }) {
  const [key, setKey] = useState('');
  const navigate = useNavigate();

  if (!open) return null;

  const handleSave = () => {
    if (!key.trim()) return;
    localStorage.setItem('apiKey', key.trim());
    onSave?.(key.trim());
    setKey('');
  };

  const goToMyPage = () => {
    onClose?.();
    navigate('/mypage');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl p-6 w-full max-w-md mx-4 shadow-xl animate-fade-in">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#f59e0b] to-[#f97316] flex items-center justify-center shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">API Key 등록 필요</h3>
            <p className="text-sm text-gray-500">AI 기능을 사용하려면 OpenAI API Key가 필요합니다</p>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
          <p className="text-sm text-amber-800 leading-relaxed">
            이 기능은 OpenAI GPT를 사용합니다. API Key를 등록하면 이력서 생성, 자소서 작성, 경력기술서 생성, 면접 연습 등 AI 기능을 이용할 수 있습니다.
          </p>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">OpenAI API Key</label>
          <input
            type="password"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white transition"
            placeholder="sk-..."
          />
          <p className="text-xs text-gray-400 mt-1.5">
            API Key는 브라우저에만 저장되며 서버로 전송 시 암호화됩니다.
          </p>
        </div>

        <div className="bg-gray-50 rounded-xl p-4 mb-5">
          <p className="text-xs font-semibold text-gray-700 mb-2">API Key 발급 방법</p>
          <ol className="text-xs text-gray-500 space-y-1 list-decimal list-inside">
            <li><a href="https://platform.openai.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">platform.openai.com</a> 에 로그인합니다.</li>
            <li>좌측 메뉴에서 <span className="font-semibold text-gray-700">API keys</span>를 클릭합니다.</li>
            <li><span className="font-semibold text-gray-700">Create new secret key</span>를 클릭하여 키를 생성합니다.</li>
            <li>생성된 키를 복사하여 위 입력란에 붙여넣으세요.</li>
          </ol>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition"
          >
            나중에
          </button>
          <button
            onClick={goToMyPage}
            className="px-4 py-2.5 text-sm font-medium text-primary bg-primary/10 hover:bg-primary/20 rounded-xl transition"
          >
            마이페이지에서 설정
          </button>
          <button
            onClick={handleSave}
            disabled={!key.trim()}
            className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-primary hover:bg-primary-dark rounded-xl transition disabled:opacity-50"
          >
            등록하기
          </button>
        </div>
      </div>
    </div>
  );
}

// Hook: AI 기능 페이지에서 API Key 존재 여부 체크
export function useApiKeyCheck() {
  const [showModal, setShowModal] = useState(false);

  const checkApiKey = () => {
    const key = localStorage.getItem('apiKey');
    if (!key) {
      setShowModal(true);
      return false;
    }
    return true;
  };

  const hasApiKey = () => !!localStorage.getItem('apiKey');

  return { showModal, setShowModal, checkApiKey, hasApiKey };
}
