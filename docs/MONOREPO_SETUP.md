# Monorepo Setup Documentation

## Overview

This project has been converted into a monorepo structure to support both desktop (Electron) and mobile (React Native) applications while sharing business logic, types, services, and state management.

## Structure

```
BGOS_Kc/
├── packages/                    # Shared code
│   ├── shared-types/           # TypeScript types & interfaces
│   ├── shared-logic/           # Business logic & utilities
│   ├── shared-services/        # API integration (n8n webhooks)
│   └── shared-state/           # Redux Toolkit state management
├── apps/
│   ├── desktop/                # Electron app (existing, unchanged)
│   └── mobile/                 # React Native app (new)
├── pnpm-workspace.yaml         # PNPM workspace configuration
└── package.json                # Root package with workspace scripts
```

## Shared Packages

### @bgos/shared-types

Contains all TypeScript types and interfaces used across both apps:
- `User` - User account types
- `Assistant` - AI assistant definitions
- `Chat` - Chat conversation types
- `ChatHistory` - Message history types
- `Notification` - Notification types

**Location**: `packages/shared-types/src/`

### @bgos/shared-logic

Business logic and utility functions:
- `avatarUtils` - Avatar generation utilities
- `dateFormatter` - Date/time formatting
- `colors` - App color palette constants

**Location**: `packages/shared-logic/src/utils/`

### @bgos/shared-services

API service layer for backend communication:
- Axios-based HTTP client
- n8n webhook API integration
- Database sync services
- Assistant CRUD operations
- Chat CRUD operations

**Location**: `packages/shared-services/src/api/`

**Note**: Converted from RTK Query to plain Axios for React Native compatibility.

### @bgos/shared-state

Redux Toolkit state management:
- Store configuration
- User slice
- Assistant slice
- Chat slice
- Chat history slice
- UI slice

**Location**: `packages/shared-state/src/`

**Usage**:
```typescript
import { createStore, UserActions, ChatActions } from '@bgos/shared-state';

const store = createStore();
dispatch(UserActions.login({ user, token }));
```

## Commands

### Install Dependencies
```bash
pnpm install
```

### Build Shared Packages
```bash
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

## Development Workflow

### Making Changes to Shared Packages

1. Edit files in `packages/shared-*/src/`
2. Rebuild the packages:
   ```bash
   pnpm run build:shared
   ```
3. Changes are automatically available in both apps

### Working on Desktop App

The desktop app remains in the root directory and is unchanged. All existing commands work as before:
```bash
pnpm start           # Start dev mode
pnpm dev             # Start with dev tools
pnpm package         # Package for distribution
```

### Working on Mobile App

Navigate to the mobile directory:
```bash
cd apps/mobile
pnpm start           # Start Metro bundler
pnpm run android     # Run on Android
pnpm run ios         # Run on iOS (Mac only)
```

## TypeScript Configuration

### Shared Packages

Each shared package has its own `tsconfig.json` that compiles TypeScript to the `dist/` directory.

### Mobile App

The mobile app's `tsconfig.json` includes path mappings for direct source imports during development:
```json
{
  "paths": {
    "@bgos/shared-types": ["../../packages/shared-types/src"],
    "@bgos/shared-logic": ["../../packages/shared-logic/src"],
    "@bgos/shared-services": ["../../packages/shared-services/src"],
    "@bgos/shared-state": ["../../packages/shared-state/src"]
  }
}
```

## Metro Configuration (React Native)

The Metro bundler is configured for monorepo support:
- Watches the entire workspace
- Resolves shared packages from source
- Includes proper node_modules resolution

**File**: `apps/mobile/metro.config.js`

## Key Changes from Original Structure

### What Changed
- Root `package.json` updated with workspace configuration
- Added PNPM workspace configuration
- Created 4 shared packages with extracted code
- Created React Native mobile app structure

### What Stayed the Same
- Desktop app code (in root `src/`) is **unchanged**
- All desktop app scripts work as before
- Backend (n8n webhooks) unchanged
- Existing dependencies preserved

## Troubleshooting

### Metro Bundler Issues
```bash
cd apps/mobile
pnpm start --reset-cache
```

### TypeScript Can't Find Shared Packages
```bash
pnpm run build:shared
```

### Dependency Issues
```bash
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### Desktop App Broken
```bash
# Revert to working state
git checkout main -- [affected-file]
```

## Benefits of Monorepo Structure

1. **Code Reuse**: Share types, logic, services, and state between desktop and mobile
2. **Single Source of Truth**: Types and business logic defined once
3. **Easier Refactoring**: Changes propagate to both apps
4. **Consistent API Layer**: Same backend integration code
5. **Unified State Management**: Redux store works identically on both platforms

## Next Steps

Phase 2 will implement:
- Authentication flow
- Chat interface with message history
- Real-time message sync
- Offline support
- Push notifications (mobile only)
- File attachments
- Voice messages

## Related Documentation

- Phase 1 Implementation: ✅ Complete (this document)
- Phase 2 Plan: See main project README
- React Native Setup: `apps/mobile/README.md` (to be created)
- Contributing Guide: `CONTRIBUTING.md` (to be created)
