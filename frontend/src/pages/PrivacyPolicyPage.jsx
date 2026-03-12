import { Link } from 'react-router-dom';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link to="/" className="text-lg font-bold">
            Recruit<span className="text-primary">AI</span>
          </Link>
          <Link to="/login" className="text-sm text-primary hover:underline">
            로그인
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">개인정보처리방침</h1>
        <p className="text-sm text-gray-400 mb-10">시행일: 2025년 1월 1일 | 최종 수정: 2025년 3월 12일</p>

        <div className="space-y-10 text-gray-700 dark:text-gray-300 leading-relaxed">

          <Section title="1. 개인정보의 처리 목적">
            <p>RecruitAI(이하 "서비스")는 다음의 목적을 위해 개인정보를 처리합니다. 처리하고 있는 개인정보는 다음의 목적 이외의 용도로는 이용되지 않으며, 이용 목적이 변경되는 경우에는 별도의 동의를 받는 등 필요한 조치를 이행할 예정입니다.</p>
            <ul>
              <li>회원 가입 및 관리: 회원제 서비스 이용에 따른 본인확인, 개인식별, 가입의사 확인</li>
              <li>서비스 제공: AI 기반 이력서 생성, 자기소개서 작성, 경력기술서 생성, 면접 연습 등 취업 지원 서비스 제공</li>
              <li>포트폴리오 관리: 사용자의 프로젝트, 경력 정보 관리 및 문서 생성</li>
              <li>서비스 개선: 서비스 이용 통계 분석 및 서비스 품질 개선</li>
            </ul>
          </Section>

          <Section title="2. 수집하는 개인정보 항목">
            <p>서비스는 다음과 같은 개인정보를 수집합니다.</p>
            <h4 className="font-semibold mt-3 mb-1">필수항목</h4>
            <ul>
              <li>아이디, 비밀번호, 이름, 이메일</li>
            </ul>
            <h4 className="font-semibold mt-3 mb-1">선택항목</h4>
            <ul>
              <li>전화번호, 증명사진, 학력, 경력, 자격증, 수상 내역, 교육 이수 내역</li>
              <li>GitHub, LinkedIn, 블로그 URL</li>
              <li>자기소개, 포트폴리오 정보</li>
            </ul>
            <h4 className="font-semibold mt-3 mb-1">자동 수집 항목</h4>
            <ul>
              <li>서비스 이용 기록, 접속 로그, 접속 IP 정보</li>
            </ul>
          </Section>

          <Section title="3. 개인정보의 처리 및 보유 기간">
            <ul>
              <li>회원 탈퇴 시까지 보유하며, 탈퇴 즉시 파기합니다.</li>
              <li>단, 관련 법령에 의해 보존할 필요가 있는 경우 해당 기간 동안 보관합니다.</li>
              <li>전자상거래 등에서의 소비자 보호에 관한 법률: 계약 또는 청약철회 등에 관한 기록 5년</li>
              <li>통신비밀보호법: 로그인 기록 3개월</li>
            </ul>
          </Section>

          <Section title="4. 개인정보의 제3자 제공">
            <p>서비스는 원칙적으로 이용자의 개인정보를 외부에 제공하지 않습니다. 다만, 다음의 경우에는 예외로 합니다.</p>
            <ul>
              <li>이용자가 사전에 동의한 경우</li>
              <li>법령의 규정에 의거하거나, 수사 목적으로 법령에 정해진 절차와 방법에 따라 수사기관의 요구가 있는 경우</li>
            </ul>
          </Section>

          <Section title="5. 개인정보의 처리 위탁">
            <p>서비스는 원활한 서비스 제공을 위해 다음과 같이 개인정보 처리업무를 위탁하고 있습니다.</p>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 mt-2">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b dark:border-gray-700">
                    <th className="text-left py-2 font-semibold">위탁받는 자</th>
                    <th className="text-left py-2 font-semibold">위탁 업무</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b dark:border-gray-700">
                    <td className="py-2">OpenAI</td>
                    <td className="py-2">AI 기반 문서 생성 (이력서, 자소서, 경력기술서, 면접 질문)</td>
                  </tr>
                  <tr className="border-b dark:border-gray-700">
                    <td className="py-2">Vercel</td>
                    <td className="py-2">웹 서비스 호스팅</td>
                  </tr>
                  <tr className="border-b dark:border-gray-700">
                    <td className="py-2">Render</td>
                    <td className="py-2">백엔드 서버 호스팅</td>
                  </tr>
                  <tr>
                    <td className="py-2">Google</td>
                    <td className="py-2">광고 서비스 (Google AdSense)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Section>

          <Section title="6. 개인정보의 파기 절차 및 방법">
            <ul>
              <li><strong>파기 절차:</strong> 회원 탈퇴 요청 시 즉시 해당 개인정보를 파기합니다.</li>
              <li><strong>파기 방법:</strong> 전자적 파일 형태의 정보는 기록을 재생할 수 없는 기술적 방법을 사용하여 삭제합니다.</li>
            </ul>
          </Section>

          <Section title="7. 이용자의 권리와 행사 방법">
            <p>이용자는 언제든지 다음과 같은 권리를 행사할 수 있습니다.</p>
            <ul>
              <li>개인정보 열람 요구</li>
              <li>오류 등이 있을 경우 정정 요구</li>
              <li>삭제 요구</li>
              <li>처리정지 요구</li>
            </ul>
            <p className="mt-2">위 권리 행사는 마이페이지에서 직접 수행하거나, 서비스 운영자에게 이메일로 요청할 수 있습니다.</p>
          </Section>

          <Section title="8. 개인정보의 안전성 확보 조치">
            <p>서비스는 개인정보의 안전성 확보를 위해 다음과 같은 조치를 취하고 있습니다.</p>
            <ul>
              <li>비밀번호 암호화 저장 (bcrypt)</li>
              <li>JWT 토큰 기반 인증</li>
              <li>HTTPS 암호화 통신</li>
              <li>API 요청 속도 제한 (Rate Limiting)</li>
              <li>접근 권한 관리</li>
            </ul>
          </Section>

          <Section title="9. 쿠키 및 광고">
            <p>서비스는 Google AdSense를 통해 광고를 게재하며, 이 과정에서 쿠키가 사용될 수 있습니다.</p>
            <ul>
              <li>Google은 광고 제공을 위해 쿠키를 사용할 수 있습니다.</li>
              <li>사용자는 브라우저 설정에서 쿠키를 비활성화할 수 있습니다.</li>
              <li>Google의 광고 쿠키 사용에 대한 자세한 내용은 <a href="https://policies.google.com/technologies/ads" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Google 광고 정책</a>을 참고하세요.</li>
            </ul>
          </Section>

          <Section title="10. 개인정보 보호책임자">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 mt-2">
              <p><strong>담당자:</strong> RecruitAI 운영팀</p>
              <p><strong>이메일:</strong> support@recruitai.com</p>
            </div>
            <p className="mt-3 text-sm text-gray-500">개인정보 침해에 대한 신고나 상담이 필요하시면 아래 기관에 문의하실 수 있습니다.</p>
            <ul className="text-sm text-gray-500">
              <li>개인정보침해신고센터 (privacy.kisa.or.kr / 118)</li>
              <li>개인정보분쟁조정위원회 (www.kopico.go.kr / 1833-6972)</li>
            </ul>
          </Section>

          <Section title="11. 개인정보처리방침 변경">
            <p>이 개인정보처리방침은 2025년 1월 1일부터 적용되며, 법령 및 방침에 따른 변경내용의 추가, 삭제 및 정정이 있는 경우에는 변경사항의 시행 7일 전부터 공지사항을 통하여 고지할 것입니다.</p>
          </Section>

        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-700 mt-16 py-8">
        <div className="max-w-4xl mx-auto px-6 text-center text-sm text-gray-400">
          <p>&copy; 2025 RecruitAI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <section>
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{title}</h2>
      <div className="space-y-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_li]:text-[15px]">
        {children}
      </div>
    </section>
  );
}
