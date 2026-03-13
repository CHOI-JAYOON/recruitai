import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/* ── 기능별 목업 프리뷰 컴포넌트 ── */
function PortfolioMockup() {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/80 dark:border-gray-700 overflow-hidden shadow-lg shadow-gray-200/50 dark:shadow-none">
      <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
        <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
        <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
        <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
        <span className="ml-2 text-[10px] text-gray-400 font-medium">포트폴리오 관리</span>
      </div>
      <div className="p-4 space-y-2.5">
        <div className="flex items-center gap-2 p-2.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800/30">
          <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-800/40 flex items-center justify-center text-[11px]">📄</div>
          <div className="flex-1 min-w-0">
            <div className="text-[11px] font-semibold text-gray-800 dark:text-gray-200">프론트엔드 포트폴리오.pdf</div>
            <div className="text-[9px] text-gray-400">AI 파싱 완료 · 3개 프로젝트</div>
          </div>
          <div className="text-[9px] text-green-600 font-bold bg-green-50 dark:bg-green-900/30 px-1.5 py-0.5 rounded">완료</div>
        </div>
        <div className="flex items-center gap-2 p-2.5 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700">
          <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-[11px]">📁</div>
          <div className="flex-1 min-w-0">
            <div className="text-[11px] font-semibold text-gray-800 dark:text-gray-200">백엔드 프로젝트 정리.pdf</div>
            <div className="text-[9px] text-gray-400">파싱 대기 중</div>
          </div>
        </div>
        <div className="flex items-center justify-center gap-1.5 p-2 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          <span className="text-[10px] text-gray-400">파일 업로드</span>
        </div>
      </div>
    </div>
  );
}

function ResumeMockup() {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/80 dark:border-gray-700 overflow-hidden shadow-lg shadow-gray-200/50 dark:shadow-none">
      <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
        <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
        <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
        <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
        <span className="ml-2 text-[10px] text-gray-400 font-medium">이력서 생성</span>
      </div>
      <div className="p-4 space-y-2.5">
        <div className="space-y-1.5">
          <div className="text-[10px] font-semibold text-gray-500 dark:text-gray-400">지원 직무</div>
          <div className="px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-lg text-[11px] text-gray-700 dark:text-gray-300 border border-gray-100 dark:border-gray-700">프론트엔드 개발자</div>
        </div>
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800/30">
          <div className="flex items-center gap-1.5 mb-2">
            <div className="w-4 h-4 rounded bg-blue-500 flex items-center justify-center">
              <svg width="8" height="8" viewBox="0 0 24 24" fill="white"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
            </div>
            <span className="text-[10px] font-bold text-blue-700 dark:text-blue-300">AI 생성 결과</span>
          </div>
          <div className="space-y-1">
            <div className="h-2 bg-blue-200/60 dark:bg-blue-700/40 rounded-full w-full" />
            <div className="h-2 bg-blue-200/60 dark:bg-blue-700/40 rounded-full w-[90%]" />
            <div className="h-2 bg-blue-200/60 dark:bg-blue-700/40 rounded-full w-[75%]" />
          </div>
        </div>
        <div className="flex gap-2">
          <div className="flex-1 py-1.5 bg-blue-500 rounded-lg text-center text-[10px] text-white font-bold">복사</div>
          <div className="flex-1 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-lg text-center text-[10px] text-gray-600 dark:text-gray-300 font-bold">다시 생성</div>
        </div>
      </div>
    </div>
  );
}

