import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  ArrowRight, BookOpen, Brain, CheckCircle2, Clock3, FileText, FlaskConical,
  Flame, LayoutDashboard, Menu, Play, RotateCcw, Target, Trophy, X, CircleHelp, BarChart3, MessageCircle
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
import { buildGroundedCourseDraft } from "./data/courseGeneration.js";
import { groundedQuestionsForMission, addGroundedQuestion, validateAndAdmitGroundedQuestion } from "./data/mcqBank.js";
import { validateGroundedQuestion } from "./data/questionProvenance.js";
import { getEvidenceLabel } from "./data/evidenceModel.js";
import { buildBackupEnvelope, parseBackupFile, restoreBackupEnvelope } from "./data/backupManager.js";
import { filterPyqs, buildPyqTrend } from "./data/pyqEngine.js";
import { RETENTION_ERROR_TYPES, applyAttemptToRevision } from "./data/retentionEngine.js";
import { selectNextQuestion } from "./data/adaptiveQuestionSelector.js";
import { createExternalSourceRecord, markExternalVerification, ingestExternalEvidence } from "./data/externalResearch.js";
import { createAiDraftRequest, validateAiDraftEvidence } from "./data/aiGateway.js";

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
  const [courseContent, setCourseContent] = useState(state.courseContent || []);
  const [groundedQuestions, setGroundedQuestions] = useState(state.groundedQuestions || []);
  const [courseNodes, setCourseNodes] = useState(state.courseNodes || []);
  const [questionState, setQuestionState] = useState({ index: 0, selected: null, score: 0, attempts: 0, lastAttemptId: null });

  useEffect(() => {
    saveState({ ...state, activeMission: active, sources, contentChunks, courseContent, groundedQuestions, courseNodes });
  }, [state, active, sources, contentChunks, courseContent, groundedQuestions, courseNodes]);

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
      <div className="developer-watermark" aria-label="Developed by Shartendu">Developed by Shartendu</div>
      <aside className={`sidebar ${menuOpen ? "open" : ""}`}>
        <div className="brand">
          <div className="brand-mark">PP</div>
          <div className="developer-brand">Developed by Shartendu</div>
          <div><strong>Potential Pathway</strong><span>Exam Preparation System</span></div>
        </div>
        <nav>
          <button className={active === "dashboard" ? "nav-item active" : "nav-item"} onClick={() => setActiveMission("dashboard")}><LayoutDashboard size={19} /> Dashboard</button>
          {missions.map((m) => {
            const Icon = missionIcons[m.iconName];
            return <button key={m.id} className={active === m.id ? "nav-item active" : "nav-item"} onClick={() => setActiveMission(m.id)}><Icon size={19} /> {m.title}</button>;
          })}
        </nav>
        <div className="sidebar-note"><Brain size={18} /><div><b>AI Pathway</b><span>PDF first. Missing evidence triggers trusted external verification.</span></div></div>
        <div className="quick-tools">
          <button onClick={() => setPanel("sources")}><FileText size={16}/> Sources</button>
          <button onClick={() => setPanel("mcq")}><CircleHelp size={16}/> Practice MCQs</button>
          <button onClick={() => setPanel("authoring")}><Brain size={16}/> Question Studio</button>
          <button onClick={() => setPanel("readiness")}><BarChart3 size={16}/> Readiness</button>
          <button onClick={() => setPanel("course")}><BookOpen size={16}/> Course & Revision</button>
          <button onClick={() => setPanel("revision")}><RotateCcw size={16}/> Review Queue</button>
          <button onClick={() => setPanel("backup")}><FileText size={16}/> Backup & Restore</button>
          <button onClick={() => setPanel("research")}><Brain size={16}/> External Verification</button>
          <button onClick={() => setPanel("ai")}><Brain size={16}/> AI Draft Lab</button>
          <button onClick={() => setPanel("mock")}><Trophy size={16}/> Mock Test</button>
          <button onClick={() => setPanel("chat")}><MessageCircle size={16}/> AI Study Chat</button>
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
          ? <Dashboard onStart={startSession} completed={completed} todayMinutes={todayMinutes} sessionCount={todaySessions.length} todayAttempts={todayAttempts} todayCorrect={todayCorrect} sessions={state.sessions} attempts={state.attempts} revisions={state.revisions} courseNodes={courseNodes} contentChunks={contentChunks} groundedQuestions={groundedQuestions} sources={sources} />
          : <Mission mission={selectedMission} onStart={startSession} sessions={state.sessions.filter((s) => s.missionId === selectedMission.id)} attempts={state.attempts} revisions={state.revisions} courseNodes={courseNodes} />}
      </main>

      {panel === "sources" && <SourcePanel sources={sources} setSources={setSources} contentChunks={contentChunks} setContentChunks={setContentChunks} onClose={() => setPanel(null)} />}
      {panel === "mcq" && <McqPanel questionState={questionState} setQuestionState={setQuestionState} setState={setState} missionId={active === "dashboard" ? "pcs" : active} groundedQuestions={groundedQuestions} sources={sources} contentChunks={contentChunks} onClose={() => setPanel(null)} />}
      {panel === "authoring" && <QuestionStudio missionId={active === "dashboard" ? "pcs" : active} groundedQuestions={groundedQuestions} setGroundedQuestions={setGroundedQuestions} sources={sources} contentChunks={contentChunks} onClose={() => setPanel(null)} />}
      {panel === "readiness" && <ReadinessPanel sessions={state.sessions} attempts={state.attempts} revisions={state.revisions} courseNodes={courseNodes} groundedQuestions={groundedQuestions} activeMission={active === "dashboard" ? "pcs" : active} onClose={() => setPanel(null)} />}
      {panel === "course" && <CoursePanel nodes={courseNodes} setNodes={setCourseNodes} revisions={state.revisions} sources={sources} contentChunks={contentChunks} courseContent={courseContent} setCourseContent={setCourseContent} setState={setState} onClose={() => setPanel(null)} />}
      {panel === "revision" && <RevisionPanel revisions={state.revisions} courseNodes={courseNodes} setState={setState} onClose={() => setPanel(null)} />}
      {panel === "backup" && <BackupPanel state={{ ...state, activeMission: active, sources, contentChunks, courseContent, groundedQuestions, courseNodes }} setState={setState} setSources={setSources} setContentChunks={setContentChunks} setCourseContent={setCourseContent} setGroundedQuestions={setGroundedQuestions} setCourseNodes={setCourseNodes} onClose={() => setPanel(null)} />}
      {panel === "research" && <ExternalVerificationPanel missionId={active === "dashboard" ? "pcs" : active} requests={state.externalVerificationRequests || []} setState={setState} setSources={setSources} setContentChunks={setContentChunks} onClose={() => setPanel(null)} />}
      {panel === "ai" && <AiDraftPanel missionId={active === "dashboard" ? "pcs" : active} sources={sources} contentChunks={contentChunks} onClose={() => setPanel(null)} />}
      {panel === "mock" && <MockTestPanel missionId={active === "dashboard" ? "pcs" : active} groundedQuestions={groundedQuestions} sources={sources} contentChunks={contentChunks} onClose={() => setPanel(null)} /> }
      {panel === "chat" && <ChatPanel missionId={active === "dashboard" ? "pcs" : active} contentChunks={contentChunks} setState={setState} onClose={() => setPanel(null)} />}
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

