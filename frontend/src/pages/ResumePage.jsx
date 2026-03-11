import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import api from '../api/client';
import LoadingSpinner from '../components/LoadingSpinner';
import ApiKeyModal, { useApiKeyCheck } from '../components/ApiKeyModal';

const steps = [
  { num: 1, label: '직무 · 포트폴리오 선택' },
  { num: 2, label: '결과 확인' },
];

export default function ResumePage() {
  const { user } = useAuth();
  const toast = useToast();
  const { showModal, setShowModal, checkApiKey } = useApiKeyCheck();
  const [portfolios, setPortfolios] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [targetRole, setTargetRole] = useState('');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [result, setResult] = useState(null);
  const [step, setStep] = useState(1);

  useEffect(() => {
    api.get(`/portfolios?username=${user.username}`).then((res) => {
      setPortfolios(res.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [user.username]);

  const toggleSelect = (id) => {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const handleGenerate = async () => {
    if (!checkApiKey()) return;
    setGenerating(true);
    setResult(null);
    try {
      const res = await api.post('/resume/generate', {
        username: user.username,
        selected_portfolio_ids: selectedIds,
        target_role: targetRole,
      });
      setResult(res.data);
      setStep(2);
      toast.success('이력서가 생성되었습니다!');
    } catch (err) {
      toast.error(err.response?.data?.detail || '이력서 생성 실패. API 키를 확인해주세요.');
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const res = await api.post('/resume/download', {
        username: user.username,
        selected_portfolio_ids: selectedIds,
        target_role: targetRole,
      }, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${user.username}_이력서.docx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('다운로드 실패');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) return <LoadingSpinner text="불러오는 중..." />;

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">이력서 생성</h1>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-2 mb-8">
        {steps.map((s, i) => (
          <div key={s.num} className="flex items-center gap-2 flex-1">
            <button
              onClick={() => { if (s.num < step || s.num === 1) setStep(s.num); }}
              className={`flex items-center gap-2 transition ${s.num <= step ? 'cursor-pointer' : 'cursor-default'}`}
            >
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition ${
                s.num === step ? 'bg-primary text-white' :
                s.num < step ? 'bg-primary/20 text-primary' :
                'bg-gray-200 text-gray-400'
              }`}>{s.num}</div>
              <span className={`text-[13px] font-semibold whitespace-nowrap ${
                s.num === step ? 'text-gray-900' : s.num < step ? 'text-primary' : 'text-gray-400'
              }`}>{s.label}</span>
            </button>
            {i < steps.length - 1 && (
              <div className={`flex-1 h-[2px] rounded-full transition ${s.num < step ? 'bg-primary/30' : 'bg-gray-200'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Target Role + Portfolio Selection (combined) */}
      {step === 1 && (
        <div className="animate-fade-in flex flex-col gap-5">
          {/* Target Role */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-2">어떤 직무에 지원하시나요?</h2>
            <p className="text-sm text-gray-500 mb-4">지원 직무에 맞춰 이력서가 최적화됩니다.</p>
            <input
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white transition"
              placeholder="예: AI 엔지니어, 백엔드 개발자, 프론트엔드 개발자"
            />
          </div>

          {/* Portfolio Selection */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-1">포트폴리오 선택</h2>
                <p className="text-sm text-gray-500">이력서에 포함할 프로젝트를 선택하세요</p>
              </div>
              <span className="text-sm font-bold text-primary">{selectedIds.length}/{portfolios.length}</span>
            </div>
            {portfolios.length === 0 ? (
              <p className="text-sm text-gray-400 py-8 text-center">먼저 포트폴리오를 등록해주세요.</p>
            ) : (
              <div className="flex flex-col gap-4 mb-5">
                {portfolios.some((p) => p.type === 'career') && (
                  <div>
                    <div className="flex items-center gap-1.5 mb-2">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#3182f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /></svg>
                      <span className="text-xs font-bold text-gray-500">경력</span>
                    </div>
                    <div className="flex flex-col gap-2">
                      {portfolios.filter((p) => p.type === 'career').map((p) => (
                        <label key={p.id}
                          className={`flex items-center gap-3 px-4 py-4 rounded-xl border cursor-pointer transition ${
                            selectedIds.includes(p.id)
                              ? 'border-primary bg-primary-light/50 shadow-[0_0_0_1px_rgba(49,130,246,0.15)]'
                              : 'border-gray-200 hover:bg-gray-50'
                          }`}>
                          <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition ${
                            selectedIds.includes(p.id) ? 'bg-primary border-primary' : 'border-gray-300'
                          }`}>
                            {selectedIds.includes(p.id) && (
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                            )}
                          </div>
                          <input type="checkbox" checked={selectedIds.includes(p.id)} onChange={() => toggleSelect(p.id)} className="hidden" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="text-sm font-semibold text-gray-900 truncate">{p.title}</p>
                              <span className="text-[10px] font-semibold text-[#3182f6] bg-[#3182f6]/10 px-1.5 py-0.5 rounded shrink-0">{p.category}</span>
                            </div>
                            <p className="text-xs text-gray-400 mt-0.5">{p.company && `${p.company} · `}{p.role}{p.period ? ` · ${p.period}` : ''}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
                {portfolios.some((p) => p.type !== 'career') && (
                  <div>
                    <div className="flex items-center gap-1.5 mb-2">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#7b61ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /></svg>
                      <span className="text-xs font-bold text-gray-500">포트폴리오</span>
                    </div>
                    <div className="flex flex-col gap-2">
                      {portfolios.filter((p) => p.type !== 'career').map((p) => (
                        <label key={p.id}
                          className={`flex items-center gap-3 px-4 py-4 rounded-xl border cursor-pointer transition ${
                            selectedIds.includes(p.id)
                              ? 'border-primary bg-primary-light/50 shadow-[0_0_0_1px_rgba(49,130,246,0.15)]'
                              : 'border-gray-200 hover:bg-gray-50'
                          }`}>
                          <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition ${
                            selectedIds.includes(p.id) ? 'bg-primary border-primary' : 'border-gray-300'
                          }`}>
                            {selectedIds.includes(p.id) && (
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                            )}
                          </div>
                          <input type="checkbox" checked={selectedIds.includes(p.id)} onChange={() => toggleSelect(p.id)} className="hidden" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="text-sm font-semibold text-gray-900 truncate">{p.title}</p>
                              <span className="text-[10px] font-semibold text-[#7b61ff] bg-[#7b61ff]/10 px-1.5 py-0.5 rounded shrink-0">{p.category}</span>
                            </div>
                            <p className="text-xs text-gray-400 mt-0.5">{p.role} {p.period && `· ${p.period}`}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            <button onClick={handleGenerate}
              disabled={generating || !selectedIds.length || !targetRole.trim()}
              className="w-full py-3.5 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition disabled:opacity-40 text-[15px]">
              {generating ? 'AI 생성 중...' : '이력서 생성'}
            </button>
          </div>
          {generating && <div className="mt-2"><LoadingSpinner text="AI가 이력서를 작성하고 있습니다..." /></div>}
        </div>
      )}

      {/* Step 2: Result */}
      {step === 2 && result && (
        <div className="animate-fade-in">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">생성 결과</h2>
              <div className="flex gap-2">
                <button onClick={() => { setResult(null); setStep(1); }}
                  className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-200 transition">새로 만들기</button>
                <button onClick={handleDownload} disabled={downloading}
                  className="px-4 py-2 bg-gray-800 text-white text-sm font-semibold rounded-lg hover:bg-gray-900 transition disabled:opacity-50">
                  {downloading ? '다운로드 중...' : 'DOCX 다운로드'}
                </button>
              </div>
            </div>

            {result.summary && (
              <div className="mb-5 gradient-hero-soft rounded-xl p-5">
                <h3 className="text-xs font-bold text-primary mb-1.5">요약</h3>
                <p className="text-sm text-gray-700 leading-relaxed">{result.summary}</p>
              </div>
            )}

            {result.entries?.length > 0 && (
              <div>
                <h3 className="text-xs font-bold text-gray-500 uppercase mb-3">포트폴리오 하이라이트</h3>
                <div className="flex flex-col gap-3">
                  {result.entries.map((entry, i) => {
                    const portfolio = portfolios.find((p) => p.id === entry.portfolio_id);
                    return (
                      <div key={i} className="border border-gray-100 rounded-xl p-4 hover:bg-gray-50 transition">
                        <p className="text-sm font-bold text-gray-900 mb-1.5">{portfolio?.title || '포트폴리오'}</p>
                        <p className="text-[13px] text-gray-600 mb-2 leading-relaxed">{entry.tailored_description}</p>
                        {entry.tailored_achievements?.length > 0 && (
                          <ul className="space-y-1">
                            {entry.tailored_achievements.map((a, j) => (
                              <li key={j} className="text-[13px] text-gray-500 flex items-start gap-2">
                                <span className="text-primary mt-0.5">•</span><span>{a}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      <ApiKeyModal open={showModal} onClose={() => setShowModal(false)} onSave={() => setShowModal(false)} />
    </div>
  );
}
