# Todo App - Project Specification v1.0

## Overview
A local-first, fast, minimal to-do list application designed for quick 30-second to 2-minute interactions. Features multi-column kanban-style organization with hierarchical tasks, priority management, and weekly reporting capabilities.

## Tech Stack
- **Framework**: Electron + React + TypeScript
- **Platform**: macOS (with potential for cross-platform later)
- **Storage**: Local JSON files with auto-generated Markdown exports
- **UI Library**: React with custom styling (no heavy component libraries needed for v1)

## Core Features

### 1. Multi-Column Layout
- Support for up to 5 columns
- Each column represents a category/project
- Columns have equal width that scales based on window size
- Minimum column width: 200px
- Horizontal scroll when window is too small to display all columns
- Columns can be reordered via drag-and-drop on column headers

#### Column Management
- **Add Column**: Button in left sidebar, prompts for:
  - Column name
  - Background color (from preset palette)
- **Remove Column**: Right-click column header → Delete (with confirmation if contains items)
- **Hide Column**: Right-click → Hide, or via checkbox list in sidebar
- **Reorder**: Drag column headers to reorder
- **Change Color**: Right-click column header → Change color (color picker with preset palette)

#### Column Colors (Gruvbox Palette - Muted)
- Warm Red: #cc241d
- Warm Orange: #d65d0e
- Warm Yellow: #d79921
- Warm Green: #98971a
- Warm Aqua: #689d6a
- Warm Blue: #458588
- Warm Purple: #b16286

### 2. Task Management

#### Task Hierarchy
- Support 3 levels: Parent → Child → Grandchild
- Checking a parent task automatically checks all children
- Unchecking reverses this behavior
- All levels displayed with proper indentation

#### Task Creation
- Plus button at bottom of each column
- Click button → inline text field appears
- Type and press Enter to create
- Keyboard shortcut: Cmd+N when column is focused
- When creating subtask, default to no priority (doesn't inherit parent's priority)

#### Task Properties
- Text content (supports any characters including quotes, special chars)
- Priority: P0 (High), P1 (Medium), P2 (Low), or none
- Completion status: checked/unchecked
- Parent/child relationships

#### Task Completion
**Visual States:**
- Uncompleted: Normal display with checkbox
- Completed: Strikethrough text, 70% opacity, moved to bottom of column

**Animation Sequence (adjustable delays in code):**
1. Click checkbox: Instant visual snap (empty → checkmark)
2. Strikethrough text with fade (opacity: 100% → 70%)
3. Smooth slide down to completed section (~300ms)
4. Optional: Subtle green tint flash (200ms) then fade
5. Child auto-completion: Cascade effect with 50ms delay between children

**Undo:**
- Click checkbox again to uncheck
- Reverses animation, slides back to uncompleted section

**Persistence:**
- Completed items stay visible until manually cleared
- "Clear Completed" button per column to remove completed items

### 3. Priority System

#### Priority Levels
- **P0 (High)**: Orange accent
- **P1 (Medium)**: Blue accent
- **P2 (Low)**: Gray accent
- **None**: No special color/accent

#### Visual Treatment
- Colored left border or subtle background tint
- Priority badge/tag displayed on each item
- Color coding visible at a glance

#### Setting Priority
- **During creation**: Option to set priority when creating task
- **After creation**: Right-click menu → Set Priority → P0/P1/P2/None
- **Future**: Keyboard shortcuts (defer to v2)

#### Auto-Sort Option
- Optional auto-sort by priority within each column
- Toggle in settings (per column or global - decide during implementation)
- When enabled: P0 tasks appear first, then P1, then P2, then unprioritized

### 4. Weekly Reporting

#### Report Generation
- "Generate Weekly Report" button in top toolbar
- Opens modal/dialog with:
  - Date range selector (defaults to "Last 7 days")
  - Preview pane showing report contents
  - "Save Report" button

#### Report Format
- Markdown file saved to `reports/weekly_YYYY-MM-DD.md`
- Content includes:
  - Date range header
  - All completed items from the period
  - Grouped by column
  - Includes all hierarchy levels (parent, child, grandchild)
  - NO timestamps, NO priority indicators

#### Report Template
```markdown
# Weekly Report: MMM DD - MMM DD, YYYY

## Column Name 1
- [x] Completed parent task
  - [x] Completed subtask
    - [x] Completed grandchild task
- [x] Another completed task

## Column Name 2
- [x] Completed task
  ...
```

### 5. Data Storage

#### Working Files
- **Primary data**: `tasks.json` (source of truth)
- **Auto-generated**: `tasks.md` (updates on every change)
- **Reports**: `reports/` folder with weekly markdown files

#### File Location
- Default: App-specific directory in user's system
- User can override on first launch
- Path configurable in settings

