# Remote Debugging with Chrome DevTools MCP

This guide explains how Claude Code monitors the Electron application directly via Chrome DevTools Protocol for real-time console access.

## Overview

**Why This Matters:**
- Allows Claude to read browser console errors directly without user copy/paste
- Enables real-time verification of fixes
- Provides screenshots and network monitoring
- Makes Testing Agent fully autonomous

---

## Setup (COMPLETED)

### 1. Chrome DevTools MCP Configuration

**File: `.mcp.json`**

Added Chrome DevTools MCP server:
```json
"chrome-devtools": {
  "command": "npx",
  "args": ["-y", "chrome-devtools-mcp@latest"],
  "description": "Chrome DevTools MCP server for accessing browser console, network logs, screenshots, and debugging."
}
```

### 2. Enable Remote Debugging in Electron

**File: `src/main.js`**

Added remote debugging flag (line 13):
```javascript
// Enable remote debugging for Chrome DevTools MCP integration
app.commandLine.appendSwitch('remote-debugging-port', '9222');
```

**What This Does:**
- Enables Chrome DevTools Protocol on port 9222
- Allows external tools to connect to the Electron renderer process
- Provides full access to console, network, DOM, and debugging APIs

**Terminal Output When App Starts:**
```
DevTools listening on ws://127.0.0.1:9222/devtools/browser/[UUID]
```

---

## How to Use Chrome DevTools MCP (For Claude)

### Method 1: Via Task Tool (Automated)

Invoke the Testing Agent with Chrome DevTools MCP access:

```
Task(subagent_type="general-purpose", prompt="
  Use Chrome DevTools MCP to:
  1. Connect to ws://127.0.0.1:9222
  2. Read console errors
  3. Take screenshot
  4. Report findings
")
```

**What the Agent Does:**
- Connects to the remote debugging endpoint
- Lists available targets (browser, renderer, extensions)
- Selects the main renderer target
- Reads console logs, errors, warnings
- Executes JavaScript in the browser context
- Takes screenshots
- Returns detailed report

### Method 2: Manual Connection (For Humans)

**Option A: Chrome Inspector**
1. Open Chrome/Edge browser
2. Navigate to `chrome://inspect/#devices`
3. Click "Configure..."
4. Add `localhost:9222`
5. Click "inspect" on your Electron app
6. Full DevTools window opens with live connection

**Option B: Direct WebSocket Connection**
- Use the WebSocket URL from terminal output
- Connect via Chrome DevTools Protocol client
- Send CDP commands programmatically

---

## The __dirname Bug: Case Study

### The Problem

**Symptom:** White screen, app not loading

**Error in Console:**
```
ReferenceError: __dirname is not defined
    at <anonymous>:355:84 (preload.js)
    at <anonymous>:7108:84 (renderer index.js)
```

**Root Cause:**
Webpack's `@vercel/webpack-asset-relocator-loader` was injecting this code:
```javascript
__webpack_require__.ab = __dirname + "/native_modules/";
```

In Electron's sandboxed renderer/preload context, `__dirname` is **not available** (security feature). This caused the bundle to crash immediately.

### Why Initial Fixes Failed

**Attempt 1: Only Fixed Preload Config**
- Created `webpack.preload.config.js` with asset relocator filter
- **Problem:** Renderer bundle (`webpack.renderer.config.js`) still had the same issue
- **Result:** Preload loaded but renderer crashed with same `__dirname` error

**Attempt 2: Webpack Cache**
- Even after fixing configs, webpack served cached bundles
- Old bundles still had `__dirname` references
- **Solution Needed:** Clear `.webpack/` cache directory

**Attempt 3: Filter Logic Issues**
- Initial filter didn't handle all loader format variations
- Loader could be: string, object with `.loader` property, or array
- **Solution:** Comprehensive filter handling all formats

### The Working Solution

**Fixed BOTH Webpack Configs:**

