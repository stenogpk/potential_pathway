import { buildCourseGrounding, canGenerateGroundedCourse } from "./courseGrounding.js";
import { createCourseContent } from "./courseContent.js";

export function buildGroundedCourseDraft({ chunks, missionId, topic, limit = 6 }) {
  const grounding = buildCourseGrounding({ chunks, missionId, topic, limit });
  if (!canGenerateGroundedCourse(grounding)) {
    return {
      grounding,
      content: [],
      generated: false,
      needsExternalVerification: true,
      researchRequest: grounding.fallback.request,
    };
  }

  const content = grounding.context.map((item, index) => createCourseContent({
    missionId,
    title: index === 0 ? topic : topic + " — source evidence " + (index + 1),
    kind: "lesson",
    body: item.text,
    sourceRefs: [item.sourceId],
    sourceChunkRefs: [item.chunkId],
    evidenceLayers: [item.evidenceLayer || "user-source"],
    sourceUrls: item.sourceUrl ? [item.sourceUrl] : [],
  })).filter(Boolean);

  return {
    grounding,
    content,
    generated: content.length > 0,
    needsExternalVerification: false,
    researchRequest: null,
  };
}

export function canGenerateCourseFromSources({ chunks, missionId, topic }) {
  const grounding = buildCourseGrounding({ chunks, missionId, topic });
  return canGenerateGroundedCourse(grounding);
}