function BackupPanel({ state, setState, setSources, setContentChunks, setCourseContent, setGroundedQuestions, setCourseNodes, onClose }) {
  const [message, setMessage] = useState("");
  const exportBackup = async () => {
    const envelope = await buildBackupEnvelope(state);
    const blob = new Blob([JSON.stringify(envelope)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `potential-pathway-backup-${new Date().toISOString().slice(0,10)}.json`; a.click();
    URL.revokeObjectURL(url);
    setMessage("Complete backup exported, including original source files.");
  };
  const importBackup = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const envelope = await parseBackupFile(file);
      if (!window.confirm("Restore this PP backup? Current study data will be replaced.")) return;
      const restored = await restoreBackupEnvelope(envelope);
      setState(restored); setSources(restored.sources || []); setContentChunks(restored.contentChunks || []);
      setCourseContent(restored.courseContent || []); setGroundedQuestions(restored.groundedQuestions || []); setCourseNodes(restored.courseNodes || []);
      setMessage("Backup restored successfully.");
    } catch (error) { setMessage(error.message || "Backup restore failed."); }
    event.target.value = "";
  };
  return <div className="tool-overlay"><div className="tool-card readiness-card">
    <button className="close-session" onClick={onClose}><X /></button>
    <p className="eyebrow">DATA SAFETY</p><h2>Backup & Restore</h2>
    <p className="muted">Protect your selection journey: progress, source evidence and original PDF/TXT/MD files are included.</p>
    <div className="form-row"><button className="primary" onClick={exportBackup}>Export complete backup</button><label className="secondary" style={{cursor:"pointer"}}>Restore backup<input type="file" accept=".json,application/json" onChange={importBackup} hidden /></label></div>
    {message && <div className="success-banner"><CheckCircle2 /> {message}</div>}
    <p className="muted">Offline backup is available now. Automatic cloud backup remains a separate provider integration.</p>
  </div></div>;
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function Dashboard({ onStart, completed, todayMinutes, sessionCount, todayAttempts, todayCorrect, sessions, attempts, revisions, courseNodes, contentChunks, groundedQuestions, sources }) {
  const [availableMinutes, setAvailableMinutes] = useState(50);
  const [customMinutes, setCustomMinutes] = useState("");
  const planner = buildStudyPlan({ missionId: "pcs", availableMinutes, sessions, attempts, revisions, courseNodes, contentChunks, groundedQuestions, sourceIds: sources.filter((s) => s.missionId === "pcs").map((s) => s.id), chunkIds: contentChunks.filter((c) => c.missionId === "pcs").map((c) => c.id) });
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

    <section className="planner-card"><div><p className="eyebrow">NEXT BEST STUDY BLOCK</p><h3>{availableMinutes}-minute adaptive plan</h3><p className="muted">Choose the time you actually have today. The order adapts to due revision, repeated weak topics and unfinished course nodes.</p><div className="session-buttons">{[10,20,30,50,60].map((m) => <button key={m} className="secondary" onClick={() => setAvailableMinutes(m)}>{m} min</button>)}<input type="number" min="5" max="180" value={customMinutes} onChange={(e)=>setCustomMinutes(e.target.value)} placeholder="Custom min" onKeyDown={(e)=>{if(e.key==="Enter" && Number(e.currentTarget.value)>=5)setAvailableMinutes(Math.min(180,Number(e.currentTarget.value)))}} /></div></div><div className="planner-steps">{planner.plan.map((item, index) => <div className="planner-step" key={`${item.type}-${index}`}><span>{index + 1}</span><div><b>{item.label}</b><small>{item.minutes} min · {item.type}</small></div></div>)}</div></section>

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

function ExternalVerificationPanel({ missionId, requests, setState, setSources, setContentChunks, onClose }) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [publisher, setPublisher] = useState("");
  const [evidence, setEvidence] = useState("");
  const [message, setMessage] = useState("");
  const pending = requests.filter((item) => item.missionId === missionId && item.status === "needs-external-verification");
  const request = pending[selectedIndex] || pending[0] || null;

  useEffect(() => {
    if (request) {
      setTitle(request.topic || "");
      setEvidence("");
      setUrl("");
      setPublisher("");
    }
  }, [request?.topic, request?.createdAt]);

  const verify = () => {
    if (!request || !url.trim() || !evidence.trim()) {
      setMessage("Topic, trusted URL and copied evidence are required.");
      return;
    }
    const source = createExternalSourceRecord({
      missionId,
      title: title || request.topic,
      url,
      publisher,
      authority: request.requiredLayer === "official" ? "official" : "trusted-external",
    });
    if (!source) {
      setMessage("URL is not accepted by the trusted-source policy.");
      return;
    }
    try {
      const verified = markExternalVerification(source, {
        verifiedBy: "user-verified-external-evidence",
        note: `Verified for ${request.topic} (${request.claimType}).`,
      });
      const ingested = ingestExternalEvidence({ source: verified, text: evidence });
      setSources((current) => [verified, ...current]);
      setContentChunks((current) => [...current, ...ingested.chunks]);
      setState((current) => ({
        ...current,
        externalVerificationRequests: (current.externalVerificationRequests || []).map((item) =>
          item === request ? { ...item, status: "verified", verifiedSourceId: verified.id, verifiedAt: Date.now() } : item
        ),
      }));
      setMessage(`Verified external evidence added: ${ingested.chunkCount} chunk(s). It is labeled as external evidence.`);
    } catch (error) {
      setMessage(error.message || "External evidence could not be ingested.");
    }
  };

  return <div className="tool-overlay"><div className="tool-card readiness-card">
    <button className="close-session" onClick={onClose}><X /></button>
    <p className="eyebrow">EVIDENCE GATE</p><h2>External Verification</h2>
    <p className="muted">When the PDF/source is insufficient, PP pauses generation. Add evidence copied from an allowed official/trusted source; PP will label and index it rather than treating model knowledge as verified.</p>
    {pending.length ? <div className="form-row">
      <select value={selectedIndex} onChange={(e)=>setSelectedIndex(Number(e.target.value))}>{pending.map((item,index)=><option key={`${item.topic}-${index}`} value={index}>{item.topic} · {item.claimType}</option>)}</select>
      <input value={title} onChange={(e)=>setTitle(e.target.value)} placeholder="Source title" />
      <input value={publisher} onChange={(e)=>setPublisher(e.target.value)} placeholder="Publisher / authority" />
      <input value={url} onChange={(e)=>setUrl(e.target.value)} placeholder="Official/trusted source URL" />
      <textarea value={evidence} onChange={(e)=>setEvidence(e.target.value)} placeholder="Paste the verified evidence text here…" rows="7" />
      <button className="primary" onClick={verify}>Verify & index evidence</button>
    </div> : <div className="empty-state">No pending external verification requests for this mission.</div>}
    {message && <div className="success-banner"><CheckCircle2 /> {message}</div>}
    <p className="muted">Important: this static PWA does not pretend to browse arbitrary websites. Verification requires actual source evidence to be supplied, then PP preserves its URL, publisher and evidence layer.</p>
  </div></div>;
}

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
    <p className="muted">PDF, TXT and Markdown are indexed locally. PDF page numbers are preserved; scanned PDFs require OCR. External evidence is always labeled.</p>
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
          <FileText size={18}/><div><b>{s.title}</b><span>{getEvidenceLabel(s)} · {s.fileName || s.type || "reference"} · {s.status} · {chunks} chunk{chunks === 1 ? "" : "s"}</span></div>
          {next && <button className="secondary" onClick={()=>move(s,next)}>→ {next}</button>}
        </div>;
      }) : <div className="empty-state">No sources added for this mission.</div>}
    </div>
  </div></div>;
}