**File: `webpack.preload.config.js`**
```javascript
module.exports = {
  module: {
    rules: require('./webpack.rules').filter(rule => {
      if (rule.use) {
        let loaderName;
        // Handle string format
        if (typeof rule.use === 'string') {
          loaderName = rule.use;
        }
        // Handle object format
        else if (rule.use.loader) {
          loaderName = rule.use.loader;
        }
        // Handle array format
        else if (Array.isArray(rule.use)) {
          loaderName = rule.use.find(u =>
            (typeof u === 'string' && u.includes('@vercel/webpack-asset-relocator-loader')) ||
            (u.loader && u.loader.includes('@vercel/webpack-asset-relocator-loader'))
          );
        }
        // Exclude if it's the asset relocator loader
        if (loaderName && loaderName.includes && loaderName.includes('@vercel/webpack-asset-relocator-loader')) {
          return false;
        }
      }
      return true;
    }),
  },
  target: 'electron-preload',
  externals: { electron: 'commonjs electron' },
  node: { __dirname: false, __filename: false },
  output: { globalObject: 'this' },
};
```

**File: `webpack.renderer.config.js`**
```javascript
// Same filter logic applied to renderer
const filteredRules = rules.filter(rule => {
  // ... same filtering code ...
});

module.exports = {
  module: { rules: filteredRules },
  node: { __dirname: false, __filename: false }, // Critical!
  // ... rest of config
};
```

**Key Points:**
1. Filter out `@vercel/webpack-asset-relocator-loader` from **BOTH** configs
2. Set `node: { __dirname: false, __filename: false }` to prevent webpack from trying to polyfill
3. Clear webpack cache before rebuilding
4. Verify via Chrome DevTools MCP

---

## Verification Process with Chrome DevTools MCP

### Step 1: Launch App with Remote Debugging
```bash
npm start
```

Look for terminal output:
```
DevTools listening on ws://127.0.0.1:9222/devtools/browser/[UUID]
```

### Step 2: Connect via Chrome DevTools MCP

Testing Agent connects and checks:

**Console Inspection:**
```javascript
// Check for __dirname error
// Look for: "ReferenceError: __dirname is not defined"
// Expected: No such error

// Check React mounting
document.getElementById('root')?.children?.length
// Expected: > 0 (means React mounted)

// Check CSS loading
document.styleSheets.length
// Expected: > 0 (means CSS loaded)
```

**DOM Inspection:**
```javascript
// Check if root has content
const root = document.getElementById('root');
console.log('Root children:', root.children.length);
// Expected: 1 or more children
```

**Screenshot:**
Take screenshot to visually confirm app state

### Step 3: Report Findings

Testing Agent provides:
- ✅ Error status (present or resolved)
- ✅ React mounting status
- ✅ CSS loading status
- ✅ Screenshot evidence
- ✅ Console logs
- ✅ Network activity (if relevant)

---

## Troubleshooting Guide

### Issue: Chrome DevTools MCP Can't Connect

**Symptoms:**
- "Connection refused" or timeout errors
- No targets found

**Solutions:**
1. Verify app is running (`npm start`)
2. Check terminal for "DevTools listening on ws://..." message
3. Verify port 9222 is not blocked by firewall
4. Try restarting the Electron app

### Issue: Wrong Target Selected

**Symptoms:**
- Connected but showing DevTools HTML instead of app

**Solution:**
- Filter targets by type: `page` (not `other` or `iframe`)
- Look for target with `url: "http://localhost:9000/main_window"`

### Issue: Console Shows Old Errors

**Symptoms:**
- Still seeing `__dirname` error after fix

**Solution:**
1. Kill all Electron processes: `taskkill //F //IM electron.exe`
2. Clear webpack cache: `rmdir /s /q .webpack`
3. Rebuild: `npm start`
4. Wait for complete webpack compilation
5. Reconnect Chrome DevTools MCP

### Issue: Webpack Cache Not Clearing

**Symptoms:**
- Same errors persist after config changes

**Solution:**
```bash
# Manual cache clear (Windows)
cd "E:\04 BGOS App\AVA-ASSISTANT-master\AVA-ASSISTANT-master"
rmdir /s /q .webpack
npm start

# Or restart with cleared cache
taskkill //F //IM electron.exe && rmdir /s /q .webpack && npm start
```

---

## Best Practices

