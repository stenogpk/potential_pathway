import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  ArrowRight, BookOpen, Brain, CheckCircle2, Clock3, FileText, FlaskConical,
  Flame, LayoutDashboard, Menu, Play, RotateCcw, Target, Trophy, X, CircleHelp, BarChart3
} from "lucide-react";
import "./styles.css";
import { missions } from "./data/missions";
import { loadState, saveState } from "./lib/storage";

const missionIcons = { Target, FlaskConical, BookOpen };

function App() {
  const [state, setState] = useState(loadState);
  const [active, setActive] = useState(state.activeMission || "dashboard");
  const [menuOpen, setMenuOpen] = useState(false);
  const [session, setSession] = useState(null);
  const [completed, setCompleted] = useState(false);
  const [panel, setPanel] = useState(null);
  const [sources, setSources] = useState(state.sources || []);
  const [questionState, setQuestionState] = useState({ index: 0, selected: null, score: 0, attempts: 0 });

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
        if (current.remainingSeconds <= 1) return { ...current, remainingSeconds: 0 };
        return { ...current, remainingSeconds: current.remainingSeconds - 1 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [session?.paused]);

  useEffect(() => {
    if (!session || session.remainingSeconds !== 0) return;
    completeSession(session);
    setSession(null);
  }, [session?.remainingSeconds]);

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
            const Icon = missionIcons[m.iconName];
            return <button key={m.id} className={active === m.id ? "nav-item active" : "nav-item"} onClick={() => setActiveMission(m.id)}><Icon size={19} /> {m.title}</button>;
          })}
        </nav>
        <div className="sidebar-note"><Brain size={18} /><div><b>AI Pathway</b><span>Source-grounded planning will connect here.</span></div></div>
        <div className="quick-tools">
          <button onClick={() => setPanel("sources")}><FileText size={16}/> Sources</button>
          <button onClick={() => setPanel("mcq")}><CircleHelp size={16}/> Practice MCQs</button>
          <button onClick={() => setPanel("readiness")}><BarChart3 size={16}/> Readiness</button>
        </div>
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

      {panel === "sources" && <SourcePanel sources={sources} setSources={setSources} onClose={() => setPanel(null)} />}
      {panel === "mcq" && <McqPanel questionState={questionState} setQuestionState={setQuestionState} onClose={() => setPanel(null)} />}
      {panel === "readiness" && <ReadinessPanel sessions={state.sessions} questionState={questionState} onClose={() => setPanel(null)} />}
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
  const Icon = missionIcons[mission.iconName];
  return <article className={`mission-card ${mission.color}`}>
    <div className="card-top"><div className="mission-icon"><Icon size={22} /></div><span className="status">{mission.subtitle}</span></div>
    <h3>{mission.title}</h3><p>{mission.accent}</p>
    <div className="today"><span>Course state</span><b>{mission.id === "roaro" ? "Not activated" : "Source setup pending"}</b></div>
    {mission.id !== "roaro" && <button className="text-button" onClick={() => onStart(mission.defaultMinutes, mission.id)}>Start mission <ArrowRight size={16} /></button>}
  </article>;
}

