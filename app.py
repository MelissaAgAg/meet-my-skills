
import streamlit as st
import pandas as pd

st.set_page_config(
    page_title="Blupi — Career Migration Assistant",
    page_icon="🤖",
    layout="centered",
)

# Palette sampled from the user's Blupi references:
CORAL = "#EF5F5E"
CORAL_LIGHT = "#FA827F"
CORAL_DARK = "#D94D4D"
INK = "#35353A"
CREAM = "#FCF7F1"
WHITE = "#FFFFFF"
SOFT = "#F7D6D4"

st.markdown(
    f"""
    <style>
    html, body, [class*="css"] {{
        font-family: Arial, sans-serif;
    }}
    .stApp {{
        background: {CREAM};
    }}
    [data-testid="stHeader"] {{
        background: transparent;
    }}
    .hero {{
        background: {CORAL};
        border-radius: 24px;
        padding: 22px 24px;
        margin-bottom: 18px;
        box-shadow: 0 8px 22px rgba(53,53,58,.10);
    }}
    .hero-row {{
        display: flex;
        align-items: center;
        gap: 18px;
    }}
    .hero img {{
        width: 82px;
        height: 82px;
        object-fit: cover;
        border-radius: 50%;
        border: 4px solid {WHITE};
        background: {WHITE};
    }}
    .hero-title {{
        color: {WHITE};
        font-size: 30px;
        font-weight: 800;
        margin: 0;
    }}
    .hero-sub {{
        color: {WHITE};
        font-size: 15px;
        margin-top: 5px;
        opacity: .95;
    }}
    .chat-card {{
        background: {WHITE};
        border: 2px solid {SOFT};
        border-radius: 18px;
        padding: 14px 18px;
        margin: 10px 0;
    }}
    .result-card {{
        background: {CORAL};
        color: {WHITE};
        border-radius: 22px;
        padding: 22px;
        margin-top: 12px;
        box-shadow: 0 8px 22px rgba(53,53,58,.12);
    }}
    .country-card {{
        background: {WHITE};
        color: {INK};
        border-radius: 16px;
        padding: 16px;
        margin: 10px 0;
        border: 2px solid {SOFT};
    }}
    .small {{
        color: {INK};
        font-size: 13px;
    }}
    .stButton > button {{
        border-radius: 14px;
        border: 2px solid {INK};
        background: {CREAM};
        color: {INK};
        min-height: 48px;
        font-weight: 700;
    }}
    .stButton > button:hover {{
        background: {CORAL_LIGHT};
        color: {WHITE};
        border-color: {CORAL_DARK};
    }}
    div[data-testid="stChatInput"] {{
        border-color: {CORAL};
    }}
    </style>
    """,
    unsafe_allow_html=True,
)

@st.cache_data
def load_data():
    return pd.read_csv("migration_data.csv")

df = load_data()
latest = df[df["Year"] == df["Year"].max()].copy()

COUNTRIES = ["Canada", "Australia", "New Zealand", "Brazil", "Norway"]
FLAGS = {
    "Canada": "🇨🇦",
    "Australia": "🇦🇺",
    "New Zealand": "🇳🇿",
    "Brazil": "🇧🇷",
    "Norway": "🇳🇴",
}

# -------- State --------
if "step" not in st.session_state:
    st.session_state.step = 0
if "answers" not in st.session_state:
    st.session_state.answers = {}
if "messages" not in st.session_state:
    st.session_state.messages = [
        ("assistant", "Hi! 👋 I'm Blupi, your virtual assistant for career migration.")
    ]
if "finished" not in st.session_state:
    st.session_state.finished = False
if "ranking" not in st.session_state:
    st.session_state.ranking = None

def add_user_answer(label, value):
    st.session_state.messages.append(("user", f"{label}: {value}"))

def choose(value, label, key):
    if st.button(value, key=key, use_container_width=True):
        st.session_state.answers[label] = value
        add_user_answer(label, value)
        st.session_state.step += 1
        if st.session_state.step >= 7:
            st.session_state.ranking = calculate_ranking(st.session_state.answers)
            st.session_state.finished = True
        st.rerun()

def normalized(series, reverse=False):
    s = series.astype(float)
    if s.max() == s.min():
        out = pd.Series(0.5, index=s.index)
    else:
        out = (s - s.min()) / (s.max() - s.min())
    return 1 - out if reverse else out

