import streamlit as st
from models.portfolio import Portfolio
from agents.portfolio_parser_agent import PortfolioParserAgent
from services.openai_client import get_openai_client
from services.storage import StorageService
from services.vector_store import VectorStoreService


def get_services():
    api_key = st.session_state.get("openai_api_key", "")
    storage = StorageService()
    vector_store = None
    if api_key:
        vector_store = VectorStoreService(api_key)
    return storage, vector_store


def show_home_page():
    mode = st.session_state.get("home_mode", "list")
    if mode == "add":
        _render_add_mode()
    elif mode == "edit":
        _render_edit_mode()
    else:
        _render_list_mode()


def _render_list_mode():
    storage, vector_store = get_services()
    portfolios = storage.load_all()

    # Delete confirmation
    if st.session_state.get("confirm_delete_id"):
        _render_delete_confirm(storage, vector_store)
        return

    col_title, col_btn = st.columns([4, 1])
    with col_title:
        st.markdown(
            '<h2 style="font-weight:800; letter-spacing:-0.03em; margin-bottom:0;">내 포트폴리오</h2>',
            unsafe_allow_html=True,
        )
    with col_btn:
        st.markdown("")
        if st.button("+ 추가", use_container_width=True, type="primary"):
            st.session_state.home_mode = "add"
            st.rerun()

    st.markdown(
        f'<p style="color:#8B95A1; font-size:0.9rem; margin-top:0.3rem;">'
        f'총 {len(portfolios)}개의 프로젝트</p>',
        unsafe_allow_html=True,
    )

    if not portfolios:
        st.markdown(
            '<div style="text-align:center; padding:5rem 0;">'
            '<p style="font-size:3rem; margin-bottom:0.8rem;">📋</p>'
            '<p style="color:#4E5968; font-size:1.05rem; font-weight:600;">아직 등록된 포트폴리오가 없어요</p>'
            '<p style="color:#8B95A1; font-size:0.9rem;">우측 상단 \'+ 추가\' 버튼을 눌러<br>첫 프로젝트를 등록해보세요</p>'
            "</div>",
            unsafe_allow_html=True,
        )
        return

    for p in portfolios:
        _render_portfolio_card(p, storage, vector_store)


def _render_portfolio_card(p: Portfolio, storage, vector_store):
    tech_tags = ""
    if p.tech_stack:
        tech_tags = " ".join(
            [
                f'<span style="display:inline-block; background:#EBF4FF; color:#3182F6; '
                f'padding:0.15rem 0.55rem; border-radius:100px; font-size:0.73rem; '
                f'font-weight:500; margin:0.1rem 0.15rem 0.1rem 0;">{t}</span>'
                for t in p.tech_stack[:6]
            ]
        )
        if len(p.tech_stack) > 6:
            tech_tags += f'<span style="color:#8B95A1; font-size:0.73rem;"> +{len(p.tech_stack)-6}</span>'

    achievements_html = ""
    if p.achievements:
        items = "".join(
            [f'<li style="margin-bottom:0.2rem;">{a}</li>' for a in p.achievements[:3]]
        )
        achievements_html = f'<ul style="margin:0.5rem 0 0; padding-left:1.2rem; color:#4E5968; font-size:0.85rem;">{items}</ul>'
        if len(p.achievements) > 3:
            achievements_html += f'<p style="color:#8B95A1; font-size:0.8rem; margin:0.3rem 0 0;">외 {len(p.achievements)-3}개</p>'

    desc_preview = p.description[:120] + "..." if len(p.description) > 120 else p.description

    with st.container(border=True):
        st.markdown(
            f'<div>'
            f'<p style="font-size:1.05rem; font-weight:700; color:#191F28; margin:0 0 0.25rem;">{p.title}</p>'
            f'<p style="font-size:0.82rem; color:#6B7684; margin:0;">{p.role}  ·  {p.period}</p>'
            f'<p style="font-size:0.88rem; color:#4E5968; margin:0.6rem 0 0.4rem; line-height:1.5;">{desc_preview}</p>'
            f'<div style="margin:0.4rem 0;">{tech_tags}</div>'
            f'{achievements_html}'
            f'</div>',
            unsafe_allow_html=True,
        )

        col_space, col_edit, col_del = st.columns([6, 1, 1])
        with col_edit:
            if st.button("수정", key=f"edit_{p.id}"):
                st.session_state.home_mode = "edit"
                st.session_state.editing_portfolio_id = p.id
                st.rerun()
        with col_del:
            if st.button("삭제", key=f"del_{p.id}"):
                st.session_state.confirm_delete_id = p.id
                st.session_state.confirm_delete_title = p.title
                st.rerun()


