import React, { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  ArrowRight, BookOpen, Brain, CheckCircle2, Clock3, FlaskConical,
  Flame, LayoutDashboard, Menu, Play, RotateCcw, Target, Trophy, X
} from "lucide-react";
import "./styles.css";

const missions = [
  {
    id: "pcs",
    title: "PCS / GS",
    subtitle: "Primary Mission",
    icon: Target,
    color: "violet",
    progress: 42,
    today: "Polity • Fundamental Rights",
    stat: "68%",
    accent: "Your main preparation pathway",
  },
  {
    id: "chemistry",
    title: "PGT Chemistry",
    subtitle: "Secondary Mission",
    icon: FlaskConical,
    color: "cyan",
    progress: 18,
    today: "Organic Chemistry • Revision",
    stat: "74%",
    accent: "30 min daily pathway",
  },
  {
    id: "roaro",
    title: "RO / ARO",
    subtitle: "Coming Soon",
    icon: BookOpen,
    color: "amber",
    progress: 0,
    today: "Mission not activated",
    stat: "—",
    accent: "Separate syllabus & question bank",
  },
];

function App() {
  const [active, setActive] = useState("dashboard");
  const [menuOpen, setMenuOpen] = useState(false);
  const [sessionMinutes, setSessionMinutes] = useState(50);
  const [sessionRunning, setSessionRunning] = useState(false);
  const [completed, setCompleted] = useState(false);

  const selectedMission = useMemo(
    () => missions.find((m) => m.id === active) ?? missions[0],
    [active]
  );

  const startSession = (minutes) => {
    setSessionMinutes(minutes);
    setSessionRunning(true);
    setCompleted(false);
  };

  const finishSession = () => {
    setSessionRunning(false);
    setCompleted(true);
  };

  return (
    <div className="app-shell">
      <aside className={`sidebar ${menuOpen ? "open" : ""}`}>
        <div className="brand">
          <div className="brand-mark">PP</div>
          <div>
            <strong>Potential Pathway</strong>
            <span>Exam Preparation System</span>
          </div>
        </div>

        <nav>
          <button className={active === "dashboard" ? "nav-item active" : "nav-item"} onClick={() => { setActive("dashboard"); setMenuOpen(false); }}>
            <LayoutDashboard size={19} /> Dashboard
          </button>
          {missions.map((m) => {
            const Icon = m.icon;
            return (
              <button key={m.id} className={active === m.id ? "nav-item active" : "nav-item"} onClick={() => { setActive(m.id); setMenuOpen(false); }}>
                <Icon size={19} /> {m.title}
              </button>
            );
          })}
        </nav>

        <div className="sidebar-note">
          <Brain size={18} />
          <div>
            <b>AI Pathway</b>
            <span>Adaptive planning will live here.</span>
          </div>
        </div>
      </aside>

      {menuOpen && <button className="backdrop" aria-label="Close menu" onClick={() => setMenuOpen(false)} />}

      <main className="main">
        <header className="topbar">
          <button className="icon-button mobile-only" onClick={() => setMenuOpen(true)} aria-label="Open menu"><Menu /></button>
          <div>
            <p className="eyebrow">MONDAY • 21 SEPTEMBER 2026</p>
            <h1>{active === "dashboard" ? "Your pathway starts here." : selectedMission.title}</h1>
          </div>
          <div className="top-actions">
            <div className="streak"><Flame size={18} /> 7 day streak</div>
            <div className="avatar">S</div>
          </div>
        </header>

        {active === "dashboard" ? (
          <Dashboard onStart={startSession} completed={completed} />
        ) : (
          <Mission mission={selectedMission} onStart={startSession} />
        )}
      </main>

      {sessionRunning && (
        <div className="session-overlay">
          <div className="session-card">
            <button className="close-session" onClick={() => setSessionRunning(false)}><X /></button>
            <div className="session-icon"><Clock3 /></div>
            <p className="eyebrow">FOCUSED SESSION</p>
            <h2>{sessionMinutes} minutes</h2>
            <p>Stay on one task. When this session ends, PP will guide you to the next mission.</p>
            <div className="timer-placeholder">{sessionMinutes}:00</div>
            <button className="primary large" onClick={finishSession}><CheckCircle2 /> Finish session</button>
          </div>
        </div>
      )}
    </div>
  );
}

