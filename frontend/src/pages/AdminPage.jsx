import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import api from '../api/client';

const PLAN_OPTIONS = [
  { value: 'free', label: 'Free' },
  { value: 'pro', label: 'Pro' },
  { value: 'max', label: 'Max' },
];

const ROLE_OPTIONS = [
  { value: 'user', label: '일반 사용자' },
  { value: 'admin', label: '관리자' },
];

export default function AdminPage() {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingUser, setUpdatingUser] = useState(null);

  // Redirect non-admin users
  useEffect(() => {
    if (user && user.role !== 'admin') {
      navigate('/');
    }
  }, [user, navigate]);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/admin/users');
      setUsers(res.data);
    } catch (err) {
      const msg = err.response?.data?.detail || '사용자 목록을 불러오는데 실패했습니다.';
      setError(typeof msg === 'string' ? msg : '사용자 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchUsers();
    }
  }, [user, fetchUsers]);

  const handlePlanChange = async (username, newPlan) => {
    setUpdatingUser(username);
    try {
      await api.put(`/admin/users/${username}/plan`, { plan: newPlan });
      setUsers((prev) =>
        prev.map((u) => (u.username === username ? { ...u, plan: newPlan } : u))
      );
      toast.success(`${username}의 플랜이 ${newPlan.toUpperCase()}로 변경되었습니다.`);
    } catch (err) {
      const msg = err.response?.data?.detail || '플랜 변경에 실패했습니다.';
      toast.error(typeof msg === 'string' ? msg : '플랜 변경에 실패했습니다.');
    } finally {
      setUpdatingUser(null);
    }
  };

  const handleRoleChange = async (username, newRole) => {
    if (username === user?.username) {
      toast.error('자신의 권한은 변경할 수 없습니다.');
      return;
    }
    setUpdatingUser(username);
    try {
      await api.put(`/admin/users/${username}/role`, { role: newRole });
      setUsers((prev) =>
        prev.map((u) => (u.username === username ? { ...u, role: newRole } : u))
      );
      toast.success(`${username}의 권한이 변경되었습니다.`);
    } catch (err) {
      const msg = err.response?.data?.detail || '권한 변경에 실패했습니다.';
      toast.error(typeof msg === 'string' ? msg : '권한 변경에 실패했습니다.');
    } finally {
      setUpdatingUser(null);
    }
  };

  // Don't render until we know the user
  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">사용자 관리</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            전체 사용자 목록을 조회하고 플랜 및 권한을 관리합니다.
          </p>
        </div>
        <button
          onClick={fetchUsers}
          disabled={loading}
          className="px-4 py-2 text-sm font-semibold text-[#3182f6] bg-[#e8f3ff] hover:bg-[#d0e7ff] rounded-xl transition disabled:opacity-50 flex items-center gap-1.5"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 4 23 10 17 10" />
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
          </svg>
          새로고침
        </button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-3 border-gray-200 border-t-[#3182f6] rounded-full animate-spin" />
            <span className="text-sm text-gray-500">사용자 목록을 불러오는 중...</span>
          </div>
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div className="bg-[#ffe8f0] border border-[#f5b8cc] rounded-2xl p-6 text-center">
          <p className="text-sm text-[#e0437b] font-medium mb-3">{error}</p>
          <button
            onClick={fetchUsers}
            className="px-4 py-2 text-sm font-semibold text-white bg-[#e0437b] hover:bg-[#c93568] rounded-xl transition"
          >
            다시 시도
          </button>
        </div>
      )}

      {/* Users Table */}
      {!loading && !error && (
        <>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            총 <span className="font-semibold text-gray-900 dark:text-white">{users.length}</span>명의 사용자
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                    <th className="text-left px-5 py-3.5 font-semibold text-gray-500 dark:text-gray-400 whitespace-nowrap">아이디</th>
                    <th className="text-left px-5 py-3.5 font-semibold text-gray-500 dark:text-gray-400 whitespace-nowrap">이름</th>
                    <th className="text-left px-5 py-3.5 font-semibold text-gray-500 dark:text-gray-400 whitespace-nowrap">이메일</th>
                    <th className="text-center px-5 py-3.5 font-semibold text-gray-500 dark:text-gray-400 whitespace-nowrap">권한</th>
                    <th className="text-center px-5 py-3.5 font-semibold text-gray-500 dark:text-gray-400 whitespace-nowrap">플랜</th>
                    <th className="text-center px-5 py-3.5 font-semibold text-gray-500 dark:text-gray-400 whitespace-nowrap">사용량</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-gray-400">
                        등록된 사용자가 없습니다.
                      </td>
                    </tr>
                  ) : (
                    users.map((u) => (
                      <tr
                        key={u.username}
                        className="border-b border-gray-100 dark:border-gray-700/50 last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition"
                      >
                        {/* Username */}
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-[#e8f3ff] flex items-center justify-center shrink-0">
                              <span className="text-[#3182f6] text-xs font-bold">
                                {(u.display_name || u.username)?.charAt(0)?.toUpperCase()}
                              </span>
                            </div>
                            <span className="font-medium text-gray-900 dark:text-white whitespace-nowrap">{u.username}</span>
                          </div>
                        </td>

                        {/* Display Name */}
                        <td className="px-5 py-3.5 text-gray-700 dark:text-gray-300 whitespace-nowrap">
                          {u.display_name || '-'}
                        </td>

                        {/* Email */}
                        <td className="px-5 py-3.5 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                          {u.email || '-'}
                        </td>

                        {/* Role */}
                        <td className="px-5 py-3.5 text-center">
                          <select
                            value={u.role || 'user'}
                            onChange={(e) => handleRoleChange(u.username, e.target.value)}
                            disabled={updatingUser === u.username || u.username === user?.username}
                            className={`text-xs font-semibold px-3 py-1.5 rounded-lg border-0 cursor-pointer transition disabled:opacity-50 disabled:cursor-not-allowed ${
                              u.role === 'admin'
                                ? 'bg-[#ffe8f0] text-[#e0437b]'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                            }`}
                          >
                            {ROLE_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                        </td>

                        {/* Plan */}
                        <td className="px-5 py-3.5 text-center">
                          <select
                            value={u.plan || 'free'}
                            onChange={(e) => handlePlanChange(u.username, e.target.value)}
                            disabled={updatingUser === u.username}
                            className={`text-xs font-semibold px-3 py-1.5 rounded-lg border-0 cursor-pointer transition disabled:opacity-50 disabled:cursor-not-allowed ${
                              u.plan === 'max'
                                ? 'bg-[#f3e8ff] text-[#9333ea]'
                                : u.plan === 'pro'
                                ? 'bg-[#e8f3ff] text-[#3182f6]'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                            }`}
                          >
                            {PLAN_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                        </td>

                        {/* Usage Summary */}
                        <td className="px-5 py-3.5 text-center">
                          {u.usage ? (
                            <UsageSummary usage={u.usage} />
                          ) : (
                            <span className="text-gray-400 text-xs">-</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function UsageSummary({ usage }) {
  const entries = Object.entries(usage).filter(([, v]) => typeof v === 'number' && v > 0);

  if (entries.length === 0) {
    return <span className="text-gray-400 text-xs">사용 없음</span>;
  }

  const FEATURE_SHORT = {
    resume: '이력서',
    cover_letter: '자소서',
    career_description: '경력',
    interview_question: '면접Q',
    interview_evaluation: '면접평가',
    portfolio_parsing: '포트폴리오',
  };

  const total = entries.reduce((sum, [, v]) => sum + v, 0);

  return (
    <div className="flex items-center justify-center gap-1 flex-wrap">
      <span
        className="inline-flex items-center px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded text-[11px] font-medium"
        title={entries.map(([k, v]) => `${FEATURE_SHORT[k] || k}: ${v}`).join(', ')}
      >
        총 {total}회
      </span>
    </div>
  );
}
