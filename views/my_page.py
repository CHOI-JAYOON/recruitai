import streamlit as st
from datetime import date
from models.user_profile import (
    UserProfile, Education, WorkExperience, WorkProject,
    Certificate, Award,
)
from services.profile_storage import ProfileStorage


def _init_edit_states():
    for key in ["edit_basic", "edit_edu", "edit_work", "edit_summary", "edit_api"]:
        if key not in st.session_state:
            st.session_state[key] = False


def show_my_page():
    _init_edit_states()

    st.markdown(
        '<h2 style="font-weight:800; letter-spacing:-0.03em; margin-bottom:0.2rem;">마이페이지</h2>',
        unsafe_allow_html=True,
    )
    st.markdown(
        '<p style="color:#8B95A1; font-size:0.9rem; margin-bottom:1.5rem;">'
        "이력서에 사용할 기본 정보를 관리하세요</p>",
        unsafe_allow_html=True,
    )

    username = st.session_state.user["username"]
    storage = ProfileStorage()
    profile = storage.load(username)

    tab_info, tab_edu, tab_work, tab_summary, tab_api = st.tabs(
        ["기본 정보", "학력", "경력 / 수상 / 자격증", "자기소개", "API 설정"]
    )

    with tab_info:
        _tab_basic_info(profile, username, storage)
    with tab_edu:
        _tab_education(profile, username, storage)
    with tab_work:
        _tab_work_cert_award(profile, username, storage)
    with tab_summary:
        _tab_summary(profile, username, storage)
    with tab_api:
        _tab_api()


# ───────── helpers ─────────

def _parse_date_str(s: str):
    """'2024-01' or '2024-01-15' -> date or None"""
    if not s:
        return None
    try:
        parts = s.split("-")
        if len(parts) == 2:
            return date(int(parts[0]), int(parts[1]), 1)
        return date(int(parts[0]), int(parts[1]), int(parts[2]))
    except Exception:
        return None


def _date_to_str(d) -> str:
    if d is None:
        return ""
    return d.strftime("%Y-%m")


def _section_header(label: str, edit_key: str):
    """Render section header with edit/done toggle."""
    col_t, col_btn = st.columns([5, 1])
    with col_t:
        st.markdown(f'<p style="font-weight:700; font-size:1rem; margin:0;">{label}</p>', unsafe_allow_html=True)
    with col_btn:
        if st.session_state[edit_key]:
            if st.button("완료", key=f"done_{edit_key}", use_container_width=True, type="primary"):
                st.session_state[edit_key] = False
                st.rerun()
        else:
            if st.button("수정", key=f"start_{edit_key}", use_container_width=True):
                st.session_state[edit_key] = True
                st.rerun()


# ───────── 기본 정보 ─────────

def _tab_basic_info(profile: UserProfile, username: str, storage: ProfileStorage):
    _section_header("기본 정보", "edit_basic")

    if st.session_state.edit_basic:
        with st.form("basic_form"):
            c1, c2 = st.columns(2)
            with c1:
                name = st.text_input("이름", value=profile.name, placeholder="홍길동")
                email = st.text_input("이메일", value=profile.email, placeholder="hello@email.com")
                phone = st.text_input("전화번호", value=profile.phone, placeholder="010-0000-0000")
            with c2:
                github = st.text_input("GitHub", value=profile.github, placeholder="github.com/...")
                linkedin = st.text_input("LinkedIn", value=profile.linkedin, placeholder="linkedin.com/in/...")
                blog = st.text_input("블로그", value=profile.blog, placeholder="https://...")
            if st.form_submit_button("저장", use_container_width=True):
                profile.name = name
                profile.email = email
                profile.phone = phone
                profile.github = github
                profile.linkedin = linkedin
                profile.blog = blog
                storage.save(username, profile)
                st.session_state.edit_basic = False
                st.rerun()
    else:
        _view_row("이름", profile.name)
        _view_row("이메일", profile.email)
        _view_row("전화번호", profile.phone)
        _view_row("GitHub", profile.github)
        _view_row("LinkedIn", profile.linkedin)
        _view_row("블로그", profile.blog)


