import { buildCourseGrounding, canGenerateGroundedCourse } from "./courseGrounding.js";
import { createCourseContent } from "./courseContent.js";

export function buildGroundedCourseDraft({ chunks, missionId, topic, limit = 6 }) {
  const grounding = buildCourseGrounding({ chunks, missionId, topic, limit });
  if (!canGenerateGroundedCourse(grounding)) {
    return { grounding, content: [], generated: false };
  }

  const content = grounding.context.map((item, index) => createCourseContent({
    missionId,
    title: index === 0 ? topic : topic + " — source evidence " + (index + 1),
    kind: "lesson",
    body: item.text,
    sourceRefs: [item.sourceId],
    sourceChunkRefs: [item.chunkId],
  })).filter(Boolean);

  return {
    grounding,
    content,
    generated: content.length > 0,
  };
}

export function canGenerateCourseFromSources({ chunks, missionId, topic }) {
  const grounding = buildCourseGrounding({ chunks, missionId, topic });
  return canGenerateGroundedCourse(grounding);
}
