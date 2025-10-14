# 🧹 GitHub Cleanup Instructions

## ⚠️ CRITICAL: Delete Old Workflows on GitHub

You have conflicting workflows that will prevent deployment from working. Follow these exact steps:

---

## 📝 Step-by-Step Instructions

### **Step 1: Go to Your Repository**
Visit: https://github.com/SavvyOverthinking/Bored_Ball

### **Step 2: Navigate to Workflows Directory**
Click: **Code** → Navigate to `.github/workflows/`

Direct link: https://github.com/SavvyOverthinking/Bored_Ball/tree/main/.github/workflows

### **Step 3: Delete These 3 Files**

#### ❌ Delete `deploy.yml`
1. Click on `deploy.yml`
2. Click the **trash can icon** (🗑️) in the top right
3. Scroll down, commit directly to main
4. Commit message: "chore: remove conflicting deploy.yml"

#### ❌ Delete `deploy-phase2.yml`
1. Click on `deploy-phase2.yml`
2. Click the **trash can icon** (🗑️)
3. Commit directly to main
4. Commit message: "chore: remove conflicting deploy-phase2.yml"

#### ❌ Delete `jekyll-gh-pages.yml`
1. Click on `jekyll-gh-pages.yml`
2. Click the **trash can icon** (🗑️)
3. Commit directly to main
4. Commit message: "chore: remove unnecessary Jekyll workflow"

### **Step 4: Verify Only These Remain**
After deletion, you should only see:
- ✅ `ci.yml` (CI/CD checks)
- ✅ `deploy-unified.yml` (deployment workflow)

---

## 🔄 Alternative: Do It All at Once via Terminal

If you prefer command line:

```bash
# Navigate to your repo
cd ~/OneDrive/Documents/GitHub/Bored_Ball

# Delete the files locally
rm .github/workflows/deploy.yml
rm .github/workflows/deploy-phase2.yml
rm .github/workflows/jekyll-gh-pages.yml

# Commit
git add .
git commit -m "chore: remove conflicting workflow files"

# Push
git push origin main
```

---

## 📋 After Cleanup Checklist

- [ ] Only `ci.yml` and `deploy-unified.yml` remain in `.github/workflows/`
- [ ] No errors when viewing Actions tab
- [ ] GitHub Pages source set to "GitHub Actions"

---

## 🚀 Next: Push Your Local Changes

After cleaning up workflows on GitHub:

```bash
# Make sure you're in the project directory
cd ~/OneDrive/Documents/GitHub/Bored_Ball

# Stage all changes
git add .

# Commit with descriptive message
git commit -m "fix: resolve deployment conflicts, standardize on npm, add unified workflow"

# Push to trigger deployment
git push origin main
```

---

## 🔍 Verify Deployment

1. **Watch the workflow:**
   https://github.com/SavvyOverthinking/Bored_Ball/actions

2. **Wait for green checkmark** (2-3 minutes)

3. **Visit your live site:**
   https://savvyoverthinking.github.io/Bored_Ball/

4. **Test the game:**
   - Game loads without errors
   - Console (F12) shows no 404s
   - Power-ups work
   - Ball physics work

---

## ❓ Troubleshooting

### **If you see "workflow not found" errors:**
- The old workflows are trying to run but don't exist
- This is harmless and will resolve after the next push

### **If deployment fails after push:**
1. Check Actions tab for error logs
2. Common fixes:
   - Run `npm install` locally
   - Commit updated `package-lock.json`
   - Push again

### **If site shows old version:**
- Hard refresh: `Ctrl + Shift + R` (Windows) or `Cmd + Shift + R` (Mac)
- Try incognito mode
- Clear browser cache

---

## 🎯 Success Criteria

✅ **You're done when:**
1. Only 2 workflow files exist on GitHub
2. Actions tab shows green checkmark
3. Site loads at https://savvyoverthinking.github.io/Bored_Ball/
4. Game is playable with Phase 2 features

---

**Created:** October 14, 2025  
**Priority:** 🔴 **CRITICAL** - Do this first before pushing other changes

