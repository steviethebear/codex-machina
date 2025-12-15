# Codex Machina v0.6 - Future Features

This document tracks features deferred from v0.5 for implementation in v0.6 and beyond.

**Important Notes:**
- Some features from earlier planning have been **cut entirely** and will never be implemented (marked with ❌)
- Features marked ✅ are confirmed for v0.6 or later versions

---

## ✅ OUTLINE ASSEMBLY TOOL

**Status:** Confirmed for v0.6 - HIGH PRIORITY

**Purpose:**
Students drag permanent notes into outline structures that become the foundation for formal writing (Books) completed outside Codex Machina.

**Features:**

**Creating Outlines:**
- Students can create multiple saved outlines
- Drag-and-drop permanent notes into hierarchical structure
- Reorder sections
- Add section headings/labels
- Notes can appear in multiple outlines
- Visual indicator shows connections between assembled notes ("these three notes you've grouped were already linked in your graph")

**Outline Visibility:**
- Outlines are visible to teacher
- Teacher can comment on:
  - Individual note placements
  - Overall structure
  - Missing connections
  - Gaps in argument

**Tracking:**
- Dashboard shows which permanent notes got used vs. ignored
- Can see evolution of outlines over time
- Export outline view for external writing

**Points:**
- Creating outline: Points TBD (will determine after testing)
- Quality of outline structure: Teacher-assessed

**Connection to Living Codex:**
- Book I: Students assemble permanent notes → outline → write braided essay in Word/paper → submit to Canvas
- Book II: New notes from later units destabilize Book I → students annotate physical Book I → new marginalia ideas become new notes in Codex Machina
- Books III & IV: Similar pattern - notes feed thinking, formal work happens outside

---

## ✅ TAGS SYSTEM (#hashtags)

**Status:** Confirmed for v0.6 - MEDIUM PRIORITY

**Purpose:**
Additional layer of organization and discovery beyond [[linking]]. Students ask: "How do I want to stumble upon this later?"

**Creating Tags:**
- Type `#` in any note
- Tag appears: `#communication`, `#trust`, `#wittgenstein`
- Can add multiple tags per note

**AI-Suggested Tags:**
- When creating/editing note, system suggests relevant tags
- Based on content analysis
- Student can accept or ignore

**Browsing by Tags:**
- Tag cloud visualization showing most-used tags
- Click tag to see all tagged notes
- Filter graph by tag
- Tag-based search

**Tag Analytics:**
- Teacher can see which tags are emerging
- Identify thematic patterns across class
- See which students are using tags effectively

**Points:**
- No points for tagging (purely organizational)
- May add later if we want to incentivize

**Note:**
Tags are secondary to [[linking]]. The primary way students connect ideas is through inline [[links]] within their writing. Tags are supplemental for organization and discovery.

---

## ✅ STUDENT-CREATED SOURCES

**Status:** Confirmed for v0.6 - MEDIUM PRIORITY

**Purpose:**
Allow students to add sources beyond teacher-assigned readings.

**Duplicate Detection Interface:**
1. Student starts typing source title/author
2. System searches existing sources (fuzzy matching)
3. If match found: "This source already exists - use '[Title]' by [Author]?"
   - Shows existing source details
   - "Use this source" button
   - "No, create new source" option
4. If no match: "Create new source?"
   - Fill in MLA fields (same as admin)
5. Once created, all students can [[link]] to it

**Required Fields (same as admin):**
- Author(s)
- "Source" (title of article/chapter)
- Container (book/journal/website name)
- Publisher
- Year
- URL (optional)

**Permissions:**
- Any student can add a source
- Cannot edit sources created by others
- Teacher can edit/delete any source

**Quality Control:**
- Teacher reviews student-added sources
- Can flag or remove duplicates/errors
- Dashboard shows recently added sources

---

## ✅ REFLECTIONS SYSTEM

**Status:** Confirmed for v0.6 - HIGH PRIORITY

**Purpose:**
AI-driven metacognitive development through structured reflection.

**How It Works:**
- Every 2 weeks (or after each unit), student gets prompt to reflect
- Opens chat-style interview interface
- AI asks probing questions about their work:
  - "What permanent notes are you most proud of this week?"
  - "Which connections surprised you?"
  - "What's one idea that's still confusing?"
  - "How has your thinking changed since Unit 1?"
- Student responds conversationally
- AI follows up, probes deeper
- At end, AI generates structured reflection document
- Student can edit and submit

**Assessment:**
- Points for completing reflection (not quality)
- Teacher reads reflections to understand student thinking
- Identifies struggling students
- Tracks metacognitive growth

**Frequency:**
- End of each unit (4 times per semester)
- Or bi-weekly
- TBD based on workload

---

## ✅ DRAFTS IN-SYSTEM

**Status:** Confirmed for v0.6 - MEDIUM PRIORITY

**Purpose:**
Evolve from outline → draft within Codex Machina.

