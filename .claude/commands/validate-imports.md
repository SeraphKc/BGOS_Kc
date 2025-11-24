Validate that the current file (or files you specify) uses correct import paths from shared packages.

Example: `/validate-imports` or `/validate-imports src/components/ChatArea.tsx`

This command will:
1. Scan the file(s) for import statements
2. Identify imports from local paths that should use shared packages:
   - `from '../types/model/*'` → Should use `@bgos/shared-types`
   - `from '../utils/(avatar|color|date)*'` → Should use `@bgos/shared-logic`
   - `from '../slices/*'` → Should use `@bgos/shared-state`
   - `from '../services/(Chat|Assistant)*'` → Should use `@bgos/shared-services`
3. Report problematic imports with suggestions for fixes
4. Provide code snippets with correct imports

If all imports are correct, I'll confirm that the file follows best practices.
