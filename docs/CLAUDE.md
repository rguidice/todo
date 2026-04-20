# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A local-first, fast, minimal todo app built with Electron + React + TypeScript. Designed for quick 30-second to 2-minute interactions with multi-column kanban organization, hierarchical tasks, and weekly reporting.

**Platform:** macOS (with cross-platform potential)
**Design Philosophy:** Local-only, no cloud sync, lightning fast, minimal UI

## Tech Stack

- **Framework:** Electron + React + TypeScript
- **Build Tool:** Vite
- **Storage:** Local JSON files (`tasks.json`) with auto-generated Markdown exports (`tasks.md`)
- **UI:** Custom React components, dark Gruvbox color scheme
- **Calendar:** `react-day-picker` (v9) for due date selection

## Development Commands

- `npm run dev` — Start Vite dev server
- `npm run build` — Production build (Vite)
- `npm run start` — Launch Electron app
- `npm run package` — Build + package with electron-builder

## Data Model

### Storage Files
- `tasks.json` — Source of truth, auto-saves on every change
- `tasks.md` — Auto-generated, human-readable format for grep/search
- `today.json` — Today panel state (task refs, yesterday snapshot), resets daily
- `reports/completed_*.md` — Generated completion reports
- `settings.json` — App settings (stored in system userData directory)
- `window-state.json` — Window position/size persistence

### JSON Structure
```json
{
  "columns": [{
    "id": "col-1",
    "name": "Project Alpha",
    "backgroundColor": "#3c3836",
    "visible": true,
    "archived": false,
    "order": 0,
    "autoSort": false,
    "tasks": [{
      "id": "task-1",
      "text": "Task text",
      "priority": "P0",
      "completed": false,
      "completedAt": "2026-02-05T...",
      "cleared": false,
      "pending": true,
      "dueDate": "2026-02-10",
      "clearedAt": "2026-02-05T...",
      "parentId": null,
      "children": ["task-2"]
    }]
  }]
}
```

### Settings Structure
```json
{
  "dataDirectory": "/path/to/data",
  "autoClearDuration": "never",
  "dueDateDisplayMode": "date"
}
```

## Architecture

### File Structure
```
electron/
├── main.ts             # Electron main process, IPC handlers, settings
├── preload.ts          # Secure IPC bridge (contextBridge)
src/
├── App.tsx             # Main app component, column layout, drag-and-drop
├── App.css
├── main.tsx            # React entry point
├── index.css           # Global styles, CSS custom properties
├── components/
│   ├── Task.tsx/css        # Task rendering, badges, context menu, inline editing, drag-and-drop
│   ├── Column.tsx/css      # Column with task lists, sorting, color picker, rename, archive, drop target
│   ├── Sidebar.tsx/css     # Column management, visibility toggles, archive/restore
│   ├── TodayPanel.tsx/css  # Resizable "Today" focus panel with parent context grouping
│   ├── ReportModal.tsx/css # Report generation with date range
│   ├── SettingsModal.tsx/css   # Settings UI (data dir, auto-clear, due date display)
│   └── DueDatePickerModal.tsx/css  # Calendar date picker modal
├── context/
│   └── AppContext.tsx  # Global state management (React Context)
├── types/
│   └── index.ts        # TypeScript interfaces, constants, color palettes
└── utils/
    ├── storage.ts      # Load/save tasks & today data, markdown generation
    └── workingDays.ts  # Working day calculations, due date formatting
```

### Key Patterns
- **State Management:** Single `AppContext` with `useApp()` hook — all mutations go through context
- **IPC Bridge:** `window.electron.*` API exposed via `contextBridge` in preload (no unused methods exposed)
- **Context Menus:** Rendered via `createPortal()` to `document.body` with viewport-aware positioning; hover submenus for "Move to..." use absolute positioning within the portaled menu
- **Drag-and-Drop:** HTML5 drag API with `dataTransfer` type differentiation — column reorder uses drag handle button, task move uses `application/x-task` MIME type on the task div
- **Auto-save:** `useEffect` watches `data` state and saves on every change
- **Auto-clear:** Runs every 60 seconds, checks completed task ages against configured duration

## Key Features

### Hierarchical Tasks
- 3 levels: Parent → Child → Grandchild
- Checking parent auto-checks all children
- Collapsible subtasks with child count indicator
- Add subtask via `+` button or right-click context menu

### Today Panel
- Resizable side panel toggled via "Today" button in top bar (drag right edge to resize, 180–500px)
- Curate a focused list of tasks from across all columns
- Add/remove tasks via right-click context menu ("Add to Today" / "Remove from Today")
- Tasks grouped by source column with colored dot headers
- Child tasks sub-grouped under their immediate parent name (dimmed, non-interactive header)
- Top-level tasks render without parent headers
- Completing a task (from panel or column) auto-removes from Today
- Data stored in `today.json` with `TodayTaskRef` (columnId + taskId) references
- Daily reset: list clears at start of new local day, previous day saved as snapshot
- "Restore Yesterday" button merges previous day's refs (filters out stale/completed)
- Stale refs auto-cleaned on render (deleted/cleared tasks)
- Synced with `toggleTask`, `deleteTask`, `archiveColumn`, `moveTask` for cleanup

