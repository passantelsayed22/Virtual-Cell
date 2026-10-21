import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine
} from "recharts";
import {
  Play, Pause, Droplet, Wind, Thermometer, FlaskConical, Radiation, Bug, Activity,
  Zap, FileDown, Microscope, Dna, Pill, Clock, DollarSign, Sparkles, Swords,
  Baby, User, UserCog, Download, Loader2, ShieldAlert, Info, X, Sprout, Skull,
  Atom, History, GitCompare, ArrowLeftRight, Save, RotateCcw
} from "lucide-react";

// ---------- design tokens (unchanged from the original) ----------
const C = {
  bg: "#0A1416", panel: "#0F1F22", panelAlt: "#0C1A1C", line: "#1E3A3D",
  teal: "#4FD1C5", tealDim: "#2C6B66", amber: "#F2B33D", vermilion: "#E4572E",
  violet: "#9B8AFB", magenta: "#E76FC0", text: "#E6F1EF", textDim: "#7FA39D", ros: "#5FC9F3",
};

function clamp(v, lo, hi) { return Math.min(hi, Math.max(lo, v)); }
function r1(v) { return Math.round(v * 10) / 10; }

const AGE_PROFILES = {
  child: { mito: 1.15, repair: 1.3, ros: 0.8, label: "Child", icon: Baby },
  adult: { mito: 1.0, repair: 1.0, ros: 1.0, label: "Adult", icon: User },
  elderly: { mito: 0.72, repair: 0.55, ros: 1.45, label: "Elderly", icon: UserCog },
};

const CELL_TYPES = {
  normal: { division: 1.0, apoptosisResistance: 1.0, glucoseUse: 1.0, label: "Normal", icon: Sprout },
  cancerous: { division: 1.8, apoptosisResistance: 2.4, glucoseUse: 1.5, label: "Cancerous", icon: Skull },
};

// ---------- single-cell simulation ----------
function simulate({ o2, glucose, ph, temp, virus, radiation, drugDose, steps, age, p53KO, resistance, cellType }) {
  const ageMod = AGE_PROFILES[age];
  const typeMod = CELL_TYPES[cellType];
  const resistanceEff = clamp(resistance / 150, 0, 0.85);
  let health = 100, atp = 80, infection = virus ? 5 : 0, mutation = 0;
  let malignant = cellType === "cancerous";
  const rows = [];
  for (let t = 0; t <= steps; t++) {
    const phPenalty = Math.abs(ph - 7.4) * 18;
    const tempPenalty = Math.abs(temp - 37) * 3.2;
    const o2Factor = clamp(o2 / 21, 0, 1.6);
    const glucoseFactor = clamp(glucose / 90, 0, 1.6);
    const production = 14 * ageMod.mito * typeMod.division * o2Factor * glucoseFactor - phPenalty * 0.35 - tempPenalty * 0.35;

    const effectiveDrug = drugDose * (1 - resistanceEff);
    const radiationDamage = radiation * 1.1;
    const infectionDamage = infection * 0.9;
    const drugTherapeutic = effectiveDrug * ((infection > 0 || malignant) ? 1.3 : 0);
    const drugToxicity = effectiveDrug * 0.22;
    const consumption = 6 * typeMod.glucoseUse + radiation * 0.4 + infection * 0.3;

    atp = clamp(atp + production - consumption - drugToxicity * 0.3, 0, 100);
    mutation = clamp(mutation + radiation * 0.5 * (p53KO ? 1.8 : 0.4) - ageMod.repair * 0.4, 0, 100);
    const hypoxiaStress = clamp((1 - o2Factor) * 22, 0, 30);
    const ros = clamp((hypoxiaStress + radiation * 1.3 + (malignant ? 10 : 0)) * ageMod.ros, 0, 100);
    const netStress = radiationDamage + infectionDamage - drugTherapeutic - clamp(atp - 40, 0, 30) * 0.15;
    health = clamp(health - (netStress * 0.5) / typeMod.apoptosisResistance + (atp > 55 ? 0.6 : -0.4), 0, 100);
    if (virus) infection = clamp(infection + 1.4 - effectiveDrug * 0.35, 0, 100);
    if (cellType === "normal" && p53KO && mutation > 70) malignant = true;
    if (malignant) health = clamp(health + 0.8, cellType === "cancerous" ? 65 : 60, 95);

    let status = "Healthy";
    if (malignant) status = cellType === "cancerous" ? "Malignant (Cancerous)" : "Malignant Transformation";
    else if (health <= 0) status = "Apoptosis";
    else if (health < 35) status = "Critical";
    else if (health < 65) status = "Stressed";

    rows.push({ t, atp: r1(atp), health: r1(health), infection: r1(infection), mutation: r1(mutation), ros: r1(ros), status });
    if (status === "Apoptosis") break;
  }
  return rows;
}

// ---------- cell-to-cell interaction simulation ----------
function simulateInteraction({ immunotherapy, steps }) {
  let cancerHealth = 100, tcell = 20;
  const rows = [];
  for (let t = 0; t <= steps; t++) {
    const suppression = immunotherapy ? 0.2 : 2.6;
    tcell = clamp(tcell + (immunotherapy ? 3.2 : 0.3) - suppression, 0, 100);
    const damage = tcell * 0.4;
    cancerHealth = clamp(cancerHealth - damage + (immunotherapy ? 0 : 1.3), 0, 100);
    rows.push({ t, cancerHealth: r1(cancerHealth), tcell: r1(tcell) });
    if (cancerHealth <= 0) break;
  }
  return rows;
}

const statusColor = (s) =>
  s === "Healthy" ? C.teal : s === "Stressed" ? C.amber :
  s === "Critical" ? C.vermilion : (s === "Malignant Transformation" || s === "Malignant (Cancerous)") ? C.magenta : "#6b1f12";

