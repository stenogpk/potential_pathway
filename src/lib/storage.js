const STORAGE_KEY = "pp-study-state-v5";

export const initialState = {
  sessions: [],
  sources: [],
  attempts: [],
  revisions: [],
  courseNodes: [],
  contentChunks: [],
  activeMission: "dashboard",
  version: 4,
};

export function loadState() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!parsed || typeof parsed !== "object") return initialState;
    return {
      ...initialState,
      ...parsed,
      sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],
      sources: Array.isArray(parsed.sources) ? parsed.sources : [],
      attempts: Array.isArray(parsed.attempts) ? parsed.attempts : [],
      revisions: Array.isArray(parsed.revisions) ? parsed.revisions : [],
      courseNodes: Array.isArray(parsed.courseNodes) ? parsed.courseNodes : [],
      contentChunks: Array.isArray(parsed.contentChunks) ? parsed.contentChunks : [],
    };
  } catch {
    return initialState;
  }
}

export function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    ...state,
    version: 5,
  }));
}

export function clearLocalStudyData() {
  localStorage.removeItem(STORAGE_KEY);
}

export function upsertRevision(current, revision) {
  const rows = current.filter((item) => item.id !== revision.id);
  return [revision, ...rows];
}


export function migrateStudyState(parsed) {
  if (!parsed || typeof parsed !== "object") return initialState;
  return {
    ...initialState,
    ...parsed,
    sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],
    sources: Array.isArray(parsed.sources) ? parsed.sources : [],
    attempts: Array.isArray(parsed.attempts) ? parsed.attempts : [],
    revisions: Array.isArray(parsed.revisions) ? parsed.revisions : [],
    courseNodes: Array.isArray(parsed.courseNodes) ? parsed.courseNodes : [],
    contentChunks: Array.isArray(parsed.contentChunks) ? parsed.contentChunks : [],
  };
}