function Dashboard({ onStart, completed }) {
  return (
    <div className="content">
      <section className="hero-card">
        <div>
          <span className="pill">TODAY'S PATHWAY</span>
          <h2>Build readiness, not just hours.</h2>
          <p>Learn → Practice → Revise → Analyse → Retain.</p>
          <div className="session-buttons">
            {[60, 50, 30, 10].map((m) => <button key={m} className="secondary" onClick={() => onStart(m)}><Play size={15} /> {m} min</button>)}
          </div>
        </div>
        <div className="hero-orbit">
          <div className="orbit-ring ring-1" />
          <div className="orbit-ring ring-2" />
          <div className="orbit-core">PP</div>
        </div>
      </section>

      {completed && (
        <div className="success-banner"><CheckCircle2 /> Session complete. Your next step is ready when the study engine is connected.</div>
      )}

      <div className="section-heading">
        <div><p className="eyebrow">ACTIVE MISSIONS</p><h2>Your preparation pathways</h2></div>
        <span className="muted">3 pathways</span>
      </div>

      <div className="mission-grid">
        {missions.map((m) => <MissionCard key={m.id} mission={m} onStart={onStart} />)}
      </div>

      <section className="stats-grid">
        <Stat icon={Target} label="Readiness" value="—" note="Engine pending" />
        <Stat icon={RotateCcw} label="Revision cycle" value="0" note="Will adapt automatically" />
        <Stat icon={Trophy} label="MCQ accuracy" value="—" note="No attempts yet" />
      </section>
    </div>
  );
}

function MissionCard({ mission, onStart }) {
  const Icon = mission.icon;
  return (
    <article className={`mission-card ${mission.color}`}>
      <div className="card-top">
        <div className="mission-icon"><Icon size={22} /></div>
        <span className="status">{mission.subtitle}</span>
      </div>
      <h3>{mission.title}</h3>
      <p>{mission.accent}</p>
      <div className="progress-row"><span>Progress</span><b>{mission.progress}%</b></div>
      <div className="progress-track"><span style={{ width: `${mission.progress}%` }} /></div>
      <div className="today"><span>Next</span><b>{mission.today}</b></div>
      {mission.id !== "roaro" && <button className="text-button" onClick={() => onStart(mission.id === "chemistry" ? 30 : 50)}>Start mission <ArrowRight size={16} /></button>}
    </article>
  );
}

function Mission({ mission, onStart }) {
  const Icon = mission.icon;
  return (
    <div className="content">
      <section className={`mission-header ${mission.color}`}>
        <div className="mission-icon big"><Icon size={30} /></div>
        <div><span className="pill">{mission.subtitle}</span><h2>{mission.title}</h2><p>{mission.accent}</p></div>
        <div className="mission-percent">{mission.progress}%</div>
      </section>
      <div className="two-col">
        <section className="panel">
          <p className="eyebrow">TODAY'S TASK</p>
          <h3>{mission.today}</h3>
          <p className="muted">The source-grounded course and adaptive scheduler will populate this area after the data layer is connected.</p>
          {mission.id !== "roaro" && <button className="primary" onClick={() => onStart(mission.id === "chemistry" ? 30 : 50)}><Play size={17} /> Start {mission.id === "chemistry" ? "30" : "50"} min session</button>}
        </section>
        <section className="panel">
          <p className="eyebrow">READINESS SIGNALS</p>
          <div className="signal"><span>MCQ accuracy</span><b>{mission.stat}</b></div>
          <div className="signal"><span>Revision due</span><b>Pending</b></div>
          <div className="signal"><span>Weak areas</span><b>Pending</b></div>
        </section>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value, note }) {
  return <div className="stat-card"><Icon size={20} /><span>{label}</span><strong>{value}</strong><small>{note}</small></div>;
}

createRoot(document.getElementById("root")).render(<App />);