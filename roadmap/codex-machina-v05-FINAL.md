# Codex Machina v0.5 - Zettelkasten MVP
## Final Specification for Antigravity

---

## EXECUTIVE SUMMARY

### What is Codex Machina?

Codex Machina is a collaborative digital Zettelkasten system designed for Advanced Studies students at The Webb Schools. It transforms note-taking from a private, invisible activity into a shared, assessable intellectual practice. The platform enables students to build a collective knowledge graph across a semester-long Literature & the Machine curriculum while making their thinking process visible, gradeable, and collaborative.

### The Problem It Solves

Traditional education treats note-taking as preliminary work—something students do before "real" writing begins. This creates three critical problems:

1. **Invisible thinking:** Teachers cannot assess the quality of students' intellectual engagement until they submit final essays, by which point intervention is too late.

2. **Disconnected knowledge:** Students treat each reading, discussion, and assignment as isolated units rather than building cumulative understanding across a semester.

3. **Writing as performance:** Students approach essays as performances of already-formed ideas rather than genuine discovery through the writing process itself.

### The Educational Philosophy

Codex Machina is built on Sönke Ahrens' principle from *How to Take Smart Notes*: **Writing is not the outcome of thinking—writing IS thinking.** If we restructure education so that writing (note-taking, connecting ideas, synthesizing) becomes the primary intellectual work, students would learn more deeply and authentically.

> "When we delegate the storage of knowledge to the slip-box and at the same time focus on the principles behind an idea while we write, add and connect notes, when we look for patterns and think beyond the most obvious interpretation of a note, when we try to make sense of something, combine different ideas and develop lines of thought, we do exactly that: we build up a latticework of mental models instead of just remembering isolated facts and try and bang 'em back." (Ahrens 118–119)

The system implements a two-tier Zettelkasten structure:
- **Fleeting notes (Inbox):** Quick captures, observations, engagement with sources—private workspace where messy thinking happens
- **Permanent notes (Notes):** Synthesized ideas with clear claims that can stand alone—public contributions to the shared knowledge graph

Students promote fleeting notes to permanent notes through an LLM-assisted approval process that ensures quality. By making permanent notes collaborative—visible to all students who can build on each other's thinking—the platform creates intellectual community while maintaining individual accountability.

### The Virtuous Circle

The app creates a cycle of intrinsic motivation:

**Using the app requires thinking → thinking is done by writing → writing produces insight → insight is pleasurable (and rewarded) → the user wants to use the app to do more thinking.**

Every design decision serves this principle. Working with Codex Machina should be a pleasant experience, not a chore. The interface is inspired by Bear and Obsidian—beautiful, spacious, and easy to use.

### Course Context: Literature & the Machine

The app supports a four-unit progression:
1. **Communication** - How symbols create/distort meaning
2. **Computation** - How machines represent knowledge
3. **Consciousness** - What is a mind and what do we owe it
4. **Creation** - Collaborating responsibly with AI tools

Students use Codex Machina throughout, building a collaborative knowledge graph that eventually feeds into formal writing projects (The Living Codex: Books I-IV) completed outside the platform. (Note: Outline assembly and draft tools are planned for v0.6)

---

## PART 1: CORE ARCHITECTURE - TWO NOTE TYPES

### FLEETING NOTES (The Inbox)

**Purpose:**  
Private workspace for messy thinking, quick captures, source engagement, half-formed ideas. Students should WANT to create notes here—it should feel spacious, easy, and frictionless.

**Privacy:**
- Private from other students
- **Visible to admin/teacher**
- Students cannot see each other's fleeting notes

**Fields:**
- **Title:** Auto-generated as timestamp/unique ID, user can update
- **Body:** Markdown text area supporting:
  - `[[wiki_links]]` to other notes and sources
  - `@mentions` to ping classmates
  - `[hyperlinks](url)` to external resources
- **Created_at:** Timestamp
- **Updated_at:** Timestamp
- **Author:** Student who created it
- **Linked sources:** Via [[wiki_links]]
- **Backlinks:** List of notes that link to this note

**Note Display Elements:**
Each fleeting note shows:
- Title
- Creator name
- Created date
- Last updated date
- Body content
- Backlinks (other notes linking here)
- Local graph showing connections (levels 1-3 configurable)

