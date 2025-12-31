# v0.5.x Release Schedule

This document outlines the incremental release plan for the v0.5 cycle of Codex Machina.

## v0.5.1: UI Polish & Sources
**Status**: Complete
- **UI Cleanup**: Graph enhancements (coloring, sizing) and general UI polish.
- **Slide-Out**: New slide-over view for inspecting notes from the graph/list.
- **Data Seeding**: Populate the database with initial Sources (Books, Articles).

## v0.5.2: Class Feed
**Status**: Complete
- Implementation of the "Class Feed" view.
- Filtering and "Public vs Private" visibility logic.

## v0.5.3: Student Dashboard
**Status**: Complete
- Enhanced metrics and progression for students.
- Visualizing quotas and achievements.
- Version of student dashboard visible to other players. When I click an @ link in a note, it should take me to information about that player and a list of notes.

## v0.5.4: Notifications
**Status**: Complete
- Real-time alerts for @mentions and [[links]].
- Notification center UI.

## v0.5.5: Teacher Dashboard
**Status**: Complete
- Analytics view for teachers.
- Engagement tracking and "At Risk" student identification.
- Add sources to the list of sources.

## v0.5.6: Semantic Search
**Status**: Complete
- Embedding generation for notes.
- Vector search implementation.
- "Smart Connections" based on semantic similarity.
- Add new filters and better search to graph view.

## v0.5.7: Diagnostic AI
**Status**: Complete
- Refactor `evaluateNote` for structural diagnostics (no scoring).
- Update `promoteNote` to block on form violations.
- Remove quality points and score thresholds.
- Implement internal telemetry.

## v0.5.8: Breadcrumbs & Sources
**Status**: Planned
- Implementation of breadcrumbs for navigation.
- User should be able to move back and forth between notes, riding along those notes, and thinking along with them.
- Better implementation of sources. Adding sources is now a better, more intuitive process where the admin can create sources in the source list in a uniform way with: author, title, URL, and other bibliographic data.

## v0.5.9: Unlockables
**Status**: Planned
- Implementation of unlockables for students.
- Ask about which features to unlock and how to unlock them.

## v0.5.10: Bug Fixes
**Status**: Planned
- Fix any remaining bugs from previous releases.
- Consider what needs to be done for beta deployment.
- Get ready for v0.6.0 by creating release schedule.