# Todo App

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

### Build

To build the app for production:
```bash
npm run build
```

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
