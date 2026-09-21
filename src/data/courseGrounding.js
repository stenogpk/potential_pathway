import { buildSourceContext } from "./sourceContext.js";
import { buildResearchFallback } from "./externalResearch.js";

export function buildCourseGrounding({ chunks, missionId, topic, limit = 6 }) {
  const context = buildSourceContext(chunks, topic, { missionId, limit });
  const fallback = buildResearchFallback({ missionId, topic, localContext: context });
  return {
    missionId,
    topic,
    context,
    grounded: context.length > 0,
    sourceIds: [...new Set(context.map((item) => item.sourceId))],
    fallback,
  };
}

export function canGenerateGroundedCourse(grounding) {
  return Boolean(grounding?.grounded && grounding.sourceIds?.length);
}