function McqPanel({ questionState, setQuestionState, setState, missionId, groundedQuestions, sources, contentChunks, onClose }) {
  const [questionType, setQuestionType] = useState("all");
  const [errorType, setErrorType] = useState("");
  const [questionStartedAt, setQuestionStartedAt] = useState(Date.now());
  const [difficulty, setDifficulty] = useState("all");
  const [topicId, setTopicId] = useState("all");
  const sourceIds = sources.filter((source) => source.missionId === missionId).map((source) => source.id);
  const chunkIds = contentChunks.filter((chunk) => chunk.missionId === missionId).map((chunk) => chunk.id);
  const verifiedQuestions = groundedQuestionsForMission(groundedQuestions, missionId, sourceIds, chunkIds);
  const baseQuestions = verifiedQuestions;
  const isGroundedMode = verifiedQuestions.length > 0;
  const topicOptions = [...new Set(baseQuestions.map((item) => item.topicId))];
  const missionQuestions = baseQuestions.filter((item) => (questionType === "all" || item.questionType === questionType) && (difficulty === "all" || item.difficulty === difficulty) && (topicId === "all" || item.topicId === topicId));
  const q = missionQuestions.length ? selectNextQuestion(missionQuestions, { index: questionState.index, attempts: questionState.attemptHistory || [], revisions: [], now: Date.now() }) : null;
  const answered = questionState.selected !== null;
  const choose = (optionId) => {
    if (answered) return;
    const isCorrect = optionId === q.correctOptionId;
    const timeSeconds = Math.max(0, Math.round((Date.now() - questionStartedAt) / 1000));
    const attempt = {
      id: crypto.randomUUID(),
      questionId: q.id,
      missionId: q.missionId,
      subjectId: q.subjectId,
      topicId: q.topicId,
      selectedOptionId: optionId,
      isCorrect,
      marks: calculateMarks(isCorrect, getMissionMarking(q.missionId)),
      timeSeconds,
      attemptedAt: Date.now(),
      errorType: null,
    };
    setErrorType("");
    setQuestionState((s) => ({ ...s, selected: optionId, attempts: s.attempts + 1, lastAttemptId: attempt.id, score: s.score + (isCorrect ? 1 : 0) }));
    setState((current) => {
      const existing = (current.revisions || []).find((r) => r.missionId === q.missionId && r.topicId === q.topicId);
      const base = existing || createRevisionCard({ missionId: q.missionId, topicId: q.topicId, sourceRefs: q.sourceRefs });
      const revision = applyAttemptToRevision(base, { isCorrect, errorType: null });
      return { ...current, attempts: [attempt, ...(current.attempts || [])].slice(0, 1000), revisions: [revision, ...(current.revisions || []).filter((r) => r.id !== revision.id)].slice(0, 1000) };
    });
  };
  if (!q) return <div className="tool-overlay"><div className="tool-card"><button className="close-session" onClick={onClose}><X /></button><p className="eyebrow">PRACTICE ENGINE</p><h2>No questions configured</h2><p className="muted">This mission needs source-backed questions before practice can begin.</p></div></div>;
  const next = () => setQuestionState((s) => ({
    ...s,
    index: (s.index + 1) % Math.max(1, missionQuestions.length),
    selected: null,
    lastAttemptId: null,
    attemptHistory: [...(s.attemptHistory || []), q.id]
  }));
  return <div className="tool-overlay"><div className="tool-card">
    <button className="close-session" onClick={onClose}><X /></button>
    <p className="eyebrow">PRACTICE ENGINE</p><h2>MCQ quick practice</h2><p className="muted">{isGroundedMode ? "Source-grounded questions are active." : "No verified questions are loaded. Trusted external verification is required before new exam content is admitted."}</p>
    <div className="form-row mcq-filters"><select value={questionType} onChange={(e)=>{setQuestionType(e.target.value);setQuestionState((s)=>({...s,index:0,selected:null}));}}><option value="all">All types</option><option value="concept">Concept</option><option value="fact">Fact</option><option value="application">Application</option><option value="pyq">PYQ</option></select><select value={difficulty} onChange={(e)=>{setDifficulty(e.target.value);setQuestionState((s)=>({...s,index:0,selected:null}));}}><option value="all">All difficulty</option><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option></select><select value={topicId} onChange={(e)=>{setTopicId(e.target.value);setQuestionState((s)=>({...s,index:0,selected:null}));}}><option value="all">All topics</option>{topicOptions.map((id)=><option key={id} value={id}>{id}</option>)}</select></div>
    <div className="question-meta">Question {questionState.index + 1} / {missionQuestions.length} · Score {questionState.score}/{questionState.attempts} · {q.questionType?.toUpperCase() || "MCQ"} · {getEvidenceLabel(sources.find((source) => source.id === q.sourceRefs?.[0]) || {})}</div>
    {q.questionType === "pyq" && <div className="source-item"><FileText size={16}/><div><b>PYQ: {q.pyq?.exam || "Exam"} · {q.pyq?.year || "Year"} · {q.pyq?.paper || "Paper"}</b><span>Stored as a source-grounded PYQ record.</span></div></div>}
    <h3>{q.stem}</h3>
    <div className="options">{q.options.map((o)=><button key={o.id} className={answered ? (o.id===q.correctOptionId ? "option correct" : o.id===questionState.selected ? "option wrong" : "option") : "option"} onClick={()=>choose(o.id)}>{o.id.toUpperCase()}. {o.text}</button>)}</div>
    {answered && <div className={questionState.selected===q.correctOptionId ? "answer good" : "answer bad"}>{questionState.selected===q.correctOptionId ? q.explanation : "Not correct — review the explanation/source before moving on."}</div>}
    {answered && questionState.selected !== q.correctOptionId && <select value={errorType} onChange={(e)=>{
      const nextErrorType = e.target.value;
      setErrorType(nextErrorType);
      setState((current)=>{
        const latestAttempt = (current.attempts||[]).find((a)=>a.id===questionState.lastAttemptId);
        if (!latestAttempt) return current;
        const currentRevision = (current.revisions||[]).find((r)=>r.missionId===latestAttempt.missionId && r.topicId===latestAttempt.topicId);
        if (!currentRevision) return {...current, attempts:(current.attempts||[]).map((a)=>a.id===latestAttempt.id?{...a,errorType:nextErrorType}:a)};
        const revised = applyAttemptToRevision(currentRevision,{isCorrect:false,errorType:nextErrorType});
        return {...current, attempts:(current.attempts||[]).map((a)=>a.id===latestAttempt.id?{...a,errorType:nextErrorType}:a), revisions:[revised,...(current.revisions||[]).filter((r)=>r.id!==revised.id)]};
      });
    }}><option value="">Classify error…</option>{RETENTION_ERROR_TYPES.map((type)=><option key={type} value={type}>{type}</option>)}</select>}
    <button className="primary" onClick={next}>{answered ? "Next question" : "Skip for now"}</button>
  </div></div>;
}


