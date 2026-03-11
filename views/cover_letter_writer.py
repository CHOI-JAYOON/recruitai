import streamlit as st
from models.cover_letter import CoverLetterQuestion
from agents.cover_letter_agent import CoverLetterAgent
from services.openai_client import get_openai_client
from services.storage import StorageService
from services.vector_store import VectorStoreService
from services.document_generator import DocumentGenerator


def show_cover_letter_page():
    st.markdown(
        '<h2 style="font-weight:800; letter-spacing:-0.03em; margin-bottom:0.2rem;">자기소개서 작성</h2>',
        unsafe_allow_html=True,
    )
    st.markdown(
        '<p style="color:#8B95A1; font-size:0.95rem; margin-bottom:1.5rem;">'
        "문항을 입력하면 포트폴리오를 기반으로 답변을 생성해요</p>",
        unsafe_allow_html=True,
    )

    api_key = st.session_state.get("openai_api_key", "")
    storage = StorageService()
    portfolios = storage.load_all()

    if not portfolios:
        st.markdown(
            '<div style="text-align:center; padding:3rem 0;">'
            '<p style="font-size:2.5rem; margin-bottom:0.5rem;">✍️</p>'
            '<p style="color:#8B95A1;">포트폴리오가 없습니다</p>'
            '<p style="color:#B0B8C1; font-size:0.85rem;">먼저 포트폴리오 관리에서 추가하세요</p></div>',
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

    job_desc = st.text_area(
        "직무 설명 (선택)",
        height=100,
        key="cl_job_desc",
        placeholder="지원하는 회사/직무의 설명을 붙여넣으면 더 정확한 답변을 생성해요",
    )

    st.divider()

    if "cl_questions" not in st.session_state:
        st.session_state.cl_questions = [{"question": "", "max_length": 500, "answer": ""}]

    st.markdown('<p style="font-weight:700; font-size:1rem;">자기소개서 문항</p>', unsafe_allow_html=True)

    for i, q in enumerate(st.session_state.cl_questions):
        with st.container(border=True):
            st.markdown(
                f'<p style="font-weight:600; color:#3182F6; font-size:0.85rem;">문항 {i + 1}</p>',
                unsafe_allow_html=True,
            )
            question_text = st.text_input(
                "질문",
                value=q["question"],
                key=f"cl_q_{i}",
                placeholder="예: 지원 동기를 작성해주세요",
                label_visibility="collapsed",
            )
            col1, col2 = st.columns([3, 1])
            with col1:
                max_len = st.number_input(
                    "글자 수 제한",
                    min_value=100, max_value=3000, value=q["max_length"],
                    step=100, key=f"cl_len_{i}",
                )
            with col2:
                st.markdown("")
                generate = st.button("답변 생성", key=f"cl_gen_{i}", use_container_width=True, type="primary")

            st.session_state.cl_questions[i]["question"] = question_text
            st.session_state.cl_questions[i]["max_length"] = max_len

            if generate:
                if not question_text.strip():
                    st.warning("질문을 입력하세요.")
                else:
                    with st.spinner("AI가 포트폴리오를 검색하고 답변을 생성해요..."):
                        client = get_openai_client(api_key)
                        vector_store = VectorStoreService(api_key)
                        agent = CoverLetterAgent(client, vector_store, storage)
                        cq = CoverLetterQuestion(question=question_text, max_length=max_len)
                        result = agent.answer_question(cq, job_desc)
                        st.session_state.cl_questions[i]["answer"] = result.answer
                        st.session_state.cl_questions[i]["refs"] = result.relevant_portfolios
                        st.rerun()

            if q.get("answer"):
                answer = st.text_area(
                    "생성된 답변",
                    value=q["answer"],
                    height=200,
                    key=f"cl_ans_{i}",
                    label_visibility="collapsed",
                )
                st.session_state.cl_questions[i]["answer"] = answer

                if q.get("refs"):
                    ref_portfolios = storage.get_by_ids(q["refs"])
                    ref_names = [p.title for p in ref_portfolios]
                    if ref_names:
                        tags = " ".join(
                            [f'<span style="background:#EBF4FF; color:#3182F6; padding:0.15rem 0.5rem; '
                             f'border-radius:100px; font-size:0.75rem; font-weight:500;">{n}</span>'
                             for n in ref_names]
                        )
                        st.markdown(f"참조된 포트폴리오: {tags}", unsafe_allow_html=True)

    col1, col2 = st.columns(2)
    with col1:
        if st.button("+ 문항 추가", use_container_width=True):
            st.session_state.cl_questions.append({"question": "", "max_length": 500, "answer": ""})
            st.rerun()
    with col2:
        if len(st.session_state.cl_questions) > 1:
            if st.button("- 마지막 문항 삭제", use_container_width=True):
                st.session_state.cl_questions.pop()
                st.rerun()

    st.divider()
    answers_with_content = [q for q in st.session_state.cl_questions if q.get("answer")]
    if answers_with_content:
        doc_gen = DocumentGenerator()
        docx_buffer = doc_gen.generate_cover_letter_docx(answers_with_content)
        st.download_button(
            "자기소개서 다운로드 (DOCX)",
            data=docx_buffer,
            file_name="자기소개서.docx",
            mime="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            use_container_width=True,
        )
