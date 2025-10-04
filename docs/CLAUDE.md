# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A local-first, fast, minimal todo app built with Electron + React + TypeScript. Designed for quick 30-second to 2-minute interactions with multi-column kanban organization, hierarchical tasks, and weekly reporting.

**Platform:** macOS (with cross-platform potential)
**Design Philosophy:** Local-only, no cloud sync, lightning fast, minimal UI

## Tech Stack

- **Framework:** Electron + React + TypeScript
- **Storage:** Local JSON files (`tasks.json`) with auto-generated Markdown exports (`tasks.md`)
- **UI:** Custom React components, dark Gruvbox color scheme
- **No external component libraries** - Keep it lightweight

## Data Model

### Storage Files
- `tasks.json` - Source of truth, auto-saves on every change
- `tasks.md` - Auto-generated, human-readable format for grep/search
- `reports/weekly_*.md` - Generated weekly reports

### JSON Structure
```json
{
  "columns": [{
    "id": "col-1",
    "name": "Project Alpha",
    "backgroundColor": "#cc241d",
    "visible": true,
    "order": 0,
    "tasks": [{
      "id": "task-1",
      "text": "Task text",
      "priority": "P0",  // P0/P1/P2 or null
      "completed": false,
      "parentId": null,
      "children": ["task-2"]
    }]
  }]
}
```

## Architecture

### File Structure
```
src/
├── main/           # Electron main process
├── renderer/       # React app
│   ├── components/ # UI components
│   ├── hooks/      # Custom React hooks
│   ├── utils/      # Utilities
│   └── types/      # TypeScript types
└── shared/         # Shared code
```

### Key Features

**Hierarchical Tasks:**
- 3 levels: Parent → Child → Grandchild
- Checking parent auto-checks all children
- Unchecking reverses the cascade

**Priority System:**
- P0 (High) - Orange accent (#d65d0e)
- P1 (Medium) - Blue accent (#458588)
- P2 (Low) - Gray accent
- None - No special styling
- Auto-sort option (by priority)

**Multi-Column Layout:**
- Up to 5 columns
- Each column = category/project
- Drag-to-reorder columns
- Columns have background colors from Gruvbox palette
- Horizontal scroll when needed (min width: 200px per column)

**Completion Animation:**
- Instant checkbox visual snap
- Strikethrough + fade to 70% opacity
- Smooth slide to bottom (~300ms)
- Optional green tint flash (200ms)
- Child cascade: 50ms delay between children
- All animation delays should be configurable in code

**Weekly Reports:**
- Generate from "Last 7 days" or custom range
- Markdown format: `reports/weekly_YYYY-MM-DD.md`
- Groups by column, includes all hierarchy
- NO timestamps, NO priority indicators in reports

## Development Commands

> **Note:** Project is not yet scaffolded. These will be added when setup is complete.

Expected commands:
- Build: TBD
- Run dev: TBD
- Run tests: TBD
- Package app: TBD

## UI/UX Guidelines

**Color Scheme (Dark Gruvbox):**
- Background: #282828
- Column/Card bg: #3c3836
- Text: #ebdbb2 (cream/off-white)
- Avoid pure black/white
- Column colors from warm Gruvbox palette (red, orange, yellow, green, aqua, blue, purple)

**Window:**
- Ideal starting size: 800x400
- Persist size/position between sessions
- Minimal chrome, optimized for compact interactions
- Toggleable sidebar (left) for column management

**Performance Requirements:**
- Load time: <500ms
- UI response: Instant
- Animations: 60fps
- Report generation: <1 second
- All operations are local-only

## Important Design Decisions

1. **Subtask Priority Inheritance:** When creating a subtask, do NOT inherit parent's priority (default to none)

2. **Completion Behavior:**
   - Completed tasks move to bottom with 70% opacity
   - Stay visible until manually cleared with "Clear Completed" button
   - Parent checkbox automatically checks/unchecks all children

3. **Animation Timing:** All delays must be adjustable in code (exposed as constants or simple settings)

4. **Data Integrity:**
   - Auto-save on every change
   - Atomic file operations
   - Backup tasks.json before major operations
   - Validate JSON structure on load

5. **Markdown Export Format:**
   ```markdown
   # Project Alpha

   ## Buy groceries [P0] ⬜
   - Get milk & eggs [P1] ⬜

   ## Review plans [P1] ✅
   - Draft outline ✅
   ```

6. **Weekly Report Template:**
   ```markdown
   # Weekly Report: MMM DD - MMM DD, YYYY

   ## Column Name 1
   - [x] Completed parent task
     - [x] Completed subtask
       - [x] Completed grandchild task
   ```

## Code Quality Standards

- TypeScript for type safety
- Well-structured React components
- Clear separation: UI, data, storage
- **Easily modifiable by AI agents** - Keep code clean and well-commented
- Readable for developers with C++/Python background

## Future Enhancements (Not in v1)

See `docs/todo_spec_v2.md` for deferred features:
- Keyboard shortcuts (high priority for v2)
- Global hotkey to show/hide
- Always-on-top mode
- Native search
- Tags/labels
- Task templates
- CLI tool

When implementing future features, maintain fast local-first philosophy and minimal UI.