function AiDraftPanel({ missionId, sources, contentChunks, onClose }) {
  const [topic, setTopic] = useState("");
  const [message, setMessage] = useState("");
  const chunks = contentChunks.filter((c)=>c.missionId===missionId);
  const generate = () => {
    const request = createAiDraftRequest({ missionId, topic: topic.trim(), chunks });
    const check = validateAiDraftEvidence(request, chunks);
    setMessage(check.valid ? "Grounded AI draft request is ready. Connect a server-side AI provider to execute generation; PP will only admit outputs carrying these source references." : check.reason);
  };
  return <div className="tool-overlay"><div className="tool-card readiness-card"><button className="close-session" onClick={onClose}><X /></button><p className="eyebrow">AI DRAFT LAB</p><h2>Source-grounded AI</h2><p className="muted">PP prepares the exact evidence context first. It never treats unverified model output as exam evidence.</p><input value={topic} onChange={(e)=>setTopic(e.target.value)} placeholder="Topic to generate" /><div className="readiness-grid"><div><span>Indexed chunks</span><b>{chunks.length}</b></div><div><span>Sources</span><b>{sources.filter(s=>s.missionId===missionId).length}</b></div></div><button className="primary" onClick={generate}>Prepare grounded AI draft</button>{message&&<div className="success-banner">{message}</div>}</div></div>;
}

