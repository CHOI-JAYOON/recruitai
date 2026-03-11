import streamlit as st
from datetime import datetime
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


def show_portfolio_page():
    st.markdown(
        '<h2 style="font-weight:800; letter-spacing:-0.03em; margin-bottom:0.2rem;">포트폴리오 관리</h2>',
        unsafe_allow_html=True,
    )
    st.markdown(
        '<p style="color:#8B95A1; font-size:0.95rem; margin-bottom:1.5rem;">'
        "프로젝트 경험을 입력하면 AI가 자동으로 구조화합니다</p>",
        unsafe_allow_html=True,
    )

    api_key = st.session_state.get("openai_api_key", "")
    storage, vector_store = get_services()

    tab_add, tab_list = st.tabs(["새로 추가", "내 포트폴리오"])

    with tab_add:
        _render_add_tab(api_key, storage, vector_store)

    with tab_list:
        _render_list_tab(storage, vector_store)


def _render_add_tab(api_key, storage, vector_store):
    st.markdown("")
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
    )

    col1, col2 = st.columns([3, 1])
    with col2:
        parse_btn = st.button(
            "AI 분석",
            disabled=not api_key,
            use_container_width=True,
            type="primary",
        )

    if not api_key:
        st.markdown(
            '<div style="background:#FFF8E1; padding:0.8rem 1rem; border-radius:10px; '
            'font-size:0.85rem; color:#B8860B;">사이드바에서 OpenAI API Key를 입력하세요</div>',
            unsafe_allow_html=True,
        )

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
            '<p style="font-weight:700; font-size:1rem; margin-bottom:0.5rem;">분석 결과</p>',
            unsafe_allow_html=True,
        )

        for i, p in enumerate(st.session_state.parsed_portfolios):
            with st.expander(f"{p.title}", expanded=True):
                col1, col2 = st.columns(2)
                with col1:
                    title = st.text_input("제목", value=p.title, key=f"p_title_{i}")
                    role = st.text_input("역할", value=p.role, key=f"p_role_{i}")
                with col2:
                    period = st.text_input("기간", value=p.period, key=f"p_period_{i}")
                    tech = st.text_input(
                        "기술 스택",
                        value=", ".join(p.tech_stack),
                        key=f"p_tech_{i}",
                        placeholder="쉼표로 구분",
                    )

                description = st.text_area(
                    "설명", value=p.description, height=100, key=f"p_desc_{i}"
                )
                achievements_text = st.text_area(
                    "성과",
                    value="\n".join(p.achievements),
                    height=80,
                    key=f"p_ach_{i}",
                    placeholder="줄바꿈으로 구분",
                )
                links_text = st.text_input(
                    "링크",
                    value=", ".join(p.links),
                    key=f"p_links_{i}",
                    placeholder="쉼표로 구분",
                )

                if st.button("저장하기", key=f"save_{i}", use_container_width=True, type="primary"):
                    portfolio = Portfolio(
                        title=title,
                        period=period,
                        role=role,
                        description=description,
                        tech_stack=[t.strip() for t in tech.split(",") if t.strip()],
                        achievements=[a.strip() for a in achievements_text.split("\n") if a.strip()],
                        links=[l.strip() for l in links_text.split(",") if l.strip()],
                    )
                    storage.save(portfolio)
                    if vector_store:
                        vector_store.upsert_portfolio(portfolio)
                    st.success(f"'{title}' 저장 완료!")


def _render_list_tab(storage, vector_store):
    portfolios = storage.load_all()
    if not portfolios:
        st.markdown(
            '<div style="text-align:center; padding:3rem 0;">'
            '<p style="font-size:2.5rem; margin-bottom:0.5rem;">📂</p>'
            '<p style="color:#8B95A1; font-size:0.95rem;">아직 포트폴리오가 없습니다</p>'
            '<p style="color:#B0B8C1; font-size:0.85rem;">\'새로 추가\' 탭에서 첫 포트폴리오를 만들어보세요</p>'
            "</div>",
            unsafe_allow_html=True,
        )
        return

    st.markdown(
        f'<p style="color:#6B7684; font-size:0.85rem; margin:0.5rem 0 1rem;">총 {len(portfolios)}개</p>',
        unsafe_allow_html=True,
    )

    for p in portfolios:
        with st.expander(f"{p.title}  ·  {p.role}  ·  {p.period}"):
            st.markdown(f"**설명**\n\n{p.description}")

            if p.tech_stack:
                tech_tags = " ".join(
                    [
                        f'<span style="display:inline-block; background:#EBF4FF; color:#3182F6; '
                        f'padding:0.2rem 0.6rem; border-radius:100px; font-size:0.78rem; '
                        f'font-weight:500; margin:0.15rem 0.2rem;">{t}</span>'
                        for t in p.tech_stack
                    ]
                )
                st.markdown(f"**기술 스택**\n\n{tech_tags}", unsafe_allow_html=True)

            if p.achievements:
                st.markdown("**주요 성과**")
                for ach in p.achievements:
                    st.markdown(f"- {ach}")

            if p.links:
                st.markdown(f"**링크:** {', '.join(p.links)}")

            st.caption(f"생성 {p.created_at[:10]}  ·  수정 {p.updated_at[:10]}")

            col1, col2 = st.columns(2)
            with col1:
                if st.button("수정", key=f"edit_{p.id}", use_container_width=True):
                    st.session_state[f"editing_{p.id}"] = True
                    st.rerun()
            with col2:
                if st.button("삭제", key=f"del_{p.id}", use_container_width=True):
                    storage.delete(p.id)
                    if vector_store:
                        vector_store.delete_portfolio(p.id)
                    st.rerun()

            if st.session_state.get(f"editing_{p.id}"):
                st.divider()
                c1, c2 = st.columns(2)
                with c1:
                    ed_title = st.text_input("제목", value=p.title, key=f"ed_title_{p.id}")
                    ed_role = st.text_input("역할", value=p.role, key=f"ed_role_{p.id}")
                with c2:
                    ed_period = st.text_input("기간", value=p.period, key=f"ed_period_{p.id}")
                    ed_tech = st.text_input("기술", value=", ".join(p.tech_stack), key=f"ed_tech_{p.id}")
                ed_desc = st.text_area("설명", value=p.description, key=f"ed_desc_{p.id}")
                ed_ach = st.text_area("성과", value="\n".join(p.achievements), key=f"ed_ach_{p.id}")
                if st.button("수정 저장", key=f"save_edit_{p.id}", use_container_width=True, type="primary"):
                    updated = Portfolio(
                        id=p.id,
                        title=ed_title,
                        period=ed_period,
                        role=ed_role,
                        description=ed_desc,
                        tech_stack=[t.strip() for t in ed_tech.split(",") if t.strip()],
                        achievements=[a.strip() for a in ed_ach.split("\n") if a.strip()],
                        links=p.links,
                        created_at=p.created_at,
                        updated_at=datetime.now().isoformat(),
                    )
                    storage.save(updated)
                    if vector_store:
                        vector_store.upsert_portfolio(updated)
                    del st.session_state[f"editing_{p.id}"]
                    st.success("수정 완료!")
                    st.rerun()
