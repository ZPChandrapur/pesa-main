# Mobile App Build Checklist

Use this checklist to build and deploy your PESA Work Tracking mobile app.

## ☐ Phase 1: Setup (10 minutes)

### Prerequisites
- [ ] Node.js installed (v18+)
- [ ] Computer with internet connection
- [ ] Android device for testing (optional)

### Installation
- [ ] Navigate to `mobile-app` folder
- [ ] Run `npm install`
- [ ] Run `npm install -g eas-cli expo-cli`
- [ ] Create Expo account at https://expo.dev/signup
- [ ] Run `eas login` with your credentials

## ☐ Phase 2: Configuration (5 minutes)

### App Customization (Optional)
- [ ] Update app name in `app.json` (line 3)
- [ ] Update bundle identifier in `app.json` (lines 15 & 20)
- [ ] Add app icon to `assets/icon.png` (1024x1024)
- [ ] Add splash screen to `assets/splash.png` (2048x2048)

### Verify Configuration
- [ ] Supabase URL is correct in `src/config/supabase.ts`
- [ ] All features match requirements in `BUILD_SUMMARY.md`

## ☐ Phase 3: Test Locally (15 minutes) - OPTIONAL

### Test with Expo Go
- [ ] Install Expo Go on Android device
- [ ] Run `npm start` in terminal
- [ ] Scan QR code with Expo Go app
- [ ] Test Work Dashboard
- [ ] Test Workflow Progress
- [ ] Test camera feature
- [ ] Test location capture
- [ ] Test offline mode

## ☐ Phase 4: Build APK (30 minutes)

### Configure Build
- [ ] Run `eas build:configure`
- [ ] Accept default options

### Build APK
- [ ] Run `eas build --platform android --profile preview`
- [ ] Wait for build to complete (~15-20 minutes)
- [ ] Note the build URL provided

### Download APK
- [ ] Go to build URL or Expo dashboard
- [ ] Download APK file
- [ ] Save to safe location
- [ ] Note APK size (~40-60 MB)

## ☐ Phase 5: Test APK (20 minutes)

### Install on Device
- [ ] Transfer APK to Android device
- [ ] Enable "Install from Unknown Sources"
- [ ] Install APK
- [ ] Open app

### Grant Permissions
- [ ] Allow Camera access
- [ ] Allow Location access
- [ ] Allow Storage access

### Test All Features
- [ ] Login with Supabase credentials
- [ ] Navigate to Work Dashboard
  - [ ] View works list
  - [ ] Test all filters (GP, Village, Taluka, Category, Status)
  - [ ] Pull to refresh
  - [ ] Click on a work
- [ ] Navigate to Workflow Progress
  - [ ] View workflows list
  - [ ] Check progress bars
  - [ ] Click on a workflow
- [ ] Test Workflow Steps
  - [ ] View all steps
  - [ ] Check step status
  - [ ] Click edit on a step
- [ ] Test Step Edit
  - [ ] Change status
  - [ ] Enter location name
  - [ ] Capture GPS location
  - [ ] Take a photo with camera
  - [ ] Pick photo from gallery
  - [ ] Save changes
- [ ] Test Offline Mode
  - [ ] Enable Airplane mode
  - [ ] Edit a step
  - [ ] Take photos
  - [ ] Capture location
  - [ ] Save changes
  - [ ] Disable Airplane mode
  - [ ] Verify auto-sync

## ☐ Phase 6: Distribution (Today)

### Share APK
- [ ] Upload APK to Google Drive/Dropbox
- [ ] Share download link via email/WhatsApp
- [ ] Or transfer APK directly to users
- [ ] Provide installation instructions

### Document Distribution
- [ ] Create list of users who received APK
- [ ] Share installation guide
- [ ] Provide support contact info

## ☐ Phase 7: Play Store Preparation (Optional - This Week)

### Account Setup
- [ ] Go to https://play.google.com/console
- [ ] Pay $25 one-time fee
- [ ] Complete account verification
- [ ] Wait for approval (1-2 days)

### Prepare Materials
- [ ] Take screenshots (at least 2)
  - [ ] Work Dashboard screen
  - [ ] Workflow Progress screen
  - [ ] Step Edit screen with camera
- [ ] Create app icon (512x512)
- [ ] Create feature graphic (1024x500)
- [ ] Write app description
- [ ] Write short description
- [ ] Create privacy policy
- [ ] Host privacy policy on website

### Build AAB
- [ ] Run `eas build --platform android --profile production`
- [ ] Download AAB file
- [ ] Keep AAB file safe

### Play Store Submission
- [ ] Login to Play Console
- [ ] Create new app
- [ ] Upload AAB file
- [ ] Complete store listing
- [ ] Add screenshots
- [ ] Add descriptions
- [ ] Set pricing (Free)
- [ ] Select categories
- [ ] Add privacy policy URL
- [ ] Complete content rating questionnaire
- [ ] Submit for review
- [ ] Wait for approval (1-7 days)

## ☐ Phase 8: iOS App (Optional - Next Week)

### Prerequisites
- [ ] macOS computer
- [ ] Xcode installed
- [ ] Apple Developer account ($99/year)

### Build iOS App
- [ ] Run `eas build --platform ios --profile production`
- [ ] Wait for build (~20-30 minutes)
- [ ] Download IPA file

### TestFlight Beta Testing
- [ ] Upload to App Store Connect
- [ ] Add beta testers
- [ ] Distribute for testing

### App Store Submission
- [ ] Complete app information
- [ ] Add screenshots (iPhone & iPad)
- [ ] Submit for review
- [ ] Wait for approval (1-3 days)

## 📝 Notes & Issues

### Build Issues
If build fails:
```bash
npm install
eas build --platform android --profile preview --clear-cache
```

### Installation Issues
- Enable "Install from Unknown Sources" in Settings
- Check device storage (need ~100MB)
- Restart device if needed

### Permission Issues
- Go to Settings > Apps > PESA Tracking > Permissions
- Enable Camera, Location, Storage

### Sync Issues
- Check internet connection
- Verify Supabase credentials
- Check app logs

## ✅ Success Criteria

- [ ] APK built successfully
- [ ] APK installs on Android device
- [ ] All permissions granted
- [ ] Can login with credentials
- [ ] Work Dashboard loads data
- [ ] Filters work correctly
- [ ] Can navigate to workflows
- [ ] Can edit steps
- [ ] Camera captures photos
- [ ] GPS captures location
- [ ] Offline mode works
- [ ] Auto-sync works when online
- [ ] No crashes or errors

## 🎯 Timeline

- **Today (Day 1)**:
  - ✅ Setup & Build APK (1 hour)
  - ✅ Test on device (30 minutes)
  - ✅ Share with team (15 minutes)

- **This Week (Days 2-7)**:
  - Create Play Console account
  - Prepare store materials
  - Build production AAB
  - Submit to Play Store

- **Next Week (Days 8-14)**:
  - Play Store approval
  - Public release
  - Monitor feedback

## 📞 Support

- **Documentation**: See README.md
- **Quick Guide**: See QUICK_START.md
- **Build Summary**: See BUILD_SUMMARY.md
- **Expo Docs**: https://docs.expo.dev
- **Expo Status**: https://expo.dev/accounts/[username]/builds

## 🎉 Completion

Once you've checked all boxes in Phase 1-5, you have:
- ✅ Working mobile app
- ✅ APK file ready to distribute
- ✅ Can install on unlimited devices
- ✅ Ready for immediate use

**Congratulations! Your mobile app is ready to use!**

---

**Current Phase**: ☐ Phase 1 (Setup)
**Next Action**: Run `cd mobile-app && npm install`
