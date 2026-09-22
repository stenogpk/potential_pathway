# Potential Pathway — Flutter Android

Potential Pathway is rebuilt as a native Flutter Android application. The APK is produced directly by GitHub Actions using Flutter stable and the Android SDK; there is no Capacitor/WebView runtime in this build.

Core flow:
Source -> Learn -> Recall -> Practice -> PYQ -> Analyse -> Revise -> Re-test -> Retain -> Readiness

Included:
- PCS / GS and PGT Chemistry missions; RO / ARO remains Coming Soon
- local device persistence
- PDF/TXT/MD source picking
- on-device PDF text extraction and evidence chunks
- source-first AI Study Chat
- external-verification queue and evidence provenance
- source-grounded course builder
- MCQ practice, adaptive selection, scoring and revision cards
- Subject -> Topic -> Subtopic course tree
- readiness metrics
- backup and restore
- native APK build with automatic cancellation of superseded builds

The PDF dependency is Syncfusion Flutter PDF. The current package documentation supports loading PDF bytes and extracting text with PdfTextExtractor. The package documentation states that a Syncfusion commercial or free Community license is required.

Android updates use the same application id (com.potentialpathway.app) and a monotonically increasing build number from the GitHub run number.
