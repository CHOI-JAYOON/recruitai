import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import api from '../api/client';
import LoadingSpinner from '../components/LoadingSpinner';
import LoadingWithAd from '../components/LoadingWithAd';
import ApiKeyModal, { useApiKeyCheck } from '../components/ApiKeyModal';

// Word-level diff: highlights new/changed words in the refined answer
function diffHighlight(oldText, newText) {
  if (!oldText || !newText) return [{ text: newText || '', bold: false }];
  const oldWords = oldText.split(' ');
  const newWords = newText.split(' ');
  const m = oldWords.length, n = newWords.length;
  const dp = Array.from({ length: m + 1 }, () => new Uint16Array(n + 1));
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = oldWords[i - 1] === newWords[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);
  const kept = new Set();
  let i = m, j = n;
  while (i > 0 && j > 0) {
    if (oldWords[i - 1] === newWords[j - 1]) { kept.add(j - 1); i--; j--; }
    else if (dp[i - 1][j] > dp[i][j - 1]) i--;
    else j--;
  }
  const segments = [];
  let curBold = null, curWords = [];
  for (let k = 0; k < newWords.length; k++) {
    const bold = !kept.has(k);
    if (curBold !== null && bold !== curBold) { segments.push({ text: curWords.join(' '), bold: curBold }); curWords = []; }
    curBold = bold;
    curWords.push(newWords[k]);
  }
  if (curWords.length > 0) segments.push({ text: curWords.join(' '), bold: curBold });
  return segments;
}

