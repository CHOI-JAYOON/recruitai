import streamlit as st
from agents.resume_writer_agent import ResumeWriterAgent
from services.openai_client import get_openai_client
from services.storage import StorageService
from services.profile_storage import ProfileStorage
from services.document_generator import DocumentGenerator


def show_resume_page():
    st.markdown(
        '<h2 style="font-weight:800; letter-spacing:-0.03em; margin-bottom:0.2rem;">이력서 생성</h2>',
        unsafe_allow_html=True,
    )
    st.markdown(
        '<p style="color:#8B95A1; font-size:0.95rem; margin-bottom:1.5rem;">'
        "포트폴리오를 선택하면 지원 직무에 맞는 이력서를 만들어드려요</p>",
        unsafe_allow_html=True,
    )

    api_key = st.session_state.get("openai_api_key", "")
    storage = StorageService()
    portfolios = storage.load_all()
    username = st.session_state.user["username"]
    profile_storage = ProfileStorage()
    profile = profile_storage.load(username)

    if not portfolios:
        st.markdown(
            '<div style="text-align:center; padding:3rem 0;">'
            '<p style="font-size:2.5rem; margin-bottom:0.5rem;">📄</p>'
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

    # Profile info check
    if not profile.name:
        st.markdown(
            '<div style="background:#FFF8E1; padding:0.8rem 1rem; border-radius:10px; '
            'font-size:0.85rem; color:#B8860B; margin-bottom:1rem;">마이페이지에서 기본 정보를 먼저 등록하세요</div>',
            unsafe_allow_html=True,
        )

    # Show current profile info
    with st.expander("내 기본 정보 (마이페이지에서 수정)", expanded=False):
        info_items = []
        if profile.name:
            info_items.append(f"이름: {profile.name}")
        if profile.email:
            info_items.append(f"이메일: {profile.email}")
        if profile.phone:
            info_items.append(f"전화번호: {profile.phone}")
        if profile.github:
            info_items.append(f"GitHub: {profile.github}")
        if profile.education:
            for edu in profile.education:
                info_items.append(f"학력: {edu.school} {edu.major} ({edu.degree})")
        if profile.work_experience:
            for work in profile.work_experience:
                info_items.append(f"경력: {work.company} {work.position}")
        if profile.certificates:
            for cert in profile.certificates:
                info_items.append(f"자격증: {cert.name}")
        if profile.awards:
            for award in profile.awards:
                info_items.append(f"수상: {award.name}")

        if info_items:
            for item in info_items:
                st.markdown(f"- {item}")
        else:
            st.markdown("등록된 정보가 없습니다.")

    st.divider()

    # Target role
    target_role = st.text_input("지원 직무", key="resume_target", placeholder="예: 백엔드 개발자, AI 엔지니어")

    st.divider()

    # Portfolio selection
    st.markdown('<p style="font-weight:700; font-size:1rem;">포트폴리오 선택</p>', unsafe_allow_html=True)
    selected_ids = []
    for p in portfolios:
        label = f"**{p.title}**  ·  {p.role}  ·  {p.period}"
        if st.checkbox(label, key=f"resume_sel_{p.id}"):
            selected_ids.append(p.id)

    st.divider()

    if st.button(
        "이력서 생성하기",
        disabled=not selected_ids or not profile.name or not target_role,
        use_container_width=True,
        type="primary",
    ):
        selected_portfolios = storage.get_by_ids(selected_ids)

        with st.spinner("AI가 이력서를 작성하고 있어요..."):
            client = get_openai_client(api_key)
            agent = ResumeWriterAgent(client)
            tailored = agent.tailor(selected_portfolios, target_role, profile)
            st.session_state.tailored_resume = tailored
            st.session_state.resume_profile = profile
            st.session_state.resume_portfolios = selected_portfolios
            st.session_state.resume_target_role = target_role

    # Show results
    if st.session_state.get("tailored_resume"):
        tailored = st.session_state.tailored_resume
        saved_profile = st.session_state.resume_profile
        selected_portfolios = st.session_state.resume_portfolios

        st.divider()
        st.markdown('<p style="font-weight:700; font-size:1rem;">미리보기</p>', unsafe_allow_html=True)

        # Preview card
        contact_parts = [x for x in [saved_profile.email, saved_profile.phone, saved_profile.github, saved_profile.linkedin] if x]
        st.markdown(
            f'<div style="background:#F9FAFB; border:1px solid #E5E8EB; border-radius:14px; padding:1.5rem; margin-bottom:1rem;">'
            f'<h3 style="margin:0 0 0.3rem; font-weight:800;">{saved_profile.name}</h3>'
            f'<p style="color:#6B7684; font-size:0.85rem; margin:0;">{" · ".join(contact_parts)}</p>'
            f'</div>',
            unsafe_allow_html=True,
        )

        st.markdown(f"**Professional Summary**\n\n{tailored.summary}")

        portfolio_map = {p.id: p for p in selected_portfolios}
        for entry in tailored.entries:
            p = portfolio_map.get(entry.portfolio_id)
            if not p:
                continue
            st.markdown(f"**{p.title}** · {p.role} · {p.period}")
            st.write(entry.tailored_description)
            for ach in entry.tailored_achievements:
                st.markdown(f"- {ach}")

        st.divider()
        doc_gen = DocumentGenerator()
        docx_buffer = doc_gen.generate_docx(saved_profile, tailored, selected_portfolios)

        st.download_button(
            "이력서 다운로드 (DOCX)",
            data=docx_buffer,
            file_name=f"{saved_profile.name}_이력서.docx",
            mime="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            use_container_width=True,
        )
