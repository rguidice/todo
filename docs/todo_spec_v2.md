# Todo App - Future Features & Enhancements (v2+)

## Overview
This document outlines features and enhancements that were discussed but deferred from v1. These can be implemented in future iterations based on user feedback and priorities.

## Deferred v1 Features

### 1. Always-on-Top Mode
**Description**: Window stays on top of all other windows
**Implementation**:
- Toggle in settings
- Keyboard shortcut to toggle (e.g., Cmd+Shift+T)
- Visual indicator when active
- Persists preference across sessions

**Priority**: Medium - Nice quality of life improvement

---

### 2. Keyboard Shortcuts
**Description**: Comprehensive keyboard navigation and task management
**Shortcuts to Add**:
- `1`, `2`, `3` while task selected → Set priority to P0/P1/P2
- `Cmd+Shift+N` → New column
- `Cmd+D` → Delete selected task
- `Cmd+E` → Edit selected task
- `Cmd+↑/↓` → Move task up/down in priority
- `Space` → Toggle task completion
- `Tab` → Create subtask
- `Cmd+F` → Focus search (if search added)
- `Cmd+B` → Toggle sidebar
- `Cmd+R` → Generate weekly report
- `Esc` → Clear selection/cancel action

**Priority**: High - Would significantly speed up power user workflows

---

### 3. Native Search Feature
**Description**: Search across all tasks and columns within the app
**Features**:
- Search bar (top of window or sidebar)
- Live search results as you type
- Filter by:
  - Text content
  - Priority level
  - Completion status
  - Column/category
- Keyboard shortcut to open (Cmd+F)
- Highlight matches in results
- Jump to task location on click

**Priority**: Medium - grep works for now, but in-app would be faster

---

### 4. ~~Auto-Clear Completed Tasks~~ ✅ IMPLEMENTED (v1.0.1)
**Status**: Implemented with configurable durations (1min, 5min, 1hr, 4hr, 24hr, 1week, never). Cleared tasks retained for 90 days for reporting purposes.

---

### 5. Copy to Clipboard for Reports
**Description**: Add ability to copy weekly report directly to clipboard
**Implementation**:
- In report generation dialog, add "Copy to Clipboard" button
- Copies formatted markdown text
- Success notification/feedback
- Can do this in addition to or instead of saving file

**Priority**: Medium - Would streamline the email writing workflow

---

## New Feature Ideas

### 1. Global Hotkey to Show/Hide App
**Description**: Show/hide the app from anywhere in the OS
**Implementation**:
- Register global keyboard shortcut (e.g., Cmd+Shift+T)
- Brings app to focus if hidden
- Hides app if currently focused
- Works even when app is not active
- Configurable shortcut in settings

**Priority**: High - Perfect for quick access model

**Technical Notes**: Requires Electron globalShortcut API

---

### 2. Task Estimates & Time Tracking
**Description**: Add time estimates and basic tracking to tasks
**Features**:
- Optional time estimate per task (e.g., "2h", "30m")
- Track actual time spent (basic timer)
- Show estimated vs actual in reports
- Visual indicator for overdue estimates
- Rollup estimates for parent tasks

**Priority**: Medium - Useful for planning and reporting

**UI Changes**:
- Time estimate field when creating task
- Timer start/stop button on task
- Time summary in weekly report

---

### 3. Task Templates
**Description**: Save and reuse common task structures
**Features**:
- Save a task (with subtasks) as template
- Template library in sidebar
- Click template to instantiate in any column
- Templates include structure and priorities
- Import/export templates

**Priority**: Low - Nice for recurring projects

**Use Cases**:
- Weekly recurring tasks
- Project checklists
- Standard workflows

---

### 4. Task Dependencies
**Description**: Mark tasks as blocked by other tasks
**Features**:
- "Blocked by" relationship between tasks
- Visual indicator for blocked tasks (grayed out?)
- Can't complete task until blockers are done
- Dependency graph view (optional)

**Priority**: Low - Adds complexity, may not fit simple model

---