def _view_row(label: str, value: str):
    if value:
        st.markdown(
            f'<div style="display:flex; padding:0.35rem 0; border-bottom:1px solid #F2F4F6;">'
            f'<span style="width:100px; color:#8B95A1; font-size:0.85rem; flex-shrink:0;">{label}</span>'
            f'<span style="color:#191F28; font-size:0.85rem;">{value}</span>'
            f'</div>',
            unsafe_allow_html=True,
        )


# ───────── 학력 ─────────

def _tab_education(profile: UserProfile, username: str, storage: ProfileStorage):
    _section_header("학력", "edit_edu")

    if st.session_state.edit_edu:
        # Add button at top
        if st.button("+ 학력 추가", key="add_edu", type="primary"):
            profile.education.append(Education())
            storage.save(username, profile)
            st.rerun()

        for i, edu in enumerate(profile.education):
            with st.container(border=True):
                ct, cd = st.columns([5, 1])
                with ct:
                    st.markdown(f'<p style="font-weight:600; color:#3182F6; font-size:0.82rem;">학력 {i+1}</p>', unsafe_allow_html=True)
                with cd:
                    if st.button("삭제", key=f"del_edu_{i}"):
                        profile.education.pop(i)
                        storage.save(username, profile)
                        st.rerun()

                school_type = st.selectbox("구분", ["고등학교", "대학교", "대학원"], index=["고등학교", "대학교", "대학원"].index(edu.school_type) if edu.school_type in ["고등학교", "대학교", "대학원"] else 1, key=f"edu_type_{i}")

                c1, c2 = st.columns(2)
                with c1:
                    school = st.text_input("학교명", value=edu.school, key=f"edu_school_{i}")
                with c2:
                    if school_type != "고등학교":
                        major = st.text_input("전공", value=edu.major, key=f"edu_major_{i}")
                    else:
                        major = ""

                c3, c4 = st.columns(2)
                with c3:
                    start_d = st.date_input("입학일", value=_parse_date_str(edu.start_date), key=f"edu_start_{i}", format="YYYY/MM/DD")
                with c4:
                    end_d = st.date_input("졸업일", value=_parse_date_str(edu.end_date), key=f"edu_end_{i}", format="YYYY/MM/DD")

                if school_type != "고등학교":
                    c5, c6 = st.columns(2)
                    with c5:
                        degree = st.text_input("학위", value=edu.degree, key=f"edu_deg_{i}", placeholder="학사/석사/박사")
                    with c6:
                        gc1, gc2 = st.columns([2, 1])
                        with gc1:
                            gpa = st.text_input("학점", value=edu.gpa, key=f"edu_gpa_{i}", placeholder="3.8")
                        with gc2:
                            gpa_scale = st.selectbox("만점", ["4.0", "4.3", "4.5"], index=["4.0", "4.3", "4.5"].index(edu.gpa_scale) if edu.gpa_scale in ["4.0", "4.3", "4.5"] else 2, key=f"edu_scale_{i}")
                else:
                    degree = ""
                    gpa = ""
                    gpa_scale = "4.5"

                profile.education[i] = Education(
                    school_type=school_type, school=school, major=major, degree=degree,
                    start_date=_date_to_str(start_d), end_date=_date_to_str(end_d),
                    gpa=gpa, gpa_scale=gpa_scale,
                )

        if st.button("학력 저장", key="save_edu", use_container_width=True, type="primary"):
            storage.save(username, profile)
            st.session_state.edit_edu = False
            st.rerun()

    else:
        if not profile.education:
            st.caption("등록된 학력이 없습니다.")
        for edu in profile.education:
            period = ""
            if edu.start_date:
                period = edu.start_date
            if edu.end_date:
                period += f" ~ {edu.end_date}"
            gpa_str = f" · {edu.gpa}/{edu.gpa_scale}" if edu.gpa else ""
            detail = f"{edu.major} {edu.degree}" if edu.major else edu.degree
            st.markdown(
                f'<div style="padding:0.5rem 0; border-bottom:1px solid #F2F4F6;">'
                f'<span style="font-weight:600; font-size:0.9rem;">{edu.school}</span>'
                f'<span style="color:#8B95A1; font-size:0.82rem;"> · {edu.school_type}</span><br>'
                f'<span style="color:#6B7684; font-size:0.82rem;">{detail}{gpa_str}</span><br>'
                f'<span style="color:#B0B8C1; font-size:0.78rem;">{period}</span>'
                f'</div>',
                unsafe_allow_html=True,
            )


