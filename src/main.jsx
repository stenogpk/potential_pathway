import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  ArrowRight, BookOpen, Brain, CheckCircle2, Clock3, FileText, FlaskConical,
  Flame, LayoutDashboard, Menu, Play, RotateCcw, Target, Trophy, X, CircleHelp, BarChart3
} from "lucide-react";
import "./styles.css";
import { missions, missionProgress } from "./data/missions";
import { calculateMarks, createRevisionCard, getMissionMarking, nextRevision, questionBank } from "./data/questions";
import { getDueRevisions, revisionLoad, scheduleRevision } from "./data/revision";
import { calculateReadiness, topicAccuracy, weakestTopics } from "./data/readiness";
import { loadState, saveState } from "./lib/storage";
import { buildStudyPlan } from "./data/planner";
import { availableSourceStatuses, transitionSource } from "./data/sourceLifecycle.js";
import { sourceStats } from "./data/sourceStats.js";
import { prepareSource, createSourceRecord, sourceChunkCount } from "./data/sourceManager.js";
import { searchSources } from "./data/sourceSearch.js";

const missionIcons = { Target, FlaskConical, BookOpen };

function App() {
  const [state, setState] = useState(loadState);
  const [active, setActive] = useState(state.activeMission || "dashboard");
  const [menuOpen, setMenuOpen] = useState(false);
  const [session, setSession] = useState(null);
  const [completed, setCompleted] = useState(false);
  const [panel, setPanel] = useState(null);
  const [sources, setSources] = useState(state.sources || []);
  const [contentChunks, setContentChunks] = useState(state.contentChunks || []);
  const [courseNodes, setCourseNodes] = useState(state.courseNodes || []);
  const [questionState, setQuestionState] = useState({ index: 0, selected: null, score: 0, attempts: 0 });

  useEffect(() => {
    saveState({ ...state, activeMission: active, sources, contentChunks, courseNodes });
  }, [state, active, sources, courseNodes]);

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
          <button onClick={() => setPanel("revision")}><RotateCcw size={16}/> Review Queue</button>
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
          ? <Dashboard onStart={startSession} completed={completed} todayMinutes={todayMinutes} sessionCount={todaySessions.length} todayAttempts={todayAttempts} todayCorrect={todayCorrect} sessions={state.sessions} attempts={state.attempts} revisions={state.revisions} courseNodes={courseNodes} />
          : <Mission mission={selectedMission} onStart={startSession} sessions={state.sessions.filter((s) => s.missionId === selectedMission.id)} attempts={state.attempts} revisions={state.revisions} courseNodes={courseNodes} />}
      </main>

      {panel === "sources" && <SourcePanel sources={sources} setSources={setSources} contentChunks={contentChunks} setContentChunks={setContentChunks} onClose={() => setPanel(null)} />}
      {panel === "mcq" && <McqPanel questionState={questionState} setQuestionState={setQuestionState} setState={setState} missionId={active === "dashboard" ? "pcs" : active} onClose={() => setPanel(null)} />}
      {panel === "readiness" && <ReadinessPanel sessions={state.sessions} attempts={state.attempts} revisions={state.revisions} courseNodes={courseNodes} activeMission={active === "dashboard" ? "pcs" : active} onClose={() => setPanel(null)} />}
      {panel === "course" && <CoursePanel nodes={courseNodes} setNodes={setCourseNodes} revisions={state.revisions} sources={sources} setState={setState} onClose={() => setPanel(null)} />}
      {panel === "revision" && <RevisionPanel revisions={state.revisions} courseNodes={courseNodes} setState={setState} onClose={() => setPanel(null)} />}
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

