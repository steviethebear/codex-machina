# v0.5 Master Testing Guide

This document covers the verification steps for the v0.5 release series, including Notifications (v0.5.4) and the Teacher Dashboard (v0.5.5).

> [!IMPORTANT]
> **Database Migration Required**: You must apply all pending migrations, including `supabase/migrations/20251224000005_delete_user_rpc.sql`, before testing functionality.

## Part 1: Notifications System (v0.5.4)

### 1. Notification Bell & UI
- [ ] **Appearance**: Verify the Bell icon appears in the Sidebar header.
- [ ] **Empty State**: Click the bell when no notifications exist. Should show "No notifications".
- [ ] **Unread Badge**: Verify the red dot appears when there are unread notifications.

### 2. @Mention Notifications
**Setup**: You need two accounts (Browser A: User 1, Browser B: User 2).
- [ ] **Trigger**:
  1. Login as User 1.
  2. Create a Fleeting Note (or use existing).
  3. Write content including `@User2` (autocompleted).
  4. Promote the note to Permanent (this triggers the mention logic).
- [ ] **Verify**:
  1. Login as User 2 (or check other browser).
  2. Bell should have a red dot.
  3. Click Bell -> List should show "New Mention" from User 1.
  4. Click the Notification -> Should navigate to the note where mentioned.

### 3. Citation ([[Link]]) Notifications
**Setup**: Two accounts. User 1 has a Public/Permanent note titled "Gravity".
- [ ] **Trigger**:
  1. Login as User 2.
  2. Create a note.
  3. Write content: `Reference to [[Gravity]]`.
  4. Wait for autosave (or triggered save).
- [ ] **Verify**:
  1. Login as User 1.
  2. Bell should show "New Citation".
  3. Message should say "User 2 linked to your note 'Gravity'".
  4. Click the Notification -> Should navigate to User 2's note (so you can see the context of the citation).

### 4. Achievement Notifications
- [ ] **Trigger**:
  1. Create your 1st Permanent Note (triggers "First Steps" achievement).
  2. OR Connect 10 notes (triggers "Web Weaver").
- [ ] **Verify**:
  1. Bell should show "Achievement Unlocked!".
  2. Message should describe the achievement and XP reward.

### 5. Management
- [ ] **Mark as Read**: Click a notification. It should fade (grey out) or remove the unread indicator.
- [ ] **Mark All Read**: Click "Mark all read". All notifications should be marked read and badge should disappear.

---

## Part 2: Teacher Dashboard (v0.5.5)

### 1. Dashboard Overview (`/admin`)
- [ ] **Access**: Login as an Admin user (verify `is_admin: true` in `users` table). Navigate to `/admin`.
- [ ] **Invite Student**: Click "Invite Student". Send email to `test@example.com`. Verify toast.
- [ ] **KPIs**: Verify "Total Notes", "Connections", "At Risk" counts look reasonable.
- [ ] **Tooltips**: Hover over "At Risk" and "Engagement Score" cards. Verify tooltip text appears.
- [ ] **Class Graph**: Check if the "Class Neural Network" renders nodes and links.
- [ ] **Heatmap**: Check "Engagement Score" / Activity cards.

### 2. Student Directory & Management
- [ ] **Leaderboard**: Verify list of students. Click a student row -> Should navigate to their profile.
- [ ] **At Risk**: If you have inactive students, verify they appear in the "Intervention Needed" card.
- [ ] **Drill-Down**: Click "View" or "Manage" on a student.
  - [ ] **Profile**: Verify Student Name/Email on detail page.
  - [ ] **XP Graph**: Check if the "XP Progression" line chart renders.
  - [ ] **Notes Tab**: Check list of notes. Click a note row -> Verify "Note Preview" opens in SlideOver.
  - [ ] **Data Check**: Cards (Notes, Connections) should show numbers, not "0" (assuming data exists).
