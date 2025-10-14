# ⚡ Quick Deploy Guide

**Goal:** Get your site live on GitHub Pages in 5 minutes

---

## 🚨 DO THIS FIRST (On GitHub)

### Delete 3 Old Workflow Files:

1. Go to: https://github.com/SavvyOverthinking/Bored_Ball/tree/main/.github/workflows

2. Delete these files (click file → trash icon → commit):
   - ❌ `deploy.yml`
   - ❌ `deploy-phase2.yml`
   - ❌ `jekyll-gh-pages.yml`

3. Keep these files:
   - ✅ `ci.yml`
   - ✅ `deploy-unified.yml` (will appear after you push)

---

## ⚙️ Configure GitHub Pages

1. Go to: https://github.com/SavvyOverthinking/Bored_Ball/settings/pages

2. Under "Build and deployment":
   - Source: Select **"GitHub Actions"**
   - (NOT "Deploy from a branch")

---

## 💻 Push Your Changes (Local)

```bash
# Navigate to project
cd ~/OneDrive/Documents/GitHub/Bored_Ball

# Stage all changes
git add .

# Commit
git commit -m "fix: resolve deployment conflicts and standardize on npm"

# Push (triggers deployment)
git push origin main
```

---

## ✅ Verify Deployment

1. **Watch deployment:**
   https://github.com/SavvyOverthinking/Bored_Ball/actions
   
   Wait for ✅ green checkmark (~2-3 min)

2. **Test your site:**
   https://savvyoverthinking.github.io/Bored_Ball/
   
   - Game loads?
   - No errors in console (F12)?
   - Power-ups work?

---

## 🐛 If It Fails

### Run locally first:
```bash
npm install
npm run build
```

If build succeeds locally but fails on GitHub:
- Commit updated `package-lock.json`
- Push again

### Common issues:
- **404 on assets:** Hard refresh (Ctrl+Shift+R)
- **Old version:** Clear cache or use incognito
- **Workflow errors:** Check Actions tab logs

---

## 📄 Full Documentation

- **DEPLOYMENT_FIXES.md** - Complete deployment guide
- **CODE_REVIEW_REPORT.md** - Full code review
- **GITHUB_CLEANUP_INSTRUCTIONS.md** - Detailed cleanup steps
- **FIX_SUMMARY.md** - Overview of all changes

---

## 🎯 Success = Site Live + Game Working

**URL:** https://savvyoverthinking.github.io/Bored_Ball/

---

**Quick Reference Created:** October 14, 2025  
**Estimated Time:** 5-10 minutes total

