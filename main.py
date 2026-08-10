from fastapi import FastAPI, Depends, HTTPException
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from typing import List

from database import SessionLocal, engine, Base
import models
import schemas
from auth import hash_password, verify_password, create_access_token, get_current_user, require_role
from ml_model import predict_readmission

Base.metadata.create_all(bind=engine)

tags_metadata = [
    {"name": "Home", "description": "Landing pages and interactive dashboards."},
    {"name": "Authentication", "description": "User registration and login."},
    {"name": "User Info", "description": "Endpoints for retrieving the current logged-in user's details."},
    {"name": "User Management", "description": "Administrative endpoints for managing user accounts and roles."},
    {"name": "Patient Management", "description": "Add and manage patient admissions."},
    {"name": "Patient Risk", "description": "Endpoints related to patient readmission prediction."},
]

app = FastAPI(
    title="HealthForecast AI",
    description="""
## Hospital Readmission Prediction & Patient Risk Intelligence System

This API powers AI-driven readmission risk prediction, treatment effectiveness analysis,
and role-based access control for hospital staff.

**Roles supported:** Doctor, Hospital Administrator, Healthcare Researcher, System Administrator

---
Developed as part of the HealthForecast AI internship project.
    """,
    version="1.0.0",
    docs_url=None,
    openapi_tags=tags_metadata
)

app.mount("/static", StaticFiles(directory="static"), name="static")


# ============================================================
# SHARED DESIGN SYSTEM — used across every page for consistency
# ============================================================

SHARED_STYLE = """
    :root{
    --bg:#060b16;
    --surface:#0f172a;
    --surface-2:#162033;
    --card:#18253b;
    --border:#2b3954;

    --primary:#4f8cff;
    --primary-dark:#2563eb;
    --secondary:#7c3aed;
    --success:#22c55e;
    --danger:#ef4444;
    --warning:#f59e0b;

    --text:#f8fafc;
    --muted:#94a3b8;

    --radius:16px;
    --shadow:0 20px 50px rgba(0,0,0,.28);

    --transition:.28s cubic-bezier(.4,0,.2,1);
}
/* ===============================
        DASHBOARD LAYOUT
================================*/

.header{
    position:fixed;
    top:0;
    left:0;
    right:0;
    height:70px;

    background:#111827;
    border-bottom:1px solid #25314d;

    display:flex;
    justify-content:space-between;
    align-items:center;

    padding:0 25px;

    z-index:1000;
}

.left-header{
    display:flex;
    align-items:center;
    gap:18px;
}

.menu-btn{
    background:none;
    border:none;
    font-size:26px;
    color:white;
    cursor:pointer;
}

.brand{
    display:flex;
    align-items:center;
    gap:12px;
    color:#ffffff;
    text-decoration:none;
    font-size:32px;
    font-weight:700;
}

.brand-icon{
    font-size:30px;
}

.sidebar{
    position:fixed;
    top:70px;
    left:0;
    width:0;
    height:calc(100vh - 70px);
    background:#111827;
    overflow:hidden;
    transition:0.3s ease;
    z-index:999;
}
.sidebar.open{
    width:240px;
}

.sidebar.collapsed{
    width:80px;
}

.sidebar a{

    display:flex;

    align-items:center;

    gap:15px;

    color:#cbd5e1;

    text-decoration:none;

    padding:16px 22px;

    transition:.25s;
}

.sidebar a:hover{

    background:#1e293b;

    color:white;

}

.sidebar a.active{

    background:#2563eb;

    color:white;

}

.sidebar.collapsed span{

    display:none;

}

.main-content{
    margin-top:70px;      
    margin-left:0;
    transition:.3s;
    padding:10px;
}

.main-content.expand{
    margin-left:240px;
}
*{
    margin:0;
    padding:0;
    box-sizing:border-box;
}

html{
    scroll-behavior:smooth;
}

body{
    font-family:"Segoe UI",-apple-system,BlinkMacSystemFont,sans-serif;
    background:
        radial-gradient(circle at top right,#2563eb18,transparent 30%),
        radial-gradient(circle at bottom left,#7c3aed18,transparent 35%),
        var(--bg);
    color:var(--text);
    line-height:1.6;
    overflow-x:hidden;
}

/* Scrollbar */

::-webkit-scrollbar{
    width:10px;
}

::-webkit-scrollbar-track{
    background:var(--surface);
}

::-webkit-scrollbar-thumb{
    background:linear-gradient(var(--primary),var(--secondary));
    border-radius:20px;
}



.card{
    background:linear-gradient(180deg,var(--card),var(--surface));
    border:1px solid var(--border);
    border-radius:22px;
    padding:32px;
    margin-bottom:28px;
    box-shadow:var(--shadow);
    transition:var(--transition);
}

.card:hover{
    transform:translateY(-6px);
    border-color:#3b82f6;
}

.card h3{
    font-size:24px;
    font-weight:700;
    margin-bottom:18px;
    display:flex;
    align-items:center;
    gap:12px;
}

.card-note{
    color:var(--muted);
    line-height:1.8;
    margin-bottom:22px;
}

/* =========================
          FORMS
========================= */

.field-row{
    display:flex;
    flex-wrap:wrap;
    gap:16px;
    margin-bottom:18px;
    align-items:center;
}

.field-row label,
.inline{
    color:var(--muted);
    font-size:14px;
    font-weight:600;
}

input,
select,
textarea{
    background:#0b1220;
    color:white;

    border:1px solid var(--border);

    border-radius:12px;

    padding:13px 15px;

    font-size:15px;

    transition:var(--transition);
}

input:hover,
select:hover,
textarea:hover{
    border-color:#3b82f6;
}

input:focus,
select:focus,
textarea:focus{
    outline:none;
    border-color:#60a5fa;
    box-shadow:0 0 0 4px rgba(96,165,250,.15);
}

/* =========================
          BUTTONS
========================= */

button{
    border:none;
    cursor:pointer;

    border-radius:12px;

    padding:13px 24px;

    font-size:15px;
    font-weight:700;

    color:white;

    background:linear-gradient(135deg,var(--primary),var(--secondary));

    transition:var(--transition);
}

button:hover{
    transform:translateY(-3px);
    box-shadow:0 16px 35px rgba(59,130,246,.30);
}

button:active{
    transform:scale(.98);
}

button.danger{
    background:linear-gradient(135deg,#ef4444,#dc2626);
}

button.ghost{
    background:transparent;
    border:1px solid var(--border);
}

button.ghost:hover{
    background:rgba(255,255,255,.05);
}

/* =========================
          BADGES
========================= */

.badge{
    display:inline-flex;
    align-items:center;
    gap:8px;

    padding:8px 16px;

    border-radius:999px;

    background:rgba(59,130,246,.12);

    border:1px solid rgba(59,130,246,.35);

    color:#7dd3fc;

    font-size:13px;

    font-weight:700;
}

/* =========================
          TABLES
========================= */

table{
    width:100%;
    border-collapse:collapse;
    margin-top:20px;
    overflow:hidden;
    border-radius:18px;
}

thead{
    background:#111c30;
}

th{
    padding:16px;
    text-align:left;
    color:#cbd5e1;
    font-size:13px;
    text-transform:uppercase;
    letter-spacing:1px;
}

td{
    padding:16px;
    border-top:1px solid rgba(255,255,255,.06);
}

tbody tr{
    transition:var(--transition);
}

tbody tr:hover{
    background:rgba(255,255,255,.03);
}

/* =========================
      RESULT ALERTS
========================= */

.result-box{
    display:none;
    margin-top:18px;
    padding:18px;
    border-radius:14px;
    font-size:15px;
    font-weight:600;
}
.user-menu{
    position:relative;
    display:inline-block;
}

.user-btn{
    background:none;
    border:none;
    color:white;
    font-size:16px;
    font-weight:600;
    cursor:pointer;
}

.user-btn:hover{
    color:#8ea2ff;
}

.dropdown{
    display:none;
    position:absolute;
    right:0;
    top:42px;
    width:200px;
    background:#18253f;
    border-radius:12px;
    overflow:hidden;
    box-shadow:0 10px 30px rgba(0,0,0,.35);
    z-index:999;
}

.dropdown a{
    display:block;
    padding:14px 18px;
    color:white;
    text-decoration:none;
}

.dropdown a:hover{
    background:#243455;
}

.dropdown hr{
    border:none;
    border-top:1px solid rgba(255,255,255,.1);
}

.result-box.show{
    display:block;
}

.result-success{
    background:rgba(34,197,94,.10);
    border:1px solid rgba(34,197,94,.35);
    color:#4ade80;
}

.result-error{
    background:rgba(239,68,68,.10);
    border:1px solid rgba(239,68,68,.35);
    color:#f87171;
}
/* ===========================
        ANIMATIONS
=========================== */

.fade-up{
    animation:fadeUp .8s ease both;
}

.fade-delay-1{
    animation-delay:.2s;
}

.fade-delay-2{
    animation-delay:.4s;
}

.fade-delay-3{
    animation-delay:.6s;
}

@keyframes fadeUp{

    from{
        opacity:0;
        transform:translateY(35px);
    }

    to{
        opacity:1;
        transform:translateY(0);
    }

}
@keyframes navFloat{
    0%,100%{
        transform:translateY(-3px);
    }
    50%{
        transform:translateY(-6px);
    }
}
@keyframes pulseGlow{

    0%{
        box-shadow:0 0 0 rgba(59,130,246,.4);
    }

    50%{
        box-shadow:0 0 30px rgba(59,130,246,.45);
    }

    100%{
        box-shadow:0 0 0 rgba(59,130,246,.4);
    }

}

/* ===========================
      RESPONSIVE DESIGN
=========================== */

@media (max-width:1100px){

    .topnav{
        padding:18px 25px;
    }

    .page-wrap{
        width:94%;
    }

}

@media (max-width:900px){

    .topnav{
        flex-direction:column;
        gap:18px;
    }

    .topnav nav{
        flex-wrap:wrap;
        justify-content:center;
    }

    .page-title{
        font-size:36px;
    }

    .card{
        padding:24px;
    }

}

@media (max-width:700px){

    .field-row{
        flex-direction:column;
        align-items:stretch;
    }

    input,
    select,
    textarea,
    button{
        width:100%;
    }

    table{
        display:block;
        overflow-x:auto;
        white-space:nowrap;
    }

}

@media (max-width:500px){

    .brand{
        font-size:18px;
    }

    .page-title{
        font-size:30px;
    }

    .page-subtitle{
        font-size:15px;
    }

    .card{
        border-radius:18px;
    }
    html{
    scroll-behavior: smooth;
}
}
"""
def render_sidebar(active="dashboard"):
    return f"""
<header class="header">
    <div class="left-header">
        <button class="menu-btn" onclick="toggleSidebar()">☰</button>
        <a href="/" class="brand">
    <span class="brand-icon">🏥</span>
    <span>HealthForecast AI</span>
</a>
    </div>
</header>

<aside class="sidebar" id="sidebar">

    <a href="/dashboard" class="{"active" if active=="dashboard" else ""}">
        🏠 <span>Dashboard</span>
    </a>

    <a href="/admissions" class="{"active" if active=="admissions" else ""}">
        🏥 <span>Admissions</span>
    </a>

    <a href="/patients-page" class="{"active" if active=="patients" else ""}">
        👨‍⚕️ <span>Patients</span>
    </a>

    <a href="/risk-prediction" class="{"active" if active=="prediction" else ""}">
        🧠 <span>Prediction</span>
    </a>

    <a href="/analytics" class="{"active" if active=="analytics" else ""}">
        📈 <span>Analytics</span>
    </a>

    <a href="/reports" class="{"active" if active=="reports" else ""}">
        📄 <span>Reports</span>
    </a>

    <a href="/contact" class="{"active" if active=="contact" else ""}">
        📞 <span>Contact</span>
    </a>

    <!-- Creator Profile -->
<a href="/creator" class="creator-profile">
    <div class="creator-mini">
        <img
            src="/static/profile.jpg"
            alt="Prathima Itikala"
            style="object-position: 50% 18%;"
        >

        <div class="creator-mini-text">
            <strong>Prathima Itikala</strong>
            <span>Creator & Developer</span>
        </div>
    </div>
</a>
    

</aside>

<style>
    .creator-profile {{
        position: absolute;
        bottom: 18px;
        left: 12px;
        right: 12px;
        cursor: pointer;
        z-index: 1000;
    }}

    .creator-mini {{
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 9px;
        border-radius: 10px;
        transition: background 0.2s ease;
    }}

    .creator-mini:hover {{
        background: rgba(255,255,255,0.06);
    }}

    .creator-mini img {{
        width: 38px;
        height: 38px;
        border-radius: 50%;
        object-fit: cover;
        border: 2px solid var(--accent);
    }}

    .creator-mini-text {{
        display: flex;
        flex-direction: column;
        min-width: 0;
    }}

    .creator-mini-text strong {{
        font-size: 13px;
        color: var(--text-primary);
        white-space: nowrap;
    }}

    .creator-mini-text span {{
        font-size: 11px;
        color: var(--text-secondary);
        margin-top: 2px;
        white-space: nowrap;
    }}

    .creator-card {{
        display: none;
        position: absolute;
        bottom: 58px;
        left: 0;
        width: 250px;
        padding: 18px;
        background: var(--bg-card);
        border: 1px solid var(--border);
        border-radius: 14px;
        box-shadow: 0 12px 35px rgba(0,0,0,0.35);
    }}

    .creator-card.show {{
        display: block;
    }}

    .creator-card > img {{
        width: 58px;
        height: 58px;
        border-radius: 50%;
        object-fit: cover;
        border: 2px solid var(--accent);
        display: block;
        margin-bottom: 10px;
    }}

    .creator-card h3 {{
        margin: 0;
        font-size: 17px;
        color: var(--text-primary);
    }}

    .creator-role {{
        margin: 3px 0 12px;
        font-size: 12px;
        color: var(--accent);
        font-weight: 600;
    }}

    .creator-purpose {{
        margin: 0 0 14px;
        font-size: 12px;
        line-height: 1.5;
        color: var(--text-secondary);
    }}

    .creator-card a {{
        display: block;
        padding: 7px 0;
        color: var(--text-primary);
        text-decoration: none;
        font-size: 12px;
    }}

    .creator-card a:hover {{
        color: var(--accent);
    }}
</style>

<script>

function toggleSidebar(){{
    const sidebar = document.getElementById("sidebar");
    const main = document.querySelector(".main-content");

    sidebar.classList.toggle("open");

    if (main) {{
        main.classList.toggle("expand");
    }}
}}

function toggleCreatorProfile(){{
    const card = document.getElementById("creatorCard");

    if (card) {{
        card.classList.toggle("show");
    }}
}}

</script>
"""

@app.get("/docs", include_in_schema=False, tags=["Home"])
def custom_swagger_ui_html():
    return HTMLResponse(f"""
    <!DOCTYPE html>
    <html>
    <head>
        <title>{app.title} - API Docs</title>
        <link rel="stylesheet" type="text/css" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css">
        <link rel="stylesheet" type="text/css" href="/static/swagger-dark.css">
        <style>{SHARED_STYLE}</style>
    </head>
    <body>
        {render_sidebar("")}
        <div id="swagger-ui"></div>
        <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
        <script>
            window.onload = () => {{
                window.ui = SwaggerUIBundle({{
                    url: '{app.openapi_url}',
                    dom_id: '#swagger-ui',
                    presets: [SwaggerUIBundle.presets.apis, SwaggerUIBundle.SwaggerUIStandalonePreset],
                }});
            }};
        </script>
    </body>
    </html>
    """)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@app.get("/", response_class=HTMLResponse, tags=["Home"], summary="Landing page")
