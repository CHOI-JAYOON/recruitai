import streamlit as st
from agents.interview_coach_agent import InterviewCoachAgent
from models.interview import InterviewQuestion
from services.openai_client import get_openai_client
from services.storage import StorageService


def show_interview_page():
    st.markdown(
        '<h2 style="font-weight:800; letter-spacing:-0.03em; margin-bottom:0.2rem;">면접 준비</h2>',
        unsafe_allow_html=True,
    )
    st.markdown(
        '<p style="color:#8B95A1; font-size:0.95rem; margin-bottom:1.5rem;">'
        "예상 질문을 생성하고 모의 면접으로 연습하세요</p>",
        unsafe_allow_html=True,
    )

    api_key = st.session_state.get("openai_api_key", "")
    storage = StorageService()
    portfolios = storage.load_all()

    if not portfolios:
        st.markdown(
            '<div style="text-align:center; padding:3rem 0;">'
            '<p style="font-size:2.5rem; margin-bottom:0.5rem;">🎯</p>'
            '<p style="color:#8B95A1;">포트폴리오가 없습니다</p>'
            '<p style="color:#B0B8C1; font-size:0.85rem;">먼저 홈에서 포트폴리오를 추가하세요</p></div>',
            unsafe_allow_html=True,
        )
        return

    if not api_key:
        st.markdown(
            '<div style="background:#FFF8E1; padding:0.8rem 1rem; border-radius:10px; '
            'font-size:0.85rem; color:#B8860B;">마이페이지 &gt; API 설정에서 OpenAI API Key를 등록하세요</div>',
            unsafe_allow_html=True,
        )
        return

    tab_gen, tab_mock = st.tabs(["질문 생성", "모의 면접"])

    with tab_gen:
        _render_gen_tab(api_key, storage, portfolios)

    with tab_mock:
        _render_mock_tab(api_key, storage, portfolios)


CAT_COLORS = {
    "behavioral": "#3182F6",
    "technical": "#00C471",
    "situational": "#F59E0B",
    "portfolio": "#8B5CF6",
    "resume": "#EC4899",
    "solution": "#F97316",
}
CAT_LABELS = {
    "behavioral": "인성",
    "technical": "기술",
    "situational": "상황",
    "portfolio": "포트폴리오",
    "resume": "이력서",
    "solution": "솔루션",
}
DIFF_LABELS = {"easy": "쉬움", "medium": "보통", "hard": "어려움"}


def _render_gen_tab(api_key, storage, portfolios):
    job_desc = st.text_area(
        "직무 설명",
        height=150,
        key="iv_job_desc",
        placeholder="지원하는 직무의 설명을 입력하세요...",
    )

    with st.expander("추가 데이터 연동 (선택)"):
        use_cl = st.checkbox(
            "자기소개서 답변 포함",
            key="iv_use_cl",
            help="자기소개서에서 생성한 답변을 기반으로 질문 생성",
        )
        use_resume = st.checkbox(
            "이력서 요약 포함",
            key="iv_use_resume",
            help="이력서 생성 시 만든 요약을 기반으로 질문 생성",
        )

    count = st.slider("질문 수", min_value=3, max_value=15, value=7, key="iv_count")

    if st.button("질문 생성하기", disabled=not job_desc.strip(), use_container_width=True, type="primary"):
        cl_answers = None
        resume_summary = None

        if use_cl:
            cl_questions = st.session_state.get("cl_questions", [])
            cl_answers = [q for q in cl_questions if q.get("answer")]

        if use_resume:
            tailored = st.session_state.get("tailored_resume")
            if tailored:
                resume_summary = tailored.summary

        with st.spinner("AI가 면접 질문을 생성하고 있어요..."):
            client = get_openai_client(api_key)
            agent = InterviewCoachAgent(client)
            questions = agent.generate_questions(
                portfolios, job_desc, count, cl_answers, resume_summary
            )
            st.session_state.iv_questions = questions
            st.session_state.iv_current = 0
            st.session_state.iv_feedback_list = []

    if st.session_state.get("iv_questions"):
        st.divider()
        st.markdown('<p style="font-weight:700; font-size:1rem;">생성된 면접 질문</p>', unsafe_allow_html=True)

        for i, q in enumerate(st.session_state.iv_questions, 1):
            color = CAT_COLORS.get(q.category, "#8B95A1")
            cat = CAT_LABELS.get(q.category, q.category)
            diff = DIFF_LABELS.get(q.difficulty, q.difficulty)

            st.markdown(
                f'<div style="padding:0.8rem 1rem; border:1px solid #E5E8EB; border-radius:12px; margin-bottom:0.5rem;">'
                f'<span style="background:{color}15; color:{color}; padding:0.15rem 0.5rem; '
                f'border-radius:100px; font-size:0.75rem; font-weight:600;">{cat}</span> '
                f'<span style="background:#F2F4F6; color:#6B7684; padding:0.15rem 0.5rem; '
                f'border-radius:100px; font-size:0.75rem;">{diff}</span>'
                f'<p style="margin:0.5rem 0 0; font-weight:500; font-size:0.9rem;">{i}. {q.question}</p>'
                f'</div>',
                unsafe_allow_html=True,
            )

        st.markdown("")
        if st.button("이 질문들로 모의 면접 시작", use_container_width=True, type="primary"):
            st.session_state.iv_current = 0
            st.session_state.iv_feedback_list = []
            st.rerun()


