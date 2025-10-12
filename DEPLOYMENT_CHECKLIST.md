# 🚀 Deployment Checklist

## Current Issue
The site is loading source files (`src/main.tsx`) instead of built files (`assets/main-xxx.js`).

## Root Cause
GitHub Pages repository settings likely not configured to use GitHub Actions as the deployment source.

## ✅ Fix Instructions

### Step 1: Configure GitHub Pages Settings

1. Go to: https://github.com/SavvyOverthinking/Bored_Ball/settings/pages
2. Under **"Build and deployment"** section:
   - **Source**: Select **"GitHub Actions"** from the dropdown
   - (NOT "Deploy from a branch")
3. Save the settings (if there's a save button)

### Step 2: Verify Workflow Completed

1. Check: https://github.com/SavvyOverthinking/Bored_Ball/actions
2. The most recent workflow should show ✅ green checkmark
3. Click on it and verify all steps completed successfully

### Step 3: Force Re-deployment

After changing settings, trigger a new deployment:

```bash
# Make a trivial change to force re-deploy
git commit --allow-empty -m "chore: trigger deployment"
git push origin main
```

### Step 4: Verify Deployment

Wait 2-3 minutes, then check:

1. Visit: https://savvyoverthinking.github.io/Bored_Ball/
2. Open Developer Console (F12)
3. **Success indicators:**
   - ✅ No errors about `src/main.tsx`
   - ✅ Loads: `/Bored_Ball/assets/main-xxx.js`
   - ✅ Game appears and runs
   - ✅ Calendar emoji 📅 favicon

4. **If still showing errors:**
   - Hard refresh: `Ctrl + Shift + R` (Windows) or `Cmd + Shift + R` (Mac)
   - Try incognito/private browsing mode
   - Clear browser cache completely

## What Should Be Deployed

The `dist/` folder contents after build:
```
dist/
  ├── index.html (renamed from index-phase2.html)
  ├── assets/
  │   ├── main-BFA_6BR1.js (compiled game code)
  │   └── main-BW1QxP2E.css (compiled styles)
  ├── splash.jpg
  ├── splash.png
  ├── sprites/
  └── .nojekyll
```

## Troubleshooting

### If GitHub Actions source is not available:
- Your repository might not have GitHub Actions enabled
- Check repository settings → Actions → General
- Ensure "Allow all actions and reusable workflows" is selected

### If workflow fails:
- Check the Actions logs for specific error messages
- Common issues:
  - npm ci failure → regenerate package-lock.json
  - Build failure → check TypeScript errors
  - Deploy failure → check permissions

