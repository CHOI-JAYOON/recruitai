import { useState, useEffect, useRef } from 'react';
import { useNavigate, useBlocker } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/client';
import { useToast } from '../contexts/ToastContext';
import ConfirmModal from '../components/ConfirmModal';
import LoadingSpinner from '../components/LoadingSpinner';
import { SkeletonDashboard } from '../components/Skeleton';
import ApiKeyModal, { useApiKeyCheck } from '../components/ApiKeyModal';
import ResumeUploadModal from '../components/ResumeUploadModal';

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
  const [showResumeUpload, setShowResumeUpload] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Drag & Drop state
  const dragItem = useRef(null);
  const dragOverItem = useRef(null);
  const [dragIdx, setDragIdx] = useState(null);

  // 수정 중 페이지 이탈 방지
  const isEditing = mode === 'add' || mode === 'edit';
  const blocker = useBlocker(isEditing);
  useEffect(() => {
    if (isEditing) {
      const handler = (e) => { e.preventDefault(); e.returnValue = ''; };
      window.addEventListener('beforeunload', handler);
      return () => window.removeEventListener('beforeunload', handler);
    }
  }, [isEditing]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [portfolioRes, resumeRes, clRes, cdRes, profileRes, interviewRes] = await Promise.all([
        api.get(`/portfolios?username=${user.username}`),
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
          // 이미 데이터가 있으면 핵심 필드는 유지, 배열 필드는 누적
          setEditData((prev) => ({
            ...prev,
            description: parsed.description || prev.description,
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
      const dataWithUser = { ...editData, username: user.username };
      if (mode === 'edit' && editData.id) {
        await api.put(`/portfolios/${editData.id}`, dataWithUser);
      } else {
        await api.post('/portfolios', dataWithUser);
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

  const handleResumeResult = async (data) => {
    if (!data) return;
    const fmtDate = (d) => d ? d.slice(0, 7).replace('-', '.') : '';
    // 기존 포트폴리오 목록 가져와서 중복 체크용 제목 Set 생성
    const existingTitles = new Set(portfolios.map(p => p.title));

    // 일괄 저장할 포트폴리오 모아두기
    const newPortfolios = [];

    // 포트폴리오 항목 (중복 제목 스킵)
    if (data.portfolios?.length > 0) {
      for (const p of data.portfolios) {
        if (existingTitles.has(p.title)) continue;
        newPortfolios.push({ ...p, username: user.username });
        existingTitles.add(p.title);
      }
    }
    // work_experience → 경력 카드 (중복 제목 스킵)
    if (data.work_experience?.length > 0) {
      for (const we of data.work_experience) {
        const title = `${we.company}${we.team ? ' ' + we.team : ''}`;
        if (existingTitles.has(title)) continue;
        const start = fmtDate(we.start_date);
        const end = we.is_current ? '현재' : fmtDate(we.end_date);
        const period = start && end ? `${start} - ${end}` : start || end || '';
        newPortfolios.push({
          username: user.username,
          title,
          company: we.company || '',
          type: 'career',
          category: '정규직',
          period,
          role: we.position || '',
          description: we.description || '',
          tech_stack: [],
          achievements: (we.projects || []).map(proj => proj.name + (proj.description ? ': ' + proj.description : '')),
          links: [],
          team_size: '',
        });
        existingTitles.add(title);
      }
    }

    // 포트폴리오 + 프로필 업데이트를 병렬로 실행
    const bulkSave = newPortfolios.length > 0
      ? api.post('/portfolios/bulk', newPortfolios).catch(() => {})
      : Promise.resolve();

    const profileSave = (async () => {
      try {
        const profileRes = await api.get(`/profile/${user.username}`);
        const existing = profileRes.data || {};
        const updated = { ...existing };
        if (!updated.name && data.name) updated.name = data.name;
        if (!updated.email && data.email) updated.email = data.email;
        if (!updated.phone && data.phone) updated.phone = data.phone;
        if (!updated.github && data.github) updated.github = data.github;
        if (!updated.linkedin && data.linkedin) updated.linkedin = data.linkedin;
        if (!updated.blog && data.blog) updated.blog = data.blog;
        if (!updated.summary && data.summary) updated.summary = data.summary;
        // 배열 필드: 기존 항목 유지 + 새 항목 추가 (중복 제거)
        const mergeArr = (existArr, newArr, key) => {
          if (!newArr?.length) return existArr || [];
          const prev = existArr || [];
          const existKeys = new Set(prev.map(i => JSON.stringify(i[key] || i)));
          const added = newArr.filter(i => !existKeys.has(JSON.stringify(i[key] || i)));
          return [...prev, ...added];
        };
        if (data.education?.length > 0) updated.education = mergeArr(updated.education, data.education, 'school');
        if (data.work_experience?.length > 0) updated.work_experience = mergeArr(updated.work_experience, data.work_experience, 'company');
        if (data.certificates?.length > 0) updated.certificates = mergeArr(updated.certificates, data.certificates, 'name');
        if (data.awards?.length > 0) updated.awards = mergeArr(updated.awards, data.awards, 'name');
        if (data.trainings?.length > 0) updated.trainings = mergeArr(updated.trainings, data.trainings, 'name');
        await api.put(`/profile/${user.username}`, updated);
      } catch { /* skip */ }
    })();

    await Promise.all([bulkSave, profileSave]);

    // 포트폴리오와 프로필만 선택적 리로드 (다른 데이터는 변경 없으므로 스킵)
    const [portfolioRes, profileRes] = await Promise.all([
      api.get(`/portfolios?username=${user.username}`),
      api.get(`/profile/${user.username}`),
    ]);
    setPortfolios(portfolioRes.data);
    setProfile(profileRes.data);
    toast.success('이력서 분석이 완료되었습니다.');
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
        {/* 수정 중 페이지 이탈 확인 모달 */}
        {blocker.state === 'blocked' && (
          <ConfirmModal
            message="수정 중인 내용이 있습니다. 이동하면 변경사항이 반영되지 않습니다."
            confirmText="이동"
            confirmColor="bg-primary hover:bg-primary-dark"
            onConfirm={() => blocker.proceed()}
            onCancel={() => blocker.reset()}
          />
        )}
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-900">
            {mode === 'add'
              ? (editData?.type === 'career' ? '경력 추가' : '포트폴리오 추가')
              : (editData?.type === 'career' ? '경력 수정' : '포트폴리오 수정')}
          </h1>
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
                <div className="flex items-center gap-2">
                  <input type="month" value={(editData.period || '').split(' - ')[0]?.replace('.', '-') || ''}
                    onChange={(e) => {
                      const start = e.target.value.replace('-', '.');
                      const end = (editData.period || '').split(' - ')[1] || '';
                      setEditData({ ...editData, period: end ? `${start} - ${end}` : start });
                    }}
                    className="flex-1 px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white transition" />
                  <span className="text-gray-400 text-sm">~</span>
                  <input type="month" value={(editData.period || '').split(' - ')[1]?.replace('.', '-') || ''}
                    onChange={(e) => {
                      const start = (editData.period || '').split(' - ')[0] || '';
                      const end = e.target.value.replace('-', '.');
                      setEditData({ ...editData, period: start ? `${start} - ${end}` : end });
                    }}
                    className="flex-1 px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white transition" />
                </div>
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
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700 group">
                    <span className="mt-2 text-primary">•</span>
                    <textarea
                      value={a}
                      onChange={(e) => {
                        const updated = [...editData.achievements];
                        updated[i] = e.target.value;
                        setEditData({ ...editData, achievements: updated });
                      }}
                      rows={1}
                      onInput={(e) => { e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px'; }}
                      className="flex-1 px-3 py-1.5 bg-transparent border border-transparent rounded-lg text-sm hover:border-gray-200 focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none transition"
                    />
                    <button onClick={() => removeAchieve(i)} className="mt-1.5 text-gray-300 hover:text-red-500 text-xs shrink-0 opacity-0 group-hover:opacity-100 transition">삭제</button>
                  </li>
                ))}
              </ul>
              <div className="flex gap-2">
                <input value={achieveInput} onChange={(e) => setAchieveInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addAchieve())}
                  className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white transition" placeholder="성과 입력 후 Enter" />
                <button onClick={addAchieve} className="px-4 py-2 bg-gray-100 text-sm font-medium text-gray-700 rounded-xl hover:bg-gray-200 transition">추가</button>
              </div>
            </div>
            <div className="mt-3 flex justify-end gap-2">
              <button onClick={() => { setMode('list'); setEditData(null); }}
                className="px-5 py-2.5 text-sm font-medium text-gray-500 bg-gray-100 rounded-xl hover:bg-gray-200 transition">
                취소
              </button>
              <button onClick={handleSave} disabled={saving}
                className="px-6 py-2.5 text-sm bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition disabled:opacity-50">
                {saving ? '저장 중...' : '저장'}
              </button>
            </div>
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

      {/* Portfolio & Career section — Toss style */}
      {(() => {
        const careerCount = portfolios.filter((p) => p.type === 'career').length;
        const projectCount = portfolios.filter((p) => p.type !== 'career').length;
        const filtered = portfolios.filter((p) => {
          if (activeTab === 'career' && p.type !== 'career') return false;
          if (activeTab === 'portfolio' && p.type === 'career') return false;
          if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            return (p.title?.toLowerCase().includes(q) || p.company?.toLowerCase().includes(q) || p.role?.toLowerCase().includes(q) || p.category?.toLowerCase().includes(q));
          }
          return true;
        });
        return (
          <div className="bg-white rounded-2xl overflow-hidden">
            {/* Header */}
            <div className="px-6 pt-6 pb-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[22px] font-extrabold text-[#191f28]">내 포트폴리오 & 경력</h2>
                <div className="flex gap-2">
                  <button onClick={() => { if (checkApiKey()) setShowResumeUpload(true); }}
                    className="px-3.5 py-2 text-[13px] font-semibold text-[#3182f6] bg-[#3182f6]/8 rounded-xl hover:bg-[#3182f6]/15 transition flex items-center gap-1.5">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
                    이력서 업로드
                  </button>
                  <button onClick={startAdd}
                    className="px-3.5 py-2 bg-[#3182f6] text-white text-[13px] font-semibold rounded-xl hover:bg-[#1b6ce5] transition">
                    + 추가
                  </button>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex items-center gap-2 mb-3">
                {[
                  { key: 'all', label: '전체', count: portfolios.length },
                  { key: 'career', label: '경력', count: careerCount },
                  { key: 'portfolio', label: '프로젝트', count: projectCount },
                ].map((tab) => (
                  <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                    className={`px-3.5 py-1.5 text-[13px] font-semibold rounded-lg transition ${
                      activeTab === tab.key
                        ? 'bg-[#191f28] text-white'
                        : 'text-[#8b95a1] hover:bg-[#f2f4f6]'
                    }`}>
                    {tab.label} {tab.count > 0 && <span className={`ml-0.5 ${activeTab === tab.key ? 'text-white/70' : 'text-[#b0b8c1]'}`}>{tab.count}</span>}
                  </button>
                ))}
              </div>

              {/* Search */}
              {portfolios.length > 0 && (
                <div className="relative">
                  <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#b0b8c1]" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-[#f2f4f6] rounded-xl text-[14px] text-[#191f28] placeholder-[#b0b8c1] focus:outline-none focus:bg-[#e8ebed] transition border-0"
                    placeholder="프로젝트, 회사, 역할로 검색"
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#b0b8c1] hover:text-[#6b7684]">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* List */}
            <div className="border-t border-[#f2f4f6]">
              {portfolios.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-[#f2f4f6] flex items-center justify-center">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#b0b8c1" strokeWidth="1.5"><rect x="2" y="3" width="20" height="18" rx="2" /><path d="M8 7v10M16 7v10M2 12h20" /></svg>
                  </div>
                  <p className="text-[15px] font-semibold text-[#4e5968] mb-1">아직 등록된 항목이 없습니다</p>
                  <p className="text-[13px] text-[#8b95a1] mb-5">경력이나 프로젝트 경험을 추가해보세요</p>
                  <button onClick={startAdd}
                    className="px-5 py-2.5 bg-[#3182f6] text-white text-[13px] font-semibold rounded-xl hover:bg-[#1b6ce5] transition">
                    첫 항목 추가하기
                  </button>
                </div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-[14px] text-[#8b95a1]">검색 결과가 없습니다</p>
                </div>
              ) : (
                <div className="divide-y divide-[#f2f4f6]">
                  {filtered.map((p) => {
                    const idx = portfolios.indexOf(p);
                    const isCareer = p.type === 'career';
                    const accentColor = isCareer ? '#3182f6' : '#7b61ff';
                    const gradientFrom = isCareer ? 'from-[#3182f6]' : 'from-[#7b61ff]';
                    const gradientTo = isCareer ? 'to-[#6366f1]' : 'to-[#a78bfa]';
                    return (
                      <div key={p.id}
                        draggable onDragStart={() => handleDragStart(idx)} onDragOver={(e) => handleDragOver(e, idx)} onDrop={handleDrop} onDragEnd={handleDragEnd}
                        className={`px-6 py-4 cursor-grab active:cursor-grabbing hover:bg-[#f8f9fa] transition-all ${dragIdx === idx ? 'opacity-40' : ''}`}>
                        <div className="flex items-start gap-3 cursor-pointer" onClick={() => setExpandedId(expandedId === p.id ? null : p.id)}>
                          {/* Icon */}
                          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradientFrom} ${gradientTo} flex items-center justify-center shrink-0 mt-0.5`}>
                            {isCareer ? (
                              <span className="text-white text-sm font-bold">{(p.company || p.title || '?').charAt(0)}</span>
                            ) : (
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /></svg>
                            )}
                          </div>
                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <p className="text-[15px] font-bold text-[#191f28] truncate">{p.title}</p>
                              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded shrink-0`} style={{ color: accentColor, backgroundColor: `${accentColor}15` }}>{p.category}</span>
                              {portfolioRefCount[p.id] > 0 && (
                                <span className="text-[10px] font-semibold text-[#7b61ff] bg-[#7b61ff]/10 px-1.5 py-0.5 rounded shrink-0">참조 {portfolioRefCount[p.id]}</span>
                              )}
                            </div>
                            <p className="text-[13px] text-[#6b7684]">
                              {isCareer && p.company && `${p.company} · `}{p.role}{p.period ? ` · ${p.period}` : ''}{p.team_size ? ` · ${p.team_size}` : ''}
                            </p>
                            {expandedId !== p.id && p.tech_stack?.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1.5">
                                {p.tech_stack.slice(0, 5).map((t, i) => (
                                  <span key={i} className="text-[11px] text-[#6b7684] bg-[#f2f4f6] px-2 py-0.5 rounded-md">{t}</span>
                                ))}
                                {p.tech_stack.length > 5 && <span className="text-[11px] text-[#b0b8c1]">+{p.tech_stack.length - 5}</span>}
                              </div>
                            )}
                          </div>
                          {/* Chevron */}
                          <svg className={`w-5 h-5 text-[#b0b8c1] shrink-0 mt-1.5 transition-transform ${expandedId === p.id ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9" /></svg>
                        </div>

                        {/* Expanded detail */}
                        {expandedId === p.id && (
                          <div className="pl-[52px] mt-3 pt-3 border-t border-[#f2f4f6] space-y-2.5">
                            {p.tech_stack?.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {p.tech_stack.map((t, i) => (
                                  <span key={i} className="text-[11px] text-[#6b7684] bg-[#f2f4f6] px-2 py-0.5 rounded-md">{t}</span>
                                ))}
                              </div>
                            )}
                            {p.description && <p className="text-[13px] text-[#4e5968] leading-relaxed">{p.description}</p>}
                            {p.achievements?.length > 0 && (
                              <div>
                                <p className="text-[12px] font-bold text-[#6b7684] mb-1">주요 성과</p>
                                <ul className="space-y-1">
                                  {p.achievements.map((a, i) => (
                                    <li key={i} className="text-[13px] text-[#4e5968] flex items-start gap-2">
                                      <span className="text-[#3182f6] mt-0.5">•</span><span>{a}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {p.links?.length > 0 && (
                              <div className="flex flex-wrap gap-2">
                                {p.links.map((l, i) => (
                                  <a key={i} href={l} target="_blank" rel="noopener noreferrer" className="text-[12px] text-[#3182f6] hover:underline">{l}</a>
                                ))}
                              </div>
                            )}
                            <div className="flex items-center gap-1 pt-2">
                              <button onClick={() => startEdit(p)} className="px-3 py-1.5 text-[12px] font-medium text-[#4e5968] hover:bg-[#f2f4f6] rounded-lg transition">수정</button>
                              <button onClick={() => setDeleteTarget(p.id)} className="px-3 py-1.5 text-[12px] font-medium text-[#e0437b] hover:bg-[#e0437b]/5 rounded-lg transition">삭제</button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        );
      })()}

      <ConfirmModal open={!!deleteTarget} title="포트폴리오 삭제" message="이 포트폴리오를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
        onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />
      <ApiKeyModal open={showModal} onClose={() => setShowModal(false)} onSave={() => setShowModal(false)} />
      <ResumeUploadModal open={showResumeUpload} onClose={() => setShowResumeUpload(false)} onResult={handleResumeResult} />
    </div>
  );
}