- [ ] **Add Source**: Click "Add Source" button in the **Page Header** (top right).
  - [ ] **Dialog**: Verify dialog opens.
  - [ ] **Submission**: Fill form -> Submit -> Verify success toast.
    - [ ] **Manual Override**: Enter 'testpass123', click Update. Verify toast.

### 3. Admin Actions (On Student Detail Page)
- [ ] **Award XP**: Click "Award XP". Enter amount/reason. Verify toast success and XP update.
- [ ] **Promote Note**: Find a 'fleeting' note. Click "Promote". Verify type changes to 'permanent'.
- [ ] **Force Delete Note**: Click "Delete". Confirm dialog. Verify note disappears.
- [ ] **Delete User**:
  - **Caution**: This is destructive.
  - Click "Delete User". Type "DELETE".
  - Verify redirection to `/admin`.
  - Check database: User should be gone from `users` and `auth.users`.

### 4. Source Management
- [ ] **Global Source List**:
  - Navigate to `/my-notes` -> "Sources" tab.
  - Verify list of books/articles.
- [ ] **Add Source (Instant Update)**:
  - Click green "Add Source" button (visible only to Admins).
  - Fill form (Title: "Test Book", Author: "Jane Doe").
  - Submit.
  - **Verify**: The source should appear in the list **immediately** without refreshing the page.
- [ ] **Local Graph for Sources**:
  - Click the new source in the list.
  - Verify the "Local Graph" panel appears at the bottom.
  - Verify `[Graph Debug]` logs in console show connections > 0 if linked.

---

## Part 3: Semantic Search (v0.5.6)

### 1. Database & Infrastructure
- [ ] **Vector Extension**: Verify `pgvector` extension is enabled in Supabase.
- [ ] **Embedding Column**: Verify `notes` table has `embedding` column of type `vector(768)`.

### 2. Admin Reindex
- [ ] **Feature**: This is a new Admin Action to backfill embeddings for existing notes.
- [ ] **Trigger**:
  1. Login as Admin.
  2. Navigate to `/admin`.
  3. Click "Reindex AI" (top right header actions).
- [ ] **Verify**:
  1. Toast message appears and updates ("Generated X embeddings").
  2. Check Supabase table or console logs: `updates note embedding` should be successful.

### 3. Smart Suggestions (UI)
- [ ] **Create Context**:
  1. Go to "My Notes".
  2. Create/Open Note A: Title "Planetary Motion", Content: "Kepler's laws describe orbits...".
  3. Create/Open Note B: Title "Gravity", Content: "Newton described the force...".
- [ ] **Trigger Suggestions**:
  1. Create Note C.
  2. Type: "The force that pulls planets into orbit around the sun...".
  3. Wait 1 second.
- [ ] **Verify**:
  1. "Smart Connections" panel appears below textarea.
  2. Should list "Gravity" and "Planetary Motion".
  3. **Similarity Score**: Check for "% match" text (e.g., "85% match").
  4. **Click Title**: Clicking the title should open the note in SlideOver (or Navigate).
  5. **Click +**: Clicking '+' should insert `[[Gravity]]` into the text.

---

## Part 4: Diagnostic AI (v0.5.7)

### 1. Evaluate Note (Diagnostic check)
- [ ] **Structural Validation**:
  - Create a note with `test` as content. Try to Promote.
  - **Verify**: Fails with "Issues to Resolve" listing "too short".
  - Update note to be substantial (>50 words, clean text). Try Promote.
  - **Verify**: Succeeds.
- [ ] **Observations**:
  - In the success dialog (or failure), check for "Diagnostics" section.
  - If note has no connections, look for "No explicit connections detected".
  - These should be INFORMATIONAL only.

### 2. No Scoring
- [ ] **Verify**: The promotion success dialog should **NOT** show a score (e.g. "Score: 3/4"). It should only show "Promotion Successful".

### 3. Telemetry (Internal)
- [ ] **Verify**: Check server logs for `[Telemetry]` line when promoting. It should list Self/Peer link counts.