const CHART_LABELS = {
  atp: "ATP — cellular energy currency, produced via respiration",
  health: "Health — overall cell viability (0 = dead)",
  infection: "Infection — viral load inside the cell",
  mutation: "Mutation load — accumulated DNA damage",
  ros: "ROS — reactive oxygen species (oxidative stress)",
  cancerHealth: "Cancer cell health",
  tcell: "T-Cell activity — immune attack strength",
  baseHealth: "Baseline run — health", curHealth: "Current run — health",
  baseAtp: "Baseline run — ATP", curAtp: "Current run — ATP",
};
function tooltipFormatter(value, name) { return [`${value}%`, CHART_LABELS[name] || name]; }

// ---------- small UI primitives (same style as the original) ----------
function Slider({ icon: Icon, label, value, setValue, min, max, step, unit, accent }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, color: C.textDim, fontSize: 12, letterSpacing: 0.6, textTransform: "uppercase" }}>
          <Icon size={14} color={accent} />{label}
        </div>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: C.text }}>{value}{unit}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => setValue(parseFloat(e.target.value))}
        style={{ width: "100%", accentColor: accent, height: 4, cursor: "pointer" }} />
    </div>
  );
}

function Toggle({ icon: Icon, label, checked, onChange, accent, sub }) {
  return (
    <button onClick={() => onChange(!checked)} style={{
      display: "flex", alignItems: "flex-start", gap: 8, width: "100%",
      background: checked ? `${accent}22` : "transparent",
      border: `1px solid ${checked ? accent : C.line}`, borderRadius: 8, padding: "9px 12px",
      cursor: "pointer", color: checked ? accent : C.textDim, fontSize: 12.5, letterSpacing: 0.4,
      textTransform: "uppercase", marginBottom: 10, textAlign: "left"
    }}>
      <Icon size={14} style={{ marginTop: 2, flexShrink: 0 }} />
      <span style={{ flex: 1 }}>
        {label}
        {sub && <div style={{ fontSize: 10.5, textTransform: "none", opacity: 0.75, marginTop: 3, lineHeight: 1.4 }}>{sub}</div>}
      </span>
      <span style={{ fontFamily: "monospace", fontSize: 11, flexShrink: 0 }}>{checked ? "ON" : "OFF"}</span>
    </button>
  );
}

function Segmented({ options, value, onChange, accent }) {
  return (
    <div style={{ display: "flex", gap: 6, background: C.panelAlt, padding: 4, borderRadius: 10, marginBottom: 14 }}>
      {options.map((opt) => (
        <button key={opt.value} onClick={() => onChange(opt.value)} style={{
          flex: 1, padding: "8px 4px", borderRadius: 7, border: "none", cursor: "pointer",
          background: value === opt.value ? accent : "transparent",
          color: value === opt.value ? "#04211E" : C.textDim,
          fontSize: 11.5, fontWeight: value === opt.value ? 600 : 400,
          display: "flex", flexDirection: "column", alignItems: "center", gap: 3
        }}>
          {opt.icon && <opt.icon size={14} />}
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function CellSVG({ health, atp, status, size = 240, tint }) {
  const color = tint || (status === "Healthy" ? C.teal : status === "Stressed" ? C.amber :
    (status === "Malignant Transformation" || status === "Malignant (Cancerous)") ? C.magenta : C.vermilion);
  const pulse = clamp(atp / 100, 0.3, 1);
  const wobble = status === "Apoptosis" ? 0 : clamp(health / 100, 0.4, 1);
  const spiky = status === "Malignant Transformation" || status === "Malignant (Cancerous)";
  return (
    <svg viewBox="0 0 300 300" style={{ width: size, height: size, display: "block", margin: "0 auto" }}>
      <defs>
        <radialGradient id={`mb-${size}-${tint || "d"}`} cx="50%" cy="45%" r="60%">
          <stop offset="0%" stopColor={color} stopOpacity="0.18" />
          <stop offset="80%" stopColor={color} stopOpacity="0.05" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="150" cy="150" r={110 * wobble + 20} fill={`url(#mb-${size}-${tint || "d"})`} />
      <circle cx="150" cy="150" r={95 * wobble + 15} fill="none" stroke={color} strokeWidth="2"
        opacity={0.8} strokeDasharray={spiky ? "6 3" : "none"}>
        <animate attributeName="r" values={`${95*wobble+13};${95*wobble+18};${95*wobble+13}`} dur={`${3/pulse}s`} repeatCount="indefinite" />
      </circle>
      <circle cx="150" cy="150" r="34" fill={C.violet} opacity="0.5" />
      <circle cx="150" cy="150" r="34" fill="none" stroke={C.violet} strokeWidth="1.5" opacity="0.9" />
      {[[100,110,-20],[195,120,15],[110,195,30],[190,190,-10]].map(([x,y,rot], i) => (
        <ellipse key={i} cx={x} cy={y} rx="14" ry="7" fill={C.amber} opacity={0.35 + pulse * 0.4}
          transform={`rotate(${rot} ${x} ${y})`}>
          <animate attributeName="opacity" values={`${0.25+pulse*0.3};${0.5+pulse*0.4};${0.25+pulse*0.3}`} dur={`${2/pulse}s`} repeatCount="indefinite" />
        </ellipse>
      ))}
    </svg>
  );
}

function Metric({ label, value, unit, color, icon: Icon }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4, color, fontFamily: "'JetBrains Mono', monospace", fontSize: 19, fontWeight: 600 }}>
        <Icon size={14} /> {value}{typeof value === "number" ? unit : ""}
      </div>
      <div style={{ color: C.textDim, fontSize: 10, textTransform: "uppercase", letterSpacing: 0.6, marginTop: 3 }}>{label}</div>
    </div>
  );
}

function Panel({ title, children, right, grow }) {
  return (
    <div style={{
      background: C.panel, border: `1px solid ${C.line}`, borderRadius: 14, padding: "18px 18px",
      marginBottom: grow ? 0 : 18,
      ...(grow ? { flex: 1, display: "flex", flexDirection: "column" } : {}),
    }}>
      {title && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 13.5, fontWeight: 700, color: C.text, letterSpacing: 0.3 }}>{title}</div>
          {right}
        </div>
      )}
      {grow ? (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>{children}</div>
      ) : children}
    </div>
  );
}