def read_root():
    return f"""
<!DOCTYPE html>
<html lang="en">

<head>

<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">

<title>HealthForecast AI</title>

<style>

{SHARED_STYLE}

/* =======================================================
      HEALTHFORECAST AI
      MICROSOFT / OPENAI STYLE LANDING PAGE
=======================================================*/

body{{
    background:#050816;
    color:white;
    overflow-x:hidden;
}}

/*==========================
BACKGROUND
===========================*/

.background-grid{{

position:fixed;
inset:0;
z-index:-3;

background:

linear-gradient(rgba(255,255,255,.03) 1px,transparent 1px),

linear-gradient(90deg,rgba(255,255,255,.03) 1px,transparent 1px);

background-size:70px 70px;

mask-image:linear-gradient(to bottom,white,transparent);

opacity:.4;

}}

.glow{{

position:fixed;
border-radius:50%;
filter:blur(120px);

z-index:-2;

animation:floatGlow 18s ease-in-out infinite;

}}

.glow.one{{

width:500px;
height:500px;

left:-180px;
top:-120px;

background:#2563eb55;

}}

.glow.two{{

width:450px;
height:450px;

right:-150px;
bottom:-150px;

background:#7c3aed55;

animation-delay:6s;

}}
.glow.three{{
    width:350px;
    height:350px;
    left:40%;
    top:25%;
    background:#38bdf844;
    animation-delay:3s;
}}
@keyframes floatGlow{{

0%,100%{{
transform:translateY(0px);
}}

50%{{
transform:translateY(60px);
}}

}}

/*==========================
HERO
===========================*/


.hero{{
    width:min(1300px,92%);
    margin:auto;
    display:grid;
    grid-template-columns:1.1fr .9fr;
    align-items:center;
    min-height:75vh;
    gap:70px;
}}

.hero-left{{

animation:fadeUp .8s ease;

}}

.hero-tag{{

display:inline-flex;
align-items:center;
gap:10px;

padding:10px 18px;

border-radius:999px;

background:rgba(79,140,255,.12);

border:1px solid rgba(79,140,255,.35);
box-shadow:0 0 25px rgba(96,165,250,.25);

color:#7dd3fc;

font-weight:700;

margin-bottom:26px;

}}

.hero h1{{

font-size:72px;

font-weight:900;

line-height:1.05;

margin-bottom:26px;

letter-spacing:-2px;

}}

.hero h1 span{{

background:linear-gradient(
90deg,
#38bdf8,
#60a5fa,
#8b5cf6
);

-webkit-background-clip:text;
-webkit-text-fill-color:transparent;

}}

.hero p{{

font-size:18px;

line-height:1.9;

color:#b7c4da;

max-width:650px;

}}

.hero-actions{{

display:flex;
gap:18px;
margin-top:38px;

flex-wrap:wrap;

}}

.hero-actions a{{

padding:15px 32px;

border-radius:14px;

font-weight:700;

text-decoration:none;

transition:.35s;

}}

.primary-btn{{

background:linear-gradient(
135deg,
#2563eb,
#7c3aed
);

color:white;

box-shadow:0 20px 40px rgba(37,99,235,.35);

}}

.primary-btn:hover{{

transform:translateY(-6px) scale(1.03);
box-shadow:0 25px 60px rgba(37,99,235,.45);

}}

.secondary-btn{{
border:1px solid rgba(255,255,255,.12);

background:rgba(255,255,255,.03);

color:white;

}}

.secondary-btn:hover{{

background:rgba(255,255,255,.08);

}}

/*==========================
HERO CARD
===========================*/

.hero-card{{

background:rgba(15,23,42,.75);

backdrop-filter:blur(24px);
max-width:520px;
border:1px solid rgba(255,255,255,.08);

border-radius:24px;

padding:25px;

box-shadow:0 30px 60px rgba(0,0,0,.35);

animation:fadeUp 1s ease, floatCard 5s ease-in-out infinite;

}}

.hero-card h3{{

font-size:24px;

margin-bottom:25px;

}}

.metric{{

display:flex;

justify-content:space-between;

margin-bottom:14px;

padding-bottom:12px;

border-bottom:1px solid rgba(255,255,255,.06);

}}

.metric:last-child{{

border:none;

margin:0;

padding:0;

}}

.metric-value{{

font-size:26px;

font-weight:800;

color:#60a5fa;

}}

/*==========================
STATS
===========================*/


.stats{{
    width:min(1300px,92%);
    margin:40px auto;

    display:grid;
    grid-template-columns:repeat(4,1fr);
    gap:25px;
}}
.stat{{
    background:#101a2f;
    border:1px solid rgba(255,255,255,.06);
    border-radius:22px;
    padding:28px;
    text-align:center;
    transition:.35s;
}}

.stat:hover{{

transform:translateY(-8px);

border-color:#3b82f6;

}}

.stat h2{{

font-size:42px;

margin-bottom:10px;

background:linear-gradient(
90deg,
#38bdf8,
#818cf8
);

-webkit-background-clip:text;
-webkit-text-fill-color:transparent;

}}

.stat p{{

color:#94a3b8;

}}
/* ===========================================================
                    FEATURES SECTION
=========================================================== */


.section{{
    width:min(1300px,92%);
    margin:100px auto;
}}
.section-header{{
    text-align:center;
    max-width:760px;
    margin:auto auto 70px;
}}

.section-header span{{
    display:inline-block;
    padding:8px 18px;
    border-radius:999px;
    background:rgba(59,130,246,.12);
    color:#7dd3fc;
    font-size:13px;
    font-weight:700;
    letter-spacing:1px;
    margin-bottom:20px;
}}

.section-header h2{{
    font-size:52px;
    margin-bottom:20px;
    font-weight:800;
}}

.section-header p{{
    color:#94a3b8;
    line-height:1.9;
    font-size:17px;
}}

.features-grid{{

display:grid;

grid-template-columns:repeat(auto-fit,minmax(320px,1fr));

gap:32px;

}}

.feature{{

background:linear-gradient(
180deg,
rgba(24,37,59,.95),
rgba(13,22,39,.95)
);

border:1px solid rgba(255,255,255,.07);

border-radius:24px;

padding:35px;

transition:.35s;

position:relative;

overflow:hidden;

}}

.feature:hover{{

transform:translateY(-10px);

border-color:#3b82f6;

box-shadow:0 25px 50px rgba(0,0,0,.35);

}}

.feature::before{{

content:"";

position:absolute;

width:140px;
height:140px;

border-radius:50%;

right:-60px;
top:-60px;

background:rgba(59,130,246,.12);

}}

.feature-icon{{

width:74px;
height:74px;

border-radius:18px;

display:flex;

align-items:center;
justify-content:center;

font-size:34px;

background:linear-gradient(
135deg,
#2563eb,
#7c3aed
);

margin-bottom:26px;

}}

.feature h3{{

font-size:24px;

margin-bottom:16px;

}}

.feature p{{

color:#9fb0c8;

line-height:1.9;

}}

/* ===========================================================
                    AI WORKFLOW
=========================================================== */

.workflow{{

display:grid;

grid-template-columns:repeat(4,1fr);

gap:28px;

margin-top:80px;

}}

.step{{

position:relative;

background:#101b31;

padding:35px;

border-radius:22px;

border:1px solid rgba(255,255,255,.06);

transition:.35s;

}}

.step:hover{{

transform:translateY(-8px);

border-color:#3b82f6;

}}

.step-number{{

width:55px;

height:55px;

border-radius:50%;

display:flex;

align-items:center;

justify-content:center;

font-size:22px;

font-weight:800;

background:linear-gradient(
135deg,
#2563eb,
#7c3aed
);

margin-bottom:24px;

}}

.step h4{{

font-size:22px;

margin-bottom:14px;

}}

.step p{{

color:#9fb0c8;

line-height:1.8;

}}

/* ===========================================================
                     ROLE CARDS
=========================================================== */

.roles{{

display:grid;

grid-template-columns:repeat(auto-fit,minmax(270px,1fr));

gap:28px;

margin-top:80px;

}}

.role{{

background:#101a30;

border:1px solid rgba(255,255,255,.07);

padding:32px;

border-radius:22px;

transition:.35s;

}}

.role:hover{{

transform:translateY(-8px);

border-color:#60a5fa;

}}

.role h3{{

margin-bottom:15px;

font-size:24px;

}}

.role p{{

color:#9db0ca;

line-height:1.8;

}}

.role ul{{

margin-top:18px;

padding-left:18px;

color:#cbd5e1;

line-height:2;

}}

@keyframes floatCard{{
    0%,100%{{
        transform:translateY(0px);
    }}
    50%{{
        transform:translateY(-12px);
    }}
}}
.role ul{{
    margin-top:18px;
    padding-left:18px;
    color:#cbd5e1;
    line-height:2;
}}

/* ===== PASTE THE CHART CSS HERE ===== */

.chart{{

display:flex;

align-items:flex-end;

justify-content:space-between;

height:70px;

margin-top:10px;

gap:12px;

}}

.bar{{

flex:1;

border-radius:12px 12px 4px 4px;

background:linear-gradient(
180deg,
#38bdf8,
#2563eb,
#7c3aed
);

animation:growBars 1.5s ease;
animation:growBars 1.2s ease forwards;
transition:.35s;

}}

.bar:hover{{

transform:scaleY(1.08);

filter:brightness(1.2);

}}

@keyframes growBars{{

from{{

height:0;

}}

}}
.login-btn{{

color:var(--muted);

background:transparent;

padding:8px 14px;

border-radius:10px;

transition:.3s;

}}

.login-btn:hover{{

background:rgba(255,255,255,.08);

color:white;

}}
/* ===== END OF NEW CSS ===== */
/*==========================
FLOATING CARDS
==========================*/

@media(max-width:900px){{

.floating-card{{

display:none;

}}

}}

    </style>
</head>

<body>

{render_sidebar("home")}
<div class="main-content">
<div class="background-grid"></div>

<div class="glow one"></div>
<div class="glow two"></div>
<div class="glow three"></div>
<section class="hero">

<!-- ========================= HERO ========================= -->

<div class="hero-left">

<div class="hero-tag">
🚀 Trusted by Modern Healthcare Teams
</div>

<h1>
Predict Smarter.
<span>Care Faster.</span>
</h1>



</h1>

<p>

HealthForecast AI is an enterprise-grade healthcare intelligence platform that empowers hospitals with AI-powered patient readmission prediction, clinical analytics, secure role-based access, and real-time decision support.

</p>

<div class="hero-actions">

<a href="/portal" class="primary-btn">

Get Started

</a>

<a href="/dashboard" class="secondary-btn">

View Dashboard

</a>

</div>

</div>

<div class="hero-card">

    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:25px;">
        <h3 style="margin:0;">AI Dashboard</h3>

        <span style="
            background:#16a34a;
            color:white;
            padding:6px 12px;
            border-radius:20px;
            font-size:13px;
            font-weight:700;">
            ● LIVE
        </span>
    </div>

    <div class="metric">
        <span>Prediction Accuracy</span>
        <div class="metric-value">77%</div>
    </div>

    <div class="metric">
        <span>Today's Predictions</span>
        <div class="metric-value">1,248</div>
    </div>

    <div class="metric">
        <span>High Risk Patients</span>
        <div class="metric-value" style="color:#f59e0b;">28</div>
    </div>

    <div class="metric">
        <span>AI Status</span>
        <div class="metric-value" style="color:#22c55e;">Online</div>
    </div>
<hr style="border:none;border-top:1px solid rgba(255,255,255,.08);margin:28px 0;">

<h4 style="margin-bottom:18px;font-size:18px;">
Prediction Trend
</h4>

<div class="chart">

    <div class="bar" style="height:45%;"></div>

    <div class="bar" style="height:65%;"></div>

    <div class="bar" style="height:80%;"></div>

    <div class="bar" style="height:58%;"></div>

    <div class="bar" style="height:92%;"></div>

    <div class="bar" style="height:76%;"></div>

</div>
</div>

</section>

<!-- ========================= STATS ========================= -->

<section class="stats">

<div class="stat">
<h2>99K+</h2>
<p>Clinical Records</p>
</div>

<div class="stat">
<h2>77%</h2>
<p>Prediction Accuracy</p>
</div>

<div class="stat">
<h2>120+</h2>
<p>Healthcare Centers</p>
</div>

<div class="stat">
<h2>24/7</h2>
<p>AI Availability</p>
</div>

</section>

<!-- ========================= FEATURES ========================= -->

<section class="section" id="features">

<div class="section-header">

<span>FEATURES</span>

<h2>

Everything Hospitals Need

</h2>

<p>

Built with FastAPI, SQLAlchemy,
JWT Authentication and XGBoost
to modernize healthcare intelligence.

</p>

</div>

<div class="features-grid">

<div class="feature">

<div class="feature-icon">

🧠

</div>

<h3>

AI Prediction

</h3>

<p>

Predict patient readmission risk within
seconds using a trained XGBoost model.

</p>

</div>

<div class="feature">

<div class="feature-icon">

📊

</div>

<h3>

Clinical Analytics

</h3>

<p>

Track treatment effectiveness,
patient outcomes and trends.

</p>

</div>

<div class="feature">

<div class="feature-icon">

🔒

</div>

<h3>

Enterprise Security

</h3>

<p>

JWT authentication with
role-based authorization.

</p>

</div>

<div class="feature">

<div class="feature-icon">

⚡

</div>

<h3>

Real-Time AI

</h3>

<p>

Optimized prediction engine
running in under one second.

</p>

</div>

<div class="feature">

<div class="feature-icon">

🏥

</div>

<h3>

Hospital Management

</h3>

<p>

Manage patients,
admissions and readmission risks.

</p>

</div>

<div class="feature">

<div class="feature-icon">

☁️

</div>

<h3>

Cloud Ready

</h3>

<p>

Deploy seamlessly on Azure,
AWS or modern cloud platforms.

</p>

</div>

</div>

</section>
<!-- ========================= AI WORKFLOW ========================= -->

<section class="section">

<div class="section-header">

<span>WORKFLOW</span>

<h2>How HealthForecast AI Works</h2>

<p>
A streamlined AI-powered workflow that transforms patient data
into actionable predictions for healthcare professionals.
</p>

</div>

<div class="workflow">

<div class="step">

<div class="step-number">1</div>

<h4>Collect Data</h4>

<p>
Patient demographics, laboratory reports,
medical history and hospital admission data
are securely collected.
</p>

</div>

<div class="step">

<div class="step-number">2</div>

<h4>AI Processing</h4>

<p>
The trained XGBoost model preprocesses
the information and predicts the
probability of readmission.
</p>

</div>

<div class="step">

<div class="step-number">3</div>

<h4>Risk Analysis</h4>

<p>
Patients are categorized into
Low, Medium and High risk groups
for better clinical prioritization.
</p>

</div>

<div class="step">

<div class="step-number">4</div>

<h4>Clinical Decision</h4>

<p>
Doctors receive intelligent insights
to improve treatment planning
and reduce avoidable readmissions.
</p>

</div>

</div>

</section>

<!-- ========================= USER ROLES ========================= -->

<section class="section">

<div class="section-header">

<span>PLATFORM</span>

<h2>Designed for Every Healthcare Professional</h2>

</div>

<div class="roles">

<div class="role">

<h3>👨‍⚕️ Doctors</h3>

<p>
Predict patient risk, review medical history,
and receive AI-assisted
AI recommendations before making
clinical decisions.
</p>

<ul>
<li>Readmission prediction</li>
<li>Patient history</li>
<li>Risk analysis</li>
<li>Treatment insights</li>
</ul>

</div>

<div class="role">

<h3>🩺 Nurses</h3>

<p>

Monitor admitted patients,
view alerts and coordinate
timely follow-up care.

</p>

<ul>
<li>Patient monitoring</li>
<li>Vitals tracking</li>
<li>Follow-up reminders</li>
<li>Care coordination</li>
</ul>

</div>

<div class="role">

<h3>🏥 Hospital Admin</h3>

<p>

Manage users, monitor hospital
performance and analyze
readmission statistics.

</p>

<ul>
<li>Dashboard analytics</li>
<li>User management</li>
<li>Reports</li>
<li>Hospital insights</li>
</ul>

</div>

<div class="role">

<h3>🤖 AI Platform</h3>

<p>

Machine learning continuously
analyzes patient data to provide
fast and accurate predictions.

</p>

<ul>
<li>XGBoost Model</li>
<li>FastAPI Backend</li>
<li>Secure Authentication</li>
<li>REST APIs</li>
</ul>

</div>

</div>

</section>

<!-- ================= CTA ================= -->

<section class="section">

<div style="
background:linear-gradient(135deg,#2563eb,#7c3aed);
padding:70px;
border-radius:30px;
text-align:center;
box-shadow:0 30px 60px rgba(37,99,235,.35);
">

<h2 style="font-size:48px;margin-bottom:20px;">

Transform Healthcare with AI

</h2>

<p style="
font-size:18px;
max-width:760px;
margin:auto;
line-height:1.9;
opacity:.95;
">

Empower clinicians with intelligent
patient readmission prediction,
real-time analytics and secure
healthcare management.

</p>

<div style="margin-top:40px;">

<a href="/portal"
class="primary-btn"
style="margin-right:15px;">

Launch Portal

</a>

<a href="/docs"
class="secondary-btn">

API Documentation

</a>

</div>

</div>

</section>

<footer style="
padding:45px 0;
border-top:1px solid rgba(255,255,255,.08);
text-align:center;
color:#94a3b8;
margin-top:80px;
">

<h3 style="
font-size:28px;
margin-bottom:12px;
color:white;
">

HealthForecast AI

</h3>

<p>

AI-Powered Hospital Readmission Prediction Platform

</p>

<p style="margin-top:15px;font-size:14px;">

© 2026 HealthForecast AI.
Built with FastAPI • SQLAlchemy • XGBoost • JWT Authentication

</p> 

</footer>
<script>
const home = document.getElementById("homeLink");
const features = document.getElementById("featuresLink");

features.addEventListener("click", function () {{
    home.classList.remove("current");
    features.classList.add("current");
}});

home.addEventListener("click", function () {{
    features.classList.remove("current");
    home.classList.add("current");
}});
</script>
<script>
const home = document.getElementById("homeLink");
const features = document.getElementById("featuresLink");
const featureSection = document.getElementById("features");

window.addEventListener("scroll", () => {{
    const sectionTop = featureSection.offsetTop - 100;
    const sectionBottom = sectionTop + featureSection.offsetHeight;

    if (window.scrollY >= sectionTop && window.scrollY < sectionBottom) {{
        home.classList.remove("current");
        features.classList.add("current");
    }} else {{
        features.classList.remove("current");
        home.classList.add("current");
    }}
}});
</script>
</body>

</html>
"""
 






