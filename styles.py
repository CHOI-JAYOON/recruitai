import streamlit as st

GLOBAL_CSS = """
<style>
@import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css');

:root {
    --blue-primary: #3182F6;
    --blue-hover: #1B64DA;
    --gray-50: #F9FAFB;
    --gray-100: #F2F4F6;
    --gray-200: #E5E8EB;
    --gray-300: #D1D6DB;
    --gray-400: #B0B8C1;
    --gray-500: #8B95A1;
    --gray-600: #6B7684;
    --gray-700: #4E5968;
    --gray-800: #333D4B;
    --gray-900: #191F28;
    --green: #00C471;
    --red: #F04452;
}

html, body, [class*="css"] {
    font-family: 'Pretendard Variable', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif !important;
}

/* Hide deploy/menu but keep sidebar toggle visible */
#MainMenu, footer, .stDeployButton {
    display: none !important;
}
header[data-testid="stHeader"] {
    background: transparent !important;
    backdrop-filter: none !important;
    border: none !important;
    box-shadow: none !important;
}
/* Hide all toolbar items except sidebar expand button */
header[data-testid="stHeader"] [data-testid="stToolbar"] {
    background: transparent !important;
    border: none !important;
    box-shadow: none !important;
}
[data-testid="stToolbarActions"],
[data-testid="stStatusWidget"],
[data-testid="stMainMenu"],
[data-testid="stAppDeployButton"] {
    display: none !important;
}
/* Ensure sidebar expand button is always visible */
[data-testid="stExpandSidebarButton"] {
    display: flex !important;
    visibility: visible !important;
}

/* Main container */
.stApp {
    background-color: #FFFFFF;
}

/* Sidebar styling */
section[data-testid="stSidebar"] {
    background-color: var(--gray-50);
    border-right: 1px solid var(--gray-200);
}
section[data-testid="stSidebar"] .stRadio > div > label {
    padding: 0.5rem 0.8rem;
    border-radius: 10px;
    transition: background 0.15s;
    font-size: 0.88rem;
}
section[data-testid="stSidebar"] .stRadio > div > label:hover {
    background-color: var(--gray-100);
}
section[data-testid="stSidebar"] .stRadio > div > label[data-checked="true"] {
    background-color: #EBF4FF;
    color: var(--blue-primary);
    font-weight: 600;
}

/* Buttons - compact modern style */
.stButton > button {
    border: 1px solid var(--gray-200) !important;
    border-radius: 8px !important;
    padding: 0.35rem 0.8rem !important;
    font-weight: 500 !important;
    font-size: 0.82rem !important;
    transition: all 0.15s ease !important;
    letter-spacing: -0.01em !important;
    background-color: white !important;
    color: var(--gray-600) !important;
    cursor: pointer !important;
    min-height: 0 !important;
    line-height: 1.4 !important;
}
.stButton > button:hover {
    background-color: var(--gray-50) !important;
    border-color: var(--gray-300) !important;
    color: var(--gray-800) !important;
}
.stButton > button[kind="primary"],
.stFormSubmitButton > button {
    background-color: var(--blue-primary) !important;
    color: white !important;
    border: none !important;
    border-radius: 8px !important;
    padding: 0.4rem 1rem !important;
    font-weight: 600 !important;
    font-size: 0.85rem !important;
    min-height: 0 !important;
    line-height: 1.4 !important;
}
.stFormSubmitButton > button:hover,
.stButton > button[kind="primary"]:hover {
    background-color: var(--blue-hover) !important;
    box-shadow: 0 2px 8px rgba(49, 130, 246, 0.2);
}

/* Text inputs */
.stTextInput > div > div > input,
.stTextArea > div > div > textarea {
    border: 1.5px solid var(--gray-200) !important;
    border-radius: 10px !important;
    padding: 0.65rem 0.9rem !important;
    font-size: 0.9rem !important;
    transition: border-color 0.15s !important;
    background-color: var(--gray-50) !important;
}
.stTextInput > div > div > input:focus,
.stTextArea > div > div > textarea:focus {
    border-color: var(--blue-primary) !important;
    box-shadow: 0 0 0 3px rgba(49, 130, 246, 0.1) !important;
    background-color: #FFFFFF !important;
}

/* Labels */
.stTextInput > label,
.stTextArea > label,
.stSelectbox > label,
.stNumberInput > label {
    font-weight: 600 !important;
    font-size: 0.85rem !important;
    color: var(--gray-700) !important;
    margin-bottom: 0.3rem !important;
}

/* Cards / Containers */
div[data-testid="stExpander"] {
    border: 1px solid var(--gray-200) !important;
    border-radius: 14px !important;
    overflow: hidden;
    box-shadow: 0 1px 3px rgba(0,0,0,0.04);
}
div[data-testid="stExpander"]:hover {
    box-shadow: 0 4px 12px rgba(0,0,0,0.06);
}
div[data-testid="stExpander"] summary {
    font-weight: 600 !important;
    color: var(--gray-800) !important;
}

/* Container borders */
div[data-testid="stVerticalBlock"] > div[data-testid="element-container"] > div.stMarkdown > div[data-testid="stMarkdownContainer"] > div.row-widget.stHorizontal {
    border-radius: 14px;
}

/* Tabs */
.stTabs [data-baseweb="tab-list"] {
    gap: 0px;
    border-bottom: 2px solid var(--gray-100);
}
.stTabs [data-baseweb="tab"] {
    padding: 0.8rem 1.5rem;
    font-weight: 500;
    color: var(--gray-500);
    border-bottom: 2px solid transparent;
    margin-bottom: -2px;
}
.stTabs [data-baseweb="tab"][aria-selected="true"] {
    color: var(--blue-primary) !important;
    font-weight: 700;
    border-bottom: 2px solid var(--blue-primary);
}
.stTabs [data-baseweb="tab-highlight"] {
    background-color: var(--blue-primary) !important;
}

/* Metrics */
div[data-testid="stMetric"] {
    background: var(--gray-50);
    border-radius: 14px;
    padding: 1rem 1.2rem;
    border: 1px solid var(--gray-200);
}
div[data-testid="stMetric"] label {
    color: var(--gray-500) !important;
    font-size: 0.8rem !important;
}
div[data-testid="stMetric"] [data-testid="stMetricValue"] {
    font-weight: 700 !important;
    color: var(--gray-900) !important;
}

/* Alerts */
div[data-testid="stAlert"] {
    border-radius: 12px !important;
    border: none !important;
    font-size: 0.9rem;
}

/* Checkbox */
.stCheckbox > label {
    padding: 0.5rem 0;
}

/* Divider */
hr {
    border-color: var(--gray-100) !important;
    margin: 1.5rem 0 !important;
}

/* Download button */
.stDownloadButton > button {
    background-color: var(--green) !important;
    color: white !important;
    border: none !important;
    border-radius: 12px !important;
    font-weight: 600 !important;
}
.stDownloadButton > button:hover {
    filter: brightness(0.9);
    transform: translateY(-1px);
}

/* Progress bar */
.stProgress > div > div > div {
    background-color: var(--blue-primary) !important;
    border-radius: 100px;
}

/* Number input */
.stNumberInput > div > div > input {
    border: 1.5px solid var(--gray-200) !important;
    border-radius: 10px !important;
    background-color: var(--gray-50) !important;
}

/* Slider */
.stSlider > div > div > div[role="slider"] {
    background-color: var(--blue-primary) !important;
}

/* Bordered containers */
div[data-testid="stVerticalBlockBorderWrapper"] {
    border-radius: 14px !important;
    border-color: var(--gray-200) !important;
}

/* Nav bar row - compact */
[data-testid="stMainBlockContainer"] > div:first-child .stHorizontalBlock {
    gap: 0.3rem;
}
</style>
"""


def inject_global_css():
    st.markdown(GLOBAL_CSS, unsafe_allow_html=True)
