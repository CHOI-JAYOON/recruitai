import { Link } from 'react-router-dom';

const features = [
  {
    title: '이력서 생성',
    description: '프로필 정보를 기반으로 직무에 최적화된 이력서를 AI가 자동 생성합니다.',
    icon: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z|M14 2v6h6|M16 13H8|M16 17H8|M10 9H8',
    color: 'bg-blue-50 text-blue-600',
  },
  {
    title: '자소서 작성',
    description: '지원 공고에 맞춰 설득력 있는 자기소개서 답변을 AI가 작성해 줍니다.',
    icon: 'M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7|M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z',
    color: 'bg-green-50 text-green-600',
  },
  {
    title: '경력기술서',
    description: '경력 사항을 체계적으로 정리하여 전문적인 경력기술서를 만들어 줍니다.',
    icon: 'M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2|M15 2H9a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1z',
    color: 'bg-purple-50 text-purple-600',
  },
  {
    title: '면접 연습',
    description: 'AI 면접관이 실제와 유사한 질문을 하고, 답변에 대해 상세한 피드백을 제공합니다.',
    icon: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z',
    color: 'bg-amber-50 text-amber-600',
  },
  {
    title: '포트폴리오 분석',
    description: '포트폴리오 파일을 업로드하면 AI가 핵심 내용을 파싱하고 정리해 줍니다.',
    icon: 'M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z',
    color: 'bg-cyan-50 text-cyan-600',
  },
  {
    title: '지원 현황 관리',
    description: '지원한 회사와 진행 상태를 한눈에 관리하고 추적할 수 있습니다.',
    icon: 'M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2|M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2|M9 14l2 2 4-4',
    color: 'bg-rose-50 text-rose-600',
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link to="/" className="text-lg font-bold">
            Recruit<span className="text-primary">AI</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/pricing" className="text-sm text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 font-medium">
              요금제
            </Link>
            <Link to="/login" className="text-sm text-primary hover:underline font-medium">
              로그인
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-20 pb-16 text-center px-6">
        <div className="max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary text-sm font-semibold rounded-full mb-6">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
            AI 기반 취업 준비 플랫폼
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 dark:text-white mb-5 leading-tight">
            AI로 취업 준비를<br />
            <span className="text-primary">완성</span>하세요
          </h1>
          <p className="text-lg text-gray-500 dark:text-gray-400 max-w-xl mx-auto mb-10 leading-relaxed">
            이력서, 자소서, 면접까지. RecruitAI가 취업 준비의 모든 단계를 AI로 도와드립니다.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-[#3182f6] text-white text-sm font-bold rounded-xl hover:bg-[#1b6ef3] transition shadow-lg shadow-blue-200 dark:shadow-none"
            >
              무료로 시작하기
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

      {/* Features */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-20">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white mb-3">
            취업 준비에 필요한 모든 AI 기능
          </h2>
          <p className="text-gray-500 dark:text-gray-400 max-w-lg mx-auto">
            각 단계별로 최적화된 AI가 여러분의 취업 성공을 돕습니다.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
            >
              <div className={`w-11 h-11 rounded-xl ${feature.color} flex items-center justify-center mb-4`}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  {feature.icon.split('|').map((d, i) => <path key={i} d={d} />)}
                </svg>
              </div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white mb-2">{feature.title}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-white dark:bg-gray-800 border-t border-b border-gray-200 dark:border-gray-700 py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
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
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-20">
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
            to="/login"
            className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white text-sm font-bold rounded-xl hover:bg-green-700 transition"
          >
            지금 시작하기
          </Link>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 pb-20 text-center">
        <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-3">
          지금 바로 시작해 보세요
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mb-8">
          무료 플랜으로 RecruitAI의 AI 기능을 체험해 보세요.
        </p>
        <Link
          to="/login"
          className="inline-flex items-center gap-2 px-8 py-3.5 bg-[#3182f6] text-white text-sm font-bold rounded-xl hover:bg-[#1b6ef3] transition shadow-lg shadow-blue-200 dark:shadow-none"
        >
          무료로 시작하기
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
          </svg>
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-700 py-8">
        <div className="max-w-4xl mx-auto px-6 text-center text-sm text-gray-400">
          <p>&copy; 2025 RecruitAI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