function MockTestPanel({ missionId, groundedQuestions, sources, contentChunks, onClose }) {
  const sourceIds=sources.filter(s=>s.missionId===missionId).map(s=>s.id), chunkIds=contentChunks.filter(c=>c.missionId===missionId).map(c=>c.id);
  const questions=groundedQuestionsForMission(groundedQuestions,missionId,sourceIds,chunkIds);
  const [index,setIndex]=useState(0),[score,setScore]=useState(0),[selected,setSelected]=useState(null);
  const q=questions[index];
  const choose=(id)=>{if(selected)return;setSelected(id);if(id===q.correctOptionId)setScore(s=>s+1);};
  if(!q)return <div className="tool-overlay"><div className="tool-card"><button className="close-session" onClick={onClose}><X /></button><h2>No verified questions available</h2><p className="muted">Add source-grounded questions in Question Studio before starting a mock.</p></div></div>;
  const done=selected!==null&&index===Math.min(questions.length-1,9);
  return <div className="tool-overlay"><div className="tool-card"><button className="close-session" onClick={onClose}><X /></button><p className="eyebrow">MOCK TEST</p><h2>Source-grounded test</h2><div className="question-meta">Q {index+1} · Score {score}/{index+(selected?1:0)}</div><h3>{q.stem}</h3><div className="options">{q.options.map(o=><button key={o.id} className={selected?(o.id===q.correctOptionId?"option correct":o.id===selected?"option wrong":"option"):"option"} onClick={()=>choose(o.id)}>{o.id.toUpperCase()}. {o.text}</button>)}</div>{selected&&<div className="answer">{q.explanation}</div>} {selected&&<button className="primary" onClick={()=>{if(done){setSelected(null);setIndex(0);setScore(0);}else{setSelected(null);setIndex(i=>Math.min(i+1,questions.length-1));}}}>{done?"Restart mock":"Next"}</button>}</div></div>;
}