function Mission({ mission, onStart, sessions }) {
  const Icon = missionIcons[mission.iconName];
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

const demoQuestions = [
  { id: "pp-demo-1", stem: "Practice engine is ready. Which cycle is the PP readiness loop built around?", options: ["Learn → Practice → Revise → Analyse → Retain", "Read → Memorise → Stop", "Only MCQs", "Only video lectures"], correct: 0 },
  { id: "pp-demo-2", stem: "Where should detailed mission content come from?", options: ["Random web summaries", "Source-grounded official/reference material", "Unverified notes only", "Generated content without sources"], correct: 1 },
];

function SourcePanel({ sources, setSources, onClose }) {
  const [title, setTitle] = useState("");
  const [missionId, setMissionId] = useState("pcs");
  const add = () => {
    const clean = title.trim();
    if (!clean) return;
    setSources((current) => [{ id: crypto.randomUUID(), title: clean, missionId, status: "pending", addedAt: Date.now() }, ...current]);
    setTitle("");
  };
  return <div className="tool-overlay"><div className="tool-card">
    <button className="close-session" onClick={onClose}><X /></button>
    <p className="eyebrow">SOURCE MANAGER</p><h2>Build the source layer</h2>
    <p className="muted">Add the official PDF/reference name now. Actual file ingestion will be connected next.</p>
    <div className="form-row"><input value={title} onChange={(e)=>setTitle(e.target.value)} placeholder="e.g. Official PGT Chemistry syllabus" />
    <select value={missionId} onChange={(e)=>setMissionId(e.target.value)}>{missions.filter(m=>m.status==="active").map(m=><option key={m.id} value={m.id}>{m.title}</option>)}</select>
    <button className="primary" onClick={add}>Add source</button></div>
    <div className="source-list">{sources.length ? sources.map(s=><div className="source-item" key={s.id}><FileText size={18}/><div><b>{s.title}</b><span>{missions.find(m=>m.id===s.missionId)?.title} · {s.status}</span></div></div>) : <div className="empty-state">No sources added yet.</div>}</div>
  </div></div>;
}

function McqPanel({ questionState, setQuestionState, onClose }) {
  const q = demoQuestions[questionState.index];
  const answered = questionState.selected !== null;
  const choose = (i) => {
    if (answered) return;
    setQuestionState((s) => ({ ...s, selected: i, attempts: s.attempts + 1, score: s.score + (i === q.correct ? 1 : 0) }));
  };
  const next = () => setQuestionState((s) => ({ ...s, index: (s.index + 1) % demoQuestions.length, selected: null }));
  return <div className="tool-overlay"><div className="tool-card">
    <button className="close-session" onClick={onClose}><X /></button>
    <p className="eyebrow">PRACTICE ENGINE</p><h2>MCQ quick practice</h2>
    <div className="question-meta">Question {questionState.index + 1} / {demoQuestions.length} · Score {questionState.score}/{questionState.attempts}</div>
    <h3>{q.stem}</h3><div className="options">{q.options.map((o,i)=><button key={o} className={answered ? (i===q.correct ? "option correct" : i===questionState.selected ? "option wrong" : "option") : "option"} onClick={()=>choose(i)}>{String.fromCharCode(65+i)}. {o}</button>)}</div>
    {answered && <div className={questionState.selected===q.correct ? "answer good" : "answer bad"}>{questionState.selected===q.correct ? "Correct — recorded for this session." : "Not correct — review the explanation/source before moving on."}</div>}
    <button className="primary" onClick={next}>{answered ? "Next question" : "Skip for now"}</button>
  </div></div>;
}

function ReadinessPanel({ sessions, questionState, onClose }) {
  const mins=Math.floor(sessions.reduce((a,s)=>a+(s.actualSeconds||0),0)/60);
  const accuracy=questionState.attempts ? Math.round(questionState.score/questionState.attempts*100) : null;
  return <div className="tool-overlay"><div className="tool-card readiness-card">
    <button className="close-session" onClick={onClose}><X /></button><p className="eyebrow">READINESS SNAPSHOT</p><h2>What your data says</h2>
    <div className="readiness-grid"><div><span>Study logged</span><b>{mins} min</b></div><div><span>MCQ attempts</span><b>{questionState.attempts}</b></div><div><span>Accuracy</span><b>{accuracy === null ? "—" : accuracy+"%"}</b></div></div>
    <p className="muted">This is an early instrument, not an exam prediction. Readiness will become topic-weighted after real question and revision data are connected.</p>
  </div></div>;
}

function Stat({ icon: Icon, label, value, note }) {
  return <div className="stat-card"><Icon size={20} /><span>{label}</span><strong>{value}</strong><small>{note}</small></div>;
}

createRoot(document.getElementById("root")).render(<App />);


if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/potential_pathway/sw.js").catch(() => {});
  });
}
