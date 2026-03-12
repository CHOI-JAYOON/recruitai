import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/* ── 기능별 목업 프리뷰 컴포넌트 ── */
function PortfolioMockup() {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
      <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
        <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
        <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
        <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
        <span className="ml-2 text-[10px] text-gray-400">포트폴리오 관리</span>
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
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
      <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
        <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
        <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
        <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
        <span className="ml-2 text-[10px] text-gray-400">이력서 생성</span>
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
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
      <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
        <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
        <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
        <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
        <span className="ml-2 text-[10px] text-gray-400">자소서 작성</span>
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
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
      <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
        <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
        <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
        <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
        <span className="ml-2 text-[10px] text-gray-400">면접 연습</span>
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
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
      <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
        <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
        <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
        <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
        <span className="ml-2 text-[10px] text-gray-400">경력기술서</span>
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
    mockup: <PortfolioMockup />,
    reverse: false,
  },
  {
    title: '맞춤 이력서 생성',
    subtitle: '직무에 최적화된 이력서를 AI가 작성',
    description: '프로필과 포트폴리오 정보를 기반으로, 지원 직무에 맞는 이력서를 자동 생성합니다. 클릭 한 번으로 완성된 이력서를 받아보세요.',
    tags: ['직무 맞춤', 'AI 자동 생성', '원클릭 복사'],
    mockup: <ResumeMockup />,
    reverse: true,
  },
  {
    title: '자소서 작성',
    subtitle: '지원 공고에 맞는 자기소개서 생성',
    description: '지원 공고와 본인의 경험을 분석하여, 설득력 있는 자기소개서 답변을 AI가 작성해 줍니다. 글자 수 조절도 가능합니다.',
    tags: ['공고 분석', 'RAG 기반', '글자 수 조절'],
    mockup: <CoverLetterMockup />,
    reverse: false,
  },
  {
    title: '면접 연습',
    subtitle: 'AI 면접관과 실전 면접 시뮬레이션',
    description: 'AI가 지원 직무에 맞는 면접 질문을 생성하고, 답변에 대해 상세한 피드백을 제공합니다. 음성 답변도 지원합니다.',
    tags: ['맞춤 질문', '실시간 피드백', '음성 지원'],
    mockup: <InterviewMockup />,
    reverse: true,
  },
  {
    title: '경력기술서',
    subtitle: '경력 사항을 전문적으로 정리',
    description: '경력 정보를 입력하면 AI가 체계적이고 전문적인 경력기술서를 자동으로 생성합니다.',
    tags: ['경력 정리', 'AI 자동 생성', '전문 포맷'],
    mockup: <CareerDescMockup />,
    reverse: false,
  },
];

export default function AboutPage() {
  const { user } = useAuth() || {};

  return (
    <div className="animate-fade-in">
      {/* Hero */}
      <section className="pt-8 pb-14 text-center px-4">
        <div className="max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary text-sm font-semibold rounded-full mb-6">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
            AI 기반 취업 준비 플랫폼
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-gray-900 dark:text-white mb-5 leading-tight">
            AI로 취업 준비를<br />
            <span className="text-primary">완성</span>하세요
          </h1>
          <p className="text-base sm:text-lg text-gray-500 dark:text-gray-400 max-w-xl mx-auto mb-10 leading-relaxed">
            이력서, 자소서, 면접까지. RecruitAI가 취업 준비의 모든 단계를 AI로 도와드립니다.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to={user ? '/portfolio' : '/login'}
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-[#3182f6] text-white text-sm font-bold rounded-xl hover:bg-[#1b6ef3] transition shadow-lg shadow-blue-200 dark:shadow-none"
            >
              {user ? 'AI 기능 사용하기' : '무료로 시작하기'}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
              </svg>
            </Link>
            <Link
              to="/pricing"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 text-sm font-bold rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
            >
              요금제 보기
            </Link>
          </div>
        </div>
      </section>

      {/* Feature Showcases */}
      <section className="max-w-6xl mx-auto px-4 pb-16">
        <div className="text-center mb-14">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white mb-3">
            취업 준비에 필요한 모든 AI 기능
          </h2>
          <p className="text-gray-500 dark:text-gray-400 max-w-lg mx-auto">
            각 단계별로 최적화된 AI가 여러분의 취업 성공을 돕습니다.
          </p>
        </div>

        <div className="space-y-20">
          {featureShowcases.map((feature, idx) => (
            <div
              key={feature.title}
              className={`flex flex-col ${feature.reverse ? 'lg:flex-row-reverse' : 'lg:flex-row'} items-center gap-8 lg:gap-14`}
            >
              {/* Mockup */}
              <div className="w-full lg:w-[45%] max-w-sm mx-auto lg:mx-0">
                {feature.mockup}
              </div>

              {/* Text */}
              <div className="w-full lg:w-[55%] text-center lg:text-left">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full mb-4">
                  <span className="text-[11px] font-bold text-primary">0{idx + 1}</span>
                  <span className="text-[11px] text-gray-500 dark:text-gray-400">{feature.subtitle}</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-extrabold text-gray-900 dark:text-white mb-3">
                  {feature.title}
                </h3>
                <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 leading-relaxed mb-5">
                  {feature.description}
                </p>
                <div className="flex flex-wrap gap-2 justify-center lg:justify-start">
                  {feature.tags.map((tag) => (
                    <span key={tag} className="px-3 py-1.5 text-[11px] font-semibold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-lg">
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
      <section className="bg-white dark:bg-gray-800 border-t border-b border-gray-200 dark:border-gray-700 py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white mb-3">
              간단한 3단계로 시작하세요
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: '01', title: '회원가입', desc: '간편하게 가입하고 무료로 시작하세요.' },
              { step: '02', title: '프로필 입력', desc: '학력, 경력, 기술 등 기본 정보를 입력하세요.' },
              { step: '03', title: 'AI 활용', desc: '이력서, 자소서, 면접 연습 등 AI 기능을 사용하세요.' },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary text-sm font-extrabold mb-4">
                  {item.step}
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{item.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* API Key info */}
      <section className="max-w-4xl mx-auto px-4 py-16">
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl border border-green-200 dark:border-green-800/50 p-8 sm:p-10 text-center">
          <div className="w-14 h-14 rounded-2xl bg-green-100 dark:bg-green-900/40 flex items-center justify-center mx-auto mb-5">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
            본인 API Key로 무제한 무료 사용
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300 max-w-lg mx-auto mb-6 leading-relaxed">
            OpenAI API Key를 등록하면 모든 AI 기능을 사용량 제한 없이 무료로 이용할 수 있습니다.
            별도의 구독 없이도 원하는 만큼 사용하세요.
          </p>
          <Link
            to={user ? '/mypage?tab=subscription' : '/login'}
            className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white text-sm font-bold rounded-xl hover:bg-green-700 transition"
          >
            {user ? 'API Key 등록하기' : '무료로 시작하기'}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </Link>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-4 pb-16 text-center">
        <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-3">
          지금 바로 시작해 보세요
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mb-8">
          무료 플랜으로 RecruitAI의 AI 기능을 체험해 보세요.
        </p>
        <Link
          to={user ? '/portfolio' : '/login'}
          className="inline-flex items-center gap-2 px-8 py-3.5 bg-[#3182f6] text-white text-sm font-bold rounded-xl hover:bg-[#1b6ef3] transition shadow-lg shadow-blue-200 dark:shadow-none"
        >
          {user ? 'AI 기능 사용하기' : '무료로 시작하기'}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
          </svg>
        </Link>
      </section>
    </div>
  );
}
