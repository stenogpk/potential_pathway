export const missions = [
  {
    id: "pcs",
    title: "PCS / GS",
    subtitle: "Primary Mission",
    iconName: "Target",
    color: "violet",
    accent: "Your main preparation pathway",
    defaultMinutes: 50,
    status: "active",
    sourceStatus: "Awaiting official/source course pack",
  },
  {
    id: "chemistry",
    title: "PGT Chemistry",
    subtitle: "Secondary Mission",
    iconName: "FlaskConical",
    color: "cyan",
    accent: "30 min daily pathway",
    defaultMinutes: 30,
    status: "active",
    sourceStatus: "Official exam pattern configured; detailed subject syllabus pending",
    exam: {
      date: "2026-12-15",
      dateLabel: "15–16 Dec 2026",
      totalMarks: 400,
      writtenMarks: 360,
      interviewMarks: 40,
      questions: 120,
      durationMinutes: 120,
      marking: "+3 correct / −1 wrong",
    },
  },
  {
    id: "roaro",
    title: "RO / ARO",
    subtitle: "Coming Soon",
    iconName: "BookOpen",
    color: "amber",
    accent: "Separate syllabus & question bank",
    defaultMinutes: 50,
    status: "inactive",
    sourceStatus: "Not activated",
  },
];

export const emptyMissionProgress = {
  minutes: 0,
  sessions: 0,
  mcqAttempts: 0,
  mcqCorrect: 0,
  completedTopics: 0,
  totalTopics: 0,
};

export function missionProgress(sessions, missionId) {
  const rows = sessions.filter((s) => s.missionId === missionId);
  const actualSeconds = rows.reduce((sum, s) => sum + (s.actualSeconds || 0), 0);
  return {
    ...emptyMissionProgress,
    minutes: Math.floor(actualSeconds / 60),
    sessions: rows.length,
    mcqAttempts: 0,
    mcqCorrect: 0,
  };
}