export default function CoverLetterPage() {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const { showModal, setShowModal, checkApiKey } = useApiKeyCheck();
  const [jobDesc, setJobDesc] = useState('');
  const [company, setCompany] = useState('');
  const [questions, setQuestions] = useState([
    { text: '', maxLength: 500, answer: null, loading: false, chatMessages: [], chatInput: '', chatLoading: false, previousAnswer: null },
  ]);
  const [primaryResume, setPrimaryResume] = useState(null);
  const [primaryCareerDesc, setPrimaryCareerDesc] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showSetup, setShowSetup] = useState(true);
  const chatEndRefs = useRef([]);

  useEffect(() => {
    let primaryIds = [];
    try { primaryIds = JSON.parse(localStorage.getItem('recruitai_primary_resumes') || '[]'); } catch {}
    if (primaryIds.length > 0) {
      api.get(`/resume/history?username=${user.username}`).then((res) => {
        const match = res.data.find((r) => primaryIds.includes(r.id));
        setPrimaryResume(match || null);
      }).catch(() => {});
    }

    let primaryCareerDescIds = [];
    try { primaryCareerDescIds = JSON.parse(localStorage.getItem('recruitai_primary_career_descs') || '[]'); } catch {}
    if (primaryCareerDescIds.length > 0) {
      api.get(`/career-description/history?username=${user.username}`).then((res) => {
        const match = res.data.find((r) => primaryCareerDescIds.includes(r.id));
        setPrimaryCareerDesc(match || null);
      }).catch(() => {});
    }
  }, [user.username]);

  const scrollToChat = (idx) => {
    setTimeout(() => chatEndRefs.current[idx]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 100);
  };

  const addQuestion = () => {
    setQuestions([...questions, { text: '', maxLength: 500, answer: null, loading: false, chatMessages: [], chatInput: '', chatLoading: false, previousAnswer: null }]);
  };

  const removeQuestion = (idx) => {
    setQuestions(questions.filter((_, i) => i !== idx));
  };

  const updateQuestion = (idx, field, value) => {
    const updated = [...questions];
    updated[idx] = { ...updated[idx], [field]: value };
    setQuestions(updated);
  };

  const generateAnswer = async (idx) => {
    if (!checkApiKey()) return;
    const q = questions[idx];
    if (!q.text.trim()) return;
    updateQuestion(idx, 'loading', true);
    try {
      const res = await api.post('/cover-letter/answer', {
        question: q.text,
        max_length: q.maxLength,
        job_description: jobDesc,
        username: user.username,
        primary_resume: primaryResume,
        primary_career_desc: primaryCareerDesc,
      });
      const updated = [...questions];
      updated[idx] = { ...updated[idx], answer: res.data, loading: false, chatMessages: [], chatInput: '', previousAnswer: null };
      setQuestions(updated);
      toast.success('답변이 생성되었습니다.');
    } catch (err) {
      updateQuestion(idx, 'loading', false);
      toast.error(err.response?.data?.detail || 'AI 답변 생성 실패. API 키를 확인해주세요.');
    }
  };

  const handleRefine = async (idx) => {
    const q = questions[idx];
    const userMessage = q.chatInput?.trim();
    if (!userMessage || q.chatLoading) return;

    const currentAnswerText = q.answer.answer;
    const newChatMessages = [...q.chatMessages, { role: 'user', content: userMessage }];
    const updated = [...questions];
    updated[idx] = { ...updated[idx], chatMessages: newChatMessages, chatInput: '', chatLoading: true };
    setQuestions(updated);
    scrollToChat(idx);

    try {
      const res = await api.post('/cover-letter/refine', {
        question: q.text,
        max_length: q.maxLength,
        job_description: jobDesc,
        username: user.username,
        current_answer: currentAnswerText,
        chat_history: newChatMessages,
        primary_resume: primaryResume,
        primary_career_desc: primaryCareerDesc,
      });
      const refined = res.data.answer;
      setQuestions((prev) => {
        const next = [...prev];
        next[idx] = {
          ...next[idx],
          answer: { ...next[idx].answer, answer: refined },
          previousAnswer: currentAnswerText,
          chatMessages: [...newChatMessages, { role: 'assistant', content: '답변을 수정했습니다.' }],
          chatInput: '',
          chatLoading: false,
        };
        return next;
      });
      toast.success('답변이 수정되었습니다.');
      scrollToChat(idx);
    } catch {
      setQuestions((prev) => {
        const next = [...prev];
        next[idx] = { ...next[idx], chatInput: '', chatLoading: false };
        return next;
      });
      toast.error('수정 실패');
    }
  };

  const copyAnswer = async (idx) => {
    const text = questions[idx]?.answer?.answer;
    if (!text) return;
    await navigator.clipboard.writeText(text);
    toast.success('클립보드에 복사되었습니다.');
  };

  const hasAnyAnswer = questions.some((q) => q.answer);

  const handleSave = async () => {
    if (!company.trim()) { toast.error('지원 회사명을 입력해주세요.'); return; }
    if (!hasAnyAnswer) { toast.error('저장할 답변이 없습니다.'); return; }
    setSaving(true);
    try {
      const answers = questions
        .filter((q) => q.answer)
        .map((q) => ({ question: q.text, answer: q.answer.answer }));
      await api.post('/cover-letter/save', {
        username: user.username, company, job_description: jobDesc, answers,
      });
      toast.success('자소서가 저장되었습니다!');
    } catch {
      toast.error('저장 실패');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="animate-fade-in max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">자기소개서 작성</h1>
        <p className="text-sm text-gray-400">AI가 이력서와 경력기술서를 기반으로 자소서를 작성해드립니다.</p>
      </div>

      {/* Setup Section - Collapsible */}
      <div className="mb-6">
        <button onClick={() => setShowSetup(!showSetup)}
          className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-700 transition mb-3">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            className={`transition-transform ${showSetup ? 'rotate-90' : ''}`}>
            <polyline points="9 18 15 12 9 6" />
          </svg>
          설정
          <div className="flex items-center gap-1.5 ml-2">
            {primaryResume ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 text-green-600 text-[10px] font-semibold rounded-full">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                이력서
              </span>
            ) : (
              <span className="inline-flex items-center px-2 py-0.5 bg-amber-50 text-amber-500 text-[10px] font-semibold rounded-full">이력서 미설정</span>
            )}
            {primaryCareerDesc ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 text-green-600 text-[10px] font-semibold rounded-full">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                경력기술서
              </span>
            ) : (
              <span className="inline-flex items-center px-2 py-0.5 bg-amber-50 text-amber-500 text-[10px] font-semibold rounded-full">경력기술서 미설정</span>
            )}
          </div>
        </button>

        {showSetup && (
          <div className="animate-fade-in space-y-3">
            {/* Primary Resume & Career Desc badges */}
            <div className="flex flex-wrap gap-2">
              {primaryResume ? (
                <div className="flex items-center gap-2 px-3.5 py-2.5 bg-green-50 border border-green-100 rounded-xl">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                  <span className="text-xs font-semibold text-green-700">이력서: {primaryResume.target_role}</span>
                </div>
              ) : (
                <button onClick={() => navigate('/mypage?tab=resume')}
                  className="flex items-center gap-2 px-3.5 py-2.5 bg-amber-50 border border-amber-100 rounded-xl hover:bg-amber-100 transition group">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  <span className="text-xs font-semibold text-amber-600">대표 이력서 설정하기</span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:translate-x-0.5 transition-transform"><polyline points="9 18 15 12 9 6" /></svg>
                </button>
              )}
              {primaryCareerDesc ? (
                <div className="flex items-center gap-2 px-3.5 py-2.5 bg-pink-50 border border-pink-100 rounded-xl">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#e0437b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                  <span className="text-xs font-semibold text-[#e0437b]">경력기술서: {primaryCareerDesc.target_role}</span>
                </div>
              ) : (
                <button onClick={() => navigate('/mypage?tab=resume')}
                  className="flex items-center gap-2 px-3.5 py-2.5 bg-amber-50 border border-amber-100 rounded-xl hover:bg-amber-100 transition group">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  <span className="text-xs font-semibold text-amber-600">대표 경력기술서 설정하기</span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:translate-x-0.5 transition-transform"><polyline points="9 18 15 12 9 6" /></svg>
                </button>
              )}
            </div>

            {/* Company & Job Desc */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5">지원 회사</label>
                <input value={company} onChange={(e) => setCompany(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white transition"
                  placeholder="예: 포티투마루, 네이버" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5">직무기술서 (선택)</label>
                <textarea value={jobDesc} onChange={(e) => setJobDesc(e.target.value)} rows={3}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white resize-none transition"
                  placeholder="직무기술서를 붙여넣기하세요..." />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="border-t border-gray-100 mb-6" />

      {/* Questions */}
      <div className="flex flex-col gap-6">
        {questions.map((q, idx) => (
          <div key={idx} className="group">
            {/* Question Header */}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-bold text-primary bg-primary/5 px-2.5 py-1 rounded-lg">Q{idx + 1}</span>
              {questions.length > 1 && (
                <button onClick={() => removeQuestion(idx)}
                  className="ml-auto text-xs text-gray-300 hover:text-red-400 transition opacity-0 group-hover:opacity-100">
                  삭제
                </button>
              )}
            </div>

            {/* Question Input */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
              <textarea value={q.text} onChange={(e) => updateQuestion(idx, 'text', e.target.value)} rows={2}
                className="w-full px-5 py-4 text-[15px] text-gray-800 bg-transparent focus:outline-none resize-none placeholder:text-gray-300 leading-relaxed"
                placeholder="자소서 문항을 입력하세요..." />

              <div className="px-5 pb-4 flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-gray-400">글자수</span>
                  <input type="number" value={q.maxLength} onChange={(e) => updateQuestion(idx, 'maxLength', parseInt(e.target.value) || 500)}
                    className="w-16 px-2 py-1 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-600 focus:outline-none focus:ring-1 focus:ring-primary/20 text-center" />
                </div>
                <button onClick={() => generateAnswer(idx)} disabled={q.loading || !q.text.trim()}
                  className="ml-auto inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-dark transition disabled:opacity-40">
                  {q.loading ? (
                    <>
                      <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" opacity="0.25" /><path d="M12 2a10 10 0 0 1 10 10" /></svg>
                      생성 중...
                    </>
                  ) : (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" /></svg>
                      AI 작성
                    </>
                  )}
                </button>
              </div>
            </div>

            {q.loading && (
              <div className="mt-3">
                <LoadingWithAd text="대표 이력서/경력기술서 기반 답변 생성 중..." adSlot="SLOT_COVERLETTER" />
              </div>
            )}

            {/* Answer */}
            {q.answer && (
              <div className="mt-3 animate-fade-in">
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
                  {/* Answer Header */}
                  <div className="flex items-center justify-between px-5 pt-4 pb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-md bg-gradient-to-br from-primary to-blue-400 flex items-center justify-center">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z" /></svg>
                      </div>
                      <span className="text-xs font-bold text-gray-500">AI 생성 답변</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-[11px] text-gray-400 mr-2">{q.answer.answer?.length || 0}자</span>
                      <button onClick={() => generateAnswer(idx)} disabled={q.loading}
                        className="p-1.5 rounded-lg hover:bg-gray-100 transition disabled:opacity-50" title="다시 생성">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#adb5bd" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" /></svg>
                      </button>
                      <button onClick={() => copyAnswer(idx)} className="p-1.5 rounded-lg hover:bg-gray-100 transition" title="복사하기">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#adb5bd" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
                      </button>
                    </div>
                  </div>

                  {/* Answer Body */}
                  <div className="px-5 pb-4">
                    <div className="bg-gray-50/70 rounded-xl p-4">
                      <p className="text-[14px] text-gray-800 whitespace-pre-wrap leading-[1.8]">
                        {q.previousAnswer ? diffHighlight(q.previousAnswer, q.answer.answer).map((seg, si) => {
                          const space = si > 0 ? ' ' : '';
                          return seg.bold
                            ? <span key={si}>{space}<mark className="bg-yellow-100 text-gray-900 font-semibold rounded-sm px-0.5">{seg.text}</mark></span>
                            : <span key={si}>{space}{seg.text}</span>;
                        }) : q.answer.answer}
                      </p>
                    </div>
                  </div>

                  {/* Chat Refinement */}
                  <div className="border-t border-gray-50 px-5 py-4">
                    {/* Chat History */}
                    {q.chatMessages.length > 0 && (
                      <div className="flex flex-col gap-2.5 mb-4 max-h-64 overflow-y-auto">
                        {q.chatMessages.map((msg, mi) => (
                          <div key={mi} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-[13px] leading-relaxed ${
                              msg.role === 'user'
                                ? 'bg-primary text-white rounded-br-lg'
                                : 'bg-gray-50 text-gray-600 rounded-bl-lg'
                            }`}>
                              <p className="whitespace-pre-wrap">{msg.content}</p>
                            </div>
                          </div>
                        ))}
                        {q.chatLoading && (
                          <div className="flex justify-start">
                            <div className="bg-gray-50 rounded-2xl rounded-bl-lg px-4 py-2.5 text-[13px] text-gray-400 flex items-center gap-2">
                              <svg className="animate-spin" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" opacity="0.25" /><path d="M12 2a10 10 0 0 1 10 10" /></svg>
                              수정 중...
                            </div>
                          </div>
                        )}
                        <div ref={(el) => (chatEndRefs.current[idx] = el)} />
                      </div>
                    )}

                    {/* Chat Input */}
                    <div className="flex items-center gap-2">
                      <div className="flex-1 relative">
                        <input
                          value={q.chatInput || ''}
                          onChange={(e) => updateQuestion(idx, 'chatInput', e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleRefine(idx); } }}
                          className="w-full pl-4 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white transition"
                          placeholder="수정 요청을 입력하세요... (예: 좀 더 구체적으로 써줘)"
                        />
                        <button
                          onClick={() => handleRefine(idx)}
                          disabled={q.chatLoading || !q.chatInput?.trim()}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-primary hover:bg-primary/10 rounded-lg transition disabled:opacity-30 disabled:hover:bg-transparent"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add Question */}
      <button onClick={addQuestion}
        className="mt-6 w-full py-3.5 border-2 border-dashed border-gray-200 text-sm text-gray-400 font-medium rounded-2xl hover:border-primary/40 hover:text-primary hover:bg-primary/[0.02] transition">
        + 문항 추가
      </button>

      {/* Save Button */}
      {hasAnyAnswer && (
        <div className="mt-6 flex justify-end">
          <button onClick={handleSave} disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-800 transition disabled:opacity-50 shadow-sm">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" /></svg>
            {saving ? '저장 중...' : '자소서 저장'}
          </button>
        </div>
      )}
      <ApiKeyModal open={showModal} onClose={() => setShowModal(false)} onSave={() => setShowModal(false)} />
    </div>
  );
}
