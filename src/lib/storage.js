const STORAGE_KEY = "pp-study-state-v2";

export const initialState = {
  sessions: [],\n  sources: [],
  activeMission: "dashboard",
  version: 2,
};

export function loadState() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!parsed || typeof parsed !== "object") return initialState;
    return {
      ...initialState,
      ...parsed,
      sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],\n      sources: Array.isArray(parsed.sources) ? parsed.sources : [],
    };
  } catch {
    return initialState;
  }
}

export function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    ...state,
    version: 2,
  }));
}

export function clearLocalStudyData() {
  localStorage.removeItem(STORAGE_KEY);
}
