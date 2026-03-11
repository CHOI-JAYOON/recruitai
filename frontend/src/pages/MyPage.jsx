import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import api from '../api/client';
import LoadingSpinner from '../components/LoadingSpinner';
import ConfirmModal from '../components/ConfirmModal';
import ApiKeyModal, { useApiKeyCheck } from '../components/ApiKeyModal';
import ResumeUploadModal from '../components/ResumeUploadModal';

const schoolTypes = ['고등학교', '대학교', '대학원'];
const gpaScales = ['4.0', '4.3', '4.5'];
const degreeTypes = ['전문학사', '학사', '석사', '박사', '기타'];
const statusOptions = ['지원예정', '지원완료', '서류합격', '면접예정', '면접완료', '최종합격', '불합격'];
const statusColors = {
  '지원예정': 'bg-gray-100 text-gray-600',
  '지원완료': 'bg-blue-50 text-blue-600',
  '서류합격': 'bg-cyan-50 text-cyan-600',
  '면접예정': 'bg-amber-50 text-amber-600',
  '면접완료': 'bg-purple-50 text-purple-600',
  '최종합격': 'bg-green-50 text-green-600',
  '불합격': 'bg-red-50 text-red-500',
};

const emptyEducation = { school_type: '대학교', school: '', major: '', degree: '', start_date: '', end_date: '', gpa: '', gpa_scale: '4.5' };
const emptyWork = { company: '', team: '', position: '', start_date: '', end_date: '', is_current: false, description: '', projects: [] };
const emptyProject = { name: '', description: '', period: '' };
const emptyCert = { name: '', issuer: '', date: '' };
const emptyAward = { name: '', issuer: '', date: '', description: '' };
const emptyTraining = { name: '', institution: '', start_date: '', end_date: '', description: '' };