#### JSON Structure (tasks.json)
```json
{
  "columns": [
    {
      "id": "col-1",
      "name": "Project Alpha",
      "backgroundColor": "#cc241d",
      "visible": true,
      "order": 0,
      "tasks": [
        {
          "id": "task-1",
          "text": "Buy groceries",
          "priority": "P0",
          "completed": false,
          "parentId": null,
          "children": ["task-2"]
        },
        {
          "id": "task-2",
          "text": "Get milk & eggs",
          "priority": "P1",
          "completed": false,
          "parentId": "task-1",
          "children": []
        }
      ]
    }
  ]
}
```

#### Markdown Export (tasks.md)
- Auto-updates whenever tasks.json changes
- Human-readable format for grep/search
- Format example:
```markdown
# Project Alpha

## Buy groceries [P0] ⬜
- Get milk & eggs [P1] ⬜

## Review Q4 plans [P1] ✅
- Draft outline ✅
```

### 6. User Interface

#### Window Properties
- Resizable window
- Ideal starting size: 800x400 (small mode)
- Remembers window size and position between sessions
- Optimized for compact sizes (30s-2min interaction sessions)
- Minimal chrome: thin title bar, slim padding

#### Layout Structure
```
┌─────────────────────────────────────────┐
│  [≡] Todo App           [Generate Report]│  ← Top bar with sidebar toggle
├─────┬───────────────────────────────────┤
│     │  Column 1  │  Column 2  │ Column 3│
│ [S] │            │            │         │  ← Optional sidebar (toggleable)
│ [I] │  Tasks...  │  Tasks...  │ Tasks.. │
│ [D] │            │            │         │
│ [E] │    [+]     │    [+]     │   [+]   │  ← Add task buttons
│ [B] │            │            │         │
│ [A] │  ─────────────────────────────    │
│ [R] │  Completed (faded):               │
│     │  ✓ Done task                      │
└─────┴───────────────────────────────────┘
```

#### Sidebar (Left, Toggleable)
- Toggle button in top bar (hamburger icon)
- Contains:
  - "Add Column" button
  - List of columns with show/hide checkboxes
  - "Settings" button (opens settings modal)

#### Color Scheme (Dark Gruvbox-Claude Style)
- Background: #282828 (Gruvbox dark)
- Column/Card background: #3c3836 (subtle contrast)
- Text: #ebdbb2 (off-white/cream)
- Avoid pure black and pure white
- Warm, muted accent colors from Gruvbox palette

#### Empty States
- Empty columns: Just empty space (no prompts)
- All columns hidden: Show empty workspace (no special message)

### 7. Settings

#### v1 Settings (Minimal)
- Toggle auto-sort by priority (global or per-column)
- Default background color for new columns
- Report save location
- Animation delay adjustments (expose as constants in code or simple settings)

#### Settings Access
- Button in sidebar
- Opens modal/dialog with settings options

## Non-Functional Requirements

### Performance
- Lightning fast load times (<500ms)
- Instant UI response to interactions
- Smooth animations (60fps)
- No network connectivity required
- Local-only, no cloud sync

### User Experience
- Minimal, stays out of the user's way
- Optimized for quick interactions (30s-2min sessions)
- Satisfying completion feedback
- Easily scannable with color coding and hierarchy

### Code Quality
- TypeScript for type safety
- Well-structured React components
- Clear separation of concerns (UI, data, storage)
- Easily modifiable by AI agents
- Readable for developers with C++/Python background

### Data Integrity
- Auto-save on every change
- Atomic file operations
- Backup tasks.json before major operations
- Validate JSON structure on load

## File Structure
```
todo-app/
├── src/
│   ├── main/           # Electron main process
│   ├── renderer/       # React app
│   │   ├── components/ # UI components
│   │   ├── hooks/      # Custom React hooks
│   │   ├── utils/      # Utilities
│   │   └── types/      # TypeScript types
│   └── shared/         # Shared code
├── data/               # User data directory
│   ├── tasks.json
│   ├── tasks.md
│   └── reports/
│       └── weekly_*.md
├── package.json
└── README.md
```

## Development Phases

### Phase 1: Core Structure
- Set up Electron + React + TypeScript boilerplate
- Implement column layout and rendering
- Basic task creation and display
- JSON data storage

### Phase 2: Task Management
- Hierarchical task structure
- Checkbox completion with basic animation
- Task persistence
- Markdown auto-export

### Phase 3: Priority & Sorting
- Priority system (P0/P1/P2)
- Color coding and visual accents
- Auto-sort option
- Priority UI (right-click menu, creation flow)

### Phase 4: Column Management
- Add/remove/hide columns
- Drag-to-reorder columns
- Color customization
- Sidebar implementation

### Phase 5: Weekly Reporting
- Report generation dialog
- Date range selection
- Markdown report export
- Completed items tracking

### Phase 6: Polish
- Refine animations (make delays configurable)
- Settings panel
- Window state persistence
- UI refinements and bug fixes

## Success Criteria
- App loads in <500ms
- All interactions feel instant
- Completed tasks provide satisfying feedback
- Weekly reports generate in <1 second
- Data is always recoverable from JSON/Markdown files
- App is stable and bug-free for daily use
- Codebase is clean and AI-agent friendly

## Future Considerations (Not in v1)
See project_spec_v2.md for deferred features and future enhancements.