@app.post(
    "/register",
    tags=["Authentication"],
    summary="Register a new user",
    description="Creates a new user account with a specified role (doctor, hospital_admin, researcher, or system_admin)."
)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(models.User).filter(models.User.email == user.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    valid_roles = ["doctor", "hospital_admin", "researcher", "system_admin"]
    if user.role not in valid_roles:
        raise HTTPException(status_code=400, detail=f"Role must be one of {valid_roles}")

    new_user = models.User(
        email=user.email,
        hashed_password=hash_password(user.password),
        full_name=user.full_name,
        role=user.role
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"message": "User registered successfully", "user_id": new_user.id, "role": new_user.role}


@app.post(
    "/login",
    response_model=schemas.Token,
    tags=["Authentication"],
    summary="Login and receive access token",
    description="Authenticates a user and returns a JWT access token valid for 60 minutes."
)
def login(user: schemas.UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if not db_user or not verify_password(user.password, db_user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect email or password")

    access_token = create_access_token(data={"sub": db_user.email, "role": db_user.role})
    return {"access_token": access_token, "token_type": "bearer"}


@app.get(
    "/me",
    tags=["User Info"],
    summary="Get current logged-in user",
    description="Returns the email and role of the currently authenticated user."
)
def read_current_user(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user = db.query(models.User).filter(
        models.User.email == current_user["sub"]
    ).first()

    return {
        "full_name": user.full_name,
        "email": user.email,
        "role": user.role
    }


@app.post(
    "/patients",
    tags=["Patient Management"],
    summary="Add a new patient"
)
def add_patient(
    patient: schemas.PatientAdmissionCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_role(["doctor", "system_admin"]))
):
    new_patient = models.PatientAdmission(
    patient_name=patient.patient_name,
    race=patient.race,
    gender=patient.gender,
    age=patient.age,
    time_in_hospital=patient.time_in_hospital,
    num_medications=patient.num_medications,
    insulin=patient.insulin,
    change=patient.change,
    admitted_by=current_user["sub"]
)

    db.add(new_patient)
    db.commit()
    db.refresh(new_patient)

    return {
        "message": "Patient added successfully",
        "patient_id": new_patient.id
    }


@app.get(
    "/patients",
    tags=["Patient Management"],
    summary="Get all patients"
)
def get_patients(
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_role(["doctor", "system_admin"]))
):
    return db.query(models.PatientAdmission).all()
@app.delete("/patients/{patient_id}")
def delete_patient(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_role(["doctor", "system_admin"]))
):

    patient = db.query(models.PatientAdmission).filter(
        models.PatientAdmission.id == patient_id
    ).first()

    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    db.delete(patient)
    db.commit()

    return {"message": "Patient deleted successfully"}
@app.put("/patients/{patient_id}")
def update_patient(
    patient_id: int,
    patient: schemas.PatientAdmissionCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_role(["doctor", "system_admin"]))
):

    existing = db.query(models.PatientAdmission).filter(
        models.PatientAdmission.id == patient_id
    ).first()

    if not existing:
        raise HTTPException(status_code=404, detail="Patient not found")

    existing.patient_name = patient.patient_name
    existing.race = patient.race
    existing.gender = patient.gender
    existing.age = patient.age
    existing.time_in_hospital = patient.time_in_hospital
    existing.num_medications = patient.num_medications
    existing.insulin = patient.insulin
    existing.change = patient.change

    db.commit()

    return {"message": "Patient updated successfully"}
@app.get(
    "/doctor-only",
    tags=["Patient Risk"],
    summary="Doctor/Admin protected route",
    description="Example protected route accessible only to Doctors and System Administrators."
)
def doctor_only_route(current_user: dict = Depends(require_role(["doctor", "system_admin"]))):
    return {"message": f"Welcome Doctor/Admin {current_user['sub']}, you can see patient risk data here."}


@app.get(
    "/admin/users",
    response_model=List[schemas.UserOut],
    tags=["User Management"],
    summary="View all users",
    description="Returns a list of all registered users. System Administrator access only."
)
def get_all_users(
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_role(["system_admin"]))
):
    return db.query(models.User).all()


@app.get(
    "/admin/users/{user_id}",
    response_model=schemas.UserOut,
    tags=["User Management"],
    summary="View a single user",
    description="Returns details for one specific user by ID. System Administrator access only."
)
def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_role(["system_admin"]))
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@app.put(
    "/admin/users/{user_id}/role",
    response_model=schemas.UserOut,
    tags=["User Management"],
    summary="Update a user's role",
    description="Changes a user's role. System Administrator access only."
)
def update_user_role(
    user_id: int,
    role_update: schemas.UserUpdateRole,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_role(["system_admin"]))
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    valid_roles = ["doctor", "hospital_admin", "researcher", "system_admin"]
    if role_update.role not in valid_roles:
        raise HTTPException(status_code=400, detail=f"Role must be one of {valid_roles}")

    user.role = role_update.role
    db.commit()
    db.refresh(user)
    return user


@app.delete(
    "/admin/users/{user_id}",
    tags=["User Management"],
    summary="Delete a user",
    description="Permanently deletes a user account. System Administrator access only."
)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_role(["system_admin"]))
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    db.delete(user)
    db.commit()
    return {"message": f"User {user_id} deleted successfully"}


@app.get(
    "/admin/feedback",
    tags=["User Management"],
    summary="View all feedback",
    description="Returns all submitted feedback entries. System Administrator access only."
)
def get_all_feedback(
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_role(["system_admin"]))
):
    items = db.query(models.Feedback).order_by(models.Feedback.created_at.desc()).all()
    return [
        {
            "id": f.id,
            "name": f.name,
            "email": f.email,
            "message": f.message,
            "created_at": f.created_at.strftime("%Y-%m-%d %H:%M") if f.created_at else ""
        }
        for f in items
    ]
@app.post(
    "/predict-readmission",
    response_model=schemas.PredictionOutput,
    tags=["Patient Risk"],
    summary="Predict patient readmission risk",
    description="Runs the trained XGBoost model to predict a patient's 30-day readmission risk. Doctor/System Administrator access only."
)
def predict_patient_risk(
    patient: schemas.PatientPredictionInput,
    current_user: dict = Depends(require_role(["doctor", "system_admin"]))
):
    result = predict_readmission(patient.dict())
    return result
@app.get("/dashboard/stats")
def dashboard_stats(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    import os
    import pandas as pd

    # Read the actual diabetes dataset
    dataset_path = os.path.join(
        os.path.dirname(__file__),
        "dataset",
        "diabetic_data.csv"
    )

    try:
        df = pd.read_csv(dataset_path)
        total_patients = len(df)
    except Exception:
        total_patients = 0

    # Actual application predictions stored in database
    total_predictions = db.query(models.PatientAdmission).count()

    # Actual high-risk predictions stored in database
    high_risk_patients = db.query(
        models.PatientAdmission
    ).filter(
        models.PatientAdmission.risk_category == "High"
    ).count()

    return {
        "total_patients": total_patients,
        "high_risk_patients": high_risk_patients,
        "total_admissions": total_predictions,
        "prediction_accuracy": 77
    }
@app.post(
    "/feedback",
    tags=["Home"],
    summary="Submit feedback",
    description="Stores user feedback in the database."
)
def submit_feedback(feedback: schemas.FeedbackCreate, db: Session = Depends(get_db)):
    new_feedback = models.Feedback(
        name=feedback.name,
        email=feedback.email,
        message=feedback.message
    )
    db.add(new_feedback)
    db.commit()
    return {"message": "Feedback submitted successfully"}

@app.get("/risk-prediction", response_class=HTMLResponse)
def risk_prediction():

    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <title>Risk Prediction</title>

        <style>
        {SHARED_STYLE}
        .progress{{

    width:100%;
    height:20px;
    background:#263248;
    border-radius:20px;
    overflow:hidden;
    margin:20px 0;

}}

#progressBar{{

    width:0%;
    height:100%;
    background:linear-gradient(90deg,#22c55e,#f59e0b,#ef4444);
    transition:1s;

}}

#riskTitle{{

    font-size:30px;

}}

#probability{{

    font-size:45px;
    color:#60a5fa;

}}
        </style>

    </head>

    <body>

    
    {render_sidebar("prediction")}
    <div class="main-content">
    <div class="page-wrap">

        <div class="eyebrow">
            AI Prediction
        </div>

        <h1 class="page-title">
            🧠 Patient Readmission Risk Prediction
        </h1>

        <p class="page-subtitle">
            Enter patient information to predict the probability of hospital readmission.
        </p>

        <div class="card">

<h3>🧠 Patient Readmission Prediction</h3>

<form id="predictionForm">

<div class="field-row">

<select id="age">

<option value="[0-10)">0-10</option>
<option value="[10-20)">10-20</option>
<option value="[20-30)">20-30</option>
<option value="[30-40)">30-40</option>
<option value="[40-50)">40-50</option>
<option value="[50-60)">50-60</option>
<option value="[60-70)">60-70</option>
<option value="[70-80)">70-80</option>
<option value="[80-90)">80-90</option>
<option value="[90-100)">90-100</option>

</select>
<select id="race">

<option value="Caucasian">Caucasian</option>

<option value="AfricanAmerican">African American</option>

<option value="Asian">Asian</option>

<option value="Hispanic">Hispanic</option>

<option value="Other">Other</option>

</select>

<select id="gender">
<option value="Male">Male</option>
<option value="Female">Female</option>
</select>

</div>

<div class="field-row">

<input
type="number"
id="time_in_hospital"
placeholder="Time in Hospital">

<input
type="number"
id="num_medications"
placeholder="Number of Medications">

</div>

<div class="field-row">

<select id="insulin">
<option value="No">No</option>
<option value="Up">Up</option>
<option value="Down">Down</option>
<option value="Steady">Steady</option>
</select>

<select id="change">
    <option value="0">No</option>
    <option value="1">Changed</option>
</select>

</div>

<button type="button" onclick="predictRisk()">
Predict Risk
</button>
<button
type="button"
class="ghost"
onclick="clearPrediction()">
    Clear
</button>
</form>

<div id="result" class="result-box">

    <h2 id="riskTitle"></h2>

    <h3>Readmission Probability</h3>

    <h1 id="probability"></h1>

    <div class="progress">
        <div id="progressBar"></div>
    </div>

    <h3>Clinical Recommendation</h3>

    <p id="recommendation"></p>

</div>

</div>

    </div>
    </div>
    <script>

async function predictRisk(){{
console.log("Predict button clicked");
    const data = {{

    race: document.getElementById("race").value,

    gender: document.getElementById("gender").value,

    age: document.getElementById("age").value,

    time_in_hospital: parseInt(
        document.getElementById("time_in_hospital").value
    ),

    num_medications: parseInt(
        document.getElementById("num_medications").value
    ),

    insulin: document.getElementById("insulin").value,

    change: parseInt(document.getElementById("change").value)

}};

   const resultBox = document.getElementById("result");

resultBox.classList.add("show");
document.getElementById("riskTitle").innerHTML = "Predicting...";

    try{{

        const token = localStorage.getItem("token");

const response = await fetch("/predict-readmission", {{
    method: "POST",
headers: {{
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token
    }},
    body: JSON.stringify(data)
}});

      const result = await response.json();

if (!response.ok) {{
    resultBox.classList.add("show");
    resultBox.innerHTML =
        "<b>Prediction Error:</b><br>" +
        JSON.stringify(result.detail, null, 2);
    console.log("Prediction API error:", result);
    return;
}}

let recommendation = "";

if (result.risk_category === "High") {{
    recommendation = "Immediate follow-up and care plan recommended.";
}} else if (result.risk_category === "Medium") {{
    recommendation = "Schedule follow-up within 7 days.";
}} else {{
    recommendation = "Continue routine monitoring.";
}}

document.getElementById("riskTitle").innerHTML =
"Risk Level : " + result.risk_category;

document.getElementById("probability").innerHTML =
(result.readmission_probability * 100).toFixed(2) + "%";

document.getElementById("progressBar").style.width =
(result.readmission_probability * 100) + "%";

document.getElementById("recommendation").innerHTML =
recommendation;

    }}
    catch(error){{
    console.error("Prediction error:", error);
    resultBox.classList.add("show");
    document.getElementById("riskTitle").innerHTML =
        "Prediction Failed: " + error.message;
}}

}}
function clearPrediction(){{

    document.getElementById("predictionForm").reset();

    document.getElementById("result").classList.remove("show");

    document.getElementById("riskTitle").innerHTML = "";

    document.getElementById("probability").innerHTML = "";

    document.getElementById("recommendation").innerHTML = "";

    document.getElementById("progressBar").style.width = "0%";

}}