function Dashboard({ onStart, completed, todayMinutes, sessionCount, todayAttempts, todayCorrect, sessions, attempts, revisions, courseNodes }) {
  const planner = buildStudyPlan({ missionId: "pcs", availableMinutes: 50, sessions, attempts, revisions, courseNodes });
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

    <section className="planner-card"><div><p className="eyebrow">NEXT BEST STUDY BLOCK</p><h3>50-minute adaptive plan</h3><p className="muted">The order adapts to due revision, repeated weak topics and unfinished course nodes.</p></div><div className="planner-steps">{planner.plan.map((item, index) => <div className="planner-step" key={`${item.type}-${index}`}><span>{index + 1}</span><div><b>{item.label}</b><small>{item.minutes} min · {item.type}</small></div></div>)}</div></section>

    <div className="section-heading"><div><p className="eyebrow">ACTIVE MISSIONS</p><h2>Your preparation pathways</h2></div><span className="muted">{sessionCount} session{sessionCount === 1 ? "" : "s"} today</span></div>
    <div className="mission-grid">{missions.map((m) => <MissionCard key={m.id} mission={m} onStart={onStart} progress={missionProgress(sessions, m.id, attempts, revisions, courseNodes)} />)}</div>

    <section className="stats-grid">
      <Stat icon={Clock3} label="Study today" value={`${todayMinutes} min`} note="Recorded locally" />
      <Stat icon={RotateCcw} label="Sessions today" value={sessionCount} note="Real session history" />
      <Stat icon={Trophy} label="MCQ accuracy" value={todayAttempts.length ? `${Math.round(todayCorrect / todayAttempts.length * 100)}%` : "—"} note={`${todayAttempts.length} attempts today`} />
    </section>
  </div>;
}

function MissionCard({ mission, onStart, progress }) {
  const Icon = missionIcons[mission.iconName];
  return <article className={`mission-card ${mission.color}`}>
    <div className="card-top"><div className="mission-icon"><Icon size={22} /></div><span className="status">{mission.subtitle}</span></div>
    <h3>{mission.title}</h3><p>{mission.accent}</p>
    <div className="today"><span>{mission.id === "roaro" ? "Course state" : "Progress"}</span><b>{mission.id === "roaro" ? "Not activated" : `${progress.minutes} min · ${progress.mcqAttempts} MCQs`}</b></div>
    {mission.id !== "roaro" && <button className="text-button" onClick={() => onStart(mission.defaultMinutes, mission.id)}>Start mission <ArrowRight size={16} /></button>}
  </article>;
}

function Mission({ mission, onStart, sessions, attempts, revisions, courseNodes }) {
  const Icon = missionIcons[mission.iconName];
  const minutes = Math.floor(sessions.reduce((sum, s) => sum + s.actualSeconds, 0) / 60);
  const readiness = calculateReadiness({ sessions, attempts, revisions, courseNodes, missionId: mission.id });
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
        <div className="signal"><span>MCQ accuracy</span><b>{readiness.accuracy === null ? "—" : `${readiness.accuracy}%`}</b></div>
        <div className="signal"><span>Revision due</span><b>{readiness.revisionDue}</b></div>
        <div className="signal"><span>Topics completed</span><b>{readiness.completedTopics}/{readiness.totalTopics || 0}</b></div>
        <div className="signal"><span>Attempts</span><b>{readiness.attempts}</b></div>
      </section>
    </div>
  </div>;
}

const demoQuestions = questionBank;