def calculate_ranking(a):
    scores = {c: 0.0 for c in COUNTRIES}

    # Q1 — Cloud
    if a.get("cloud") == "Yes":
        boosts = {"Canada": 4, "Australia": 4, "New Zealand": 3, "Norway": 3, "Brazil": 1}
        for c, v in boosts.items():
            scores[c] += v

    # Q2 — Customer Relations
    if a.get("customer_relations") == "Yes":
        boosts = {"Canada": 4, "Australia": 4, "New Zealand": 3, "Norway": 2, "Brazil": 2}
        for c, v in boosts.items():
            scores[c] += v

    # Q3 — English
    if a.get("english") == "Yes":
        boosts = {"Canada": 5, "Australia": 5, "New Zealand": 5, "Norway": 1, "Brazil": 0}
        for c, v in boosts.items():
            scores[c] += v

    # Q4 — Portuguese / Norwegian
    language = a.get("second_language")
    if language in ("Portuguese", "Both"):
        scores["Brazil"] += 5
    if language in ("Norwegian", "Both"):
        scores["Norway"] += 5

    # Q5 — Family
    # Use the workbook's social signals: peace + health benefits + food-basket affordability.
    if a.get("family") == "Yes":
        peace = normalized(latest.set_index("Country")["Peace Rank"], reverse=True)
        health = normalized(latest.set_index("Country")["Essential Health Benefits"])
        food = normalized(latest.set_index("Country")["Annual Basic Food Basket"], reverse=True)
        family_fit = (peace * 0.45 + health * 0.35 + food * 0.20) * 6
        for c in COUNTRIES:
            scores[c] += float(family_fit[c])

    # Q6 — Security vs salary
    # Security explicitly excludes Brazil and rewards safer destinations using the workbook's Peace Rank.
    if a.get("priority_security_salary") == "Security":
        scores["Brazil"] = -999
        peace = normalized(latest.set_index("Country")["Peace Rank"], reverse=True)
        for c in COUNTRIES:
            if c != "Brazil":
                scores[c] += float(peace[c] * 7)
    else:
        wage = normalized(latest.set_index("Country")["Minimum Wage (USD/hour)"])
        for c in COUNTRIES:
            scores[c] += float(wage[c] * 5)

    # Q7 — Excellent salary vs better job opportunities
    if a.get("priority_salary_jobs") == "Excellent salary":
        # Explicit user rule: Norway must be in the two suggestions.
        scores["Norway"] += 100
        wage = normalized(latest.set_index("Country")["Minimum Wage (USD/hour)"])
        for c in COUNTRIES:
            scores[c] += float(wage[c] * 8)
    else:
        # Favor job availability and low unemployment.
        job = normalized(
            latest.set_index("Country")["Tech & Cloud Job Availability"] +
            latest.set_index("Country")["Customer Relations Job Availability"]
        )
        unemp = normalized(latest.set_index("Country")["Unemployment Rate"], reverse=True)
        for c in COUNTRIES:
            scores[c] += float((job[c] * 0.65 + unemp[c] * 0.35) * 9)

    # English-speaking countries receive a final tie-break priority if English = Yes.
    if a.get("english") == "Yes":
        for c in ["Canada", "Australia", "New Zealand"]:
            scores[c] += 2

    ranked = sorted(scores.items(), key=lambda x: x[1], reverse=True)

    # Hard rule: if security was selected, Brazil can never appear in suggestions.
    if a.get("priority_security_salary") == "Security":
        ranked = [(c, s) for c, s in ranked if c != "Brazil"]

    # Hard rule: if excellent salary was selected, Norway is guaranteed in top two.
    if a.get("priority_salary_jobs") == "Excellent salary":
        norway_score = dict(ranked)["Norway"]
        others = [(c, s) for c, s in ranked if c != "Norway"]
        ranked = [("Norway", norway_score)] + others
        ranked = ranked[:1] + sorted(others, key=lambda x: x[1], reverse=True)[:1]

    return ranked[:2]

# -------- Header --------
st.markdown(
    f"""
    <div class="hero">
      <div class="hero-row">
        <img src="data:image/jpeg;base64,{__import__('base64').b64encode(open('blupi.jpg','rb').read()).decode()}">
        <div>
          <div class="hero-title">Blupi — Career Migration Assistant</div>
          <div class="hero-sub">Answer a few questions and explore two possible destinations.</div>
        </div>
      </div>
    </div>
    """,
    unsafe_allow_html=True,
)

