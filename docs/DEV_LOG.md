# RecruitAI 개발 로그

> 프로젝트 기간: 2026.03.11 ~
> 역할: 풀스택 개발 (프론트엔드 + 백엔드 + AI 에이전트 설계)

---

## 1. 프로젝트 개요

취업 준비 전 과정을 AI로 지원하는 통합 플랫폼.
포트폴리오 관리, 이력서/자소서/경력기술서 자동 생성, 모의 면접까지 하나의 서비스에서 제공.

### 핵심 기술 스택
- **Frontend**: React 19, Vite, Tailwind CSS, React Router 7
- **Backend**: FastAPI (Python), OpenAI GPT-4o, ChromaDB
- **DB**: PostgreSQL (Render), SmartPath 추상화 레이어
- **배포**: Vercel (프론트), Render (백엔드 + DB)

---

## 2. 주요 이슈 & 해결 과정

### Issue #1: BrowserRouter에서 useBlocker 호환성 문제
- **상황**: 포트폴리오 수정 중 페이지 이탈 방지를 위해 `useBlocker` 훅을 도입했으나, 배포 후 사이트가 완전히 빈 화면(White Screen)으로 표시됨
- **원인 분석**: `useBlocker`는 React Router v7의 Data Router(`createBrowserRouter`) 전용 훅인데, 기존 코드가 `BrowserRouter`를 사용 중이었음. 콘솔에 `useBlocker must be used within a data router` 에러 확인
- **해결**: `App.jsx`를 `BrowserRouter` → `createBrowserRouter` + `RouterProvider`로 전면 리팩토링. `ProtectedRoute`를 Layout Route 패턴(`Outlet`)으로 전환
- **배운 점**: React Router v7에서 새로운 훅 사용 시 라우터 타입 호환성을 반드시 사전 확인해야 함. 배포 전 로컬에서 충분한 테스트가 중요

### Issue #2: 대용량 PDF 이력서 파싱 타임아웃
- **상황**: 사용자가 긴 PDF 이력서를 업로드하면 AI 파싱이 실패함
- **원인 분석**: GPT-4o에 전달되는 텍스트가 너무 길어 API 호출 시간이 초과됨
- **해결**: 텍스트를 20,000자로 제한하고, 프론트엔드 타임아웃을 180초로 확장. `pdfplumber`를 사용해 PDF에서 텍스트만 효율적으로 추출
- **배운 점**: LLM API 호출 시 입력 크기 제한과 타임아웃 설정은 필수. 사용자 경험을 위해 로딩 상태를 명확히 표시해야 함

### Issue #3: PostgreSQL 영속 저장소 전환 (SmartPath 설계)
- **상황**: Render 무료 플랜에서 파일 시스템이 배포마다 초기화되어 사용자 데이터가 유실됨
- **원인 분석**: Render의 무료 Web Service는 ephemeral filesystem. 배포할 때마다 JSON 파일이 초기화됨
- **해결**: `SmartPath` 클래스를 설계하여 `pathlib.Path`의 drop-in replacement로 동작하도록 구현. `DATABASE_URL` 환경변수가 설정되면 PostgreSQL에 JSON 데이터를 저장하고, 미설정 시 로컬 파일에 저장. 기존 코드 변경 없이(Zero-change) 저장소 전환 가능
- **배운 점**: 추상화 레이어를 잘 설계하면 인프라 변경에도 비즈니스 로직을 보호할 수 있음. 환경변수 기반 설정 전환 패턴의 유용성을 체감

### Issue #4: DB 커넥션 풀링 미적용으로 인한 성능 저하
- **상황**: 이력서 파싱 후 포트폴리오 10개를 저장하면 약 20번의 DB 커넥션이 생성/해제되어 속도가 느림
- **원인 분석**: `psycopg2.connect()`가 매 읽기/쓰기마다 새 TCP 커넥션을 생성. SSL 핸드셰이크 + 인증 오버헤드 누적
- **해결**: (1) `psycopg2.pool.ThreadedConnectionPool`로 커넥션 재사용 (2) 포트폴리오 일괄 저장 API(`POST /portfolios/bulk`) 추가로 N번 → 1번 저장 (3) 프론트엔드에서 포트폴리오/프로필 저장을 `Promise.all`로 병렬 실행 (4) 전체 데이터 리로드 대신 변경된 데이터만 선택적 리로드
- **배운 점**: DB 커넥션 생성 비용은 예상보다 크며, 풀링은 필수. 프론트엔드에서도 API 호출 최적화(배치, 병렬, 선택적 로드)가 성능에 큰 영향

