import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const FEATURE_LABELS = {
  resume: '이력서 생성',
  cover_letter: '자소서 답변',
  career_description: '경력기술서',
  interview_question: '면접 질문세트',
  interview_evaluation: '면접 평가',
  portfolio_parsing: '포트폴리오 파싱',
};

export default function UpgradePlanModal() {
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e) => {
      setDetail(e.detail || {});
      setOpen(true);
    };
    window.addEventListener('usage-limit-exceeded', handler);
    return () => window.removeEventListener('usage-limit-exceeded', handler);
  }, []);

  if (!open) return null;

  const featureLabel = FEATURE_LABELS[detail?.feature] || detail?.feature || '해당 기능';
  const currentPlan = detail?.current_plan || 'Free';
  const limit = detail?.limit;
  const used = detail?.used;

  const handleGoToPricing = () => {
    setOpen(false);
    navigate('/pricing');
  };

  const handleGoToApiKey = () => {
    setOpen(false);
    navigate('/mypage?tab=subscription');
  };

  const handleClose = () => {
    setOpen(false);
    setDetail(null);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-6 sm:p-8 animate-scale-in">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition text-gray-400 hover:text-gray-600"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Icon */}
        <div className="w-14 h-14 rounded-2xl bg-[#fff4e6] flex items-center justify-center mb-5">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#f59f00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </div>

        {/* Title */}
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          사용량 한도 초과
        </h2>

        {/* Description */}
        <p className="text-[15px] text-gray-600 dark:text-gray-300 leading-relaxed mb-1">
          <span className="font-semibold text-gray-900 dark:text-white">{featureLabel}</span> 기능의 월간 사용 한도에 도달했습니다.
        </p>

        {used != null && limit != null && (
          <div className="mt-3 mb-1 bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-gray-500 dark:text-gray-400">사용량</span>
              <span className="font-semibold text-gray-900 dark:text-white">{used} / {limit}회</span>
            </div>
            <div className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
              <div
                className="h-full bg-red-400 rounded-full transition-all"
                style={{ width: '100%' }}
              />
            </div>
          </div>
        )}

        <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-lg">
          <span className="text-xs text-gray-500 dark:text-gray-400">현재 플랜</span>
          <span className="text-xs font-bold text-gray-900 dark:text-white capitalize">{currentPlan}</span>
        </div>

        <p className="text-sm text-gray-500 dark:text-gray-400 mt-4 mb-5">
          계속 사용하려면 아래 두 가지 방법 중 하나를 선택해 주세요.
        </p>

        {/* Actions - Two Options */}
        <div className="space-y-3">
          {/* Option 1: Upgrade Plan */}
          <button
            onClick={handleGoToPricing}
            className="w-full px-4 py-3.5 text-sm font-semibold text-white bg-[#3182f6] hover:bg-[#1b6ef3] rounded-xl transition flex items-center justify-between"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </div>
              <div className="text-left">
                <div>요금제 업그레이드</div>
                <div className="text-[11px] font-normal text-white/70">Pro · Max 플랜으로 더 많은 사용량</div>
              </div>
            </div>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>

          {/* Option 2: Register Own API Key */}
          <button
            onClick={handleGoToApiKey}
            className="w-full px-4 py-3.5 text-sm font-semibold text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600 rounded-xl transition flex items-center justify-between"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-green-50 dark:bg-green-900/30 flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
                </svg>
              </div>
              <div className="text-left">
                <div>본인 API Key 등록</div>
                <div className="text-[11px] font-normal text-gray-400 dark:text-gray-500">무료 · 무제한 사용</div>
              </div>
            </div>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>

          <button
            onClick={handleClose}
            className="w-full px-4 py-2.5 text-xs font-medium text-gray-400 hover:text-gray-600 transition"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
