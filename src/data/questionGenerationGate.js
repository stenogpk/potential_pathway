import { buildSourceContext } from "./sourceContext.js";

export function buildSourceGrounding({ chunks, missionId, topic, limit = 6 }) {
  const context = buildSourceContext(chunks, topic, { missionId, limit });
  return {
    missionId,
    topic,
    context,
    grounded: context.length > 0,
    sourceIds: [...new Set(context.map((item) => item.sourceId))],
    chunkIds: [...new Set(context.map((item) => item.chunkId))],
  };
}

export function canGenerateGroundedQuestion(grounding) {
  return Boolean(
    grounding?.grounded &&
    grounding.sourceIds?.length &&
    grounding.chunkIds?.length
  );
}
