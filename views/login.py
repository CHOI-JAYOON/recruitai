import streamlit as st
from services.auth import AuthService
from styles import inject_global_css

LOGIN_CSS = """
<style>
/* Center the login form */
[data-testid="stMainBlockContainer"] {
    max-width: 440px !important;
    margin: 0 auto;
    padding-top: 6vh;
}
/* Logo styling */
.login-logo {
    text-align: center;
    margin-bottom: 0.5rem;
}
.login-logo h1 {
    font-size: 2rem;
    font-weight: 800;
    color: #191F28;
    letter-spacing: -0.03em;
    margin: 0;
}
.login-logo .accent {
    color: #3182F6;
}
.login-subtitle {
    text-align: center;
    color: #8B95A1;
    font-size: 0.95rem;
    margin-bottom: 2.5rem;
    letter-spacing: -0.01em;
}
</style>
"""


def show_login_page():
    inject_global_css()
    st.markdown(LOGIN_CSS, unsafe_allow_html=True)

    st.markdown(
        '<div class="login-logo"><h1>Recruit<span class="accent">AI</span></h1></div>',
        unsafe_allow_html=True,
    )
    st.markdown(
        '<p class="login-subtitle">AI 에이전트가 당신의 취업을 설계합니다</p>',
        unsafe_allow_html=True,
    )

    auth = AuthService()

    tab_login, tab_register = st.tabs(["로그인", "회원가입"])

    with tab_login:
        with st.form("login_form"):
            username = st.text_input("아이디", key="login_username", placeholder="아이디를 입력하세요")
            password = st.text_input("비밀번호", type="password", key="login_password", placeholder="비밀번호를 입력하세요")
            submitted = st.form_submit_button("로그인", use_container_width=True)

            if submitted:
                if not username or not password:
                    st.error("아이디와 비밀번호를 입력하세요.")
                else:
                    user = auth.login(username, password)
                    if user:
                        st.session_state.authenticated = True
                        st.session_state.user = user
                        st.rerun()
                    else:
                        st.error("아이디 또는 비밀번호가 올바르지 않습니다.")

    with tab_register:
        with st.form("register_form"):
            new_username = st.text_input("아이디", key="reg_username", placeholder="사용할 아이디")
            new_display = st.text_input("이름", key="reg_display", placeholder="표시될 이름")
            new_password = st.text_input(
                "비밀번호", type="password", key="reg_password", placeholder="4자 이상"
            )
            new_password2 = st.text_input(
                "비밀번호 확인", type="password", key="reg_password2", placeholder="비밀번호 재입력"
            )
            reg_submitted = st.form_submit_button("회원가입", use_container_width=True)

            if reg_submitted:
                if not new_username or not new_password or not new_display:
                    st.error("모든 필드를 입력하세요.")
                elif new_password != new_password2:
                    st.error("비밀번호가 일치하지 않습니다.")
                elif len(new_password) < 4:
                    st.error("비밀번호는 4자 이상이어야 합니다.")
                else:
                    success = auth.register(new_username, new_password, new_display)
                    if success:
                        st.success("회원가입 완료! 로그인 탭에서 로그인하세요.")
                    else:
                        st.error("이미 존재하는 아이디입니다.")
