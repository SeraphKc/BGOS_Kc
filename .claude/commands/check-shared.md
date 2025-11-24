Search shared packages for existing functionality before creating new code. Provide the functionality you're looking for as an argument.

Example: `/check-shared date formatting` or `/check-shared avatar colors`

This command will:
1. Search packages/shared-types/ for related types
2. Search packages/shared-logic/ for related utilities
3. Search packages/shared-services/ for related API services
4. Search packages/shared-state/ for related state slices
5. Report what exists and how to import it

If nothing is found, I'll confirm that you should create the new functionality in the appropriate shared package.
