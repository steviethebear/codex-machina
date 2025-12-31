# Unlockables Registry — Design Contract

**Version:** v0.6.0  
**Last Updated:** 2025-12-31  
**Status:** Final (not to be modified without revisiting global roadmap)

---

## Purpose

This document catalogs **all unlockable capabilities** in Codex Machina and serves as the design contract for when, why, and how features become available to students.

Unlockables are not rewards, achievements, or progression markers. They are **new ways of seeing and working** that become available when the system has enough evidence that they will deepen thinking rather than shortcut it.

---

## Core Principles

All unlockables must embody:

- **Noticed, not earned**: Features emerge from organic patterns, not point thresholds
- **Contextual, not competitive**: Unlock logic based on continuity and structure, never ranking
- **Consequential, not celebratory**: Unlocks enable workflows, not status
- **Opaque to students**: Exact thresholds and conditions remain hidden
- **Teacher-overridable**: Teachers can grant or revoke any unlock manually
- **Non-linear**: Unlocks are independent affordances; students may unlock them in different orders based on how their thinking develops.

---

## Registered Unlockables

### 1. Thinking Profile

**Feature Key:** `thinking_profile`  
**Introduced:** v0.5.8  
**Status:** Active

#### Purpose
Access to the student's Thinking Profile dashboard, which surfaces patterns in:
- Production Rhythm (activity heatmap)
- Connection Density (links per note ratio)
- Intellectual Return (new notes linking to old notes)

The Thinking Profile is a **mirror**, not a scorecard. It shows students how their thinking moves across time.

#### Conceptual Readiness Rationale
The Thinking Profile requires sufficient evidence of sustained intellectual work to be meaningful. Showing it prematurely would display sparse or misleading patterns.

Students need time for patterns to emerge organically, not as isolated events.

Unlocking when thinking has taken shape prevents:
- premature self-monitoring
- misinterpretation of noise as signal
- optimization of visible metrics

#### Representative Unlock Heuristic
_The following thresholds are heuristic examples used during development. Exact values are subject to adjustment based on real classroom observation in v1.0 and beyond._

- Notes showing permanence and persistence
- Activity distributed across time (not burst production)

_Conceptual trigger: "sustained engagement over time"_

#### Teacher Override Location
Admin → Students → [Student Detail] → Capabilities Tab → Toggle `thinking_profile`

#### Locked State UI
Dashboard displays:
> "Your thinking profile is currently forming. This view tracks the natural rhythms and patterns of your mind as they emerge over time."

---

### 2. Graph View

**Feature Key:** `graph_view`  
**Introduced:** v0.5.8  
**Status:** Active

#### Purpose
Visualization of the student's notes as a network graph, showing:
- nodes (permanent notes)
- edges (connections via [[wikilinks]])
- clustering and density patterns

The Graph View emphasizes **structure and relation** over linear progression. It makes visible the architecture of thought.

#### Conceptual Readiness Rationale
The graph requires both structural mass and relational density to be interpretable. A sparse graph would feel empty or misleading.

Students need:
- sufficient material for meaningful structure to emerge
- evidence of relational thinking (not just accumulation)

Unlocking when a network has formed prevents:
- showing isolated nodes masquerading as structure
- premature visualization before ideas connect

#### Representative Unlock Heuristic
_The following thresholds are heuristic examples used during development. Exact values are subject to adjustment based on real classroom observation in v1.0 and beyond._

- Material volume indicating sustained work
- Evidence of relational thinking (notes referencing one another)

_Conceptual trigger: "structural emergence"_

#### Teacher Override Location
Admin → Students → [Student Detail] → Capabilities Tab → Toggle `graph_view`

#### Locked State UI
Graph page displays:
> "The Network is Forming  
> Your Codex is simply a collection of notes right now. As you weave ideas together, a larger structure will begin to appear here."

---

### 3. Advanced Breadcrumbs

