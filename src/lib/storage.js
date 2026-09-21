const STORAGE_KEY = "pp-study-state-v4";

export const initialState = {
  sessions: [],
  sources: [],
  contentChunks: [],
  courseContent: [],
  groundedQuestions: [],
  attempts: [],
  revisions: [],
  courseNodes: [],
  externalVerificationRequests: [],
  activeMission: "dashboard",
  version: 7,
};

export function normalizeSources(sources) {
  if (!Array.isArray(sources)) return [];
  return sources
    .filter((source) => source && typeof source === "object" && source.id)
    .map((source) => ({
      ...source,
      sourceRefs: Array.isArray(source.sourceRefs) ? source.sourceRefs : [],
      status: source.status || "pending",
      fileName: source.fileName ?? null,
      fileSize: source.fileSize ?? null,
      mimeType: source.mimeType ?? null,
      url: source.url ?? null,
      publisher: source.publisher ?? null,
      verification: source.verification ?? null,
    }));
}

export function loadState() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!parsed || typeof parsed !== "object") return initialState;
    return migrateStudyState(parsed);
  } catch {
    return initialState;
  }
}

export function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    ...state,
    sources: normalizeSources(state.sources),
    contentChunks: Array.isArray(state.contentChunks) ? state.contentChunks : [],
    courseContent: Array.isArray(state.courseContent) ? state.courseContent : [],
    groundedQuestions: Array.isArray(state.groundedQuestions) ? state.groundedQuestions : [],
    externalVerificationRequests: Array.isArray(state.externalVerificationRequests) ? state.externalVerificationRequests : [],
    version: 7,
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
    sources: normalizeSources(parsed.sources),
    contentChunks: Array.isArray(parsed.contentChunks) ? parsed.contentChunks : [],
    courseContent: Array.isArray(parsed.courseContent) ? parsed.courseContent : [],
    groundedQuestions: Array.isArray(parsed.groundedQuestions) ? parsed.groundedQuestions : [],
    externalVerificationRequests: Array.isArray(parsed.externalVerificationRequests) ? parsed.externalVerificationRequests : [],
    attempts: Array.isArray(parsed.attempts) ? parsed.attempts : [],
    revisions: Array.isArray(parsed.revisions) ? parsed.revisions : [],
    courseNodes: Array.isArray(parsed.courseNodes) ? parsed.courseNodes : [],
  };
}
