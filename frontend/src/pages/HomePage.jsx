import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/client';
import { useToast } from '../contexts/ToastContext';
import ConfirmModal from '../components/ConfirmModal';
import LoadingSpinner from '../components/LoadingSpinner';
import { SkeletonDashboard } from '../components/Skeleton';
import ApiKeyModal, { useApiKeyCheck } from '../components/ApiKeyModal';

const emptyPortfolio = {
  title: '', company: '', type: 'portfolio', category: '개인 프로젝트', period: '', tech_stack: [],
  description: '', role: '', achievements: [], links: [], team_size: '',
};
const portfolioCategories = ['개인 프로젝트', '팀 프로젝트', '오픈소스', '기타'];
const careerCategories = ['정규직', '인턴', '프리랜서', '기타'];

const statItems = [
  {
    key: 'portfolio', label: '포트폴리오', path: '/',
    color: 'from-[#3182f6] to-[#6366f1]',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="18" rx="2" /><path d="M8 7v10M16 7v10M2 12h20" /></svg>,
  },
  {
    key: 'resume', label: '이력서', path: '/resume',
    color: 'from-[#00a868] to-[#34d399]',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>,
  },
  {
    key: 'careerdesc', label: '경력기술서', path: '/career-description',
    color: 'from-[#e0437b] to-[#f472b6]',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><rect x="8" y="2" width="8" height="4" rx="1" /></svg>,
  },
  {
    key: 'coverletter', label: '자소서', path: '/cover-letter',
    color: 'from-[#7b61ff] to-[#a78bfa]',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" /></svg>,
  },
  {
    key: 'interview', label: '면접', path: '/interview',
    color: 'from-[#f59e0b] to-[#fbbf24]',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>,
  },
];

const guideSteps = [
  { key: 'portfolio', label: '포트폴리오 추가', path: '/', icon: '1' },
  { key: 'profile', label: '프로필 완성', path: '/mypage', icon: '2' },
  { key: 'resume', label: '이력서 생성', path: '/resume', icon: '3' },
  { key: 'coverletter', label: '자소서 작성', path: '/cover-letter', icon: '4' },
];