function QuestionStudio({ missionId, groundedQuestions, setGroundedQuestions, sources, contentChunks, onClose }) {
  const [topicId, setTopicId] = useState("");
  const [stem, setStem] = useState("");
  const [explanation, setExplanation] = useState("");
  const [questionType, setQuestionType] = useState("concept");
  const [difficulty, setDifficulty] = useState("medium");
  const [correctOptionId, setCorrectOptionId] = useState("a");
  const [options, setOptions] = useState(["a","b","c","d"].map((id)=>({id,text:""})));
  const [sourceId, setSourceId] = useState("");
  const [chunkId, setChunkId] = useState("");
  const [pyqYear, setPyqYear] = useState("");
  const [pyqExam, setPyqExam] = useState("");
  const [pyqPaper, setPyqPaper] = useState("");
  const [message, setMessage] = useState("");
  const missionSources = sources.filter((s)=>s.missionId===missionId);
  const missionChunks = contentChunks.filter((c)=>c.missionId===missionId);
  const sourceChunks = sourceId ? missionChunks.filter((c)=>c.sourceId===sourceId) : missionChunks;
  const updateOption=(id,text)=>setOptions((current)=>current.map((o)=>o.id===id?{...o,text}:o));
  const reset=()=>{setTopicId("");setStem("");setExplanation("");setQuestionType("concept");setDifficulty("medium");setCorrectOptionId("a");setOptions(["a","b","c","d"].map((id)=>({id,text:""})));setSourceId("");setChunkId("");setPyqYear("");setPyqExam("");setPyqPaper("");};
  const submit=()=>{
    const cleanStem=stem.trim(), cleanExplanation=explanation.trim();
    if(!topicId.trim()||!cleanStem||!cleanExplanation||!sourceId||!chunkId){setMessage("Topic, question, explanation, source and source chunk are required.");return;}
    const question={id:crypto.randomUUID(),missionId,topicId:topicId.trim(),stem:cleanStem,explanation:cleanExplanation,options,correctOptionId,questionType,difficulty,sourceRefs:[sourceId],sourceChunkRefs:[chunkId],...(questionType==="pyq"?{pyq:{year:Number(pyqYear),exam:pyqExam.trim(),paper:pyqPaper.trim()}}:{}),createdAt:Date.now()};
    const result=validateAndAdmitGroundedQuestion(groundedQuestions,question,missionSources.map((s)=>s.id),missionChunks.map((c)=>c.id));
    if(!result.valid){setMessage(result.reason);return;}
    setGroundedQuestions(result.questions);setMessage("Question admitted: source evidence and provenance checks passed.");reset();
  };
  return <div className="tool-overlay"><div className="tool-card readiness-card">
    <button className="close-session" onClick={onClose}><X /></button>
    <p className="eyebrow">GROUNDED QUESTION STUDIO</p><h2>Author a verified MCQ</h2>
    <p className="muted">Every question must point to an indexed source chunk. PP rejects missing evidence, missing explanation and duplicate stems.</p>
    <div className="form-row"><input value={topicId} onChange={(e)=>setTopicId(e.target.value)} placeholder="Topic ID / topic name" /><select value={questionType} onChange={(e)=>setQuestionType(e.target.value)}><option value="concept">Concept</option><option value="fact">Fact</option><option value="application">Application</option><option value="pyq">PYQ</option></select><select value={difficulty} onChange={(e)=>setDifficulty(e.target.value)}><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option></select></div>
    <textarea value={stem} onChange={(e)=>setStem(e.target.value)} placeholder="Question stem" rows="3" />
    <div className="options">{options.map((option)=><div className="form-row" key={option.id}><input value={option.text} onChange={(e)=>updateOption(option.id,e.target.value)} placeholder={"Option "+option.id.toUpperCase()} /><label><input type="radio" name="correct-option" checked={correctOptionId===option.id} onChange={()=>setCorrectOptionId(option.id)} /> Correct</label></div>)}</div>
    <textarea value={explanation} onChange={(e)=>setExplanation(e.target.value)} placeholder="Source-grounded explanation" rows="3" />
    <div className="form-row"><select value={sourceId} onChange={(e)=>{setSourceId(e.target.value);setChunkId("");}}><option value="">Select source</option>{missionSources.map((s)=><option key={s.id} value={s.id}>{s.title}</option>)}</select><select value={chunkId} onChange={(e)=>setChunkId(e.target.value)}><option value="">Select source chunk</option>{sourceChunks.map((chunk)=><option key={chunk.id} value={chunk.id}>{chunk.locator || chunk.id}</option>)}</select></div>
    {questionType==="pyq" && <div className="form-row"><input type="number" value={pyqYear} onChange={(e)=>setPyqYear(e.target.value)} placeholder="PYQ year" /><input value={pyqExam} onChange={(e)=>setPyqExam(e.target.value)} placeholder="Exam" /><input value={pyqPaper} onChange={(e)=>setPyqPaper(e.target.value)} placeholder="Paper" /></div>}
    <div className="session-controls"><button className="secondary" onClick={reset}>Clear</button><button className="primary" onClick={submit}>Validate & admit question</button></div>
    {message && <div className={message.startsWith("Question admitted")?"success-banner":"answer bad"}>{message}</div>}
  </div></div>;
}