### Issue #5: 이력서 파싱 시 기존 데이터 덮어쓰기 문제
- **상황**: 이력서를 두 번째 업로드하면 기존 포트폴리오와 프로필 정보가 완전히 교체됨
- **원인 분석**: `handleResumeResult`에서 새 데이터로 기존 데이터를 replace하는 로직
- **해결**: 포트폴리오는 제목 기준 `Set`으로 중복 체크 후 스킵, 프로필 배열 필드(학력, 경력, 자격증 등)는 `mergeArr` 유틸 함수로 key 기반 중복 제거 후 병합
- **배운 점**: 데이터 병합 로직은 사용자 경험에 직접적 영향. "추가"와 "교체"의 차이를 명확히 인지하고 구현해야 함

### Issue #6: 이력서 DOCX 섹션 순서 최적화
- **상황**: 생성된 이력서 DOCX의 섹션 순서가 일반적인 이력서 관행과 다름 (SKILLS가 맨 아래에 위치)
- **해결**: 실제 이력서 샘플을 참고하여 순서를 재배치: SUMMARY → EXPERIENCE(경력+주요 프로젝트 통합) → SKILLS → EDUCATION → CERTIFICATIONS → AWARDS → TRAINING. TRAINING 섹션도 새로 추가
- **배운 점**: 문서 생성은 내용뿐 아니라 구조와 순서도 중요. 실제 사례를 참고하는 것이 최선

---

## 3. 설계 결정 & 트레이드오프

### AI 에이전트 아키텍처
- `BaseAgent` 추상 클래스를 만들어 모든 에이전트가 상속하도록 설계
- 3가지 호출 패턴 제공: `_call_llm` (자유 텍스트), `_call_llm_structured` (Pydantic 모델), `_call_llm_with_tools` (도구 사용)
- **이유**: 에이전트별로 다른 출력 형식이 필요하지만, 공통 로직(프롬프트 관리, 에러 처리)은 중복 방지

### 벡터 검색 (ChromaDB) 활용
- 포트폴리오를 `text-embedding-3-small`로 임베딩하여 ChromaDB에 저장
- 이력서/자소서 생성 시 직무 설명과 유사도 높은 포트폴리오를 자동 추천
- **트레이드오프**: 임베딩 생성에 OpenAI API 비용 발생하지만, 사용자가 직접 선택하는 것보다 정확도 높은 매칭 가능

### React Router Data Router 전환
- `BrowserRouter` → `createBrowserRouter` 전환은 큰 리팩토링이었지만, `useBlocker` 등 최신 기능 활용 가능
- Layout Route 패턴으로 `ProtectedRoute`를 구현하여 인증 로직을 깔끔하게 분리

### SmartPath 추상화
- `pathlib.Path`와 동일한 인터페이스(`read_text`, `write_text`, `exists`, `parent`)를 제공
- 기존 서비스 코드 수정 없이 DB 전환 가능 → "Zero-change migration" 달성
- **트레이드오프**: 관계형 DB의 장점(쿼리, 인덱싱)을 포기하고 JSON blob 저장 방식을 택함. 현재 규모에서는 충분하지만 대규모로는 한계

---

## 4. 개발 일지 (커밋 기반)

