# 🚀 Deployment Fixes & Setup Guide

## ❌ Problems Identified

### **1. Multiple Conflicting GitHub Actions Workflows**

Your repository has **4 different workflow files** all trying to deploy to GitHub Pages:

```
.github/workflows/
├── ci.yml                    ✅ Keep (CI only, doesn't deploy)
├── deploy.yml               ❌ DELETE (uses pnpm, conflicts)
├── deploy-phase2.yml        ❌ DELETE (conflicts, wrong approach)
├── jekyll-gh-pages.yml      ❌ DELETE (Jekyll not needed for Vite)
└── deploy-unified.yml       ✅ NEW (single source of truth)
```

**Issue:** All use `concurrency.group: "pages"`, causing deployment conflicts.

### **2. Package Manager Confusion**

You have both:
- `package-lock.json` (npm)
- `pnpm-lock.yaml` (pnpm)

**Problem:** Workflows used pnpm, but local dev uses npm. This creates dependency mismatches.

**Fix:** Standardized to **npm** (already have package-lock.json).

### **3. Missing `.nojekyll` File**

GitHub Pages runs Jekyll by default, which ignores files starting with `_` and certain directories.
Vite builds need `.nojekyll` in the dist folder to serve correctly.

### **4. Phase 2 Build Not Generating Correct Output**

The `build:phase2` script created a separate `dist-phase2/` directory, but GitHub Pages can only serve from one location.

---

## ✅ Solutions Applied

### **1. Created Unified Workflow**

**File:** `.github/workflows/deploy-unified.yml`

**What it does:**
- Uses **npm** consistently
- Builds Phase 2 by default (enhanced version)
- Automatically renames `index-phase2.html` → `index.html`
- Creates `.nojekyll` file automatically
- Single deployment target (no conflicts)

### **2. Updated Package Scripts**

**New scripts in `package.json`:**
```json
{
  "dev": "vite",                                    // Dev server (Phase 2)
  "dev:v1": "vite --port 3000",                     // Dev server (v1.0)
  "dev:phase2": "cross-env VITE_PHASE2=1 vite --port 3003",
  "build": "cross-env VITE_PHASE2=1 vite build",    // Production (Phase 2)
  "build:v1": "vite build",                         // Production (v1.0)
  "preview": "vite preview --port 4173"
}
```

**Philosophy:** Phase 2 is the main version going forward.

### **3. Cleaned Up vite.config.ts**

Removed console.log statements from production config.

### **4. Removed pnpm-lock.yaml**

Standardized on npm package manager.

---

## 🔧 How to Deploy (Step-by-Step)

### **On GitHub:**

#### Step 1: Delete Old Workflows
Go to your repository on GitHub and delete these files:
1. `.github/workflows/deploy.yml`
2. `.github/workflows/deploy-phase2.yml`
3. `.github/workflows/jekyll-gh-pages.yml`

Keep only:
- `.github/workflows/ci.yml` (for linting/testing)
- `.github/workflows/deploy-unified.yml` (for deployment)

#### Step 2: Configure GitHub Pages Settings
1. Go to: https://github.com/SavvyOverthinking/Bored_Ball/settings/pages
2. Under **"Build and deployment"**:
   - **Source:** Select **"GitHub Actions"**
   - (NOT "Deploy from a branch")

#### Step 3: Commit and Push Changes
```bash
# Stage all changes
git add .

# Commit
git commit -m "fix: resolve deployment conflicts and standardize on npm"

# Push to trigger deployment
git push origin main
```

#### Step 4: Monitor Deployment
1. Go to: https://github.com/SavvyOverthinking/Bored_Ball/actions
2. Watch the "Deploy to GitHub Pages" workflow
3. Should complete in ~2-3 minutes

#### Step 5: Verify Live Site
Visit: https://savvyoverthinking.github.io/Bored_Ball/

**Success indicators:**
- ✅ Game loads without errors
- ✅ Console shows no 404s for assets
- ✅ Phase 2 features working (power-ups, difficulty curve)

---

## 🐛 Troubleshooting

### **If deployment still fails:**

1. **Check workflow logs:**
   - Click on the failed workflow
   - Check "build-and-deploy" job logs
   - Look for specific error messages

2. **Common issues:**
   - **"npm ci" fails** → Delete `package-lock.json`, run `npm install`, commit
   - **"404 on assets"** → Clear browser cache (Ctrl+Shift+R)
   - **"Page not found"** → Check base URL in vite.config.ts

3. **Force clean deploy:**
   ```bash
   # Clear GitHub Actions cache
   git commit --allow-empty -m "chore: force rebuild"
   git push origin main
   ```

### **If you want v1.0 instead of Phase 2:**

Change the deployment workflow to build v1.0:
```yaml
# In deploy-unified.yml, replace:
- name: Build Phase 2 (Production)
  env:
    VITE_PHASE2: '1'
  run: npm run build

# With:
- name: Build v1.0 (Production)
  run: npm run build:v1
```

---

## 📊 Architecture Decisions

### **Why Phase 2 as Default?**
- More polished experience
- Progressive difficulty curve
- Better player retention
- Includes all v1.0 features + enhancements

### **Why Unified Workflow?**
- Single source of truth
- No concurrency conflicts
- Simpler to maintain
- Faster deployments

### **Why npm over pnpm?**
- Already have package-lock.json
- Better GitHub Actions compatibility
- Simpler for contributors

---

## 📝 Local Development Workflow

### **Recommended:**
```bash
# Install dependencies (first time)
npm install

# Start Phase 2 dev server
npm run dev:phase2
# → http://localhost:3003

# Build for production
npm run build
# → dist/

# Preview production build
npm run preview
# → http://localhost:4173
```

### **If you need v1.0:**
```bash
# Start v1.0 dev server
npm run dev:v1
# → http://localhost:3000

# Build v1.0
npm run build:v1
# → dist/
```

---

## ✅ Checklist Before Pushing

- [ ] Deleted old workflow files on GitHub
- [ ] Committed new `deploy-unified.yml`
- [ ] Removed `pnpm-lock.yaml`
- [ ] Ran `npm install` to ensure package-lock.json is up to date
- [ ] Tested build locally: `npm run build`
- [ ] Verified build output in `dist/` folder
- [ ] Set GitHub Pages source to "GitHub Actions"

---

## 🎯 Expected Results

After pushing these changes:

1. **GitHub Actions** will automatically:
   - Install dependencies with npm
   - Build Phase 2 version
   - Create `.nojekyll` file
   - Deploy to GitHub Pages

2. **Your site** will be live at:
   - https://savvyoverthinking.github.io/Bored_Ball/

3. **Features working:**
   - ✅ Phase 2 difficulty curve
   - ✅ Weekly power-ups
   - ✅ Weekend email dodge
   - ✅ All assets loading correctly

---

## 🔮 Future Improvements

1. **Add Preview Deployments:**
   - Deploy PRs to temporary URLs
   - Test before merging

2. **Add Version Switching:**
   - Deploy both v1.0 and Phase 2
   - Let users choose version

3. **Add Automated Testing:**
   - Run tests before deployment
   - Prevent broken builds

4. **Add Performance Monitoring:**
   - Bundle size checks
   - Lighthouse CI

---

**Created:** October 14, 2025  
**Status:** ✅ Ready to deploy  
**Next Step:** Delete old workflows on GitHub, then push these changes

