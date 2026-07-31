# 🧬 Virtual Cell

### Interactive Bio-Simulator Platform

**A browser-based Digital Twin of a human cell — simulate, visualize, and understand cell biology in real time. No install. No code. No lab required.**

[![Status](https://img.shields.io/badge/status-active%20prototype-4FD1C5)](#-project-status)
[![Phase](https://img.shields.io/badge/RedDev-Phase%202-F2B33D)](#-project-status)
[![Frontend](https://img.shields.io/badge/frontend-React-61DAFB)](#-tech-stack)
[![AI](https://img.shields.io/badge/AI-Claude%20API-9B8AFB)](#-tech-stack)
[![License](https://img.shields.io/badge/license-TBD-lightgrey)](#-license)

---

## 📖 Table of Contents

- [About the Project](#-about-the-project)
- [Why Virtual Cell](#-why-virtual-cell)
- [Key Features](#-key-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Documentation Repository](#-documentation-repository)
- [How to Run](#-how-to-run)
- [Screens & Diagrams](#-screens--diagrams)
- [Roadmap](#-roadmap)
- [Known Limitations](#-known-limitations)
- [Project Status](#-project-status)
- [Contributing](#-contributing)
- [Team](#-team)
- [License](#-license)

---

## 🧪 About the Project

**Virtual Cell** is an interactive, browser-based simulation platform that lets students and researchers explore how a human cell behaves under different biological and environmental conditions — without touching a real lab.

Biological research today relies heavily on laboratory experiments that are expensive, slow, and hard to iterate on. Bringing a single new drug to market costs roughly **$1.3 billion** on average and takes **10–15 years**, and around **86%** of drugs that enter clinical trials never make it to market. Before committing real time and budget to a physical experiment, researchers and students have very few fast, visual ways to test a hypothesis.

Virtual Cell closes that gap. Set the environment, the cell's genetics, and a drug treatment, run the simulation, and watch the cell respond in real time — with an AI-generated, plain-language explanation of *why* it happened, not just *what* happened.

It is built as a **Digital Twin**: a live, interactive, quantitative model of a single cell (and, in the Cell Battle module, two interacting cells) — not a static diagram, not a Boolean on/off network, and not a video.

> ⚠️ **Model transparency:** Virtual Cell uses a simplified, illustrative simulation model inspired by real biological principles (the Krebs cycle, ATP production, p53 tumor suppression, checkpoint-inhibitor immunotherapy, oxidative stress) with invented numerical coefficients for demonstration. It is **not** a clinically validated or research-grade simulation, and every mechanic is backed by cited, peer-reviewed research in the `Research` folder — but the model itself is built for education and hypothesis exploration, not diagnosis or treatment decisions.

---

## 💡 Why Virtual Cell

| | |
|---|---|
| 🖥️ **Zero install, zero code** | Runs instantly in any browser — no setup, no account required to start |
| 🔬 **Quantitative, not qualitative** | Real numeric outputs (ATP, health %, mutation load, ROS) — not just "active/inactive" states |
| 🤖 **AI-generated explanations** | Every result comes with a plain-language "why" via the Claude API |
| 👁️ **Real-time visual feedback** | The cell visibly animates and changes as the simulation runs |
| 📊 **Built-in scientific tooling** | Comparative analysis, timeline replay, cost/time-saved tracking, CSV export |
| 🎓 **Built for everyone** | Simple enough for a first-year student, deep enough for a researcher |

Neither of the two closest existing tools — **Cell Collective** (no-code Boolean pathway modeling) or **PhysiCell** (large-scale 3-D tissue simulation in C++) — combines all of the above in one product. See `Business/Competitor_Analysis.pdf` for the full comparison.

---

## ✨ Key Features

### 🧫 Cell Module
- Cell Type selector — **Normal** vs. **Cancerous** (independent behavior: division speed, apoptosis resistance, glucose demand)
- Biological age profile — **Child / Adult / Elderly** (mitochondrial efficiency, DNA repair rate)
- CRISPR-Cas9 **P53 knockout** toggle, with mutation accumulation and malignant transformation

### 🌡️ Environment Module
- Oxygen, glucose, pH, and temperature sliders
- External interventions: radiation dose, viral infection toggle

### 🦠 Disease Module
- Infection progression and mutation accumulation
- **Cell-to-Cell Battle**: Cancer cell vs. T-Cell, with an Immunotherapy toggle

### 💊 Drug Module
- Pharmacology Sandbox — drug type (Kinase Inhibitor / Chemo / Immuno), dose control
- Drug **resistance tracking** that accumulates across repeated simulation runs

### 🤖 AI Module
- AI Insights Panel — sends the full simulation context to the **Claude API** and renders a plain-language explanation of the result
- Designed as an enhancement layer: the app is fully usable even if the AI call fails

### 📈 Visualization Module
- Live animated cell view (SVG) that changes color and shape with cell health
- Real-time charts: ATP, Health, Mutation Load, ROS (Reactive Oxygen Species)
- **Biological Timeline & Replay** — scrub or auto-play through every simulation tick
- **Before & After Comparison** — first tick vs. final tick, side by side
- **Comparative Analysis** — save a run as a baseline, overlay a second run, see the exact delta

### 📄 Report Module
- Auto-generated Lab Report with a plain-language interpretation of the outcome
- **CSV export** of full tick-by-tick simulation data (fully functional)
- **Cost & Viability Tracker** — live estimate of $ and time saved vs. a real wet-lab experiment

---

## 🛠️ Tech Stack

| Layer | Technology | Why |
|---|---|---|
| **Frontend** | React | State-driven UI — every slider and toggle updates the simulation instantly; huge ecosystem of chart/animation libraries |
| **Charts** | Recharts | Native React charting, renders as SVG, easy to layer multiple metrics and reference lines |
| **Icons** | Lucide React | Lightweight, consistent icon set matching the app's design system |
| **AI** | Claude API (Anthropic) | Powers the AI Insights Panel — no training data or model maintenance required, understands novel parameter combinations directly from a prompt |
| **Backend** *(planned)* | Node.js | Shares JS/TS with the frontend, non-blocking I/O suited to concurrent simulation + AI requests — **not yet implemented**, see [Known Limitations](#-known-limitations) |
| **Database** *(planned)* | PostgreSQL-style relational schema | Users / Experiments / Reports / Saved Baselines — see `Technical/database.png` — **not yet implemented** |

Full reasoning for each choice: `Technical/Tech_Stack_Justification.docx`.

---

## 📁 Project Structure

```
virtual-cell/
│
├── src/
│   ├── cell_digital_twin_web_full.jsx      # Desktop app — 3-column dashboard layout
│   ├── cell_digital_twin_mobile_full.jsx   # Mobile app — bottom tab-bar layout
│   │
│   ├── components/                         # (planned) shared UI components as the
│   │                                        #  codebase is broken out of the two
│   │                                        #  full-app files above
│   ├── engine/                             # (planned) simulation engine module
│   │                                        #  (single-cell + cell-to-cell logic)
│   └── styles/                             # (planned) design tokens / theme
│
├── public/
│   └── index.html
│
├── package.json
└── README.md                                # you are here
```

> The two `*_full.jsx` files currently contain the complete working application (state, simulation engine, and UI) for their respective platform. Breaking them into `components/` and `engine/` is scoped as part of ongoing Phase 2 technical work — see [Known Limitations](#-known-limitations).

---

## 📚 Documentation Repository

All project documentation lives in Google Drive, organized into four folders. This structure stays fixed across phases — only the **Deliverables** subfolder changes per phase:

```
📂 Google Drive — Virtual Cell
│
├── 📂 Research/              # Every paper/resource cited to justify a mechanic
│   └── (8+ papers: ATP & mitochondria, hypoxia & oxygen, drug resistance &
│        immunotherapy, apoptosis & DNA repair, ROS & oxidative stress,
│        p53 tumor suppression, pH/Warburg/CRISPR, Key Statistics)
│
├── 📂 Business/               # Strategy, market, and business-model analysis
│   └── (Problem Statement, Value Proposition Canvas, Business Model Canvas,
│        Go-to-Market & Defensibility Strategy, Competitor Analysis, SWOT,
│        Risk Analysis, Pricing & Unit Economics, Executive Summary)
│
├── 📂 Technical/               # Architecture, technical references, diagrams
│   └── (System Architecture, Main Modules, Database Draft,
│        Tech Stack Justification)
│
└── 📂 Phase 2 Deliverables/    # ⭐ Current phase's required tasks ONLY
    └── (Clearly labeled per task — see convention below)
```

**Labeling convention for the Deliverables folder** — every file is prefixed with its task number and a short, exact name matching the task list, so anything in the folder is instantly identifiable during review:

```
1_Feature-List-MVP-Scope/
    Core_Nice_to_Have_Features.docx
    MVP_Prioritization.pdf
    feature_dependency_map.png

2_User-Flow-Diagrams/
    user_journey_map.png
    main_user_journeys.png
    Core_App_Flows.docx
    core_app_flows_visual.png
    Edge_Cases.pdf

3_Wireframes-UI-Design/
4_Design-System-UI-Kit/
5_GitHub-Setup/
6_Frontend-Backend-Skeleton/
```

Everything in Drive is reviewed, so keeping this labeling exact — task number, task name, no loose/renamed files — is what makes the submission easy to grade correctly.

---

## ▶️ How to Run

> The project is currently distributed as complete single-file React apps. To run it locally in a standard React project:

```bash
# 1. Clone the repository
git clone https://github.com/<your-org>/virtual-cell.git
cd virtual-cell

# 2. Install dependencies
npm install react react-dom recharts lucide-react

# 3. Add the app file
# Place cell_digital_twin_web_full.jsx (or the mobile version)
# as your app's root component, e.g. src/App.jsx

# 4. Start the development server
npm start
```

The app will open at `http://localhost:3000`. No environment variables or API keys are required to explore the simulator — the AI Insights Panel calls the Claude API through a managed connection.

**Requirements:** Node.js 18+, npm 9+, a modern browser (Chrome/Edge/Firefox/Safari, latest 2 versions).

---

## 🖼️ Screens & Diagrams

| Diagram | What it shows |
|---|---|
| `architecture.png` | Full system architecture — User → Web App → Simulation Engine → AI/Charts/Reports |
| `modules.png` | The 7 main modules and their sub-features |
| `main_user_journeys.png` | Technical user flow — every screen, step, and decision |
| `user_journey_map.png` | Experiential user journey — goals, thoughts, feelings, pain points per stage |
| `core_app_flows_visual.png` | All 8 internal app flows as compact step-by-step diagrams |
| `database.png` | Planned database schema (Users / Experiments / Reports / Saved Baselines) |
| `feature_dependency_map.png` | What has to exist before each feature can function |

---

## 🗺️ Roadmap

| Version | Status | Highlights |
|---|---|---|
| **v1 — MVP** | ✅ Done | Single-cell simulation, environment control, drug engine, biological age, charts, basic report |
| **v2 — Depth** | ✅ Done | CRISPR gene editing, cell-to-cell interaction, AI Insights, comparative analysis, timeline replay, cost tracker |
| **v3 — Platform** | 🔜 Planned | Real backend + persistence, user accounts, PDF export, multi-cell/tissue simulation |
| **v4 — Scale** | 💭 Future | Advanced AI models, personalized medicine features, marketplace of scenarios |

---

## ⚠️ Known Limitations

Stated openly, because judges and reviewers will ask:

- **No backend or persistence yet** — all state lives in the browser and resets on refresh. The database schema and architecture for this are already designed (`Technical/database.png`) but not implemented.
- **PDF export is a placeholder** — CSV export is fully functional; the PDF export button does not yet generate a file.
- **Single- and two-cell scope only** — no tissue- or population-scale simulation (PhysiCell's territory, intentionally not this product's focus).
- **Simplified biological model** — see the [About](#-about-the-project) section's transparency note.

---

## 📌 Project Status

Currently in **RedDev Phase 2 — Product Experience & Team Execution**. Phase 1 (Product Validation & Strategy) is complete — see `Business/` and `Research/` for the full documentation set.

---

## 🤝 Contributing

This project currently follows a simple workflow while the team is small:

1. Create a branch from `main`: `git checkout -b feature/short-description`
2. Commit with clear, descriptive messages (`Add drug resistance tracking to Pharmacology module`, not `update`)
3. Open a pull request describing what changed and why
4. Request a review before merging

---

## 📄 License

*To be determined.*

---

<p align="center">Built with 🧬 for RedDev — making cell biology something you can actually play with.</p>