| 날짜 | 작업 내용 | 비고 |
|------|----------|------|
| 2026.03.11 | 프로젝트 초기 구축 (FastAPI + React + AI 에이전트) | 풀스택 아키텍처 설계 |
| 2026.03.11 | API Key 등록 플로우 + Render 배포 설정 | 환경 구성 |
| 2026.03.11 | 이력서 업로드 AI 파싱 기능 구현 | PDF/DOCX → GPT-4o 구조화 |
| 2026.03.11 | 대용량 PDF 지원 (20K자 제한, 180초 타임아웃) | 성능 이슈 대응 |
| 2026.03.11 | PostgreSQL 영속 저장소 (SmartPath) | 인프라 안정화 |
| 2026.03.11 | 비밀번호 재설정 유효성 검사 + README 작성 | 보안 + 문서화 |
| 2026.03.11 | 이력서 중복 방지 + 아이디/비밀번호 찾기 UI | UX 개선 |
| 2026.03.11 | 포트폴리오 수정 모드 AI 파싱 지원 | 기능 확장 |
| 2026.03.11 | 페이지 이탈 방지 팝업 (useBlocker) | UX 안전장치 |
| 2026.03.11 | BrowserRouter → createBrowserRouter 전환 | 호환성 이슈 해결 |
| 2026.03.11 | DOCX 순서 변경, DB 풀링, 일괄 저장, UI 다수 개선 | 성능 + UX 통합 개선 |

---

## 5. 자소서/면접에 활용할 수 있는 포인트

### 기술적 역량
- **풀스택 개발**: React + FastAPI + PostgreSQL + AI 에이전트까지 전 범위 설계 및 구현
- **AI/LLM 활용**: OpenAI GPT-4o Structured Output을 활용한 다양한 AI 에이전트 설계 (이력서 작성, 자소서 생성, 면접 코칭, 포트폴리오 파싱)
- **벡터 검색**: ChromaDB + text-embedding-3-small을 활용한 의미 기반 포트폴리오 매칭
- **데이터베이스 추상화**: SmartPath 패턴으로 개발/운영 환경 간 무변경 전환 구현
- **성능 최적화**: DB 커넥션 풀링, 배치 API, 병렬 처리, 선택적 데이터 로드

### 문제 해결 능력
- 배포 후 빈 화면 이슈를 콘솔 에러 분석으로 신속하게 원인 파악 및 해결 (useBlocker + Data Router)
- Render 무료 플랜의 ephemeral filesystem 한계를 SmartPath 추상화 레이어로 극복
- 대용량 파일 처리 시 타임아웃/메모리 이슈를 텍스트 길이 제한과 스트리밍으로 해결
- N+1 API 호출 문제를 배치 엔드포인트와 병렬 실행으로 해결

### 사용자 중심 사고
- 이력서 두 번째 업로드 시 기존 데이터 보존 (교체 → 병합)
- 수정 중 페이지 이탈 방지 팝업으로 데이터 유실 방지
- 대표 이력서/경력기술서 미설정 시 바로가기 버튼으로 사용성 개선
- 이력서/경력기술서 생성 시 불필요한 단계 통합으로 UX 간소화

### 프로젝트 관리
- 이슈 발생 → 원인 분석 → 해결 → 검증의 체계적 문제 해결 프로세스
- Git을 활용한 체계적 버전 관리 (기능별 커밋, 의미 있는 커밋 메시지)
- 문서화 습관 (README, 아키텍처 문서, 개발 로그)

---

## 6. 회고 & 소감

### 잘한 점
- SmartPath 추상화 설계는 인프라 변경에도 코드 수정 없이 전환할 수 있어 매우 효과적이었음
- AI 에이전트를 BaseAgent 기반으로 설계하여 새 에이전트 추가가 매우 간편함
- 사용자 피드백을 즉시 반영하는 반복적 개발 방식이 결과물의 완성도를 높임

### 개선할 점
- 테스트 코드 부재: 단위 테스트와 통합 테스트를 작성하지 못함
- 에러 핸들링이 일부 구간에서 `catch { /* skip */ }` 패턴으로 처리되어 디버깅이 어려울 수 있음
- 프론트엔드 컴포넌트 분리가 더 필요함 (일부 페이지가 500줄 이상)
- CI/CD 파이프라인 미구축

### 다음 단계
- 자소서 페이지 UI/UX 개선 (대화형 인터페이스)
- 테스트 코드 작성 (pytest + React Testing Library)
- 에러 로깅 시스템 도입 (Sentry 등)
- 모바일 반응형 최적화
