# RecruitAI

AI 기반 취업 준비 통합 플랫폼. 포트폴리오 관리부터 이력서/자기소개서 생성, 면접 준비까지 취업 과정 전체를 AI가 지원합니다.

> **Live Demo**: [https://recruitai-frontend.vercel.app](https://recruitai-frontend.vercel.app)

---

## 주요 기능

### 포트폴리오 & 경력 관리
- 프로젝트/경력 CRUD (제목, 역할, 기술 스택, 성과, 링크 등)
- ChromaDB 벡터 검색으로 관련 경력을 의미 기반 검색
- 이력서(PDF/DOCX) 업로드 시 AI가 자동 파싱하여 포트폴리오/프로필 자동 입력

### AI 이력서 생성
- 채용공고 URL/텍스트 입력 → 맞춤형 이력서 자동 생성
- 벡터 검색으로 관련 포트폴리오를 자동 매칭
- DOCX/PDF 다운로드 지원
- 생성 이력 관리

### AI 자기소개서 생성
- 채용공고 기반 맞춤형 자기소개서 생성
- 문항별 구조화된 답변 자동 작성
- DOCX 다운로드 지원

### AI 면접 준비
- 채용공고 + 경력 기반 예상 질문 생성 (기술/인성/경험)
- 답변 예시 및 핵심 포인트 제공
- 면접 이력 관리

### 경력기술서 생성
- 경력별 상세 기술서 자동 작성
- 성과 중심 서술

### 사용자 관리
- 회원가입/로그인 (이메일 + 카카오/네이버 소셜 로그인)
- 프로필 관리 (학력, 경력, 자격증, 수상, 교육이수)
- 비밀번호 재설정

---

## 기술 스택

### Backend
| 기술 | 용도 |
|------|------|
| **Python 3.11** | 서버 언어 |
| **FastAPI** | REST API 프레임워크 |
| **OpenAI GPT-4o** | AI 에이전트 LLM |
| **ChromaDB** | 벡터 데이터베이스 (포트폴리오 시맨틱 검색) |
| **PostgreSQL** | 영속 데이터 저장소 (배포 환경) |
| **Pydantic** | 데이터 모델 검증 |
| **pdfplumber / python-docx** | 이력서 PDF/DOCX 텍스트 추출 |
| **ReportLab** | PDF 생성 |

### Frontend
| 기술 | 용도 |
|------|------|
| **React 19** | UI 프레임워크 |
| **Vite** | 빌드 도구 |
| **Tailwind CSS** | 스타일링 |
| **React Router 7** | 클라이언트 라우팅 |
| **Axios** | HTTP 클라이언트 |

### 인프라
| 기술 | 용도 |
|------|------|
| **Render** | 백엔드 배포 (Web Service + PostgreSQL) |
| **Vercel** | 프론트엔드 배포 |
| **GitHub** | 소스 코드 관리 |

---

## 아키텍처

```
Frontend (React/Vite)          Backend (FastAPI)
┌──────────────────┐          ┌──────────────────────────────┐
│  Pages           │          │  API Layer                   │
│  - HomePage      │  REST    │  /api/auth                   │
│  - ResumePage    │◄────────►│  /api/portfolios             │
│  - CoverLetter   │  API     │  /api/profile                │
│  - InterviewPage │          │  /api/resume                 │
│  - MyPage        │          │  /api/cover-letter           │
│  - CareerDesc    │          │  /api/interview              │
└──────────────────┘          │  /api/applications           │
                              │  /api/career-description     │
                              ├──────────────────────────────┤
                              │  AI Agents (OpenAI GPT-4o)   │
                              │  - ResumeWriterAgent         │
                              │  - CoverLetterAgent          │
                              │  - InterviewCoachAgent       │
                              │  - PortfolioParserAgent      │
                              │  - ResumeParserAgent         │
                              │  - CareerDescriptionAgent    │
                              ├──────────────────────────────┤
                              │  Services                    │
                              │  - VectorStore (ChromaDB)    │
                              │  - SmartPath (PostgreSQL/File)│
                              │  - DocumentGenerator         │
                              │  - FileParser                │
                              └──────────────────────────────┘
```

### AI 에이전트 시스템

모든 AI 에이전트는 `BaseAgent`를 상속하며, OpenAI GPT-4o를 활용합니다:

- **Structured Output**: Pydantic 모델 기반 구조화된 응답 생성
- **Tool Use**: Function Calling으로 벡터 검색 등 외부 도구 활용
- **Context-Aware**: ChromaDB 벡터 검색으로 사용자 포트폴리오에서 관련 경력을 자동 매칭

### 데이터 저장 (SmartPath)

`SmartPath` 클래스가 `pathlib.Path`의 drop-in replacement로 동작:
- `DATABASE_URL` 환경변수 설정 시 → PostgreSQL key-value 저장
- 미설정 시 → 로컬 JSON 파일 저장
- 기존 코드 변경 없이 저장소를 투명하게 전환

---

## 프로젝트 구조

```
recruitai/
├── agents/                    # AI 에이전트
│   ├── base_agent.py          # 에이전트 베이스 클래스
│   ├── resume_writer_agent.py # 이력서 생성
│   ├── cover_letter_agent.py  # 자기소개서 생성
│   ├── interview_coach_agent.py # 면접 코칭
│   ├── portfolio_parser_agent.py # 포트폴리오 파싱
│   ├── resume_parser_agent.py # 이력서 파싱
│   └── career_description_agent.py # 경력기술서 생성
├── backend/
│   ├── api/                   # REST API 엔드포인트
│   │   ├── auth.py            # 인증 (회원가입/로그인/OAuth)
│   │   ├── portfolios.py      # 포트폴리오 CRUD
│   │   ├── profile.py         # 프로필 관리 + 이력서 파싱
│   │   ├── resume.py          # 이력서 생성
│   │   ├── cover_letter.py    # 자기소개서 생성
│   │   ├── interview.py       # 면접 준비
│   │   ├── applications.py    # 지원 현황
│   │   └── career_description.py # 경력기술서
│   └── main.py                # FastAPI 앱 엔트리포인트
├── config/
│   └── settings.py            # 설정 (경로, 모델, OAuth)
├── frontend/
│   └── src/
│       ├── components/        # React 컴포넌트
│       ├── contexts/          # 전역 상태 (Auth, Theme, Toast)
│       └── pages/             # 페이지 컴포넌트
├── models/                    # Pydantic 데이터 모델
├── services/                  # 비즈니스 로직
│   ├── json_db.py             # SmartPath (PostgreSQL/File 투명 전환)
│   ├── vector_store.py        # ChromaDB 벡터 검색
│   ├── auth.py                # 인증 서비스
│   ├── storage.py             # 포트폴리오 저장소
│   ├── profile_storage.py     # 프로필 저장소
│   ├── document_generator.py  # DOCX/PDF 생성
│   └── file_parser.py         # PDF/DOCX 텍스트 추출
└── requirements.txt           # Python 의존성
```

---

## 로컬 개발 환경 설정

### 사전 요구사항
- Python 3.11+
- Node.js 18+
- OpenAI API Key

### Backend 설정

```bash
# 의존성 설치
pip install -r requirements.txt

# 환경변수 설정 (.env 파일)
OPENAI_API_KEY=sk-...
# 선택: PostgreSQL 사용 시
# DATABASE_URL=postgresql://user:pass@host/db

# 서버 실행
uvicorn backend.main:app --reload --port 8000
```

### Frontend 설정

```bash
cd frontend
npm install
npm run dev    # http://localhost:5173
```

### 환경변수

| 변수 | 필수 | 설명 |
|------|------|------|
| `OPENAI_API_KEY` | O | OpenAI API 키 (프론트엔드에서 입력) |
| `DATABASE_URL` | X | PostgreSQL 연결 URL (배포 환경) |
| `FRONTEND_URL` | X | 프론트엔드 URL (CORS) |
| `KAKAO_CLIENT_ID` | X | 카카오 OAuth 클라이언트 ID |
| `NAVER_CLIENT_ID` | X | 네이버 OAuth 클라이언트 ID |
| `NAVER_CLIENT_SECRET` | X | 네이버 OAuth 클라이언트 시크릿 |

---

## 배포

### Backend (Render)
- **서비스 타입**: Web Service (Free Tier)
- **빌드 커맨드**: `pip install -r requirements.txt`
- **시작 커맨드**: `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`
- **환경변수**: `DATABASE_URL`, `FRONTEND_URL`, `PYTHON_VERSION`

### Frontend (Vercel)
- **프레임워크**: Vite
- **빌드 커맨드**: `npm run build`
- **출력 디렉토리**: `dist`
- **API 프록시**: `vercel.json`에서 `/api/*` → Render 백엔드로 리다이렉트

### Database (Render PostgreSQL)
- **Free Tier**: 256MB 저장소
- SmartPath가 자동으로 `json_store` 테이블 생성 및 관리

---

## API 엔드포인트

| Method | Endpoint | 설명 |
|--------|----------|------|
| POST | `/api/auth/signup` | 회원가입 |
| POST | `/api/auth/login` | 로그인 |
| POST | `/api/auth/reset-password` | 비밀번호 재설정 |
| GET/POST | `/api/portfolios` | 포트폴리오 목록/생성 |
| PUT/DELETE | `/api/portfolios/{id}` | 포트폴리오 수정/삭제 |
| GET/PUT | `/api/profile/{username}` | 프로필 조회/수정 |
| POST | `/api/profile/{username}/parse-resume` | 이력서 AI 파싱 |
| POST | `/api/resume/generate` | AI 이력서 생성 |
| POST | `/api/cover-letter/generate` | AI 자기소개서 생성 |
| POST | `/api/interview/generate` | AI 면접 질문 생성 |
| POST | `/api/career-description/generate` | AI 경력기술서 생성 |
| GET | `/api/health` | 서버 상태 확인 |
