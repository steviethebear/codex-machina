# Tag System Testing Checklist

## PRIORITY: Test These First (Just Implemented)
- [ ] **Create Note with Tags**: Open Create Note dialog, add 2-3 tags, create note
- [ ] **Tag Autocomplete**: Type partial tag name, verify suggestions appear
- [ ] **Create New Tag**: Type a brand new tag name, press Enter, verify it's created
- [ ] **Notebook Display**: Verify tags appear below note titles in sidebar (max 2 shown + count)
- [ ] **Edit Note Tags**: Open Edit dialog for existing note, add/remove tags, save
- [ ] **Tag Persistence**: Create note with tags, refresh page, verify tags still there
- [ ] **Keyboard Navigation**: Use arrow keys in tag autocomplete, press Enter to select

## Basic Tag Operations
- [ ] Create a new atom with tags via Create Note dialog
- [ ] Tag autocomplete shows existing tags
- [ ] Tag autocomplete is ranked by usage_count
- [ ] Can create new tags on-the-fly (press Enter or comma)
- [ ] Tags save successfully when note is created
- [ ] Tag badges display correctly (color, size, spacing)
- [ ] Can remove tags from input (click X or backspace)

## Tag Input Behavior
- [ ] Autocomplete debounces properly (300ms)
- [ ] Arrow keys navigate suggestions
- [ ] Enter/comma adds tags
- [ ] Escape closes suggestions
- [ ] Duplicate tags are prevented
- [ ] Case-insensitive tag matching works

## Edit Note Dialog
- [ ] Existing tags load when editing a note
- [ ] Can add new tags to existing note
- [ ] Can remove tags from existing note
- [ ] Changes save correctly

## Tag Display
- [ ] Tags appear in Notebook sidebar
- [ ] Tags appear in Graph node tooltips/cards
- [ ] Tag badges are clickable

## Tag Filtering
- [ ] Can filter Notebook by tag
- [ ] Can filter Graph by tag
- [ ] Filters combine with search
- [ ] Filters combine with type filters

## Tag Cloud
- [ ] Tag cloud displays all tags
- [ ] Size reflects usage_count
- [ ] Click tag to filter

## Database/Performance
- [ ] usage_count increments when tag added to note
- [ ] usage_count decrements when tag removed
- [ ] No duplicate tags in database (case-insensitive)
- [ ] RLS policies work correctly
- [ ] Tag queries perform well with many tags

## Edge Cases
- [ ] Empty tag input is rejected
- [ ] Very long tag names are handled
- [ ] Special characters in tags work
- [ ] Deleting a note removes note_tags entries (CASCADE)
- [ ] Deleting last use of tag doesn't break
