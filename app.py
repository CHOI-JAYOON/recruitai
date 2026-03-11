import streamlit as st
from views.login import show_login_page
from views.home import show_home_page
from views.resume_builder import show_resume_page
from views.cover_letter_writer import show_cover_letter_page
from views.interview_prep import show_interview_page
from views.my_page import show_my_page
from styles import inject_global_css

st.set_page_config(
    page_title="RecruitAI",
    page_icon="🚀",
    layout="wide",
    initial_sidebar_state="expanded",
)

# Session state defaults
for key, default in {
    "authenticated": False,
    "user": None,
    "openai_api_key": "",
    "parsed_portfolios": [],
    "home_mode": "list",
    "current_page": "홈",
    "cl_questions": [{"question": "", "max_length": 500, "answer": ""}],
    "iv_questions": [],
    "iv_current": 0,
    "iv_feedback_list": [],
    "confirm_delete_id": None,
    "confirm_delete_title": None,
}.items():
    if key not in st.session_state:
        st.session_state[key] = default

# Auth check
if not st.session_state.authenticated:
    show_login_page()
    st.stop()

# Inject global CSS
inject_global_css()

# ── Top header bar: logo | spacer | MY | logout ──
hdr = st.columns([2, 5, 1, 2])
with hdr[0]:
    if st.button("RecruitAI", key="hdr_logo"):
        st.session_state.current_page = "홈"
        st.rerun()
with hdr[2]:
    if st.button("MY", key="hdr_my", use_container_width=True,
                 type="primary" if st.session_state.current_page == "마이페이지" else "secondary"):
        st.session_state.current_page = "마이페이지"
        st.rerun()
with hdr[3]:
    if st.button("로그아웃", key="hdr_logout", use_container_width=True):
        st.session_state.authenticated = False
        st.session_state.user = None
        st.rerun()

st.divider()

# ── Sidebar: menu navigation ──
MENU_ITEMS = {
    "홈": "🏠",
    "이력서 변환": "📄",
    "자소서 생성": "✍️",
    "면접 코칭": "🎯",
}

with st.sidebar:
    user_display = st.session_state.user["display_name"]
    st.markdown(
        f'<div style="text-align:center; color:#6B7684; font-size:0.85rem; '
        f'padding:0.5rem 0 1rem;">{user_display}님</div>',
        unsafe_allow_html=True,
    )

    # API key status
    api_key = st.session_state.get("openai_api_key", "")
    if api_key:
        st.markdown(
            '<div style="text-align:center; margin-bottom:1rem;">'
            '<span style="background:#E8F5E9; color:#2E7D32; padding:0.15rem 0.5rem; '
            'border-radius:100px; font-size:0.72rem; font-weight:500;">API 연결됨</span></div>',
            unsafe_allow_html=True,
        )
    else:
        st.markdown(
            '<div style="text-align:center; margin-bottom:1rem;">'
            '<span style="background:#FFF3E0; color:#E65100; padding:0.15rem 0.5rem; '
            'border-radius:100px; font-size:0.72rem; font-weight:500;">API 미설정</span></div>',
            unsafe_allow_html=True,
        )

    st.divider()

    menu = st.radio(
        "메뉴",
        list(MENU_ITEMS.keys()),
        key="menu_selection",
        format_func=lambda x: f"{MENU_ITEMS[x]}  {x}",
        label_visibility="collapsed",
    )

    # sync sidebar selection to current_page
    if menu != st.session_state.current_page and st.session_state.current_page != "마이페이지":
        st.session_state.current_page = menu
        st.rerun()

# If user clicked sidebar menu while on MY page, switch back
if st.session_state.current_page != "마이페이지":
    st.session_state.current_page = menu

# Page routing
page = st.session_state.current_page
if page == "홈":
    show_home_page()
elif page == "이력서 변환":
    show_resume_page()
elif page == "자소서 생성":
    show_cover_letter_page()
elif page == "면접 코칭":
    show_interview_page()
elif page == "마이페이지":
    show_my_page()
