# Required Changes for Mobile App

## Summary
The web app has some improvements in WorkflowProgress.tsx that need to be applied to the mobile app's WorkDashboardScreen.tsx and WorkflowProgressScreen.tsx.

---

## Issue 1: Asset Path Error ⚠️

### Current Problem
Mobile app files are looking for:
```typescript
source={require('../../assets/tribalbg.png')}  // WorkDashboardScreen
source={require('../../assets/tribalbg.png')}  // WorkflowProgressScreen
```

But the file doesn't exist or is only 20 bytes (placeholder).

### Required Action
**YOU MUST upload the actual `tribalbg.png` file to `/mobile-app/assets/`**

The file structure is:
```
mobile-app/
├── assets/
│   └── tribalbg.png          ← Upload actual file here (100KB+)
└── src/
    └── screens/
        ├── WorkDashboardScreen.tsx    (uses ../../assets/)
        └── WorkflowProgressScreen.tsx (uses ../../assets/)
```

From `src/screens/`, the path `../../assets/tribalbg.png` is CORRECT and goes:
- `../` = go to `src/`
- `../` = go to `mobile-app/`
- `assets/tribalbg.png` = access the file

**DO NOT** change the import paths. **UPLOAD THE ACTUAL FILE INSTEAD.**

---

## Issue 2: No Code Changes Needed ✅

After comparing the web and mobile app code, **NO changes are required** because:

### WorkflowProgress (Web) vs WorkflowProgressScreen (Mobile)

**Access Control Logic:**
- ✅ Both filter by `tal_user_access` and `gram_user_access`
- ✅ Both check role names: `['district', 'developer', 'super_admin']`
- ✅ Both filter workflows by allowed village IDs
- ✅ Logic is identical

**Workflow Loading:**
- ✅ Both load workflows with `workflow_steps` and `work` data
- ✅ Both filter by status: `['active', 'completed']`
- ✅ Both calculate progress percentages correctly

**UI Features:**
- Web: Has delete workflow, view/edit modal, photo upload
- Mobile: Simplified list view (appropriate for mobile)
- **This is intentional** - mobile UI is different by design

### WorkDashboard (Web) vs WorkDashboardScreen (Mobile)

**Access Control Logic:**
- ✅ Both filter by `tal_user_access` and `gram_user_access`
- ✅ Both check role names correctly
- ✅ Both filter works by allowed village IDs
- ✅ Logic is identical

**Work Loading:**
- ✅ Both load works with village data
- ✅ Both filter and display correctly
- ✅ Both have proper status filters

---

## Conclusion

### Changes Required: **ZERO CODE CHANGES**

### Action Required: **UPLOAD ASSET FILE ONLY**

**The only issue is the missing `tribalbg.png` asset file.**

### Steps to Fix:

1. **Upload `tribalbg.png`** to `/mobile-app/assets/`
   - File must be > 100KB (not 20 bytes)
   - Format: PNG or JPG
   - Recommended size: 1920x1080 or larger

2. **Also upload other assets** (if they're also placeholders):
   - `logo.png` (50KB+)
   - `icon.png` (100KB+, 1024x1024)
   - `adaptive-icon.png` (100KB+, 1024x1024)
   - `splash.png` (100KB+, 1024x1024)

3. **Verify file sizes:**
   ```bash
   ls -lh mobile-app/assets/
   ```

   Should show:
   ```
   -rw-r--r-- 1.4M icon.png
   -rw-r--r-- 1.4M logo.png
   -rw-r--r-- 161K tribalbg.png  ← Must be > 100KB!
   ```

4. **Test locally:**
   ```bash
   cd mobile-app
   npm start
   ```

5. **Build:**
   ```bash
   eas build --platform android --profile preview
   ```

---

## Why No Code Changes?

The mobile app code is **already up-to-date** with the web app's logic:

- ✅ Access control filtering is identical
- ✅ Role-based permissions are identical
- ✅ Data loading logic is identical
- ✅ Workflow/work filtering is identical

The **ONLY** issue is the **missing asset files**.

---

## Summary

**Code Status**: ✅ Up-to-date (NO changes needed)

**Asset Status**: ❌ Missing files (UPLOAD required)

**Required Action**: Upload `tribalbg.png` and other assets to `/mobile-app/assets/`

**After Upload**: Build will succeed

---

## Verification

After uploading assets, verify:

```bash
# Check file exists and is large enough
ls -lh mobile-app/assets/tribalbg.png

# Should show: -rw-r--r-- 161K tribalbg.png (or similar)
# NOT: -rw-r--r-- 20 tribalbg.png
```

If the file is only 20 bytes, it's still a placeholder and the build will fail.

**YOU MUST UPLOAD THE ACTUAL IMAGE FILES.**
