import { buildCourseGrounding } from "./courseGrounding.js";

export function courseGenerationGate({ chunks, missionId, topic }) {
  const grounding = buildCourseGrounding({ chunks, missionId, topic });
  if (!grounding.grounded || grounding.sourceIds.length === 0) {
    return {
      allowed: false,
      reason: "No matching source evidence is available for this course topic.",
      grounding,
    };
  }

  return {
    allowed: true,
    reason: "",
    grounding,
  };
}
