# todo App

**This is an experiment in vibe coding, Claude Code, LLM + tool access, etc. Do not take seriously. :D**

**Initial docs/todo_spec_v1/2.md files generated in Claude web UI with Sonnet 4.5. Code generated in Claude Code with Sonnet 4.5. Application icon generated with ChatGPT's GPT-5 built-in image generation.**

A local-first, fast, minimal to-do list application built with Electron, React, and TypeScript.

## Features

- **Multi-column kanban** organization with drag-to-reorder, color picker, and show/hide
- **Hierarchical tasks** (3 levels: parent → child → grandchild) with collapsible subtasks
- **Priority system** (P0/P1/P2) with color-coded badges and per-column auto-sort
- **Pending indicator** — yellow "P" badge toggled via right-click
- **Due dates** — color-coded badge (gray/yellow/red based on working days remaining), calendar picker, configurable display (short date or working days)
- **Auto-clear** completed tasks on a configurable schedule (1min to 1 week, overnight at 3 AM, or never)
- **Report generation** from custom date ranges in Markdown format
- **Settings** — configurable data directory, auto-clear duration, due date display mode
- **Dark Gruvbox theme** with custom CSS properties
- **Local-only storage** (no cloud sync) with auto-save on every change
- **Window state persistence** (size, position, maximized)

## Development

### Prerequisites

- Node.js (v18 or higher)
- npm

### Setup

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

This will start Vite dev server and open the Electron app with hot-reload enabled.

### Build & Distribution

#### Development Mode
```bash
npm run dev
```
Runs Vite dev server with hot reload and opens DevTools. Changes update immediately.

#### Production Build
```bash
npm run build
```
Compiles everything into optimized `dist/` and `dist-electron/` folders.

#### Run Production Build
```bash
npm run start
```
Runs the built app from the dist folders (requires running `npm run build` first).

#### Package Distributable
```bash
npm run package
```
Builds and packages the app into a distributable .dmg file (macOS) in the `release/` folder. This creates a standalone application that can be installed without Node.js or npm.

## Project Structure

```
todo-app/
├── electron/              # Electron main process
│   ├── main.ts           # Main process, IPC handlers, settings
│   └── preload.ts        # Secure IPC bridge (contextBridge)
├── src/                  # React renderer
│   ├── components/       # UI components (Task, Column, Sidebar, modals)
│   ├── context/          # AppContext (global state management)
│   ├── utils/            # Storage, working day calculations
│   ├── types/            # TypeScript interfaces and constants
│   ├── App.tsx           # Main app component
│   └── main.tsx          # Renderer entry point
└── docs/                 # Documentation
    ├── CLAUDE.md         # AI development guide
    └── todo_spec_v2.md   # Future features spec
```

## Tech Stack

- **Electron** - Desktop app framework
- **React** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **react-day-picker** - Calendar date picker
- **Local JSON** - Data storage

## License

MIT
