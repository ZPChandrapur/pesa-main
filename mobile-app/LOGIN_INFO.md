# Login Information

## Mobile App Authentication

The mobile app now includes full Supabase authentication with a login screen.

### How It Works

1. **On First Launch**: App shows login screen
2. **Login Required**: User must enter email and password
3. **Authentication**: Credentials are verified against Supabase
4. **Session Persistence**: Login state is saved, no need to login again
5. **Logout**: Use the "Logout" button in the header to sign out

### Login Screen Features

- ✅ Email and password fields
- ✅ Input validation
- ✅ Loading indicator during authentication
- ✅ Error messages for failed login attempts
- ✅ Keyboard-aware layout (works on all devices)
- ✅ Clean, professional design

### Logout Feature

- Located in the header of both tabs (Work Dashboard & Workflow Progress)
- Click "Logout" button to sign out
- Returns to login screen
- Clears session data

### Authentication Flow

```
App Launch
    ↓
Check Session
    ↓
┌──────────────┬──────────────┐
│ Has Session  │ No Session   │
│ (Logged In)  │ (Logged Out) │
└──────────────┴──────────────┘
    ↓                ↓
Main App         Login Screen
(2 Tabs)             ↓
    ↓           Enter Credentials
    ↓                ↓
Logout          Authenticate
    ↓                ↓
Login Screen    Main App
```

### Testing Login

1. **Build and Install App**
2. **Launch App** - Login screen appears
3. **Enter Credentials**:
   - Email: (use your Supabase user email)
   - Password: (use your Supabase user password)
4. **Tap Login**
5. **Success**: App loads Work Dashboard
6. **Failure**: Error message shown

### Common Login Issues

#### "Invalid email or password"
- Check email is correct
- Check password is correct
- Verify user exists in Supabase
- Check Supabase is accessible

#### "Network Error"
- Check internet connection
- Verify Supabase URL is correct
- Check device has network access

#### App Crashes on Login
- Check Supabase configuration
- Verify API keys are correct
- Check console logs for errors

### Security Features

✅ **Password Hidden**: Password field uses secure text entry
✅ **Session Tokens**: JWT tokens stored securely
✅ **Auto Logout**: Session expires based on Supabase settings
✅ **Secure Storage**: AsyncStorage with encryption
✅ **No Password Storage**: Passwords never stored on device

### Supabase Configuration

The app uses these Supabase settings:
- **URL**: `https://tvmqkondihsomlebizjj.supabase.co`
- **Auth Storage**: AsyncStorage (secure)
- **Auto Refresh**: Enabled
- **Session Persistence**: Enabled

### Creating Test Users

To create users for testing:

1. **Via Supabase Dashboard**:
   - Go to Authentication > Users
   - Click "Add User"
   - Enter email and password
   - User can now login to mobile app

2. **Via SQL**:
   ```sql
   -- Not recommended, use Dashboard instead
   ```

### Role-Based Access

The mobile app respects the same role-based access as the website:
- User's role from Supabase is maintained
- Access to data based on user permissions
- Row-level security applied

### Data Sync After Login

Once logged in:
1. **Work Dashboard** loads works from database
2. **Workflow Progress** loads workflows
3. **All data** filtered by user permissions
4. **Offline mode** still works (syncs when online)

### Troubleshooting Data Issues

If Work Dashboard shows "No works found":

1. **Check Login**: Verify user is logged in
2. **Check Database**: Verify works exist in `pesa.works` table
3. **Check Permissions**: Verify user has access to data
4. **Check Network**: Ensure internet connection
5. **Pull to Refresh**: Swipe down to reload data
6. **Check Logs**: Look at console for error messages

### Error Messages

The app shows helpful error messages for:
- ❌ Network errors
- ❌ Authentication failures
- ❌ Database connection issues
- ❌ Permission errors
- ❌ Missing data

### Next Steps

After successful login:
- ✅ Browse works in Work Dashboard
- ✅ View workflow progress
- ✅ Edit steps with camera and GPS
- ✅ Work offline and auto-sync
- ✅ Logout when done

---

**Need Help?** Check the main README.md or BUILD_SUMMARY.md for more information.
