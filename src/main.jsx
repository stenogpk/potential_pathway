import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  ArrowRight, BookOpen, Brain, CheckCircle2, Clock3, FlaskConical,
  Flame, LayoutDashboard, Menu, Play, RotateCcw, Target, Trophy, X
} from "lucide-react";
import "./styles.css";

const missions = [
  { id: "pcs", title: "PCS / GS", subtitle: "Primary Mission", icon: Target, color: "violet", accent: "Your main preparation pathway", defaultMinutes: 50 },
  { id: "chemistry", title: "PGT Chemistry", subtitle: "Secondary Mission", icon: FlaskConical, color: "cyan", accent: "30 min daily pathway", defaultMinutes: 30 },
  { id: "roaro", title: "RO / ARO", subtitle: "Coming Soon", icon: BookOpen, color: "amber", accent: "Separate syllabus & question bank", defaultMinutes: 50 },
];

const STORAGE_KEY = "pp-study-state-v1";
const initialState = { sessions: [], activeMission: "dashboard" };

function loadState() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || initialState;
  } catch {
    return initialState;
  }
}

function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function App() {
  const [state, setState] = useState(loadState);
  const [active, setActive] = useState(state.activeMission || "dashboard");
  const [menuOpen, setMenuOpen] = useState(false);
  const [session, setSession] = useState(null);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    saveState({ ...state, activeMission: active });
  }, [state, active]);

  const selectedMission = useMemo(
    () => missions.find((m) => m.id === active) ?? missions[0],
    [active]
  );

  const startSession = (minutes, missionId = active === "dashboard" ? "pcs" : active) => {
    setCompleted(false);
    setSession({
      missionId,
      totalSeconds: minutes * 60,
      remainingSeconds: minutes * 60,
      startedAt: Date.now(),
      paused: false,
    });
  };

  useEffect(() => {
    if (!session || session.paused) return;
    const timer = setInterval(() => {
      setSession((current) => {
        if (!current) return null;
        if (current.remainingSeconds <= 1) {
          completeSession(current);
          return null;
        }
        return { ...current, remainingSeconds: current.remainingSeconds - 1 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [session?.paused]);

  const completeSession = (finishedSession) => {
    const elapsed = Math.max(0, finishedSession.totalSeconds - finishedSession.remainingSeconds);
    if (elapsed < 10) return;
    const record = {
      id: Date.now(),
      missionId: finishedSession.missionId,
      startedAt: finishedSession.startedAt,
      endedAt: Date.now(),
      plannedMinutes: Math.round(finishedSession.totalSeconds / 60),
      actualSeconds: elapsed,
      completed: finishedSession.remainingSeconds <= 1,
    };
    setState((current) => ({ ...current, sessions: [record, ...current.sessions].slice(0, 200) }));
    setCompleted(true);
  };

  const finishSession = () => {
    if (!session) return;
    completeSession(session);
    setSession(null);
  };

  const closeSession = () => setSession(null);

  const setActiveMission = (id) => {
    setActive(id);
    setMenuOpen(false);
    setCompleted(false);
  };

  const todaySessions = state.sessions.filter((s) => new Date(s.startedAt).toDateString() === new Date().toDateString());
  const todayMinutes = Math.floor(todaySessions.reduce((sum, s) => sum + s.actualSeconds, 0) / 60);

  return (
    <div className="app-shell">
      <aside className={`sidebar ${menuOpen ? "open" : ""}`}>
        <div className="brand">
          <div className="brand-mark">PP</div>
          <div><strong>Potential Pathway</strong><span>Exam Preparation System</span></div>
        </div>
        <nav>
          <button className={active === "dashboard" ? "nav-item active" : "nav-item"} onClick={() => setActiveMission("dashboard")}><LayoutDashboard size={19} /> Dashboard</button>
          {missions.map((m) => {
            const Icon = m.icon;
            return <button key={m.id} className={active === m.id ? "nav-item active" : "nav-item"} onClick={() => setActiveMission(m.id)}><Icon size={19} /> {m.title}</button>;
          })}
        </nav>
        <div className="sidebar-note"><Brain size={18} /><div><b>AI Pathway</b><span>Source-grounded planning will connect here.</span></div></div>
      </aside>

      {menuOpen && <button className="backdrop" aria-label="Close menu" onClick={() => setMenuOpen(false)} />}

      <main className="main">
        <header className="topbar">
          <button className="icon-button mobile-only" onClick={() => setMenuOpen(true)} aria-label="Open menu"><Menu /></button>
          <div>
            <p className="eyebrow">{new Date().toLocaleDateString("en-IN", { weekday: "long", day: "2-digit", month: "long", year: "numeric" }).toUpperCase()}</p>
            <h1>{active === "dashboard" ? "Your pathway starts here." : selectedMission.title}</h1>
          </div>
          <div className="top-actions"><div className="streak"><Flame size={18} /> {state.sessions.length ? "Active" : "Start today"}</div><div className="avatar">S</div></div>
        </header>

        {active === "dashboard"
          ? <Dashboard onStart={startSession} completed={completed} todayMinutes={todayMinutes} sessionCount={todaySessions.length} />
          : <Mission mission={selectedMission} onStart={startSession} sessions={state.sessions.filter((s) => s.missionId === selectedMission.id)} />}
      </main>

      {session && (
        <div className="session-overlay">
          <div className="session-card">
            <button className="close-session" onClick={closeSession}><X /></button>
            <div className="session-icon"><Clock3 /></div>
            <p className="eyebrow">FOCUSED SESSION</p>
            <h2>{missions.find((m) => m.id === session.missionId)?.title}</h2>
            <p>{session.paused ? "Session paused." : "Stay on one task. Your time is being recorded locally."}</p>
            <div className="timer-placeholder">{formatTime(session.remainingSeconds)}</div>
            <div className="session-controls">
              <button className="secondary" onClick={() => setSession((s) => ({ ...s, paused: !s.paused }))}>{session.paused ? "Resume" : "Pause"}</button>
              <button className="primary large" onClick={finishSession}><CheckCircle2 /> Finish session</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function Dashboard({ onStart, completed, todayMinutes, sessionCount }) {
  return <div className="content">
    <section className="hero-card">
      <div>
        <span className="pill">TODAY'S PATHWAY</span>
        <h2>Build readiness, not just hours.</h2>
        <p>Learn → Practice → Revise → Analyse → Retain.</p>
        <div className="session-buttons">{[60, 50, 30, 10].map((m) => <button key={m} className="secondary" onClick={() => onStart(m, "pcs")}><Play size={15} /> {m} min</button>)}</div>
      </div>
      <div className="hero-orbit"><div className="orbit-ring ring-1" /><div className="orbit-ring ring-2" /><div className="orbit-core">PP</div></div>
    </section>

    {completed && <div className="success-banner"><CheckCircle2 /> Session recorded. Your study time is saved on this device.</div>}

    <div className="section-heading"><div><p className="eyebrow">ACTIVE MISSIONS</p><h2>Your preparation pathways</h2></div><span className="muted">{sessionCount} session{sessionCount === 1 ? "" : "s"} today</span></div>
    <div className="mission-grid">{missions.map((m) => <MissionCard key={m.id} mission={m} onStart={onStart} />)}</div>

    <section className="stats-grid">
      <Stat icon={Clock3} label="Study today" value={`${todayMinutes} min`} note="Recorded locally" />
      <Stat icon={RotateCcw} label="Sessions today" value={sessionCount} note="Real session history" />
      <Stat icon={Trophy} label="MCQ accuracy" value="—" note="Available after question engine" />
    </section>
  </div>;
}

function MissionCard({ mission, onStart }) {
  const Icon = mission.icon;
  return <article className={`mission-card ${mission.color}`}>
    <div className="card-top"><div className="mission-icon"><Icon size={22} /></div><span className="status">{mission.subtitle}</span></div>
    <h3>{mission.title}</h3><p>{mission.accent}</p>
    <div className="today"><span>Course state</span><b>{mission.id === "roaro" ? "Not activated" : "Source setup pending"}</b></div>
    {mission.id !== "roaro" && <button className="text-button" onClick={() => onStart(mission.defaultMinutes, mission.id)}>Start mission <ArrowRight size={16} /></button>}
  </article>;
}

function Mission({ mission, onStart, sessions }) {
  const Icon = mission.icon;
  const minutes = Math.floor(sessions.reduce((sum, s) => sum + s.actualSeconds, 0) / 60);
  return <div className="content">
    <section className={`mission-header ${mission.color}`}>
      <div className="mission-icon big"><Icon size={30} /></div>
      <div><span className="pill">{mission.subtitle}</span><h2>{mission.title}</h2><p>{mission.accent}</p></div>
      <div className="mission-percent">{minutes}<small> min logged</small></div>
    </section>
    <div className="two-col">
      <section className="panel">
        <p className="eyebrow">NEXT LAYER</p><h3>{mission.id === "roaro" ? "Mission not activated" : "Source → Course → Practice"}</h3>
        <p className="muted">{mission.id === "roaro" ? "This pathway stays separate until its syllabus and question bank are configured." : "The real course structure will be populated from the official/source material supplied for this mission."}</p>
        {mission.id !== "roaro" && <button className="primary" onClick={() => onStart(mission.defaultMinutes, mission.id)}><Play size={17} /> Start {mission.defaultMinutes} min session</button>}
      </section>
      <section className="panel">
        <p className="eyebrow">REAL DATA</p>
        <div className="signal"><span>Total logged</span><b>{minutes} min</b></div>
        <div className="signal"><span>Sessions</span><b>{sessions.length}</b></div>
        <div className="signal"><span>MCQ accuracy</span><b>—</b></div>
      </section>
    </div>
  </div>;
}

function Stat({ icon: Icon, label, value, note }) {
  return <div className="stat-card"><Icon size={20} /><span>{label}</span><strong>{value}</strong><small>{note}</small></div>;
}

createRoot(document.getElementById("root")).render(<App />);
