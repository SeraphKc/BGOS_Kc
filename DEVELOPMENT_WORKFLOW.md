# Development Workflow - Quick Start Guide

> **For Kc**: Use this guide when starting a new development session with Claude Code.

## Starting a New Session

### 1. Open Terminal in Project Folder
```bash
cd "E:\04 BGOS App\AVA-ASSISTANT-master\AVA-ASSISTANT-master"
```

### 2. Start Claude Code
```bash
claude
```

### 3. First Message to Claude Code
```
Read .claude/project-context.md to understand the project, then help me with: [your feature request]
```

**Examples:**
- "Read .claude/project-context.md, then help me add a dark mode toggle to the settings"
- "Read .claude/project-context.md, then help me create a notifications system"
- "Read .claude/project-context.md, then help me fix the search functionality"

## During Development

### Check App Status
```bash
npm start
```
(App runs on http://localhost:9000)

### Check Git Status
```bash
git status
```

### View Recent Commits
```bash
git log --oneline -5
```

## After Completing a Feature

### 1. Commit Your Changes
Let Claude Code handle this - just say:
```
Commit all changes with a descriptive message
```

Claude Code will:
- Stage all changes (`git add .`)
- Create a commit with proper message
- Include attribution

### 2. Push to GitHub
Say to Claude Code:
```
Push my changes to GitHub
```

Claude Code will:
- Push your feature branch
- Handle authentication if needed

### 3. Create Pull Request
Say to Claude Code:
```
Create a Pull Request for review
```

Claude Code will:
- Create PR with detailed description
- Set proper base and head branches
- Include all changes summary

**Or do it manually:**
```bash
"C:\Program Files\GitHub CLI\gh.exe" pr create --title "Your Feature Title" --body "Description" --base master
```

## Git Workflow Summary

```
feature/improvements (your work)
       ↓
    git commit
       ↓
    git push
       ↓
  Pull Request
       ↓
    Review by colleague
       ↓
    Merge to master
```

## Quick Commands Reference

### Git Commands
```bash
# Check branch
git branch

# Check status
git status

# View changes
git diff

# View commit history
git log --oneline -10

# Switch branch
git checkout feature/improvements
```

### GitHub CLI Commands
```bash
# Check auth status
"C:\Program Files\GitHub CLI\gh.exe" auth status

# View PRs
"C:\Program Files\GitHub CLI\gh.exe" pr list

# View PR status
"C:\Program Files\GitHub CLI\gh.exe" pr status

# View repo
"C:\Program Files\GitHub CLI\gh.exe" repo view
```

## Important File Locations

- **Claude Context**: `.claude/project-context.md` (Claude Code reads this)
- **Reference Images**: `Reference Images/` (UI design references)
- **Components**: `src/components/`
- **Redux Slices**: `src/slices/`
- **Utils**: `src/utils/`

## Common Tasks

### Add a New Feature
1. Start Claude Code in project folder
2. Ask: "Read .claude/project-context.md, then help me add [feature]"
3. Let Claude Code implement
4. Test the feature
5. Ask Claude Code to commit and create PR

### Fix a Bug
1. Start Claude Code in project folder
2. Ask: "Read .claude/project-context.md, then help me fix [bug description]"
3. Let Claude Code investigate and fix
4. Test the fix
5. Ask Claude Code to commit and create PR

### Update Styling
1. Start Claude Code in project folder
2. Ask: "Read .claude/project-context.md, then help me update [component] styling"
3. Remember: Yellow (#FFD700) for primary actions, hover effects mandatory
4. Test the changes
5. Ask Claude Code to commit and create PR

## Best Practices

1. **Always start fresh sessions from the correct folder**
2. **Always have Claude Code read `.claude/project-context.md` first**
3. **Test features before committing**
4. **Create descriptive commit messages**
5. **One feature per Pull Request**
6. **Update `.claude/project-context.md` when adding major features**

## Troubleshooting

### "gh: command not found"
Use full path:
```bash
"C:\Program Files\GitHub CLI\gh.exe" [command]
```

### "Authentication failed"
Re-authenticate:
```bash
"C:\Program Files\GitHub CLI\gh.exe" auth login --web
```

### "No changes to commit"
Check what changed:
```bash
git status
git diff
```

### App won't start
Kill existing process:
```bash
taskkill /F /IM electron.exe
npm start
```

## Repository Info

- **GitHub URL**: https://github.com/teamp8s/AVA-ASSISTANT.git
- **Your Branch**: feature/improvements
- **Base Branch**: master
- **Your GitHub**: SeraphKc

## Notes

- **Don't resume very old Claude Code sessions** - start fresh for new features
- **Keep `.claude/project-context.md` updated** when you make major changes
- **Reference images** in `Reference Images/` folder for UI consistency
- **All PRs** should be reviewed by your colleague before merging

---

**Quick Start**: `cd` to project → `claude` → "Read .claude/project-context.md, then [your request]"