</script>
    </body>
    </html>
    """
@app.get("/patients-page", response_class=HTMLResponse)
def patients_page():
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <title>Patient Management</title>
        <style>
        {SHARED_STYLE}
        </style>
    </head>

    <body>

    {render_sidebar("patients")}

    <div class="main-content">
    <div class="page-wrap">

    <h1>👨‍⚕️ Patient Management</h1>

    <div class="card">

    <h3>Add Patient</h3>

    <form id="patientForm">

        <input id="patient_name" placeholder="Patient Name">

        <select id="race">
            <option>Caucasian</option>
            <option>AfricanAmerican</option>
            <option>Asian</option>
            <option>Hispanic</option>
            <option>Other</option>
        </select>

        <select id="gender">
            <option>Male</option>
            <option>Female</option>
        </select>

        <select id="age">
            <option>[0-10)</option>
            <option>[10-20)</option>
            <option>[20-30)</option>
            <option>[30-40)</option>
            <option>[40-50)</option>
            <option>[50-60)</option>
            <option>[60-70)</option>
            <option>[70-80)</option>
            <option>[80-90)</option>
            <option>[90-100)</option>
        </select>

        <input
        type="number"
        id="time_in_hospital"
        placeholder="Days">

        <input
        type="number"
        id="num_medications"
        placeholder="Medications">

        <select id="insulin">
            <option>No</option>
            <option>Up</option>
            <option>Down</option>
            <option>Steady</option>
        </select>

        <select id="change">
            <option>No</option>
            <option>Ch</option>
        </select>

        <button
type="button"
id="saveBtn"
onclick="savePatient()">
    Add Patient
</button>

    </form>

    </div>

    <div class="card">

        <h3>Patients</h3>

        <table id="patientsTable">

            <thead>

            <tr>

                <th>ID</th>
                <th>Name</th>
                <th>Age</th>
                <th>Gender</th>
                <th>Hospital Days</th>
                <th>Action</th>

            </tr>

            </thead>

            <tbody></tbody>

        </table>

    </div>

    </div>
    </div>
<script>
let editingPatientId = null;
async function addPatient(){{

    const token = localStorage.getItem("token");

    const data = {{

        patient_name: document.getElementById("patient_name").value,

        race: document.getElementById("race").value,

        gender: document.getElementById("gender").value,

        age: document.getElementById("age").value,

        time_in_hospital: parseInt(document.getElementById("time_in_hospital").value),

        num_medications: parseInt(document.getElementById("num_medications").value),

        insulin: document.getElementById("insulin").value,

       change:
    document.getElementById("change").value === "Ch"
    ? 1
    : 0

    }};

    const response = await fetch("/patients",{{

        method:"POST",

        headers:{{
            "Content-Type":"application/json",
            "Authorization":"Bearer "+token
        }},

        body:JSON.stringify(data)

    }});

    const result = await response.json();
    alert(result.message);
    loadPatients();

document.getElementById("patientForm").reset();

}}
async function loadPatients() {{

    const token = localStorage.getItem("token");

    const response = await fetch("/patients", {{

        headers: {{
            "Authorization": "Bearer " + token
        }}

    }});

    const patients = await response.json();

    const tbody = document.querySelector("#patientsTable tbody");

    tbody.innerHTML = "";

    patients.forEach(patient => {{

        tbody.innerHTML += `
        <tr>
            <td>${{patient.id}}</td>
            <td>${{patient.patient_name}}</td>
            <td>${{patient.age}}</td>
            <td>${{patient.gender}}</td>
            <td>${{patient.time_in_hospital}}</td>

            <td>
                <button onclick="editPatient(${{patient.id}})">Edit</button>

                <button onclick="deletePatient(${{patient.id}})">Delete</button>
            </td>

        </tr>
        `;

    }});

}}
function editPatient(id) {{

    editingPatientId = id;

    const rows = document.querySelectorAll("#patientsTable tbody tr");

    rows.forEach(row => {{

        if(parseInt(row.cells[0].innerText) === id){{

            document.getElementById("patient_name").value = row.cells[1].innerText;
            document.getElementById("age").value = row.cells[2].innerText;
            document.getElementById("gender").value = row.cells[3].innerText;
            document.getElementById("time_in_hospital").value = row.cells[4].innerText;

        }}

    }});

    document.getElementById("saveBtn").innerText = "Update Patient";

}}
async function savePatient(){{

    if(editingPatientId === null){{
        addPatient();
    }}
    else{{
        updatePatient();
    }}

}}
async function updatePatient(){{

    const token = localStorage.getItem("token");

    const data = {{

        patient_name: document.getElementById("patient_name").value,

        race: document.getElementById("race").value,

        gender: document.getElementById("gender").value,

        age: document.getElementById("age").value,

        time_in_hospital: parseInt(document.getElementById("time_in_hospital").value),

        num_medications: parseInt(document.getElementById("num_medications").value),

        insulin: document.getElementById("insulin").value,

        change: document.getElementById("change").value

    }};

    const response = await fetch("/patients/" + editingPatientId, {{

        method: "PUT",

        headers: {{
            "Content-Type": "application/json",
            "Authorization": "Bearer " + token
        }},

        body: JSON.stringify(data)

    }});

    const result = await response.json();
    if (!response.ok) {{
    resultBox.classList.add("show");
    resultBox.innerHTML =
        "<b>Prediction Error:</b><br>" +
        JSON.stringify(result.detail, null, 2);
    console.log("Prediction API error:", result);
    return;
}}

let recommendation = "";

if (result.risk_category === "High") {{
    recommendation = "Immediate follow-up and care plan recommended.";
}} else if (result.risk_category === "Medium") {{
    recommendation = "Schedule follow-up within 7 days.";
}} else {{
    recommendation = "Continue routine monitoring.";
}}

document.getElementById("riskTitle").innerHTML =
    "Risk Level : " + result.risk_category;

document.getElementById("probability").innerHTML =
    (result.readmission_probability * 100).toFixed(2) + "%";

document.getElementById("progressBar").style.width =
    (result.readmission_probability * 100) + "%";

document.getElementById("recommendation").innerHTML =
    recommendation;
    alert(result.message);

    editingPatientId = null;

    document.getElementById("saveBtn").innerText = "Add Patient";

    document.getElementById("patientForm").reset();

    loadPatients();

}}
window.onload = function() {{
    loadPatients();
}};
</script>
    </body>
    </html>
    """


    # =========================
# ANALYTICS PAGE
# =========================

@app.get("/analytics", response_class=HTMLResponse)
def analytics_page(
    db: Session = Depends(get_db)
):
    # =========================
    # PATIENT STATISTICS
    # =========================

    total_patients = db.query(models.PatientAdmission).count()

    high_risk = db.query(models.PatientAdmission).filter(
        models.PatientAdmission.risk_category == "High"
    ).count()

    medium_risk = db.query(models.PatientAdmission).filter(
        models.PatientAdmission.risk_category == "Medium"
    ).count()

    low_risk = db.query(models.PatientAdmission).filter(
        models.PatientAdmission.risk_category == "Low"
    ).count()

    # =========================
    # READMISSION PROBABILITY
    # =========================

    patients = db.query(models.PatientAdmission).all()

    total_probability = 0.0
    probability_count = 0

    for patient in patients:

        if patient.readmission_probability is not None:

            try:
                probability = float(
                    str(patient.readmission_probability)
                    .replace("%", "")
                    .strip()
                )

                total_probability += probability
                probability_count += 1

            except (ValueError, TypeError):
                pass

    average_probability = (
        total_probability / probability_count
        if probability_count > 0
        else 0
    )

    # =========================
    # RISK PERCENTAGES
    # =========================

    high_percentage = (
        high_risk / total_patients * 100
        if total_patients > 0
        else 0
    )

    medium_percentage = (
        medium_risk / total_patients * 100
        if total_patients > 0
        else 0
    )

    low_percentage = (
        low_risk / total_patients * 100
        if total_patients > 0
        else 0
    )

    # =========================
    # HTML PAGE
    # =========================

    return f"""
    <!DOCTYPE html>
    <html>

    <head>

        <title>HealthForecast AI - Analytics</title>

        <style>

            {SHARED_STYLE}

            .analytics-container{{
                width:100%;
                box-sizing:border-box;
                padding:110px 40px 50px 40px;
                margin-left:0;
            }}

            .analytics-header{{
                margin-bottom:35px;
            }}

            .analytics-header h1{{
                font-size:38px;
                margin:0 0 10px 0;
            }}

            .analytics-header p{{
                color:#94a3b8;
                font-size:16px;
                margin:0;
            }}

            /* =========================
               STATISTICS
               ========================= */

            .stats-grid{{
                display:grid !important;
                grid-template-columns:repeat(4, 1fr) !important;
                gap:24px !important;
                width:100% !important;
                margin:30px 0 50px 0 !important;
            }}

            .stat-card{{
                background:rgba(15,23,42,0.85) !important;
                border:1px solid rgba(255,255,255,0.08) !important;
                border-radius:18px !important;
                padding:24px !important;
                box-shadow:none !important;
                text-align:left !important;
                min-height:120px;
                box-sizing:border-box;
            }}

            .stat-card h3{{
                color:#94a3b8;
                font-size:14px;
                font-weight:600;
                margin:0 0 12px 0;
            }}

            .stat-card h2{{
                color:white;
                font-size:32px;
                margin:0;
                font-weight:700;
            }}

            /* =========================
               CHART GRID
               ========================= */

            .charts-grid{{
                display:grid;
                grid-template-columns:1fr 1fr;
                gap:24px;
                margin-bottom:28px;
            }}

            .chart-card{{
                background:rgba(15,23,42,0.85);
                border:1px solid rgba(255,255,255,0.08);
                border-radius:18px;
                padding:28px;
                box-sizing:border-box;
            }}

            .chart-card h2{{
                margin:0 0 22px 0;
                font-size:21px;
            }}

            .chart-card p{{
                color:#94a3b8;
                line-height:1.6;
            }}

            /* =========================
               RISK BARS
               ========================= */

            .risk-row{{
                margin-bottom:22px;
            }}

            .risk-label{{
                display:flex;
                justify-content:space-between;
                align-items:center;
                margin-bottom:8px;
                font-size:14px;
                font-weight:600;
            }}

            .bar{{
                width:100%;
                height:12px;
                background:#1e293b;
                border-radius:20px;
                overflow:hidden;
            }}

            .bar-fill{{
                height:100%;
                border-radius:20px;
                transition:width .5s ease;
            }}

            .high-bar{{
                background:#ef4444;
            }}

            .medium-bar{{
                background:#f59e0b;
            }}

            .low-bar{{
                background:#22c55e;
            }}

            .risk-percentage{{
                color:#94a3b8;
                margin-left:6px;
                font-size:13px;
            }}

            /* =========================
               INFO CARD
               ========================= */

            .info-card{{
                background:rgba(15,23,42,0.85);
                border:1px solid rgba(255,255,255,0.08);
                border-radius:18px;
                padding:28px;
                margin-top:0;
            }}

            .info-card h2{{
                margin:0 0 12px 0;
                font-size:21px;
            }}

            .info-card p{{
                color:#94a3b8;
                line-height:1.7;
                margin:0;
            }}

            /* =========================
               RESPONSIVE
               ========================= */

            @media(max-width:1000px){{
                .charts-grid{{
                    grid-template-columns:1fr;
                }}

                .stats-grid{{
                    grid-template-columns:1fr 1fr !important;
                }}
            }}

            @media(max-width:700px){{
                .analytics-container{{
                    width:100%;
                    margin-left:0;
                    padding:100px 20px 40px 20px;
                }}

                .stats-grid{{
                    grid-template-columns:1fr !important;
                }}
            }}

        </style>

    </head>


    <body>

        {render_sidebar("analytics")}


        <div class="analytics-container">


            <!-- HEADER -->

            <div class="analytics-header">

                <h1>📈 Healthcare Analytics</h1>

                <p>
                    Analyze patient data, readmission risks and healthcare trends.
                </p>

            </div>


            <!-- STATISTICS -->

            <div class="stats-grid">


                <div class="stat-card">

                    <h3>Total Patients</h3>

                    <h2>{total_patients}</h2>

                </div>


                <div class="stat-card">

                    <h3>High Risk Patients</h3>

                    <h2>{high_risk}</h2>

                </div>


                <div class="stat-card">

                    <h3>Medium Risk Patients</h3>

                    <h2>{medium_risk}</h2>

                </div>


                <div class="stat-card">

                    <h3>Average Readmission Probability</h3>

                    <h2>{average_probability:.2f}%</h2>

                </div>


            </div>


            <!-- CHARTS -->

            <div class="charts-grid">


                <!-- RISK DISTRIBUTION -->

                <div class="chart-card">

                    <h2>🧠 Readmission Risk Distribution</h2>


                    <div class="risk-row">

                        <div class="risk-label">

                            <span>🔴 High Risk</span>

                            <span>
                                {high_risk}
                                <span class="risk-percentage">
                                    ({high_percentage:.1f}%)
                                </span>
                            </span>

                        </div>


                        <div class="bar">

                            <div
                                class="bar-fill high-bar"
                                style="width:{high_percentage}%;">
                            </div>

                        </div>

                    </div>


                    <div class="risk-row">

                        <div class="risk-label">

                            <span>🟠 Medium Risk</span>

                            <span>
                                {medium_risk}
                                <span class="risk-percentage">
                                    ({medium_percentage:.1f}%)
                                </span>
                            </span>

                        </div>


                        <div class="bar">

                            <div
                                class="bar-fill medium-bar"
                                style="width:{medium_percentage}%;">
                            </div>

                        </div>

                    </div>


                    <div class="risk-row">

                        <div class="risk-label">

                            <span>🟢 Low Risk</span>

                            <span>
                                {low_risk}
                                <span class="risk-percentage">
                                    ({low_percentage:.1f}%)
                                </span>
                            </span>

                        </div>


                        <div class="bar">

                            <div
                                class="bar-fill low-bar"
                                style="width:{low_percentage}%;">
                            </div>

                        </div>

                    </div>


                </div>


                <!-- PATIENT OVERVIEW -->

                <div class="chart-card">

                    <h2>📊 Patient Overview</h2>

                    <p>
                        Total patients currently stored in the
                        HealthForecast AI database:
                    </p>

                    <h1>{total_patients}</h1>


                    <p>
                        Patients classified as high risk:
                        <strong>{high_risk}</strong>
                    </p>


                    <p>
                        Patients classified as medium risk:
                        <strong>{medium_risk}</strong>
                    </p>


                    <p>
                        Patients classified as low risk:
                        <strong>{low_risk}</strong>
                    </p>

                </div>


            </div>


            <!-- ANALYTICS INSIGHT -->

            <div class="info-card">

                <h2>💡 Analytics Insight</h2>

                <p>
                    HealthForecast AI analyzes patient admission information
                    and readmission risk predictions to help healthcare teams
                    identify patients who may require closer monitoring.
                </p>

            </div>


        </div>


    </body>

    </html>
    """

@app.get("/portal", response_class=HTMLResponse, tags=["Home"], summary="Simple Login/Register Portal")
def portal():
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <title>HealthForecast AI - Portal</title>
        <style>
            {SHARED_STYLE}
            .center-wrap{{
    display:flex;
    justify-content:center;
    align-items:center;
    min-height:calc(100vh - 70px);
    padding:60px 20px;
}}

.portal-container{{
    width:min(1100px,95%);
    display:grid;
    grid-template-columns:1fr 430px;
    gap:40px;
    align-items:start;
    padding-top:30px;
}}

.box{{
    background:rgba(15,23,42,.78);
    backdrop-filter:blur(20px);
    border:1px solid rgba(255,255,255,.08);
    border-radius:24px;
    padding:40px;
    box-shadow:0 25px 60px rgba(0,0,0,.35);
}}
.portal-info h1{{
    font-size:68px;
    line-height:1.05;
    font-weight:900;
}}

.portal-info .card{{
    transition:.35s;
}}

.portal-info .card:hover{{
    transform:translateY(-8px);
}}

@media(max-width:950px){{

    .portal-container{{
        grid-template-columns:1fr;
    }}

    .portal-info{{
        text-align:center;
        margin-top:-20px;
    }}

    .portal-info p{{
        margin:auto;
    }}

}}
            .box h2 {{
                margin: 0 0 24px 0;
                text-align: center;
                font-size: 22px;
                background: linear-gradient(90deg, var(--accent), var(--accent-2));
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
            }}
            .tabs{{
    display:flex;
    background:#0b1220;
    padding:6px;
    border-radius:14px;
    margin-bottom:28px;
}}

.tab{{
    flex:1;
    text-align:center;
    padding:12px;
    border-radius:10px;
    cursor:pointer;
    color:#94a3b8;
    transition:.35s;
    font-weight:600;
}}

.tab:hover{{
    color:white;
}}

