import { useState, useRef } from 'react';
import api from '../api/client';
import { useAuth } from '../contexts/AuthContext';

export default function ResumeUploadModal({ open, onClose, onResult }) {
  const { user } = useAuth();
  const [file, setFile] = useState(null);
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);

  if (!open) return null;

  const accept = '.pdf,.docx,.txt';
  const allowedExts = ['pdf', 'docx', 'txt'];

  const validateFile = (f) => {
    const ext = f.name.rsplit ? '' : f.name.split('.').pop()?.toLowerCase();
    if (!allowedExts.includes(ext)) {
      setError('PDF, DOCX, TXT 파일만 지원합니다.');
      return false;
    }
    if (f.size > 10 * 1024 * 1024) {
      setError('파일 크기는 10MB 이하만 가능합니다.');
      return false;
    }
    setError('');
    return true;
  };

  const handleFileSelect = (e) => {
    const f = e.target.files?.[0];
    if (f && validateFile(f)) setFile(f);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f && validateFile(f)) setFile(f);
  };

  const handleParse = async () => {
    if (!file || !user?.username) return;
    setParsing(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post(`/profile/${user.username}/parse-resume`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 180000,
      });
      onResult?.(res.data);
      onClose?.();
      setFile(null);
    } catch (err) {
      setError(err.response?.data?.detail || 'AI 파싱 실패. API 키를 확인해주세요.');
    } finally {
      setParsing(false);
    }
  };

  const handleClose = () => {
    if (parsing) return;
    setFile(null);
    setError('');
    onClose?.();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={handleClose} />
      <div className="relative bg-white rounded-2xl p-6 w-full max-w-md mx-4 shadow-xl animate-fade-in">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">이력서 업로드</h3>
            <p className="text-sm text-gray-500">이력서를 분석하여 자동으로 정보를 채웁니다</p>
          </div>
        </div>

        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition mb-4 ${
            dragOver
              ? 'border-primary bg-primary/5'
              : file
              ? 'border-green-300 bg-green-50'
              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            onChange={handleFileSelect}
            className="hidden"
          />
          {file ? (
            <div>
              <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-green-100 flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-gray-900">{file.name}</p>
              <p className="text-xs text-gray-500 mt-1">{(file.size / 1024).toFixed(1)} KB</p>
              <p className="text-xs text-primary mt-2 hover:underline">다른 파일 선택</p>
            </div>
          ) : (
            <div>
              <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-gray-100 flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              </div>
              <p className="text-sm text-gray-600">파일을 드래그하거나 클릭하여 선택</p>
              <p className="text-xs text-gray-400 mt-1">PDF, DOCX, TXT (최대 10MB)</p>
            </div>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 mb-4">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {parsing && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-blue-700">AI가 이력서를 분석하고 있습니다...</p>
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={handleClose}
            disabled={parsing}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition disabled:opacity-50"
          >
            취소
          </button>
          <button
            onClick={handleParse}
            disabled={!file || parsing}
            className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-primary hover:bg-primary-dark rounded-xl transition disabled:opacity-50"
          >
            {parsing ? '분석 중...' : 'AI 분석 시작'}
          </button>
        </div>
      </div>
    </div>
  );
}
