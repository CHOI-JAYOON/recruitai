import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import api from '../api/client';
import LoadingSpinner from '../components/LoadingSpinner';

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
  const [jobDesc, setJobDesc] = useState('');
  const [company, setCompany] = useState('');
  const [questions, setQuestions] = useState([
    { text: '', maxLength: 500, answer: null, loading: false, chatMessages: [], chatInput: '', chatLoading: false, previousAnswer: null },
  ]);
  const [primaryResume, setPrimaryResume] = useState(null);
  const [primaryCareerDesc, setPrimaryCareerDesc] = useState(null);
  const [saving, setSaving] = useState(false);
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
    <div className="animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-xl font-bold text-gray-900">자기소개서 작성</h1>
        <div className="flex flex-wrap items-center gap-2">
          {primaryResume ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-50 text-green-600 text-xs font-semibold rounded-full border border-green-200">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
              이력서: {primaryResume.target_role}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-600 text-xs font-semibold rounded-full border border-amber-200">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              대표 이력서 미설정
            </span>
          )}
          {primaryCareerDesc ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-pink-50 text-[#e0437b] text-xs font-semibold rounded-full border border-pink-200">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
              경력기술서: {primaryCareerDesc.target_role}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-50 text-gray-400 text-xs font-semibold rounded-full border border-gray-200">
              경력기술서 미설정
            </span>
          )}
        </div>
      </div>

      {/* Company + Job Description */}
      <div className="gradient-hero-soft rounded-2xl p-5 mb-5">
        <div className="mb-4">
          <h2 className="text-[13px] font-bold text-gray-900 mb-2">지원 회사</h2>
          <input value={company} onChange={(e) => setCompany(e.target.value)}
            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
            placeholder="예: 포티투마루, 네이버" />
        </div>
        <div>
          <h2 className="text-[13px] font-bold text-gray-900 mb-2">직무기술서 (선택)</h2>
          <textarea value={jobDesc} onChange={(e) => setJobDesc(e.target.value)} rows={3}
            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none transition"
            placeholder="직무기술서를 붙여넣기하세요..." />
        </div>
      </div>

      {/* Questions */}
      <div className="flex flex-col gap-4">
        {questions.map((q, idx) => (
          <div key={idx} className="bg-white rounded-2xl border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-5 relative">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0">
                <span className="text-white text-xs font-bold">{idx + 1}</span>
              </div>
              <h3 className="text-[13px] font-bold text-gray-900 flex-1">문항 {idx + 1}</h3>
              {questions.length > 1 && (
                <button onClick={() => removeQuestion(idx)} className="text-xs text-gray-400 hover:text-red-500 transition">삭제</button>
              )}
            </div>

            <textarea value={q.text} onChange={(e) => updateQuestion(idx, 'text', e.target.value)} rows={2}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white resize-none mb-3 transition"
              placeholder="자소서 문항을 입력하세요..." />

            <div className="flex items-center gap-3 mb-3">
              <label className="text-xs text-gray-500 font-medium">최대 글자수:</label>
              <input type="number" value={q.maxLength} onChange={(e) => updateQuestion(idx, 'maxLength', parseInt(e.target.value) || 500)}
                className="w-20 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/20" />
              <button onClick={() => generateAnswer(idx)} disabled={q.loading || !q.text.trim()}
                className="ml-auto px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-dark transition disabled:opacity-50">
                {q.loading ? 'AI 작성 중...' : 'AI 답변 생성'}
              </button>
            </div>

            {q.loading && <LoadingSpinner text="대표 이력서/경력기술서 기반 답변 생성 중..." />}

            {q.answer && (
              <div className="mt-3 border-t border-gray-100 pt-4 animate-fade-in">
                {/* Answer display */}
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-bold text-gray-500">AI 생성 답변</p>
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-gray-400">{q.answer.answer?.length || 0}자</p>
                    <button onClick={() => generateAnswer(idx)} disabled={q.loading}
                      className="p-1.5 rounded-lg hover:bg-gray-100 transition disabled:opacity-50" title="다시 생성">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8b95a1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" /></svg>
                    </button>
                    <button onClick={() => copyAnswer(idx)} className="p-1.5 rounded-lg hover:bg-gray-100 transition" title="복사하기">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8b95a1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
                    </button>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 mb-4">
                  <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                    {q.previousAnswer ? diffHighlight(q.previousAnswer, q.answer.answer).map((seg, si, arr) => {
                      const space = si > 0 ? ' ' : '';
                      return seg.bold
                        ? <span key={si}>{space}<mark className="bg-yellow-100 text-gray-900 font-semibold rounded-sm px-0.5">{seg.text}</mark></span>
                        : <span key={si}>{space}{seg.text}</span>;
                    }) : q.answer.answer}
                  </p>
                </div>

                {/* Chat refinement */}
                <div className="border-t border-gray-100 pt-3">
                  <p className="text-xs font-bold text-gray-400 mb-3 flex items-center gap-1.5">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                    AI와 대화하며 수정하기
                  </p>

                  {q.chatMessages.length > 0 && (
                    <div className="flex flex-col gap-2 mb-3 max-h-60 overflow-y-auto">
                      {q.chatMessages.map((msg, mi) => (
                        <div key={mi} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-[13px] ${
                            msg.role === 'user'
                              ? 'bg-primary text-white rounded-br-md'
                              : 'bg-gray-100 text-gray-700 rounded-bl-md'
                          }`}>
                            <p className="whitespace-pre-wrap">{msg.content}</p>
                          </div>
                        </div>
                      ))}
                      {q.chatLoading && (
                        <div className="flex justify-start">
                          <div className="bg-gray-100 rounded-2xl rounded-bl-md px-3.5 py-2 text-[13px] text-gray-400">
                            수정 중...
                          </div>
                        </div>
                      )}
                      <div ref={(el) => (chatEndRefs.current[idx] = el)} />
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <input
                      value={q.chatInput || ''}
                      onChange={(e) => updateQuestion(idx, 'chatInput', e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleRefine(idx); } }}
                      className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                      placeholder="수정 요청을 입력하세요... (예: 좀 더 구체적으로 써줘)"
                    />
                    <button
                      onClick={() => handleRefine(idx)}
                      disabled={q.chatLoading || !q.chatInput?.trim()}
                      className="px-4 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-dark transition disabled:opacity-50 shrink-0"
                    >
                      전송
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <button onClick={addQuestion}
        className="mt-4 w-full py-3 border-2 border-dashed border-gray-300 text-sm text-gray-500 font-medium rounded-xl hover:border-primary hover:text-primary transition">
        + 문항 추가
      </button>

      {hasAnyAnswer && (
        <button onClick={handleSave} disabled={saving}
          className="mt-4 ml-auto block px-5 py-2 bg-gray-800 text-white text-sm font-semibold rounded-lg hover:bg-gray-900 transition disabled:opacity-50">
          {saving ? '저장 중...' : '자소서 저장'}
        </button>
      )}
    </div>
  );
}