function ReadinessPanel({ sessions, attempts, revisions, courseNodes, groundedQuestions, activeMission, onClose }) {
  const [missionId, setMissionId] = useState(activeMission);
  const readiness = calculateReadiness({ sessions, attempts, revisions, courseNodes, questions: groundedQuestions, missionId });
  const sourceIds = groundedQuestions.filter((q) => q.missionId === missionId).flatMap((q) => q.sourceRefs || []);
  const chunkIds = groundedQuestions.filter((q) => q.missionId === missionId).flatMap((q) => q.sourceChunkRefs || []);
  const pyqs = filterPyqs(groundedQuestions, { missionId }, [...new Set(sourceIds)], [...new Set(chunkIds)]);
  const pyqTrend = buildPyqTrend(pyqs, [...new Set(sourceIds)], [...new Set(chunkIds)]);
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
      <div><span>Readiness signal</span><b>{readiness.readinessScore === null ? "—" : readiness.readinessScore+"%"}</b></div>
      <div><span>Coverage</span><b>{readiness.coverage === null ? "—" : readiness.coverage+"%"}</b></div>
      <div><span>Retention</span><b>{readiness.retention === null ? "—" : readiness.retention+"%"}</b></div>
      <div><span>PYQ exposure</span><b>{readiness.pyqExposure === null ? "—" : readiness.pyqExposure+"%"}</b></div>
      <div><span>PYQs available</span><b>{pyqTrend.total}</b></div>
      <div><span>PYQ years</span><b>{pyqTrend.byYear.length}</b></div>
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
  const [errorType, setErrorType] = useState("");
  const due = getDueRevisions(revisions).sort((a, b) => a.dueAt - b.dueAt);
  const overdue = revisions.filter((r) => r.dueAt < Date.now() - 24 * 60 * 60 * 1000).length;
  const card = due[index];
  const topic = card ? courseNodes.find((n) => n.id === card.topicId || n.id === card.topicId)?.name : null;
  const review = (isCorrect) => {
    if (!card) return;
    const updated = applyAttemptToRevision(card, { isCorrect, errorType: isCorrect ? null : (errorType || "knowledge-gap") });
    setState((current) => ({
      ...current,
      revisions: [updated, ...current.revisions.filter((r) => r.id !== card.id)],
    }));
    setErrorType("");
    setIndex((value) => Math.min(value, Math.max(0, due.length - 2)));
  };
  return <div className="tool-overlay"><div className="tool-card readiness-card">
    <button className="close-session" onClick={onClose}><X /></button>
    <p className="eyebrow">REVIEW QUEUE</p><h2>Due revision cards</h2>
    {card ? <>
      <div className="question-meta">{index + 1} / {due.length} due · {overdue} overdue · {card.missionId}</div>
      <h3>{topic || card.topicId}</h3>
      <p className="muted">Revision card due {new Date(card.dueAt).toLocaleString("en-IN")} · interval {card.intervalDays} day(s).</p>
      <div className="form-row"><select value={errorType} onChange={(e)=>setErrorType(e.target.value)}><option value="">Classify error…</option>{RETENTION_ERROR_TYPES.map((type)=><option key={type} value={type}>{type}</option>)}</select></div><div className="session-controls">
        <button className="secondary" onClick={() => review(false)}>Need another review</button>
        <button className="primary" onClick={() => review(true)}><CheckCircle2 /> I remembered it</button>
      </div>
    </> : <div className="empty-state"><CheckCircle2 size={20}/> No revision cards are due right now.</div>}
    <p className="muted">Correct reviews advance the interval through the PP revision schedule; incorrect reviews return to a 1-day interval.</p>
  </div></div>
}


function ChatPanel({ missionId, contentChunks, setState, onClose }) {
  const [messages, setMessages] = useState([
    { role: "assistant", text: "मैं indexed source/PDF evidence के आधार पर मदद करूँगा। जहाँ evidence नहीं मिलेगा, मैं external verification request बनाऊँगा—अंदाज़ा नहीं लगाऊँगा।" },
  ]);
  const [query, setQuery] = useState("");

  const ask = () => {
    const clean = query.trim();
    if (!clean) return;
    const matches = searchSources(contentChunks, clean, { missionId, limit: 4 });
    if (matches.length) {
      const request = createAiDraftRequest({ missionId, topic: clean, chunks: matches });
      const validation = validateAiDraftEvidence(request, contentChunks);
      const evidence = matches.slice(0, 3).map((chunk) => {
        const source = chunk.sourceId || "indexed-source";
        const label = chunk.evidenceLayer === "official" ? "Official external source" : chunk.evidenceLayer === "trusted-external" ? "Trusted external source" : "Provided PDF / source";
        const excerpt = String(chunk.text || "").replace(/\\s+/g, " ").slice(0, 420);
        return `• [${label}] ${source} · ${chunk.locator || chunk.id}: ${excerpt}`;
      }).join("\\n");
      const reply = validation.valid
        ? `Source-grounded evidence मिला।\\n\\n${evidence}\\n\\nऊपर का text indexed evidence है; इसे final exam fact मानने से पहले source locator देखना उचित है।`
        : validation.reason;
      setMessages((current) => [...current, { role: "user", text: clean }, { role: "assistant", text: reply }]);
    } else {
      const request = {
        missionId,
        topic: clean,
        reason: "No matching indexed user-source evidence was found in the current mission.",
        claimType: "course-content",
        requiredLayer: "official",
        status: "needs-external-verification",
        createdAt: Date.now(),
      };
      setState((current) => ({
        ...current,
        externalVerificationRequests: [
          request,
          ...(current.externalVerificationRequests || []).filter(
            (item) => item.missionId !== missionId || item.topic !== clean
          ),
        ].slice(0, 100),
      }));
      setMessages((current) => [...current, { role: "user", text: clean }, {
        role: "assistant",
        text: "इस mission के indexed PDF/source में matching evidence नहीं मिला। मैंने External Verification queue में request डाल दी है। अभी कोई unverified answer नहीं बनाया गया।",
      }]);
    }
    setQuery("");
  };

  return <div className="tool-overlay"><div className="tool-card readiness-card">
    <button className="close-session" onClick={onClose}><X /></button>
    <p className="eyebrow">SOURCE-GROUNDED AI CHAT</p><h2>AI Study Chat</h2>
    <p className="muted">Mission: {missionId.toUpperCase()} · PDF/source first · external verification when evidence is missing.</p>
    <div className="source-list" style={{maxHeight: "48vh", overflowY: "auto"}}>
      {messages.map((message, index) => <div className="source-item" key={index}><MessageCircle size={18}/><div><b>{message.role === "user" ? "You" : "PP AI"}</b><span style={{whiteSpace: "pre-wrap"}}>{message.text}</span></div></div>)}
    </div>
    <div className="form-row">
      <input value={query} onChange={(e)=>setQuery(e.target.value)} onKeyDown={(e)=>{if(e.key==="Enter") ask();}} placeholder="Ask about a topic from your uploaded sources…" />
      <button className="primary" onClick={ask}>Ask</button>
    </div>
    <p className="muted">No source match = verification request, not a fabricated answer.</p>
  </div></div>;
}

