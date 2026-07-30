# 🧬 Virtual Cell

> An Interactive Bio-Simulator that acts as a virtual laboratory for researchers and students to simulate cell behavior under different biological conditions.

---

# 📖 Overview

Virtual Cell is an educational and research-oriented web application that simulates the behavior of human cells under different environmental conditions.

The platform allows users to experiment with oxygen level, glucose concentration, pH, temperature, radiation exposure, viral infection, gene editing, drug treatments, and immune response.

Instead of performing expensive laboratory experiments, researchers can test hypotheses virtually before moving to real-world experiments.

---

# 🎯 Objectives

- Reduce laboratory cost and time.
- Help researchers validate hypotheses.
- Provide an interactive educational platform.
- Visualize biological processes.
- Generate experiment reports automatically.

---

# 🚀 Features

### Cell Simulation
- Normal Cell
- Cancer Cell

### Microenvironment
- Oxygen Level
- Glucose Level
- pH
- Temperature

### External Factors
- Viral Infection
- Radiation

### Biological Profile
- Child
- Adult
- Elderly

### Gene Editing
- CRISPR (P53)

### Drug Simulation
- Drug Selection
- Dosage Control
- Drug Resistance

### Immune System
- Cancer Cell vs T-Cell
- Immunotherapy

### Visualization
- Live Charts
- ATP
- Cell Health
- Mutation Rate
- ROS Indicator

### Reports
- AI Explanation
- Export CSV
- Export PDF (Planned)

### Extra Features
- Comparative Analysis
- Before & After Comparison
- Biological Timeline & Replay
- Cost Saving Tracker

---

# 🛠 Tech Stack

## Frontend

- React
- Vite
- Recharts
- CSS

## Backend

- Node.js
- Express.js

## AI

- Claude API

---

# 📂 Project Structure

```text
Virtual-Cell/
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── utils/
│   │   ├── styles/
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── package.json
│
├── backend/
│   ├── controllers/
│   ├── routes/
│   ├── models/
│   ├── middleware/
│   ├── services/
│   ├── utils/
│   ├── config/
│   ├── server.js
│   └── package.json
│
├── docs/
│
├── README.md
│
└── .gitignore
```

---

# ⚙ Installation

Clone the repository

```bash
git clone <repository-url>
```

Install frontend dependencies

```bash
cd frontend
npm install
```

Install backend dependencies

```bash
cd ../backend
npm install
```

---

# ▶️ How to Run

Run Frontend

```bash
cd frontend
npm run dev
```

Run Backend

```bash
cd backend
npm run dev
```

---