export default function MyPage() {
  const { user, updateUser } = useAuth();
  const toast = useToast();
  const [searchParams] = useSearchParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState(() => searchParams.get('tab') || 'profile');
  const [editing, setEditing] = useState(false);
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('apiKey') || '');
  const [coverLetters, setCoverLetters] = useState([]);
  const [expandedCL, setExpandedCL] = useState(null);
  const [resumes, setResumes] = useState([]);
  const [careerDescs, setCareerDescs] = useState([]);
  const [expandedResume, setExpandedResume] = useState(null);
  const [expandedCareerDesc, setExpandedCareerDesc] = useState(null);
  const [primaryResumeIds, setPrimaryResumeIds] = useState(() => {
    try {
      const arr = JSON.parse(localStorage.getItem('recruitai_primary_resumes') || '[]');
      if (Array.isArray(arr) && arr.length > 0) return arr;
    } catch {}
    const old = localStorage.getItem('recruitai_primary_resume');
    if (old) { const m = [old]; localStorage.setItem('recruitai_primary_resumes', JSON.stringify(m)); localStorage.removeItem('recruitai_primary_resume'); return m; }
    return [];
  });
  const [primaryCareerDescIds, setPrimaryCareerDescIds] = useState(() => {
    try {
      const arr = JSON.parse(localStorage.getItem('recruitai_primary_career_descs') || '[]');
      if (Array.isArray(arr) && arr.length > 0) return arr;
    } catch {}
    const old = localStorage.getItem('recruitai_primary_career_desc');
    if (old) { const m = [old]; localStorage.setItem('recruitai_primary_career_descs', JSON.stringify(m)); localStorage.removeItem('recruitai_primary_career_desc'); return m; }
    return [];
  });
  const [resumeDownloading, setResumeDownloading] = useState(false);
  const [careerDescDownloading, setCareerDescDownloading] = useState(false);
  const [renamingId, setRenamingId] = useState(null);
  const [renameValue, setRenameValue] = useState('');

  // Cover letter edit state
  const [editingCLId, setEditingCLId] = useState(null);
  const [editingCLAnswers, setEditingCLAnswers] = useState([]);
  const [clSaving, setCLSaving] = useState(false);

  // Applications state
  const [applications, setApplications] = useState([]);
  const [appForm, setAppForm] = useState(null);
  const [appSaving, setAppSaving] = useState(false);
  const [appDeleteTarget, setAppDeleteTarget] = useState(null);
  const { showModal: showApiKeyModal, setShowModal: setShowApiKeyModal, checkApiKey } = useApiKeyCheck();
  const [showResumeUpload, setShowResumeUpload] = useState(false);

  // Cover letter folder state
  const [openCompany, setOpenCompany] = useState(null);

  // Account management state
  const [displayName, setDisplayName] = useState(user?.display_name || user?.username || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [accountSaving, setAccountSaving] = useState(false);

  const tabs = [
    { id: 'profile', label: '프로필' },
    { id: 'applications', label: '지원현황' },
    { id: 'resume', label: '이력서' },
    { id: 'coverletter', label: '자소서' },
    { id: 'account', label: '계정' },
    { id: 'apikey', label: 'API 키' },
  ];

  useEffect(() => {
    loadProfile();
    loadCoverLetters();
    loadApplications();
    loadResumes();
    loadCareerDescs();
  }, []);

  // Auto-delete resumes/career descs older than 15 days (excluding primary)
  useEffect(() => {
    const FIFTEEN_DAYS_MS = 15 * 24 * 60 * 60 * 1000;
    const now = Date.now();

    // Cleanup old resumes
    resumes.forEach((r) => {
      if (primaryResumeIds.includes(r.id)) return;
      const createdAt = new Date(r.created_at).getTime();
      if (now - createdAt > FIFTEEN_DAYS_MS) {
        api.delete(`/resume/history/${r.id}?username=${user.username}`).catch(() => {});
      }
    });
    const expiredResumeIds = resumes.filter((r) => !primaryResumeIds.includes(r.id) && now - new Date(r.created_at).getTime() > FIFTEEN_DAYS_MS).map((r) => r.id);
    if (expiredResumeIds.length > 0) {
      setResumes((prev) => prev.filter((r) => !expiredResumeIds.includes(r.id)));
    }

    // Cleanup old career descs
    careerDescs.forEach((r) => {
      if (primaryCareerDescIds.includes(r.id)) return;
      const createdAt = new Date(r.created_at).getTime();
      if (now - createdAt > FIFTEEN_DAYS_MS) {
        api.delete(`/career-description/history/${r.id}?username=${user.username}`).catch(() => {});
      }
    });
    const expiredCareerDescIds = careerDescs.filter((r) => !primaryCareerDescIds.includes(r.id) && now - new Date(r.created_at).getTime() > FIFTEEN_DAYS_MS).map((r) => r.id);
    if (expiredCareerDescIds.length > 0) {
      setCareerDescs((prev) => prev.filter((r) => !expiredCareerDescIds.includes(r.id)));
    }
  }, [resumes.length, careerDescs.length]);

  const loadProfile = async () => {
    const defaultProfile = { name: '', email: '', phone: '', github: '', linkedin: '', blog: '', summary: '', resume_text: '', education: [], work_experience: [], certificates: [], awards: [], trainings: [] };
    try {
      const res = await api.get(`/profile/${user.username}`);
      const data = res.data || defaultProfile;
      // 회원가입 시 입력한 이름/이메일 자동 반영
      if (!data.name && user?.display_name) data.name = user.display_name;
      if (!data.email && user?.email) data.email = user.email;
      setProfile(data);
    } catch {
      defaultProfile.name = user?.display_name || '';
      defaultProfile.email = user?.email || '';
      setProfile(defaultProfile);
    } finally {
      setLoading(false);
    }
  };

  const loadCoverLetters = async () => {
    try {
      const res = await api.get(`/cover-letter/history?username=${user.username}`);
      setCoverLetters(res.data);
    } catch { /* ignore */ }
  };

  const loadResumes = async () => {
    try {
      const res = await api.get(`/resume/history?username=${user.username}`);
      setResumes(res.data);
    } catch { /* ignore */ }
  };

  const loadCareerDescs = async () => {
    try {
      const res = await api.get(`/career-description/history?username=${user.username}`);
      setCareerDescs(res.data);
    } catch { /* ignore */ }
  };

  const deleteResume = async (recordId) => {
    if (!confirm('이 이력서를 삭제하시겠습니까?')) return;
    try {
      await api.delete(`/resume/history/${recordId}?username=${user.username}`);
      if (expandedResume === recordId) setExpandedResume(null);
      if (primaryResumeIds.includes(recordId)) {
        const updated = primaryResumeIds.filter((id) => id !== recordId);
        localStorage.setItem('recruitai_primary_resumes', JSON.stringify(updated));
        setPrimaryResumeIds(updated);
      }
      await loadResumes();
      toast.success('삭제되었습니다.');
    } catch { toast.error('삭제 실패'); }
  };

  const deleteCareerDesc = async (recordId) => {
    if (!confirm('이 경력기술서를 삭제하시겠습니까?')) return;
    try {
      await api.delete(`/career-description/history/${recordId}?username=${user.username}`);
      if (expandedCareerDesc === recordId) setExpandedCareerDesc(null);
      if (primaryCareerDescIds.includes(recordId)) {
        const updated = primaryCareerDescIds.filter((id) => id !== recordId);
        localStorage.setItem('recruitai_primary_career_descs', JSON.stringify(updated));
        setPrimaryCareerDescIds(updated);
      }
      await loadCareerDescs();
      toast.success('삭제되었습니다.');
    } catch { toast.error('삭제 실패'); }
  };

  const togglePrimaryResume = (resumeId) => {
    let updated;
    if (primaryResumeIds.includes(resumeId)) {
      updated = primaryResumeIds.filter((id) => id !== resumeId);
    } else {
      if (primaryResumeIds.length >= 2) {
        toast.error('대표 이력서는 최대 2개까지 설정할 수 있습니다.');
        return;
      }
      updated = [...primaryResumeIds, resumeId];
    }
    localStorage.setItem('recruitai_primary_resumes', JSON.stringify(updated));
    setPrimaryResumeIds(updated);
  };

  const togglePrimaryCareerDesc = (careerDescId) => {
    let updated;
    if (primaryCareerDescIds.includes(careerDescId)) {
      updated = primaryCareerDescIds.filter((id) => id !== careerDescId);
    } else {
      if (primaryCareerDescIds.length >= 2) {
        toast.error('대표 경력기술서는 최대 2개까지 설정할 수 있습니다.');
        return;
      }
      updated = [...primaryCareerDescIds, careerDescId];
    }
    localStorage.setItem('recruitai_primary_career_descs', JSON.stringify(updated));
    setPrimaryCareerDescIds(updated);
  };

  const handleResumeDownload = async (record) => {
    setResumeDownloading(true);
    try {
      const res = await api.post('/resume/download-from-history', {
        username: user.username, history_id: record.id,
      }, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${user.username}_이력서.docx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch { toast.error('다운로드 실패'); }
    finally { setResumeDownloading(false); }
  };

  const handleCareerDescDownload = async (record) => {
    setCareerDescDownloading(true);
    try {
      const res = await api.post('/career-description/download-from-history', {
        username: user.username, history_id: record.id,
      }, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${user.username}_경력기술서.docx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch { toast.error('다운로드 실패'); }
    finally { setCareerDescDownloading(false); }
  };

  const startRename = (id, currentName) => {
    setRenamingId(id);
    setRenameValue(currentName || '');
  };

  const handleRenameResume = async (recordId) => {
    try {
      await api.put(`/resume/history/${recordId}`, { username: user.username, name: renameValue.trim() });
      setRenamingId(null);
      setRenameValue('');
      await loadResumes();
      toast.success('이름이 변경되었습니다.');
    } catch { toast.error('이름 변경 실패'); }
  };

  const handleRenameCareerDesc = async (recordId) => {
    try {
      await api.put(`/career-description/history/${recordId}`, { username: user.username, name: renameValue.trim() });
      setRenamingId(null);
      setRenameValue('');
      await loadCareerDescs();
      toast.success('이름이 변경되었습니다.');
    } catch { toast.error('이름 변경 실패'); }
  };

  const startEditCL = (record) => {
    setExpandedCL(record.id);
    setEditingCLId(record.id);
    setEditingCLAnswers(record.answers.map((a) => ({ ...a })));
  };

  const cancelEditCL = () => {
    setEditingCLId(null);
    setEditingCLAnswers([]);
  };

  const updateCLAnswer = (idx, value) => {
    const updated = [...editingCLAnswers];
    updated[idx] = { ...updated[idx], answer: value };
    setEditingCLAnswers(updated);
  };

  const saveCLEdit = async (recordId) => {
    setCLSaving(true);
    try {
      await api.put(`/cover-letter/history/${recordId}`, {
        username: user.username,
        answers: editingCLAnswers,
      });
      setEditingCLId(null);
      setEditingCLAnswers([]);
      await loadCoverLetters();
      toast.success('자소서가 수정되었습니다.');
    } catch { toast.error('수정 실패'); }
    finally { setCLSaving(false); }
  };

  const loadApplications = async () => {
    try {
      const res = await api.get(`/applications?username=${user.username}`);
      setApplications(res.data);
    } catch { /* ignore */ }
  };

  const deleteCoverLetter = async (recordId) => {
    if (!confirm('이 자소서를 삭제하시겠습니까?')) return;
    try {
      await api.delete(`/cover-letter/history/${recordId}?username=${user.username}`);
      if (expandedCL === recordId) setExpandedCL(null);
      await loadCoverLetters();
    } catch {
      toast.error('삭제 실패');
    }
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      await api.put(`/profile/${user.username}`, profile);
      setEditing(false);
      toast.success('프로필이 저장되었습니다.');
    } catch {
      toast.error('저장 실패');
    } finally {
      setSaving(false);
    }
  };

  const cancelEdit = () => {
    setEditing(false);
    loadProfile();
  };

  const handleResumeResult = (data) => {
    if (!data || !profile) return;
    const updated = { ...profile };
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
    setProfile(updated);
    setEditing(true);
    toast.success('이력서 분석이 완료되었습니다. 확인 후 저장해주세요.');
  };

  const saveApiKey = () => {
    localStorage.setItem('apiKey', apiKey);
    toast.success('API 키가 저장되었습니다.');
  };

  const updateField = (field, value) => {
    setProfile({ ...profile, [field]: value });
  };

  const updateListItem = (listField, idx, field, value) => {
    const list = [...profile[listField]];
    list[idx] = { ...list[idx], [field]: value };
    setProfile({ ...profile, [listField]: list });
  };

  const addListItem = (listField, empty) => {
    setProfile({ ...profile, [listField]: [...profile[listField], { ...empty }] });
  };

  const removeListItem = (listField, idx) => {
    setProfile({ ...profile, [listField]: profile[listField].filter((_, i) => i !== idx) });
  };

  // ─── Application handlers ───
  const startAddApp = () => {
    setAppForm({ company: '', position: '', status: '지원예정', url: '', notes: '', applied_date: '', resume_id: '', cover_letter_id: '' });
  };

  const startEditApp = (app) => {
    setAppForm({ ...app, _editing: true });
  };

  const saveApp = async () => {
    if (!appForm.company?.trim()) { toast.error('회사명을 입력해주세요.'); return; }
    setAppSaving(true);
    try {
      if (appForm._editing && appForm.id) {
        const { _editing, ...data } = appForm;
        await api.put(`/applications/${appForm.id}`, { username: user.username, ...data });
      } else {
        await api.post('/applications', { username: user.username, ...appForm });
      }
      await loadApplications();
      setAppForm(null);
      toast.success('저장되었습니다.');
    } catch {
      toast.error('저장 실패');
    } finally {
      setAppSaving(false);
    }
  };

  const deleteApp = async () => {
    if (!appDeleteTarget) return;
    try {
      await api.delete(`/applications/${appDeleteTarget}?username=${user.username}`);
      await loadApplications();
      toast.success('삭제되었습니다.');
    } catch {
      toast.error('삭제 실패');
    } finally {
      setAppDeleteTarget(null);
    }
  };

  const updateAppStatus = async (app, newStatus) => {
    try {
      await api.put(`/applications/${app.id}`, { username: user.username, status: newStatus });
      await loadApplications();
    } catch {
      toast.error('상태 변경 실패');
    }
  };

  if (loading) return <LoadingSpinner text="프로필 불러오는 중..." />;

  // ─── Shared styles ───
  const inputClass = "w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white transition";
  const labelClass = "block text-[13px] font-semibold text-gray-600 mb-1.5";

  // ─── View Components ───

  const ViewBasic = () => {
    const fields = [
      { label: '이름', value: profile.name },
      { label: '이메일', value: profile.email },
      { label: '전화번호', value: profile.phone },
      { label: 'GitHub', value: profile.github },
      { label: 'LinkedIn', value: profile.linkedin },
      { label: '블로그', value: profile.blog },
    ];
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-4">
        {profile.photo_url && (
          <div className="lg:col-span-2 mb-2">
            <img src={profile.photo_url} alt="증명사진" className="w-20 h-24 object-cover rounded-xl border border-gray-200" />
          </div>
        )}
        {fields.map((f) => (
          <div key={f.label} className="flex items-baseline gap-4">
            <span className="text-[13px] font-semibold text-gray-400 w-20 shrink-0">{f.label}</span>
            <span className="text-sm text-gray-900">{f.value || <span className="text-gray-300">-</span>}</span>
          </div>
        ))}
        <div className="flex items-baseline gap-4 lg:col-span-2">
          <span className="text-[13px] font-semibold text-gray-400 w-20 shrink-0">자기소개</span>
          <span className="text-sm text-gray-900 whitespace-pre-wrap leading-relaxed">{profile.summary || <span className="text-gray-300">-</span>}</span>
        </div>
      </div>
    );
  };

  const ViewEducation = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
      {profile.education.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-6 lg:col-span-2">등록된 학력이 없습니다.</p>
      ) : profile.education.map((edu, i) => (
        <div key={i} className="border border-gray-100 rounded-xl p-4 hover:bg-gray-50 transition">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-bold text-gray-900">{edu.school || '-'}</span>
            <span className="text-xs text-gray-400 font-medium">{edu.school_type}</span>
          </div>
          <p className="text-xs text-gray-600">
            {[edu.major, edu.degree].filter(Boolean).join(' · ')}
            {(edu.start_date || edu.end_date) && <span className="ml-2 text-gray-400">{edu.start_date} ~ {edu.end_date}</span>}
            {edu.gpa && <span className="ml-2 text-gray-400">GPA {edu.gpa}/{edu.gpa_scale}</span>}
          </p>
        </div>
      ))}
    </div>
  );

  const ViewWork = () => (
    <div className="flex flex-col gap-3">
      {profile.work_experience.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-6">등록된 경력이 없습니다.</p>
      ) : profile.work_experience.map((work, i) => (
        <div key={i} className="border border-gray-100 rounded-xl p-4 hover:bg-gray-50 transition">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-bold text-gray-900">{work.company || '-'}</span>
            {work.team && <span className="text-xs text-gray-400">{work.team}</span>}
            {work.position && <span className="text-xs font-semibold text-primary bg-primary-light px-2 py-0.5 rounded-full">{work.position}</span>}
          </div>
          <p className="text-xs text-gray-400 mb-1.5">
            {work.start_date} ~ {work.is_current ? '재직중' : work.end_date}
          </p>
          {work.description && <p className="text-[13px] text-gray-600 leading-relaxed">{work.description}</p>}
          {work.projects?.length > 0 && (
            <div className="mt-3 pl-3 border-l-2 border-gray-100 space-y-1.5">
              {work.projects.map((proj, pi) => (
                <div key={pi} className="text-xs text-gray-600">
                  <span className="font-semibold text-gray-800">{proj.name}</span>
                  {proj.period && <span className="text-gray-400 ml-1.5">({proj.period})</span>}
                  {proj.description && <span className="text-gray-500 ml-1.5">- {proj.description}</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );

  const ViewCert = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
      {profile.certificates.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-6 lg:col-span-2">등록된 자격증이 없습니다.</p>
      ) : profile.certificates.map((cert, i) => (
        <div key={i} className="flex items-center justify-between border border-gray-100 rounded-xl px-4 py-3.5 hover:bg-gray-50 transition">
          <div>
            <span className="text-sm font-semibold text-gray-900">{cert.name || '-'}</span>
            {cert.issuer && <span className="text-xs text-gray-400 ml-2">{cert.issuer}</span>}
          </div>
          {cert.date && <span className="text-xs text-gray-400">{cert.date}</span>}
        </div>
      ))}
    </div>
  );

  const ViewAward = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
      {profile.awards.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-6 lg:col-span-2">등록된 수상이 없습니다.</p>
      ) : profile.awards.map((award, i) => (
        <div key={i} className="border border-gray-100 rounded-xl px-4 py-3.5 hover:bg-gray-50 transition">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-semibold text-gray-900">{award.name || '-'}</span>
              {award.issuer && <span className="text-xs text-gray-400 ml-2">{award.issuer}</span>}
            </div>
            {award.date && <span className="text-xs text-gray-400">{award.date}</span>}
          </div>
          {award.description && <p className="text-[13px] text-gray-500 mt-1.5">{award.description}</p>}
        </div>
      ))}
    </div>
  );

  const ViewTraining = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
      {(profile.trainings || []).length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-6 lg:col-span-2">등록된 교육 이수가 없습니다.</p>
      ) : profile.trainings.map((tr, i) => (
        <div key={i} className="border border-gray-100 rounded-xl px-4 py-3.5 hover:bg-gray-50 transition">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-semibold text-gray-900">{tr.name || '-'}</span>
              {tr.institution && <span className="text-xs text-gray-400 ml-2">{tr.institution}</span>}
            </div>
            {(tr.start_date || tr.end_date) && <span className="text-xs text-gray-400">{tr.start_date} ~ {tr.end_date}</span>}
          </div>
          {tr.description && <p className="text-[13px] text-gray-500 mt-1.5">{tr.description}</p>}
        </div>
      ))}
    </div>
  );

  // ─── Applications View ───

  const ViewApplications = () => {
    const formatDate = (iso) => {
      if (!iso) return '-';
      const d = new Date(iso);
      return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
    };

    // Application form (add/edit)
    if (appForm) {
      return (
        <div className="animate-fade-in">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-[15px] font-bold text-gray-900">{appForm._editing ? '지원 정보 수정' : '새 지원 추가'}</h3>
            <button onClick={() => setAppForm(null)} className="text-sm text-gray-400 hover:text-gray-600 transition">뒤로</button>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>회사명 *</label>
              <input value={appForm.company} onChange={(e) => setAppForm({ ...appForm, company: e.target.value })} className={inputClass} placeholder="삼성전자, 네이버 등" />
            </div>
            <div>
              <label className={labelClass}>지원 직무</label>
              <input value={appForm.position} onChange={(e) => setAppForm({ ...appForm, position: e.target.value })} className={inputClass} placeholder="백엔드 개발자" />
            </div>
            <div>
              <label className={labelClass}>진행 상태</label>
              <select value={appForm.status} onChange={(e) => setAppForm({ ...appForm, status: e.target.value })} className={inputClass}>
                {statusOptions.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>지원일</label>
              <input type="date" value={appForm.applied_date} onChange={(e) => setAppForm({ ...appForm, applied_date: e.target.value })} className={inputClass} />
            </div>
            <div className="lg:col-span-2">
              <label className={labelClass}>채용 공고 URL</label>
              <input value={appForm.url} onChange={(e) => setAppForm({ ...appForm, url: e.target.value })} className={inputClass} placeholder="https://..." />
            </div>
            <div className="lg:col-span-2">
              <label className={labelClass}>메모</label>
              <textarea value={appForm.notes} onChange={(e) => setAppForm({ ...appForm, notes: e.target.value })} rows={3} className={`${inputClass} resize-none`} placeholder="면접 준비사항, 특이사항 등" />
            </div>
            <div>
              <label className={labelClass}>연결 이력서</label>
              <select value={appForm.resume_id || ''} onChange={(e) => setAppForm({ ...appForm, resume_id: e.target.value })} className={inputClass}>
                <option value="">선택 안함</option>
                {resumes.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.created_at ? new Date(r.created_at).toLocaleDateString('ko-KR') : ''} 이력서
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>연결 자소서</label>
              <select value={appForm.cover_letter_id || ''} onChange={(e) => setAppForm({ ...appForm, cover_letter_id: e.target.value })} className={inputClass}>
                <option value="">선택 안함</option>
                {coverLetters.map((cl) => (
                  <option key={cl.id} value={cl.id}>
                    {cl.company || '무제'} ({cl.answers?.length || 0}개 문항)
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-5">
            <button onClick={() => setAppForm(null)}
              className="px-4 py-2 text-sm font-semibold text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition">
              취소
            </button>
            <button onClick={saveApp} disabled={appSaving}
              className="px-4 py-2 text-sm font-semibold text-white bg-primary rounded-lg hover:bg-primary-dark transition disabled:opacity-50">
              {appSaving ? '저장 중...' : '저장'}
            </button>
          </div>
        </div>
      );
    }

    // Application list
    const grouped = {};
    statusOptions.forEach((s) => { grouped[s] = []; });
    applications.forEach((app) => {
      if (grouped[app.status]) grouped[app.status].push(app);
      else grouped['지원예정'].push(app);
    });

    return (
      <div>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-gray-500">총 {applications.length}건</span>
          </div>
          <button onClick={startAddApp}
            className="px-4 py-2 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-dark transition">
            + 추가
          </button>
        </div>

        {applications.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gray-100 flex items-center justify-center">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#b0b8c1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 3H8l-2 4h12l-2-4z" />
              </svg>
            </div>
            <p className="text-[15px] font-semibold text-gray-600 mb-1">아직 지원 기록이 없습니다</p>
            <p className="text-sm text-gray-400 mb-5">회사 지원 현황을 추가해보세요</p>
            <button onClick={startAddApp}
              className="px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-dark transition">
              첫 지원 기록 추가하기
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-3 text-xs font-semibold text-gray-400 uppercase">회사</th>
                  <th className="text-left py-3 px-3 text-xs font-semibold text-gray-400 uppercase">직무</th>
                  <th className="text-left py-3 px-3 text-xs font-semibold text-gray-400 uppercase">상태</th>
                  <th className="text-left py-3 px-3 text-xs font-semibold text-gray-400 uppercase">서류</th>
                  <th className="text-left py-3 px-3 text-xs font-semibold text-gray-400 uppercase">지원일</th>
                  <th className="text-right py-3 px-3 text-xs font-semibold text-gray-400 uppercase w-24"></th>
                </tr>
              </thead>
              <tbody>
                {applications.map((app) => {
                  const linkedResume = app.resume_id ? resumes.find((r) => r.id === app.resume_id) : null;
                  const linkedCL = app.cover_letter_id ? coverLetters.find((c) => c.id === app.cover_letter_id) : null;
                  return (
                  <tr key={app.id} className="border-b border-gray-100 hover:bg-gray-50 transition group">
                    <td className="py-3.5 px-3">
                      <div>
                          <p className="font-semibold text-gray-900">{app.company}</p>
                          {app.notes && <p className="text-xs text-gray-400 truncate max-w-[200px]">{app.notes}</p>}
                      </div>
                    </td>
                    <td className="py-3.5 px-3 text-gray-600">{app.position || '-'}</td>
                    <td className="py-3.5 px-3">
                      <select
                        value={app.status}
                        onChange={(e) => updateAppStatus(app, e.target.value)}
                        className={`text-xs font-semibold px-2.5 py-1 rounded-full border-0 cursor-pointer ${statusColors[app.status] || 'bg-gray-100 text-gray-600'}`}
                      >
                        {statusOptions.map((s) => <option key={s}>{s}</option>)}
                      </select>
                    </td>
                    <td className="py-3.5 px-3">
                      <div className="flex flex-wrap gap-1">
                        {linkedResume && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#e8faf5] text-[#00a868]">
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                            이력서
                          </span>
                        )}
                        {linkedCL && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#f3eeff] text-[#7b61ff]">
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" /></svg>
                            자소서
                          </span>
                        )}
                        {!linkedResume && !linkedCL && <span className="text-xs text-gray-300">-</span>}
                      </div>
                    </td>
                    <td className="py-3.5 px-3 text-gray-400 text-xs">{app.applied_date || formatDate(app.created_at)}</td>
                    <td className="py-3.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition">
                        {app.url && (
                          <a href={app.url} target="_blank" rel="noopener noreferrer"
                            className="px-2 py-1 text-xs text-gray-500 hover:text-primary hover:bg-primary-light rounded-lg transition">링크</a>
                        )}
                        <button onClick={() => startEditApp(app)}
                          className="px-2 py-1 text-xs text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition">수정</button>
                        <button onClick={() => setAppDeleteTarget(app.id)}
                          className="px-2 py-1 text-xs text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition">삭제</button>
                      </div>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  // ─── Edit Components ───

  const EditBasic = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="lg:col-span-2 mb-2">
        <label className={labelClass}>증명사진</label>
        <div className="flex items-center gap-4">
          {profile.photo_url ? (
            <img src={profile.photo_url} alt="증명사진" className="w-20 h-24 object-cover rounded-xl border border-gray-200" />
          ) : (
            <div className="w-20 h-24 bg-gray-100 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>
            </div>
          )}
          <div className="flex flex-col gap-2">
            <label className="px-4 py-2 bg-primary/10 text-primary text-sm font-semibold rounded-xl hover:bg-primary/20 transition cursor-pointer inline-flex items-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              사진 업로드
              <input type="file" accept="image/*" onChange={async (e) => {
                const file = e.target.files[0];
                if (!file) return;
                const formData = new FormData();
                formData.append('file', file);
                try {
                  const res = await api.post(`/profile/${user.username}/photo`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
                  setProfile({ ...profile, photo_url: res.data.photo_url });
                  toast.success('사진이 업로드되었습니다.');
                } catch { toast.error('사진 업로드 실패'); }
              }} className="hidden" />
            </label>
            {profile.photo_url && (
              <button onClick={() => setProfile({ ...profile, photo_url: '' })}
                className="text-xs text-gray-400 hover:text-red-500 transition">삭제</button>
            )}
          </div>
        </div>
      </div>
      {[
        { key: 'name', label: '이름' },
        { key: 'email', label: '이메일', type: 'email' },
        { key: 'phone', label: '전화번호', type: 'tel' },
        { key: 'github', label: 'GitHub' },
        { key: 'linkedin', label: 'LinkedIn' },
        { key: 'blog', label: '블로그' },
      ].map((f) => (
        <div key={f.key}>
          <label className={labelClass}>{f.label}</label>
          <input
            type={f.type || 'text'}
            value={profile[f.key] || ''}
            onChange={(e) => updateField(f.key, e.target.value)}
            className={inputClass}
          />
        </div>
      ))}
      <div className="lg:col-span-2">
        <label className={labelClass}>자기소개</label>
        <textarea
          value={profile.summary || ''}
          onChange={(e) => updateField('summary', e.target.value)}
          rows={3}
          className={`${inputClass} resize-none`}
        />
      </div>
    </div>
  );

  const EditEducation = () => (
    <div className="flex flex-col gap-4">
      {profile.education.map((edu, idx) => (
        <div key={idx} className="border border-gray-200 rounded-xl p-4 relative">
          <button onClick={() => removeListItem('education', idx)} className="absolute top-3 right-3 text-xs text-gray-400 hover:text-red-500 transition">삭제</button>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className={labelClass}>학교 유형</label>
              <select value={edu.school_type} onChange={(e) => updateListItem('education', idx, 'school_type', e.target.value)} className={inputClass}>
                {schoolTypes.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>학교명</label>
              <input value={edu.school} onChange={(e) => updateListItem('education', idx, 'school', e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>전공</label>
              <input value={edu.major} onChange={(e) => updateListItem('education', idx, 'major', e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>학위</label>
              <select value={edu.degree} onChange={(e) => updateListItem('education', idx, 'degree', e.target.value)} className={inputClass}>
                <option value="">선택</option>
                {degreeTypes.map((d) => <option key={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>입학일</label>
              <input type="date" value={edu.start_date} onChange={(e) => updateListItem('education', idx, 'start_date', e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>졸업일</label>
              <input type="date" value={edu.end_date} onChange={(e) => updateListItem('education', idx, 'end_date', e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>학점</label>
              <div className="flex gap-2">
                <input value={edu.gpa} onChange={(e) => updateListItem('education', idx, 'gpa', e.target.value)} className={`flex-1 ${inputClass}`} placeholder="3.8" />
                <select value={edu.gpa_scale} onChange={(e) => updateListItem('education', idx, 'gpa_scale', e.target.value)} className={inputClass} style={{ width: 'auto' }}>
                  {gpaScales.map((s) => <option key={s}>/{s}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>
      ))}
      <button onClick={() => addListItem('education', emptyEducation)} className="w-full py-3 border-2 border-dashed border-gray-300 text-sm text-gray-500 font-medium rounded-xl hover:border-primary hover:text-primary transition">+ 학력 추가</button>
    </div>
  );

  const EditWork = () => (
    <div className="flex flex-col gap-4">
      {profile.work_experience.map((work, idx) => (
        <div key={idx} className="border border-gray-200 rounded-xl p-4 relative">
          <button onClick={() => removeListItem('work_experience', idx)} className="absolute top-3 right-3 text-xs text-gray-400 hover:text-red-500 transition">삭제</button>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
            <div>
              <label className={labelClass}>회사명</label>
              <input value={work.company} onChange={(e) => updateListItem('work_experience', idx, 'company', e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>팀</label>
              <input value={work.team} onChange={(e) => updateListItem('work_experience', idx, 'team', e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>직책</label>
              <input value={work.position} onChange={(e) => updateListItem('work_experience', idx, 'position', e.target.value)} className={inputClass} />
            </div>
            <div className="flex items-end gap-2">
              <label className="flex items-center gap-2 text-sm text-gray-700 pb-2.5">
                <input type="checkbox" checked={work.is_current} onChange={(e) => updateListItem('work_experience', idx, 'is_current', e.target.checked)} className="rounded text-primary focus:ring-primary" />
                재직중
              </label>
            </div>
            <div>
              <label className={labelClass}>입사일</label>
              <input type="date" value={work.start_date} onChange={(e) => updateListItem('work_experience', idx, 'start_date', e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>퇴사일</label>
              <input type="date" value={work.end_date} onChange={(e) => updateListItem('work_experience', idx, 'end_date', e.target.value)} disabled={work.is_current} className={`${inputClass} disabled:bg-gray-100 disabled:text-gray-400`} />
            </div>
          </div>
          <div className="mb-3">
            <label className={labelClass}>업무 설명</label>
            <textarea value={work.description} onChange={(e) => updateListItem('work_experience', idx, 'description', e.target.value)} rows={2} className={`${inputClass} resize-none`} />
          </div>
          <div>
            <label className={labelClass}>프로젝트</label>
            {(work.projects || []).map((proj, pi) => (
              <div key={pi} className="flex gap-2 mb-2 bg-gray-50 p-3 rounded-lg">
                <div className="flex-1 grid grid-cols-3 gap-2">
                  <input value={proj.name} onChange={(e) => { const projects = [...work.projects]; projects[pi] = { ...projects[pi], name: e.target.value }; updateListItem('work_experience', idx, 'projects', projects); }} className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary/20" placeholder="프로젝트명" />
                  <input value={proj.period} onChange={(e) => { const projects = [...work.projects]; projects[pi] = { ...projects[pi], period: e.target.value }; updateListItem('work_experience', idx, 'projects', projects); }} className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary/20" placeholder="기간" />
                  <input value={proj.description} onChange={(e) => { const projects = [...work.projects]; projects[pi] = { ...projects[pi], description: e.target.value }; updateListItem('work_experience', idx, 'projects', projects); }} className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary/20" placeholder="설명" />
                </div>
                <button onClick={() => { const projects = work.projects.filter((_, i) => i !== pi); updateListItem('work_experience', idx, 'projects', projects); }} className="text-xs text-gray-400 hover:text-red-500 px-1">×</button>
              </div>
            ))}
            <button onClick={() => { const projects = [...(work.projects || []), { ...emptyProject }]; updateListItem('work_experience', idx, 'projects', projects); }} className="text-xs text-primary hover:text-primary-dark font-semibold">+ 프로젝트 추가</button>
          </div>
        </div>
      ))}
      <button onClick={() => addListItem('work_experience', emptyWork)} className="w-full py-3 border-2 border-dashed border-gray-300 text-sm text-gray-500 font-medium rounded-xl hover:border-primary hover:text-primary transition">+ 경력 추가</button>
    </div>
  );

  const EditCert = () => (
    <div className="flex flex-col gap-3">
      {profile.certificates.map((cert, idx) => (
        <div key={idx} className="border border-gray-200 rounded-xl p-4 relative">
          <button onClick={() => removeListItem('certificates', idx)} className="absolute top-3 right-3 text-xs text-gray-400 hover:text-red-500 transition">삭제</button>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={labelClass}>자격증명</label>
              <input value={cert.name} onChange={(e) => updateListItem('certificates', idx, 'name', e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>발급기관</label>
              <input value={cert.issuer} onChange={(e) => updateListItem('certificates', idx, 'issuer', e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>취득일</label>
              <input type="date" value={cert.date} onChange={(e) => updateListItem('certificates', idx, 'date', e.target.value)} className={inputClass} />
            </div>
          </div>
        </div>
      ))}
      <button onClick={() => addListItem('certificates', emptyCert)} className="w-full py-3 border-2 border-dashed border-gray-300 text-sm text-gray-500 font-medium rounded-xl hover:border-primary hover:text-primary transition">+ 자격증 추가</button>
    </div>
  );

  const EditAward = () => (
    <div className="flex flex-col gap-3">
      {profile.awards.map((award, idx) => (
        <div key={idx} className="border border-gray-200 rounded-xl p-4 relative">
          <button onClick={() => removeListItem('awards', idx)} className="absolute top-3 right-3 text-xs text-gray-400 hover:text-red-500 transition">삭제</button>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>수상명</label>
              <input value={award.name} onChange={(e) => updateListItem('awards', idx, 'name', e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>수여기관</label>
              <input value={award.issuer} onChange={(e) => updateListItem('awards', idx, 'issuer', e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>수상일</label>
              <input type="date" value={award.date} onChange={(e) => updateListItem('awards', idx, 'date', e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>설명</label>
              <input value={award.description} onChange={(e) => updateListItem('awards', idx, 'description', e.target.value)} className={inputClass} />
            </div>
          </div>
        </div>
      ))}
      <button onClick={() => addListItem('awards', emptyAward)} className="w-full py-3 border-2 border-dashed border-gray-300 text-sm text-gray-500 font-medium rounded-xl hover:border-primary hover:text-primary transition">+ 수상 추가</button>
    </div>
  );

  const EditTraining = () => (
    <div className="flex flex-col gap-3">
      {(profile.trainings || []).map((tr, idx) => (
        <div key={idx} className="border border-gray-200 rounded-xl p-4 relative">
          <button onClick={() => removeListItem('trainings', idx)} className="absolute top-3 right-3 text-xs text-gray-400 hover:text-red-500 transition">삭제</button>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>과정명</label>
              <input value={tr.name} onChange={(e) => updateListItem('trainings', idx, 'name', e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>교육기관</label>
              <input value={tr.institution} onChange={(e) => updateListItem('trainings', idx, 'institution', e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>시작일</label>
              <input type="date" value={tr.start_date} onChange={(e) => updateListItem('trainings', idx, 'start_date', e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>종료일</label>
              <input type="date" value={tr.end_date} onChange={(e) => updateListItem('trainings', idx, 'end_date', e.target.value)} className={inputClass} />
            </div>
            <div className="col-span-2">
              <label className={labelClass}>설명</label>
              <input value={tr.description} onChange={(e) => updateListItem('trainings', idx, 'description', e.target.value)} className={inputClass} />
            </div>
          </div>
        </div>
      ))}
      <button onClick={() => addListItem('trainings', emptyTraining)} className="w-full py-3 border-2 border-dashed border-gray-300 text-sm text-gray-500 font-medium rounded-xl hover:border-primary hover:text-primary transition">+ 교육 이수 추가</button>
    </div>
  );

  // Profile completion calculation
  const getProfileCompletion = () => {
    if (!profile) return { percent: 0, missing: [] };
    const checks = [
      { key: '이름', done: !!profile.name?.trim() },
      { key: '이메일', done: !!profile.email?.trim() },
      { key: '전화번호', done: !!profile.phone?.trim() },
      { key: '자기소개', done: !!profile.summary?.trim() },
      { key: '학력', done: (profile.education?.length || 0) > 0 },
      { key: '경력', done: (profile.work_experience?.length || 0) > 0 },
      { key: '자격증', done: (profile.certificates?.length || 0) > 0 },
      { key: 'GitHub/링크', done: !!(profile.github?.trim() || profile.linkedin?.trim() || profile.blog?.trim()) },
    ];
    const done = checks.filter((c) => c.done).length;
    const missing = checks.filter((c) => !c.done).map((c) => c.key);
    return { percent: Math.round((done / checks.length) * 100), missing };
  };

  const ProfileCompletionBar = () => {
    const { percent, missing } = getProfileCompletion();
    if (percent >= 100) return null;
    const barColor = percent >= 75 ? 'bg-green-500' : percent >= 50 ? 'bg-amber-500' : 'bg-red-400';
    return (
      <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-gray-700">프로필 완성도</span>
          <span className={`text-xs font-bold ${percent >= 75 ? 'text-green-600' : percent >= 50 ? 'text-amber-600' : 'text-red-500'}`}>{percent}%</span>
        </div>
        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mb-2">
          <div className={`h-full ${barColor} rounded-full transition-all duration-500`} style={{ width: `${percent}%` }} />
        </div>
        {missing.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {missing.map((m) => (
              <span key={m} className="text-[10px] px-2 py-0.5 bg-white border border-gray-200 rounded-full text-gray-500">{m}</span>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderContent = () => {
    if (activeTab === 'applications') return ViewApplications();

    if (activeTab === 'profile') {
      if (editing) {
        return (
          <div className="flex flex-col gap-8">
            {ProfileCompletionBar()}
            {/* 기본 정보 */}
            <div>
              <h3 className="text-[15px] font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-1.5 h-5 bg-primary rounded-full" />기본 정보
              </h3>
              {EditBasic()}
            </div>
            {/* 학력 */}
            <div>
              <h3 className="text-[15px] font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-1.5 h-5 bg-primary rounded-full" />학력
              </h3>
              {EditEducation()}
            </div>
            {/* 경력 */}
            <div>
              <h3 className="text-[15px] font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-1.5 h-5 bg-primary rounded-full" />경력
              </h3>
              {EditWork()}
            </div>
            {/* 자격증 */}
            <div>
              <h3 className="text-[15px] font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-1.5 h-5 bg-primary rounded-full" />자격증
              </h3>
              {EditCert()}
            </div>
            {/* 수상 */}
            <div>
              <h3 className="text-[15px] font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-1.5 h-5 bg-primary rounded-full" />수상
              </h3>
              {EditAward()}
            </div>
            {/* 교육 이수 */}
            <div>
              <h3 className="text-[15px] font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-1.5 h-5 bg-primary rounded-full" />교육 이수
              </h3>
              {EditTraining()}
            </div>
            {/* 저장/취소 버튼 */}
            <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
              <button
                onClick={cancelEdit}
                className="px-5 py-2.5 text-sm font-semibold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition"
              >
                취소
              </button>
              <button
                onClick={saveProfile}
                disabled={saving}
                className="px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-dark transition disabled:opacity-50"
              >
                {saving ? '저장 중...' : '저장'}
              </button>
            </div>
          </div>
        );
      }
      return (
        <div className="flex flex-col gap-8">
          {ProfileCompletionBar()}
          {/* 기본 정보 */}
          <div>
            <h3 className="text-[15px] font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-1.5 h-5 bg-primary rounded-full" />기본 정보
            </h3>
            {ViewBasic()}
          </div>
          {/* 학력 */}
          <div>
            <h3 className="text-[15px] font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-1.5 h-5 bg-primary rounded-full" />학력
            </h3>
            {ViewEducation()}
          </div>
          {/* 경력 */}
          <div>
            <h3 className="text-[15px] font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-1.5 h-5 bg-primary rounded-full" />경력
            </h3>
            {ViewWork()}
          </div>
          {/* 자격증 */}
          <div>
            <h3 className="text-[15px] font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-1.5 h-5 bg-primary rounded-full" />자격증
            </h3>
            {ViewCert()}
          </div>
          {/* 수상 */}
          <div>
            <h3 className="text-[15px] font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-1.5 h-5 bg-primary rounded-full" />수상
            </h3>
            {ViewAward()}
          </div>
          {/* 교육 이수 */}
          <div>
            <h3 className="text-[15px] font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-1.5 h-5 bg-primary rounded-full" />교육 이수
            </h3>
            {ViewTraining()}
          </div>
        </div>
      );
    }

    if (activeTab === 'resume') {
      const fmtDate = (iso) => {
        if (!iso) return '-';
        const d = new Date(iso);
        return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
      };

      const sortedResumes = [...resumes].sort((a, b) => {
        const aP = primaryResumeIds.includes(a.id) ? -1 : 0;
        const bP = primaryResumeIds.includes(b.id) ? -1 : 0;
        return aP - bP;
      });

      const sortedCareerDescs = [...careerDescs].sort((a, b) => {
        const aP = primaryCareerDescIds.includes(a.id) ? -1 : 0;
        const bP = primaryCareerDescIds.includes(b.id) ? -1 : 0;
        return aP - bP;
      });

      return (
        <div className="flex flex-col gap-8">
          {/* Section 1: 이력서 기록 */}
          <div>
            <h3 className="text-[15px] font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-1.5 h-5 bg-primary rounded-full" />
              이력서 기록
              <span className="text-xs font-normal text-gray-400">({resumes.length})</span>
            </h3>
            {resumes.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-gray-400">생성된 이력서가 없습니다.</p>
                <p className="text-xs text-gray-300 mt-1">이력서 페이지에서 AI 이력서를 생성해보세요.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {sortedResumes.map((record) => {
                  const isPrimary = primaryResumeIds.includes(record.id);
                  const isExpanded = expandedResume === record.id;
                  return (
                    <div key={record.id} className={`rounded-xl border transition ${isPrimary ? 'border-primary/30 bg-primary-light/20' : 'border-gray-200 hover:border-gray-300'}`}>
                      <div className="flex items-center gap-3 px-4 py-3.5 cursor-pointer"
                        onClick={() => setExpandedResume(isExpanded ? null : record.id)}>
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${isPrimary ? 'bg-gradient-to-br from-[#3182f6] to-[#6366f1]' : 'bg-gray-100'}`}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={isPrimary ? 'white' : '#6b7684'} strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            {renamingId === record.id ? (
                              <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                <input value={renameValue} onChange={(e) => setRenameValue(e.target.value)}
                                  onKeyDown={(e) => { if (e.key === 'Enter') handleRenameResume(record.id); if (e.key === 'Escape') setRenamingId(null); }}
                                  className="px-2 py-0.5 text-sm border border-primary rounded-lg focus:outline-none w-40" autoFocus />
                                <button onClick={() => handleRenameResume(record.id)} className="text-xs text-primary font-semibold">확인</button>
                                <button onClick={() => setRenamingId(null)} className="text-xs text-gray-400">취소</button>
                              </div>
                            ) : (
                              <p className="text-sm font-semibold text-gray-900 truncate cursor-pointer hover:text-primary transition"
                                onDoubleClick={(e) => { e.stopPropagation(); startRename(record.id, record.name || record.target_role); }}
                                title="더블클릭하여 이름 변경">
                                {record.name || record.target_role}
                              </p>
                            )}
                            {isPrimary && <span className="text-[10px] font-bold text-primary bg-primary-light px-2 py-0.5 rounded-full">대표</span>}
                          </div>
                          <p className="text-xs text-gray-400">{fmtDate(record.created_at)} · 포트폴리오 {record.selected_portfolio_ids?.length || 0}개</p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button onClick={(e) => { e.stopPropagation(); togglePrimaryResume(record.id); }}
                            className="p-1.5 rounded-lg hover:bg-gray-100 transition" title={isPrimary ? '대표 해제' : '대표 이력서로 설정'}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill={isPrimary ? '#3182f6' : 'none'} stroke={isPrimary ? '#3182f6' : '#b0b8c1'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                            </svg>
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); handleResumeDownload(record); }} disabled={resumeDownloading}
                            className="p-1.5 rounded-lg hover:bg-gray-100 transition disabled:opacity-50" title="다운로드">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7684" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); deleteResume(record.id); }}
                            className="px-2 py-1 text-xs text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition">삭제</button>
                        </div>
                      </div>
                      {isExpanded && (
                        <div className="px-4 pb-4 border-t border-gray-100 animate-fade-in">
                          {record.summary && (
                            <div className="mt-3 gradient-hero-soft rounded-xl p-4">
                              <p className="text-xs font-bold text-primary mb-1">요약</p>
                              <p className="text-sm text-gray-700 leading-relaxed">{record.summary}</p>
                            </div>
                          )}
                          {record.entries?.map((entry, i) => (
                            <div key={i} className="mt-3 border border-gray-100 rounded-xl p-3.5">
                              <p className="text-sm font-semibold text-gray-900 mb-1">{entry.tailored_description}</p>
                              {entry.tailored_achievements?.map((a, j) => (
                                <p key={j} className="text-xs text-gray-500 flex items-start gap-1.5 mt-1">
                                  <span className="text-primary mt-0.5">•</span>{a}
                                </p>
                              ))}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section 2: 경력기술서 기록 */}
          <div>
            <h3 className="text-[15px] font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-1.5 h-5 bg-[#e0437b] rounded-full" />
              경력기술서 기록
              <span className="text-xs font-normal text-gray-400">({careerDescs.length})</span>
            </h3>
            {careerDescs.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-gray-400">생성된 경력기술서가 없습니다.</p>
                <p className="text-xs text-gray-300 mt-1">경력기술서 페이지에서 AI 경력기술서를 생성해보세요.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {sortedCareerDescs.map((record) => {
                  const isPrimary = primaryCareerDescIds.includes(record.id);
                  const isExpanded = expandedCareerDesc === record.id;
                  return (
                    <div key={record.id} className={`rounded-xl border transition ${isPrimary ? 'border-[#e0437b]/30 bg-pink-50/20' : 'border-gray-200 hover:border-gray-300'}`}>
                      <div className="flex items-center gap-3 px-4 py-3.5 cursor-pointer"
                        onClick={() => setExpandedCareerDesc(isExpanded ? null : record.id)}>
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${isPrimary ? 'bg-gradient-to-br from-[#e0437b] to-[#f472b6]' : 'bg-gradient-to-br from-[#e0437b] to-[#f472b6]'}`}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><rect x="8" y="2" width="8" height="4" rx="1" /></svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            {renamingId === record.id ? (
                              <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                <input value={renameValue} onChange={(e) => setRenameValue(e.target.value)}
                                  onKeyDown={(e) => { if (e.key === 'Enter') handleRenameCareerDesc(record.id); if (e.key === 'Escape') setRenamingId(null); }}
                                  className="px-2 py-0.5 text-sm border border-primary rounded-lg focus:outline-none w-40" autoFocus />
                                <button onClick={() => handleRenameCareerDesc(record.id)} className="text-xs text-primary font-semibold">확인</button>
                                <button onClick={() => setRenamingId(null)} className="text-xs text-gray-400">취소</button>
                              </div>
                            ) : (
                              <p className="text-sm font-semibold text-gray-900 truncate cursor-pointer hover:text-primary transition"
                                onDoubleClick={(e) => { e.stopPropagation(); startRename(record.id, record.name || record.target_role); }}
                                title="더블클릭하여 이름 변경">
                                {record.name || record.target_role}
                              </p>
                            )}
                            {isPrimary && <span className="text-[10px] font-bold text-[#e0437b] bg-pink-50 px-2 py-0.5 rounded-full">대표</span>}
                          </div>
                          <p className="text-xs text-gray-400">{fmtDate(record.created_at)} · {record.entries?.length || 0}개 경력</p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button onClick={(e) => { e.stopPropagation(); togglePrimaryCareerDesc(record.id); }}
                            className="p-1.5 rounded-lg hover:bg-gray-100 transition" title={isPrimary ? '대표 해제' : '대표 경력기술서로 설정'}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill={isPrimary ? '#e0437b' : 'none'} stroke={isPrimary ? '#e0437b' : '#b0b8c1'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                            </svg>
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); handleCareerDescDownload(record); }} disabled={careerDescDownloading}
                            className="p-1.5 rounded-lg hover:bg-gray-100 transition disabled:opacity-50" title="다운로드">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7684" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); deleteCareerDesc(record.id); }}
                            className="px-2 py-1 text-xs text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition">삭제</button>
                        </div>
                      </div>
                      {isExpanded && (
                        <div className="px-4 pb-4 border-t border-gray-100 animate-fade-in">
                          {record.summary && (
                            <div className="mt-3 bg-pink-50/50 rounded-xl p-4">
                              <p className="text-xs font-bold text-[#e0437b] mb-1">경력 요약</p>
                              <p className="text-sm text-gray-700 leading-relaxed">{record.summary}</p>
                            </div>
                          )}
                          {record.entries?.map((entry, i) => (
                            <div key={i} className="mt-3 border border-gray-100 rounded-xl p-4">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-sm font-bold text-gray-900">{entry.company}</span>
                                <span className="text-xs text-gray-400">· {entry.position}</span>
                                <span className="text-xs text-gray-300 ml-auto">{entry.period}</span>
                              </div>
                              {entry.description && <p className="text-[13px] text-gray-600 mb-2 leading-relaxed">{entry.description}</p>}
                              {entry.key_achievements?.length > 0 && (
                                <div className="mb-2">
                                  <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">핵심 성과</p>
                                  {entry.key_achievements.map((a, j) => (
                                    <p key={j} className="text-xs text-gray-500 flex items-start gap-1.5 mt-0.5">
                                      <span className="text-[#e0437b] mt-0.5">•</span>{a}
                                    </p>
                                  ))}
                                </div>
                              )}
                              {entry.relevant_projects?.length > 0 && (
                                <div>
                                  <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">관련 프로젝트</p>
                                  {entry.relevant_projects.map((p, j) => (
                                    <p key={j} className="text-xs text-gray-500 flex items-start gap-1.5 mt-0.5">
                                      <span className="text-[#e0437b] mt-0.5">▸</span>{p}
                                    </p>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
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
    }

    if (activeTab === 'coverletter') {
      const formatDate = (iso) => {
        const d = new Date(iso);
        return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
      };

      // Group cover letters by company
      const grouped = {};
      coverLetters.forEach((record) => {
        const company = record.company || '기타';
        if (!grouped[company]) grouped[company] = [];
        grouped[company].push(record);
      });
      const companies = Object.keys(grouped);

      return (
        <div>
          {coverLetters.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-10">저장된 자소서가 없습니다.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {companies.map((company) => {
                const records = grouped[company];
                const isOpen = openCompany === company;
                return (
                  <div key={company} className={`rounded-xl border transition ${isOpen ? 'border-primary/30 shadow-[0_2px_12px_rgba(49,130,246,0.08)]' : 'border-gray-200 hover:border-gray-300'}`}>
                    {/* Folder header */}
                    <div
                      className="flex items-center gap-3 px-5 py-4 cursor-pointer"
                      onClick={() => setOpenCompany(isOpen ? null : company)}
                    >
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#7b61ff] to-[#a78bfa] flex items-center justify-center shrink-0">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          {isOpen ? (
                            <><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /><line x1="9" y1="14" x2="15" y2="14" /></>
                          ) : (
                            <><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /></>
                          )}
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-900">{company}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{records.length}개 자소서</p>
                      </div>
                      <svg
                        width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                        className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                      >
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </div>

                    {/* Folder contents */}
                    {isOpen && (
                      <div className="px-5 pb-4 border-t border-gray-100 animate-fade-in">
                        {records.map((record) => (
                          <div key={record.id} className="mt-3">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8b95a1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
                                </svg>
                                <span className="text-xs text-gray-500">{formatDate(record.created_at)} · {record.answers?.length || 0}개 문항</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={(e) => { e.stopPropagation(); startEditCL(record); }}
                                  className="px-2 py-1 text-xs text-gray-500 hover:text-primary hover:bg-primary-light rounded-lg transition"
                                >
                                  수정
                                </button>
                                <button
                                  onClick={() => deleteCoverLetter(record.id)}
                                  className="px-2 py-1 text-xs text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                                >
                                  삭제
                                </button>
                              </div>
                            </div>
                            <div
                              className={`rounded-xl border cursor-pointer transition ${expandedCL === record.id ? 'border-primary/20 bg-primary-light/30' : 'border-gray-100 hover:bg-gray-50'}`}
                              onClick={() => setExpandedCL(expandedCL === record.id ? null : record.id)}
                            >
                              {expandedCL === record.id ? (
                                editingCLId === record.id ? (
                                  <div className="p-4" onClick={(e) => e.stopPropagation()}>
                                    {editingCLAnswers.map((qa, i) => (
                                      <div key={i} className={i > 0 ? 'mt-4 pt-4 border-t border-gray-100' : ''}>
                                        <p className="text-xs font-bold text-primary mb-2">Q{i + 1}. {qa.question}</p>
                                        <textarea
                                          value={qa.answer}
                                          onChange={(e) => updateCLAnswer(i, e.target.value)}
                                          rows={5}
                                          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-y transition leading-relaxed"
                                        />
                                        <p className="text-xs text-gray-400 mt-1 text-right">{qa.answer?.length || 0}자</p>
                                      </div>
                                    ))}
                                    <div className="flex justify-end gap-2 mt-4">
                                      <button onClick={cancelEditCL} className="px-4 py-2 text-sm font-semibold text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition">취소</button>
                                      <button onClick={() => saveCLEdit(record.id)} disabled={clSaving}
                                        className="px-4 py-2 text-sm font-semibold text-white bg-primary rounded-lg hover:bg-primary-dark transition disabled:opacity-50">
                                        {clSaving ? '저장 중...' : '저장'}
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                <div className="p-4">
                                  {record.answers?.map((qa, i) => (
                                    <div key={i} className={i > 0 ? 'mt-4 pt-4 border-t border-gray-100' : ''}>
                                      <p className="text-xs font-bold text-primary mb-2">Q{i + 1}. {qa.question}</p>
                                      <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{qa.answer}</p>
                                    </div>
                                  ))}
                                </div>
                                )
                              ) : (
                                <div className="px-4 py-3">
                                  <p className="text-xs text-gray-500 line-clamp-2">{record.answers?.[0]?.question}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      );
    }

    if (activeTab === 'account') {
      const saveDisplayName = async () => {
        if (!displayName.trim()) { toast.error('닉네임을 입력해주세요.'); return; }
        setAccountSaving(true);
        try {
          await api.put('/auth/display-name', { display_name: displayName.trim() });
          updateUser({ display_name: displayName.trim() });
          toast.success('닉네임이 변경되었습니다.');
        } catch (err) {
          toast.error(err.response?.data?.detail || '닉네임 변경에 실패했습니다.');
        } finally { setAccountSaving(false); }
      };
      const changePassword = async () => {
        if (!currentPassword) { toast.error('현재 비밀번호를 입력해주세요.'); return; }
        if (newPassword.length < 8 || !/[a-zA-Z]/.test(newPassword) || !/\d/.test(newPassword)) { toast.error('비밀번호는 영문+숫자 포함 8자 이상이어야 합니다.'); return; }
        if (newPassword !== confirmPassword) { toast.error('새 비밀번호가 일치하지 않습니다.'); return; }
        setAccountSaving(true);
        try {
          await api.put('/auth/change-password', { current_password: currentPassword, new_password: newPassword });
          toast.success('비밀번호가 변경되었습니다.');
          setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
        } catch (err) {
          toast.error(err.response?.data?.detail || '비밀번호 변경에 실패했습니다.');
        } finally { setAccountSaving(false); }
      };
      return (
        <div className="flex flex-col gap-8 max-w-2xl">
          {/* 아이디 (읽기 전용) */}
          <div>
            <label className={labelClass}>아이디</label>
            <div className="px-4 py-2.5 bg-gray-100 rounded-xl text-sm text-gray-500 font-mono">{user?.username}</div>
            <p className="text-xs text-gray-400 mt-1">아이디는 변경할 수 없습니다.</p>
          </div>
          {/* 닉네임 */}
          <div>
            <label className={labelClass}>닉네임</label>
            <div className="flex gap-2">
              <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className={`${inputClass} flex-1`} placeholder="닉네임을 입력하세요" />
              <button onClick={saveDisplayName} disabled={accountSaving} className="px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-dark transition disabled:opacity-50 shrink-0">
                {accountSaving ? '저장 중...' : '저장'}
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-1">헤더에 표시되는 이름입니다.</p>
          </div>
          {/* 비밀번호 변경 */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-[15px] font-bold text-gray-800 mb-4">비밀번호 변경</h3>
            <div className="flex flex-col gap-4">
              <div>
                <label className={labelClass}>현재 비밀번호</label>
                <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className={inputClass} placeholder="현재 비밀번호 입력" />
              </div>
              <div>
                <label className={labelClass}>새 비밀번호</label>
                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className={inputClass} placeholder="새 비밀번호 입력 (4자 이상)" />
              </div>
              <div>
                <label className={labelClass}>새 비밀번호 확인</label>
                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={inputClass} placeholder="새 비밀번호 다시 입력" />
              </div>
              <button onClick={changePassword} disabled={accountSaving} className="w-fit px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-dark transition disabled:opacity-50">
                {accountSaving ? '변경 중...' : '비밀번호 변경'}
              </button>
            </div>
          </div>
        </div>
      );
    }

    if (activeTab === 'apikey') {
      return (
        <div className="flex flex-col gap-5 max-w-2xl">
          <p className="text-sm text-gray-600 leading-relaxed">
            OpenAI API 키를 입력하면 AI 기능(포트폴리오 파싱, 이력서 생성, 자소서 작성, 면접 연습)을 사용할 수 있습니다.
          </p>
          <div className="bg-gray-50 rounded-xl p-5">
            <h3 className="text-[13px] font-bold text-gray-800 mb-3">API 키 발급 방법</h3>
            <ol className="text-sm text-gray-600 space-y-2.5 list-decimal list-inside">
              <li><a href="https://platform.openai.com/signup" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">platform.openai.com</a>에 접속하여 회원가입 또는 로그인합니다.</li>
              <li>좌측 메뉴에서 <span className="font-semibold text-gray-800">API keys</span>를 클릭합니다.</li>
              <li><span className="font-semibold text-gray-800">+ Create new secret key</span> 버튼을 클릭합니다.</li>
              <li>키 이름을 입력하고 <span className="font-semibold text-gray-800">Create secret key</span>를 클릭합니다.</li>
              <li>생성된 키(<span className="font-mono text-xs bg-gray-200 px-1.5 py-0.5 rounded">sk-...</span>)를 복사하여 아래에 붙여넣기합니다.</li>
            </ol>
            <div className="mt-4 p-3.5 bg-[#fff8e6] border border-[#f5d980] rounded-xl">
              <p className="text-xs text-[#8a6d13]">
                <span className="font-bold">참고:</span> API 사용에는 크레딧이 필요합니다.
                <a href="https://platform.openai.com/settings/organization/billing/overview" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline ml-1">Billing 페이지</a>에서 크레딧을 충전해주세요. 최소 $5부터 충전 가능합니다.
              </p>
            </div>
          </div>
          <div>
            <label className={labelClass}>API Key</label>
            <input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} className={`${inputClass} font-mono`} placeholder="sk-..." />
          </div>
          <button onClick={saveApiKey} className="w-fit px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-dark transition">저장</button>
        </div>
      );
    }

  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">마이페이지</h1>
        {activeTab === 'profile' && !editing && (
          <button
            onClick={() => setEditing(true)}
            className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition"
          >
            수정
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-gray-100 p-1 rounded-xl overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setEditing(false); }}
            className={`px-4 py-2.5 text-[13px] font-semibold rounded-lg whitespace-nowrap transition ${
              activeTab === tab.id
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
            {tab.id === 'applications' && applications.length > 0 && (
              <span className="ml-1.5 text-[11px] font-bold text-primary">{applications.length}</span>
            )}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-5 lg:p-6">
        {renderContent()}
      </div>

      <ConfirmModal open={!!appDeleteTarget} title="지원 기록 삭제" message="이 지원 기록을 삭제하시겠습니까?"
        onConfirm={deleteApp} onCancel={() => setAppDeleteTarget(null)} />
      <ApiKeyModal open={showApiKeyModal} onClose={() => setShowApiKeyModal(false)} onSave={() => setShowApiKeyModal(false)} />
      <ResumeUploadModal open={showResumeUpload} onClose={() => setShowResumeUpload(false)} onResult={handleResumeResult} />
    </div>
  );
}
