import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  ArrowRight, BookOpen, Brain, CheckCircle2, Clock3, FileText, FlaskConical,
  Flame, LayoutDashboard, Menu, Play, RotateCcw, Target, Trophy, X, CircleHelp, BarChart3
} from "lucide-react";
import "./styles.css";
import { missions } from "./data/missions";
import { calculateMarks, createRevisionCard, getMissionMarking, nextRevision, questionBank } from "./data/questions";\nimport { getDueRevisions, revisionSummary } from "./data/revision";\nimport { calculateReadiness } from "./data/readiness";
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
  const [courseNodes, setCourseNodes] = useState(state.courseNodes || []);
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
  const todayAttempts = state.attempts.filter((a) => new Date(a.attemptedAt).toDateString() === new Date().toDateString());
  const todayCorrect = todayAttempts.filter((a) => a.isCorrect).length;

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
          <button onClick={() => setPanel("course")}><BookOpen size={16}/> Course & Revision</button>
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
      {panel === "mcq" && <McqPanel questionState={questionState} setQuestionState={setQuestionState} setState={setState} onClose={() => setPanel(null)} />}
      {panel === "readiness" && <ReadinessPanel sessions={state.sessions} attempts={state.attempts} onClose={() => setPanel(null)} />}
      {panel === "course" && <CoursePanel nodes={courseNodes} setNodes={setCourseNodes} revisions={state.revisions} setState={setState} onClose={() => setPanel(null)} />}
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
      <Stat icon={Trophy} label="MCQ accuracy" value={todayAttempts.length ? `${Math.round(todayCorrect / todayAttempts.length * 100)}%` : "—"} note={`${todayAttempts.length} attempts today`} />
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

const demoQuestions = questionBank;

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

function McqPanel({ questionState, setQuestionState, setState, onClose }) {
  const q = demoQuestions[questionState.index];
  const answered = questionState.selected !== null;
  const choose = (optionId) => {
    if (answered) return;
    const isCorrect = optionId === q.correctOptionId;
    const attempt = {
      id: crypto.randomUUID(),
      questionId: q.id,
      missionId: q.missionId,
      subjectId: q.subjectId,
      topicId: q.topicId,
      selectedOptionId: optionId,
      isCorrect,
      marks: calculateMarks(isCorrect, getMissionMarking(q.missionId)),
      timeSeconds: 0,
      attemptedAt: Date.now(),
    };
    setQuestionState((s) => ({
      ...s,
      selected: optionId,
      attempts: s.attempts + 1,
      score: s.score + (isCorrect ? 1 : 0),
    }));
    setState((current) => {
      const existing = (current.revisions || []).find((r) => r.missionId === q.missionId && r.topicId === q.topicId);
      const base = existing || createRevisionCard({ missionId: q.missionId, topicId: q.topicId, sourceRefs: q.sourceRefs });
      const revision = nextRevision(base, isCorrect);
      return {
        ...current,
        attempts: [attempt, ...(current.attempts || [])].slice(0, 1000),
        revisions: [revision, ...(current.revisions || []).filter((r) => r.id !== revision.id)].slice(0, 1000),
      };
    });
  };
  const next = () => setQuestionState((s) => ({
    ...s,
    index: (s.index + 1) % demoQuestions.length,
    selected: null
  }));
  return <div className="tool-overlay"><div className="tool-card">
    <button className="close-session" onClick={onClose}><X /></button>
    <p className="eyebrow">PRACTICE ENGINE</p><h2>MCQ quick practice</h2>
    <div className="question-meta">Question {questionState.index + 1} / {demoQuestions.length} · Score {questionState.score}/{questionState.attempts}</div>
    <h3>{q.stem}</h3>
    <div className="options">{q.options.map((o)=><button key={o.id} className={answered ? (o.id===q.correctOptionId ? "option correct" : o.id===questionState.selected ? "option wrong" : "option") : "option"} onClick={()=>choose(o.id)}>{o.id.toUpperCase()}. {o.text}</button>)}</div>
    {answered && <div className={questionState.selected===q.correctOptionId ? "answer good" : "answer bad"}>{questionState.selected===q.correctOptionId ? q.explanation : "Not correct — review the explanation/source before moving on."}</div>}
    <button className="primary" onClick={next}>{answered ? "Next question" : "Skip for now"}</button>
  </div></div>;
}

