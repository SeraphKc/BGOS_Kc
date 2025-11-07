# BG OS AI Assistant

Interactive AI-powered chat application supporting multiple platforms.

## Monorepo Structure

This project uses a monorepo to share code between desktop and mobile apps.

### Apps
- **Desktop**: Electron app (Windows/Mac/Linux) - Production ready ✅
- **Mobile**: React Native app (Android/iOS) - **IN DEVELOPMENT** 🚧

### Shared Packages
- `@bgos/shared-types` - TypeScript types & interfaces
- `@bgos/shared-logic` - Business logic & utilities
- `@bgos/shared-services` - API integration (n8n webhooks)
- `@bgos/shared-state` - Redux Toolkit state management

## Quick Start

### Prerequisites
- Node.js >= 18
- PNPM >= 8

### Installation

```bash
# Install dependencies
pnpm install

# Build shared packages
pnpm run build:shared
```

### Run Desktop App

```bash
pnpm desktop
# or
pnpm start
```

### Run Mobile App

```bash
pnpm mobile
# or
cd apps/mobile && pnpm start
```

## Development

### Desktop App Commands
```bash
pnpm start              # Run in development mode
pnpm dev                # Run with dev tools
pnpm dev:debug          # Run with inspector
pnpm package            # Package for distribution
pnpm make               # Create distributables
```

### Mobile App Commands
```bash
cd apps/mobile
pnpm start              # Start Metro bundler
pnpm run android        # Run on Android
pnpm run ios            # Run on iOS (Mac only)
```

### Build Shared Packages
```bash
pnpm run build:shared   # Build all shared packages
```

## Tech Stack

### Desktop (Electron)
- Electron 36
- React 19
- TypeScript 5
- Redux Toolkit
- Tailwind CSS
- Framer Motion

### Mobile (React Native)
- React Native 0.76
- React Navigation
- React Native Paper
- Redux Toolkit
- TypeScript 5

### Shared
- Redux Toolkit (state management)
- Axios (API calls)
- TypeScript (type safety)

## Project Structure

```
BGOS_Kc/
├── packages/                # Shared code
│   ├── shared-types/       # TypeScript types
│   ├── shared-logic/       # Business logic
│   ├── shared-services/    # API integration
│   └── shared-state/       # Redux store
├── apps/
│   ├── desktop/            # Electron app (root src/)
│   └── mobile/             # React Native app
├── docs/                   # Documentation
├── pnpm-workspace.yaml     # Workspace config
└── package.json            # Root package
```

## Documentation

- [Monorepo Setup Guide](docs/MONOREPO_SETUP.md) - Detailed monorepo documentation
- [Development Workflow](DEVELOPMENT_WORKFLOW.md) - Development best practices
- [Backend Integration](BACKEND_TODO_AVATAR.md) - n8n webhook integration

## Project Status

- ✅ **Phase 1 Complete**: Monorepo setup with shared packages
- 🚧 **Phase 2 In Progress**: Core features (authentication, chat interface)
- 📋 **Phase 3 Planned**: Advanced features (voice, files, offline support)

## Features

### Desktop App (Production)
- ✅ User authentication
- ✅ Multiple AI assistants
- ✅ Real-time chat
- ✅ Message history
- ✅ Voice messages
- ✅ File attachments
- ✅ Dark/light theme
- ✅ Settings & preferences

### Mobile App (In Development)
- 🚧 Basic UI structure
- 🚧 Navigation setup
- 🚧 Redux integration
- 📋 Authentication flow
- 📋 Chat interface
- 📋 Push notifications
- 📋 Offline support

## Contributing

1. Create feature branch from `main`
2. Make changes following the monorepo structure
3. Test both desktop and mobile apps
4. Run `pnpm run build:shared` before committing
5. Create pull request

## License

MIT

## Authors

Denis Zhigulin & Denis Klimov