def _render_delete_confirm(storage, vector_store):
    pid = st.session_state.confirm_delete_id
    title = st.session_state.get("confirm_delete_title", "")

    st.markdown(
        f'<div style="text-align:center; padding:3rem 0;">'
        f'<p style="font-size:2.5rem; margin-bottom:0.8rem;">⚠️</p>'
        f'<p style="font-size:1.1rem; font-weight:700; color:#191F28; margin-bottom:0.5rem;">정말 삭제하시겠습니까?</p>'
        f'<p style="color:#6B7684; font-size:0.9rem;">\'{title}\' 포트폴리오가 영구적으로 삭제됩니다.</p>'
        f'</div>',
        unsafe_allow_html=True,
    )

    col1, col2, col3 = st.columns([2, 1, 1])
    with col2:
        if st.button("취소", use_container_width=True):
            st.session_state.confirm_delete_id = None
            st.session_state.confirm_delete_title = None
            st.rerun()
    with col3:
        if st.button("삭제 확인", use_container_width=True, type="primary"):
            storage.delete(pid)
            if vector_store:
                vector_store.delete_portfolio(pid)
            st.session_state.confirm_delete_id = None
            st.session_state.confirm_delete_title = None
            st.rerun()


def _render_edit_mode():
    storage, vector_store = get_services()
    pid = st.session_state.get("editing_portfolio_id")
    if not pid:
        st.session_state.home_mode = "list"
        st.rerun()
        return

    portfolio = storage.get_by_id(pid)
    if not portfolio:
        st.session_state.home_mode = "list"
        st.rerun()
        return

    col_back, col_title = st.columns([1, 5])
    with col_back:
        if st.button("← 돌아가기"):
            st.session_state.home_mode = "list"
            st.session_state.editing_portfolio_id = None
            st.rerun()
    with col_title:
        st.markdown(
            '<h2 style="font-weight:800; letter-spacing:-0.03em; margin-bottom:0;">포트폴리오 수정</h2>',
            unsafe_allow_html=True,
        )

    with st.container(border=True):
        col1, col2 = st.columns(2)
        with col1:
            title = st.text_input("제목", value=portfolio.title, key="edit_title")
            role = st.text_input("역할", value=portfolio.role, key="edit_role")
        with col2:
            period = st.text_input("기간", value=portfolio.period, key="edit_period")
            tech = st.text_input("기술 스택", value=", ".join(portfolio.tech_stack), key="edit_tech", placeholder="쉼표로 구분")

        description = st.text_area("설명", value=portfolio.description, height=120, key="edit_desc")
        achievements_text = st.text_area("성과", value="\n".join(portfolio.achievements), height=80, key="edit_ach", placeholder="줄바꿈으로 구분")

        if st.button("저장하기", key="save_edit", use_container_width=True, type="primary"):
            updated = Portfolio(
                id=portfolio.id,
                title=title, period=period, role=role, description=description,
                tech_stack=[t.strip() for t in tech.split(",") if t.strip()],
                achievements=[a.strip() for a in achievements_text.split("\n") if a.strip()],
            )
            storage.save(updated)
            if vector_store:
                vector_store.upsert_portfolio(updated)
            st.session_state.home_mode = "list"
            st.session_state.editing_portfolio_id = None
            st.rerun()


