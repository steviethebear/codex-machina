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

## v0.5.8: Breadcrumbs, Thinking Profile, & Sources
**Status:** Complete

This release shifts the student experience from **ranking and accumulation** toward
**sense-making, revisitation, and reflective awareness**, while expanding teacher
visibility for formative Codex checks.

---

### Student-Facing Changes

#### Breadcrumbs (Navigation as Thinking)
- Implement breadcrumb-based navigation that allows students to:
  - move forward and backward through recently visited notes
  - follow paths of thought rather than isolated documents
- Breadcrumbs emphasize **intellectual return and development**, not task efficiency.
- Navigation reflects where students have been thinking, not what they have completed.

---

#### Thinking Profile (Replaces Student Dashboard & Leaderboard)
- Remove the student-facing leaderboard and point-ranked dashboard.
- Replace with a **Thinking Profile** that describes patterns of engagement across
  multiple dimensions, such as:
  - Production Rhythm (consistency over time, not volume)
  - Connection Density (links to texts, notes, activities, or peers)
  - Revisitation (returning to earlier ideas through new notes)
  - Social Engagement (interaction with classmates’ thinking)
- The Thinking Profile is:
  - descriptive, not evaluative
  - non-ranked and non-competitive
  - explicitly *not* a measure of quality, correctness, or intelligence
- The profile may be introduced as an **unlockable** once sufficient activity exists
  to make patterns meaningful.

---

#### Sources (Structured & Unified)
- Improve source handling by introducing standardized, admin-managed sources.
- Admins can create sources with uniform metadata, including:
  - author
  - title
  - URL
  - optional bibliographic fields
- Notes can reliably reference these sources.
- Sources act as stable anchors for interpretation and connection across the Codex.

---

### Teacher-Facing Changes

#### Teacher Dashboard (Formative Evaluation Support)
- Introduce or expand a teacher-facing dashboard designed to support:
  - Codex Checks
  - future periodic habit-based evaluations
- The dashboard prioritizes:
  - patterns of student participation
  - consistency over time
  - relational engagement (links, mentions, revisitation)
  - absence or risk signals (who may need attention or support)
- Teachers can quickly:
  - see engagement patterns
  - access representative notes
  - make professional judgments
- The dashboard does **not**:
  - rank students
  - automate grades
  - evaluate idea quality
  - replace teacher judgment

---

### Design Constraints (Explicit)
- No student-facing rankings or leaderboards.
- No presentation of point totals as measures of intellectual worth.
- No AI-generated judgments of idea quality.
- All profiles and dashboards function as **descriptive mirrors**, not performance meters.

## v0.5.9: Unlockables
**Status:** Planned

This release introduces **unlockable features** that emerge from sustained patterns
of engagement. Unlocks are not rewards, ranks, or achievements; they are
**new ways of seeing and working** that become available when the system has
enough evidence that they will deepen thinking rather than shortcut it.

---

### Core Principle

Unlockables are based on **habits over time**, not point totals, quality judgments,
or comparative ranking.

Unlocks should feel:
- noticed, not earned
- contextual, not competitive
- consequential, not celebratory

---

### Student-Facing Unlockables

Unlockables introduce **new affordances**, not status.

Planned unlockable capabilities may include:

- **Thinking Profile**
  - Access to the student’s Thinking Profile once sufficient activity exists
  - Signals that the system now has enough data to reflect patterns meaningfully

- **Graph View**
  - Visualization of the student’s notes as a network
  - Emphasizes structure and relation over linear progression

- **Advanced Breadcrumbs**
  - Longer or more persistent paths of thought
  - Ability to revisit conceptual trajectories across time

- **Threads / Weaving Space**
  - A space for arranging existing notes to explore relationships
  - Does not allow rewriting notes; arrangement only

---

### Unlock Triggers (Conceptual, Not Numeric)

Unlock conditions are based on **observable patterns**, such as:
- sustained activity across multiple days or weeks
- evidence of outward connection (links to texts, notes, peers)
- revisitation (new notes linking back to older ones)
- balance across dimensions (not just production)

Exact thresholds are **intentionally opaque to students** and may evolve.

---

### Student Experience

- Students are not shown unlock requirements.
- Unlock notifications are understated and informational.
- Unlocks do not award points, ranks, or achievements.
- Unlocks do not imply being “ahead” or “better.”

---

### Teacher Controls

- Teachers can:
  - see which unlocks a student has access to
  - manually grant or withhold unlocks when appropriate
- Unlocks remain primarily system-driven but **teacher-overridable**.

---

### Design Constraints (Explicit)

- No unlocks based on:
  - total points
  - leaderboard position
  - AI judgments of idea quality
- Unlock logic must consume **existing descriptive signals**
  (Consistency, Connection, Revisitation), not invent new evaluative ones.
- Unlockables must not replace teacher judgment or rubric-based evaluation.

---

### Non-Goals

- Unlockables are not grades.
- Unlockables are not achievements.
- Unlockables are not progression bars or levels.


## v0.5.10: Bug Fixes
**Status**: Planned
- Fix any remaining bugs from previous releases.
- Consider what needs to be done for beta deployment.
- Get ready for v0.6.0 by creating release schedule.