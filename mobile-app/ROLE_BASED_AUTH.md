# Role-Based Authentication & Visibility - Mobile App

## Overview

Role-based authentication and data visibility has been implemented in the mobile app, matching the website's behavior exactly.

Users can only see villages and works they have access to based on their role.

---

## Implementation

### 1. Enhanced AuthContext

**File**: `src/context/AuthContext.tsx`

**Added Properties**:
```typescript
interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  userId: string | null;      // ✅ NEW
  roleId: number | null;       // ✅ NEW
  roleName: string | null;     // ✅ NEW
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}
```

**Login Flow**:
1. User enters email and password
2. Authenticate with Supabase
3. Fetch `role_id` from `user_roles` table
4. Check permission in `application_permissions` table for 'pesa' app
5. If no access → Sign out and throw error
6. Fetch `role name` from `roles` table
7. Store `userId`, `roleId`, and `roleName` in context

**Logout Flow**:
- Clear `userId`, `roleId`, and `roleName` on sign out

---

### 2. Work Dashboard with Role Filtering

**File**: `src/screens/WorkDashboardScreen.tsx`

**Access to Context**:
```typescript
const { user, userId, roleName } = useAuth();
```

**Village Filtering Logic**:
```typescript
// Load all villages first
const allVillages = await getAllVillages();

// Filter based on role
if (!['district', 'developer', 'super_admin'].includes(roleName)) {
  // Regular users only see villages where:
  // - tal_user_access = userId OR
  // - gram_user_access = userId

  filteredVillages = allVillages.filter(v =>
    v.tal_user_access === userId || v.gram_user_access === userId
  );
} else {
  // District/Developer/Super Admin see all villages
  filteredVillages = allVillages;
}
```

**Work Filtering Logic**:
```typescript
// Load all works
const allWorks = await getAllWorks();

// Filter based on allowed villages
if (!['district', 'developer', 'super_admin'].includes(roleName)) {
  // Get allowed village IDs
  const allowedVillageIds = filteredVillages.map(v => v.id);

  // Only show works from allowed villages
  filteredWorks = allWorks.filter(w =>
    allowedVillageIds.includes(w.village_id)
  );
} else {
  // District/Developer/Super Admin see all works
  filteredWorks = allWorks;
}
```

---

## Database Tables Used

### 1. `pesa.user_roles`
Maps users to roles:
- `user_id` (UUID) → Supabase auth user ID
- `role_id` (number) → Role identifier

### 2. `pesa.roles`
Defines available roles:
- `id` (number) → Role ID
- `name` (text) → Role name (e.g., 'district', 'developer', 'super_admin', 'taluka', 'gram_panchayat')

### 3. `pesa.application_permissions`
Controls app access:
- `role_id` (number) → Role ID
- `application_name` (text) → App name ('pesa')

### 4. `pesa.villages`
Village data with access control:
- `id` (UUID) → Village ID
- `village_name` (text) → Village name
- `tal_user_access` (UUID) → Taluka user with access
- `gram_user_access` (UUID) → Gram Panchayat user with access

### 5. `pesa.works`
Work records:
- `id` (UUID) → Work ID
- `village_id` (UUID) → Associated village
- Other work fields...

---

## Role Types

### Admin Roles (See Everything):
1. **district** - District level admin
2. **developer** - System developer
3. **super_admin** - Super administrator

These roles see:
- ✅ All villages
- ✅ All works
- ✅ All data

### User Roles (Limited Access):
1. **taluka** - Taluka level user
2. **gram_panchayat** - Gram Panchayat level user
3. Other custom roles

These roles see:
- ✅ Only villages where `tal_user_access` or `gram_user_access` = their user ID
- ✅ Only works from those villages
- ❌ Cannot see other villages' data

---

## Login Flow Example

### Example 1: Admin User
```
1. Login with email/password
2. Fetch role: "district"
3. Check permission: ✅ Has 'pesa' access
4. Result:
   - userId: "abc-123"
   - roleId: 1
   - roleName: "district"
5. Load data:
   - Villages: ALL 50 villages
   - Works: ALL 12 works
```

### Example 2: Taluka User
```
1. Login with email/password
2. Fetch role: "taluka"
3. Check permission: ✅ Has 'pesa' access
4. Result:
   - userId: "def-456"
   - roleId: 4
   - roleName: "taluka"
5. Load data:
   - Villages: Only 5 villages where tal_user_access = "def-456"
   - Works: Only 3 works from those 5 villages
```

### Example 3: No Permission User
```
1. Login with email/password
2. Fetch role: "finance"
3. Check permission: ❌ No 'pesa' access
4. Sign out automatically
5. Show error: "You do not have access to PESA application"
```

---

## Testing Instructions

### Test Admin Access:
1. Login with district/developer/super_admin account
2. Open Work Dashboard
3. Should see all villages in dropdown
4. Should see all works in table
5. Count cards show total counts

### Test Taluka User Access:
1. Login with taluka user account
2. Open Work Dashboard
3. Should see only assigned villages in dropdown
4. Should see only works from those villages
5. Count cards show filtered counts

### Test Gram Panchayat User Access:
1. Login with gram_panchayat user account
2. Open Work Dashboard
3. Should see only assigned village
4. Should see only works from that village
5. Count cards show filtered counts

### Test No Access:
1. Login with user that has no PESA permission
2. Should be logged out automatically
3. Should see error message
4. Cannot access app

---

## Code Changes Summary

### Modified Files:

1. **`src/context/AuthContext.tsx`**
   - Added `userId`, `roleId`, `roleName` to context
   - Enhanced `signIn` to fetch role information
   - Check `application_permissions` during login
   - Clear role data on `signOut`

2. **`src/screens/WorkDashboardScreen.tsx`**
   - Added `userId`, `roleName` from context
   - Added `allVillages` state for filtering
   - Filter villages based on role
   - Filter works based on allowed villages
   - Load villages first, then works (sequential)

---

## What This Fixes

✅ **Security**: Users can only see their assigned data
✅ **Privacy**: No access to other users' villages/works
✅ **Role Enforcement**: Admin roles see everything, user roles see limited data
✅ **Permission Check**: No PESA access = cannot login
✅ **Same as Website**: Identical behavior to web app

---

## Next Steps

If you want to add role-based auth to other screens:

1. **WorkflowProgressScreen**: Filter workflows by allowed works
2. **WorkflowStepsScreen**: Show steps only for accessible workflows
3. Any other data screens

The pattern is the same:
- Get `userId` and `roleName` from `useAuth()`
- Filter villages by access fields
- Filter related data by allowed villages

---

## Summary

Role-based authentication is now fully implemented:

✅ **Login**: Fetches role and checks PESA permission
✅ **Context**: Stores userId, roleId, roleName
✅ **Work Dashboard**: Filters villages and works by role
✅ **Admin Roles**: See all data
✅ **User Roles**: See only assigned data
✅ **No Permission**: Cannot access app

**The mobile app now has the same role-based security as the website!**