**Feature Key:** `deep_breadcrumbs`  
**Introduced:** v0.5.9  
**Status:** Active

#### Purpose
Extended breadcrumb history, increasing from 3 to 10 recent paths in sessionStorage.

Breadcrumbs are **Paths of Thought**—they show intellectual trajectory, not navigation hierarchy. Advanced Breadcrumbs extend memory, allowing students to retrace longer conceptual journeys.

#### Conceptual Readiness Rationale
Extended breadcrumbs require navigational complexity to be useful. With sparse material, longer path memory is unnecessary.

Students need:
- sufficient depth that retracing becomes meaningful
- enough conceptual territory that navigation patterns matter

Unlocking when complexity emerges prevents:
- over-complicating simple collections
- adding cognitive overhead without benefit

#### Representative Unlock Heuristic
_The following thresholds are heuristic examples used during development. Exact values are subject to adjustment based on real classroom observation in v1.0 and beyond._

- Material volume indicating non-trivial navigation

_Conceptual trigger: "navigational complexity"_

#### Teacher Override Location
Admin → Students → [Student Detail] → Capabilities Tab → Toggle `deep_breadcrumbs`

#### Locked State UI
Breadcrumbs component silently limits history to 3 items (no visible message).

---

### 4. Threads

**Feature Key:** `threads`  
**Introduced:** v0.6.0 (planned)  
**Status:** Planned

#### Purpose
A **weaving space** where students arrange existing permanent notes to explore:
- structure
- tension
- gaps
- possible directions for formal writing

Threads are not drafts. They are arrangements of thinking that support sense-making before writing.

#### Conceptual Readiness Rationale
Threads require sufficient intellectual material to weave meaningfully. Unlocking arrangement capabilities too early would:
- encourage premature structuring before ideas have developed
- create pressure to organize what is still provisional
- make visible an empty interface

Students need:
- depth of material (ideas worth arranging)
- evidence of relational thinking (not isolated fragments)
- temporal persistence (thinking sustained over time)

Threads unlock when arrangement becomes intellectually productive.

#### Representative Unlock Heuristic
_The following thresholds are heuristic examples used during development. Exact values are subject to adjustment based on real classroom observation in v1.0 and beyond._

- Sustained intellectual work over time
- Material showing interconnection
- Depth indicating readiness for synthesis

_Conceptual trigger: "material worthy of weaving"_

#### Teacher Override Location
Admin → Students → [Student Detail] → Capabilities Tab → Toggle `threads`

#### Locked State UI _(proposed)_
Threads navigation link hidden until unlocked.  
If accessed directly via URL, display:
> "Weaving Space  
> A space for arranging ideas will appear here as your Codex develops structure."

---

---

### 5. Smart Connections

**Feature Key:** `smart_connections`  
**Introduced:** v1.x (planned)  
**Status:** Defined, not implemented

#### Purpose
Smart Connections surfaces **algorithmically suggested resonances** between notes
using semantic embeddings.

Its role is to assist *discovery*, not to replace intentional linking.
It offers a second perspective on the corpus once sufficient structure exists.

Smart Connections does **not** create links.
It suggests possibilities that students may choose to explore or ignore.

---

#### Why This Is Locked Initially
When introduced too early, algorithmic suggestions:
- short-circuit recall and search
- bias the graph toward machine-shaped connections
- undermine the pedagogical value of intentional [[linking]]

Students must first demonstrate the ability to:
- create notes independently
- link ideas deliberately
- revisit earlier thinking without prompts

Smart Connections is appropriate only once a student has already learned
how to connect ideas on their own.

---

#### Conceptual Readiness Rationale
Smart Connections assumes:

- a sufficiently large and stable note corpus
- existing relational structure (links, revisitation)
- student familiarity with:
  - Graph View
  - Threads
- readiness for *assisted resonance* rather than guided direction

At this stage, algorithmic similarity can **augment perception**
without dictating it.

---

