import { buildSourceContext } from "./sourceContext.js";

export function buildCourseGrounding({ chunks, missionId, topic, limit = 6 }) {
  const context = buildSourceContext(chunks, topic, { missionId, limit });
  return {
    missionId,
    topic,
    context,
    grounded: context.length > 0,
    sourceIds: [...new Set(context.map((item) => item.sourceId))],
  };
}

export function canGenerateGroundedCourse(grounding) {
  return Boolean(grounding?.grounded && grounding.sourceIds?.length);
}
