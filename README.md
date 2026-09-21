# PP — Potential Pathway

**AI-Powered Exam Preparation System**

Potential Pathway is a source-grounded, adaptive exam-preparation system designed around practical exam readiness rather than passive content consumption.

## Product direction

**Learn → Practice → Revise → Analyse → Retain**

The system is being designed around:
- Prelims-focused readiness
- Mission-based preparation pathways
- Adaptive study sessions
- MCQ + PYQ practice
- Revision and retention cycles
- Weak-area detection
- Source/PDF-grounded course content
- AI guidance that stays grounded in the configured sources

## Initial missions

- 🎯 **PCS / GS** — Primary Mission
- 🧪 **PGT Chemistry** — Secondary Mission
- 📚 **RO / ARO** — separate pathway planned

## Current implementation

The repository currently contains the Phase 1 front-end foundation:
- Responsive dashboard
- Mission navigation
- PCS / Chemistry / RO-ARO pathway cards
- Study-session interaction
- Initial readiness/stat placeholders
- PP visual identity
- Vite + React build setup
- GitHub Actions build validation

The timer and progress values in this prototype are intentionally UI/demo state. They are **not yet the real adaptive study engine**.

## Next engineering layers

1. Data model and local persistence
2. Source/PDF ingestion model
3. Course/topic structure
4. MCQ/PYQ/question-bank model
5. Revision scheduler
6. Readiness calculations
7. AI/source-grounded layer
8. Authentication/cloud persistence
9. Production deployment

## Source integrity rule

Official notifications and user-provided source PDFs are treated as primary sources when they are the basis for course configuration. Unsupported syllabus details should not be invented.

## Development principle

Build one layer at a time, validate it, then move forward. The goal is a maintainable exam-preparation system—not a collection of disconnected screens.