# ───────── 경력 / 수상 / 자격증 ─────────

def _tab_work_cert_award(profile: UserProfile, username: str, storage: ProfileStorage):
    _section_header("경력 / 수상 / 자격증", "edit_work")

    if st.session_state.edit_work:
        _edit_work(profile, username, storage)
    else:
        _view_work(profile)


def _edit_work(profile: UserProfile, username: str, storage: ProfileStorage):
    # ─ Work Experience ─
    st.markdown('<p style="font-weight:600; font-size:0.95rem;">경력</p>', unsafe_allow_html=True)

    if st.button("+ 경력 추가", key="add_work", type="primary"):
        profile.work_experience.append(WorkExperience())
        storage.save(username, profile)
        st.rerun()

    for i, work in enumerate(profile.work_experience):
        with st.container(border=True):
            ct, cd = st.columns([5, 1])
            with ct:
                st.markdown(f'<p style="font-weight:600; color:#3182F6; font-size:0.82rem;">경력 {i+1}</p>', unsafe_allow_html=True)
            with cd:
                if st.button("삭제", key=f"del_work_{i}"):
                    profile.work_experience.pop(i)
                    storage.save(username, profile)
                    st.rerun()

            c1, c2 = st.columns(2)
            with c1:
                company = st.text_input("회사명", value=work.company, key=f"w_company_{i}")
                team = st.text_input("팀/부서", value=work.team, key=f"w_team_{i}")
            with c2:
                position = st.text_input("직위", value=work.position, key=f"w_pos_{i}")
                is_current = st.checkbox("재직중", value=work.is_current, key=f"w_cur_{i}")

            c3, c4 = st.columns(2)
            with c3:
                w_start = st.date_input("입사일", value=_parse_date_str(work.start_date), key=f"w_start_{i}", format="YYYY/MM/DD")
            with c4:
                if is_current:
                    w_end = None
                    st.markdown('<div style="padding:1.8rem 0; color:#3182F6; font-size:0.85rem; font-weight:500;">재직중</div>', unsafe_allow_html=True)
                else:
                    w_end = st.date_input("퇴사일", value=_parse_date_str(work.end_date), key=f"w_end_{i}", format="YYYY/MM/DD")

            desc = st.text_area("업무 내용", value=work.description, key=f"w_desc_{i}", height=60)

            # Projects under this company
            st.markdown('<p style="font-weight:500; font-size:0.85rem; color:#6B7684; margin:0.5rem 0 0.3rem;">프로젝트</p>', unsafe_allow_html=True)

            if not work.projects:
                work.projects = []

            for j, proj in enumerate(work.projects):
                pc1, pc2, pc3 = st.columns([3, 2, 1])
                with pc1:
                    pname = st.text_input("프로젝트명", value=proj.name, key=f"wp_name_{i}_{j}", label_visibility="collapsed", placeholder="프로젝트명")
                with pc2:
                    pdesc = st.text_input("설명", value=proj.description, key=f"wp_desc_{i}_{j}", label_visibility="collapsed", placeholder="간단 설명")
                with pc3:
                    if st.button("X", key=f"wp_del_{i}_{j}"):
                        work.projects.pop(j)
                        storage.save(username, profile)
                        st.rerun()
                work.projects[j] = WorkProject(name=pname, description=pdesc, period=proj.period)

            if st.button("+ 프로젝트", key=f"wp_add_{i}"):
                work.projects.append(WorkProject())
                storage.save(username, profile)
                st.rerun()

            profile.work_experience[i] = WorkExperience(
                company=company, team=team, position=position,
                start_date=_date_to_str(w_start), end_date=_date_to_str(w_end) if w_end else "",
                is_current=is_current, description=desc, projects=work.projects,
            )

    st.divider()

    # ─ Certificates ─
    st.markdown('<p style="font-weight:600; font-size:0.95rem;">자격증</p>', unsafe_allow_html=True)
    if st.button("+ 자격증 추가", key="add_cert", type="primary"):
        profile.certificates.append(Certificate())
        storage.save(username, profile)
        st.rerun()

    for i, cert in enumerate(profile.certificates):
        c1, c2, c3, c4 = st.columns([3, 2, 2, 1])
        with c1:
            cn = st.text_input("자격증명", value=cert.name, key=f"c_name_{i}", label_visibility="collapsed", placeholder="자격증명")
        with c2:
            ci = st.text_input("발급기관", value=cert.issuer, key=f"c_iss_{i}", label_visibility="collapsed", placeholder="발급기관")
        with c3:
            cd = st.text_input("취득일", value=cert.date, key=f"c_date_{i}", label_visibility="collapsed", placeholder="2024.01")
        with c4:
            if st.button("X", key=f"c_del_{i}"):
                profile.certificates.pop(i)
                storage.save(username, profile)
                st.rerun()
        profile.certificates[i] = Certificate(name=cn, issuer=ci, date=cd)

    st.divider()

    # ─ Awards ─
    st.markdown('<p style="font-weight:600; font-size:0.95rem;">수상 이력</p>', unsafe_allow_html=True)
    if st.button("+ 수상 추가", key="add_award", type="primary"):
        profile.awards.append(Award())
        storage.save(username, profile)
        st.rerun()

    for i, award in enumerate(profile.awards):
        c1, c2, c3, c4 = st.columns([3, 2, 2, 1])
        with c1:
            an = st.text_input("수상명", value=award.name, key=f"a_name_{i}", label_visibility="collapsed", placeholder="수상명")
        with c2:
            ai = st.text_input("주관", value=award.issuer, key=f"a_iss_{i}", label_visibility="collapsed", placeholder="주관기관")
        with c3:
            ad = st.text_input("수상일", value=award.date, key=f"a_date_{i}", label_visibility="collapsed", placeholder="2024.01")
        with c4:
            if st.button("X", key=f"a_del_{i}"):
                profile.awards.pop(i)
                storage.save(username, profile)
                st.rerun()
        adesc = st.text_input("설명", value=award.description, key=f"a_desc_{i}", label_visibility="collapsed", placeholder="수상 내용 (선택)")
        profile.awards[i] = Award(name=an, issuer=ai, date=ad, description=adesc)

    st.divider()
    if st.button("전체 저장", key="save_all_work", use_container_width=True, type="primary"):
        storage.save(username, profile)
        st.session_state.edit_work = False
        st.rerun()


