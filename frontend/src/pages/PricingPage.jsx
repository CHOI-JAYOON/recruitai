import { useAuth } from '../contexts/AuthContext';

const plans = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    priceLabel: '무료',
    description: '취업 준비를 시작하는 분들을 위한 기본 플랜',
    features: {
      resume: 1,
      cover_letter: 2,
      career_description: 1,
      interview_question: 1,
      interview_evaluation: 3,
      portfolio_parsing: 2,
    },
    highlighted: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 15000,
    priceLabel: '₩15,000',
    description: '본격적인 취업 준비를 위한 프로 플랜',
    features: {
      resume: 10,
      cover_letter: 15,
      career_description: 10,
      interview_question: 5,
      interview_evaluation: 30,
      portfolio_parsing: 10,
    },
    highlighted: true,
  },
  {
    id: 'max',
    name: 'Max',
    price: 29900,
    priceLabel: '₩29,900',
    description: '대량 지원과 집중 준비가 필요한 분을 위한 플랜',
    features: {
      resume: 30,
      cover_letter: 50,
      career_description: 30,
      interview_question: 15,
      interview_evaluation: 100,
      portfolio_parsing: 30,
    },
    highlighted: false,
  },
];

const featureRows = [
  { key: 'resume', label: '이력서 생성' },
  { key: 'cover_letter', label: '자소서 답변' },
  { key: 'career_description', label: '경력기술서' },
  { key: 'interview_question', label: '면접 질문세트' },
  { key: 'interview_evaluation', label: '면접 평가' },
  { key: 'portfolio_parsing', label: '포트폴리오 파싱' },
];

export default function PricingPage() {
  const { user } = useAuth() || {};
  const currentPlan = user?.plan || 'free';

  return (
    <div className="animate-fade-in">
      {/* Hero */}
      <section className="pt-8 pb-10 text-center px-4">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white mb-3">
          나에게 맞는 플랜을 선택하세요
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-base sm:text-lg max-w-xl mx-auto">
          RecruitAI의 AI 기능을 더 많이 활용하고 취업 준비를 가속화하세요.
        </p>
      </section>

      {/* Plans */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const isCurrent = currentPlan === plan.id;

            return (
              <div
                key={plan.id}
                className={`relative rounded-2xl p-6 sm:p-8 flex flex-col transition ${
                  plan.highlighted
                    ? 'bg-white dark:bg-gray-800 border-2 border-[#3182f6] shadow-lg shadow-blue-100 dark:shadow-none'
                    : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 bg-[#3182f6] text-white text-xs font-bold rounded-full">
                    추천
                  </div>
                )}

                {/* Plan name */}
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{plan.name}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">{plan.description}</p>

                {/* Price */}
                <div className="mb-6">
                  <span className="text-3xl font-extrabold text-gray-900 dark:text-white">{plan.priceLabel}</span>
                  {plan.price > 0 && (
                    <span className="text-sm text-gray-400 dark:text-gray-500 ml-1">/ 월</span>
                  )}
                </div>

                {/* Features */}
                <ul className="flex-1 space-y-3 mb-8">
                  {featureRows.map((row) => (
                    <li key={row.key} className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-300">{row.label}</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {plan.features[row.key]}회/월
                      </span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                {plan.id === 'free' ? (
                  isCurrent ? (
                    <button
                      disabled
                      className="w-full py-3 rounded-xl text-sm font-semibold bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-default"
                    >
                      현재 플랜
                    </button>
                  ) : (
                    <button
                      disabled
                      className="w-full py-3 rounded-xl text-sm font-semibold bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-default"
                    >
                      무료 플랜
                    </button>
                  )
                ) : isCurrent ? (
                  <button
                    disabled
                    className="w-full py-3 rounded-xl text-sm font-semibold bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-default"
                  >
                    현재 플랜
                  </button>
                ) : (
                  <button
                    className={`w-full py-3 rounded-xl text-sm font-semibold transition ${
                      plan.highlighted
                        ? 'bg-[#3182f6] text-white hover:bg-[#1b6ef3]'
                        : 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-200'
                    }`}
                    onClick={() => window.open('mailto:support@recruitai.com?subject=플랜 변경 문의 - ' + plan.name, '_blank')}
                  >
                    관리자에게 문의
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Comparison Table */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 pb-16">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white text-center mb-8">
          플랜별 기능 비교
        </h2>
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                  <th className="text-left px-6 py-4 font-semibold text-gray-500 dark:text-gray-400">기능</th>
                  {plans.map((plan) => (
                    <th
                      key={plan.id}
                      className={`text-center px-4 py-4 font-bold ${
                        plan.highlighted ? 'text-[#3182f6]' : 'text-gray-900 dark:text-white'
                      }`}
                    >
                      {plan.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {featureRows.map((row, idx) => (
                  <tr
                    key={row.key}
                    className={idx < featureRows.length - 1 ? 'border-b border-gray-100 dark:border-gray-700/50' : ''}
                  >
                    <td className="px-6 py-3.5 text-gray-700 dark:text-gray-300 font-medium">{row.label}</td>
                    {plans.map((plan) => (
                      <td
                        key={plan.id}
                        className={`text-center px-4 py-3.5 font-semibold ${
                          plan.highlighted ? 'text-[#3182f6]' : 'text-gray-900 dark:text-white'
                        }`}
                      >
                        {plan.features[row.key]}회/월
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* API Key 무제한 사용 안내 */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 pb-10">
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl border border-green-200 dark:border-green-800/50 p-8 text-center">
          <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/40 flex items-center justify-center mx-auto mb-4">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
            본인 API Key로 무제한 무료 사용
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300 max-w-lg mx-auto mb-1 leading-relaxed">
            OpenAI API Key를 등록하면 구독 없이도 모든 AI 기능을 <span className="font-semibold text-green-600">사용량 제한 없이 무료</span>로 이용할 수 있습니다.
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            마이페이지 &gt; 구독 탭에서 본인 API Key를 등록하세요.
          </p>
        </div>
      </section>

      {/* FAQ hint */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 pb-16 text-center">
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-8">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">궁금한 점이 있으신가요?</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            플랜 변경, 결제, 환불 등 궁금한 사항은 언제든지 문의해 주세요.
          </p>
          <a
            href="mailto:support@recruitai.com"
            className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-sm font-semibold rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
            이메일 문의
          </a>
        </div>
      </section>

    </div>
  );
}