**Features:**
- **Frictionless creation:** Quick, easy interface—minimal friction
- **Light LLM coherence check:** Only validates coherence (prevents blank notes, keyboard mashing, Lorem ipsum)
- **Unlimited retries:** If coherence check fails, student can edit and resubmit immediately
- **Points:** 1 point on creation (after passing coherence check)
- **Quota counting:** Only notes that pass coherence check count toward quota
- **Can [[link]] to:**
  - Sources (teacher-created)
  - Permanent notes (own or classmates' - all public permanent notes)
  - Own fleeting notes (private workspace linking)
  - **Note:** [[Links]] in fleeting notes do NOT earn points until the note is promoted to permanent status
- **Can @mention classmates:** 
  - Creates dialogue in private notes
  - **Points/notifications only awarded if note becomes permanent**
  - If note stays fleeting or gets deleted, no points/notifications sent
- **Editable:** Can revise anytime
- **Generate embeddings:** For semantic search and connection suggestions
- **Promotion:** Single button promotes note to permanent status (changes state from private to public)
- **Badge system:** If promotion fails, note gets "Needs Revision" badge and stays in Inbox
- **Workspace management:** Students can delete fleeting notes they no longer need

**Minimum Quota:** 10 per week (only coherent notes count)

---

### PERMANENT NOTES (The Public Graph)

**Purpose:**  
Synthesized ideas with clear claims that stand alone and contribute to collective knowledge. These are intellectual contributions to the shared knowledge graph—the work that matters.

**Privacy:**
- Public to all students
- Can be viewed, linked to, and annotated by any student
- Only original author can edit content

**Fields:**
- **Title:** Ideally states the claim
- **Body:** Reasoning, evidence, implications—written to be understood without context
  - Ahrens' rule of thumb: "Each note should fit on the screen without scrolling"
  - Keep it loose, not worksheet-like
- **Created_at:** Timestamp
- **Updated_at:** Timestamp
- **Author:** Always visible
- **Source trail:** Metadata showing which fleeting note was promoted (visible to admin only)

**Note Display Elements:**
Each permanent note shows:
- Title (the claim)
- Creator name
- Created date
- Last updated date
- Body content
- Backlinks (all notes that [[link]] here, with context sentences)
- Local graph (visualize connections at 1-3 levels)
- Margin comments count
- Hub status badge (if 5+ incoming [[links]])

**Creation Method:**  
Can ONLY be created by promoting a fleeting note. When promoted, the note changes state from private (fleeting) to public (permanent). It's the same note, but now visible to all students and held to higher standards.

**LLM Evaluation Criteria (0-4 scale):**  
Based on Ahrens' Zettelkasten principles:
- **Single idea:** Note contains one clear, coherent idea (not multiple unrelated thoughts)
- **Standalone comprehension:** Can be understood without reading the source or other notes
- **Clear claim:** Makes an arguable or insightful statement
- **Coherent and well-developed:** Complete thoughts, not fragments
- **Evidence of synthesis:** Connects ideas, doesn't just restate sources
- **Originality:** Shows student's thinking, not just summarization
- **Appropriate scope:** Fits on screen without scrolling

**Features:**
- **Generate embeddings:** For semantic search
- **Points:** LLM score × 2 (0-8 points) awarded once on approval
- **Editable after approval:** Students can revise anytime
  - **Major edits trigger re-review:** Adding significant text or new [[links]] triggers automatic LLM re-evaluation
  - No additional points awarded for the note itself (already earned)
  - New [[links]] earn points normally (2 points each if substantive)
- **Cannot be deleted:** Permanent notes are truly permanent - maintains graph integrity
- **Can receive annotations:** Margin comments from classmates
- **[[Link]] target:** Other students can [[link]] to this note from their permanent or fleeting notes
- **Supports all link types within body:**
  - [[wiki_links]] to other permanent notes, fleeting notes (own only), and sources
  - @mentions to classmates
  - [hyperlinks](url) to external resources
- **Incoming [[links]]:** Author earns 2 points each time someone [[links]] to this note
- **Hub status:** Notes with 5+ incoming [[links]] earn badges and grow visually in graph

**Minimum Quota:** 3 per week (must pass LLM approval)

---

### THE PROMOTION WORKFLOW

This is the heart of the pedagogical model—the conscious decision to make private thinking public.

**The Core Principle:**
A fleeting note doesn't get "combined" or "recreated" - it simply **changes state** from private to public. The note itself remains the same; its visibility and requirements change.

**Step 1: Student Writes Fleeting Note**
- Creates note in Inbox
- Title auto-generated ("Note #47" or timestamp)
- Student can update title while writing
- Writes content, [[links]] to sources, @mentions classmates
- Note is private to them (visible to teacher)

**Step 2: Student Decides to Promote**
- When note feels ready, clicks **"Promote"** button on that note
- System checks: **Does this note have a descriptive title?**
  - If YES → Proceeds to Step 3
  - If NO → Inline prompt: "Add a descriptive title before promotion"
  - Student updates title (should state the claim)
  - Clicks "Submit for Review"

**Step 3: Async LLM Evaluation**
- Loading state appears: "Reviewing your thinking..."
- **"Keep working" button** allows student to navigate away
- Student can continue creating other notes
- LLM evaluates against Zettelkasten criteria (takes a few seconds)
- When complete, student receives notification

**Step 4A: Approval Path**
- Notification: "Your note '[Title]' was approved! +6 points"
- **Note moves from Inbox → Notes** (changes visibility from private to public)
- Note status changes to "permanent"
- Appears in public knowledge graph
- Classmates can now see, [[link]] to, and annotate it
- Feed shows: "New permanent note by [Student]"

**Step 4B: Rejection Path**
- Notification: "Your note needs revision"
- **Note stays in Inbox** with "Needs Revision" badge
- Shows LLM score (0-3) and specific feedback:
  - "This note contains multiple unrelated ideas. Focus on one: either trust OR authenticity, not both."
  - "This would be hard to understand without reading the source. Add context about what you mean by 'algorithmic trust.'"
  - "This closely paraphrases the source. What's YOUR insight?"
- Student can edit and re-promote **unlimited times**
- **No point penalty for failed attempts**
- Badge remains until note is approved or student deletes it

**Step 5: Post-Approval**
- Note lives in Notes section (public)
- Shows author name prominently
- Visible in knowledge graph
- Can be [[linked]] to and annotated by classmates
- Author can still edit (significant changes may trigger re-review)
- Author earns 2 points each time someone [[links]] to this note

**Key Pedagogical Principle:**
This is not about combining multiple fleeting notes. If a student wants to synthesize ideas from several fleeting notes, they write that synthesis in a new fleeting note, then promote THAT note. The Inbox is their workspace for developing ideas until they're ready to go public.

**Technical Implementation:**
- Promotion changes `note.type` from 'fleeting' to 'permanent'
- Promotion changes `note.visibility` from 'private' to 'public'
- If rejected, `note.status = 'needs_revision'` + badge displayed
- If approved, note physically moves to Notes collection
- Updates embeddings after approval
- Triggers notifications
- Updates point totals

---

## PART 2: SOURCES, CONNECTIONS & COLLABORATION

### SOURCES SYSTEM

**What are Sources?**  
Texts, articles, books, videos—anything students engage with in the course. Sources are entities in the system that students can [[link]] to from their notes.

**Source Fields (MLA Format):**
- **Author(s):** Full name(s) of author(s)
- **"Source":** Title of article/chapter/work
- **Container:** Title of book/journal/website where source appears
- **Publisher:** Publishing organization
- **Year:** Publication year
- **URL:** Web address (optional but recommended)
- **Source type:** book, article, video, podcast, etc. (for system categorization)

**Source Creation in v0.5:**
- Only teachers/admin can create sources
- Admin interface to add new sources with MLA fields
- Sources appear in [[link]] autocomplete when students type
- Example: typing `[[how to take smart]]` suggests "How to Take Smart Notes by Sönke Ahrens"

**Note:** Student-created sources with duplicate detection is deferred to v0.6

**Sources in the Knowledge Graph:**

**Visual Representation:**
- Sources appear as special nodes
- Visually distinct (different color/shape from notes—book icon or rectangular shape)
- **Filtered out by default** when viewing graph
- Students can toggle "Show Sources" to see them

**Functionality:**
- Clicking source node shows:
  - Source details (title, author, etc.)
  - All notes that link to it (across all students)
  - Who's engaged with this source most
- Useful for teacher: see which sources are being used/ignored

**Teacher Analytics:**
- Dashboard shows:
  - Which sources each student has engaged with (count of [[links]])
  - Frequency of engagement per source
  - Students not engaging with assigned readings
  - All student notes connected to a particular source
  - Timeline of source engagement

---

### LLM EVALUATION SYSTEM

**Two Types of Checks:**

#### 1. Coherence Check (Fleeting Notes)

**Purpose:**  
Prevent spam and keyboard mashing. Ensure actual text exists.

**Criteria:**
- Is this coherent text?
- Does it form complete thoughts?
- Is it in English (or target language)?
- Not random characters or spam

**Process:**
- Runs automatically when student creates fleeting note
- Very fast (should feel instant)
- Binary result: pass or fail

**Scoring:**
- Pass/Fail only
- No quality evaluation
- No synthesis assessment

**Feedback (if fail):**
- Simple, brief message
- Example: "This doesn't appear to be coherent text. Please write complete thoughts."
- No suggestions for improvement (that comes with permanent notes)

**Points:**
- 1 point if pass
- 0 points if fail
- Can retry immediately after editing

**Student Experience:**
- Types note
- Clicks save
- If coherent: "Note saved! +1 point"
- If not: "Please write coherent text" + can edit and retry

---

#### 2. Quality Evaluation (Permanent Notes)

**Purpose:**  
Ensure notes meet Zettelkasten principles from Ahrens. This is where real assessment happens.

**Scoring Scale:**
- **0:** No Evidence (fails all criteria)
- **1:** Beginning (meets 1-2 criteria)
- **2:** Developing (meets 3-4 criteria)
- **3:** Proficient (meets 5-6 criteria)
- **4:** Advanced (exceeds all criteria)

**Criteria Based on Ahrens:**
1. **Single idea:** Contains one clear idea, not multiple unrelated concepts
2. **Standalone:** Can be understood without external context
3. **Clear claim:** States an arguable or insightful position
4. **Coherent:** Well-developed, complete thoughts
5. **Synthesis:** Connects ideas from multiple sources/notes, not just restating
6. **Originality:** Demonstrates student's thinking, not just summary
7. **Appropriate scope:** Fits on screen (Ahrens' guideline)

**Process:**
- Runs when student clicks "Submit for approval" during promotion
- Takes longer than coherence check (few seconds)
- Returns score + detailed feedback

**Feedback Examples:**

*Score 4 (Advanced):*
"Excellent permanent note! You've articulated a clear claim about trust in digital spaces, synthesized ideas from multiple sources, and made an original connection between Wittgenstein and Postman. This stands alone beautifully. +8 points"

*Score 2 (Developing):*
"This is developing well but needs refinement:
- ✓ Clear claim about communication breakdown
- ✓ Coherent writing
- ✗ Currently restates Chiang's argument without adding your interpretation
- ✗ Would be hard to understand without reading the source—add more context
Try this: What's YOUR insight about why this matters?"

*Score 0 (No Evidence):*
"This note needs significant work:
- Contains three separate ideas (memory, AI, and democracy)—choose one
- Reads like raw notes from the text, not your synthesis
- No clear claim or argument
Consider: What's the single most important idea here? What do YOU think about it?"

**Points:**
- Score × 2 (so 0, 2, 4, 6, or 8 points)
- Higher scores reward better thinking

**Retry Process:**
- Unlimited attempts
- No penalty for failing
- Each attempt gets fresh feedback
- Student can see improvement over attempts

**Teacher Override:**
- Teacher can review any LLM evaluation
- Can change score up or down
- Can add comments
- Override visible to student: "Teacher adjusted your score to 4: This synthesis is exactly what we're looking for."

**Evaluation History:**
- System stores all attempts for each note
- Teacher can see: "Student submitted 3 times, scores 1→2→3, showing growth"
- Useful for assessing effort and learning

---

### INLINE [[LINKING]] SYSTEM

**Purpose:**  
Connections between notes happen naturally through writing, not through separate UI. When students [[link]] to other notes within their writing, they create the knowledge graph organically.

**How It Works:**

**Creating Links:**
- While writing any note (fleeting or permanent), type `[[`
- Autocomplete menu appears showing:
  - Other permanent notes (theirs and classmates')
  - Sources
  - Own fleeting notes (if in a fleeting note)
  - Filtered by what they're typing
- Select to insert link
- Link appears inline in the text: `[[Writing is thinking]]`

**Example:**
```
The best note-taking system encourages students to write because, 
as Ahrens points out in [[How to Take Smart Notes]], 
[[Writing is thinking]]. This connects to [[Sarah's note about 
algorithmic trust]] because both argue that process creates 
understanding, not just records it.
```

This note creates three connections:
1. To source: "How to Take Smart Notes"
2. To own permanent note: "Writing is thinking"
3. To classmate's note: "Sarah's note about algorithmic trust"

**The Graph Automatically Forms:**
- Every [[link]] creates an edge in the knowledge graph
- No separate "connection creation" interface needed
- The sentence surrounding the link IS the explanation
- Graph visualizes these relationships

**Link Quality & Points:**

**Outgoing Links (You link to others):**
- **Substantive link:** 2 points
  - LLM checks: Is this link used in context, or just listed?
  - Example (substantive): "As [[Writing is thinking]] argues, the act of writing creates insight"
  - Example (not substantive): "Related: [[Writing is thinking]] [[Another note]] [[Yet another]]"
- **Bonus:** +1 point for linking to a classmate's permanent note
- Permanent notes don't HAVE to link to other notes, but earn extra points for doing so

**Incoming Links (Others link to you):**
- **Passive points:** 2 points each time someone [[links]] to your note
- Rewards creating excellent, reference-worthy notes
- Your note becomes a "hub" when it reaches 5+ incoming links

**LLM Substantiveness Check:**
- When student saves note with [[links]], LLM evaluates each link
- Criteria: Is the link integrated into an argument/explanation?
- Fast check (runs with coherence/quality evaluation)
- Only substantive links earn points

**Backlinks Display:**

**On Each Note:**
- "Backlinks" section shows all notes that [[link]] to this one
- Displays the **sentence/context** where the link appears
- Example:
  ```
  Backlinks (3):
  
  Mike's "Trust in Digital Spaces"
  "...As [[Writing is thinking]] argues, the act of writing creates 
  insight, which means algorithmic systems can't truly understand trust..."
  
  Sarah's "Synthesis vs Summary"
  "[[Writing is thinking]] is key here - synthesis requires active 
  creation, not passive recording..."
  ```
- Clickable to navigate to full note
- Shows how your ideas are being used by others

**In the Knowledge Graph:**

**Visual Representation:**
- Nodes = notes
- Edges = [[links]] between notes
- Click edge → popup shows the sentence where link appears
- Hover over edge → preview of context

**Weekly Quota:**
- Your permanent notes should contain substantive [[links]] to other permanent notes
- **Minimum:** At least 2 [[links]] to classmates' permanent notes per week
- Encourages building on others' thinking
- Links within context, not just listed at end

**Search & Suggestions:**

**While Writing:**
- Sidebar suggests related notes based on embeddings
- "You might want to [[link]] to these:"
  - Shows semantically similar permanent notes
  - Includes own notes and classmates'
- One-click to insert [[link]]

---

### @MENTIONS SYSTEM

**Purpose:**  
Create social learning and intellectual dialogue through direct references to classmates.

**How It Works:**
- Student types `@` in any note (fleeting or permanent)
- Autocomplete menu appears with list of classmates
- Select student to mention
- In note text: "@Sarah" appears as clickable link

**Notifications:**
- Mentioned student receives notification
- Shows context: which note, what it says
- Link to view the note
- Mentioned student earns 1 point

**Points:**
- Mentioning student earns 1 point (if substantive)
- Mentioned student earns 1 point
- Light LLM check to prevent spam: "Is this a meaningful reference or just '@sarah hi'?"

**Use Cases:**
- In fleeting note: "@Mike, what did you mean in class about compression vs. understanding?"
- In permanent note: "@Sarah, this connects directly to your claim about trust being algorithmic"
- Building collaborative threads of thought

**No Minimum Quota in v0.5:**
- Encourage but don't require
- Let it develop organically
- May add quota in v0.6 if underutilized

**Privacy Note:**
- @mentions in fleeting notes: only visible to teacher and mentioned student
- @mentions in permanent notes: visible to everyone

---

### MARGIN COMMENTS

**Purpose:**  
Quick reactions, questions, dialogue—creates intellectual conversation directly on classmates' permanent notes.

**Scope:**
- Only available on permanent notes (public notes)
- Cannot comment on fleeting notes (those are private workspace)

**How It Works:**
1. Reading a classmate's permanent note
2. Highlight specific passage
3. Click "Add comment"
4. Write comment in popup
5. Publish (public to all)
6. Others can reply (threaded conversation)

**Display:**
- Comments anchored to specific text
- Hovering over highlighted text shows comment
- Comment count badge on note: "5 comments"
- Click to see all comments in sidebar

**Visibility:**
- Public to all students
- Teacher can see all
- Creates dialogue directly on the text

**Points:**
- 2 points per substantive comment
- Light LLM check to prevent spam ("nice!" doesn't count)
- Both commenter and note author earn points:
  - Commenter: 2 points for substantive comment
  - Note author: 1 point for receiving engagement

**Use Cases:**
- "This is a great point but have you considered X?"
- "Can you explain what you mean by 'algorithmic trust'?"
- "This connects to what we discussed Tuesday"
- Building collaborative dialogue around ideas

**No Minimum Quota:**
- Encourage but don't require
- Let commenting develop organically
- May add quota in v0.6 if underutilized

---

## PART 3: KNOWLEDGE GRAPH & NAVIGATION

### GRAPH VISUALIZATION

**Visual Design Principles:**
- Beautiful, inspired by Obsidian
- Not overwhelming even with hundreds of notes
- Interactive and explorable
- Multiple view modes

**Visual Elements:**

**Nodes (Notes):**
- **Fleeting notes:** One color (only visible to author + teacher)
- **Permanent notes:** Different color
- **Sources:** Distinct shape (book icon or rectangle), different color

**Node Appearance:**
- Size based on number of connections (hub notes are bigger)
- Author indicated by:
  - Color coding per student, OR
  - Initials on node, OR
  - Color border
- Hover shows preview
- Click opens note

**Edges (Connections):**
- Lines between connected notes
- Hover shows connection explanation (the sentence containing the [[link]])
- Click to see full relationship text
- Thickness could indicate connection quality

**Layout:**
- Force-directed graph (nodes repel, connections attract)
- Clusters form around related ideas
- Can drag nodes to rearrange
- Zoom in/out
- Pan around

---

### VIEW TOGGLES & FILTERS

**View Modes:**

**1. "My Notes Only"**
- Shows only student's permanent notes
- Their connections
- Sources they've linked to
- Clean, focused view

**2. "Whole Class"**
- Shows all permanent notes from all students
- Full collaborative graph
- Can get dense—needs good filtering

**Filter Options:**

**By Note Type:**
- Show/hide fleeting notes (only visible to author + teacher anyway)
- Show/hide permanent notes
- Show/hide sources (default: hidden)

**By Author:**
- Select individual students
- "Show only Sarah's contributions"
- Useful for seeing one person's thinking

**By Time Period:**
- "This week"
- "Unit 2"
- "Custom date range"
- Shows what's been added recently

**Search:**
- Integrated search bar
- Keyword search (titles and content)
- Semantic search (embedding-based)
- Results highlight in graph

---

### GRAPH INTERACTIONS

**Navigation:**
- **Click node:** Opens note in sidebar or modal (doesn't leave graph view)
- **Click edge:** Shows connection explanation (the sentence with the [[link]])
- **Double-click node:** Centers graph on that node and shows its local connections
- **Drag node:** Manually position (preference saved)
- **Zoom:** Mouse wheel or pinch
- **Pan:** Click and drag background

**Local Graph (Per Note):**
When viewing an individual note, show:
- **Level 1:** Notes that directly connect to this note
- **Level 2:** Notes that connect to Level 1 notes (2 degrees away)
- **Level 3:** Notes that connect to Level 2 notes (3 degrees away)
- Toggle between levels
- See how ideas propagate through the graph

**Export:**
- Export graph view as image (PNG or SVG)
- Share screenshot
- Include in presentations

**Visual Legend:**
- Color key showing what each color means
- Icon legend (fleeting, permanent, source)
- Author key if using color coding

---

### SEARCH & BROWSE

**Two Ways to Find Notes:**

**1. Keyword Search**
- Traditional text search
- Searches titles and body content
- Filter results by:
  - Note type
  - Author
  - Date range
- Results show in list with preview
- Click to open or highlight in graph

**2. Semantic Search (Embedding-Based)**
- Natural language queries
- "Find notes about trust in communication"
- Returns semantically similar notes even without exact keywords
- Works across all public permanent notes
- Useful for finding related ideas expressed differently

**Topic Clusters:**
- Graph algorithm automatically identifies groupings
- "These 15 notes form a cluster about trust"
- Visual distinction in graph (boundary line, color wash)
- Browse by clicking into clusters

---

### CLASS FEED

**Purpose:**  
Chronological stream of activity—see what's happening now.

**Content:**
- **New permanent notes published:** With preview snippet and author
- **New [[links]] made:** "Sarah [[linked]] to Mike's 'Authenticity online' in her note about trust"
- **Margin comments:** "3 new comments on your note"
- **Milestones:** "Sarah just published her 10th permanent note!"
- **@Mentions:** "You were mentioned in a note by Alex"
- **Hub notes:** "Your note reached 5 incoming [[links]]!"

**Features:**

**Filtering:**
- By note type (permanent notes only, comments only, etc.)
- By author ("Show only Sarah's activity")
- By time ("Today", "This week", "Unit 2")
- By activity type (just new notes, just connections, etc.)

**Starring/Bookmarking:**
- Star interesting items in feed
- Creates "Starred" collection for later review
- Useful for "I want to read this later"

**Interactions:**
- Click item to view full note
- Quick actions: "Comment", "View in graph"

**Placement:**
- Integrated into main dashboard
- Also accessible as separate "Feed" view
- Always visible in sidebar (or accessible via nav)

---

### NOTIFICATIONS SYSTEM

**Notification Triggers:**

**1. Direct Interactions:**
- Someone @mentions you (fleeting or permanent)
- Someone comments on your note
- Someone [[links]] to your note

**2. [[Link]] Activity:**
- Someone [[links]] to your note (+2 points)
- Suggested [[link]] appears for your note

**3. Point Milestones:**
- Earned 50/100/250/500 points
- Note received 5+ incoming [[links]] (hub note badge)

**4. Quota/Deadlines:**
- Weekly quota reminder ("You've created 2/10 fleeting notes this week")
- Unit deadline approaching

**5. Teacher Feedback:**
- Teacher comments on your note
- Teacher overrides LLM score
- Teacher sends announcement

**Notification Display:**

**Badge Count:**
- Icon in navigation shows unread count
- Persistent until dismissed

**Notification Panel:**
- Click to open
- List of notifications with:
  - Avatar/icon
  - Message
  - Timestamp
  - Link to relevant note/activity
- Mark as read
- Mark all as read

**Basic Email Notifications:**
- Important events trigger email (promotion results, @mentions)
- Daily digest option
- Weekly summary option
- **Note:** Full notification customization deferred to v0.6

---

## PART 4: GAMIFICATION & POINTS SYSTEM

### POINT STRUCTURE

**Creating Notes:**
- **Fleeting note:** 1 point (after passing coherence check)
- **Permanent note:** 0-8 points (LLM score × 2)

**Inline [[Linking]]:**
- **Substantive [[link]] to another note:** 2 points (LLM checks if link is used in context)
- **Bonus:** +1 point for [[linking]] to classmate's permanent note
- **Incoming link (passive):** 2 points when someone [[links]] to your note
- **Important:** [[Links]] in fleeting notes do NOT earn points. Points are only awarded when the note containing the [[link]] becomes permanent.
- Rewards both creating connections AND creating reference-worthy notes

**Collaboration:**
- **@Mention (substantive):** 1 point (both mentioner and mentioned)
- **Margin comment:** 2 points per substantive comment (1 point to note author for receiving engagement)

**Badges (One-Time Bonuses):**
- **Hub note created** (5+ incoming [[links]]): 10 points
- **Week streak** (meet quotas 3 weeks straight): 5 points

**No Points Lost:**
- Failed LLM checks: 0 penalty
- Unlimited retries encouraged
- Growth mindset approach

---

### LEADERBOARD

**Public Leaderboard:**
- Visible to all students
- Shows rankings by total points
- Can toggle views:
  - Total points (all time)
  - This week
  - This unit
  - By note type (permanent note leaders, connection leaders, etc.)

**Display:**
- Top 10-20 students
- Current student's rank always visible
- Anonymous option possible (show rank but not name)

**Unit-to-Unit Comparison:**
- See growth: "Unit 1: 125 points → Unit 2: 180 points (+55)"
- Track improvement
- Identify patterns

**Competitive but Collaborative:**
- Celebrate top performers
- But also reward collaboration
- "Most collaborative student" category (helps others most)

---

### GRADE INTEGRATION

**Category B Grade:**
- Points directly determine Zettelkasten grade
- This is one of two categories:
  - **Category A:** In-class engagement (discussions, etc.)
  - **Category B:** Zettelkasten work (this system)

**Grade Calculation:**
- Point thresholds: TBD after Unit 1 data
- Will adjust based on actual point distributions
- Aim for reasonable distribution

**Dashboard Display:**
- Students see: "You have 245 points"
- Below that: "Current grade: B+"
- Below that: "Need 30 more points for A-"
- Transparent and motivating

**The Living Codex (Separate Grades):**
- Books I-IV: Graded separately as traditional essays
- Submitted to Canvas
- Traditional rubric evaluation
- But built from Codex Machina permanent notes
- **Note:** Outline assembly tool deferred to v0.6

**Weekly Quotas:**

**Minimums Required:**
- 10 fleeting notes (must pass coherence check)
- 3 permanent notes (must pass LLM approval)
- Permanent notes should include substantive [[links]] to other permanent notes
- At least 2 [[links]] to classmates' permanent notes per week
- No quota for @mentions or comments (yet)

**If Quotas Not Met:**
- Student doesn't earn minimum points
- Dashboard shows deficit clearly
- Intervention flag for teacher
- No hard lockout (can still use system)

**Anti-Gaming Measures (Minimal for v0.5):**
- LLM checks prevent obvious gaming (substantiveness of [[links]])
- Will monitor for patterns
- May add measures in v0.6 if needed
- Trust students initially

---

## PART 5: TEACHER DASHBOARD

### INDIVIDUAL STUDENT VIEW

**Student Profile:**

**Overview Tab:**
- Student name, photo
- Total points to date
- Current grade
- Quota completion (green/yellow/red indicators)
- Recent activity summary

**Notes Tab:**
- All fleeting notes (remember: private to student but visible to teacher)
- All permanent notes
- Filterable by date, unit, type
- Sortable by points earned
- Search within student's notes
- Can see which fleeting notes were promoted vs. still in inbox

**Connections Tab:**
- All [[links]] made
- Quality scores (substantiveness)
- Who they're connecting to (collaboration patterns)
- Connections to own notes vs. classmates

**Analytics Tab:**
- Point breakdown (fleeting, permanent, links, collaboration)
- Weekly/unit trends (line graph showing activity)
- LLM score averages over time
- Promotion success rate (% of attempts that pass)

**Source Engagement Tab:**
- Which sources this student has [[linked]] to
- Frequency of engagement
- Timeline: when they engaged with each source
- Identify: not engaging with assigned reading

**Network Map:**
- Graph showing just this student's notes
- Their connections
- Who they collaborate with most

---

### TEACHER ACTIONS ON INDIVIDUAL STUDENTS

**Commenting:**
- Can comment on any note (fleeting or permanent)
- Comments visible to student
- Creates notification

**Score Override:**
- View LLM evaluation
- Can adjust score up or down
- Must add explanation
- Override visible to student: "Teacher adjusted to 4: Excellent synthesis"

**Quota Tracking:**
- Visual dashboard showing completion
- Green: met quota
- Yellow: approaching deadline
- Red: behind

**Intervention Flags:**
- System automatically flags:
  - Consistently low LLM scores
  - Not meeting quotas
  - Zero collaboration (no classmate connections)
  - Not engaging with assigned sources
- Teacher can add manual flags
- Creates to-do list for check-ins

---

### CLASS OVERVIEW

**Dashboard:**

**Activity Heat Map:**
- Who's contributing when
- Visual grid: students × weeks
- Color intensity = activity level
- Identify disengaged students at a glance

**Quality Alerts:**
- "5 students have low-quality permanent notes this week"
- "3 students haven't met fleeting note quota"
- "4 students haven't engaged with Unit 2 readings"
- Clickable to see details

**Most-Connected Notes:**
- Which permanent notes are hubs (most connections)
- Who created them
- Why are they valuable?

**Collaboration Metrics:**
- Network graph showing student interactions
- Who's working together
- Who's isolated
- Density of @mentions, connections

**Source Engagement Dashboard:**
- Which sources are most/least engaged with
- Which students haven't linked to assigned readings
- Timeline of class engagement with each source

**Class Feed:**
- Same as student feed but shows all activity
- Filter to specific students/time periods

---

### COMPARISON TOOLS

**Side-by-Side Graph:**
- Select two students
- View their graphs simultaneously
- Compare connection patterns
- Identify different thinking styles

**Unit-to-Unit Performance:**
- Class-wide statistics per unit
- Average points earned
- Average LLM scores
- Improvement trends

**Class Statistics:**
- Total notes created
- Total connections
- Most prolific contributors
- Most collaborative students

---

### GRADING & EXPORT TOOLS

**Grade Export:**
- Export point totals for gradebook
- CSV format compatible with Canvas/Schoology
- Include breakdown by category
- Include current grade prediction

**Batch Operations:**
- Comment on multiple students' notes
- Override scores in bulk (if pattern detected)
- Send announcements to groups

**Reports:**
- Generate PDF reports per student
- Include analytics, graphs, sample notes
- Useful for parent conferences or progress reports

---

### COMMUNICATION TOOLS

**Announcements:**
- Create in-app announcements visible to all
- Pin to top of dashboard
- Can target specific students or whole class
- Examples:
  - "Great work on Unit 1! Now focus on destabilizing your Book I claims"
  - "Reminder: Book I outlines due Friday"

**Targeted Prompts:**
- Send personalized suggestions
- "You've made great connections lately—try responding to Sarah's note about trust"
- Nudge without being pushy

**Weekly Email Reports:**
- Automated weekly email to teacher
- Summary: "Here's what happened in Codex Machina this week"
- Highlights: Most active students, most-connected notes
- Alerts: Students needing intervention
- Trends: Class improving or struggling

---

## PART 6: TECHNICAL REQUIREMENTS

### BACKEND (MAINTAIN EXISTING)

**Supabase Database:**
- User authentication
- Data storage
- Real-time updates

**Embedding Generation:**
- For all notes (fleeting and permanent)
- For semantic search and connection suggestions
- Using OpenAI embeddings or similar

**Existing Components to Keep:**
- User auth system
- Basic database schema (will extend)
- API structure

---

### NEW DATABASE SCHEMA NEEDS

**Tables to Add/Modify:**

**Notes Table:**
- `note_id` (primary key)
- `user_id` (foreign key)
- `note_type` (enum: 'fleeting', 'permanent')
- `note_status` (enum: 'active', 'needs_revision', 'approved')
- `title`
- `body` (markdown)
- `created_at`
- `updated_at`
- `promoted_at` (timestamp when became permanent, nullable)
- `llm_score` (nullable for fleeting, required for permanent)
- `llm_feedback` (text, stored for rejected notes)
- `embedding` (vector)
- `visibility` (enum: 'private', 'public')

**Note:** When a fleeting note is promoted:
- `note_type` changes from 'fleeting' to 'permanent'
- `visibility` changes from 'private' to 'public'
- If approved: `note_status = 'approved'`, `promoted_at = current timestamp`
- If rejected: `note_status = 'needs_revision'`, stays in inbox
- Same note record, different state

**Sources Table:**
- `source_id` (primary key)
- `title`
- `author`
- `container`
- `publisher`
- `year`
- `url` (optional)
- `source_type` (book, article, video, etc.)
- `created_by` (user_id)
- `created_at`

**Links Table:**
- `link_id` (primary key)
- `from_note_id` (foreign key to note containing the [[link]])
- `to_note_id` or `to_source_id` (foreign key - what's being linked to)
- `link_type` (enum: 'note', 'source')
- `context_sentence` (the sentence containing the [[link]])
- `is_substantive` (boolean - LLM evaluated)
- `points_awarded` (0 or 2 or 3 if bonus)
- `created_at`

**Note:** Links are parsed from note body when saved. Every [[link]] creates a record here. System extracts the surrounding sentence as context. LLM evaluates if link is substantive (used in argument vs just listed).

**Mentions Table:**
- `mention_id` (primary key)
- `note_id` (foreign key)
- `mentioning_user_id`
- `mentioned_user_id`
- `is_substantive` (boolean - LLM evaluated)
- `created_at`

**Comments Table:**
- `comment_id` (primary key)
- `note_id` (foreign key)
- `user_id` (foreign key)
- `comment_text`
- `anchor_text` (the passage being commented on)
- `parent_comment_id` (for threading, nullable)
- `is_substantive` (boolean - LLM evaluated)
- `created_at`

**Points Table:**
- `point_id` (primary key)
- `user_id` (foreign key)
- `point_type` (enum: fleeting, permanent, link, mention, comment, hub_bonus, streak_bonus)
- `amount`
- `reason` (text description)
- `related_note_id` (nullable)
- `created_at`

**Notifications Table:**
- `notification_id` (primary key)
- `user_id` (foreign key)
- `notification_type` (enum: mention, comment, link, promotion_result, quota_reminder, teacher_comment, etc.)
- `content` (text)
- `related_note_id` (nullable)
- `read_status` (boolean)
- `created_at`

**Quotas Table:**
- `quota_id` (primary key)
- `user_id`
- `week_starting` (date)
- `fleeting_count`
- `permanent_count`
- `classmate_link_count`

---

### LLM INTEGRATION

**Three Evaluation Endpoints:**

**1. Coherence Check (Fleeting Notes):**
- Input: Note text
- Output: Pass/Fail + brief message if fail
- Fast (< 1 second)
- Simple prompt

**2. Quality Evaluation (Permanent Notes):**
- Input: Note text
- Output: Score (0-4) + detailed feedback
- Based on Ahrens criteria
- Longer prompt with examples
- Takes few seconds

**3. Substantiveness Check (Links, Mentions, Comments):**
- Input: Context of usage
- Output: Pass/Fail (is this substantive or spam?)
- Fast check
- Prevents gaming

**Optional (can add later):**
- Tag suggestion
- Improvement suggestions

**Must Support:**
- On-demand evaluation (student clicks "check")
- Automatic evaluation (on publish)
- Async evaluation (student can navigate away)
- Store evaluation history
- Multiple LLM providers (OpenAI, Anthropic, etc.)

---

### EMBEDDING SYSTEM

**Generate Embeddings:**
- For all notes (fleeting and permanent)
- On creation and update
- Store in database (vector column)

**Semantic Similarity Search:**
- Query: "find notes about trust"
- Returns: Top N most similar notes by embedding distance
- Works across all public permanent notes

**Connection Suggestions:**
- When viewing note, find semantically similar notes
- Rank by similarity score
- Present as suggestions in sidebar
- Both within student's notes and classmates'

**Topic Clustering:**
- Periodically run clustering algorithm
- Identify natural groupings
- Visualize in graph

---

### FEATURES TO REMOVE/ARCHIVE

**Delete from Current Build:**
- Questions feature (remove entirely)
- Signals/Quests (remove entirely)
- Reflections (move to v0.6)
- Literature notes concept (replaced by fleeting notes with source [[links]])
- XP/SP split (unified points system)
- **Response notes** (cut entirely - not in any version)
- **Forking notes** (cut entirely - not in any version)
- **Tags system** (moved to v0.6)
- Any gamification not specified in this doc
- Complex dashboard widgets not aligned with new design
- Outline assembly (moved to v0.6)
- Drafts in-system (moved to v0.6)
- Student-created sources (moved to v0.6)

**Delete All Current User Data:**
- Wipe existing database
- Create clean schema
- Generate test data for development

**Test Data to Create:**
- 3 sections with 12-16 test students each
- Each student with:
  - Mix of fleeting notes (some coherent, some needing revision)
  - Mix of permanent notes (various quality scores)
  - [[Links]] between notes with context sentences
  - Some @mentions
  - Some margin comments
  - Realistic point distributions
- Sample sources (5-10 books/articles)
- Show full workflow: fleeting → promotion → approval/rejection → permanent

---

## PART 7: UI/UX SPECIFICATIONS

### DESIGN PRINCIPLES

**Inspired by Bear and Obsidian:**
- **Clean, minimal interface**
- **Beautiful typography** (serif for reading, sans for UI)
- **Spacious layouts** (generous whitespace)
- **Smooth animations** (not jarring)
- **Dark mode** (primary aesthetic)
- **Fast and responsive**

**Not a Chore:**
- Every interaction should feel pleasant
- No friction in note creation
- Delightful micro-interactions
- Encouraging feedback messages

**Virtuous Circle:**
- Visual rewards for thinking
- Progress visible
- Accomplishment feels good
- Want to return

---

### MAIN NAVIGATION

**Primary Nav:**
- Dashboard (home icon)
- Inbox (fleeting notes icon)
- Notes (permanent notes icon)
- Graph (network icon)
- Feed (activity icon)
- Search (magnifying glass)

**Secondary Nav (Top Right):**
- Notifications (bell icon with badge)
- Profile/Settings (avatar)

**Mobile Responsive:**
- Hamburger menu on small screens
- Bottom nav bar on mobile

---

### NOTE CREATION FLOW

**FLEETING NOTES:**

**Interface:**
- Click "New Note" in Inbox
- Full-screen minimal editor (or modal)
- Just title and body
- Markdown toolbar (optional, can hide)
- As you type, suggestions appear:
  - [[link]] autocomplete
  - @mention autocomplete

**Quick Save:**
- Auto-saves as you type (draft)
- Click "Save" to finalize
- LLM coherence check runs
- If pass: "Note saved! +1 point" with subtle animation
- If fail: "Please write coherent text" + edit mode

**Zero Friction:**
- Should take 30 seconds to capture a thought
- No required fields beyond basic text
- No complex formatting needed

---

**PERMANENT NOTES (PROMOTION):**

**Only via Promotion:**
- Cannot create permanent notes directly
- Must promote a fleeting note from Inbox

**Promotion Interface:**
1. **Student clicks "Promote" button** on a fleeting note in Inbox
2. **Title check:**
   - System checks if note has descriptive title
   - If NO: Inline prompt appears: "Add a descriptive title before promotion"
   - Student updates title field
   - If YES: Proceeds immediately
3. **Optional guidance reminder (sidebar/tooltip):**
   - Quick reminder of Ahrens principles
   - "Does this state a clear claim?"
   - "Can this be understood without context?"
   - Not blocking, just helpful
4. **Submit:**
   - Big clear button: "Submit for Review"
   - Loading state: "Reviewing your thinking..."
   - **"Keep working" button** to navigate away
5. **Async result:**
   - Notification when evaluation completes
   - Click to see result

**Result Screens:**

**If Approved (Score 4):**
- Celebration screen
- "Excellent! +8 points"
- Note has moved to Notes section
- "View in graph" button

**If Rejected (Score 0-3):**
- Feedback screen
- Score and specific suggestions
- "Edit and resubmit" button
- Note still in Inbox with "Needs Revision" badge
- No shame, just guidance

**Retry Process:**
- Edit note directly in Inbox
- Click "Promote" again when ready
- Same flow, fresh evaluation
- Unlimited attempts

---

### ANNOTATION FLOW

**MARGIN COMMENTS:**
- Highlight text in permanent note
- Popup appears: "Comment on this"
- Click to open comment box
- Write comment
- Publish
- Comment anchored to text
- Others can reply (thread)

---

### GRAPH INTERACTION

**Main Graph View:**
- Full-screen canvas
- Notes as nodes, connections as edges
- Pan by dragging
- Zoom with wheel/pinch
- Click node: opens note in sidebar
- Click edge: shows explanation (the sentence with [[link]])
- Double-click node: focus on local graph

**Sidebar:**
- When note selected, sidebar shows:
  - Full note content
  - Backlinks
  - Local graph view
  - Comments
  - Quick actions (comment, view in graph)

**Filter Panel:**
- Slide-out from right (or left)
- Checkboxes for:
  - Note types
  - Authors
  - Date ranges
- Apply filters
- Graph updates in real-time

**Visual Legend:**
- Always visible (bottom right corner)
- Color key
- Icon key
- Can minimize if desired

---

### DASHBOARD

**Welcome Section:**
- "Welcome back, [Name]"
- Current point total (big number)
- Current grade prediction
- "You're 30 points from A-"

**Quota Tracker:**
- Progress bars:
  - Fleeting notes: 7/10 this week
  - Permanent notes: 2/3 this week
  - Classmate links: 4/2 this week
- Visual: green (met), yellow (almost), red (behind)

**Class Feed (Integrated):**
- Recent activity stream
- Scroll to see more
- Filter options
- Star items

**Quick Actions:**
- Big buttons:
  - "Create fleeting note"
  - "View my graph"
  - "Explore classmates' notes"

**Leaderboard Widget:**
- Top 5 students
- "You're #8"
- Link to full leaderboard

**Notifications Panel:**
- Recent notifications (3-5)
- "See all" link

---

## PART 8: SUCCESS CRITERIA FOR V0.5

### STUDENTS CAN:

1. Create fleeting notes with minimal friction in private inbox
2. [[Link]] to sources to track reading engagement
3. @Mention classmates in both fleeting and permanent notes
4. Promote fleeting notes to permanent notes with single button
5. Submit for LLM approval and receive score + detailed feedback
6. Retry unlimited times after rejection without penalty
7. Create [[links]] to other notes within their writing (inline linking)
8. Receive [[link]] suggestions based on embeddings
9. See shared knowledge graph with all permanent notes
10. Filter and navigate graph effectively (toggle sources, filter by author/time)
11. Add margin comments to permanent notes
12. Use semantic search to find related ideas
13. Track points and grade in real-time on dashboard
14. View public leaderboard and compare performance
15. Receive notifications about interactions, promotions, and points
16. Meet weekly quotas (fleeting, permanent, classmate [[links]])
17. Experience beautiful, pleasant UI that encourages return

### TEACHERS CAN:

1. See all student fleeting notes (students can't see each other's)
2. Track source engagement via [[link]] analytics
3. Monitor promotion attempts and approval rates
4. View individual student dashboards with full analytics
5. See quality metrics and trends over time
6. Comment on any notes (fleeting or permanent)
7. Override LLM scores with explanations
8. Identify students needing intervention via automatic flags
9. Compare students' graphs side-by-side
10. View collaboration patterns and @mention networks
11. Export grades for external gradebook
12. Create announcements and targeted prompts
13. Receive weekly email reports with class summary
14. Track quota completion with visual indicators
15. See class-wide statistics and trends
16. Understand which sources are being used/ignored
17. Monitor intellectual growth through note quality over time
18. Assess Category B (Zettelkasten) work effectively via points

### SYSTEM PERFORMS:

1. Accurate LLM coherence checks (fast, binary)
2. Quality LLM evaluations based on Ahrens principles (0-4 score)
3. Substantiveness checks for [[links]], @mentions, comments
4. Helpful, specific feedback for improvement
5. Embedding generation for all notes
6. Semantic similarity search returning relevant results
7. Connection suggestions that make sense
8. Real-time point calculation and display
9. Reliable notification delivery (in-app and basic email)
10. Clean graph visualization even with hundreds of notes
11. Fast search (keyword and semantic)
12. Smooth, pleasant UI with no lag
13. Secure authentication and privacy controls
14. Data persistence and backup
15. Mobile responsiveness (works on phones/tablets)
16. Accurate quota tracking and alerts

---

## PART 9: IMPLEMENTATION PRIORITIES

### PHASE 1: CORE MVP (WEEKS 1-3)

**Foundational:**
1. Two-tier note system (fleeting, permanent) with privacy controls
2. Promotion workflow with async LLM approval and "Needs Revision" badges
3. Basic graph visualization with filters
4. Point tracking and display
5. User authentication
6. Teacher dashboard (basic views)

**Notes:**
- Fleeting note creation (coherence check)
- Permanent note promotion (quality evaluation)
- Embedding generation
- Basic inline [[linking]]

**Must Work:**
- Student can create fleeting notes
- Student can promote to permanent
- LLM evaluates and provides detailed feedback
- Points are awarded correctly
- Teacher can see student work including private fleeting notes

---

### PHASE 2: COLLABORATION (WEEKS 4-6)

**Social Features:**
7. @Mentions system with notifications and substantiveness checks
8. Sources system (teacher creates, students [[link]])
9. Shared knowledge graph (all permanent notes visible)
10. Margin comments with threading
11. Inline [[linking]] with substantiveness evaluation

**Must Work:**
- Students can @mention each other
- Students can [[link]] to sources
- Students see classmates' permanent notes
- Students can comment on notes
- Notifications delivered for interactions
- Backlinks display with context sentences

---

### PHASE 3: NAVIGATION & DISCOVERY (WEEKS 7-9)

**Finding & Connecting:**
12. Semantic search (embedding-based)
13. Connection suggestions based on embeddings
14. Class feed with filtering
15. Graph filters and views (sources toggle, author filter, time periods)
16. Local graph (1-3 levels)
17. Hub note badges and visual indicators

**Must Work:**
- Search finds relevant notes
- System suggests good connections
- Feed shows activity
- Graph is filterable and navigable
- Sources can be toggled on/off

---

### PHASE 4: ASSESSMENT & POLISH (WEEKS 10-12)

**Teaching & Grading:**
18. Quota tracking and alerts with visual indicators
19. Leaderboard (public) with multiple views
20. Grade prediction calculator
21. Teacher advanced features:
    - Source engagement analytics
    - Promotion success rate tracking
    - Side-by-side comparison
    - Weekly reports
    - Announcements
22. Notifications system (in-app + basic email)
23. Beautiful UI polish (Bear/Obsidian aesthetic, dark mode)

**Must Work:**
- Quotas tracked automatically
- Leaderboard accurate
- Grade calculations correct
- Teacher tools fully functional
- UI feels delightful
- Source analytics show engagement patterns

---

### FUTURE (V0.6 AND BEYOND)

See separate v0.6 features document for:
- Outline assembly tool (for Living Codex Books)
- Tags system (#hashtags)
- Student-created sources with duplicate detection
- Reflections system (AI-driven metacognitive interviews)
- Drafts in-system
- Advanced analytics
- Mobile app optimization
- Anti-gaming measures (only if needed)
- Export/backup features
- Accessibility enhancements

---

## PART 10: FINAL NOTES

### COURSE CONTEXT - THE LIVING CODEX

**The Four Books:**
- **Book I (Unit 1 - Communication):** Students review permanent notes → create outline manually (v0.6 will have tool) → write braided essay in Word → submit to Canvas
- **Book II (Unit 2 - Computation):** New permanent notes destabilize Book I → students annotate physical Book I with marginalia → new insights become new permanent notes in Codex Machina
- **Book III (Unit 3 - Consciousness):** Hybrid narrative-essay from accumulated permanent notes
- **Book IV (Unit 4 - Creation):** Physical transformation of entire Codex palimpsest

**Note:** Students can still create Books in v0.5 by manually reviewing their permanent notes and writing externally. Outline assembly tool in v0.6 will streamline this process.

---

### DESIGN PHILOSOPHY

**Core Principles:**
- **Keep it loose:** Not worksheet-like, allow messy thinking
- **Enable exploration:** Students discover connections
- **Make invisible visible:** Thinking becomes assessable
- **Support collaboration:** Individual and collective learning
- **Writing IS thinking:** Everything serves this principle
- **Beautiful matters:** Aesthetic reinforces engagement
- **The promotion moment is crucial:** Conscious decision to make thinking public

**Ahrens' Wisdom:**
> "We learn something not only when we connect it to prior knowledge and try to understand its broader implications (elaboration), but also when we try to retrieve it at different times (spacing) in different contexts (variation), ideally with the help of chance (contextual interference) and with a deliberate effort (retrieval)." (Ahrens 120)

The system facilitates exactly this kind of learning, from the bottom up.

---

### ASSESSMENT PHILOSOPHY

**Points = Grades:**
- LLM provides consistent baseline assessment
- Teacher has final say (can override)
- Quality matters more than quantity (though quotas ensure minimum)
- Collaboration rewarded, not just individual work
- Growth mindset: unlimited retries, no penalties

**The Promotion Moment:**
- Most important pedagogical innovation
- Conscious decision to make thinking public
- Students learn from feedback
- Intellectual accountability without public rough drafts

---

## INSTRUCTIONS FOR ANTIGRAVITY

You are working on Codex Machina (React/Next.js + Supabase/Postgres).

**🧭 GOAL:** Fully implement Codex Machina v0.5 based on this comprehensive specification.

**📌 APPROACH:**

1. **Analyze current codebase** and identify:
   - Components to remove or archive (Questions, Signals, Reflections, old gamification)
   - Components that can be adapted (notes table, graph viz, user auth)
   - New components that must be built (promotion workflow, dual LLM evaluation, sources, etc.)

2. **Create phased implementation plan:**
   - Phase 1: Core MVP (notes, promotion, basic graph)
   - Phase 2: Collaboration (@mentions, sources, comments, [[linking]])
   - Phase 3: Navigation (search, feed, filters)
   - Phase 4: Assessment (quotas, leaderboard, teacher tools, polish)

3. **Technical requirements:**
   - Maintain Supabase data integrity
   - Preserve existing authentication
   - Extend database schema as specified
   - Implement dual LLM integration (coherence + quality evaluation)
   - Build embedding system for semantic search
   - Create dark mode UI inspired by Bear/Obsidian
   - Real-time point calculation
   - Async promotion workflow with notifications

4. **Data migration:**
   - **Delete all current user data**
   - Create clean schema matching specifications
   - Generate realistic test data:
     - 3 sections with 12-16 test students each
     - Mix of fleeting and permanent notes
     - [[Links]] with context sentences showing substantive vs non-substantive
     - Sample sources
     - @mentions and comments
     - Realistic point distributions
     - Show full workflow: fleeting → promotion → approval/rejection → permanent

5. **Key implementation notes:**
   - Promotion changes note state, doesn't create new note
   - [[Links]] are inline only, parsed from markdown
   - LLM checks happen at multiple points (coherence, quality, substantiveness)
   - Backlinks show context sentences
   - Sources filtered out by default in graph
   - Teacher sees all fleeting notes, students only see their own
   - Points awarded in real-time for all actions

---

**Focus on creating a minimum loveable product that teachers and students will actually use—clean, focused, and powerful. Every feature should directly support the Zettelkasten workflow or make assessment possible.**

**The goal: Make thinking visible, collaborative, and rewarding. Build a system where students WANT to think because thinking feels good.**
