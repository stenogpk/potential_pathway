# PP — Potential Pathway

**AI-Powered Exam Preparation System**

PP is a source-grounded, adaptive exam-preparation application built around one objective: turning study activity into measurable exam readiness.

## Candidate workflow

**Source → Learn → Recall → Practice → PYQ → Analyse → Revise → Re-test → Retain → Readiness**

The app now includes the working selection loop rather than demo-only placeholders.

## Missions

- 🎯 **PCS / GS** — Primary Mission
- 🧪 **PGT Chemistry** — Secondary Mission
- 📚 **RO / ARO** — separate pathway / coming soon
- ✍️ Mains workflow can be added as a separate mission without mixing question banks.

## Implemented

- Responsive candidate dashboard and mission navigation
- Local persistent study state
- PDF/TXT/Markdown source ingestion and searchable evidence chunks
- Source lifecycle and backup/restore
- Source-grounded course generation with evidence provenance
- Evidence hierarchy: user source, official, trusted external, secondary, model-only
- External evidence verification workflow
- Grounded MCQ authoring and duplicate/evidence admission gates
- Concept, fact, application and PYQ question types
- PYQ metadata, filtering and exposure tracking
- Adaptive question selection
- Real MCQ timing
- Attempt scoring and error classification
- Revision state machine and retention scheduling
- Adaptive study planner
- Readiness metrics and weak-topic signals
- Candidate-facing Question Studio
- Source-grounded Mock Test mode
- Source-grounded AI Draft Lab contract
- End-to-end selection-loop validation
- GitHub Actions validation gates

## AI safety / source integrity

PP does not silently convert model knowledge into verified exam evidence.

When indexed source evidence is available, AI draft requests are constrained to that evidence and retain source/chunk references. When evidence is missing, the workflow blocks rather than inventing facts and can route the topic to external verification.

The current AI Draft Lab prepares and validates a grounded AI request. A server-side LLM provider is intentionally not hard-coded into the static PWA.

## Important content rule

Official notifications and user-provided source documents are authoritative for configured exam facts. Detailed syllabus content must be supplied from an authoritative source before it is loaded into the course. Unsupported syllabus details are not invented.

## Validation

The repository has focused validation for source ingestion, evidence, course, MCQ, PYQ, retention, adaptive practice, external verification and the complete selection workflow.

Before a release, run:

`npm install`
`npm run build`
`npm run validate`

GitHub Actions runs the full configured validation gates on the main branch.

## Development principle

PP is not a generic productivity app. Features are kept only when they support selection readiness: coverage, practice, error recovery, retention, PYQ exposure and measurable readiness.

**Developed by Shartendu**
