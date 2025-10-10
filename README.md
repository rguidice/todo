# todo App

**This is an experiment in vibe coding, Claude Code, LLM + tool access, etc. Do not take seriously. :D**
**Initial docs/todo_spec_v1/2.md files generated in Claude web UI with Sonnet 4.5. Code generated in Claude Code with Sonnet 4.5. Application icon generated with ChatGPT's GPT-5 built-in image generation.

A local-first, fast, minimal to-do list application built with Electron, React, and TypeScript.

## Features

- Multi-column kanban-style organization
- Hierarchical tasks (3 levels: parent → child → grandchild)
- Priority system (P0/P1/P2)
- Weekly reporting in Markdown format
- Dark Gruvbox theme
- Local-only storage (no cloud sync)

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
├── electron/          # Electron main process
│   ├── main.ts       # Main process entry
│   └── preload.ts    # Preload script for IPC
├── src/              # React renderer
│   ├── components/   # UI components
│   ├── hooks/        # Custom React hooks
│   ├── utils/        # Utilities
│   ├── types/        # TypeScript types
│   ├── App.tsx       # Main app component
│   └── main.tsx      # Renderer entry point
├── docs/             # Documentation
│   ├── todo_spec_v1.md   # v1 specification
│   └── todo_spec_v2.md   # Future features
└── CLAUDE.md         # AI development guide
```

## Tech Stack

- **Electron** - Desktop app framework
- **React** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Local JSON** - Data storage

## License

MIT