function CoursePanel({ nodes, setNodes, revisions, sources, contentChunks, courseContent, setCourseContent, setState, onClose }) {
  const [missionId, setMissionId] = useState("pcs");
  const [kind, setKind] = useState("subject");
  const [parentId, setParentId] = useState("");
  const [name, setName] = useState("");
  const [status, setStatus] = useState("not-started");
  const [sourceId, setSourceId] = useState("");
  const missionNodes = nodes.filter((n) => n.missionId === missionId);
  const missionCourseContent = courseContent.filter((item) => item.missionId === missionId);
  const [groundingTopic, setGroundingTopic] = useState("");
  const [groundingMessage, setGroundingMessage] = useState("");
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
  const buildGroundedDraft = () => {
    const topic = groundingTopic.trim();
    if (!topic) return;
    const result = buildGroundedCourseDraft({ chunks: contentChunks, missionId, topic });
    if (!result.generated) {
      if (result.researchRequest) {
        setState((current) => ({
          ...current,
          externalVerificationRequests: [
            result.researchRequest,
            ...(current.externalVerificationRequests || []).filter(
              (item) => item.missionId !== missionId || item.topic !== topic
            ),
          ].slice(0, 100),
        }));
        setGroundingMessage("PDF/source evidence not found. Added a trusted-external verification request; nothing was generated yet.");
      } else {
        setGroundingMessage("No matching source evidence found. Nothing was generated.");
      }
      return;
    }
    setCourseContent((current) => [
      ...result.content,
      ...current.filter((item) => !(item.missionId === missionId && item.title === topic)),
    ]);
    setGroundingMessage(`Added ${result.content.length} source-backed evidence lesson(s).`);
  };
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
    <div className="panel" style={{ marginTop: 16 }}>
      <p className="eyebrow">SOURCE-GROUNDED COURSE BUILDER</p>
      <p className="muted">Uses indexed PDF/source evidence first. If the PDF does not contain the topic, the app creates a trusted-external verification request instead of inventing content.</p>
      <div className="form-row">
        <input value={groundingTopic} onChange={(e)=>setGroundingTopic(e.target.value)} placeholder="Enter a topic to ground from sources" />
        <button className="primary" onClick={buildGroundedDraft}>Build evidence draft</button>
      </div>
      {groundingMessage && <p className="muted">{groundingMessage}</p>}
      {missionCourseContent.length > 0 && <div className="source-list">
        {missionCourseContent.map((item) => <div className="source-item" key={item.id}>
          <FileText size={18}/><div><b>{item.title}</b><span>{item.kind} · source {item.sourceRefs.join(", ")} · {(item.evidenceLayers || ["user-source"]).join(", ")}</span><p>{item.body}</p></div>
        </div>)}
      </div>}
    </div>
    <div className="course-tree-list">{missionNodes.length ? missionNodes.filter((n)=>!n.parentId).map((n)=>renderNode(n)) : <div className="empty-state">No nodes configured yet.</div>}</div>
    <div className="source-list">{grouped.map(({mission,rows})=><div className="source-item" key={mission.id}><BookOpen size={18}/><div><b>{mission.title}</b><span>{rows.length ? rows.map((n)=>`${n.kind}: ${n.name} · ${n.status}`).join(" · ") : "No nodes configured yet"}</span></div></div>)}</div>
  </div></div>;
}

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Potential Pathway root element was not found.");
}

createRoot(rootElement).render(<App />);
