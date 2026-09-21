import { buildCourseGrounding } from "./courseGrounding.js";

export function courseGenerationGate({ chunks, missionId, topic }) {
  const grounding = buildCourseGrounding({ chunks, missionId, topic });
  if (!grounding.grounded || grounding.sourceIds.length === 0) {
    return {
      allowed: false,
      needsExternalVerification: true,
      reason: "No matching user-source evidence is available. External verification is required.",
      researchRequest: grounding.fallback.request,
      grounding,
    };
  }

  return {
    allowed: true,
    needsExternalVerification: false,
    reason: "",
    researchRequest: null,
    grounding,
  };
}