def _view_work(profile: UserProfile):
    # Work
    if profile.work_experience:
        st.markdown('<p style="font-weight:600; font-size:0.95rem;">경력</p>', unsafe_allow_html=True)
        for w in profile.work_experience:
            period = w.start_date
            if w.is_current:
                period += " ~ 재직중"
            elif w.end_date:
                period += f" ~ {w.end_date}"
            team_str = f" · {w.team}" if w.team else ""
            st.markdown(
                f'<div style="padding:0.5rem 0; border-bottom:1px solid #F2F4F6;">'
                f'<span style="font-weight:600; font-size:0.9rem;">{w.company}</span>'
                f'<span style="color:#8B95A1; font-size:0.82rem;">{team_str} · {w.position}</span><br>'
                f'<span style="color:#B0B8C1; font-size:0.78rem;">{period}</span>'
                f'</div>',
                unsafe_allow_html=True,
            )
            if w.description:
                st.caption(w.description)
            if w.projects:
                for proj in w.projects:
                    st.markdown(f'<span style="color:#4E5968; font-size:0.82rem; padding-left:1rem;">• {proj.name}</span> <span style="color:#8B95A1; font-size:0.78rem;">{proj.description}</span>', unsafe_allow_html=True)

    # Certificates
    if profile.certificates:
        st.divider()
        st.markdown('<p style="font-weight:600; font-size:0.95rem;">자격증</p>', unsafe_allow_html=True)
        for c in profile.certificates:
            st.markdown(
                f'<div style="padding:0.3rem 0; border-bottom:1px solid #F2F4F6;">'
                f'<span style="font-weight:500; font-size:0.88rem;">{c.name}</span>'
                f'<span style="color:#8B95A1; font-size:0.82rem;"> · {c.issuer} · {c.date}</span>'
                f'</div>',
                unsafe_allow_html=True,
            )

    # Awards
    if profile.awards:
        st.divider()
        st.markdown('<p style="font-weight:600; font-size:0.95rem;">수상 이력</p>', unsafe_allow_html=True)
        for a in profile.awards:
            st.markdown(
                f'<div style="padding:0.3rem 0; border-bottom:1px solid #F2F4F6;">'
                f'<span style="font-weight:500; font-size:0.88rem;">{a.name}</span>'
                f'<span style="color:#8B95A1; font-size:0.82rem;"> · {a.issuer} · {a.date}</span>'
                f'</div>',
                unsafe_allow_html=True,
            )

    if not profile.work_experience and not profile.certificates and not profile.awards:
        st.caption("등록된 정보가 없습니다.")


