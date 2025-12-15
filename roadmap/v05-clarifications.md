# Codex Machina v0.5 - Final Clarifications

## Changes Made to Final Spec

### 1. ❌ TAGS - OUT for v0.5
**Decision:** Tags system entirely removed from v0.5, moved to v0.6

**Removed:**
- `#tags` from fleeting note body
- `#tags` from permanent note body  
- Tag autocomplete from creation flow
- "Browse by Tags" from search section
- Tags filter from graph filters
- Tags from filter panel UI

**Rationale:** Keep v0.5 focused. Tags are supplemental to [[linking]], which is the primary connection mechanism.

---

### 2. ❌ RESPONSE NOTES - CUT ENTIRELY
**Decision:** Response notes feature cut from all versions

**What was cut:**
- Creating permanent notes as formal responses to other permanent notes
- Special "responding to" relationship type
- Response notes appearing in graph with dotted lines

**Why:** Margin comments provide the dialogue functionality. Response notes add complexity without clear additional value.

---

### 3. ❌ FORKING NOTES - CUT ENTIRELY  
**Decision:** Forking feature cut from all versions

**What was cut:**
- Ability to fork classmates' permanent notes into read-only copies
- Attribution system for forked notes
- Points for having notes forked

**Why:** Students can [[link]] to classmates' notes directly. Forking adds conceptual overhead without clear pedagogical benefit.

---

### 4. ✅ [[LINKS]] ONLY EARN POINTS IN PERMANENT NOTES
**Decision:** [[Links]] created in fleeting notes do NOT earn points until the note is promoted to permanent status

**Clarifications added:**
- In fleeting notes features: "[[Links]] in fleeting notes do NOT earn points until the note is promoted to permanent status"
- In point structure: "[[Links]] in fleeting notes do NOT earn points. Points are only awarded when the note containing the [[link]] becomes permanent."

**Rationale:** Keeps fleeting notes low-stakes. Students can experiment with [[linking]] without worrying about points. Only when they decide the note is ready for public consumption do the [[links]] count.

---

### 5. ✅ FLEETING NOTES CAN [[LINK]] TO CLASSMATES' PERMANENT NOTES
**Decision:** Confirmed and clarified

**Updated text:**
- "Can [[link]] to: Sources (teacher-created), Permanent notes (own or classmates' - all public permanent notes), Own fleeting notes (private workspace linking)"

**How it works:**
- Student A creates fleeting note (private to them, visible to teacher)
- Student A can [[link]] to Student B's public permanent note
- The [[link]] works, but doesn't earn points yet
- When Student A promotes their fleeting note to permanent, the [[link]] then earns points (2 points, +1 bonus for classmate link)

**Rationale:** Students should be able to engage with classmates' thinking even in their private workspace. The fleeting note space is for developing ideas, which naturally involves connecting to the public graph.

---

## What's Definitively IN v0.5

**Core Features:**
- Two-tier notes (fleeting → permanent)
- Promotion workflow with dual LLM evaluation
- Inline [[linking]] with substantiveness checks
- @Mentions with notifications
- Margin comments (threaded)
- Sources (teacher-created only)
- Shared knowledge graph
- Points/gamification/leaderboard
- Teacher dashboard with source analytics
- Class feed
- Basic notifications

---

## What's Definitively OUT (v0.6 or Never)

**Moved to v0.6:**
- Outline assembly tool
- Tags system (#hashtags)
- Student-created sources with duplicate detection
- Reflections system
- Drafts in-system

**Cut Entirely (Never):**
- Response notes
- Forking notes
- Questions feature
- Signals/Quests
- Literature notes (replaced by fleeting notes + source [[links]])

---

## Key Technical Clarifications

**Promotion Workflow:**
- Note changes state (fleeting → permanent), doesn't create new note
- Same database record, visibility and requirements change
- Rejected notes get "Needs Revision" badge, stay in Inbox
- Unlimited retries, no penalty

**[[Linking]] Mechanics:**
- Inline only, no separate connection UI
- Parsed from markdown when note is saved
- Context sentence extracted and stored
- LLM evaluates substantiveness
- Points awarded only for permanent notes containing [[links]]

**Privacy Model:**
- Fleeting notes: Private to author, visible to teacher
- Permanent notes: Public to all students
- Fleeting notes can [[link]] to public permanent notes from any student
- @mentions in fleeting notes: only notify if note becomes permanent

**Points Philosophy:**
- Fleeting notes: 1 point (coherence check only)
- Permanent notes: 0-8 points (quality evaluation)
- [[Links]] in permanent notes: 2 points (3 if to classmate)
- Incoming [[links]]: 2 points passively to note author
- No points for anything in fleeting notes except the note itself

---

## Ready for Antigravity

The final spec is now clean, consistent, and unambiguous. All tag references removed, response notes and forking explicitly cut, [[link]] point mechanics clarified, and privacy model specified.
