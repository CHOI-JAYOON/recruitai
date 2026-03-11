import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import api from '../api/client';
import LoadingSpinner from '../components/LoadingSpinner';

const steps = [
  { num: 1, label: '직무 선택' },
  { num: 2, label: '경력 선택' },
  { num: 3, label: '결과 확인' },
];

export default function CareerDescPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [portfolios, setPortfolios] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [targetRole, setTargetRole] = useState('');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [result, setResult] = useState(null);
  const [step, setStep] = useState(1);

  useEffect(() => {
    api.get('/portfolios').then((res) => {
      setPortfolios(res.data.filter((p) => p.type === 'career'));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [user.username]);

  const toggleSelect = (id) => {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setResult(null);
    try {
      const res = await api.post('/career-description/generate', {
        username: user.username,
        selected_portfolio_ids: selectedIds,
        target_role: targetRole,
      });
      setResult(res.data);
      setStep(3);
      toast.success('경력기술서가 생성되었습니다!');
    } catch (err) {
      toast.error(err.response?.data?.detail || '경력기술서 생성 실패. API 키를 확인해주세요.');
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const res = await api.post('/career-description/download', {
        username: user.username,
        selected_portfolio_ids: selectedIds,
        target_role: targetRole,
      }, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${user.username}_경력기술서.docx`;
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
        <h1 className="text-xl font-bold text-gray-900">경력기술서 생성</h1>
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

      {/* Step 1: Target Role */}
      {step === 1 && (
        <div className="animate-fade-in">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-2">어떤 직무에 지원하시나요?</h2>
            <p className="text-sm text-gray-500 mb-5">지원 직무에 맞춰 경력기술서가 최적화됩니다.</p>
            <input
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white transition"
              placeholder="예: AI 엔지니어, 백엔드 개발자, 프론트엔드 개발자"
              onKeyDown={(e) => e.key === 'Enter' && targetRole.trim() && setStep(2)}
            />
            <button
              onClick={() => setStep(2)}
              disabled={!targetRole.trim()}
              className="mt-5 w-full py-3.5 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition disabled:opacity-40 text-[15px]"
            >
              다음
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Career Selection (grouped by company) */}
      {step === 2 && (() => {
        const companyOrder = [];
        const companyMap = {};
        portfolios.forEach((p) => {
          const key = p.company || p.title || '기타';
          if (!companyMap[key]) { companyOrder.push(key); companyMap[key] = []; }
          companyMap[key].push(p);
        });
        return (
          <div className="animate-fade-in">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-900 mb-1">경력 선택</h2>
                  <p className="text-sm text-gray-500">경력기술서에 포함할 경력을 선택하세요 (선택사항)</p>
                </div>
                <span className="text-sm font-bold text-primary">{selectedIds.length}/{portfolios.length}</span>
              </div>
              {portfolios.length === 0 ? (
                <p className="text-sm text-gray-400 py-8 text-center">등록된 경력이 없습니다. 홈에서 경력을 추가해주세요.</p>
              ) : (
                <div className="flex flex-col gap-4 mb-5">
                  {companyOrder.map((company) => (
                    <div key={company}>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 rounded-md bg-[#3182f6]/10 flex items-center justify-center">
                          <span className="text-[11px] font-bold text-[#3182f6]">{company.charAt(0)}</span>
                        </div>
                        <span className="text-xs font-bold text-gray-700">{company}</span>
                        <button
                          onClick={() => {
                            const ids = companyMap[company].map((p) => p.id);
                            const allSelected = ids.every((id) => selectedIds.includes(id));
                            setSelectedIds((prev) => allSelected ? prev.filter((id) => !ids.includes(id)) : [...new Set([...prev, ...ids])]);
                          }}
                          className="text-[11px] font-medium text-primary hover:text-primary-dark ml-auto transition">
                          {companyMap[company].every((p) => selectedIds.includes(p.id)) ? '전체 해제' : '전체 선택'}
                        </button>
                      </div>
                      <div className="flex flex-col gap-2">
                        {companyMap[company].map((p) => (
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
                              <p className="text-xs text-gray-400 mt-0.5">{p.role}{p.period ? ` · ${p.period}` : ''}</p>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-3">
                <button onClick={() => setStep(1)}
                  className="flex-1 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition">이전</button>
                <button onClick={handleGenerate}
                  disabled={generating}
                  className="flex-1 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition disabled:opacity-40">
                  {generating ? 'AI 생성 중...' : '경력기술서 생성'}
                </button>
              </div>
            </div>
            {generating && <div className="mt-4"><LoadingSpinner text="AI가 경력기술서를 작성하고 있습니다..." /></div>}
          </div>
        );
      })()}

      {/* Step 3: Result */}
      {step === 3 && result && (
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
                <h3 className="text-xs font-bold text-primary mb-1.5">경력 요약</h3>
                <p className="text-sm text-gray-700 leading-relaxed">{result.summary}</p>
              </div>
            )}

            {result.entries?.length > 0 && (
              <div>
                <h3 className="text-xs font-bold text-gray-500 uppercase mb-3">경력 상세</h3>
                <div className="flex flex-col gap-4">
                  {result.entries.map((entry, i) => (
                    <div key={i} className="border border-gray-100 rounded-xl p-5 hover:bg-gray-50 transition">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#e0437b] to-[#f472b6] flex items-center justify-center shrink-0">
                          <span className="text-white text-sm font-bold">{entry.company?.charAt(0)}</span>
                        </div>
                        <div>
                          <p className="text-[15px] font-bold text-gray-900">{entry.company} · {entry.position}</p>
                          <p className="text-xs text-gray-400">{entry.period}</p>
                        </div>
                      </div>

                      {entry.description && (
                        <p className="text-[13px] text-gray-600 mb-3 leading-relaxed">{entry.description}</p>
                      )}

                      {entry.key_achievements?.length > 0 && (
                        <div className="mb-3">
                          <p className="text-xs font-bold text-gray-500 mb-1.5">핵심 성과</p>
                          <ul className="space-y-1">
                            {entry.key_achievements.map((a, j) => (
                              <li key={j} className="text-[13px] text-gray-600 flex items-start gap-2">
                                <span className="text-primary mt-0.5">•</span><span>{a}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {entry.relevant_projects?.length > 0 && (
                        <div>
                          <p className="text-xs font-bold text-gray-500 mb-1.5">관련 프로젝트</p>
                          <ul className="space-y-1">
                            {entry.relevant_projects.map((p, j) => (
                              <li key={j} className="text-[13px] text-gray-600 flex items-start gap-2">
                                <span className="text-[#e0437b] mt-0.5">▸</span><span>{p}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