function SourcePanel({ sources, setSources, contentChunks, setContentChunks, onClose }) {
  const [title, setTitle] = useState("");
  const [missionId, setMissionId] = useState("pcs");
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const stats = sourceStats(sources, missionId);
  const missionSources = sources.filter((s) => s.missionId === missionId);
  const results = searchSources(contentChunks, query, { missionId, limit: 6 });

  const add = async () => {
    const source = createSourceRecord({ title, missionId, file });
    if (!source) return;
    setError("");
    setBusy(true);
    try {
      const prepared = file ? await prepareSource(source, file) : { source, chunks: [], chunkCount: 0, indexed: false };
      setSources((current) => [prepared.source, ...current]);
      if (prepared.chunks.length) {
        setContentChunks((current) => [
          ...current.filter((chunk) => chunk.sourceId !== prepared.source.id),
          ...prepared.chunks,
        ]);
      }
      setTitle("");
      setFile(null);
      const input = document.getElementById("pp-source-file");
      if (input) input.value = "";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Source ingestion failed.");
    } finally {
      setBusy(false);
    }
  };

  const move = (source, nextStatus) => setSources((current) =>
    current.map((item) => item.id === source.id ? transitionSource(item, nextStatus) : item)
  );

  return <div className="tool-overlay"><div className="tool-card readiness-card">
    <button className="close-session" onClick={onClose}><X /></button>
    <p className="eyebrow">SOURCE MANAGER</p><h2>Build the source layer</h2>
    <p className="muted">TXT/Markdown files are indexed locally after successful extraction. Other formats stay file-selected.</p>
    <div className="form-row">
      <input id="pp-source-file" type="file" accept=".pdf,.txt,.md,.doc,.docx" onChange={(e)=>setFile(e.target.files?.[0] || null)} />
      <input value={title} onChange={(e)=>setTitle(e.target.value)} placeholder="e.g. Official PGT Chemistry syllabus" />
      <select value={missionId} onChange={(e)=>setMissionId(e.target.value)}>{missions.filter(m=>m.status==="active").map(m=><option key={m.id} value={m.id}>{m.title}</option>)}</select>
      <button className="primary" disabled={busy} onClick={add}>{busy ? "Indexing…" : "Add source"}</button>
    </div>
    {error && <div className="answer bad">{error}</div>}
    <div className="readiness-grid">
      <div><span>Total</span><b>{stats.total}</b></div>
      <div><span>Pending</span><b>{stats.pending}</b></div>
      <div><span>Indexed</span><b>{stats.indexed}</b></div>
      <div><span>Chunks</span><b>{contentChunks.filter((chunk) => chunk.missionId === missionId).length}</b></div>
    </div>
    <div className="form-row">
      <input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Search indexed source text…" />
    </div>
    {query.trim() && <div className="source-list">
      <div className="eyebrow">SOURCE SEARCH · {results.length} result{results.length === 1 ? "" : "s"}</div>
      {results.length ? results.map((result) => <div className="source-item" key={result.id}><FileText size={18}/><div><b>{missionSources.find((s)=>s.id===result.sourceId)?.title || result.sourceId}</b><span>{result.locator} · score {result.score}</span><p>{result.text}</p></div></div>) : <div className="empty-state">No indexed source text matched this search.</div>}
    </div>}
    <div className="source-list">
      {missionSources.length ? missionSources.map((s) => {
        const next = availableSourceStatuses(s.status)[0];
        const chunks = sourceChunkCount(contentChunks, s.id);
        return <div className="source-item" key={s.id}>
          <FileText size={18}/><div><b>{s.title}</b><span>{s.fileName || s.type || "reference"} · {s.status} · {chunks} chunk{chunks === 1 ? "" : "s"}</span></div>
          {next && <button className="secondary" onClick={()=>move(s,next)}>→ {next}</button>}
        </div>;
      }) : <div className="empty-state">No sources added for this mission.</div>}
    </div>
  </div></div>;
}