#### Representative Unlock Heuristic
_The following conditions are illustrative and subject to revision based on
real classroom use post–v1.0._

- Dense enough corpus that embeddings are meaningful
- Evidence of intentional linking and revisitation
- Prior access to structural views (Graph, Threads)

_Conceptual trigger: “algorithmic resonance as augmentation, not direction”_

---

#### Student Experience
- Smart Connections appears as a **suggestion panel**, not an instruction.
- Language is invitational, e.g.:
  - “You might want to look at…”
  - “Related ideas you may find interesting…”
- Suggestions are optional and dismissible.
- No auto-insertion of links.
- No ranking framed as correctness or importance.

---

#### Teacher Override
- Teachers may grant or revoke via:
  `/admin/student/[id] → Capabilities`
- Default state is **locked** until unlocked by system or teacher.

---

#### Design Constraints (Non-Negotiable)
Smart Connections must **never**:
- auto-link notes
- recommend “better” or “stronger” connections
- replace student search, recall, or judgment
- be framed as guidance or evaluation
- surface hidden scores or confidence levels

It must remain a **perceptual aid**, not a thinking surrogate.

---

#### Relationship to Other Unlocks
Smart Connections is intentionally **later** than:

- Thinking Profile (self-reflection)
- Graph View (structural perception)
- Deep Breadcrumbs (navigational memory)
- Threads (intentional synthesis)

Ordering principle:
**reflection → structure → memory → synthesis → assisted resonance**

---

#### Maintenance Note
Any proposal to implement Smart Connections must:
- revisit this registry entry
- be tested only after v1.0 classroom use
- demonstrate that it augments, rather than redirects, student thinking

---

## Non-Unlockable Features

The following features are **always available** and do not appear as gated capabilities:

### Tags
Tags are a supplemental organizational layer. They do not meaningfully expand perception in the way Graph or Threads do. Locking tags would create confusion about "earning" the right to organize.

Tags remain available from the start.

### My Notes
Core note-taking interface (Inbox, Notes, Sources tabs) is always available.

### Dashboard (Limited View)
Students always see a minimal dashboard. The Thinking Profile unlock gates the full analytical view, but students always have access to basic information.

---

## Teacher Override Protocol

Teachers may manually grant or revoke any unlock at any time via:

**Admin → Students → [Student Name] → Capabilities Tab**

Overrides are:
- immediate (UI updates via `revalidatePath`)
- reversible
- logged with metadata `{ trigger: 'admin_override' }`
- always take precedence over system logic

Teacher overrides support pedagogical judgment when:
- a student's work is meaningful but doesn't fit heuristics
- system logic is too strict or too lenient
- individualized support requires earlier/later access

---

## Unlock Notification Language

All unlock notifications use **low-salience, observational language**:

- **Title:** "New Capability Available"
- **Message:** "Your sustained thinking has revealed a new way to work: [Feature Name]."

No celebration, ranking, or achievement framing.

---

## Maintenance Protocol

This registry is a **design contract**. Changes require:

1. Explicit discussion of pedagogical rationale
2. Update to this document
3. Update to `global-roadmap.md` if fundamental principles shift
4. Testing with real classroom data (post–v1.0)

Do not modify unlock logic casually. No unlock behavior should be revised based solely on analytics without teacher interpretation.

---

## Future Unlockables (Potential)

The following are **not yet defined** but may become unlockables in future versions:

- Reflection invitations (currently teacher-initiated, may become unlock-gated)
- Collaborative spaces (if peer-to-peer features are added)
- Advanced export tools (if writing integration deepens)

Any new unlockable must be added to this registry before implementation.

---

## Version History

- **v0.6.0 (2025-12-31)**: Initial registry creation
  - Documented `thinking_profile`, `graph_view`, `deep_breadcrumbs` (from v0.5.9)
  - Defined `threads` unlock (for v0.6.0 implementation)
  - Established registry as design contract
