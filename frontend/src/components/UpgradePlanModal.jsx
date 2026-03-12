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

        <p className="text-sm text-gray-500 dark:text-gray-400 mt-4 mb-6">
          더 많은 사용량이 필요하시면 플랜을 업그레이드해 주세요.
        </p>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleClose}
            className="flex-1 px-4 py-3 text-sm font-semibold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl transition"
          >
            닫기
          </button>
          <button
            onClick={handleGoToPricing}
            className="flex-1 px-4 py-3 text-sm font-semibold text-white bg-[#3182f6] hover:bg-[#1b6ef3] rounded-xl transition flex items-center justify-center gap-1.5"
          >
            요금제 보기
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