.tab.active{{
    background:linear-gradient(135deg,#2563eb,#7c3aed);
    color:white;
    box-shadow:0 10px 25px rgba(79,140,255,.30);
}}
            .box input,
.box select{{
    width:100%;
    margin-bottom:16px;
    height:52px;
    border-radius:12px;
    padding:0 16px;
    font-size:15px;
}}
            .box button{{
    width:100%;
    height:54px;
    margin-top:8px;
    font-size:16px;
    border-radius:12px;
}}
            #message {{ margin-top: 14px; text-align: center; font-size: 13px; }}
            .hidden {{ display: none; }}
            .welcome {{ text-align: center; }}
            .welcome-links a {{ display: block; color: var(--accent); text-decoration: none; margin-bottom: 10px; font-size: 14px; font-weight: 600; }}
        </style>
    </head>
    <body>
        {render_sidebar("portal")}
        <div class="main-content">
        <div class="center-wrap">

    <div class="portal-container">

        <div class="portal-info">

            <span class="badge">🚀 AI Powered Healthcare</span>

            <h1 style="font-size:54px;margin:25px 0 20px;line-height:1.1;">
                Welcome to
                <span style="background:linear-gradient(90deg,#38bdf8,#7c3aed);
                -webkit-background-clip:text;
                -webkit-text-fill-color:transparent;">
                    HealthForecast AI
                </span>
            </h1>

        </div>

        <div class="box">
                <div style="text-align:center;margin-bottom:28px;">

    <div style="
        width:72px;
        height:72px;
        margin:auto;
        border-radius:18px;
        display:flex;
        align-items:center;
        justify-content:center;
        background:linear-gradient(135deg,#2563eb,#7c3aed);
        font-size:34px;
        box-shadow:0 15px 35px rgba(79,140,255,.35);
    ">
        🏥
    </div>

    <h2 style="
        margin-top:20px;
        margin-bottom:8px;
        font-size:30px;
        color:white;
    ">
        Welcome Back
    </h2>

    <p style="
        color:#94a3b8;
        font-size:15px;
        line-height:1.7;
    ">
        Login to access your AI healthcare dashboard
    </p>

</div>

                <div id="authSection">
                    <div class="tabs">
                        <div class="tab active" id="loginTab" onclick="showTab('login')">Login</div>
                        <div class="tab" id="registerTab" onclick="showTab('register')">Register</div>
                    </div>

                    <div id="loginForm">
                        <input type="email" id="loginEmail" placeholder="Email">
                        <input type="password" id="loginPassword" placeholder="Password">



<button onclick="login()">Log In</button>

                    </div>

                    <div id="registerForm" class="hidden">
                        <input type="text" id="regName" placeholder="Full Name">
                        <input type="email" id="regEmail" placeholder="Email">
                        <input type="password" id="regPassword" placeholder="Password">
                        <select id="regRole">
                            <option value="doctor">Doctor</option>
                            <option value="hospital_admin">Hospital Administrator</option>
                            <option value="researcher">Healthcare Researcher</option>
                            <option value="system_admin">System Administrator</option>
                        </select>
                        <button onclick="register()">Create Account</button>
                    </div>

                    <div id="message"></div>
                </div>

                <div id="welcomeSection" class="welcome hidden">
                    <p style="color:var(--text-secondary); margin-bottom:4px;">You're logged in as</p>
                    <h3 id="welcomeEmail" style="margin:0 0 10px;"></h3>
                    <span class="badge" id="welcomeRole"></span>
                    <div class="welcome-links" style="margin-top:24px;">
                        <a href="/dashboard">Go to Dashboard →</a>
                        <a href="/admin-panel">Go to Admin Panel →</a>
                    </div>
                    <button onclick="logout()" class="ghost" style="width:100%; margin-top:8px;">Log Out</button>
                </div>
            </div>
        </div>

        <script>
            function showTab(tab) {{
                document.getElementById('loginTab').classList.toggle('active', tab === 'login');
                document.getElementById('registerTab').classList.toggle('active', tab === 'register');
                document.getElementById('loginForm').classList.toggle('hidden', tab !== 'login');
                document.getElementById('registerForm').classList.toggle('hidden', tab !== 'register');
                document.getElementById('message').innerHTML = '';
            }}

            async function login() {{
                const email = document.getElementById('loginEmail').value;
                const password = document.getElementById('loginPassword').value;
                const msg = document.getElementById('message');

                if (!email || !password) {{
                    msg.innerHTML = '<span style="color:var(--danger);">Please fill in both fields.</span>';
                    return;
                }}

                const res = await fetch('/login', {{
                    method: 'POST',
                    headers: {{'Content-Type': 'application/json'}},
                    body: JSON.stringify({{email, password}})
                }});
                const data = await res.json();

                if (res.ok) {{
    token = data.access_token;

    localStorage.setItem("token", data.access_token);

    // Go to dashboard after successful login
    window.location.href = "/dashboard";
}} else {{
                    msg.innerHTML = '<span style="color:var(--danger);">' + data.detail + '</span>';
                }}
            }}

            async function register() {{
                const full_name = document.getElementById('regName').value;
                const email = document.getElementById('regEmail').value;
                const password = document.getElementById('regPassword').value;
                const role = document.getElementById('regRole').value;
                const msg = document.getElementById('message');

                if (!full_name || !email || !password) {{
                    msg.innerHTML = '<span style="color:var(--danger);">Please fill in all fields.</span>';
                    return;
                }}

                const res = await fetch('/register', {{
                    method: 'POST',
                    headers: {{'Content-Type': 'application/json'}},
                    body: JSON.stringify({{email, password, full_name, role}})
                }});
                const data = await res.json();

                if (res.ok) {{
                    msg.innerHTML = '<span style="color:var(--success);">Account created! Please log in.</span>';
                    showTab('login');
                    document.getElementById('loginEmail').value = email;
                }} else {{
                    msg.innerHTML = '<span style="color:var(--danger);">' + data.detail + '</span>';
                }}
            }}

            async function showWelcome(email) {{
                const token = localStorage.getItem('token');
                const res = await fetch('/me', {{ headers: {{'Authorization': 'Bearer ' + token}} }});
                const data = await res.json();

                document.getElementById('authSection').classList.add('hidden');
                document.getElementById('welcomeSection').classList.remove('hidden');
                document.getElementById('welcomeEmail').innerText = data.email;
                document.getElementById('welcomeRole').innerText = data.role;
            }}

            function logout() {{
                localStorage.removeItem('token');
                document.getElementById('authSection').classList.remove('hidden');
                document.getElementById('welcomeSection').classList.add('hidden');
                document.getElementById('message').innerHTML = '';
            }}
            function toggleMenu(){{

    const menu=document.getElementById("dropdownMenu");

    if(menu.style.display==="block")
        menu.style.display="none";
    else
        menu.style.display="block";

}}
async function getProfile(){{

const token=localStorage.getItem("token");

if(!token){{
alert("Please login.");
return;
}}

const res=await fetch("/me",{{
headers:{{
Authorization:"Bearer "+token
}}
}});

if(!res.ok){{
alert("Unable to fetch profile");
return;
}}

const data=await res.json();
const role =
data.role.charAt(0).toUpperCase() +
data.role.slice(1);

document.getElementById("dashboardWelcome").innerText =
"👋 Welcome, " + role;

document.getElementById("dashboardEmail").innerText =
data.email;
document.getElementById("profileName").innerText =
data.full_name || "Doctor";

document.getElementById("profileEmail").innerText =
data.email;

document.getElementById("profileRole").innerText =
data.role;

document.getElementById("profileModal").style.display="flex";

}}

function closeProfile(){{

    document.getElementById("profileModal").style.display = "none";

}}
window.onclick=function(e){{

    if(!e.target.closest(".user-menu")){{

        const menu=document.getElementById("dropdownMenu");

        if(menu)
            menu.style.display="none";

    }}

}}
            window.onload = () => {{
                const token = localStorage.getItem('token');
                if (token) {{
                    fetch('/me', {{ headers: {{'Authorization': 'Bearer ' + token}} }})
                        .then(res => res.ok ? res.json() : Promise.reject())
                        .then(data => {{
                            document.getElementById('authSection').classList.add('hidden');
                            document.getElementById('welcomeSection').classList.remove('hidden');
                            document.getElementById('welcomeEmail').innerText = data.email;
                            document.getElementById('welcomeRole').innerText = data.role;
                        }})
                        .catch(() => {{}});
                }}
            }};
        </script>
    </body>
    </html>
    """
@app.get("/admissions", response_class=HTMLResponse)
def admissions():
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <title>Patient Admissions</title>
        <style>
            {SHARED_STYLE}
        </style>
    </head>

    <body>

        {render_sidebar("admissions")}
        <div class="main-content">
        <div class="page-wrap">

    <h1 class="page-title">🏥 Patient Admissions</h1>

    <p class="page-subtitle">
        Register a new patient into the hospital database.
    </p>

    <div class="card">

        <h3>➕ Add New Patient</h3>

        <div class="field-row">
            <input id="patient_name" placeholder="Patient Name">
        </div>

        <div class="field-row">
            <select id="race">
                <option>Asian</option>
                <option>AfricanAmerican</option>
                <option>Caucasian</option>
                <option>Hispanic</option>
                <option>Other</option>
            </select>

            <select id="gender">
                <option>Male</option>
                <option>Female</option>
            </select>
        </div>

        <div class="field-row">

            <select id="age">
                <option>0-10</option>
                <option>10-20</option>
                <option>20-30</option>
                <option>30-40</option>
                <option>40-50</option>
                <option>50-60</option>
                <option>60-70</option>
                <option>70-80</option>
                <option>80-90</option>
                <option>90-100</option>
            </select>

            <input id="hospital_days"
                   type="number"
                   placeholder="Days in Hospital">

        </div>

        <div class="field-row">

            <input id="medications"
                   type="number"
                   placeholder="Number of Medications">

            <select id="insulin">
                <option>No</option>
                <option>Up</option>
                <option>Down</option>
                <option>Steady</option>
            </select>

            <select id="change">
                <option>No</option>
                <option>Ch</option>
            </select>

        </div>

        <button id="savePatientBtn" onclick="savePatient()">
    Save Patient
</button>

        <div
id="result"
class="result-box">
</div>

    </div>
    <div class="card" id="patientRecords">

    <h3>📋 Patient Records</h3>
    <div style="margin-bottom:20px;">

    <input
        type="text"
        id="searchPatient"
        placeholder="🔍 Search patient by name..."
        onkeyup="searchPatients()"
        style="width:100%;">

</div>
    <table id="patientsTable">

        <thead>

            <tr>
                <th>ID</th>
                <th>Patient Name</th>
                <th>Gender</th>
                <th>Age</th>
                <th>Race</th>
                <th>Hospital Days</th>
                <th>Medications</th>
                <th>Insulin</th>
                <th>Change</th>
                <th>Edit</th>
                <th>Delete</th>
            </tr>

        </thead>

        <tbody id="patientsBody">

        </tbody>

    </table>

</div>

</div>
<script>
let editingPatientId = null;
async function savePatient(){{

    const token = localStorage.getItem("token");

    if(!token){{
        alert("Please login first.");
        return;
    }}

    const data = {{

        patient_name: document.getElementById("patient_name").value,

        race: document.getElementById("race").value,

        gender: document.getElementById("gender").value,

        age: document.getElementById("age").value,

        time_in_hospital: parseInt(document.getElementById("hospital_days").value),

        num_medications: parseInt(document.getElementById("medications").value),

        insulin: document.getElementById("insulin").value,

        change: document.getElementById("change").value

    }};

    const url = editingPatientId
    ? "/patients/" + editingPatientId
    : "/patients";

const method = editingPatientId
    ? "PUT"
    : "POST";

const response = await fetch(url,{{
    method: method,

        headers:{{
            "Content-Type":"application/json",
            "Authorization":"Bearer " + token
        }},

        body:JSON.stringify(data)

    }});

    const resultBox = document.getElementById("result");

    if(response.ok){{

        const result = await response.json();

        resultBox.className="result-box result-success show";
       resultBox.innerHTML = "✅ " + result.message;
loadPatients();

editingPatientId = null;

clearForm();

document.getElementById("savePatientBtn").innerHTML = "Save Patient";
document.getElementById("patientRecords").scrollIntoView({{
    behavior: "smooth"
}});
    }}
    else{{

        const error = await response.json();

console.log(error);

resultBox.className = "result-box result-error show";
resultBox.innerHTML = "<pre>" + JSON.stringify(error, null, 2) + "</pre>";

    }}

}}
function clearForm() {{

    document.getElementById("patient_name").value = "";

    document.getElementById("race").value = "";
    document.getElementById("gender").value = "";
    document.getElementById("age").value = "";
    document.getElementById("hospital_days").value = "";
    document.getElementById("medications").value = "";
    document.getElementById("insulin").value = "";
    document.getElementById("change").value = "";

}}
async function loadPatients(){{

    const token = localStorage.getItem("token");

    const response = await fetch("/patients",{{

        headers:{{
            "Authorization":"Bearer " + token
        }}

    }});

    if(!response.ok){{
        return;
    }}

    const patients = await response.json();

    let rows = "";

    patients.forEach(patient=>{{

        rows += `
        <tr>
            <td>${{patient.id}}</td>
            <td>${{patient.patient_name}}</td>
            <td>${{patient.gender}}</td>
            <td>${{patient.age}}</td>
            <td>${{patient.race}}</td>
            <td>${{patient.time_in_hospital}}</td>
            <td>${{patient.num_medications}}</td>
            <td>${{patient.insulin}}</td>
            <td>${{patient.change}}</td>

<td>
    <button onclick="editPatient(${{patient.id}})">
        ✏️ Edit
    </button>
</td>

<td>
    <button class="danger"
            onclick="deletePatient(${{patient.id}})">
        🗑 Delete
    </button>
</td>
        </tr>
        `;

    }});

    document.getElementById("patientsBody").innerHTML = rows;

}}
function searchPatients() {{

    const filter = document
        .getElementById("searchPatient")
        .value
        .toLowerCase();

    const rows = document.querySelectorAll("#patientsBody tr");

    rows.forEach(row => {{

        const patientName = row.cells[1].textContent.toLowerCase();

        row.style.display =
            patientName.includes(filter) ? "" : "none";

    }});

}}
async function deletePatient(id){{

    if(!confirm("Delete this patient?")){{
        return;
    }}

    const token = localStorage.getItem("token");

    const response = await fetch("/patients/" + id,  {{

        method: "DELETE",

        headers: {{
            "Authorization": "Bearer " + token
        }}

    }});

    if(response.ok){{

        alert("Patient deleted successfully.");

        loadPatients();

    }}
    else{{

        alert("Unable to delete patient.");

    }}

}}
function editPatient(id)
{{

    const row = event.target.parentElement.parentElement;

    editingPatientId = id;

    document.getElementById("patient_name").value = row.cells[1].innerText;
    document.getElementById("gender").value = row.cells[2].innerText;
    document.getElementById("age").value = row.cells[3].innerText;
    document.getElementById("race").value = row.cells[4].innerText;
    document.getElementById("hospital_days").value = row.cells[5].innerText;
    document.getElementById("medications").value = row.cells[6].innerText;
    document.getElementById("insulin").value = row.cells[7].innerText;
    document.getElementById("change").value = row.cells[8].innerText;

    document.getElementById("savePatientBtn").innerHTML = "Update Patient";

document.getElementById("patient_name").scrollIntoView({{
    behavior: "smooth"
}});
}}
window.scrollTo({{
    top: 0,
    behavior: "smooth"
}});
loadPatients();
</script>
    </body>

    </html>
    """
@app.get("/reports", response_class=HTMLResponse, tags=["Home"], summary="Reports Page")
def reports():
    db = SessionLocal()

    try:
        total_patients = db.query(models.PatientAdmission).count()

        high_risk = db.query(models.PatientAdmission).filter(
            models.PatientAdmission.risk_category == "High"
        ).count()

        medium_risk = db.query(models.PatientAdmission).filter(
            models.PatientAdmission.risk_category == "Medium"
        ).count()

        low_risk = db.query(models.PatientAdmission).filter(
            models.PatientAdmission.risk_category == "Low"
        ).count()
       
        return f"""
<!DOCTYPE html>
<html>

<head>

    <title>HealthForecast AI - Reports</title>

    <style>

        {SHARED_STYLE}

        .reports-container{{
            width:100%;
            box-sizing:border-box;
            padding:110px 40px 50px 40px;
        }}

        .reports-header{{
            margin-bottom:35px;
        }}

        .reports-header h1{{
            font-size:38px;
            margin:0 0 10px 0;
        }}

        .reports-header p{{
            color:#94a3b8;
            font-size:16px;
            margin:0;
        }}

        .report-grid{{
            display:grid;
            grid-template-columns:repeat(4,1fr);
            gap:24px;
            margin-bottom:30px;
        }}

        .report-card{{
            background:rgba(15,23,42,.85);
            border:1px solid rgba(255,255,255,.08);
            border-radius:18px;
            padding:24px;
            min-height:120px;
            box-sizing:border-box;
        }}

        .report-card h3{{
            color:#94a3b8;
            font-size:16px;
            font-weight:500;
            margin:0 0 15px 0;
        }}

        .report-card h2{{
            font-size:32px;
            margin:0;
            color:#60a5fa;
        }}

        .report-section{{
            background:rgba(15,23,42,.85);
            border:1px solid rgba(255,255,255,.08);
            border-radius:20px;
            padding:30px;
            margin-top:25px;
        }}

        .report-section h2{{
            margin:0 0 20px 0;
            font-size:24px;
        }}

        .report-row{{
            display:flex;
            justify-content:space-between;
            align-items:center;
            padding:15px 0;
            border-bottom:1px solid rgba(255,255,255,.06);
        }}

        .report-row:last-child{{
            border-bottom:none;
        }}

        .report-label{{
            color:#cbd5e1;
            font-size:15px;
        }}

        .report-value{{
            font-weight:700;
            color:#60a5fa;
            font-size:16px;
        }}

        @media(max-width:900px){{
            .report-grid{{
                grid-template-columns:1fr 1fr;
            }}
        }}

        @media(max-width:600px){{
            .reports-container{{
                padding:100px 20px 40px 20px;
            }}

            .report-grid{{
                grid-template-columns:1fr;
            }}
        }}

    </style>

</head>


<body>

    {render_sidebar("reports")}


    <div class="main-content">

        <div class="reports-container">


            <div class="reports-header">

                <h1>📄 Healthcare Reports</h1>

                <p>
                    View a summary of patient admissions and readmission risk data.
                </p>

            </div>


            <div class="report-grid">


                <div class="report-card">

                    <h3>Total Patients</h3>

                    <h2>{total_patients}</h2>

                </div>


                <div class="report-card">

                    <h3>High Risk</h3>

                    <h2>{high_risk}</h2>

                </div>


                <div class="report-card">

                    <h3>Medium Risk</h3>

                    <h2>{medium_risk}</h2>

                </div>


                <div class="report-card">

                    <h3>Low Risk</h3>

                    <h2>{low_risk}</h2>

                </div>


            </div>


            <div class="report-section">

                <h2>📊 Patient Risk Summary</h2>


                <div class="report-row">

                    <span class="report-label">
                        Total Patients
                    </span>

                    <span class="report-value">
                        {total_patients}
                    </span>

                </div>


                <div class="report-row">

                    <span class="report-label">
                        High Risk Patients
                    </span>

                    <span class="report-value">
                        {high_risk}
                    </span>

                </div>


                <div class="report-row">

                    <span class="report-label">
                        Medium Risk Patients
                    </span>

                    <span class="report-value">
                        {medium_risk}
                    </span>

                </div>


                <div class="report-row">

                    <span class="report-label">
                        Low Risk Patients
                    </span>

                    <span class="report-value">
                        {low_risk}
                    </span>

                </div>
                <div style="text-align:center;margin-top:25px;">

    <button
        onclick="generateReport()"
        style="
            background:#2563eb;
            color:white;
            border:none;
            padding:12px 28px;
            border-radius:10px;
            font-size:15px;
            font-weight:600;
            cursor:pointer;
        ">
        📄 Generate Report
    </button>

</div>


            </div>


        </div>

    </div>
<script>
function generateReport(){{
    const report = `
HealthForecast AI
Patient Risk Report
==============================

Total Patients: {total_patients}
High Risk Patients: {high_risk}
Medium Risk Patients: {medium_risk}
Low Risk Patients: {low_risk}

Generated by HealthForecast AI
`;

    const blob = new Blob([report], {{
        type: "text/plain"
    }});

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;
    link.download = "HealthForecast_Patient_Risk_Report.txt";

    link.click();

    URL.revokeObjectURL(url);
}}
</script>

</body>

</html>
"""

    finally:
        db.close()



@app.get("/dashboard", response_class=HTMLResponse, tags=["Home"], summary="Simple Dashboard UI")
def dashboard():
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
    <title>HealthForecast AI - Dashboard</title>

    <style>
    {SHARED_STYLE}

    .stats-grid{{
        display:grid;
        grid-template-columns:repeat(auto-fit,minmax(220px,1fr));
        gap:22px;
        margin:35px 0;
    }}

    .stat-card{{
        background:linear-gradient(145deg,#18253f,#101828);
        border:1px solid rgba(255,255,255,.08);
        border-radius:20px;
        padding:24px;
        transition:.35s;
        box-shadow:0 10px 30px rgba(0,0,0,.25);
    }}

    .stat-card:hover{{
        transform:translateY(-8px);
        border-color:#6f6bff;
        box-shadow:0 20px 45px rgba(111,107,255,.35);
    }}

    .stat-icon{{
        font-size:34px;
        margin-bottom:15px;
    }}

    .stat-title{{
        color:#9fb3d9;
        font-size:15px;
    }}

    .stat-value{{
        font-size:34px;
        font-weight:700;
        color:white;
        margin:10px 0;
    }}

    .stat-sub{{
        color:#60a5fa;
        font-size:14px;
    }}

    </style>
</head>
    <body>
        {render_sidebar("dashboard")}
        <div class="page-wrap">
            <div class="eyebrow">Clinical Workspace</div>
            <h1 class="page-title">Dashboard</h1>
            <p class="page-subtitle">Log in to unlock your profile, access checks, and AI-powered readmission risk prediction.</p>

            <!-- Dashboard Statistics -->

<div class="stats-grid">

    <div class="stat-card">
        <div class="stat-icon">👥</div>
        <div class="stat-title">Total Patients</div>
        <div class="stat-value" id="totalPatients">0</div> 
        <div class="stat-sub">Dataset Records</div>
    </div>

    <div class="stat-card">
        <div class="stat-icon">🚨</div>
        <div class="stat-title">High Risk</div>
        <div class="stat-value" id="highRisk">0</div>
        <div class="stat-sub">Need Follow-up</div>
    </div>

    <div class="stat-card">
        <div class="stat-icon">📈</div>
        <div class="stat-title">Predictions</div>
        <div class="stat-value" id="totalAdmissions">0</div>
        <div class="stat-sub">Today</div>
    </div>

    <div class="stat-card">
        <div class="stat-icon">🎯</div>
        <div class="stat-title">Model Accuracy</div>
        <div class="stat-value" id="accuracy">77%</div>
        <div class="stat-sub">XGBoost</div>
    </div>

</div>

<!-- Login Card -->

<div class="card">

    <h3>🔐 Secure Login</h3>

    <p class="card-note">
        Sign in to access AI prediction, patient analytics, and healthcare tools.
    </p>

    <div class="field-row">
        <input type="email" id="loginEmail">
<input type="password" id="loginPassword">

        <button onclick="login()">Log In</button>
    </div>

    <div id="status" class="result-box"></div>

</div>

            <div id="protectedSections" style="display:none;">

                <div class="card fade-up">

<h2 id="dashboardWelcome" style="font-size:34px;">
👋 Welcome
</h2>

<p id="dashboardRole"
style="color:#60a5fa;font-size:18px;margin-top:10px;">
</p>

<p id="dashboardEmail"
style="color:#9fb0c8;font-size:16px;margin-top:8px;">
</p>

Your AI-powered hospital assistant is online and ready to predict patient readmission risk.

</p>

<div style="
margin-top:30px;
display:flex;
gap:18px;
flex-wrap:wrap;
">

<span class="badge">
🟢 AI Engine Online
</span>

<span class="badge">
🧠 XGBoost Model Loaded
</span>

<span class="badge">
🔒 JWT Protected
</span>

</div>

</div>

<div class="card">

<h3>
⚡ Quick Actions
</h3>

<div style="
display:grid;
grid-template-columns:repeat(4,1fr);
gap:18px;
margin-top:25px;
">

<button onclick="window.location.href='/admissions'">
    🏥 Admissions
</button>

<button onclick="document.getElementById('admissions').scrollIntoView({{behavior:'smooth'}})">
🏥 Admissions
</button>

<button>
📊 Analytics
</button>

<button>
📄 Reports
</button>

</div>

</div>

                

                <div class="card" id="prediction">
    <h3>🧠 AI Readmission Prediction</h3>

                    <div class="field-row">
                        <span class="inline">Race:</span>
                        <select id="p_race">
                            <option value="Caucasian">Caucasian</option>
                            <option value="AfricanAmerican">African American</option>
                            <option value="Hispanic">Hispanic</option>
                            <option value="Asian">Asian</option>
                            <option value="Other">Other</option>
                        </select>
                        <span class="inline">Gender:</span>
                        <select id="p_gender">
                            <option value="Female">Female</option>
                            <option value="Male">Male</option>
                        </select>
                        <span class="inline">Age:</span>
                        <select id="p_age">
                            <option value="[50-60)">50-60</option>
                            <option value="[60-70)">60-70</option>
                            <option value="[70-80)" selected>70-80</option>
                            <option value="[80-90)">80-90</option>
                        </select>
                    </div>

                    <div class="field-row">
                        <span class="inline">Days in Hospital:</span>
                        <input type="number" id="p_time" value="5" style="width:80px;">
                        <span class="inline">Number of Medications:</span>
                        <input type="number" id="p_meds" value="15" style="width:80px;">
                    </div>

                    <div class="field-row">
                        <span class="inline">Insulin:</span>
                        <select id="p_insulin">
                            <option value="No">No Insulin</option>
                            <option value="Down">Insulin Decreased</option>
                            <option value="Steady" selected>Insulin Steady</option>
                            <option value="Up">Insulin Increased</option>
                        </select>
                        <span class="inline">Medication Change:</span>
                        <select id="p_change">
                            <option value="0" selected>Not Changed</option>
                            <option value="1">Changed</option>
                        </select>
                    </div>

                    <button onclick="predictRisk()">Predict Readmission Risk</button>
                    <div id="predictResult" class="result-box"></div>
                </div>
<div class="card" id="admissions">

    <!-- Admission Form goes here -->
            </div>
        </div>

        <script>
           let token = localStorage.getItem("token") || "";
          async function initializeDashboard() {{

    token = localStorage.getItem("token");

    if (!token) {{
        return;
    }}

    try {{

        const res = await fetch("/me", {{
            headers: {{
                "Authorization": "Bearer " + token
            }}
        }});

        if (!res.ok) {{
            localStorage.removeItem("token");
            return;
        }}

        const user = await res.json();

        document.getElementById("protectedSections").style.display = "block";

        const loginCard = document.querySelector(".card");
        if (loginCard) {{
            loginCard.style.display = "none";
        }}

        const navLogin = document.getElementById("navLogin");
        if (navLogin) {{
            navLogin.style.display = "none";
        }}

        const userMenu = document.getElementById("userMenu");
        if (userMenu) {{
            userMenu.style.display = "inline-block";
        }}

        const userRole = document.getElementById("userRole");
        if (userRole) {{
            userRole.innerHTML = user.role;
        }}

        // Load dashboard statistics every time dashboard is opened
        await loadDashboardStats();

    }} catch (error) {{
        console.error("Dashboard initialization error:", error);
    }}
}}

// Normal page load
window.addEventListener("load", initializeDashboard);

// Also runs when returning to the page from another page/browser history
window.addEventListener("pageshow", initializeDashboard);

           async function login() {{

    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;

    const statusDiv = document.getElementById("status");

    statusDiv.className = "result-box show";
    statusDiv.innerHTML = "Logging in...";

    try {{

        const res = await fetch("/login", {{
            method: "POST",
            headers: {{
                "Content-Type": "application/json"
            }},
            body: JSON.stringify({{
                email: email,
                password: password
            }})
        }});

       const data = await res.json();

if (res.ok) {{

    // Save JWT token
    token = data.access_token;
    localStorage.setItem("token", token);

    // Get actual user information using the token
    const profileRes = await fetch("/me", {{
        headers: {{
            "Authorization": "Bearer " + token
        }}
    }});

    if (!profileRes.ok) {{
        statusDiv.className = "result-box show result-error";
        statusDiv.innerHTML = "Login succeeded, but user profile could not be loaded.";
        return;
    }}

    const profile = await profileRes.json();

    const role =
        profile.role.charAt(0).toUpperCase() +
        profile.role.slice(1);

    document.getElementById("dashboardWelcome").innerText =
        "👋 Welcome, " + profile.full_name;

    document.getElementById("dashboardRole").innerText =
        "Role: " + role;

    document.getElementById("dashboardEmail").innerText =
        "Email: " + profile.email;

    localStorage.setItem("role", profile.role);
    localStorage.setItem("email", profile.email);

    statusDiv.className = "result-box show result-success";
    statusDiv.innerHTML = "✅ Login Successful";

    document.getElementById("protectedSections").style.display = "block";

    // NOW load the real dashboard statistics
    loadDashboardStats();

}} else {{

    statusDiv.className = "result-box show result-error";
    statusDiv.innerHTML =
        data.detail || "Login failed.";

}}

    }}catch(err){{

        statusDiv.className = "result-box show result-error";
        statusDiv.innerHTML = err;

        console.log(err);

    }}

}}

            async function getProfile(){{

const token=localStorage.getItem("token");

if(!token){{
alert("Please login.");
return;
}}

const res=await fetch("/me",{{
headers:{{
Authorization:"Bearer "+token
}}
}});

if(!res.ok){{
alert("Unable to fetch profile");
return;
}}

const data=await res.json();

document.getElementById("profileName").innerText =
data.full_name || "Doctor";

document.getElementById("profileEmail").innerText =
data.email;

document.getElementById("profileRole").innerText =
data.role;

document.getElementById("profileModal").style.display="flex";

}}
function closeProfile(){{

document.getElementById("profileModal").style.display="none";

}}

            async function checkAccess() {{
                const resultDiv = document.getElementById('accessResult');
                resultDiv.classList.add('show');
                const res = await fetch('/doctor-only', {{ headers: {{'Authorization': 'Bearer ' + token}} }});
                const data = await res.json();
                if (res.ok) {{
                    resultDiv.className = 'result-box show result-success';
                    resultDiv.innerText = data.message;
                }} else {{
                    resultDiv.className = 'result-box show result-error';
                    resultDiv.innerText = 'Access denied: ' + data.detail;
                }}
            }}

            async function predictRisk() {{
                const resultDiv = document.getElementById('predictResult');
                resultDiv.classList.add('show');

                const patientData = {{
                    race: document.getElementById('p_race').value,
                    gender: document.getElementById('p_gender').value,
                    age: document.getElementById('p_age').value,
                    time_in_hospital: parseInt(document.getElementById('p_time').value),
                    num_medications: parseInt(document.getElementById('p_meds').value),
                    insulin: document.getElementById('p_insulin').value,
                    change: document.getElementById('p_change').value 
                }};

                const res = await fetch('/predict-readmission', {{
                    method: 'POST',
                    headers: {{'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token}},
                    body: JSON.stringify(patientData)
                }});
                const data = await res.json();

                if (res.ok) {{
                    resultDiv.className = 'result-box show ' + (data.risk_category === 'High' ? 'result-error' : 'result-success');
                    resultDiv.innerHTML = '<b>Risk:</b> ' + (data.readmission_probability*100).toFixed(1) + '% — <b>' + data.risk_category + '</b>';
                }} else {{
                    resultDiv.className = 'result-box show result-error';
                    resultDiv.innerText = 'Error: ' + data.detail;
                }}
            }}
            
function logout(e){{

    if(e) e.preventDefault();

    if(confirm("Are you sure you want to logout?")){{

        localStorage.removeItem("token");
        localStorage.removeItem("role");
        localStorage.removeItem("email");

        window.location.href="/portal";

    }}
}}
function toggleMenu() {{

    const menu = document.getElementById("dropdownMenu");

    if (menu.style.display === "block") {{
        menu.style.display = "none";
    }} else {{
        menu.style.display = "block";
    }}
}}

window.onclick = function(e) {{

    if (!e.target.closest(".user-menu")) {{

        const menu = document.getElementById("dropdownMenu");

        if (menu) {{
            menu.style.display = "none";
        }}
    }}
}}
async function loadDashboardStats() {{

    const token = localStorage.getItem("token");

    if (!token) return;

    const res = await fetch("/dashboard/stats", {{
        headers: {{
            Authorization: "Bearer " + token
        }}
    }});

    if (!res.ok) {{
    const errorText = await res.text();
    document.getElementById("totalPatients").innerText = "ERROR";
    console.error("Dashboard stats error:", res.status, errorText);
    return;
}}

    const data = await res.json();

    document.getElementById("totalPatients").innerText =
        data.total_patients;

    document.getElementById("totalAdmissions").innerText =
        data.total_admissions;

    document.getElementById("highRisk").innerText =
        data.high_risk_patients;

    document.getElementById("accuracy").innerText =
        data.prediction_accuracy + "%";
}}
        </script>
       <div id="profileModal" style="
display:none;
position:fixed;
top:0;
left:0;
width:100%;
height:100%;
background:rgba(0,0,0,.65);
justify-content:center;
align-items:center;
z-index:9999;">

<div style="
width:420px;
background:#18253b;
border-radius:18px;
padding:30px;
color:white;
box-shadow:0 20px 60px rgba(0,0,0,.45);
text-align:center;
position:relative;">

<h2 style="margin-bottom:20px;">👤 My Profile</h2>

<div style="font-size:70px;margin-bottom:15px;">
👨‍⚕️
</div>

<h3 id="profileName">Loading...</h3>

<p style="color:#94a3b8;margin-bottom:25px;">
Healthcare Professional
</p>

<hr style="border-color:#2b3954;margin-bottom:20px;">

<div style="text-align:left;line-height:2;">

<b>📧 Email</b><br>
<span id="profileEmail"></span>

<br><br>

<b>🩺 Role</b><br>
<span id="profileRole"></span>

</div>

<div style="margin-top:30px;">

<button onclick="closeProfile()">
Close
</button>

</div>

</div>
</div>
<!-- ================= PROFILE MODAL ================= -->

<div id="profileModal" style="
display:none;
position:fixed;
top:0;
left:0;
width:100%;
height:100%;
background:rgba(0,0,0,.6);
backdrop-filter:blur(4px);
justify-content:center;
align-items:center;
z-index:9999;
">

<div style="
background:#162033;
width:420px;
padding:30px;
border-radius:18px;
border:1px solid #2b3954;
box-shadow:0 20px 60px rgba(0,0,0,.45);
">

<h2 style="
margin-bottom:25px;
text-align:center;
color:white;
">
👤 My Profile
</h2>

<p style="margin-bottom:15px;">
<b>Name :</b>
<span id="profileName">Loading...</span>
</p>

<p style="margin-bottom:15px;">
<b>Email :</b>
<span id="profileEmail">Loading...</span>
</p>

<p style="margin-bottom:25px;">
<b>Role :</b>
<span id="profileRole">Loading...</span>
</p>

<button onclick="closeProfile()"
style="width:100%;">
Close
</button>

</div>

</div>
    </body>
    </html>
    """


@app.get("/admin-panel", response_class=HTMLResponse, tags=["Home"], summary="Admin Panel UI")
def admin_panel():
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <title>HealthForecast AI - Admin Panel</title>
        <style>{SHARED_STYLE}</style>
    </head>
    <body>
        {render_sidebar("admin")}
        <div class="page-wrap">
            <div class="eyebrow">System Administration</div>
            <h1 class="page-title">Admin Panel</h1>
            <p class="page-subtitle">Log in to unlock user lookup, account management, and feedback review tools.</p>

            <div class="card">
                <h3>Login as System Admin</h3>
                <p class="card-note">Enter your credentials to unlock the tools below.</p>
                <div class="field-row">
                    <input type="email" id="loginEmail" placeholder="Email" value="admin1@hospital.com">
                    <input type="password" id="loginPassword" placeholder="Password" value="test1234">
                    <button onclick="login()">Login</button>
                </div>
                <div id="status" class="result-box"></div>
            </div>

            <div id="protectedSections" style="display:none;">

                <div class="card">
                    <h3>What you can do here</h3>
                    <p class="card-note" style="margin:0;">
                        As a System Administrator, you can look up any individual user by ID, view every registered
                        account, change a user's role (e.g. promote a Researcher to Doctor), permanently delete
                        accounts, and review feedback submitted through the public Feedback page. These actions
                        are restricted to your role only.
                    </p>
                </div>

                <div class="card">
                    <h3>Look Up Single User</h3>
                    <div class="field-row">
                        <input type="number" id="lookupId" placeholder="User ID" style="width:100px;">
                        <button onclick="lookupUser()">View User</button>
                    </div>
                    <div id="lookupResult" style="margin-top:10px; font-size:14px;"></div>
                </div>

                <div class="card">
                    <h3>All Users</h3>
                    <button onclick="loadUsers()">Refresh User List</button>
                    <table id="userTable">
                        <thead>
                            <tr><th>ID</th><th>Email</th><th>Name</th><th>Role</th><th>Actions</th></tr>
                        </thead>
                        <tbody id="userTableBody"></tbody>
                    </table>
                </div>

                <div class="card">
                    <h3>User Feedback Submissions</h3>
                    <button onclick="loadFeedback()">Load Feedback</button>
                    <table id="feedbackTable">
                        <thead>
                            <tr><th>Name</th><th>Email</th><th>Message</th><th>Submitted</th></tr>
                        </thead>
                        <tbody id="feedbackTableBody"></tbody>
                    </table>
                </div>

            </div>
        </div>

        <script>
            let token = localStorage.getItem("token") || "";
            window.onload = async function () {{

    token = localStorage.getItem("token");

    if (!token) {{
        return;
    }}

    try {{

        const res = await fetch("/me", {{
            headers: {{
                "Authorization": "Bearer " + token
            }}
        }});

        if (res.ok) {{

            document.getElementById("protectedSections").style.display = "block";

            document.querySelector(".card").style.display = "none";

        }} else {{

            localStorage.removeItem("token");

        }}

    }} catch (err) {{

        console.log(err);

    }}

}}

            async function login() {{
                const email = document.getElementById('loginEmail').value;
                const password = document.getElementById('loginPassword').value;
                const res = await fetch('/login', {{
                    method: 'POST',
                    headers: {{'Content-Type': 'application/json'}},
                    body: JSON.stringify({{email, password}})
                }});
                const data = await res.json();
                const statusDiv = document.getElementById('message');
                statusDiv.classList.add('show');
                if (res.ok) {{
                    token = data.access_token;
                    statusDiv.className = 'result-box show result-success';
                    statusDiv.innerText = 'Logged in successfully — admin tools unlocked below.';
                    document.getElementById('protectedSections').style.display = 'block';
                    loadUsers();
                }} else {{
                    statusDiv.className = 'result-box show result-error';
                    statusDiv.innerText = 'Login failed: ' + data.detail;
                }}
            }}

            async function lookupUser() {{
                const userId = document.getElementById('lookupId').value;
                const resultDiv = document.getElementById('lookupResult');
                const res = await fetch('/admin/users/' + userId, {{ headers: {{'Authorization': 'Bearer ' + token}} }});
                const data = await res.json();
                if (res.ok) {{
                    resultDiv.innerHTML = '<b>ID:</b> ' + data.id + ' | <b>Email:</b> ' + data.email + ' | <b>Name:</b> ' + data.full_name + ' | <b>Role:</b> ' + data.role;
                }} else {{
                    resultDiv.innerHTML = '<span style="color:var(--danger);">Error: ' + data.detail + '</span>';
                }}
            }}

            async function loadUsers() {{
                const res = await fetch('/admin/users', {{ headers: {{'Authorization': 'Bearer ' + token}} }});
                const users = await res.json();
                const tbody = document.getElementById('userTableBody');
                tbody.innerHTML = "";
                if (!Array.isArray(users)) {{ return; }}
                users.forEach(u => {{
                    tbody.innerHTML += `
                        <tr>
                            <td>${{u.id}}</td>
                            <td>${{u.email}}</td>
                            <td>${{u.full_name}}</td>
                            <td>${{u.role}}</td>
                            <td>
                                <select id="role-${{u.id}}">
                                    <option value="doctor" ${{u.role==='doctor'?'selected':''}}>doctor</option>
                                    <option value="hospital_admin" ${{u.role==='hospital_admin'?'selected':''}}>hospital_admin</option>
                                    <option value="researcher" ${{u.role==='researcher'?'selected':''}}>researcher</option>
                                    <option value="system_admin" ${{u.role==='system_admin'?'selected':''}}>system_admin</option>
                                </select>
                                <button onclick="updateRole(${{u.id}})">Update</button>
                                <button class="danger" onclick="deleteUser(${{u.id}})">Delete</button>
                            </td>
                        </tr>`;
                }});
            }}

            async function updateRole(userId) {{
                const newRole = document.getElementById('role-' + userId).value;
                const res = await fetch('/admin/users/' + userId + '/role', {{
                    method: 'PUT',
                    headers: {{'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token}},
                    body: JSON.stringify({{role: newRole}})
                }});
                if (res.ok) {{ loadUsers(); }} else {{
                    const data = await res.json();
                    alert("Error: " + data.detail);
                }}
            }}

            async function deleteUser(userId) {{
                if (!confirm("Delete user " + userId + "?")) return;
                const res = await fetch('/admin/users/' + userId, {{
                    method: 'DELETE',
                    headers: {{'Authorization': 'Bearer ' + token}}
                }});
                if (res.ok) {{ loadUsers(); }} else {{
                    const data = await res.json();
                    alert("Error: " + data.detail);
                }}
            }}

            async function loadFeedback() {{
                const res = await fetch('/admin/feedback', {{ headers: {{'Authorization': 'Bearer ' + token}} }});
                const items = await res.json();
                const tbody = document.getElementById('feedbackTableBody');
                tbody.innerHTML = "";
                if (!Array.isArray(items)) {{ return; }}
                if (items.length === 0) {{
                    tbody.innerHTML = '<tr><td colspan="4">No feedback submitted yet.</td></tr>';
                    return;
                }}
                items.forEach(f => {{
                    tbody.innerHTML += `<tr><td>${{f.name}}</td><td>${{f.email}}</td><td>${{f.message}}</td><td>${{f.created_at}}</td></tr>`;
                }});
            }}
        </script>
    </body>
    </html>
    """


@app.post(
    "/admissions",
    response_model=schemas.PatientAdmissionOut,
    tags=["Patient Risk"],
    summary="Log a new patient admission",
    description="Logs a new patient admission and automatically runs the AI model to generate a readmission risk score. Doctor/System Administrator access only."
)
def create_admission(
    admission: schemas.PatientAdmissionCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_role(["doctor", "system_admin"]))
):
    result = predict_readmission(admission.dict(exclude={"patient_name"}))

    new_admission = models.PatientAdmission(
        patient_name=admission.patient_name,
        admitted_by=current_user["sub"],
        race=admission.race,
        gender=admission.gender,
        age=admission.age,
        time_in_hospital=admission.time_in_hospital,
        num_medications=admission.num_medications,
        insulin=admission.insulin,
        change=admission.change,
        readmission_probability=f"{result['readmission_probability']*100:.1f}%",
        risk_category=result["risk_category"],
    )
    db.add(new_admission)
    db.commit()
    db.refresh(new_admission)

    return {
        "id": new_admission.id,
        "patient_name": new_admission.patient_name,
        "admitted_by": new_admission.admitted_by,
        "age": new_admission.age,
        "time_in_hospital": new_admission.time_in_hospital,
        "readmission_probability": new_admission.readmission_probability,
        "risk_category": new_admission.risk_category,
        "created_at": new_admission.created_at.strftime("%Y-%m-%d %H:%M") if new_admission.created_at else ""
    }


@app.get(
    "/admissions/list",
    response_model=List[schemas.PatientAdmissionOut],
    tags=["Patient Risk"],
    summary="View recent patient admissions",
    description="Returns the most recent patient admissions with their AI-generated risk scores. Doctor/System Administrator access only."
)
def list_admissions(
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_role(["doctor", "system_admin"]))
):
    items = db.query(models.PatientAdmission).order_by(models.PatientAdmission.created_at.desc()).limit(25).all()
    return [
        {
            "id": a.id,
            "patient_name": a.patient_name,
            "admitted_by": a.admitted_by,
            "age": a.age,
            "time_in_hospital": a.time_in_hospital,
            "readmission_probability": a.readmission_probability,
            "risk_category": a.risk_category,
            "created_at": a.created_at.strftime("%Y-%m-%d %H:%M") if a.created_at else ""
        }
        for a in items
    ]


@app.get("/admissions", response_class=HTMLResponse, tags=["Home"], summary="Patient Admissions UI", include_in_schema=False)
def admissions_page():
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <title>HealthForecast AI - Patient Admissions</title>
        <style>
            {SHARED_STYLE}
            .risk-pill {{
                display: inline-block;
                padding: 3px 10px;
                border-radius: 12px;
                font-size: 11px;
                font-weight: 700;
            }}
            .risk-Low {{ background: rgba(74,222,128,0.12); color: var(--success); }}
            .risk-Medium {{ background: rgba(251,191,36,0.12); color: var(--warning); }}
            .risk-High {{ background: rgba(248,113,113,0.12); color: var(--danger); }}
        </style>
    </head>
    <body>
        {render_sidebar("admissions")}
        <div class="main-content">
        <div class="page-wrap">
            <div class="eyebrow">Ward Overview</div>
            <h1 class="page-title">Patient Admissions</h1>
            <p class="page-subtitle">Log a new patient admission to automatically generate an AI readmission risk score, and track recent admissions across the ward.</p>

            <div class="card">
                <h3>① Login</h3>
                <p class="card-note">Enter your credentials to unlock admission logging below.</p>
                <div class="field-row">
                    <input type="email" id="loginEmail">
                    <input type="password" id="loginPassword">
                    <button onclick="login()">Log In</button>
                </div>
                <div id="status" class="result-box"></div>
            </div>

            <div id="protectedSections" style="display:none;">

                <div class="card">
                    <h3>② Log New Admission</h3>
                    <div class="field-row">
                        <input type="text" id="a_name" placeholder="Patient name or ID" style="flex:1;">
                    </div>
                    <div class="field-row">
                        <span class="inline">Race:</span>
                        <select id="a_race">
                            <option value="Caucasian">Caucasian</option>
                            <option value="AfricanAmerican">African American</option>
                            <option value="Hispanic">Hispanic</option>
                            <option value="Asian">Asian</option>
                            <option value="Other">Other</option>
                        </select>
                        <span class="inline">Gender:</span>
                        <select id="a_gender">
                            <option value="Female">Female</option>
                            <option value="Male">Male</option>
                        </select>
                        <span class="inline">Age:</span>
                        <select id="a_age">
                            <option value="[50-60)">50-60</option>
                            <option value="[60-70)">60-70</option>
                            <option value="[70-80)" selected>70-80</option>
                            <option value="[80-90)">80-90</option>
                        </select>
                    </div>
                    <div class="field-row">
                        <span class="inline">Days in Hospital:</span>
                        <input type="number" id="a_time" value="5" style="width:80px;">
                        <span class="inline">Number of Medications:</span>
                        <input type="number" id="a_meds" value="15" style="width:80px;">
                    </div>
                    <div class="field-row">
                        <span class="inline">Insulin:</span>
                        <select id="a_insulin">
                            <option value="No">No Insulin</option>
                            <option value="Down">Insulin Decreased</option>
                            <option value="Steady" selected>Insulin Steady</option>
                            <option value="Up">Insulin Increased</option>
                        </select>
                        <span class="inline">Medication Change:</span>
                        <select id="a_change">
                            <option value="0" selected>Not Changed</option>
                            <option value="1">Changed</option>
                        </select>
                    </div>
                    <button onclick="createAdmission()">Log Admission & Predict Risk</button>
                    <div id="admitResult" class="result-box"></div>
                </div>

                <div class="card">
                    <h3>③ Recent Admissions</h3>
                    <button onclick="loadAdmissions()">Refresh List</button>
                    <table id="admissionsTable">
                        <thead>
                            <tr><th>Patient</th><th>Admitted By</th><th>Age</th><th>Days</th><th>Risk %</th><th>Category</th><th>Logged</th></tr>
                        </thead>
                        <tbody id="admissionsTableBody"></tbody>
                    </table>
                </div>

            </div>
        </div>

        <script>
            let token = "";

            async function login() {{
                const email = document.getElementById('email').value;
                const password = document.getElementById('password').value;
                const res = await fetch('/login', {{
                    method: 'POST',
                    headers: {{'Content-Type': 'application/json'}},
                    body: JSON.stringify({{email, password}})
                }});
                const data = await res.json();
                const resultDiv = document.getElementById('loginResult');
                resultDiv.classList.add('show');
                if (res.ok) {{
                    token = data.access_token;
                    resultDiv.className = 'result-box show result-success';
                    resultDiv.innerText = 'Logged in successfully.';
                    document.getElementById('protectedSections').style.display = 'block';
                    loadAdmissions();
                }} else {{
                    resultDiv.className = 'result-box show result-error';
                    resultDiv.innerText = 'Login failed: ' + data.detail;
                }}
            }}

            async function createAdmission() {{
                const resultDiv = document.getElementById('admitResult');
                resultDiv.classList.add('show');

                const payload = {{
                    patient_name: document.getElementById('a_name').value,
                    race: document.getElementById('a_race').value,
                    gender: document.getElementById('a_gender').value,
                    age: document.getElementById('a_age').value,
                    time_in_hospital: parseInt(document.getElementById('a_time').value),
                    num_medications: parseInt(document.getElementById('a_meds').value),
                    insulin: document.getElementById('a_insulin').value,
                    change: parseInt(document.getElementById('a_change').value)
                }};

                if (!payload.patient_name) {{
                    resultDiv.className = 'result-box show result-error';
                    resultDiv.innerText = 'Please enter a patient name or ID.';
                    return;
                }}

                const res = await fetch('/admissions', {{
                    method: 'POST',
                    headers: {{'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token}},
                    body: JSON.stringify(payload)
                }});
                const data = await res.json();

                if (res.ok) {{
                    resultDiv.className = 'result-box show ' + (data.risk_category === 'High' ? 'result-error' : 'result-success');
                    resultDiv.innerHTML = 'Admitted <b>' + data.patient_name + '</b> — Risk: ' + data.readmission_probability + ' (' + data.risk_category + ')';
                    document.getElementById('a_name').value = '';
                    loadAdmissions();
                }} else {{
                    resultDiv.className = 'result-box show result-error';
                    resultDiv.innerText = 'Error: ' + data.detail;
                }}
            }}

            async function loadAdmissions() {{
                const res = await fetch('/admissions/list', {{ headers: {{'Authorization': 'Bearer ' + token}} }});
                const items = await res.json();
                const tbody = document.getElementById('admissionsTableBody');
                tbody.innerHTML = "";
                if (!Array.isArray(items) || items.length === 0) {{
                    tbody.innerHTML = '<tr><td colspan="7">No admissions logged yet.</td></tr>';
                    return;
                }}
                items.forEach(a => {{
                    tbody.innerHTML += `<tr>
                        <td>${{a.patient_name}}</td>
                        <td>${{a.admitted_by}}</td>
                        <td>${{a.age}}</td>
                        <td>${{a.time_in_hospital}}</td>
                        <td>${{a.readmission_probability}}</td>
                        <td><span class="risk-pill risk-${{a.risk_category}}">${{a.risk_category}}</span></td>
                        <td>${{a.created_at}}</td>
                    </tr>`;
                }});
            }}
        </script>
    </body>
    </html>
    """
@app.get("/creator", response_class=HTMLResponse, tags=["Home"], summary="Creator Profile")
def creator_page():
    return f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Prathima Itikala - Creator</title>
        <style>
            {SHARED_STYLE}

            /* Creator profile page */
            .creator-main {{
                min-height: calc(100vh - 70px);
                padding: 36px 44px 30px;
            }}
            .creator-page-title {{
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 32px;
    font-weight: 700;
    margin-bottom: 25px;
    background: linear-gradient(90deg, #4facfe, #a66cff);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
}}

.refresh-icon {{
    font-size: 32px;
    -webkit-text-fill-color: #6fa8ff;
    display: inline-block;
}}
            .creator-page-title {{
                max-width: 1200px;
                margin: 0 auto 28px;
                font-size: 34px;
                font-weight: 800;
                color: #f8fafc;
            }}

            .creator-box {{
                width: min(1200px, 100%);
                margin: 0 auto;
                min-height: 560px;
                display: grid;
                grid-template-columns: 280px 1fr;
                gap: 46px;
                align-items: center;
                padding: 54px 62px;
                background: linear-gradient(145deg, #0f172a, #0b1426 65%, #101b31);
                border: 1px solid #2b3954;
                border-radius: 18px;
                box-shadow: 0 20px 50px rgba(0,0,0,.28);
            }}

            .creator-photo-wrap {{
                display: flex;
                align-items: center;
                justify-content: center;
            }}

            .creator-photo {{
                width: 265px;
                height: 265px;
                border-radius: 50%;
                object-fit: cover;
                object-position: 50% 18%;
                border: 3px solid #8b5cf6;
                box-shadow: 0 0 0 2px rgba(96,165,250,.65), 0 18px 45px rgba(0,0,0,.35);
            }}

            .creator-content {{
                min-width: 0;
            }}

            .creator-content h1 {{
                margin: 0;
                font-size: 42px;
                line-height: 1.15;
                color: #f8fafc;
                font-weight: 800;
            }}

            .creator-role {{
                margin: 10px 0 22px;
                color: #a78bfa;
                font-size: 22px;
                font-weight: 700;
            }}

            .creator-divider {{
                height: 1px;
                width: 88%;
                background: rgba(148,163,184,.18);
                margin-bottom: 24px;
            }}

            .creator-content h2 {{
                margin: 0 0 10px;
                color: #7da2ff;
                font-size: 21px;
                font-weight: 750;
            }}

            .creator-purpose {{
                max-width: 650px;
                margin: 0 0 24px;
                color: #cbd5e1;
                line-height: 1.85;
                font-size: 17px;
            }}

            .creator-links {{
                width: 88%;
                border-top: 1px solid rgba(148,163,184,.18);
                padding-top: 20px;
                display: flex;
                flex-direction: column;
                gap: 12px;
            }}

            .creator-links a {{
                display: flex;
                align-items: center;
                gap: 16px;
                min-height: 56px;
                padding: 9px 14px;
                border-radius: 12px;
                color: #f8fafc;
                text-decoration: none;
                transition: .2s ease;
            }}

            .creator-links a:hover {{
                background: rgba(255,255,255,.045);
                transform: translateX(3px);
            }}

            .creator-link-icon {{
                width: 54px;
                height: 54px;
                display: flex;
                align-items: center;
                justify-content: center;
                flex: 0 0 54px;
                border-radius: 12px;
                background: rgba(255,255,255,.06);
                font-size: 27px;
            }}

            .creator-link-text {{
                display: flex;
                flex-direction: column;
                gap: 1px;
            }}

            .creator-link-text strong {{
                font-size: 18px;
                color: #f8fafc;
            }}

            .creator-link-text span {{
                font-size: 16px;
                color: #94a3b8;
            }}

            .creator-footer {{
                max-width: 1200px;
                margin: 50px auto 0;
                text-align: center;
                color: #94a3b8;
                font-size: 15px;
            }}

            /* Keep the creator page open just like the reference design. */
            .creator-page-shell .sidebar {{ width: 240px; }}
            .creator-page-shell .main-content {{ margin-left: 240px; }}

            @media (max-width: 900px) {{
                .creator-main {{ padding: 28px 20px; }}
                .creator-box {{
                    grid-template-columns: 1fr;
                    text-align: center;
                    padding: 38px 28px;
                    gap: 28px;
                }}
                .creator-divider,
                .creator-links {{ width: 100%; }}
                .creator-purpose {{ margin-left: auto; margin-right: auto; }}
                .creator-photo {{ width: 210px; height: 210px; }}
            }}

            @media (max-width: 600px) {{
                .creator-page-title {{ font-size: 28px; }}
                .creator-box {{ padding: 28px 20px; }}
                .creator-content h1 {{ font-size: 32px; }}
                .creator-role {{ font-size: 19px; }}
                .creator-purpose {{ font-size: 15px; }}
            }}
        </style>
    </head>

    <body class="creator-page-shell">
        {render_sidebar("creator")}

        <main class="main-content">
            <div class="creator-main">
               <h1 class="creator-page-title">
    <span class="refresh-icon">⟳</span>
    Creator Profile
</h1>

                <section class="creator-box">
                    <div class="creator-photo-wrap">
                        <img
                            src="/static/profile.jpg"
                            alt="Prathima Itikala"
                            class="creator-photo"
                        >
                    </div>

                    <div class="creator-content">
                        <h1>Prathima Itikala</h1>
                        <div class="creator-role">Creator &amp; Developer</div>
                        <div class="creator-divider"></div>

                        <h2>About HealthForecast AI</h2>
                        <p class="creator-purpose">
                            HealthForecast AI is an AI-powered healthcare application
                            designed for patient readmission risk prediction and
                            healthcare analytics.
                        </p>

                        <div class="creator-links">
                            <a href="mailto:prathimaitikala@gmail.com">
                                <span class="creator-link-icon">✉️</span>
                                <span class="creator-link-text">
                                    <strong>Contact</strong>
                                    <span>prathimaitikala@gmail.com</span>
                                </span>
                            </a>

                            <a href="https://github.com/prathimaitikala" target="_blank" rel="noopener noreferrer">
                                <span class="creator-link-icon">◉</span>
                                <span class="creator-link-text">
                                    <strong>GitHub</strong>
                                    <span>github.com/prathimaitikala</span>
                                </span>
                            </a>

                            <a href="https://www.linkedin.com/in/prathima-itikala/" target="_blank" rel="noopener noreferrer">
                                <span class="creator-link-icon">in</span>
                                <span class="creator-link-text">
                                    <strong>LinkedIn</strong>
                                    <span>linkedin.com/in/prathima-itikala</span>
                                </span>
                            </a>
                        </div>
                    </div>
                </section>

                <div class="creator-footer">
                    © 2026 HealthForecast AI. All rights reserved.
                </div>
            </div>
        </main>
    </body>
    </html>
    """


@app.get("/contact", response_class=HTMLResponse, tags=["Home"], summary="Contact Page")
def contact_page():
    return f"""
<!DOCTYPE html>
<html>

<head>

    <title>HealthForecast AI - Contact</title>

    <style>

        {SHARED_STYLE}

        .contact-container{{
            width:100%;
            box-sizing:border-box;
            padding:110px 40px 50px 40px;
        }}

        .contact-header{{
            margin-bottom:35px;
        }}

        .contact-header h1{{
            font-size:38px;
            margin:0 0 10px 0;
        }}

        .contact-header p{{
            color:#94a3b8;
            font-size:16px;
            max-width:750px;
            line-height:1.6;
        }}

        .contact-grid{{
            display:grid;
            grid-template-columns:repeat(3,1fr);
            gap:24px;
            margin-top:30px;
        }}

        .contact-card{{
            background:rgba(15,23,42,.85);
            border:1px solid rgba(255,255,255,.08);
            border-radius:18px;
            padding:28px;
            box-sizing:border-box;
            min-height:180px;
            transition:transform .2s ease;
        }}

        .contact-card:hover{{
            transform:translateY(-3px);
        }}

        .contact-icon{{
            font-size:28px;
            margin-bottom:18px;
        }}

        .contact-card h3{{
            margin:0 0 10px 0;
            font-size:18px;
        }}

        .contact-card p{{
            margin:0;
            color:#94a3b8;
            font-size:14px;
            line-height:1.6;
        }}

        .contact-card a{{
            color:#60a5fa;
            text-decoration:none;
            font-weight:600;
        }}

        .feedback-section{{
            margin-top:30px;
            background:rgba(15,23,42,.85);
            border:1px solid rgba(255,255,255,.08);
            border-radius:20px;
            padding:30px;
        }}

        .feedback-section h2{{
            margin:0 0 10px 0;
            font-size:24px;
        }}

        .feedback-section p{{
            color:#94a3b8;
            line-height:1.6;
            margin-bottom:22px;
        }}

        .feedback-button{{
            display:inline-block;
            background:#2563eb;
            color:white;
            text-decoration:none;
            padding:12px 24px;
            border-radius:10px;
            font-weight:600;
        }}

        .feedback-button:hover{{
            background:#1d4ed8;
        }}

        @media(max-width:900px){{
            .contact-grid{{
                grid-template-columns:1fr 1fr;
            }}
        }}

        @media(max-width:600px){{
            .contact-container{{
                padding:100px 20px 40px 20px;
            }}

            .contact-grid{{
                grid-template-columns:1fr;
            }}
        }}

    </style>

</head>


<body>

    {render_sidebar("contact")}


    <div class="main-content">

        <div class="contact-container">


            <div class="contact-header">

                <h1>📞 Contact Us</h1>

                <p>
                    Have questions about HealthForecast AI, patient risk
                    predictions, account access, or the platform?
                    Our team is here to help.
                </p>

            </div>


            <div class="contact-grid">


                <div class="contact-card">

                    <div class="contact-icon">📧</div>

                    <h3>Email Support</h3>

                    <p>
                        <a href="mailto:prathimaitikala@gmail.com?subject=HealthForecast%20AI%20-%20General%20Support">
                            support@healthforecastai.com
                        </a>
                        <br>
                        General platform questions and support.
                    </p>

                </div>


                <div class="contact-card">

                    <div class="contact-icon">🩺</div>

                    <h3>Clinical Team</h3>

                    <p>
                        <a href="mailto:prathimaitikala@gmail.com?subject=HealthForecast%20AI%20-%20Clinical%20Question">
                            clinical@healthforecastai.com
                        </a>
                        <br>
                        Questions about risk scoring and clinical logic.
                    </p>

                </div>


                <div class="contact-card">

                    <div class="contact-icon">⚙️</div>

                    <h3>Technical / Admin</h3>

                    <p>
                        <a href="mailto:prathimaitikala@gmail.com?subject=HealthForecast%20AI%20-%20Technical%20Support">
                            admin@healthforecastai.com
                        </a>
                        <br>
                        Account access, roles, and technical issues.
                    </p>

                </div>


            </div>


            <div class="feedback-section">

                <h2>💬 Have more to say?</h2>

                <p>
                    Share detailed feedback, suggestions, or issues
                    through our feedback form. Your feedback helps
                    improve the HealthForecast AI platform.
                </p>

                <a href="/feedback" class="feedback-button">
                    Go to Feedback →
                </a>

            </div>


        </div>

    </div>


</body>

</html>
"""


@app.get("/feedback", response_class=HTMLResponse, tags=["Home"], summary="Feedback Page")
def feedback_page():
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <title>HealthForecast AI - Feedback</title>
        <style>{SHARED_STYLE}</style>
    </head>
    <body>
        {render_sidebar("feedback")}
        <div class="main-content">
        <div class="page-wrap">
            <div class="eyebrow">We're Listening</div>
            <h1 class="page-title">Share Your Feedback</h1>
            <p class="page-subtitle">Tell us what's working, what's confusing, or what you'd like to see next.</p>

            <div class="card">
                <h3>Send Feedback</h3>
                <p class="card-note">Submissions are saved and reviewed by System Administrators in the Admin Panel. No confirmation email is sent.</p>
                <div class="field-row">
                    <input type="text" id="fb_name" placeholder="Your name" style="flex:1;">
                </div>
                <div class="field-row">
                    <input type="email" id="fb_email" placeholder="Your email" style="flex:1;">
                </div>
                <div class="field-row">
                    <textarea id="fb_message" placeholder="Your feedback..." rows="5" style="width:100%;"></textarea>
                </div>
                <button onclick="submitFeedback()">Submit Feedback</button>
                <div id="fbResult" class="result-box"></div>
            </div>
        </div>

        <script>
            async function submitFeedback() {{
                const name = document.getElementById('fb_name').value;
                const email = document.getElementById('fb_email').value;
                const message = document.getElementById('fb_message').value;
                const resultDiv = document.getElementById('fbResult');
                resultDiv.classList.add('show');

                if (!name || !email || !message) {{
                    resultDiv.className = 'result-box show result-error';
                    resultDiv.innerText = 'Please fill in all fields.';
                    return;
                }}

                const res = await fetch('/feedback', {{
                    method: 'POST',
                    headers: {{'Content-Type': 'application/json'}},
                    body: JSON.stringify({{name, email, message}})
                }});
                const data = await res.json();

                if (res.ok) {{
                    resultDiv.className = 'result-box show result-success';
                    resultDiv.innerText = 'Thank you! Your feedback has been submitted and stored for review.';
                    document.getElementById('fb_name').value = '';
                    document.getElementById('fb_email').value = '';
                    document.getElementById('fb_message').value = '';
                }} else {{
                    resultDiv.className = 'result-box show result-error';
                    resultDiv.innerText = 'Error: ' + data.detail;
                }}
            }}
        </script>
    </body>
    </html>
    """