function getRelativeTime(iso) {
  if (!iso) return null;
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return '방금 전';
  if (mins < 60) return `${mins}분 전`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}일 전`;
  const months = Math.floor(days / 30);
  return `${months}개월 전`;
}

export default function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const { showModal, setShowModal, checkApiKey } = useApiKeyCheck();
  const [portfolios, setPortfolios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ portfolio: 0, resume: 0, coverletter: 0, careerdesc: 0, interview: 0 });
  const [lastActivity, setLastActivity] = useState({});
  const [portfolioRefCount, setPortfolioRefCount] = useState({});
  const [guideComplete, setGuideComplete] = useState({});
  const [guideDismissed, setGuideDismissed] = useState(() => localStorage.getItem('recruitai_guide_dismissed') === 'true');
  const [mode, setMode] = useState('list');
  const [editData, setEditData] = useState(null);
  const [parseText, setParseText] = useState('');
  const [parsing, setParsing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [techInput, setTechInput] = useState('');
  const [achieveInput, setAchieveInput] = useState('');

  // Drag & Drop state
  const dragItem = useRef(null);
  const dragOverItem = useRef(null);
  const [dragIdx, setDragIdx] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [portfolioRes, resumeRes, clRes, cdRes, profileRes, interviewRes] = await Promise.all([
        api.get('/portfolios'),
        api.get(`/resume/history?username=${user.username}`).catch(() => ({ data: [] })),
        api.get(`/cover-letter/history?username=${user.username}`).catch(() => ({ data: [] })),
        api.get(`/career-description/history?username=${user.username}`).catch(() => ({ data: [] })),
        api.get(`/profile/${user.username}`).catch(() => ({ data: {} })),
        api.get(`/interview/history?username=${user.username}`).catch(() => ({ data: [] })),
      ]);
      setPortfolios(portfolioRes.data);

      const interviewData = interviewRes.data;

      setStats({
        portfolio: portfolioRes.data.length,
        resume: resumeRes.data.length,
        coverletter: clRes.data.length,
        careerdesc: cdRes.data.length,
        interview: interviewData.length,
      });

      // Recent activity timestamps
      const getLatest = (arr) => arr.length > 0 ? arr.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0]?.created_at : null;
      setLastActivity({
        resume: getLatest([...resumeRes.data]),
        coverletter: getLatest([...clRes.data]),
        careerdesc: getLatest([...cdRes.data]),
        interview: getLatest([...interviewData]),
      });

      // Portfolio-CoverLetter reference count
      const refCount = {};
      clRes.data.forEach((record) => {
        record.answers?.forEach((qa) => {
          qa.relevant_portfolios?.forEach((pid) => {
            refCount[pid] = (refCount[pid] || 0) + 1;
          });
        });
      });
      setPortfolioRefCount(refCount);

      // Guide completion check
      const p = profileRes.data;
      setGuideComplete({
        portfolio: portfolioRes.data.length > 0,
        profile: !!(p?.name && p?.email && (p?.education?.length > 0 || p?.work_experience?.length > 0)),
        resume: resumeRes.data.length > 0,
        coverletter: clRes.data.length > 0,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleParse = async () => {
    if (!checkApiKey()) return;
    if (!parseText.trim()) return;
    setParsing(true);
    try {
      const currentType = editData?.type || 'portfolio';
      const currentCategory = editData?.category;
      const res = await api.post('/portfolios/parse', { text: parseText });
      const parsed = Array.isArray(res.data) ? res.data[0] : res.data;
      if (parsed) {
        if (editData?.title) {
          // 이미 데이터가 있으면 배열 필드는 누적, 나머지는 새 값으로 덮어쓰기
          setEditData((prev) => ({
            ...prev,
            ...parsed,
            type: currentType,
            ...(currentCategory ? { category: currentCategory } : {}),
            tech_stack: [...new Set([...(prev.tech_stack || []), ...(parsed.tech_stack || [])])],
            achievements: [...(prev.achievements || []), ...(parsed.achievements || [])],
            links: [...new Set([...(prev.links || []), ...(parsed.links || [])])],
          }));
          toast.success('파싱 결과가 추가되었습니다.');
        } else {
          setEditData({ ...parsed, type: currentType, ...(currentCategory ? { category: currentCategory } : {}) });
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || 'AI 파싱 실패. API 키를 확인해주세요.');
    } finally {
      setParsing(false);
    }
  };

  const handleSave = async () => {
    if (!editData?.title?.trim()) {
      toast.error('제목을 입력해주세요.');
      return;
    }
    setSaving(true);
    try {
      if (mode === 'edit' && editData.id) {
        await api.put(`/portfolios/${editData.id}`, editData);
      } else {
        await api.post('/portfolios', editData);
      }
      await loadData();
      setMode('list');
      setEditData(null);
      toast.success('포트폴리오가 저장되었습니다.');
    } catch {
      toast.error('저장 실패');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/portfolios/${deleteTarget}`);
      await loadData();
      toast.success('삭제되었습니다.');
    } catch {
      toast.error('삭제 실패');
    } finally {
      setDeleteTarget(null);
    }
  };

  const startAdd = () => { setEditData({ ...emptyPortfolio }); setMode('add'); setTechInput(''); setAchieveInput(''); };
  const startEdit = (p) => { setEditData({ ...p }); setMode('edit'); setTechInput(''); setAchieveInput(''); };

  const addTech = () => {
    if (!techInput.trim()) return;
    setEditData({ ...editData, tech_stack: [...(editData.tech_stack || []), techInput.trim()] });
    setTechInput('');
  };
  const removeTech = (idx) => setEditData({ ...editData, tech_stack: editData.tech_stack.filter((_, i) => i !== idx) });
  const addAchieve = () => {
    if (!achieveInput.trim()) return;
    setEditData({ ...editData, achievements: [...(editData.achievements || []), achieveInput.trim()] });
    setAchieveInput('');
  };
  const removeAchieve = (idx) => setEditData({ ...editData, achievements: editData.achievements.filter((_, i) => i !== idx) });

  // ─── Drag & Drop handlers ───
  const handleDragStart = (idx) => {
    dragItem.current = idx;
    setDragIdx(idx);
  };
  const handleDragOver = (e, idx) => {
    e.preventDefault();
    dragOverItem.current = idx;
  };
  const handleDrop = async () => {
    const from = dragItem.current;
    const to = dragOverItem.current;
    if (from === null || to === null || from === to) {
      setDragIdx(null);
      return;
    }
    const reordered = [...portfolios];
    const [moved] = reordered.splice(from, 1);
    reordered.splice(to, 0, moved);
    setPortfolios(reordered);
    setDragIdx(null);
    dragItem.current = null;
    dragOverItem.current = null;
    try {
      await api.patch('/portfolios/reorder', { ordered_ids: reordered.map((p) => p.id) });
    } catch {
      await loadData(); // rollback
      toast.error('순서 변경 실패');
    }
  };
  const handleDragEnd = () => {
    setDragIdx(null);
    dragItem.current = null;
    dragOverItem.current = null;
  };

  const dismissGuide = () => {
    setGuideDismissed(true);
    localStorage.setItem('recruitai_guide_dismissed', 'true');
  };

  const allGuideComplete = Object.values(guideComplete).every(Boolean);
  const showGuide = !guideDismissed && !allGuideComplete && !loading;

  if (loading) return <SkeletonDashboard />;

  // ─── Add / Edit form ───
  if (mode === 'add' || mode === 'edit') {
    return (
      <div className="animate-fade-in">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-gray-900">
            {mode === 'add'
              ? (editData?.type === 'career' ? '경력 추가' : '포트폴리오 추가')
              : (editData?.type === 'career' ? '경력 수정' : '포트폴리오 수정')}
          </h1>
          <button onClick={() => { setMode('list'); setEditData(null); }} className="text-sm text-gray-500 hover:text-gray-700 font-medium">취소</button>
        </div>

        {/* Type toggle */}
        <div className="flex gap-2 mb-5">
          <button onClick={() => setEditData({ ...editData, type: 'portfolio', category: portfolioCategories[0] })}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-xl transition ${editData?.type !== 'career' ? 'bg-[#7b61ff] text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /></svg>
            포트폴리오
          </button>
          <button onClick={() => setEditData({ ...editData, type: 'career', category: careerCategories[0] })}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-xl transition ${editData?.type === 'career' ? 'bg-[#3182f6] text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /></svg>
            경력
          </button>
        </div>

        {mode === 'add' && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-5 mb-5">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#3182f6] to-[#6366f1] flex items-center justify-center">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
              </div>
              <h3 className="text-sm font-bold text-gray-900">AI 자동 파싱</h3>
            </div>
            <p className="text-xs text-gray-500 mb-3 ml-9">프로젝트 설명을 자유롭게 입력하면 AI가 구조화합니다.</p>
            <textarea value={parseText} onChange={(e) => setParseText(e.target.value)} rows={5}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white resize-none transition"
              placeholder="예: 팀 프로젝트로 React와 FastAPI를 사용한 AI 챗봇 서비스를 개발했습니다..." />
            {parsing && <LoadingSpinner text="AI가 분석하고 있습니다..." />}
            <button onClick={handleParse} disabled={parsing || !parseText.trim()}
              className="mt-3 px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-dark transition disabled:opacity-50">
              {parsing ? 'AI 분석 중...' : 'AI 파싱'}
            </button>
          </div>
        )}

        {editData && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-5 flex flex-col gap-4">
            {/* Career: company + project name / Portfolio: project name */}
            {editData.type === 'career' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">회사명 *</label>
                  <input value={editData.company || ''} onChange={(e) => setEditData({ ...editData, company: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white transition"
                    placeholder="예: 네이버, 카카오" />
                </div>
                <div>
                  <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">분류</label>
                  <select value={editData.category || careerCategories[0]}
                    onChange={(e) => setEditData({ ...editData, category: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition">
                    {careerCategories.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>
            )}
            <div className={editData.type !== 'career' ? 'grid grid-cols-2 gap-4' : ''}>
              <div className={editData.type !== 'career' ? 'col-span-2' : ''}>
                <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">프로젝트명 *</label>
                <input value={editData.title || ''} onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white transition"
                  placeholder={editData.type === 'career' ? '예: AI 검색 시스템 개발' : '예: 챗봇 서비스 개발'} />
              </div>
              {editData.type !== 'career' && (
                <div className="col-span-2">
                  <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">분류</label>
                  <select value={editData.category || portfolioCategories[0]}
                    onChange={(e) => setEditData({ ...editData, category: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition" style={{ maxWidth: '50%' }}>
                    {portfolioCategories.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">기간</label>
                <input value={editData.period || ''} onChange={(e) => setEditData({ ...editData, period: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white transition"
                  placeholder="2024.01 - 2024.06" />
              </div>
              <div>
                <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">
                  {editData.type === 'career' ? '내가 한 일 / 역할' : '역할'}
                </label>
                <input value={editData.role || ''} onChange={(e) => setEditData({ ...editData, role: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white transition"
                  placeholder={editData.type === 'career' ? '백엔드 API 설계 및 개발' : '백엔드 개발'} />
              </div>
            </div>
            {editData.type === 'career' && (
              <div>
                <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">팀 규모</label>
                <input value={editData.team_size || ''} onChange={(e) => setEditData({ ...editData, team_size: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white transition"
                  placeholder="예: 5명" style={{ maxWidth: '50%' }} />
              </div>
            )}
            <div>
              <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">프로젝트 설명</label>
              <textarea value={editData.description || ''} onChange={(e) => setEditData({ ...editData, description: e.target.value })} rows={3}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white resize-none transition"
                placeholder="프로젝트의 목적, 배경, 내용을 설명해주세요" />
            </div>
            <div>
              <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">기술 스택</label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {(editData.tech_stack || []).map((t, i) => (
                  <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary-light text-primary text-xs font-medium rounded-full">
                    {t}<button onClick={() => removeTech(i)} className="hover:text-red-500 ml-0.5">×</button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input value={techInput} onChange={(e) => setTechInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTech())}
                  className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white transition" placeholder="기술명 입력 후 Enter" />
                <button onClick={addTech} className="px-4 py-2 bg-gray-100 text-sm font-medium text-gray-700 rounded-xl hover:bg-gray-200 transition">추가</button>
              </div>
            </div>
            <div>
              <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">성과</label>
              <ul className="space-y-1.5 mb-2">
                {(editData.achievements || []).map((a, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="mt-0.5 text-primary">•</span><span className="flex-1">{a}</span>
                    <button onClick={() => removeAchieve(i)} className="text-gray-400 hover:text-red-500 text-xs shrink-0">삭제</button>
                  </li>
                ))}
              </ul>
              <div className="flex gap-2">
                <input value={achieveInput} onChange={(e) => setAchieveInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addAchieve())}
                  className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white transition" placeholder="성과 입력 후 Enter" />
                <button onClick={addAchieve} className="px-4 py-2 bg-gray-100 text-sm font-medium text-gray-700 rounded-xl hover:bg-gray-200 transition">추가</button>
              </div>
            </div>
            <button onClick={handleSave} disabled={saving}
              className="mt-2 w-full py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition disabled:opacity-50">
              {saving ? '저장 중...' : '저장'}
            </button>
          </div>
        )}
        <ApiKeyModal open={showModal} onClose={() => setShowModal(false)} onSave={() => setShowModal(false)} />
      </div>
    );
  }

  // ─── Dashboard + Portfolio list ───
  return (
    <div className="animate-fade-in">
      {/* Hero greeting */}
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-gray-900 mb-1">
          안녕하세요, {user?.display_name || user?.username}님
        </h1>
        <p className="text-gray-500">취업 준비 현황을 한눈에 확인하세요</p>
      </div>

      {/* Quick Start Guide */}
      {showGuide && (
        <div className="bg-gradient-to-r from-primary/5 to-[#7b61ff]/5 rounded-2xl border border-primary/15 p-5 mb-6 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-[#7b61ff] flex items-center justify-center">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
              </div>
              <h3 className="text-sm font-bold text-gray-900">빠른 시작 가이드</h3>
            </div>
            <button onClick={dismissGuide} className="text-xs text-gray-400 hover:text-gray-600 transition">닫기</button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {guideSteps.map((step) => {
              const done = guideComplete[step.key];
              return (
                <button
                  key={step.key}
                  onClick={() => navigate(step.path)}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border transition ${
                    done
                      ? 'bg-green-50 border-green-200 cursor-default'
                      : 'bg-white border-gray-200 hover:border-primary/40 hover:bg-primary/5'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                    done
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}>
                    {done ? (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                    ) : step.icon}
                  </div>
                  <span className={`text-xs font-semibold ${done ? 'text-green-600' : 'text-gray-700'}`}>{step.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2.5 mb-10 stagger-children">
        {statItems.map((item) => (
          <button
            key={item.key}
            onClick={() => navigate(item.path)}
            className="bg-white rounded-xl border border-gray-200 px-3 py-3 text-left card-hover group"
          >
            <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${item.color} flex items-center justify-center mb-2`}>
              {item.icon}
            </div>
            <div className="text-lg font-extrabold text-gray-900 animate-count-up">{stats[item.key]}</div>
            <div className="text-[11px] text-gray-500 font-medium mt-0.5">{item.label}</div>
            {lastActivity[item.key] && (
              <div className="text-[10px] text-gray-400 mt-0.5">마지막: {getRelativeTime(lastActivity[item.key])}</div>
            )}
          </button>
        ))}
      </div>

      {/* Portfolio & Career section */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-900">내 포트폴리오 & 경력</h2>
        <button onClick={startAdd}
          className="px-4 py-2 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-dark transition">
          + 추가
        </button>
      </div>

      {portfolios.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gray-100 flex items-center justify-center">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#b0b8c1" strokeWidth="1.5"><rect x="2" y="3" width="20" height="18" rx="2" /><path d="M8 7v10M16 7v10M2 12h20" /></svg>
          </div>
          <p className="text-[15px] font-semibold text-gray-600 mb-1">아직 등록된 항목이 없습니다</p>
          <p className="text-sm text-gray-400 mb-5">경력이나 프로젝트 경험을 추가해보세요</p>
          <button onClick={startAdd}
            className="px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-dark transition">
            첫 항목 추가하기
          </button>
        </div>
      ) : (
        <>
          {/* Career section — grouped by company */}
          {portfolios.some((p) => p.type === 'career') && (() => {
            const careers = portfolios.filter((p) => p.type === 'career');
            const companyOrder = [];
            const companyMap = {};
            careers.forEach((p) => {
              const key = p.company || p.title || '기타';
              if (!companyMap[key]) { companyOrder.push(key); companyMap[key] = []; }
              companyMap[key].push(p);
            });
            return (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 rounded-md bg-[#3182f6]/10 flex items-center justify-center">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#3182f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /></svg>
                  </div>
                  <h3 className="text-[15px] font-bold text-gray-800">경력</h3>
                  <span className="text-xs text-gray-400 font-medium">{careers.length}건 · {companyOrder.length}개 회사</span>
                </div>
                <div className="flex flex-col gap-4">
                  {companyOrder.map((company) => (
                    <div key={company} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                      <div className="flex items-center gap-3 px-5 py-3.5 border-b border-gray-100 bg-gray-50/50">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#3182f6] to-[#6366f1] flex items-center justify-center shrink-0">
                          <span className="text-white text-sm font-bold">{company.charAt(0)}</span>
                        </div>
                        <div>
                          <h4 className="text-[15px] font-bold text-gray-900">{company}</h4>
                          <p className="text-xs text-gray-400">{companyMap[company].length}개 프로젝트</p>
                        </div>
                      </div>
                      <div className="divide-y divide-gray-100">
                        {companyMap[company].map((p) => {
                          const idx = portfolios.indexOf(p);
                          return (
                            <div key={p.id}
                              draggable onDragStart={() => handleDragStart(idx)} onDragOver={(e) => handleDragOver(e, idx)} onDrop={handleDrop} onDragEnd={handleDragEnd}
                              className={`px-5 py-4 cursor-grab active:cursor-grabbing hover:bg-gray-50 transition-all ${dragIdx === idx ? 'opacity-40' : ''}`}>
                              <div className="flex items-center gap-2 mb-1.5">
                                <span className="text-xs font-semibold text-[#3182f6] bg-[#3182f6]/10 px-2 py-0.5 rounded-full">{p.category}</span>
                                {p.period && <span className="text-xs text-gray-400">{p.period}</span>}
                              </div>
                              <p className="text-sm font-bold text-gray-900 mb-0.5">{p.title}</p>
                              {p.role && <p className="text-xs text-gray-500 mb-1">{p.role}{p.team_size ? ` · ${p.team_size}` : ''}</p>}
                              {p.tech_stack?.length > 0 && (
                                <div className="flex flex-wrap gap-1 mb-1.5">
                                  {p.tech_stack.slice(0, 6).map((t, i) => (
                                    <span key={i} className="text-[11px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">{t}</span>
                                  ))}
                                  {p.tech_stack.length > 6 && <span className="text-[11px] text-gray-400">+{p.tech_stack.length - 6}</span>}
                                </div>
                              )}
                              {p.description && <p className="text-[12px] text-gray-500 leading-relaxed line-clamp-2">{p.description}</p>}
                              <div className="flex items-center gap-1 mt-2">
                                <button onClick={() => startEdit(p)} className="px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition">수정</button>
                                <button onClick={() => setDeleteTarget(p.id)} className="px-3 py-1 text-xs font-medium text-red-500 hover:bg-red-50 rounded-lg transition">삭제</button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Portfolio section */}
          {portfolios.some((p) => p.type !== 'career') && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-md bg-[#7b61ff]/10 flex items-center justify-center">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#7b61ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /></svg>
                </div>
                <h3 className="text-[15px] font-bold text-gray-800">포트폴리오</h3>
                <span className="text-xs text-gray-400 font-medium">{portfolios.filter((p) => p.type !== 'career').length}건</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 stagger-children">
                {portfolios.filter((p) => p.type !== 'career').map((p) => {
                  const idx = portfolios.indexOf(p);
                  return (
                    <div key={p.id}
                      draggable onDragStart={() => handleDragStart(idx)} onDragOver={(e) => handleDragOver(e, idx)} onDrop={handleDrop} onDragEnd={handleDragEnd}
                      className={`bg-white rounded-2xl border border-gray-200 overflow-hidden card-hover flex flex-col h-[280px] cursor-grab active:cursor-grabbing transition-all ${dragIdx === idx ? 'opacity-40 scale-95' : ''}`}>
                      <div className="p-4 flex flex-col flex-1 min-h-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs font-semibold text-[#7b61ff] bg-[#7b61ff]/10 px-2.5 py-0.5 rounded-full">{p.category}</span>
                          {p.period && <span className="text-xs text-gray-400">{p.period}</span>}
                          {portfolioRefCount[p.id] > 0 && (
                            <span className="text-[10px] font-semibold text-[#7b61ff] bg-[#7b61ff]/10 px-2 py-0.5 rounded-full ml-auto">
                              자소서 {portfolioRefCount[p.id]}회 참조
                            </span>
                          )}
                        </div>
                        <h3 className="font-bold text-gray-900 mb-2 line-clamp-1">{p.title}</h3>
                        {p.tech_stack?.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-2">
                            {p.tech_stack.slice(0, 5).map((t, i) => (
                              <span key={i} className="text-[11px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">{t}</span>
                            ))}
                            {p.tech_stack.length > 5 && <span className="text-[11px] text-gray-400">+{p.tech_stack.length - 5}</span>}
                          </div>
                        )}
                        <div className="flex-1 min-h-0 overflow-hidden">
                          {p.role && <p className="text-[13px] text-gray-600 mb-1"><span className="font-semibold text-gray-700">역할:</span> {p.role}</p>}
                          {p.description && <p className="text-[12px] text-gray-500 leading-relaxed line-clamp-3">{p.description}</p>}
                        </div>
                        <div className="flex items-center gap-1 pt-3 mt-auto border-t border-gray-100">
                          <button onClick={() => startEdit(p)} className="px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition">수정</button>
                          <button onClick={() => setDeleteTarget(p.id)} className="px-3 py-1 text-xs font-medium text-red-500 hover:bg-red-50 rounded-lg transition">삭제</button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      <ConfirmModal open={!!deleteTarget} title="포트폴리오 삭제" message="이 포트폴리오를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
        onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />
      <ApiKeyModal open={showModal} onClose={() => setShowModal(false)} onSave={() => setShowModal(false)} />
    </div>
  );
}