# -------- Chat history --------
for role, text in st.session_state.messages:
    with st.chat_message("assistant" if role == "assistant" else "user"):
        st.write(text)

questions = [
    (
        "cloud",
        "Do you work in Cloud?",
        ["Yes", "No"],
    ),
    (
        "customer_relations",
        "Do you work in Customer Relations? (CSAM, CSM, Customer Service, B2B, B2C, SDR, Sales Representative, etc.)",
        ["Yes", "No"],
    ),
    (
        "english",
        "Do you speak English?",
        ["Yes", "No"],
    ),
    (
        "second_language",
        "Do you speak Portuguese or Norwegian?",
        ["Portuguese", "Norwegian", "Both", "Neither"],
    ),
    (
        "family",
        "Are you migrating with your family?",
        ["Yes", "No"],
    ),
    (
        "priority_security_salary",
        'Which is more important to you: "Security" or "a good salary"?',
        ["Security", "A good salary"],
    ),
    (
        "priority_salary_jobs",
        'Which is more important to you: "an excellent salary" or "better job opportunities"?',
        ["Excellent salary", "Better job opportunities"],
    ),
]

if not st.session_state.finished:
    key, question, options = questions[st.session_state.step]

    with st.chat_message("assistant"):
        st.write(question)

    cols = st.columns(len(options))
    for i, option in enumerate(options):
        with cols[i]:
            if st.button(option, key=f"{key}_{i}", use_container_width=True):
                st.session_state.answers[key] = option
                add_user_answer(question, option)
                st.session_state.step += 1

                if st.session_state.step >= len(questions):
                    st.session_state.ranking = calculate_ranking(st.session_state.answers)
                    st.session_state.finished = True
                st.rerun()

else:
    with st.chat_message("assistant"):
        st.write("Thanks! 💛 I have your answers. Here are two destinations worth exploring:")

    st.markdown(
        f'<div class="result-card"><h2 style="margin:0;color:{WHITE};">🌎 Your Two Possible Destinations</h2>'
        f'<p style="margin:6px 0 0;color:{WHITE};">This is a simple decision-support result based on your answers and the workbook data.</p></div>',
        unsafe_allow_html=True,
    )

    for i, (country, score) in enumerate(st.session_state.ranking, start=1):
        medal = "🥇" if i == 1 else "🥈"
        row = latest[latest["Country"] == country].iloc[0]

        reasons = []
        if st.session_state.answers.get("english") == "Yes" and country in ["Canada", "Australia", "New Zealand"]:
            reasons.append("English-speaking destination")
        if st.session_state.answers.get("cloud") == "Yes" and country != "Brazil":
            reasons.append("strong fit with Cloud/Tech interests")
        if st.session_state.answers.get("customer_relations") == "Yes":
            reasons.append("relevant Customer Relations market")
        if st.session_state.answers.get("family") == "Yes":
            reasons.append("family-oriented social factors considered")
        if country == "Norway" and st.session_state.answers.get("priority_salary_jobs") == "Excellent salary":
            reasons.append("excellent-salary priority")
        if st.session_state.answers.get("priority_security_salary") == "Security" and country != "Brazil":
            reasons.append("security priority considered")

        reason_text = " • ".join(reasons[:3]) if reasons else "selected from the available labor-market signals"

        st.markdown(
            f"""
            <div class="country-card">
                <div style="font-size:25px;font-weight:800;">{medal} {FLAGS[country]} {country}</div>
                <div style="margin-top:7px;font-weight:700;">{reason_text}</div>
                <div class="small" style="margin-top:9px;">
                    2026 data snapshot · Tech/Cloud jobs: {row["Tech & Cloud Job Availability"]:.3f}
                    · Customer Relations jobs: {row["Customer Relations Job Availability"]:.3f}
                    · Minimum wage: ${row["Minimum Wage (USD/hour)"]:.2f}/hour
                </div>
            </div>
            """,
            unsafe_allow_html=True,
        )

    st.caption("Important: this prototype is a career-research tool, not immigration, visa, legal, or employment advice.")

    if st.button("🔄 Start again", use_container_width=True):
        for k in ["step", "answers", "messages", "finished", "ranking"]:
            st.session_state.pop(k, None)
        st.rerun()
