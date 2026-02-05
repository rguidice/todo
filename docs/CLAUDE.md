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
│   ├── Task.tsx/css        # Task rendering, badges, context menu, inline editing
│   ├── Column.tsx/css      # Column with task lists, sorting, color picker
│   ├── Sidebar.tsx/css     # Column management, visibility toggles
│   ├── ReportModal.tsx/css # Report generation with date range
│   ├── SettingsModal.tsx/css   # Settings UI (data dir, auto-clear, due date display)
│   └── DueDatePickerModal.tsx/css  # Calendar date picker modal
├── context/
│   └── AppContext.tsx  # Global state management (React Context)
├── types/
│   └── index.ts        # TypeScript interfaces, constants, color palettes
└── utils/
    ├── storage.ts      # Load/save tasks, markdown generation
    └── workingDays.ts  # Working day calculations, due date formatting
```

### Key Patterns
- **State Management:** Single `AppContext` with `useApp()` hook — all mutations go through context
- **IPC Bridge:** `window.electron.*` API exposed via `contextBridge` in preload
- **Context Menus:** Rendered via `createPortal()` to `document.body` with viewport-aware positioning
- **Auto-save:** `useEffect` watches `data` state and saves on every change
- **Auto-clear:** Runs every 60 seconds, checks completed task ages against configured duration

## Key Features

### Hierarchical Tasks
- 3 levels: Parent → Child → Grandchild
- Checking parent auto-checks all children
- Collapsible subtasks with child count indicator
- Add subtask via `+` button or right-click context menu

### Priority System
- P0 (High) — Orange `#d65d0e`
- P1 (Medium) — Blue `#458588`
- P2 (Low) — Gray `#928374`
- None — No special styling
- Per-column auto-sort toggle (sorts by priority)
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
- Right-click header for: Change Color, Hide Column, Delete Column
- Delete confirmation when column has tasks

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

## Important Design Decisions

1. **Subtask Priority:** Does NOT inherit parent's priority (defaults to none)
2. **Due Date Field:** Optional (`dueDate?: string`), no backward compat issue — existing tasks without it render fine
3. **Working Days:** Only Mon-Fri count; Friday before Monday due = 1 working day
4. **Cleared vs Deleted:** Cleared tasks are hidden but retained 90 days for reports
5. **Backward Compatibility:** `storage.ts` adds defaults for any missing fields on load (`cleared`, `pending`, `children`, `visible`, `order`)
6. **Context Menu Positioning:** Uses `useLayoutEffect` to adjust menu if it overflows viewport edges (10px padding)

## Future Enhancements (Not in current version)

- Keyboard shortcuts
- Global hotkey to show/hide
- Always-on-top mode
- Native search
- Tags/labels
- Task templates
- CLI tool

When implementing future features, maintain fast local-first philosophy and minimal UI.
