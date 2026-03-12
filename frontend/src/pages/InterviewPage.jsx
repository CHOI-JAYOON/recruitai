import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import api from '../api/client';
import LoadingSpinner from '../components/LoadingSpinner';
import LoadingWithAd from '../components/LoadingWithAd';
import UpgradePlanModal from '../components/UpgradePlanModal';

const categoryLabels = { technical: '기술', behavioral: '인성', situational: '상황', portfolio: '포트폴리오', resume: '이력서', solution: '솔루션' };
const categoryStyles = {
  technical: 'bg-[#e8f3ff] text-[#3182f6]', behavioral: 'bg-[#e8faf5] text-[#00a868]',
  situational: 'bg-[#fff8e6] text-[#d4920a]', portfolio: 'bg-[#f3eeff] text-[#7b61ff]',
  resume: 'bg-[#ffe8f0] text-[#e0437b]', solution: 'bg-[#fff0e6] text-[#d46519]',
};
const difficultyLabels = { easy: '쉬움', medium: '보통', hard: '어려움' };

function ScoreGauge({ score, size = 100 }) {
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 10) * circumference;
  const color = score >= 8 ? '#00a868' : score >= 6 ? '#d4920a' : '#e0437b';

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="score-ring">
        <circle className="score-ring-bg" cx={size/2} cy={size/2} r={radius} strokeWidth={strokeWidth} />
        <circle className="score-ring-fill" cx={size/2} cy={size/2} r={radius} strokeWidth={strokeWidth}
          stroke={color} strokeDasharray={circumference} strokeDashoffset={offset} />
      </svg>
      <div className="absolute text-center">
        <div className="text-2xl font-extrabold" style={{ color }}>{score}</div>
        <div className="text-[10px] text-gray-400 font-medium">/10</div>
      </div>
    </div>
  );
}