function McqPanel({ questionState, setQuestionState, setState, missionId, onClose }) {
  const [difficulty, setDifficulty] = useState("all");
  const [topicId, setTopicId] = useState("all");
  const baseQuestions = demoQuestions.filter((item) => item.missionId === missionId);
  const topicOptions = [...new Set(baseQuestions.map((item) => item.topicId))];
  const missionQuestions = baseQuestions.filter((item) => (difficulty === "all" || item.difficulty === difficulty) && (topicId === "all" || item.topicId === topicId));
  const q = missionQuestions.length ? missionQuestions[questionState.index % missionQuestions.length] : null;
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
  if (!q) return <div className="tool-overlay"><div className="tool-card"><button className="close-session" onClick={onClose}><X /></button><p className="eyebrow">PRACTICE ENGINE</p><h2>No questions configured</h2><p className="muted">This mission needs source-backed questions before practice can begin.</p></div></div>;
  const next = () => setQuestionState((s) => ({
    ...s,
    index: (s.index + 1) % Math.max(1, missionQuestions.length),
    selected: null
  }));
  return <div className="tool-overlay"><div className="tool-card">
    <button className="close-session" onClick={onClose}><X /></button>
    <p className="eyebrow">PRACTICE ENGINE</p><h2>MCQ quick practice</h2>
    <div className="form-row mcq-filters"><select value={difficulty} onChange={(e)=>{setDifficulty(e.target.value);setQuestionState((s)=>({...s,index:0,selected:null}));}}><option value="all">All difficulty</option><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option></select><select value={topicId} onChange={(e)=>{setTopicId(e.target.value);setQuestionState((s)=>({...s,index:0,selected:null}));}}><option value="all">All topics</option>{topicOptions.map((id)=><option key={id} value={id}>{id}</option>)}</select></div>
    <div className="question-meta">Question {questionState.index + 1} / {missionQuestions.length} · Score {questionState.score}/{questionState.attempts}</div>
    <h3>{q.stem}</h3>
    <div className="options">{q.options.map((o)=><button key={o.id} className={answered ? (o.id===q.correctOptionId ? "option correct" : o.id===questionState.selected ? "option wrong" : "option") : "option"} onClick={()=>choose(o.id)}>{o.id.toUpperCase()}. {o.text}</button>)}</div>
    {answered && <div className={questionState.selected===q.correctOptionId ? "answer good" : "answer bad"}>{questionState.selected===q.correctOptionId ? q.explanation : "Not correct — review the explanation/source before moving on."}</div>}
    <button className="primary" onClick={next}>{answered ? "Next question" : "Skip for now"}</button>
  </div></div>;
}