def _render_add_mode():
    api_key = st.session_state.get("openai_api_key", "")
    storage, vector_store = get_services()

    col_back, col_title = st.columns([1, 5])
    with col_back:
        if st.button("← 돌아가기"):
            st.session_state.home_mode = "list"
            st.session_state.parsed_portfolios = []
            st.rerun()
    with col_title:
        st.markdown(
            '<h2 style="font-weight:800; letter-spacing:-0.03em; margin-bottom:0;">포트폴리오 추가</h2>',
            unsafe_allow_html=True,
        )

    st.markdown(
        '<p style="color:#8B95A1; font-size:0.9rem; margin-bottom:1.5rem;">'
        "프로젝트 경험을 자유롭게 입력하면 AI가 구조화해줘요</p>",
        unsafe_allow_html=True,
    )

    if not api_key:
        st.markdown(
            '<div style="background:#FFF8E1; padding:0.8rem 1rem; border-radius:10px; '
            'font-size:0.85rem; color:#B8860B; margin-bottom:1rem;">마이페이지 &gt; API 설정에서 OpenAI API Key를 등록하세요</div>',
            unsafe_allow_html=True,
        )

    raw_text = st.text_area(
        "프로젝트 설명",
        height=200,
        placeholder=(
            "프로젝트에 대해 자유롭게 설명하세요.\n\n"
            "예: 2024년 상반기에 사내 챗봇 시스템을 개발했습니다. "
            "Python과 FastAPI로 백엔드를 구축하고, "
            "OpenAI API를 연동하여 RAG 기반 질의응답 시스템을 만들었습니다. "
            "기존 대비 고객 응답 시간을 70% 단축했습니다..."
        ),
        label_visibility="collapsed",
    )

    col1, col2 = st.columns([3, 1])
    with col2:
        parse_btn = st.button("AI 분석", disabled=not api_key, use_container_width=True, type="primary")

    if parse_btn:
        if not raw_text.strip():
            st.warning("텍스트를 입력하세요.")
        else:
            with st.spinner("AI가 포트폴리오를 분석하고 있어요..."):
                client = get_openai_client(api_key)
                agent = PortfolioParserAgent(client)
                parsed = agent.parse(raw_text)
                st.session_state.parsed_portfolios = parsed

    if st.session_state.get("parsed_portfolios"):
        st.divider()
        st.markdown(
            '<p style="font-weight:700; font-size:1rem; margin-bottom:0.8rem;">분석 결과</p>',
            unsafe_allow_html=True,
        )

        for i, p in enumerate(st.session_state.parsed_portfolios):
            with st.container(border=True):
                st.markdown(
                    f'<p style="font-weight:600; color:#3182F6; font-size:0.85rem; margin-bottom:0.5rem;">프로젝트 {i+1}</p>',
                    unsafe_allow_html=True,
                )
                col1, col2 = st.columns(2)
                with col1:
                    title = st.text_input("제목", value=p.title, key=f"p_title_{i}")
                    role = st.text_input("역할", value=p.role, key=f"p_role_{i}")
                with col2:
                    period = st.text_input("기간", value=p.period, key=f"p_period_{i}")
                    tech = st.text_input("기술 스택", value=", ".join(p.tech_stack), key=f"p_tech_{i}", placeholder="쉼표로 구분")

                description = st.text_area("설명", value=p.description, height=100, key=f"p_desc_{i}")
                achievements_text = st.text_area("성과", value="\n".join(p.achievements), height=80, key=f"p_ach_{i}", placeholder="줄바꿈으로 구분")

                if st.button("저장하기", key=f"save_{i}", use_container_width=True, type="primary"):
                    portfolio = Portfolio(
                        title=title, period=period, role=role, description=description,
                        tech_stack=[t.strip() for t in tech.split(",") if t.strip()],
                        achievements=[a.strip() for a in achievements_text.split("\n") if a.strip()],
                    )
                    storage.save(portfolio)
                    if vector_store:
                        vector_store.upsert_portfolio(portfolio)
                    st.session_state.parsed_portfolios = []
                    st.session_state.home_mode = "list"
                    st.rerun()

    if not st.session_state.get("parsed_portfolios"):
        st.divider()
        st.markdown(
            '<p style="color:#8B95A1; font-size:0.85rem; text-align:center;">또는 직접 입력하기</p>',
            unsafe_allow_html=True,
        )

        with st.container(border=True):
            col1, col2 = st.columns(2)
            with col1:
                title = st.text_input("제목", key="m_title", placeholder="프로젝트명")
                role = st.text_input("역할", key="m_role", placeholder="예: 백엔드 개발자")
            with col2:
                period = st.text_input("기간", key="m_period", placeholder="예: 2024.01 - 2024.06")
                tech = st.text_input("기술 스택", key="m_tech", placeholder="쉼표로 구분")

            description = st.text_area("설명", key="m_desc", height=100, placeholder="프로젝트 상세 설명")
            achievements = st.text_area("성과", key="m_ach", height=80, placeholder="줄바꿈으로 구분")

            if st.button("저장하기", key="m_save", use_container_width=True, type="primary"):
                if not title:
                    st.warning("제목을 입력하세요.")
                else:
                    portfolio = Portfolio(
                        title=title, period=period, role=role, description=description,
                        tech_stack=[t.strip() for t in tech.split(",") if t.strip()],
                        achievements=[a.strip() for a in achievements.split("\n") if a.strip()],
                    )
                    storage.save(portfolio)
                    if vector_store:
                        vector_store.upsert_portfolio(portfolio)
                    st.session_state.home_mode = "list"
                    st.rerun()
