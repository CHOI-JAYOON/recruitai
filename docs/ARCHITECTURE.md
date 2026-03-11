# RecruitAI 아키텍처 및 동작 원리

## 1. 시스템 개요

RecruitAI는 **AI 에이전트 기반 취업 준비 플랫폼**으로, 사용자의 포트폴리오와 경력 데이터를 AI가 분석하여 맞춤형 취업 문서를 자동 생성합니다.

```
사용자 → React SPA → FastAPI REST API → AI Agent (GPT-4o) → 구조화된 결과
                                       ↕
                              ChromaDB (벡터 검색)
                              PostgreSQL (데이터 저장)
```

---

## 2. 핵심 동작 원리

### 2.1 AI 에이전트 시스템

모든 AI 기능은 **에이전트 패턴**으로 구현됩니다.

```python
# agents/base_agent.py
class BaseAgent:
    def _call_llm(system_prompt, user_message) → str
    def _call_llm_structured(system_prompt, user_message, ResponseModel) → Pydantic 모델
    def _call_llm_with_tools(system_prompt, user_message, tools) → tool 결과
```

**BaseAgent**는 OpenAI API를 감싸는 추상 클래스로, 세 가지 호출 패턴을 제공합니다:

| 패턴 | 용도 | 사용처 |
|------|------|--------|
| `_call_llm` | 자유 텍스트 응답 | 자기소개서, 경력기술서 |
| `_call_llm_structured` | Pydantic 모델 기반 구조화 출력 | 이력서, 이력서 파싱, 면접 질문 |
| `_call_llm_with_tools` | Function Calling + 도구 실행 | 포트폴리오 벡터 검색 연동 |

**에이전트별 역할**:

- **ResumeWriterAgent**: 채용공고 + 포트폴리오 → 맞춤형 이력서 구조 생성
- **CoverLetterAgent**: 채용공고 + 경력 → 자기소개서 문항별 답변 생성
- **InterviewCoachAgent**: 채용공고 + 경력 → 예상 면접 질문 + 모범 답변
- **PortfolioParserAgent**: 자유 텍스트 → 구조화된 포트폴리오 데이터
- **ResumeParserAgent**: 이력서 파일 텍스트 → 프로필 + 포트폴리오 데이터
- **CareerDescriptionAgent**: 경력 정보 → 상세 경력기술서

### 2.2 벡터 검색 (ChromaDB)

포트폴리오 데이터를 **임베딩 벡터로 변환**하여 의미 기반 검색을 지원합니다.

```
포트폴리오 등록 → OpenAI Embedding (text-embedding-3-small) → ChromaDB 저장
                                                              ↓
채용공고 입력 → 임베딩 변환 → 코사인 유사도 검색 → 관련 포트폴리오 Top-K 반환
```

- **임베딩 모델**: `text-embedding-3-small` (1536차원)
- **거리 함수**: 코사인 유사도
- **검색 대상**: 프로젝트 제목, 역할, 기술 스택, 성과를 결합한 텍스트

이를 통해 채용공고에 가장 관련성 높은 경력을 자동으로 찾아 이력서/자기소개서에 반영합니다.

### 2.3 데이터 저장 (SmartPath)

**SmartPath**는 `pathlib.Path`의 drop-in replacement로, 배포 환경에서의 데이터 영속성 문제를 해결합니다.

```python
# 기존 코드 (변경 없음)
data = USERS_JSON_PATH.read_text()
USERS_JSON_PATH.write_text(json.dumps(users))

# SmartPath가 투명하게 처리:
# - DATABASE_URL 설정 시 → PostgreSQL json_store 테이블에 읽기/쓰기
# - DATABASE_URL 미설정 시 → 로컬 JSON 파일에 읽기/쓰기
```

**PostgreSQL 스키마**:
```sql
CREATE TABLE json_store (
    key TEXT PRIMARY KEY,   -- JSON 파일명 (예: "users", "portfolios")
    data TEXT NOT NULL      -- JSON 문자열
);
```

이 패턴으로 **로컬 개발 시에는 파일**, **배포 시에는 PostgreSQL**을 사용하며, 기존 저장소 서비스 코드를 전혀 수정하지 않아도 됩니다.

### 2.4 이력서 파싱 플로우