### 5. Tags/Labels
**Description**: Flexible categorization beyond columns
**Features**:
- Add multiple tags to any task (e.g., #urgent, #research)
- Filter/group by tags
- Tag-based views alongside column views
- Tag autocomplete from existing tags
- Color coding per tag

**Priority**: Medium - Alternative to multi-column for some workflows

---

### 6. Customizable Completion Sounds
**Description**: Audio feedback when completing tasks
**Features**:
- Optional completion sound
- Multiple sound options to choose from
- Volume control
- Per-priority different sounds (P0 = more satisfying?)
- Can be disabled

**Priority**: Low - Fun but not essential

---

### 7. Daily/Monthly Reports
**Description**: Extend reporting beyond weekly
**Features**:
- Daily summary report
- Monthly rollup report
- Custom date range reports
- Export to different formats (PDF, CSV)
- Charts/visualizations of completion trends

**Priority**: Low - Weekly covers the immediate need

---

### 8. Recurring Tasks
**Description**: Tasks that repeat on a schedule
**Features**:
- Mark task as recurring (daily, weekly, monthly)
- Auto-recreate when completed
- Skip/postpone recurring instance
- Track streak of completions

**Priority**: Medium - Common request for todo apps

**Implementation Notes**:
- Add recurrence rules to task model
- Background process to create instances
- UI for managing recurrence

---

### 9. Multi-Device Sync
**Description**: Sync tasks across multiple machines
**Options**:
- File-based sync (Dropbox, iCloud Drive)
- Custom sync server (self-hosted)
- Conflict resolution UI

**Priority**: Low - Adds significant complexity, conflicts with local-first model

**Considerations**:
- Would need conflict resolution
- May slow down the app
- Security/privacy concerns
- Could use file-based sync without custom code (just point data dir to synced folder)

---

### 10. Pomodoro Timer Integration
**Description**: Built-in Pomodoro technique support
**Features**:
- Start Pomodoro timer for any task
- 25-min work / 5-min break cycles
- Notifications when timer completes
- Track Pomodoros completed per task
- Pomodoro count in reports

**Priority**: Low - Nice integration for focused work

---

### 11. Drag-and-Drop Between Columns
**Description**: Move tasks between columns via drag-and-drop
**Features**:
- Drag task to different column to move it
- Preserves priority and completion status
- Undo operation
- Visual feedback during drag

**Priority**: Medium - Natural interaction for reorganizing

**Note**: Currently columns are separate categories, so this may or may not make sense depending on usage

---

### 12. Customizable Themes
**Description**: Beyond dark Gruvbox, offer more themes
**Options**:
- Light mode (Gruvbox light)
- High contrast mode
- Custom color schemes
- Import/export themes

**Priority**: Low - Current dark theme serves the purpose

---

### 13. Task Notes/Details
**Description**: Rich text notes attached to tasks
**Features**:
- Click task to expand notes panel
- Markdown formatting in notes
- Attachments/links in notes
- Notes searchable
- Notes included in exports

**Priority**: Medium - Useful for complex tasks, but adds UI complexity

---

### 14. Archive System
**Description**: Archive old columns/tasks without deleting
**Features**:
- Archive completed tasks to separate file
- Archive entire columns
- View archived items (read-only)
- Restore from archive
- Search across archives

**Priority**: Low - Current model is simple and works

---

### 15. Collaboration Features
**Description**: Share tasks/columns with others
**Features**:
- Export column as shareable file
- Import shared columns
- Comment on tasks
- Assign tasks to people

**Priority**: Very Low - Against local-first philosophy, different product entirely

---

### 16. Mobile Companion App
**Description**: iOS/Android app for on-the-go access
**Approach**:
- Read-only view of tasks
- Quick add tasks (sync later)
- View weekly reports
- File-based sync with desktop

**Priority**: Low - Would require significant development effort

---

### 17. CLI Tool
**Description**: Command-line interface for task management
**Features**:
- `todo add "Task text"` - Add task
- `todo list` - Show all tasks
- `todo complete <id>` - Complete task
- `todo report` - Generate weekly report
- Scriptable for automation

**Priority**: Medium - Great for developers, leverages plain-text storage

---

### 18. Statistics Dashboard
**Description**: Analytics on task completion and productivity
**Metrics**:
- Tasks completed per day/week/month
- Average completion time
- Priority distribution
- Most productive days/times
- Completion rate trends
- Burndown charts

**Priority**: Low - Interesting but not essential for v1 use case

---

### 19. Backup & Restore
**Description**: Automated backup system
**Features**:
- Automatic daily backups
- Manual backup trigger
- Restore from backup (with date selection)
- Export all data as single file
- Import from backup

**Priority**: Medium - Important for data safety

**Note**: JSON/Markdown files already provide basic backup, but automated versioning would be better

---

### 20. Context Menu Enhancements
**Description**: More right-click options
**Options to Add**:
- Duplicate task
- Convert to subtask / Promote to parent
- Move to different column
- Copy task text
- Add note
- Set due date
- Archive task

**Priority**: Medium - Depends on which features are implemented

---

## Implementation Priority Summary

### High Priority (Next iteration)
1. Keyboard shortcuts - Major UX improvement
2. Global hotkey to show/hide - Perfect for quick access model
3. Always-on-top mode - Simple to implement, high value

### Medium Priority
1. Native search feature
2. Copy to clipboard for reports
3. Task estimates & time tracking
4. Tags/labels system
5. Drag-and-drop between columns
6. Task notes/details
7. Backup & restore system
8. CLI tool

### Low Priority
1. ~~Auto-clear completed tasks~~ ✅ Implemented
2. Task templates
3. Daily/monthly reports
4. Recurring tasks
5. Pomodoro timer
6. Customizable themes
7. Archive system
8. Statistics dashboard

### Very Low / Out of Scope
1. Multi-device sync (consider file-based only)
2. Collaboration features (different product)
3. Mobile app (major effort)

---

## Known Issues / Bug Fixes

### 1. Apple Security Warning on Install
**Description**: macOS shows a security warning when installing the app
**Likely Fix**: Requires a registered Apple Developer certificate for code signing
**Priority**: Very Low

### 2. macOS Tahoe App Icon
**Description**: App icon doesn't display correctly on macOS Tahoe
**Priority**: Very Low

---

## Technical Debt & Improvements

### Code Quality
- Unit tests for core logic
- E2E tests for critical workflows
- Better error handling and logging
- Performance profiling and optimization
- Documentation for AI agents

### Architecture
- Plugin system for extensibility
- Better state management (Redux/Zustand if needed)
- Undo/redo system (beyond checkbox)
- Event-driven architecture for features

### DevOps
- Automated builds
- Auto-update system
- Crash reporting
- Usage analytics (privacy-respecting)

---

## User Feedback Areas

Monitor these areas for user feedback to prioritize features:

1. **Workflow Gaps**: What tasks can't be represented?
2. **Speed Bottlenecks**: What feels slow or clunky?
3. **Missing Integrations**: What external tools would help?
4. **Customization Needs**: What can't be configured?
5. **Platform Needs**: Windows/Linux demand?

---

## Notes for AI Developers

When implementing future features:
- Maintain the fast, local-first philosophy
- Keep UI minimal and uncluttered
- Ensure all features are keyboard-accessible
- Preserve data in plain-text formats where possible
- Test with AI agent modifications to ensure code remains modifiable
- Keep animation delays configurable
- Don't break existing workflows when adding features