**Draft Creation:**
- Start from saved outline
- System pulls in permanent notes
- Student weaves them together into prose
- Supports full writing/editing
- Can cite permanent notes inline

**Draft Visibility:**
- Drafts are public (like permanent notes)
- Other students can [[link]] to drafts as sources
- Creates multi-layered knowledge graph

**Points:**
- Creating draft: TBD
- Others using your draft as source: Bonus points

**Assessment:**
- Teacher can comment on drafts
- May replace external Canvas submission for some assignments
- Still supports export to Word/PDF

**Why v0.6:**
- Significant scope increase
- Needs robust editor
- v0.5 focuses on note-taking, v0.6 expands to drafting

---

## ❌ RESPONSE NOTES - CUT ENTIRELY

**Status:** NOT IMPLEMENTING - NEVER

**What was proposed:**
- Creating permanent notes as formal responses to other permanent notes
- Special "responding to" relationship type in graph
- Response notes appearing with dotted lines or special indicators

**Why cut:**
- Margin comments already provide dialogue functionality
- Adds conceptual complexity without clear additional value
- Students can [[link]] to notes and explain the relationship inline
- Over-complicates the note taxonomy (fleeting/permanent is enough)

**Alternative:**
- Students can create a new permanent note that [[links]] to another student's note
- The [[link]] and surrounding text provides the "response" context
- Simpler mental model, same functionality

---

## ❌ FORKING NOTES - CUT ENTIRELY

**Status:** NOT IMPLEMENTING - NEVER

**What was proposed:**
- Ability to "fork" classmates' permanent notes into read-only copies
- Attribution system showing original author
- Points for having your notes forked

**Why cut:**
- Students can already [[link]] to classmates' notes directly within their own writing
- Forking creates ownership confusion ("is this my note or theirs?")
- Adds database complexity (tracking forks, attributions)
- No clear pedagogical advantage over direct [[linking]]
- Students don't need a copy; they need to engage with the original in context

**Alternative:**
- Direct [[linking]] to classmates' permanent notes (already in v0.5)
- Backlinks show all notes that reference yours
- Margin comments allow direct dialogue on the original

---

## ✅ ADVANCED ANALYTICS

**Status:** Confirmed for v0.7 - TEACHER-FACING

**For Teachers:**

**Predictive Modeling:**
- Which students likely to struggle based on early patterns
- "This student's LLM scores are trending down"
- "This student hasn't [[linked]] to classmates in 2 weeks"

**Network Analysis:**
- Who's collaborating with whom
- Isolated students (no incoming [[links]])
- Hub creators (lots of incoming [[links]])
- Collaboration clusters

**Intervention Suggestions:**
- "Consider pairing Sarah and Mike - complementary thinking styles"
- "Alex needs encouragement - low engagement but high quality when active"

**Longitudinal Tracking:**
- Student growth over semester
- Unit-to-unit improvement
- Before/after comparison (beginning vs end of course)

**Why v0.7:**
- Need baseline data from v0.5 first
- Requires ML/analytics infrastructure
- Focus v0.5 on core workflow, v0.6 on content creation tools

---

## ✅ NOTIFICATION CUSTOMIZATION

**Status:** Confirmed for v0.6 or v0.7 - QUALITY OF LIFE

**Features:**
- Granular control over what triggers notifications
- Email vs in-app preferences per notification type
- Frequency: immediate, daily digest, weekly summary
- Do Not Disturb mode

**Why v0.6+:**
- v0.5 has basic notifications (in-app + email for important events)
- Refinement based on user feedback
- Not critical for MVP

---

## ✅ MOBILE APP OPTIMIZATION

**Status:** Confirmed for v0.7+ - NATIVE APPS

**Features:**
- Native mobile apps (iOS/Android)
- Optimized for quick fleeting note capture
- Voice-to-text for notes
- Offline mode with sync
- Mobile-optimized graph view

**Why v0.7+:**
- v0.5 is mobile-responsive web (works on phones)
- Native apps are significant development effort
- Need to validate core workflow first
- Mobile web is sufficient for initial deployment

---

## ✅ WEEKLY QUOTA ADJUSTMENTS

**Status:** Confirmed for v0.6 - DATA-DRIVEN REFINEMENT

**Potential Changes Based on v0.5 Data:**
- Adjust fleeting/permanent/link quotas based on actual patterns
- Different quotas per unit (Unit 1 vs Unit 4)
- Individual quotas for struggling/advanced students
- Seasonal adjustments (lighter during midterms)

**Why v0.6:**
- Need real usage data to calibrate
- v0.5 starts with educated guesses (10 fleeting, 3 permanent, 2 classmate links)
- Will adjust based on what's actually achievable and valuable

---

## ✅ ANTI-GAMING MEASURES (IF NEEDED)

**Status:** Implement ONLY if abuse emerges