### Priority System
- P0 (High) — Orange `#d65d0e`
- P1 (Medium) — Blue `#6d9da1`
- P2 (Low) — Gray `#bdae93`
- None — No special styling
- Per-column auto-sort toggle (sorts by priority, pending items below same-priority)
- Set via right-click context menu

### Pending Indicator
- Yellow "P" badge (`#d79921`) on task row
- Toggle via right-click context menu
- Appears to the left of due date and priority badges

### Due Dates
- Optional due date per task (ISO 8601 `YYYY-MM-DD`)
- Color-coded badge between pending and priority indicators:
  - **Normal** (3+ working days): Gray `#928374`
  - **Warning** (1-2 working days): Yellow `#d79921`
  - **Urgent** (day-of / overdue): Red `#fb4934`
- Working days = Mon-Fri only (weekends excluded)
- Badge hidden on completed tasks, stays visible when overdue
- Set/change/remove via right-click context menu
- Calendar picker modal using `react-day-picker`
- Display mode togglable in Settings: short date (`2/10`) or working days (`3d`)
- Dates parsed with `new Date(dateStr + 'T00:00:00')` to force local timezone

### Multi-Column Layout
- Unlimited columns with Gruvbox color palette backgrounds
- Drag-to-reorder via handle button
- Show/hide columns from sidebar
- Right-click header for: Rename Column, Change Color, Hide Column, Archive Column
- Archive confirmation when column has active tasks
- Archived columns accessible from sidebar dropdown with restore and permanent delete options
- Permanent delete shows full task count breakdown (active, completed, report history) with warning about data loss
- Drag-and-drop tasks between columns (top-level uncompleted tasks only)
- Move tasks via right-click context menu hover submenu ("Move to..." with fly-out column list)

### Task Completion & Clearing
- Completed tasks move to bottom with 70% opacity + strikethrough
- Manual "Clear Completed" button (top of column header + bottom of completed section)
- Auto-clear with configurable durations: 1min, 5min, 1hr, 4hr, 24hr, overnight (3 AM), 1 week, never
- Cleared tasks retained for 90 days for report generation, then permanently deleted

### Reports
- Generate from custom date range
- Markdown format saved to `reports/` directory
- Groups by column, includes task hierarchy
- Includes cleared tasks (within 90-day retention window)
- Duplicate filename detection with overwrite confirmation

### Settings (persisted via Electron IPC)
- **Data Directory:** Configurable storage location
- **Auto-Clear Duration:** When to hide completed tasks
- **Due Date Display Mode:** Short date vs working days remaining

## UI/UX Guidelines

**Color Scheme (Dark Gruvbox):**
- Background: `#282828` (`--bg-primary`)
- Card/Column bg: `#3c3836` (`--bg-secondary`)
- Text: `#ebdbb2` (`--text-primary`), `#a89984` (`--text-secondary`)
- Accent blue: `#458588` (`--accent-blue`)
- Border: `#504945` (`--border`)

**Task Badge Layout:**
```
[▶] [☐] Task text...  [P] [2/10] [P1]  [+]
                        ^    ^      ^
                   pending  due   priority
```

**Window:**
- Default size: 800x400, min: 600x300
- Persists size/position/maximized state between sessions
- Hidden title bar with macOS traffic lights at (10, 10)
- Toggleable sidebar (left) for column management
- Resizable Today panel (left, between sidebar and columns) for daily focus

## Important Design Decisions

1. **Subtask Completion Timestamps:** Completing a parent preserves original `completedAt` for subtasks already completed
2. **Subtask Priority:** Does NOT inherit parent's priority (defaults to none)
3. **Due Date Field:** Optional (`dueDate?: string`), no backward compat issue — existing tasks without it render fine
4. **Working Days:** Only Mon-Fri count; Friday before Monday due = 1 working day
5. **Cleared vs Deleted:** Cleared tasks are hidden but retained 90 days for reports
6. **Archive vs Delete:** Archiving a column hides it from the board but preserves data for reports; permanent delete removes everything including report history
7. **Today Date Calculation:** Uses local time (`getFullYear`/`getMonth`/`getDate`) not UTC, preventing premature daily reset in western timezones
8. **Backward Compatibility:** `storage.ts` adds defaults for any missing fields on load (`cleared`, `pending`, `children`, `visible`, `order`, `archived`)
9. **Context Menu Positioning:** Uses `useLayoutEffect` to adjust menu if it overflows viewport edges (10px padding)
10. **Task Drag vs Column Drag:** Differentiated via `dataTransfer.types` — `application/x-task` for task moves, default for column reorder

## Future Enhancements (Not in current version)

- Keyboard shortcuts
- Global hotkey to show/hide
- Always-on-top mode
- Native search
- Tags/labels
- Task templates
- CLI tool

When implementing future features, maintain fast local-first philosophy and minimal UI.
