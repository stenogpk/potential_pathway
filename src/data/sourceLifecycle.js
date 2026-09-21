import { sourceStatuses } from "./sourceModel.js";

const transitions = {
  pending: ["file-selected", "archived"],
  "file-selected": ["indexed", "archived"],
  indexed: ["active", "archived"],
  active: ["archived"],
  archived: [],
};

export function canTransitionSource(status, nextStatus) {
  return transitions[status]?.includes(nextStatus) ?? false;
}

export function transitionSource(source, nextStatus) {
  if (!canTransitionSource(source.status, nextStatus)) {
    return source;
  }
  return {
    ...source,
    status: nextStatus,
    updatedAt: Date.now(),
  };
}

export function availableSourceStatuses(status) {
  return sourceStatuses.filter((candidate) =>
    canTransitionSource(status, candidate)
  );
}

export { transitions as sourceStatusTransitions };