function EmptyState({ text }) {
  return <div style={{ color: C.textDim, fontSize: 13, textAlign: "center", padding: "34px 12px", lineHeight: 1.6 }}>{text}</div>;
}

function ReportRow({ label, value, color }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 8, padding: "6px 0", borderBottom: `1px solid ${C.line}` }}>
      <span style={{ color: C.textDim, fontSize: 13 }}>{label}</span>
      <span style={{ color: color || C.text, fontFamily: "'JetBrains Mono', monospace", fontWeight: 500, fontSize: 13 }}>{value}</span>
    </div>
  );
}

function ChartLegendNote({ rows }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 20px", marginTop: 12, paddingTop: 12, borderTop: `1px solid ${C.line}` }}>
      {rows.map((r) => (
        <div key={r.label} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 11.5, color: C.textDim, lineHeight: 1.5, minWidth: 210 }}>
          <span style={{ width: 9, height: 9, borderRadius: "50%", background: r.color, flexShrink: 0, marginTop: 3 }} />
          <span><strong style={{ color: C.text }}>{r.label}</strong> — {r.desc}</span>
        </div>
      ))}
    </div>
  );
}

function interpret(summary, virus, radiation, p53KO, cellType) {
  if (summary.ended === "Malignant (Cancerous)") return "This was already a cancerous cell — it resisted apoptosis and kept dividing (Warburg-style high glucose demand) despite the stress applied.";
  if (summary.ended === "Malignant Transformation") return "The cell escaped apoptosis and began uncontrolled division — with p53 knocked out, DNA damage checkpoints failed to stop the cell cycle after radiation exposure.";
  if (summary.ended === "Apoptosis") return "The cell did not survive — stress from " + [virus && "infection", radiation > 0 && "radiation", "environmental imbalance"].filter(Boolean).join(", ") + " exceeded its recovery capacity.";
  if (summary.ended === "Critical") return "The cell survived but ended in critical condition. Consider lowering stressors or increasing the therapeutic dose.";
  if (summary.ended === "Stressed") return "The cell shows moderate stress. ATP production is under pressure — check oxygen and glucose levels.";
  return "The cell maintained stable ATP and health throughout the run — conditions stayed in a healthy range.";
}

function exportCSV(data, projectName) {
  const header = "tick,atp,health,infection,mutation_load,ros,status\n";
  const body = data.map(d => `${d.t},${d.atp},${d.health},${d.infection ?? ""},${d.mutation ?? ""},${d.ros ?? ""},${d.status}`).join("\n");
  const blob = new Blob([header + body], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `${projectName.replace(/\s+/g, "_")}.csv`;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

async function fetchAIInsight(promptText) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 1000,
      messages: [{ role: "user", content: promptText }],
    }),
  });
  const data = await response.json();
  const text = (data.content || []).filter(b => b.type === "text").map(b => b.text).join("\n");
  return text || "No insight returned.";
}

function DisclaimerBadge() {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ position: "relative" }}>
      <button onClick={() => setOpen((o) => !o)} style={{
        display: "flex", alignItems: "center", gap: 6, background: `${C.amber}14`, border: `1px solid ${C.amber}55`,
        borderRadius: 20, padding: "5px 10px", cursor: "pointer", color: C.amber, fontSize: 11, flexShrink: 0
      }}>
        <Info size={13} /> Model notes
      </button>
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 8px)", right: 0, width: 300, zIndex: 20,
          background: C.panel, border: `1px solid ${C.amber}55`, borderRadius: 12, padding: "12px 14px",
          boxShadow: "0 12px 32px rgba(0,0,0,0.4)"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <strong style={{ color: C.amber, fontSize: 12 }}>Simplified illustrative model</strong>
            <button onClick={() => setOpen(false)} style={{ background: "none", border: "none", color: C.textDim, cursor: "pointer" }}><X size={13} /></button>
          </div>
          <div style={{ fontSize: 11.5, color: C.text, lineHeight: 1.6 }}>
            Inspired by real biological principles (ATP production, pH/temperature sensitivity, p53 tumor suppression,
            immune checkpoint inhibition) but uses invented coefficients for demonstration — it is <em>not</em> a
            clinically validated or research-grade simulation.
          </div>
        </div>
      )}
    </div>
  );
}

