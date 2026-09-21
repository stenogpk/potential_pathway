import { buildCourseGrounding, canGenerateGroundedCourse } from "./courseGrounding.js";
import { createCourseContent, createEvidenceBlock } from "./courseContent.js";

function asEvidenceBlock(item, prefix = "") {
  return createEvidenceBlock({
    text: prefix ? prefix + String(item.text || "").trim() : String(item.text || "").trim(),
    sourceId: item.sourceId,
    chunkId: item.chunkId,
    evidenceLayer: item.evidenceLayer || "user-source",
    sourceUrl: item.sourceUrl || "",
  });
}

function buildStructuredSections(context = []) {
  const sections = {
    core: [],
    crux: [],
    details: [],
    facts: [],
    mcqTargets: [],
    revisionPoints: [],
  };

  context.forEach((item, index) => {
    const text = String(item.text || "").trim();
    if (!text) return;

    const block = asEvidenceBlock(item);
    if (index === 0) sections.core.push(block);
    else if (index === 1) sections.crux.push(block);
    else sections.details.push(block);

    if (/d{1,4}|%|₹|Rs.?|date|year/i.test(text)) {
      sections.facts.push(asEvidenceBlock(item));
    }

    sections.mcqTargets.push(
      asEvidenceBlock(item, "Recall target: ")
    );
    sections.revisionPoints.push(
      asEvidenceBlock(item, "Revision point: ")
    );
  });

  return sections;
}

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

  const sections = buildStructuredSections(grounding.context);
  const first = grounding.context[0];
  const content = createCourseContent({
    missionId,
    title: topic,
    kind: "lesson",
    body: grounding.context.map((item) => String(item.text || "").trim()).filter(Boolean).join("\n\n"),
    sections,
    sourceRefs: [...new Set(grounding.context.map((item) => item.sourceId).filter(Boolean))],
    sourceChunkRefs: [...new Set(grounding.context.map((item) => item.chunkId).filter(Boolean))],
    evidenceLayers: [...new Set(grounding.context.map((item) => item.evidenceLayer || "user-source"))],
    sourceUrls: [...new Set(grounding.context.map((item) => item.sourceUrl).filter(Boolean))],
  });

  return {
    grounding,
    content: content ? [content] : [],
    generated: Boolean(content),
    needsExternalVerification: false,
    researchRequest: null,
    structure: {
      sections: Object.fromEntries(
        Object.entries(sections).map(([name, blocks]) => [name, blocks.length])
      ),
      sourceFirst: Boolean(first),
    },
  };
}

export function canGenerateCourseFromSources({ chunks, missionId, topic }) {
  const grounding = buildCourseGrounding({ chunks, missionId, topic });
  return canGenerateGroundedCourse(grounding);
}