function Timer({ running, onTick }) {
  const [seconds, setSeconds] = useState(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSeconds((s) => { onTick?.(s + 1); return s + 1; });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [running]);

  useEffect(() => { setSeconds(0); }, [running]);

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;

  if (!running) return null;
  return (
    <div className="flex items-center gap-1.5 text-sm font-mono text-gray-500">
      <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
      {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
    </div>
  );
}

export default function InterviewPage() {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [tab, setTab] = useState('generate');
  const [jobDesc, setJobDesc] = useState('');
  const [count, setCount] = useState(7);
  const [questions, setQuestions] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [feedbacks, setFeedbacks] = useState([]);
  const [evaluating, setEvaluating] = useState(false);
  const [interviewDone, setInterviewDone] = useState(false);
  const [timerRunning, setTimerRunning] = useState(false);

  // History
  const [history, setHistory] = useState([]);
  const [viewingRecord, setViewingRecord] = useState(null);
  const [sessionSaving, setSessionSaving] = useState(false);
  const [sessionSaved, setSessionSaved] = useState(false);

  // Primary resume & career description context
  const [primaryResume, setPrimaryResume] = useState(null);
  const [primaryCareerDesc, setPrimaryCareerDesc] = useState(null);
  const [careerDescCount, setCareerDescCount] = useState(0);

  useEffect(() => {
    loadHistory();
    // Load primary resume
    let primaryResumeIds = [];
    try { primaryResumeIds = JSON.parse(localStorage.getItem('recruitai_primary_resumes') || '[]'); } catch {}
    if (primaryResumeIds.length > 0) {
      api.get(`/resume/history?username=${user.username}`).then((res) => {
        const match = res.data.find((r) => primaryResumeIds.includes(r.id));
        setPrimaryResume(match || null);
      }).catch(() => {});
    }
    // Load primary career description
    let primaryCareerDescIds = [];
    try { primaryCareerDescIds = JSON.parse(localStorage.getItem('recruitai_primary_career_descs') || '[]'); } catch {}
    api.get(`/career-description/history?username=${user.username}`).then((res) => {
      setCareerDescCount(res.data.length);
      if (primaryCareerDescIds.length > 0) {
        const match = res.data.find((r) => primaryCareerDescIds.includes(r.id));
        setPrimaryCareerDesc(match || null);
      }
    }).catch(() => {});
  }, []);

  const loadHistory = async () => {
    try {
      const res = await api.get(`/interview/history?username=${user.username}`);
      setHistory(res.data);
    } catch { /* ignore */ }
  };

  const generateQuestions = async () => {
    if (!jobDesc.trim()) { toast.error('직무기술서를 입력해주세요.'); return; }
    setGenerating(true);
    try {
      const payload = { job_description: jobDesc, count };
      if (primaryResume) {
        payload.resume_summary = primaryResume.summary || '';
      }
      if (primaryCareerDesc) {
        payload.career_description = {
          summary: primaryCareerDesc.summary || '',
          target_role: primaryCareerDesc.target_role || '',
          entries: primaryCareerDesc.entries || [],
        };
      }
      const res = await api.post('/interview/generate-questions', payload);
      setQuestions(res.data);
      setFeedbacks([]);
      setCurrentIdx(0);
      setInterviewDone(false);
      setSessionSaved(false);
      toast.success(`${res.data.length}개 질문이 생성되었습니다.`);
    } catch (err) {
      toast.error(err.response?.data?.detail || '질문 생성 실패. API 키를 확인해주세요.');
    } finally {
      setGenerating(false);
    }
  };

  const startMock = () => {
    setTab('mock');
    setTimerRunning(true);
  };

  const submitAnswer = async () => {
    if (!userAnswer.trim()) return;
    setEvaluating(true);
    setTimerRunning(false);
    try {
      const res = await api.post('/interview/evaluate', { question: questions[currentIdx], user_answer: userAnswer });
      setFeedbacks([...feedbacks, res.data]);
      setUserAnswer('');
      if (currentIdx + 1 >= questions.length) {
        setInterviewDone(true);
      } else {
        setCurrentIdx(currentIdx + 1);
        setTimerRunning(true);
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || '평가 실패');
      setTimerRunning(true);
    } finally {
      setEvaluating(false);
    }
  };

  const saveSession = async () => {
    setSessionSaving(true);
    try {
      const avg = feedbacks.length
        ? parseFloat((feedbacks.reduce((s, f) => s + (f.score || 0), 0) / feedbacks.length).toFixed(1))
        : 0;
      await api.post('/interview/save-session', {
        username: user.username,
        job_description: jobDesc,
        questions: questions.map((q) => ({ question: q.question, category: q.category, difficulty: q.difficulty })),
        feedbacks: feedbacks.map((f) => ({ score: f.score, strengths: f.strengths, improvements: f.improvements })),
        avg_score: avg,
      });
      setSessionSaved(true);
      await loadHistory();
      toast.success('면접 기록이 저장되었습니다!');
    } catch {
      toast.error('저장 실패');
    } finally {
      setSessionSaving(false);
    }
  };

  const deleteHistory = async (recordId) => {
    if (!confirm('이 기록을 삭제하시겠습니까?')) return;
    try {
      await api.delete(`/interview/history/${recordId}?username=${user.username}`);
      if (viewingRecord?.id === recordId) setViewingRecord(null);
      await loadHistory();
      toast.success('삭제되었습니다.');
    } catch {
      toast.error('삭제 실패');
    }
  };

  const avgScore = feedbacks.length
    ? (feedbacks.reduce((s, f) => s + (f.score || 0), 0) / feedbacks.length).toFixed(1)
    : 0;

  const getScoreColor = (score) => score >= 8 ? 'text-[#00a868]' : score >= 6 ? 'text-[#d4920a]' : 'text-[#e0437b]';
  const getScoreBg = (score) => score >= 8 ? 'bg-[#e8faf5]' : score >= 6 ? 'bg-[#fff8e6]' : 'bg-[#ffe8f0]';

  const formatDate = (iso) => {
    const d = new Date(iso);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
  };

  return (
    <div className="animate-fade-in">
      <h1 className="text-xl font-bold text-gray-900 mb-4">면접 연습</h1>

      {/* Context info banner */}
      <div className="flex flex-wrap items-center gap-2 mb-5">
        {primaryResume ? (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold bg-green-50 border-green-200 text-green-600">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
            대표 이력서: {primaryResume.target_role}
          </div>
        ) : (
          <button onClick={() => navigate('/mypage?tab=resume')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold bg-amber-50 border-amber-200 text-amber-600 hover:bg-amber-100 transition cursor-pointer">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            대표 이력서 미설정
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
          </button>
        )}
        {primaryCareerDesc ? (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold bg-green-50 border-green-200 text-green-600">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
            대표 경력기술서: {primaryCareerDesc.target_role}
          </div>
        ) : (
          <button onClick={() => navigate('/mypage?tab=resume')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold bg-amber-50 border-amber-200 text-amber-600 hover:bg-amber-100 transition cursor-pointer">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            {careerDescCount > 0 ? '대표 경력기술서 미설정' : '경력기술서 없음'}
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
          </button>
        )}
        <p className="text-[11px] text-gray-400 w-full mt-1">
          대표 이력서와 경력기술서를 기반으로 맞춤형 면접 질문이 생성됩니다
        </p>
      </div>

      {/* Tab */}
      <div className="flex gap-1 mb-5 bg-gray-100 p-1 rounded-xl">
        <button onClick={() => setTab('generate')}
          className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition ${tab === 'generate' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>
          질문 생성
        </button>
        <button onClick={() => setTab('mock')} disabled={questions.length === 0}
          className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition ${tab === 'mock' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'} disabled:opacity-40`}>
          모의 면접
        </button>
      </div>

      {/* Generate Tab */}
      {tab === 'generate' && (
        <div>
          {/* History */}
          {history.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-5 mb-5">
              <h2 className="text-[13px] font-bold text-gray-900 mb-3">
                면접 기록 <span className="text-xs font-normal text-gray-400">({history.length})</span>
              </h2>
              <div className="flex flex-col gap-2">
                {history.map((record) => {
                  const score = record.avg_score || 0;
                  const scoreBg = score >= 8 ? 'from-[#00a868] to-[#34d399]' : score >= 6 ? 'from-[#f59e0b] to-[#fbbf24]' : 'from-[#e0437b] to-[#f472b6]';
                  return (
                    <div key={record.id}
                      className={`flex items-center justify-between px-4 py-3.5 rounded-xl border cursor-pointer transition ${
                        viewingRecord?.id === record.id
                          ? 'border-primary/40 bg-primary-light/50' : 'border-gray-200 hover:bg-gray-50'
                      }`}
                      onClick={() => setViewingRecord(viewingRecord?.id === record.id ? null : record)}>
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${scoreBg} flex items-center justify-center shrink-0`}>
                          <span className="text-white text-xs font-bold">{score.toFixed ? score.toFixed(0) : score}</span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">
                            {record.job_description?.slice(0, 30) || '면접 연습'}{record.job_description?.length > 30 ? '...' : ''}
                          </p>
                          <p className="text-xs text-gray-400">{formatDate(record.created_at)} · {record.questions?.length || 0}개 문항 · 평균 {typeof score === 'number' ? score.toFixed(1) : score}점</p>
                        </div>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); deleteHistory(record.id); }}
                        className="ml-3 px-2.5 py-1.5 text-xs text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition shrink-0">삭제</button>
                    </div>
                  );
                })}
              </div>

              {viewingRecord && (
                <div className="mt-4 border-t border-gray-100 pt-4 animate-fade-in">
                  <h3 className="text-[13px] font-bold text-gray-900 mb-3">면접 상세</h3>
                  <div className="flex flex-col gap-2">
                    {viewingRecord.questions?.map((q, i) => {
                      const fb = viewingRecord.feedbacks?.[i];
                      return (
                        <div key={i} className="bg-gray-50 rounded-xl p-4">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-xs font-bold text-primary">Q{i + 1}. {q.question}</p>
                            {fb && (
                              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${getScoreBg(fb.score)} ${getScoreColor(fb.score)}`}>
                                {fb.score}/10
                              </span>
                            )}
                          </div>
                          {fb?.strengths?.length > 0 && (
                            <p className="text-xs text-gray-600"><span className="text-[#00a868] font-semibold">+</span> {fb.strengths[0]}</p>
                          )}
                          {fb?.improvements?.length > 0 && (
                            <p className="text-xs text-gray-600 mt-0.5"><span className="text-[#e0437b] font-semibold">-</span> {fb.improvements[0]}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="bg-white rounded-2xl border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-5 mb-5">
            <h2 className="text-[13px] font-bold text-gray-900 mb-3">직무기술서</h2>
            <textarea value={jobDesc} onChange={(e) => setJobDesc(e.target.value)} rows={4}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white resize-none mb-3 transition"
              placeholder="직무기술서를 붙여넣기하세요..." />
            <div className="flex items-center gap-3">
              <label className="text-[13px] text-gray-600 font-medium">질문 수:</label>
              <input type="number" value={count} onChange={(e) => setCount(parseInt(e.target.value) || 7)} min={1} max={20}
                className="w-16 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
              <button onClick={generateQuestions} disabled={generating}
                className="ml-auto px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-dark transition disabled:opacity-50">
                {generating ? '생성 중...' : '질문 생성'}
              </button>
            </div>
          </div>

          {generating && <LoadingWithAd text="AI가 면접 질문을 생성하고 있습니다..." adSlot="SLOT_INTERVIEW" />}

          {questions.length > 0 && (
            <div className="flex flex-col gap-2 stagger-children">
              {questions.map((q, i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.04)] px-5 py-4 flex items-start gap-3">
                  <span className="text-sm font-bold text-gray-300 mt-0.5 w-5 shrink-0">{i + 1}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${categoryStyles[q.category] || 'bg-gray-100 text-gray-600'}`}>
                        {categoryLabels[q.category] || q.category}
                      </span>
                      <span className="text-xs text-gray-400">{difficultyLabels[q.difficulty] || q.difficulty}</span>
                    </div>
                    <p className="text-sm text-gray-800 leading-relaxed">{q.question}</p>
                  </div>
                </div>
              ))}
              <button onClick={startMock}
                className="mt-3 w-full py-3.5 bg-gray-800 text-white font-semibold rounded-xl hover:bg-gray-900 transition">
                모의 면접 시작
              </button>
            </div>
          )}
        </div>
      )}

      {/* Mock Interview Tab */}
      {tab === 'mock' && (
        <div>
          {!interviewDone ? (
            <div className="animate-fade-in">
              {/* Progress + Timer */}
              <div className="flex items-center gap-3 mb-5">
                <div className="flex-1 h-2.5 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full transition-all duration-500"
                    style={{ width: `${((currentIdx) / questions.length) * 100}%` }} />
                </div>
                <span className="text-xs font-semibold text-gray-500 whitespace-nowrap">{currentIdx + 1} / {questions.length}</span>
                <Timer running={timerRunning} />
              </div>

              {/* Question */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-5 mb-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${categoryStyles[questions[currentIdx]?.category] || ''}`}>
                    {categoryLabels[questions[currentIdx]?.category]}
                  </span>
                  <span className="text-xs text-gray-400">{difficultyLabels[questions[currentIdx]?.difficulty]}</span>
                </div>
                <p className="text-[15px] font-semibold text-gray-900 leading-relaxed">{questions[currentIdx]?.question}</p>
              </div>

              <textarea value={userAnswer} onChange={(e) => setUserAnswer(e.target.value)} rows={5}
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none mb-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
                placeholder="답변을 입력하세요..." />

              <button onClick={submitAnswer} disabled={evaluating || !userAnswer.trim()}
                className="w-full py-3.5 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition disabled:opacity-50">
                {evaluating ? 'AI가 평가 중...' : '답변 제출'}
              </button>

              {evaluating && <div className="mt-3"><LoadingWithAd text="AI가 답변을 평가하고 있습니다..." adSlot="SLOT_INTERVIEW" /></div>}

              {feedbacks.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-[13px] font-bold text-gray-700 mb-3">이전 피드백</h3>
                  <div className="flex flex-col gap-2">
                    {feedbacks.map((fb, i) => (
                      <div key={i} className="bg-gray-50 rounded-xl p-4 flex items-center gap-3">
                        <ScoreGauge score={fb.score} size={44} />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-500 truncate">Q{i + 1}. {questions[i]?.question?.slice(0, 40)}...</p>
                          {fb.strengths?.length > 0 && <p className="text-xs text-gray-600 mt-0.5 truncate">{fb.strengths[0]}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Results */
            <div className="animate-fade-in">
              <div className="bg-white rounded-2xl border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-8 mb-5 text-center">
                <h2 className="text-lg font-bold text-gray-900 mb-4">면접 완료!</h2>
                <ScoreGauge score={parseFloat(avgScore)} size={120} />
                <p className="text-sm text-gray-500 mt-3">평균 점수</p>
                <div className="flex justify-center gap-8 mt-6">
                  {[
                    { label: '우수', count: feedbacks.filter((f) => f.score >= 8).length, bg: 'bg-[#e8faf5]', color: 'text-[#00a868]' },
                    { label: '보통', count: feedbacks.filter((f) => f.score >= 6 && f.score < 8).length, bg: 'bg-[#fff8e6]', color: 'text-[#d4920a]' },
                    { label: '개선필요', count: feedbacks.filter((f) => f.score < 6).length, bg: 'bg-[#ffe8f0]', color: 'text-[#e0437b]' },
                  ].map((item) => (
                    <div key={item.label} className="text-center">
                      <div className={`w-11 h-11 rounded-xl ${item.bg} flex items-center justify-center mx-auto mb-1`}>
                        <span className={`text-lg font-bold ${item.color}`}>{item.count}</span>
                      </div>
                      <p className="text-xs text-gray-500 font-medium">{item.label}</p>
                    </div>
                  ))}
                </div>
                {!sessionSaved && (
                  <button onClick={saveSession} disabled={sessionSaving}
                    className="mt-6 px-6 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-dark transition disabled:opacity-50">
                    {sessionSaving ? '저장 중...' : '기록 저장'}
                  </button>
                )}
                {sessionSaved && (
                  <p className="mt-4 text-xs font-semibold text-green-600 flex items-center justify-center gap-1">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                    기록이 저장되었습니다
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-3 stagger-children">
                {feedbacks.map((fb, i) => (
                  <div key={i} className="bg-white rounded-2xl border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-5">
                    <div className="flex items-center justify-between mb-3">
                      <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${categoryStyles[questions[i]?.category] || ''}`}>
                        {categoryLabels[questions[i]?.category]}
                      </span>
                      <div className={`px-3 py-1 rounded-lg ${getScoreBg(fb.score)}`}>
                        <span className={`text-sm font-bold ${getScoreColor(fb.score)}`}>{fb.score}/10</span>
                      </div>
                    </div>
                    <p className="text-sm font-semibold text-gray-900 mb-3 leading-relaxed">{questions[i]?.question}</p>

                    {/* Score bar */}
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-3">
                      <div className="h-full rounded-full transition-all duration-1000"
                        style={{ width: `${fb.score * 10}%`, backgroundColor: fb.score >= 8 ? '#00a868' : fb.score >= 6 ? '#d4920a' : '#e0437b' }} />
                    </div>

                    {fb.strengths?.length > 0 && (
                      <div className="mb-3">
                        <p className="text-xs font-bold text-[#00a868] mb-1.5">강점</p>
                        <ul className="space-y-1">{fb.strengths.map((s, j) => (
                          <li key={j} className="text-[13px] text-gray-600 flex items-start gap-2"><span className="text-[#00a868] shrink-0">+</span><span>{s}</span></li>
                        ))}</ul>
                      </div>
                    )}
                    {fb.improvements?.length > 0 && (
                      <div className="mb-3">
                        <p className="text-xs font-bold text-[#e0437b] mb-1.5">개선점</p>
                        <ul className="space-y-1">{fb.improvements.map((s, j) => (
                          <li key={j} className="text-[13px] text-gray-600 flex items-start gap-2"><span className="text-[#e0437b] shrink-0">-</span><span>{s}</span></li>
                        ))}</ul>
                      </div>
                    )}
                    {fb.revised_answer && (
                      <div className="bg-gray-50 rounded-xl p-4 mt-2">
                        <p className="text-xs font-bold text-gray-500 mb-1.5">모범답안</p>
                        <p className="text-[13px] text-gray-700 leading-relaxed">{fb.revised_answer}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <button onClick={() => { setTab('generate'); setQuestions([]); setFeedbacks([]); setCurrentIdx(0); setInterviewDone(false); setTimerRunning(false); setSessionSaved(false); }}
                className="mt-5 w-full py-3.5 bg-gray-800 text-white font-semibold rounded-xl hover:bg-gray-900 transition">
                다시 시작
              </button>
            </div>
          )}
        </div>
      )}
      <UpgradePlanModal />
    </div>
  );
}