function ReadinessPanel({ sessions, attempts, revisions, courseNodes, activeMission, onClose }) {
  const [missionId, setMissionId] = useState(activeMission);
  const readiness = calculateReadiness({ sessions, attempts, revisions, courseNodes, missionId });
  const topicRows = topicAccuracy(attempts, missionId).filter((row) => row.attempts > 0).sort((a, b) => a.accuracy - b.accuracy);
  const weakTopics = weakestTopics(attempts, missionId);
  const revision = revisionLoad(revisions);
  const mission = missions.find((m) => m.id === missionId);
  return <div className="tool-overlay"><div className="tool-card readiness-card">
    <button className="close-session" onClick={onClose}><X /></button>
    <p className="eyebrow">READINESS SNAPSHOT</p><h2>{mission?.title || "Mission"} data</h2>
    <div className="form-row">
      <select value={missionId} onChange={(e) => setMissionId(e.target.value)}>
        {missions.filter((m) => m.status === "active").map((m) => <option key={m.id} value={m.id}>{m.title}</option>)}
      </select>
    </div>
    <div className="readiness-grid">
      <div><span>Study logged</span><b>{readiness.studyMinutes} min</b></div>
      <div><span>MCQ attempts</span><b>{readiness.attempts}</b></div>
      <div><span>Accuracy</span><b>{readiness.accuracy === null ? "—" : readiness.accuracy+"%"}</b></div>
      <div><span>Revision due</span><b>{readiness.revisionDue}</b></div><div><span>Overdue &gt;24h</span><b>{revision.overdue}</b></div>
      <div><span>Topics completed</span><b>{readiness.completedTopics}/{readiness.totalTopics || 0}</b></div>
    </div>
    {weakTopics.length > 0 && <div className="source-list"><div className="eyebrow">REPEATED WEAK TOPICS</div>{weakTopics.map((row) => <div className="source-item" key={`weak-${row.topicId}`}><BarChart3 size={18}/><div><b>{row.topicId}</b><span>{row.accuracy}% accuracy · {row.attempts} attempts</span></div></div>)}</div>}
    {topicRows.length > 0 && <div className="source-list">
      <div className="eyebrow">TOPIC SIGNALS</div>
      {topicRows.slice(0, 5).map((row) => <div className="source-item" key={row.topicId}><BarChart3 size={18}/><div><b>{row.topicId}</b><span>{row.accuracy}% accuracy · {row.attempts} attempts</span></div></div>)}
    </div>}
    <p className="muted">This is an early instrument, not an exam prediction. It summarizes persisted study, practice, revision and course data.</p>
  </div></div>;
}
function RevisionPanel({ revisions, courseNodes, setState, onClose }) {
  const [index, setIndex] = useState(0);
  const due = getDueRevisions(revisions).sort((a, b) => a.dueAt - b.dueAt);
  const overdue = revisions.filter((r) => r.dueAt < Date.now() - 24 * 60 * 60 * 1000).length;
  const card = due[index];
  const topic = card ? courseNodes.find((n) => n.id === card.topicId || n.id === card.topicId)?.name : null;
  const review = (isCorrect) => {
    if (!card) return;
    const updated = scheduleRevision(card, isCorrect);
    setState((current) => ({
      ...current,
      revisions: [updated, ...current.revisions.filter((r) => r.id !== card.id)],
    }));
    setIndex((value) => Math.min(value, Math.max(0, due.length - 2)));
  };
  return <div className="tool-overlay"><div className="tool-card readiness-card">
    <button className="close-session" onClick={onClose}><X /></button>
    <p className="eyebrow">REVIEW QUEUE</p><h2>Due revision cards</h2>
    {card ? <>
      <div className="question-meta">{index + 1} / {due.length} due · {overdue} overdue · {card.missionId}</div>
      <h3>{topic || card.topicId}</h3>
      <p className="muted">Revision card due {new Date(card.dueAt).toLocaleString("en-IN")} · interval {card.intervalDays} day(s).</p>
      <div className="session-controls">
        <button className="secondary" onClick={() => review(false)}>Need another review</button>
        <button className="primary" onClick={() => review(true)}><CheckCircle2 /> I remembered it</button>
      </div>
    </> : <div className="empty-state"><CheckCircle2 size={20}/> No revision cards are due right now.</div>}
    <p className="muted">Correct reviews advance the interval through the PP revision schedule; incorrect reviews return to a 1-day interval.</p>
  </div></div>
}