### 1. Always Verify Fixes with Chrome DevTools MCP

**Don't rely on user reports alone:**
- User might not refresh
- User might look at wrong window
- Cache might be serving old code

**Use Chrome DevTools MCP to:**
- Read actual console output
- Confirm errors are gone
- Verify React is rendering
- Check network requests
- Take evidence screenshots

### 2. Clear Cache When Making Webpack Changes

**Webpack caches aggressively:**
- Config changes don't always trigger rebuild
- Old bundles might be served
- `.webpack/` directory holds cached builds

**Always clear cache when modifying:**
- `webpack.*.config.js` files
- `webpack.rules.js`
- `forge.config.js` (webpack plugin section)

### 3. Check BOTH Preload and Renderer

**Electron has multiple processes:**
- Main process (Node.js context)
- Preload script (limited context)
- Renderer process (browser context)

**Common mistake:**
- Fixing only preload config
- Renderer still has the same issue
- Result: Different error in renderer

**Solution:**
- Apply fixes to **all** webpack configs
- Verify each separately via DevTools

### 4. Use Context7 MCP Before Making Webpack Changes

**Webpack configuration is complex:**
- Training data may be outdated
- Electron security model evolves
- Best practices change

**Always consult Context7 first:**
```
Ask Context7 MCP:
"Latest Electron Forge webpack configuration for preload scripts"
"How to handle __dirname in Electron renderer process"
"Webpack 5 node configuration for Electron"
```

---

## Quick Reference Commands

### Kill Electron Processes
```bash
# Windows
taskkill //F //IM electron.exe

# macOS/Linux
killall Electron
```

### Clear Webpack Cache
```bash
# Windows
rmdir /s /q .webpack

# macOS/Linux
rm -rf .webpack
```

### Fresh Start
```bash
# Windows
taskkill //F //IM electron.exe && rmdir /s /q .webpack 2>nul && npm start

# macOS/Linux
killall Electron; rm -rf .webpack; npm start
```

### Check Remote Debugging Port
```bash
# Windows
netstat -ano | findstr :9222

# macOS/Linux
lsof -i :9222
```

---

## Chrome DevTools MCP Capabilities

### What You Can Do:

**Console Access:**
- Read all console logs (log, warn, error, info)
- Execute JavaScript in browser context
- Evaluate expressions and get results

**DOM Inspection:**
- Query elements (`document.querySelector`)
- Check computed styles
- Inspect React component tree (if React DevTools available)

**Network Monitoring:**
- See all HTTP requests
- Check response codes
- Inspect payloads and headers
- Monitor WebSocket connections

**Performance:**
- Take screenshots
- Measure page load times
- Profile JavaScript execution
- Check memory usage

**Debugging:**
- Set breakpoints (programmatically)
- Step through code
- Inspect variables
- Get stack traces

---

## Future Enhancements

### Potential Improvements:

1. **Automated Testing Agent**
   - Run test suite via Chrome DevTools Protocol
   - Verify UI elements exist
   - Check for console errors automatically

2. **Performance Monitoring**
   - Track app startup time
   - Monitor memory leaks
   - Measure render performance

3. **Screenshot Comparison**
   - Take before/after screenshots
   - Detect visual regressions
   - Verify UI changes

4. **Network Request Validation**
   - Monitor webhook calls
   - Verify API responses
   - Check for failed requests

---

## Summary

**Chrome DevTools MCP enables:**
- ✅ Autonomous debugging by Testing Agent
- ✅ Real-time console error verification
- ✅ Screenshot evidence of fixes
- ✅ Faster iteration (no user copy/paste needed)
- ✅ Confidence in fix validity

**This was the breakthrough that solved the __dirname bug:**
- Direct console access showed error in BOTH preload and renderer
- Screenshot confirmed app working after fix
- No more guessing - real verification

**For future debugging sessions:**
1. Ensure app has `--remote-debugging-port=9222`
2. Use Chrome DevTools MCP via Task tool
3. Get real console output before making changes
4. Verify fixes with direct console access
5. Take screenshots as evidence

---

**Last Updated:** 2025-01-01
**Status:** Fully operational and tested