function CoverLetterMockup() {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/80 dark:border-gray-700 overflow-hidden shadow-lg shadow-gray-200/50 dark:shadow-none">
      <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
        <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
        <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
        <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
        <span className="ml-2 text-[10px] text-gray-400 font-medium">자소서 작성</span>
      </div>
      <div className="p-4 space-y-2.5">
        <div className="space-y-1.5">
          <div className="text-[10px] font-semibold text-gray-500 dark:text-gray-400">자소서 항목</div>
          <div className="px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-lg text-[11px] text-gray-700 dark:text-gray-300 border border-gray-100 dark:border-gray-700">지원 동기 및 입사 후 포부</div>
        </div>
        <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-100 dark:border-green-800/30">
          <div className="text-[10px] text-green-800 dark:text-green-300 leading-relaxed">
            "저는 프론트엔드 개발 경험을 바탕으로 사용자 중심의 서비스를 만들고자 지원하게 되었습니다..."
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[9px] text-gray-400">482자 / 500자</span>
          <div className="flex gap-1.5">
            <div className="px-2.5 py-1 bg-green-500 rounded text-[9px] text-white font-bold">복사</div>
            <div className="px-2.5 py-1 bg-gray-100 dark:bg-gray-700 rounded text-[9px] text-gray-500 font-bold">수정</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InterviewMockup() {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/80 dark:border-gray-700 overflow-hidden shadow-lg shadow-gray-200/50 dark:shadow-none">
      <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
        <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
        <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
        <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
        <span className="ml-2 text-[10px] text-gray-400 font-medium">면접 연습</span>
      </div>
      <div className="p-4 space-y-2.5">
        <div className="p-2.5 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-100 dark:border-amber-800/30">
          <div className="flex items-center gap-1.5 mb-1.5">
            <div className="w-5 h-5 rounded-full bg-amber-400 flex items-center justify-center text-[8px] text-white font-bold">AI</div>
            <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300">면접관</span>
          </div>
          <div className="text-[10px] text-gray-700 dark:text-gray-300 leading-relaxed">
            "이전 프로젝트에서 팀 내 의견 충돌이 있었을 때 어떻게 해결하셨나요?"
          </div>
        </div>
        <div className="p-2.5 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-1.5 mb-1.5">
            <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-[8px] text-white font-bold">나</div>
            <span className="text-[10px] font-bold text-gray-600 dark:text-gray-300">내 답변</span>
          </div>
          <div className="text-[10px] text-gray-600 dark:text-gray-400 leading-relaxed">답변을 입력하세요...</div>
        </div>
        <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800/30 flex items-center gap-2">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/></svg>
          <span className="text-[9px] text-blue-600 dark:text-blue-400 font-semibold">음성으로 답변하기</span>
        </div>
      </div>
    </div>
  );
}