export default function VirtualCellWebApp() {
  // environment
  const [o2, setO2] = useState(21);
  const [glucose, setGlucose] = useState(90);
  const [ph, setPh] = useState(7.4);
  const [temp, setTemp] = useState(37);
  const [virus, setVirus] = useState(false);
  const [radiation, setRadiation] = useState(0);

  // genetics / age / cell type
  const [age, setAge] = useState("adult");
  const [p53KO, setP53KO] = useState(false);
  const [cellType, setCellType] = useState("normal");

  // pharmacology
  const [drugDose, setDrugDose] = useState(0);
  const [drugType, setDrugType] = useState("kinase");
  const [resistance, setResistance] = useState(0);

  // time-lapse
  const [timeScale, setTimeScale] = useState("realtime");
  const [steps, setSteps] = useState(40);

  // battle
  const [immunotherapy, setImmunotherapy] = useState(false);
  const [battleData, setBattleData] = useState([]);
  const [battleRunning, setBattleRunning] = useState(false);

  const [data, setData] = useState([]);
  const [running, setRunning] = useState(false);
  const [projectName, setProjectName] = useState("Untitled Experiment");

  const [costSaved, setCostSaved] = useState(0);
  const [timeSaved, setTimeSaved] = useState(0);
  const [runsCount, setRunsCount] = useState(0);

  const [aiText, setAiText] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");

  const [replayIndex, setReplayIndex] = useState(0);
  const [replaying, setReplaying] = useState(false);
  const replayTimer = useRef(null);

  const [baseline, setBaseline] = useState(null);

  const timeUnit = timeScale === "fastforward" ? "years" : "hours";

  const runSimulation = useCallback(() => {
    setRunning(true);
    setAiText(""); setAiError("");
    const rows = simulate({ o2, glucose, ph, temp, virus, radiation, drugDose, steps, age, p53KO, resistance, cellType });
    setTimeout(() => {
      setData(rows);
      setRunning(false);
      setReplayIndex(rows.length - 1);
      setReplaying(false);
      setCostSaved((c) => c + 8000 + steps * 150);
      setTimeSaved((t) => t + steps * 0.6);
      setRunsCount((n) => n + 1);
      if (drugDose > 0) setResistance((r) => clamp(r + drugDose * 0.6, 0, 100));
    }, 350);
  }, [o2, glucose, ph, temp, virus, radiation, drugDose, steps, age, p53KO, resistance, cellType]);

  const runBattle = useCallback(() => {
    setBattleRunning(true);
    const rows = simulateInteraction({ immunotherapy, steps: 30 });
    setTimeout(() => { setBattleData(rows); setBattleRunning(false); }, 350);
  }, [immunotherapy]);

  const last = data[data.length - 1];
  const finalStatus = last ? last.status : "Not run";
  const lastBattle = battleData[battleData.length - 1];

  const summary = useMemo(() => {
    if (!data.length) return null;
    const minHealth = Math.min(...data.map(d => d.health));
    const avgAtp = Math.round(data.reduce((a, d) => a + d.atp, 0) / data.length);
    return { minHealth: Math.round(minHealth), avgAtp, ended: finalStatus, ticks: data.length - 1 };
  }, [data, finalStatus]);

  useEffect(() => {
    if (replaying && data.length) {
      replayTimer.current = setInterval(() => {
        setReplayIndex((i) => {
          if (i >= data.length - 1) { setReplaying(false); return i; }
          return i + 1;
        });
      }, 220);
    }
    return () => clearInterval(replayTimer.current);
  }, [replaying, data.length]);

  const replayPoint = data[replayIndex] || null;

  const saveBaseline = useCallback(() => {
    if (!data.length || !summary) return;
    setBaseline({ data, summary, cellType, age, projectName });
  }, [data, summary, cellType, age, projectName]);

  const comparisonData = useMemo(() => {
    if (!baseline || !data.length) return [];
    const len = Math.max(baseline.data.length, data.length);
    return Array.from({ length: len }, (_, i) => ({
      t: i,
      baseHealth: baseline.data[i]?.health, curHealth: data[i]?.health,
      baseAtp: baseline.data[i]?.atp, curAtp: data[i]?.atp,
    }));
  }, [baseline, data]);

  const comparisonDelta = useMemo(() => {
    if (!baseline || !summary) return null;
    return {
      healthDelta: r1(summary.minHealth - baseline.summary.minHealth),
      atpDelta: r1(summary.avgAtp - baseline.summary.avgAtp),
      ticksDelta: summary.ticks - baseline.summary.ticks,
      statusChanged: summary.ended !== baseline.summary.ended,
    };
  }, [baseline, summary]);

  const askAI = useCallback(async () => {
    if (!summary) return;
    setAiLoading(true); setAiError(""); setAiText("");
    const prompt = `You are a cell-biology AI insights panel inside a digital twin simulator. Explain in 2-4 short sentences, in plain scientific language, why this simulated cell ended in the observed state. Be specific about mechanism (ATP/Krebs cycle, membrane, mutation, immune response) where relevant. Data: cell type=${cellType}, age profile=${age}, p53 knocked out=${p53KO}, O2=${o2}%, glucose=${glucose}mg/dL, pH=${ph}, temp=${temp}C, virus=${virus}, radiation=${radiation}Gy, drug dose=${drugDose}mg (resistance ${Math.round(resistance)}%), final status=${finalStatus}, min health reached=${summary.minHealth}%, avg ATP=${summary.avgAtp}%. Do not use markdown headers.`;
    try {
      const text = await fetchAIInsight(prompt);
      setAiText(text);
    } catch (e) {
      setAiError("Couldn't reach the AI insight service.");
    } finally {
      setAiLoading(false);
    }
  }, [summary, age, p53KO, cellType, o2, glucose, ph, temp, virus, radiation, drugDose, resistance, finalStatus]);

  return (
    <div style={{ background: C.bg, minHeight: "100%", color: C.text, fontFamily: "'Inter', -apple-system, sans-serif", padding: "28px 24px" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');
        input[type=range]::-webkit-slider-thumb { -webkit-appearance:none; width:14px; height:14px; border-radius:50%; background:currentColor; cursor:pointer; }
        input[type=text]:focus { outline: none; }
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>

      {/* header */}
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 26, borderBottom: `1px solid ${C.line}`, paddingBottom: 18 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, color: C.textDim, fontSize: 12, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 6 }}>
            <Microscope size={14} color={C.teal} /> Virtual Cell · Interactive Bio-Simulator Platform
          </div>
          <input value={projectName} onChange={(e) => setProjectName(e.target.value)}
            style={{ background: "transparent", border: "none", color: C.text, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 28, padding: 0 }} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <DisclaimerBadge />
          <span style={{ fontFamily: "monospace", fontSize: 12, padding: "6px 12px", borderRadius: 20, border: `1px solid ${statusColor(finalStatus)}`, color: statusColor(finalStatus) }}>
            ● {finalStatus}
          </span>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "340px 1fr 340px", gap: 20 }}>

        {/* ================= LEFT: all setup, always visible ================= */}
        <div>
          <Panel title="Microenvironment">
            <Slider icon={Wind} label="Oxygen (O₂)" value={o2} setValue={setO2} min={0} max={40} step={0.5} unit="%" accent={C.teal} />
            <Slider icon={Droplet} label="Glucose" value={glucose} setValue={setGlucose} min={0} max={200} step={1} unit=" mg/dL" accent={C.amber} />
            <Slider icon={FlaskConical} label="pH" value={ph} setValue={setPh} min={5.5} max={9} step={0.1} unit="" accent={C.violet} />
            <Slider icon={Thermometer} label="Temperature" value={temp} setValue={setTemp} min={20} max={45} step={0.5} unit="°C" accent={C.vermilion} />
            <Toggle icon={Bug} label="Viral Infection" checked={virus} onChange={setVirus} accent={C.vermilion} />
            <Slider icon={Radiation} label="Radiation Dose" value={radiation} setValue={setRadiation} min={0} max={20} step={0.5} unit=" Gy" accent={C.amber} />
          </Panel>

          <Panel title="Genetics & Age Profile">
            <div style={{ color: C.textDim, fontSize: 11.5, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>Cell Type</div>
            <Segmented options={Object.entries(CELL_TYPES).map(([k, v]) => ({ value: k, label: v.label, icon: v.icon }))} value={cellType} onChange={setCellType} accent={cellType === "cancerous" ? C.magenta : C.teal} />
            <div style={{ fontSize: 11, color: C.textDim, marginBottom: 16, lineHeight: 1.5 }}>
              Division ×{CELL_TYPES[cellType].division.toFixed(2)} · Apoptosis resistance ×{CELL_TYPES[cellType].apoptosisResistance.toFixed(2)} · Glucose demand ×{CELL_TYPES[cellType].glucoseUse.toFixed(2)}
            </div>
            <div style={{ color: C.textDim, fontSize: 11.5, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>Biological Age</div>
            <Segmented options={Object.entries(AGE_PROFILES).map(([k, v]) => ({ value: k, label: v.label, icon: v.icon }))} value={age} onChange={setAge} accent={C.violet} />
            <div style={{ fontSize: 11, color: C.textDim, marginBottom: 16, lineHeight: 1.5 }}>
              Mitochondrial efficiency ×{AGE_PROFILES[age].mito.toFixed(2)} · DNA repair ×{AGE_PROFILES[age].repair.toFixed(2)}
            </div>
            <div style={{ color: C.textDim, fontSize: 11.5, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>CRISPR-Cas9</div>
            <Toggle icon={Dna} label="Knockout P53" sub={cellType === "cancerous" ? "Not needed — already cancerous" : "Removes the DNA-damage checkpoint"} checked={p53KO} onChange={setP53KO} accent={C.magenta} />
          </Panel>

          <Panel title="Pharmacology Sandbox">
            <Segmented options={[{ value: "kinase", label: "Kinase Inh." }, { value: "chemo", label: "Chemo" }, { value: "immuno", label: "Immuno" }]} value={drugType} onChange={setDrugType} accent={C.teal} />
            <Slider icon={Pill} label="Drug Dose" value={drugDose} setValue={setDrugDose} min={0} max={20} step={0.5} unit=" mg" accent={C.teal} />
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ color: C.textDim, fontSize: 12, textTransform: "uppercase" }}>Resistance developed</span>
              <span style={{ fontFamily: "monospace", color: resistance > 50 ? C.vermilion : C.text, fontSize: 13 }}>{Math.round(resistance)}%</span>
            </div>
            <div style={{ height: 6, background: C.panelAlt, borderRadius: 4, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${resistance}%`, background: resistance > 50 ? C.vermilion : C.teal, transition: "width .3s" }} />
            </div>
          </Panel>

          <Panel title="Time Compression" right={<Clock size={15} color={C.amber} />}>
            <Segmented options={[{ value: "realtime", label: "Real-time (hrs)" }, { value: "fastforward", label: "Fast-forward (yrs)" }]} value={timeScale} onChange={setTimeScale} accent={C.amber} />
            <Slider icon={Activity} label="Time Steps" value={steps} setValue={setSteps} min={5} max={100} step={5} unit={` ${timeUnit}`} accent={C.textDim} />
          </Panel>

          <button onClick={runSimulation} disabled={running} style={{
            width: "100%", background: C.teal, color: "#04211E", border: "none", borderRadius: 10, padding: "13px 0",
            fontWeight: 600, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            cursor: "pointer", opacity: running ? 0.6 : 1, letterSpacing: 0.3, marginBottom: 18
          }}>
            <Play size={16} /> {running ? "Running…" : "Run Simulation"}
          </button>

        </div>

        {/* ================= CENTER: live view, chart, timeline, before/after ================= */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <Panel title="Cell Health Dashboard">
            <CellSVG health={last?.health ?? 100} atp={last?.atp ?? 80} status={finalStatus === "Not run" ? "Healthy" : finalStatus} />
            <div style={{ display: "flex", justifyContent: "center", gap: 22, marginTop: 10, flexWrap: "wrap" }}>
              <Metric label="ATP" value={last?.atp ?? "—"} unit="%" color={C.amber} icon={Zap} />
              <Metric label="Health" value={last?.health ?? "—"} unit="%" color={C.teal} icon={Activity} />
              <Metric label="Mutation" value={last?.mutation ?? 0} unit="%" color={C.magenta} icon={ShieldAlert} />
              <Metric label="ROS" value={last?.ros ?? 0} unit="%" color={C.ros} icon={Atom} />
              {virus && <Metric label="Infection" value={last?.infection ?? 0} unit="%" color={C.vermilion} icon={Bug} />}
            </div>
          </Panel>

          <Panel title="Charts & Graphs">
            {data.length ? (
              <>
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={data} margin={{ top: 4, right: 12, left: -18, bottom: 0 }}>
                    <CartesianGrid stroke={C.line} strokeDasharray="3 3" />
                    <XAxis dataKey="t" stroke={C.textDim} fontSize={11} tickLine={false} label={{ value: timeUnit, position: "insideBottom", offset: -2, fill: C.textDim, fontSize: 10 }} />
                    <YAxis stroke={C.textDim} fontSize={11} tickLine={false} domain={[0, 100]} label={{ value: "%", angle: -90, position: "insideLeft", fill: C.textDim, fontSize: 10 }} />
                    <Tooltip formatter={tooltipFormatter} labelFormatter={(t) => `${timeUnit.slice(0, -1)} ${t}`} contentStyle={{ background: C.panelAlt, border: `1px solid ${C.line}`, borderRadius: 8, fontSize: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <ReferenceLine y={35} stroke={C.vermilion} strokeDasharray="4 4" opacity={0.5} />
                    <Line type="monotone" dataKey="atp" name="ATP" stroke={C.amber} dot={false} strokeWidth={2} />
                    <Line type="monotone" dataKey="health" name="Health" stroke={C.teal} dot={false} strokeWidth={2} />
                    <Line type="monotone" dataKey="mutation" name="Mutation" stroke={C.magenta} dot={false} strokeWidth={2} />
                    <Line type="monotone" dataKey="ros" name="ROS" stroke={C.ros} dot={false} strokeWidth={2} />
                    {virus && <Line type="monotone" dataKey="infection" name="Infection" stroke={C.vermilion} dot={false} strokeWidth={2} />}
                  </LineChart>
                </ResponsiveContainer>
                <ChartLegendNote rows={[
                  { label: "ATP (amber)", color: C.amber, desc: "energy currency — falls under stress" },
                  { label: "Health (teal)", color: C.teal, desc: "overall viability — 0% means dead" },
                  { label: "Mutation (magenta)", color: C.magenta, desc: "accumulated DNA damage" },
                  { label: "ROS (blue)", color: C.ros, desc: "oxidative stress" },
                  ...(virus ? [{ label: "Infection (red)", color: C.vermilion, desc: "viral load" }] : []),
                  { label: "Dashed red line", color: C.vermilion, desc: "critical health threshold (35%)" },
                ]} />
              </>
            ) : <EmptyState text="Set your parameters and run the simulation to see cell behavior over time." />}
          </Panel>

          <Panel title="Comparative Analysis" right={<GitCompare size={15} color={C.teal} />} grow>
            {!baseline ? (
              <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <EmptyState text="Run a simulation, then use “Save as Baseline” in the report — then run another to compare them here." />
              </div>
            ) : !data.length ? (
              <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <EmptyState text={`Baseline saved (${baseline.projectName}). Run a new simulation to compare against it.`} />
              </div>
            ) : (
              <>
                <div style={{ fontSize: 11.5, color: C.textDim, marginBottom: 10 }}>
                  <strong style={{ color: C.text }}>{baseline.projectName}</strong> (baseline, dashed) vs <strong style={{ color: C.text }}>{projectName}</strong> (current, solid)
                </div>
                <div style={{ flex: 1, minHeight: 190 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={comparisonData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                      <CartesianGrid stroke={C.line} strokeDasharray="3 3" />
                      <XAxis dataKey="t" stroke={C.textDim} fontSize={10} tickLine={false} />
                      <YAxis stroke={C.textDim} fontSize={10} tickLine={false} domain={[0, 100]} />
                      <Tooltip formatter={tooltipFormatter} contentStyle={{ background: C.panelAlt, border: `1px solid ${C.line}`, borderRadius: 8, fontSize: 11 }} />
                      <Line type="monotone" dataKey="baseHealth" name="baseHealth" stroke={C.teal} strokeDasharray="4 3" dot={false} strokeWidth={1.5} />
                      <Line type="monotone" dataKey="curHealth" name="curHealth" stroke={C.teal} dot={false} strokeWidth={2} />
                      <Line type="monotone" dataKey="baseAtp" name="baseAtp" stroke={C.amber} strokeDasharray="4 3" dot={false} strokeWidth={1.5} />
                      <Line type="monotone" dataKey="curAtp" name="curAtp" stroke={C.amber} dot={false} strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                {comparisonDelta && (
                  <div style={{ fontSize: 13, lineHeight: 1.9, color: C.textDim, marginTop: 8, paddingTop: 10, borderTop: `1px solid ${C.line}` }}>
                    <ReportRow label="Min health Δ" value={`${comparisonDelta.healthDelta > 0 ? "+" : ""}${comparisonDelta.healthDelta}%`} color={comparisonDelta.healthDelta >= 0 ? C.teal : C.vermilion} />
                    <ReportRow label="Avg ATP Δ" value={`${comparisonDelta.atpDelta > 0 ? "+" : ""}${comparisonDelta.atpDelta}%`} color={comparisonDelta.atpDelta >= 0 ? C.teal : C.vermilion} />
                    <ReportRow label="Ticks survived Δ" value={comparisonDelta.ticksDelta > 0 ? `+${comparisonDelta.ticksDelta}` : comparisonDelta.ticksDelta} />
                    <ReportRow label="Outcome changed" value={comparisonDelta.statusChanged ? "Yes" : "No"} color={comparisonDelta.statusChanged ? C.amber : C.textDim} />
                  </div>
                )}
                <button onClick={() => setBaseline(null)} style={{
                  marginTop: 10, width: "100%", background: "transparent", color: C.textDim, border: `1px solid ${C.line}`,
                  borderRadius: 8, padding: "8px 0", display: "flex", alignItems: "center", justifyContent: "center",
                  gap: 6, fontSize: 11.5, cursor: "pointer"
                }}>
                  <RotateCcw size={12} /> Clear baseline
                </button>
              </>
            )}
          </Panel>
        </div>

        {/* ================= RIGHT: cost, timeline, before/after, report, AI ================= */}
        <div>
          <Panel title="Lab Report">
            {summary ? (
              <div style={{ fontSize: 13, lineHeight: 1.9, color: C.textDim }}>
                <ReportRow label="Experiment" value={projectName} />
                <ReportRow label="Cell type" value={CELL_TYPES[cellType].label} color={cellType === "cancerous" ? C.magenta : C.teal} />
                <ReportRow label="Age profile" value={AGE_PROFILES[age].label} />
                <ReportRow label={`${timeUnit} run`} value={summary.ticks} />
                <ReportRow label="Final status" value={finalStatus} color={statusColor(finalStatus)} />
                <ReportRow label="Min health reached" value={`${summary.minHealth}%`} />
                <ReportRow label="Avg ATP" value={`${summary.avgAtp}%`} />
                <ReportRow label="Drug resistance" value={`${Math.round(resistance)}%`} />
                <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${C.line}` }}>
                  <div style={{ color: C.textDim, fontSize: 11.5, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 6 }}>Interpretation</div>
                  <p style={{ margin: 0, color: C.text }}>{interpret(summary, virus, radiation, p53KO, cellType)}</p>
                </div>
                <button onClick={() => exportCSV(data, projectName)} style={{
                  marginTop: 16, width: "100%", background: "transparent", color: C.teal, border: `1px solid ${C.tealDim}`,
                  borderRadius: 8, padding: "9px 0", display: "flex", alignItems: "center", justifyContent: "center",
                  gap: 6, fontSize: 12.5, cursor: "pointer"
                }}>
                  <Download size={14} /> Export CSV
                </button>
                <button onClick={saveBaseline} style={{
                  marginTop: 8, width: "100%", background: "transparent", color: C.violet, border: `1px solid ${C.violet}66`,
                  borderRadius: 8, padding: "9px 0", display: "flex", alignItems: "center", justifyContent: "center",
                  gap: 6, fontSize: 12.5, cursor: "pointer"
                }}>
                  <Save size={14} /> Save as Baseline
                </button>
                <button style={{
                  marginTop: 8, width: "100%", background: "transparent", color: C.textDim, border: `1px solid ${C.line}`,
                  borderRadius: 8, padding: "9px 0", display: "flex", alignItems: "center", justifyContent: "center",
                  gap: 6, fontSize: 12.5, cursor: "pointer"
                }}>
                  <FileDown size={14} /> Export PDF (coming soon)
                </button>
              </div>
            ) : <EmptyState text="Report generates automatically after a simulation run." />}
          </Panel>

          <Panel title="AI Insights Panel" right={<Sparkles size={15} color={C.violet} />}>
            {aiText && <p style={{ margin: "0 0 10px", color: C.text, fontSize: 13, lineHeight: 1.6, background: C.panelAlt, padding: 12, borderRadius: 10, border: `1px solid ${C.line}` }}>{aiText}</p>}
            {aiError && <p style={{ color: C.vermilion, fontSize: 12.5, marginBottom: 10 }}>{aiError}</p>}
            <button onClick={askAI} disabled={aiLoading || !summary} style={{
              width: "100%", background: "transparent", color: C.violet, border: `1px solid ${C.violet}66`,
              borderRadius: 8, padding: "10px 0", display: "flex", alignItems: "center", justifyContent: "center",
              gap: 7, fontSize: 12.5, cursor: "pointer", opacity: (aiLoading || !summary) ? 0.5 : 1
            }}>
              {aiLoading ? <Loader2 size={14} className="spin" /> : <Sparkles size={14} />}
              {aiLoading ? "Analyzing…" : "Explain what happened"}
            </button>
            {!summary && <div style={{ fontSize: 11, color: C.textDim, marginTop: 8, textAlign: "center" }}>Run a simulation first</div>}
          </Panel>

          <Panel title="Cost & Viability Tracker" right={<DollarSign size={15} color={C.amber} />}>
            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ flex: 1, textAlign: "center" }}>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 19, color: C.amber, fontWeight: 700 }}>${costSaved.toLocaleString()}</div>
                <div style={{ fontSize: 9.5, color: C.textDim, textTransform: "uppercase" }}>saved vs wet-lab</div>
              </div>
              <div style={{ flex: 1, textAlign: "center" }}>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 19, color: C.teal, fontWeight: 700 }}>{timeSaved.toFixed(1)}d</div>
                <div style={{ fontSize: 9.5, color: C.textDim, textTransform: "uppercase" }}>time saved</div>
              </div>
              <div style={{ flex: 1, textAlign: "center" }}>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 19, color: C.text, fontWeight: 700 }}>{runsCount}</div>
                <div style={{ fontSize: 9.5, color: C.textDim, textTransform: "uppercase" }}>runs</div>
              </div>
            </div>
          </Panel>

          <Panel title="Biological Timeline & Replay" right={<History size={15} color={C.ros} />}>
            {data.length ? (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <CellSVG health={replayPoint?.health ?? 100} atp={replayPoint?.atp ?? 80} status={replayPoint?.status ?? "Healthy"} size={100} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, color: C.textDim, marginBottom: 4 }}>
                      {timeUnit.slice(0, -1)} <strong style={{ color: C.text }}>{replayIndex}</strong> / {data.length - 1} — <span style={{ color: statusColor(replayPoint?.status) }}>{replayPoint?.status}</span>
                    </div>
                    <div style={{ display: "flex", gap: 12, fontSize: 11, color: C.textDim, fontFamily: "'JetBrains Mono', monospace", flexWrap: "wrap" }}>
                      <span style={{ color: C.amber }}>ATP {replayPoint?.atp}%</span>
                      <span style={{ color: C.teal }}>HP {replayPoint?.health}%</span>
                      <span style={{ color: C.ros }}>ROS {replayPoint?.ros}%</span>
                    </div>
                  </div>
                </div>
                <input type="range" min={0} max={data.length - 1} step={1} value={replayIndex}
                  onChange={(e) => { setReplaying(false); setReplayIndex(parseInt(e.target.value)); }}
                  style={{ width: "100%", accentColor: C.ros, height: 4, cursor: "pointer", margin: "14px 0 8px" }} />
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => { setReplayIndex(0); setReplaying(true); }} style={{
                    flex: 1, background: C.ros, color: "#04211E", border: "none", borderRadius: 8, padding: "9px 0",
                    fontWeight: 600, fontSize: 12.5, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, cursor: "pointer"
                  }}>
                    {replaying ? <Pause size={13} /> : <Play size={13} />} {replaying ? "Playing…" : "Replay"}
                  </button>
                  <button onClick={() => setReplaying((r) => !r)} style={{
                    background: "transparent", color: C.textDim, border: `1px solid ${C.line}`, borderRadius: 8, padding: "9px 12px", cursor: "pointer"
                  }}>
                    {replaying ? <Pause size={14} /> : <Play size={14} />}
                  </button>
                  <button onClick={() => { setReplaying(false); setReplayIndex(0); }} style={{
                    background: "transparent", color: C.textDim, border: `1px solid ${C.line}`, borderRadius: 8, padding: "9px 12px", cursor: "pointer"
                  }}>
                    <RotateCcw size={14} />
                  </button>
                </div>
              </>
            ) : <EmptyState text="Run a simulation to scrub through and replay each step of the cell's timeline." />}
          </Panel>

          <Panel title="Before & After Comparison" right={<ArrowLeftRight size={15} color={C.teal} />}>
            {data.length ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-around" }}>
                <div style={{ textAlign: "center" }}>
                  <CellSVG health={data[0].health} atp={data[0].atp} status={data[0].status} size={110} />
                  <div style={{ fontSize: 11, color: C.textDim, marginTop: 6 }}>Before ({timeUnit.slice(0, -1)} 0)</div>
                  <div style={{ fontSize: 10.5, fontFamily: "'JetBrains Mono', monospace", color: C.text, marginTop: 2 }}>ATP {data[0].atp}% · HP {data[0].health}%</div>
                </div>
                <ArrowLeftRight size={18} color={C.textDim} />
                <div style={{ textAlign: "center" }}>
                  <CellSVG health={last.health} atp={last.atp} status={last.status} size={110} />
                  <div style={{ fontSize: 11, color: C.textDim, marginTop: 6 }}>After ({timeUnit.slice(0, -1)} {data.length - 1})</div>
                  <div style={{ fontSize: 10.5, fontFamily: "'JetBrains Mono', monospace", color: C.text, marginTop: 2 }}>ATP {last.atp}% · HP {last.health}%</div>
                </div>
              </div>
            ) : <EmptyState text="Run a simulation to compare the cell's starting and ending state." />}
          </Panel>
        </div>
      </div>

      {/* ================= FULL WIDTH: Cell-to-Cell Battle — given room to breathe ================= */}
      <Panel title="Cell-to-Cell Battle" right={<Swords size={15} color={C.magenta} />}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: 28 }}>
          <div>
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 48, marginBottom: 20 }}>
              <div style={{ textAlign: "center" }}>
                <CellSVG health={lastBattle?.cancerHealth ?? 100} atp={70} status="Healthy" size={170} tint={C.magenta} />
                <div style={{ fontSize: 13, color: C.magenta, marginTop: 8, fontWeight: 600 }}>Cancer Cell</div>
              </div>
              <Swords size={26} color={C.textDim} />
              <div style={{ textAlign: "center" }}>
                <CellSVG health={lastBattle?.tcell ?? 20} atp={70} status="Healthy" size={140} tint={C.teal} />
                <div style={{ fontSize: 13, color: C.teal, marginTop: 8, fontWeight: 600 }}>T-Cell</div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
              <div style={{ flex: 1 }}>
                <Toggle icon={FlaskConical} label="Immunotherapy" sub="Blocks the cancer cell's suppressive signal to the T-cell" checked={immunotherapy} onChange={setImmunotherapy} accent={C.teal} />
              </div>
              <button onClick={runBattle} disabled={battleRunning} style={{
                background: C.magenta, color: "#210418", border: "none", borderRadius: 10, padding: "13px 22px",
                fontWeight: 600, fontSize: 14, display: "flex", alignItems: "center", gap: 8, cursor: "pointer",
                opacity: battleRunning ? 0.6 : 1, whiteSpace: "nowrap"
              }}>
                <Swords size={16} /> {battleRunning ? "Simulating…" : "Run Interaction"}
              </button>
            </div>
          </div>
          <div>
            {battleData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={battleData} margin={{ top: 4, right: 16, left: -10, bottom: 0 }}>
                    <CartesianGrid stroke={C.line} strokeDasharray="3 3" />
                    <XAxis dataKey="t" stroke={C.textDim} fontSize={11} tickLine={false} />
                    <YAxis stroke={C.textDim} fontSize={11} tickLine={false} domain={[0, 100]} />
                    <Tooltip formatter={tooltipFormatter} contentStyle={{ background: C.panelAlt, border: `1px solid ${C.line}`, borderRadius: 8, fontSize: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Line type="monotone" dataKey="cancerHealth" name="Cancer" stroke={C.magenta} dot={false} strokeWidth={2.5} />
                    <Line type="monotone" dataKey="tcell" name="T-Cell" stroke={C.teal} dot={false} strokeWidth={2.5} />
                  </LineChart>
                </ResponsiveContainer>
                <ChartLegendNote rows={[
                  { label: "Cancer (magenta)", color: C.magenta, desc: "cancer cell health — drops when the T-cell attacks it" },
                  { label: "T-Cell (teal)", color: C.teal, desc: "immune activity — rises once immunotherapy blocks suppression" },
                ]} />
              </>
            ) : <EmptyState text="Run the interaction to see whether the immune system wins — the chart will appear here." />}
          </div>
        </div>
      </Panel>
    </div>
  );
}