function CoursePanel({ nodes, setNodes, revisions, sources, setState, onClose }) {
  const [missionId, setMissionId] = useState("pcs");
  const [kind, setKind] = useState("subject");
  const [parentId, setParentId] = useState("");
  const [name, setName] = useState("");
  const [status, setStatus] = useState("not-started");
  const [sourceId, setSourceId] = useState("");
  const missionNodes = nodes.filter((n) => n.missionId === missionId);
  const subjects = missionNodes.filter((n) => n.kind === "subject");
  const topics = missionNodes.filter((n) => n.kind === "topic");
  const add = () => {
    const clean = name.trim();
    if (!clean || (kind !== "subject" && !parentId)) return;
    const node = { id: crypto.randomUUID(), missionId, kind, name: clean, parentId: kind === "subject" ? null : parentId, status, sourceRefs: sourceId ? [sourceId] : [], createdAt: Date.now() };
    setNodes((current) => [node, ...current]);
    setName("");
    setSourceId("");
  };
  const setNodeStatus = (nodeId, nextStatus) => setNodes((current) => current.map((n) => n.id === nodeId ? { ...n, status: nextStatus, updatedAt: Date.now() } : n));
  const attachSource = (nodeId, value) => setNodes((current) => current.map((n) => n.id === nodeId ? { ...n, sourceRefs: value ? [value] : [], updatedAt: Date.now() } : n));
  const due = revisions.filter((r) => r.missionId === missionId && r.dueAt <= Date.now()).length;
  const grouped = missions.filter((m) => m.status === "active").map((m) => ({ mission: m, rows: nodes.filter((n) => n.missionId === m.id) }));
  const childrenOf = (parentId) => missionNodes.filter((n) => n.parentId === parentId);
  const renderNode = (node, depth = 0) => <div className="course-tree-item" key={node.id} style={{ marginLeft: depth * 18 }}>
    <div className="course-node-row">
      <div><b>{node.kind}: {node.name}</b><span>{node.sourceRefs?.length ? `Source attached · ${sources.find((s)=>s.id===node.sourceRefs[0])?.title || node.sourceRefs[0]}` : "No source attached"}</span></div>
      <div className="node-actions"><select value={node.status} onChange={(e)=>setNodeStatus(node.id,e.target.value)}><option value="not-started">Not started</option><option value="learning">Learning</option><option value="revision-ready">Revision ready</option><option value="completed">Completed</option></select><select value={node.sourceRefs?.[0] || ""} onChange={(e)=>attachSource(node.id,e.target.value)}><option value="">No source</option>{sources.filter((s)=>s.missionId===missionId).map((s)=><option key={s.id} value={s.id}>{s.title}</option>)}</select></div>
    </div>
    {childrenOf(node.id).map((child) => renderNode(child, depth + 1))}
  </div>;
  return <div className="tool-overlay"><div className="tool-card readiness-card">
    <button className="close-session" onClick={onClose}><X /></button>
    <p className="eyebrow">COURSE + REVISION</p><h2>Course tree</h2>
    <p className="muted">Build Subject → Topic → Subtopic and connect each node to its source.</p>
    <div className="form-row">
      <select value={missionId} onChange={(e)=>{setMissionId(e.target.value);setParentId("");}}>
        {missions.filter(m=>m.status==="active").map(m=><option key={m.id} value={m.id}>{m.title}</option>)}
      </select>
      <select value={kind} onChange={(e)=>{setKind(e.target.value);setParentId("");}}>
        <option value="subject">Subject</option><option value="topic">Topic</option><option value="subtopic">Subtopic</option>
      </select>
      {kind === "topic" && <select value={parentId} onChange={(e)=>setParentId(e.target.value)}><option value="">Select subject</option>{subjects.map((n)=><option key={n.id} value={n.id}>{n.name}</option>)}</select>}
      {kind === "subtopic" && <select value={parentId} onChange={(e)=>setParentId(e.target.value)}><option value="">Select topic</option>{topics.map((n)=><option key={n.id} value={n.id}>{n.name}</option>)}</select>}
      <input value={name} onChange={(e)=>setName(e.target.value)} placeholder="Enter course node name" />
      <select value={status} onChange={(e)=>setStatus(e.target.value)}><option value="not-started">Not started</option><option value="learning">Learning</option><option value="revision-ready">Revision ready</option><option value="completed">Completed</option></select>
      <select value={sourceId} onChange={(e)=>setSourceId(e.target.value)}><option value="">No source attached</option>{sources.filter((s)=>s.missionId===missionId).map((s)=><option key={s.id} value={s.id}>{s.title}</option>)}</select>
      <button className="primary" onClick={add}>Add</button>
    </div>
    <div className="readiness-grid"><div><span>Course nodes</span><b>{missionNodes.length}</b></div><div><span>Revision cards</span><b>{revisions.filter((r)=>r.missionId===missionId).length}</b></div><div><span>Due now</span><b>{due}</b></div></div>
    <div className="course-tree-list">{missionNodes.length ? missionNodes.filter((n)=>!n.parentId).map((n)=>renderNode(n)) : <div className="empty-state">No nodes configured yet.</div>}</div>
    <div className="source-list">{grouped.map(({mission,rows})=><div className="source-item" key={mission.id}><BookOpen size={18}/><div><b>{mission.title}</b><span>{rows.length ? rows.map((n)=>`${n.kind}: ${n.name} · ${n.status}`).join(" · ") : "No nodes configured yet"}</span></div></div>)}</div>
  </div></div>;
}