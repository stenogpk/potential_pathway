export function buildStudyPlan({ missionId, availableMinutes = 50, sessions = [], attempts = [], revisions = [], courseNodes = [], contentChunks = [] }) {
  const missionAttempts = attempts.filter((a) => a.missionId === missionId);
  const missionRevisions = revisions.filter((r) => r.missionId === missionId);
  const due = missionRevisions.filter((r) => r.dueAt <= Date.now()).length;
  const weak = new Map();
  missionAttempts.forEach((a) => {
    const row = weak.get(a.topicId) || { attempts: 0, correct: 0 };
    row.attempts += 1;
    if (a.isCorrect) row.correct += 1;
    weak.set(a.topicId, row);
  });
  const weakTopic = [...weak.entries()]
    .filter(([, row]) => row.attempts >= 2)
    .sort((a, b) => (a[1].correct / a[1].attempts) - (b[1].correct / b[1].attempts))[0]?.[0];
  const topic = courseNodes.find((n) => n.missionId === missionId && n.kind === "topic" && n.status !== "completed");
  const hasSourceContent = contentChunks.some((chunk) => chunk.missionId === missionId && String(chunk.text || "").trim());
  const plan = [];
  if (due) plan.push({ type: "revision", minutes: Math.min(10, availableMinutes), label: `Review ${due} due revision card${due > 1 ? "s" : ""}` });
  const used = plan.reduce((sum, item) => sum + item.minutes, 0);
  if (weakTopic && used < availableMinutes) plan.push({ type: "practice", minutes: Math.min(15, availableMinutes - used), label: `Practice weak topic: ${weakTopic}` });
  const used2 = plan.reduce((sum, item) => sum + item.minutes, 0);
  if (topic && used2 < availableMinutes) plan.push({ type: "course", minutes: Math.min(availableMinutes - used2, 25), label: hasSourceContent ? `Study source-backed topic: ${topic.name}` : `Study next topic: ${topic.name}` });
  const used3 = plan.reduce((sum, item) => sum + item.minutes, 0);
  if (used3 < availableMinutes) plan.push({ type: "practice", minutes: availableMinutes - used3, label: "Finish with focused MCQ practice" });
  if (!plan.length) plan.push({ type: "course", minutes: availableMinutes, label: "Start a focused course session" });
  return { missionId, availableMinutes, plan };
}