**Potential Measures:**
- Diminishing returns for creating 20 fleeting notes in one day
- Detect copy-paste between students
- Flag suspiciously similar permanent notes
- Monitor [[link]] spam (linking to everything without context)

**Why conditional:**
- Trust students initially in v0.5
- Add measures only if problems emerge
- Don't pre-optimize for abuse
- Let data guide decisions

---

## ✅ EXPORT/BACKUP FEATURES

**Status:** Confirmed for v0.6 or v0.7 - QUALITY OF LIFE

**Student Exports:**
- Download all notes as markdown files
- Export graph as image/interactive HTML
- PDF portfolio of permanent notes

**Teacher Exports:**
- Class-wide analytics reports
- Individual student progress reports
- Compliance/assessment documentation

**Why v0.6+:**
- v0.5 focuses on live workflow
- Exports are quality-of-life improvements
- Can implement incrementally

---

## ✅ ACCESSIBILITY ENHANCEMENTS

**Status:** Confirmed for v0.7+ - SPECIALIZED WORK

**Features:**
- Screen reader optimization
- Keyboard navigation throughout
- High contrast mode
- Text-to-speech for notes
- Dyslexia-friendly fonts option

**Why v0.7+:**
- Basic accessibility in v0.5 (web standards compliance)
- Advanced features require specialized expertise
- Iterate based on actual user needs
- May prioritize based on student population

---

## ✅ INTEGRATION WITH OTHER TOOLS

**Status:** Possible for v0.7+ - DEPENDS ON DEMAND

**Potential:**
- Canvas LMS integration (sync grades automatically)
- Google Drive (import/export)
- Zotero (bibliography management)
- Hypothesis (web annotation)

**Why v0.7+:**
- v0.5 is standalone system
- Integrations add complexity and maintenance burden
- Validate core value proposition first
- Assess which integrations students/teachers actually want

---

## MAYBE: GAMIFICATION EXPANSIONS

**Status:** TBD based on v0.5 reception

**Potential Features:**
- Achievements system beyond basic badges
- Visual progression (levels, skill trees)
- Collaborative class goals
- Seasonal challenges
- Team competitions

**Why uncertain:**
- v0.5 has basic points/badges/leaderboard
- More gamification only if it serves learning
- Don't over-gamify
- Risk turning intrinsic motivation extrinsic
- Monitor carefully

---

## MAYBE: AI-POWERED WRITING ASSISTANCE

**Status:** TBD - requires careful pedagogical design

**Potential:**
- AI suggests how to improve permanent notes
- "This claim could be stronger if..."
- "Consider adding evidence from..."
- Real-time writing coach

**Why uncertain:**
- v0.5 has LLM evaluation (score + feedback)
- Active coaching is next level
- Risk: students become dependent on AI suggestions
- Risk: undermines authentic voice
- Would need extensive testing and ethical guidelines

---

## IMPLEMENTATION PRIORITY ORDER

Based on educational value and student/teacher requests:

### HIGH PRIORITY (v0.6)
1. **Outline assembly tool** - needed for Living Codex Books
2. **Reflections system** - metacognition is valuable
3. **Student-created sources** - natural extension of engagement

### MEDIUM PRIORITY (v0.6-v0.7)
4. **Tags system** - nice to have, secondary to [[linking]]
5. **Drafts in-system** - major scope but valuable
6. **Notification customization** - quality of life
7. **Export features** - portfolio building

### LOW PRIORITY (v0.7+)
8. **Advanced analytics** - teacher-facing, data-driven
9. **Mobile apps** - optimization, not core
10. **Integrations** - depends on other tools
11. **Accessibility enhancements** - important but specialized

### AS NEEDED (Only if issues arise)
- **Anti-gaming measures**
- **Quota adjustments**

### UNCERTAIN (Requires further evaluation)
- **Gamification expansions** - monitor for over-gamification
- **AI writing assistance** - pedagogical concerns

### NEVER IMPLEMENTING
- ❌ **Response notes** - margin comments + [[linking]] sufficient
- ❌ **Forking notes** - [[linking]] is cleaner solution

---

## NOTES FOR FUTURE DEVELOPMENT

**Before Starting v0.6:**
- Collect v0.5 usage data (full semester minimum)
- Survey students and teachers
- Identify pain points and feature requests
- Validate which features are actually needed
- Don't build features because they're cool - build what serves learning

**Development Philosophy:**
- Start minimal (v0.5)
- Iterate based on real use (v0.6)
- Add complexity only when justified
- Always prioritize: Does this make thinking visible and collaborative?
- Avoid feature creep
- Listen to actual users, not hypothetical needs

**The Goal:**
v0.5 should work beautifully as-is. v0.6 should enhance, not fix. Each version should feel complete in itself while opening doors to the next level.

**Remember Ahrens:**
> "The slip-box is not a collection of notes. It is a tool for thinking." 

Every feature we add should serve thinking, not distract from it.
