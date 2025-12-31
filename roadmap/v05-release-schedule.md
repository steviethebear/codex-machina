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
**Status:** Complete

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


## v0.5.10: Stabilization, Polish, & Readiness
**Status:** Complete

This release focuses on **stability, clarity, and classroom readiness**. No new core features are introduced. The goal is to ensure that Codex Machina is reliable, interpretable, and trustworthy before broader use and before expanding into v0.6.0.

---

### Primary Goals

- Eliminate residual bugs and edge cases from v0.5.7–v0.5.9
- Polish language and UI so the system consistently communicates its epistemic stance
- Verify teacher and student experiences under real classroom conditions
- Prepare the codebase and product surface for beta deployment

---

### Bug Fixes & Stability

- Resolve any remaining UI or state-sync issues related to:
  - unlock gating
  - teacher override toggles
  - Thinking Profile rendering
  - Breadcrumb persistence
- Audit revalidation logic to ensure:
  - student views update immediately after unlocks or overrides
  - admin actions propagate reliably
- Confirm that no deprecated leaderboard, XP, or ranking code paths remain.

---

### UX & Language Polish (High Priority)

- Review all student-facing copy to ensure:
  - no language implies ranking, progress, or achievement
  - locked-state messaging remains observational, not prescriptive
  - unlock notifications remain low-salience and non-celebratory
- Review teacher-facing language to ensure:
  - dashboards signal “support” and “patterns,” not evaluation
  - “Support Needed” states are framed as intervention cues, not deficits
- Ensure consistency of terms across the app:
  - Thinking Profile
  - Paths of Thought
  - Intellectual Return
  - Shared Reference Anchors

---

### Teacher Workflow Validation

- Validate the Teacher Dashboard against real Codex Check use cases:
  - selecting different date ranges
  - identifying students who need check-ins
  - quickly accessing representative notes
- Ensure teacher override actions:
  - are clearly visible
  - are reversible
  - always take precedence over system logic
- Confirm that teacher views never expose student-facing unlock logic or thresholds.

---

### Performance & Data Integrity

- Review performance of:
  - signal calculations over longer time ranges
  - unlock checks triggered during note creation/promote flows
- Verify database integrity:
  - no duplicate unlock records
  - clean rollback when unlocks are revoked
  - safe handling of deleted notes or users
- Confirm that AI diagnostics remain:
  - ephemeral
  - non-persistent
  - non-influential beyond form gating

---

### Beta Readiness

- Identify any configuration flags needed for:
  - enabling/disabling unlockables
  - teacher-only features
  - experimental views
- Prepare internal notes for beta deployment:
  - known limitations
  - expected teacher behaviors
  - things *not* to explain to students yet
- Confirm rollback strategy if a feature needs to be temporarily disabled.

---

### Forward Planning (v0.6.0)

- Draft the v0.6.0 release schedule, informed by:
  - classroom use of unlockables
  - teacher feedback on Codex Checks
  - student interpretation of Thinking Profiles
- Explicitly decide which areas are:
  - ready for expansion
  - intentionally frozen
  - candidates for future experimentation

---

### Non-Goals (Explicit)

- No new unlock types
- No changes to unlock logic
- No new analytics dimensions
- No AI expansion beyond existing diagnostic use