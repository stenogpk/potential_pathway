const STORAGE_KEY = "pp-study-state-v3";

export const initialState = {
  sessions: [],
  sources: [],
  attempts: [],
  activeMission: "dashboard",
  version: 3,
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
    };
  } catch {
    return initialState;
  }
}

export function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    ...state,
    version: 3,
  }));
}

export function clearLocalStudyData() {
  localStorage.removeItem(STORAGE_KEY);
}
