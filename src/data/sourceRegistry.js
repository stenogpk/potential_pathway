import { transitionSource } from "./sourceLifecycle.js";

export function addSource(sources, source) {
  if (!source?.id) return sources;
  return [source, ...sources.filter((item) => item.id !== source.id)];
}

export function updateSource(sources, sourceId, patch) {
  return sources.map((source) =>
    source.id === sourceId ? { ...source, ...patch, updatedAt: Date.now() } : source
  );
}

export function transitionSourceById(sources, sourceId, nextStatus) {
  return sources.map((source) =>
    source.id === sourceId ? transitionSource(source, nextStatus) : source
  );
}

export function removeSource(sources, sourceId) {
  return sources.filter((source) => source.id !== sourceId);
}