# ───────── 자기소개 ─────────

def _tab_summary(profile: UserProfile, username: str, storage: ProfileStorage):
    _section_header("자기소개", "edit_summary")

    if st.session_state.edit_summary:
        summary = st.text_area(
            "자기소개",
            value=profile.summary,
            height=200,
            key="prof_summary",
            placeholder="3~5문장으로 자신을 소개하세요.",
            label_visibility="collapsed",
        )
        if st.button("저장", key="save_summary", use_container_width=True, type="primary"):
            profile.summary = summary
            storage.save(username, profile)
            st.session_state.edit_summary = False
            st.rerun()
    else:
        if profile.summary:
            st.markdown(f'<p style="font-size:0.9rem; color:#4E5968; line-height:1.7;">{profile.summary}</p>', unsafe_allow_html=True)
        else:
            st.caption("등록된 자기소개가 없습니다.")


# ───────── API 설정 ─────────

def _tab_api():
    _section_header("API 설정", "edit_api")

    if st.session_state.edit_api:
        api_key = st.text_input(
            "API Key",
            type="password",
            value=st.session_state.get("openai_api_key", ""),
            key="mypage_api_key",
            placeholder="sk-...",
            label_visibility="collapsed",
        )
        if st.button("저장", key="save_api", use_container_width=True, type="primary"):
            st.session_state.openai_api_key = api_key
            st.session_state.edit_api = False
            st.rerun()
    else:
        api_key = st.session_state.get("openai_api_key", "")
        if api_key:
            masked = api_key[:7] + "..." + api_key[-4:]
            st.markdown(
                f'<div style="padding:0.5rem 0;">'
                f'<span style="background:#E8F5E9; color:#2E7D32; padding:0.2rem 0.6rem; '
                f'border-radius:100px; font-size:0.8rem; font-weight:500;">연결됨</span> '
                f'<span style="color:#8B95A1; font-size:0.85rem; font-family:monospace;">{masked}</span>'
                f'</div>',
                unsafe_allow_html=True,
            )
        else:
            st.markdown(
                '<div style="padding:0.5rem 0;">'
                '<span style="background:#FFF3E0; color:#E65100; padding:0.2rem 0.6rem; '
                'border-radius:100px; font-size:0.8rem; font-weight:500;">미설정</span> '
                '<span style="color:#8B95A1; font-size:0.85rem;">API Key를 등록하세요</span>'
                '</div>',
                unsafe_allow_html=True,
            )