function ReadinessPanel({ sessions, attempts, onClose }) {
  const mins=Math.floor(sessions.reduce((a,s)=>a+(s.actualSeconds||0),0)/60);
  const total=attempts.length;
  const correct=attempts.filter((a)=>a.isCorrect).length;
  const accuracy=total ? Math.round(correct/total*100) : null;\n  const dueCount = getDueRevisions([]).length;
  return <div className="tool-overlay"><div className="tool-card readiness-card">
    <button className="close-session" onClick={onClose}><X /></button><p className="eyebrow">READINESS SNAPSHOT</p><h2>What your data says</h2>
    <div className="readiness-grid"><div><span>Study logged</span><b>{mins} min</b></div><div><span>MCQ attempts</span><b>{total}</b></div><div><span>Accuracy</span><b>{accuracy === null ? "—" : accuracy+"%"}</b></div></div>
    <p className="muted">This is an early instrument, not an exam prediction. Accuracy comes from persisted MCQ attempts.</p>
  </div></div>;
}
function CoursePanel({ nodes, setNodes, revisions, setState, onClose }) {
  const [missionId, setMissionId] = useState("pcs");
  const [kind, setKind] = useState("subject");
  const [name, setName] = useState("");
  const add = () => {
    const clean = name.trim();
    if (!clean) return;
    const parent = kind === "topic" ? nodes.find((n) => n.missionId === missionId && n.kind === "subject") : null;
    const node = {
      id: crypto.randomUUID(),
      missionId,
      kind,
      name: clean,
      parentId: parent?.id || null,
      status: "not-started",
      sourceRefs: [],
      createdAt: Date.now(),
    };
    setNodes((current) => [node, ...current]);
    setName("");
  };
  const due = revisions.filter((r) => r.dueAt <= Date.now()).length;
  const grouped = missions.filter((m) => m.status === "active").map((m) => ({
    mission: m,
    rows: nodes.filter((n) => n.missionId === m.id),
  }));
  return <div className="tool-overlay"><div className="tool-card readiness-card">
    <button className="close-session" onClick={onClose}><X /></button>
    <p className="eyebrow">COURSE + REVISION</p><h2>Build the course tree</h2>
    <p className="muted">Create only source-backed structure. Content and syllabus details will be added when authoritative material is supplied.</p>
    <div className="form-row">
      <select value={missionId} onChange={(e)=>setMissionId(e.target.value)}>{missions.filter(m=>m.status==="active").map(m=><option key={m.id} value={m.id}>{m.title}</option>)}</select>
      <select value={kind} onChange={(e)=>setKind(e.target.value)}><option value="subject">Subject</option><option value="topic">Topic</option><option value="subtopic">Subtopic</option></select>
      <input value={name} onChange={(e)=>setName(e.target.value)} placeholder="Enter course node name" />
      <button className="primary" onClick={add}>Add</button>
    </div>
    <div className="readiness-grid"><div><span>Course nodes</span><b>{nodes.length}</b></div><div><span>Revision cards</span><b>{revisions.length}</b></div><div><span>Due now</span><b>{due}</b></div></div>
    <div className="source-list">{grouped.map(({mission,rows})=><div className="source-item" key={mission.id}><BookOpen size={18}/><div><b>{mission.title}</b><span>{rows.length ? rows.map((n)=>n.name).join(" · ") : "No nodes configured yet"}</span></div></div>)}</div>
  </div></div>;
}