def _render_mock_tab(api_key, storage, portfolios):
    questions = st.session_state.get("iv_questions", [])
    if not questions:
        st.markdown(
            '<div style="text-align:center; padding:3rem 0;">'
            '<p style="color:#8B95A1;">먼저 \'질문 생성\' 탭에서 질문을 만드세요</p></div>',
            unsafe_allow_html=True,
        )
        return

    current = st.session_state.get("iv_current", 0)
    feedback_list = st.session_state.get("iv_feedback_list", [])

    if current >= len(questions):
        _show_summary(questions, feedback_list)
        return

    q = questions[current]
    st.progress((current) / len(questions))

    st.markdown(
        f'<p style="color:#6B7684; font-size:0.85rem; font-weight:500;">질문 {current + 1} / {len(questions)}</p>',
        unsafe_allow_html=True,
    )

    cat = CAT_LABELS.get(q.category, q.category)
    color = CAT_COLORS.get(q.category, "#3182F6")

    st.markdown(
        f'<div style="background:#F9FAFB; border:1px solid #E5E8EB; border-radius:14px; padding:1.2rem; margin-bottom:1rem;">'
        f'<span style="color:{color}; font-size:0.8rem; font-weight:600;">{cat} · {q.difficulty}</span>'
        f'<p style="font-size:1.1rem; font-weight:600; margin:0.5rem 0 0;">{q.question}</p>'
        f'</div>',
        unsafe_allow_html=True,
    )

    if q.suggested_portfolio_id:
        ref = storage.get_by_id(q.suggested_portfolio_id)
        if ref:
            st.caption(f"관련 포트폴리오: {ref.title}")

    user_answer = st.text_area(
        "답변",
        height=200,
        key=f"iv_answer_{current}",
        placeholder="면접관에게 답변하듯이 작성하세요...",
        label_visibility="collapsed",
    )

    col1, col2, col3 = st.columns([2, 1, 1])
    with col1:
        submit = st.button("답변 제출", disabled=not user_answer.strip(), use_container_width=True, type="primary")
    with col2:
        skip = st.button("건너뛰기", use_container_width=True)
    with col3:
        end = st.button("면접 종료", use_container_width=True)

    if submit:
        with st.spinner("AI가 답변을 평가하고 있어요..."):
            client = get_openai_client(api_key)
            agent = InterviewCoachAgent(client)
            feedback = agent.evaluate_answer(q, user_answer, portfolios)
            st.session_state.iv_feedback_list.append(
                {"question": q, "answer": user_answer, "feedback": feedback}
            )

            st.divider()

            score_color = "#00C471" if feedback.score >= 7 else "#F59E0B" if feedback.score >= 5 else "#F04452"
            st.markdown(
                f'<div style="text-align:center; margin-bottom:1rem;">'
                f'<span style="font-size:2rem; font-weight:800; color:{score_color};">{feedback.score}</span>'
                f'<span style="color:#8B95A1; font-size:1rem;">/10</span></div>',
                unsafe_allow_html=True,
            )

            col_s, col_i = st.columns(2)
            with col_s:
                st.markdown("**강점**")
                for s in feedback.strengths:
                    st.markdown(f"- {s}")
            with col_i:
                st.markdown("**개선점**")
                for imp in feedback.improvements:
                    st.markdown(f"- {imp}")

            with st.expander("모범 답변 보기"):
                st.write(feedback.revised_answer)

            if st.button("다음 질문", key="next_q", use_container_width=True, type="primary"):
                st.session_state.iv_current = current + 1
                st.rerun()

    if skip:
        st.session_state.iv_current = current + 1
        st.rerun()
    if end:
        st.session_state.iv_current = len(questions)
        st.rerun()


def _show_summary(questions, feedback_list):
    st.markdown('<p style="font-weight:700; font-size:1.2rem;">모의 면접 결과</p>', unsafe_allow_html=True)

    if not feedback_list:
        st.info("제출된 답변이 없습니다.")
        if st.button("처음부터 다시", use_container_width=True, type="primary"):
            st.session_state.iv_current = 0
            st.session_state.iv_feedback_list = []
            st.rerun()
        return

    scores = [f["feedback"].score for f in feedback_list]
    avg = sum(scores) / len(scores)

    col1, col2, col3 = st.columns(3)
    col1.metric("평균 점수", f"{avg:.1f}/10")
    col2.metric("답변 수", f"{len(feedback_list)}/{len(questions)}")
    col3.metric("최고 점수", f"{max(scores)}/10")

    st.divider()

    import pandas as pd
    chart_data = pd.DataFrame({"질문": [f"Q{i+1}" for i in range(len(scores))], "점수": scores})
    st.bar_chart(chart_data.set_index("질문"))

    st.markdown('<p style="font-weight:700; font-size:1rem;">상세 결과</p>', unsafe_allow_html=True)
    for i, f in enumerate(feedback_list, 1):
        with st.expander(f"Q{i}. {f['question'].question} — {f['feedback'].score}/10"):
            st.markdown(f"**내 답변:** {f['answer'][:300]}...")
            st.markdown("**강점:** " + ", ".join(f["feedback"].strengths))
            st.markdown("**개선점:** " + ", ".join(f["feedback"].improvements))
            st.markdown(f"**모범 답변:** {f['feedback'].revised_answer}")

    if st.button("처음부터 다시", use_container_width=True, type="primary"):
        st.session_state.iv_current = 0
        st.session_state.iv_feedback_list = []
        st.rerun()