function CareerDescMockup() {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/80 dark:border-gray-700 overflow-hidden shadow-lg shadow-gray-200/50 dark:shadow-none">
      <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
        <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
        <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
        <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
        <span className="ml-2 text-[10px] text-gray-400 font-medium">경력기술서</span>
      </div>
      <div className="p-4 space-y-2.5">
        <div className="p-2.5 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-100 dark:border-purple-800/30">
          <div className="text-[10px] font-bold text-purple-700 dark:text-purple-300 mb-1.5">경력 요약</div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
              <span className="text-[10px] text-gray-700 dark:text-gray-300">ABC Corp · 프론트엔드 개발자</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-purple-300" />
              <span className="text-[10px] text-gray-700 dark:text-gray-300">DEF Inc · 풀스택 인턴</span>
            </div>
          </div>
        </div>
        <div className="p-2.5 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700">
          <div className="text-[10px] font-bold text-gray-600 dark:text-gray-300 mb-1">AI 생성 경력기술서</div>
          <div className="space-y-1">
            <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded-full w-full" />
            <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded-full w-[85%]" />
            <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded-full w-[92%]" />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── 기능 소개 데이터 (목업 + 설명) ── */
const featureShowcases = [
  {
    title: '포트폴리오 분석',
    subtitle: 'AI가 포트폴리오를 자동으로 파싱',
    description: 'PDF 파일을 업로드하면 AI가 프로젝트, 기술 스택, 경력 등 핵심 내용을 자동으로 추출하고 구조화합니다.',
    tags: ['PDF 업로드', 'AI 파싱', '프로젝트 정리'],
    icon: '📄',
    color: 'blue',
    mockup: <PortfolioMockup />,
    reverse: false,
  },
  {
    title: '맞춤 이력서 생성',
    subtitle: '직무에 최적화된 이력서를 AI가 작성',
    description: '프로필과 포트폴리오 정보를 기반으로, 지원 직무에 맞는 이력서를 자동 생성합니다. 클릭 한 번으로 완성된 이력서를 받아보세요.',
    tags: ['직무 맞춤', 'AI 자동 생성', 'DOCX 다운로드'],
    icon: '📝',
    color: 'indigo',
    mockup: <ResumeMockup />,
    reverse: true,
  },
  {
    title: '자소서 작성',
    subtitle: '지원 공고에 맞는 자기소개서 생성',
    description: '지원 공고와 본인의 경험을 분석하여, 설득력 있는 자기소개서 답변을 AI가 작성해 줍니다. 글자 수 조절도 가능합니다.',
    tags: ['공고 분석', 'RAG 기반', '글자 수 조절'],
    icon: '✍️',
    color: 'green',
    mockup: <CoverLetterMockup />,
    reverse: false,
  },
  {
    title: '면접 연습',
    subtitle: 'AI 면접관과 실전 면접 시뮬레이션',
    description: 'AI가 지원 직무에 맞는 면접 질문을 생성하고, 답변에 대해 상세한 피드백을 제공합니다. 음성 답변도 지원합니다.',
    tags: ['맞춤 질문', '실시간 피드백', '음성 지원'],
    icon: '🎤',
    color: 'amber',
    mockup: <InterviewMockup />,
    reverse: true,
  },
  {
    title: '경력기술서',
    subtitle: '경력 사항을 전문적으로 정리',
    description: '경력 정보를 입력하면 AI가 체계적이고 전문적인 경력기술서를 자동으로 생성합니다.',
    tags: ['경력 정리', 'AI 자동 생성', '전문 포맷'],
    icon: '💼',
    color: 'purple',
    mockup: <CareerDescMockup />,
    reverse: false,
  },
];

const stats = [
  { value: '5가지', label: 'AI 기능 제공' },
  { value: '30초', label: '평균 생성 시간' },
  { value: '무제한', label: 'API Key 사용 시' },
  { value: '무료', label: '기본 플랜' },
];

export default function AboutPage() {
  const { user } = useAuth() || {};

  return (
    <div className="animate-fade-in">
      {/* Hero — gradient background */}
      <section className="relative overflow-hidden pt-12 pb-20 px-4">
        {/* Background decoration */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-to-b from-blue-100/60 via-indigo-50/40 to-transparent dark:from-blue-900/20 dark:via-indigo-900/10 dark:to-transparent rounded-full blur-3xl" />
          <div className="absolute top-20 left-[10%] w-72 h-72 bg-blue-200/30 dark:bg-blue-800/10 rounded-full blur-3xl" />
          <div className="absolute top-32 right-[10%] w-64 h-64 bg-indigo-200/20 dark:bg-indigo-800/10 rounded-full blur-3xl" />
        </div>

        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm text-primary text-sm font-semibold rounded-full mb-6 border border-blue-100 dark:border-blue-800/50 shadow-sm">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
            AI 기반 취업 준비 플랫폼
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 dark:text-white mb-6 leading-[1.15] tracking-tight">
            AI로 취업 준비를
            <br />
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">완성</span>하세요
          </h1>
          <p className="text-base sm:text-lg text-gray-500 dark:text-gray-400 max-w-xl mx-auto mb-10 leading-relaxed">
            이력서, 자소서, 면접까지.
            <br className="hidden sm:block" />
            RecruitAI가 취업 준비의 모든 단계를 AI로 도와드립니다.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to={user ? '/portfolio' : '/login'}
              className="group inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-bold rounded-2xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg shadow-blue-500/25 dark:shadow-blue-900/30 hover:shadow-xl hover:shadow-blue-500/30"
            >
              {user ? 'AI 기능 사용하기' : '무료로 시작하기'}
              <svg className="group-hover:translate-x-0.5 transition-transform" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
              </svg>
            </Link>
            <div className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 text-sm font-bold rounded-2xl border border-green-200 dark:border-green-800">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
              모든 기능 무료
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="max-w-4xl mx-auto px-4 pb-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 text-center hover:shadow-md transition-shadow">
              <div className="text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-1">
                {stat.value}
              </div>
              <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Feature Showcases */}
      <section className="max-w-6xl mx-auto px-4 pb-20">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 dark:bg-blue-900/20 rounded-full mb-4">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            <span className="text-xs font-bold text-blue-600 dark:text-blue-400">FEATURES</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-gray-900 dark:text-white mb-4 tracking-tight">
            취업 준비에 필요한 모든 AI 기능
          </h2>
          <p className="text-gray-500 dark:text-gray-400 max-w-lg mx-auto text-sm sm:text-base">
            각 단계별로 최적화된 AI가 여러분의 취업 성공을 돕습니다.
          </p>
        </div>

        <div className="space-y-24">
          {featureShowcases.map((feature, idx) => (
            <div
              key={feature.title}
              className={`flex flex-col ${feature.reverse ? 'lg:flex-row-reverse' : 'lg:flex-row'} items-center gap-10 lg:gap-16`}
            >
              {/* Mockup */}
              <div className="w-full lg:w-[45%] max-w-sm mx-auto lg:mx-0 relative">
                {/* Glow behind mockup */}
                <div className={`absolute inset-0 -z-10 blur-3xl opacity-20 rounded-full
                  ${feature.color === 'blue' ? 'bg-blue-400' : ''}
                  ${feature.color === 'indigo' ? 'bg-indigo-400' : ''}
                  ${feature.color === 'green' ? 'bg-green-400' : ''}
                  ${feature.color === 'amber' ? 'bg-amber-400' : ''}
                  ${feature.color === 'purple' ? 'bg-purple-400' : ''}
                `} />
                {feature.mockup}
              </div>

              {/* Text */}
              <div className="w-full lg:w-[55%] text-center lg:text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-full mb-4">
                  <span className="text-sm">{feature.icon}</span>
                  <span className="text-[11px] font-bold text-primary">0{idx + 1}</span>
                  <span className="w-px h-3 bg-gray-300 dark:bg-gray-600" />
                  <span className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">{feature.subtitle}</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-extrabold text-gray-900 dark:text-white mb-3 tracking-tight">
                  {feature.title}
                </h3>
                <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 leading-relaxed mb-5">
                  {feature.description}
                </p>
                <div className="flex flex-wrap gap-2 justify-center lg:justify-start">
                  {feature.tags.map((tag) => (
                    <span key={tag} className="px-3 py-1.5 text-[11px] font-semibold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200/50 dark:border-gray-700/50">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="relative bg-gradient-to-b from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 border-t border-gray-200/80 dark:border-gray-700 py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-50 dark:bg-green-900/20 rounded-full mb-4">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
              <span className="text-xs font-bold text-green-600 dark:text-green-400">HOW IT WORKS</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-gray-900 dark:text-white mb-3 tracking-tight">
              간단한 3단계로 시작하세요
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base">복잡한 과정 없이, 빠르게 시작할 수 있습니다.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
            {/* Connecting line (desktop) */}
            <div className="hidden md:block absolute top-12 left-[20%] right-[20%] h-px bg-gradient-to-r from-blue-200 via-blue-300 to-blue-200 dark:from-blue-800 dark:via-blue-700 dark:to-blue-800" />

            {[
              { step: '01', title: '회원가입', desc: '간편하게 가입하고 무료로 시작하세요.', icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                </svg>
              )},
              { step: '02', title: '프로필 입력', desc: '학력, 경력, 기술 등 기본 정보를 입력하세요.', icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              )},
              { step: '03', title: 'AI 활용', desc: '이력서, 자소서, 면접 연습 등 AI 기능을 사용하세요.', icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                </svg>
              )},
            ].map((item, i) => (
              <div key={item.step} className="relative bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 text-center hover:shadow-lg transition-all group">
                <div className="relative z-10 inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white mb-5 shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
                  {item.icon}
                </div>
                <div className="text-[11px] font-bold text-primary mb-2">STEP {item.step}</div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{item.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* API Key info */}
      <section className="max-w-4xl mx-auto px-4 py-20">
        <div className="relative bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 dark:from-emerald-900/20 dark:via-green-900/15 dark:to-teal-900/10 rounded-3xl border border-green-200/80 dark:border-green-800/40 p-8 sm:p-12 text-center overflow-hidden">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-green-200/30 dark:bg-green-800/10 rounded-full blur-3xl -z-0" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-200/30 dark:bg-emerald-800/10 rounded-full blur-3xl -z-0" />

          <div className="relative z-10">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-500/20">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
              </svg>
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white mb-4 tracking-tight">
              본인 API Key로 무제한 무료 사용
            </h3>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 max-w-lg mx-auto mb-8 leading-relaxed">
              OpenAI API Key를 등록하면 모든 AI 기능을 사용량 제한 없이 무료로 이용할 수 있습니다.
              별도의 구독 없이도 원하는 만큼 사용하세요.
            </p>
            <Link
              to={user ? '/mypage?tab=subscription' : '/login'}
              className="group inline-flex items-center gap-2 px-7 py-3.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white text-sm font-bold rounded-2xl hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg shadow-green-500/20 hover:shadow-xl hover:shadow-green-500/25"
            >
              {user ? 'API Key 등록하기' : '무료로 시작하기'}
              <svg className="group-hover:translate-x-0.5 transition-transform" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative max-w-4xl mx-auto px-4 pb-20 text-center">
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-10 sm:p-14 relative overflow-hidden">
          {/* Decoration */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-400/10 rounded-full blur-3xl" />

          <div className="relative z-10">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-4 tracking-tight">
              지금 바로 시작해 보세요
            </h2>
            <p className="text-blue-100 mb-8 text-sm sm:text-base max-w-md mx-auto">
              무료 플랜으로 RecruitAI의 AI 기능을 체험해 보세요.
              <br />가입만 하면 바로 사용할 수 있습니다.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to={user ? '/portfolio' : '/login'}
                className="group inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-blue-700 text-sm font-bold rounded-2xl hover:bg-blue-50 transition-all shadow-lg"
              >
                {user ? 'AI 기능 사용하기' : '무료로 시작하기'}
                <svg className="group-hover:translate-x-0.5 transition-transform" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                </svg>
              </Link>
              <div className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 text-white text-sm font-bold rounded-2xl border border-white/20 backdrop-blur-sm">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                가입만 하면 무료
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