```
PDF/DOCX 업로드
    ↓
FileParser: 텍스트 추출 (pdfplumber / python-docx)
    ↓
텍스트 길이 제한 (20,000자)
    ↓
ResumeParserAgent: GPT-4o Structured Output
    ↓
ParsedResume (Pydantic 모델)
    ├── 프로필 정보 (이름, 학력, 경력, 자격증...)  → MyPage 자동 입력
    └── 포트폴리오 목록 (프로젝트, 경력...)        → HomePage 카드 자동 생성
```

### 2.5 이력서 생성 플로우

```
채용공고 입력 + 사용자 프로필
    ↓
VectorStore: 관련 포트폴리오 검색 (Top-5)
    ↓
ResumeWriterAgent: 맞춤형 이력서 구조 생성
    ↓
DocumentGenerator: DOCX/PDF 파일 생성
    ↓
파일 다운로드
```

---

## 3. 프론트엔드 아키텍처

### 기술 스택
- **React 19** + **Vite** (빌드)
- **Tailwind CSS** (유틸리티 기반 스타일링)
- **React Router 7** (SPA 라우팅)

### 상태 관리
- **AuthContext**: 로그인/로그아웃, 사용자 정보
- **ThemeContext**: 다크모드/라이트모드
- **ToastContext**: 알림 메시지

### 페이지 구조

| 경로 | 페이지 | 설명 |
|------|--------|------|
| `/login` | LoginPage | 로그인/회원가입 |
| `/` | HomePage | 포트폴리오/경력 대시보드 |
| `/resume` | ResumePage | AI 이력서 생성 |
| `/cover-letter` | CoverLetterPage | AI 자기소개서 생성 |
| `/interview` | InterviewPage | AI 면접 준비 |
| `/career-desc` | CareerDescPage | AI 경력기술서 생성 |
| `/mypage` | MyPage | 프로필 관리 |

### API 통신
- **Axios** 인스턴스에 `baseURL` 설정
- OpenAI API 키는 클라이언트에서 헤더(`x-api-key`)로 전달
- 파일 업로드는 `multipart/form-data` 사용

---

## 4. 백엔드 아키텍처

### FastAPI 구조
```
backend/main.py          # 앱 생성, 미들웨어, 라우터 등록
backend/api/*.py          # API 엔드포인트 (라우터별 분리)
agents/*.py               # AI 에이전트 (비즈니스 로직)
services/*.py             # 데이터 저장소 및 유틸리티
models/*.py               # Pydantic 데이터 모델
config/settings.py        # 설정 및 경로
```

### 인증
- **이메일 인증**: bcrypt 해시 비밀번호
- **소셜 로그인**: 카카오/네이버 OAuth 2.0
- API 키: OpenAI 키를 클라이언트에서 전달 (서버에 저장하지 않음)

### CORS
```python
allow_origins = ["http://localhost:5173", "http://localhost:3000", FRONTEND_URL]
```

---

## 5. 개발 환경

### 로컬 개발

```bash
# Backend
pip install -r requirements.txt
uvicorn backend.main:app --reload --port 8000

# Frontend
cd frontend && npm install && npm run dev
```

로컬에서는 `DATABASE_URL`이 없으므로 JSON 파일에 데이터가 저장됩니다 (`data/` 디렉토리).

### 배포 환경

| 서비스 | 플랫폼 | 설명 |
|--------|--------|------|
| Backend | Render Web Service | Python FastAPI + PostgreSQL |
| Frontend | Vercel | React SPA (정적 배포) |
| Database | Render PostgreSQL | 데이터 영속 저장소 |

**Vercel API 프록시** (`vercel.json`):
```json
{
  "rewrites": [
    { "source": "/api/:path*", "destination": "https://backend-url.onrender.com/api/:path*" }
  ]
}
```

### 디버깅

- 백엔드 로그: `uvicorn` 출력 또는 Render Logs
- 프론트엔드: 브라우저 DevTools Console
- API 테스트: FastAPI 자동 문서 (`/docs`)

---

## 6. 데이터 흐름 요약

```
[사용자 입력]
    ↓
[React 페이지] ──HTTP──→ [FastAPI 엔드포인트]
                              ↓
                    [AI 에이전트 호출]
                    ┌─────────┼─────────┐
                    ↓         ↓         ↓
              [시스템 프롬프트] [사용자 데이터] [벡터 검색 결과]
                    └─────────┼─────────┘
                              ↓
                    [OpenAI GPT-4o API]
                              ↓
                    [구조화된 응답 (Pydantic)]
                              ↓
[React 페이지] ←──JSON──── [API 응답]
    ↓
[UI 렌더링 / 파일 다운로드]
```
