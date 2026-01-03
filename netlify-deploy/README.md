# Netlify Deployment Guide for PESA Privacy Policy

This guide explains how to deploy the FIMS privacy policy HTML file to Netlify and generate a public URL.

## 📁 Files in This Directory

- `privacy-policy.html` - The privacy policy webpage
- `netlify.toml` - Netlify configuration file
- `README.md` - This file

## 🚀 Deployment Methods

### Method 1: Manual Deployment (Drag & Drop)

This is the easiest method for quick deployment.

#### Steps:

1. **Create a Netlify Account**
   - Go to [https://www.netlify.com](https://www.netlify.com)
   - Sign up with GitHub, GitLab, Bitbucket, or Email

2. **Deploy via Drag & Drop**
   - Log into your Netlify dashboard
   - Click "Add new site" → "Deploy manually"
   - Drag and drop the entire `netlify-deploy` folder onto the upload area
   - Wait for the deployment to complete (usually takes 10-30 seconds)

3. **Get Your Privacy Policy URL**
   - After deployment, you'll get a URL like: `https://random-name-12345.netlify.app`
   - Your privacy policy will be accessible at: `https://random-name-12345.netlify.app/privacy-policy.html`

4. **Custom Domain (Optional)**
   - Click "Domain settings" in your site dashboard
   - Click "Options" → "Edit site name"
   - Change to something like: `fims-privacy-policy` or `fims-chandrapur-privacy`
   - Your new URL will be: `https://fims-privacy-policy.netlify.app/privacy-policy.html`

---

### Method 2: Netlify CLI Deployment

For command-line deployment and automatic updates.

#### Prerequisites:
- Node.js installed on your system
- npm or yarn package manager

#### Steps:

1. **Install Netlify CLI**
   ```bash
   npm install -g netlify-cli
   ```

2. **Login to Netlify**
   ```bash
   netlify login
   ```
   This will open a browser window to authenticate.

3. **Navigate to the Deploy Directory**
   ```bash
   cd netlify-deploy
   ```

4. **Initialize and Deploy**
   ```bash
   netlify init
   ```
   - Choose "Create & configure a new site"
   - Select your team
   - Enter a site name (e.g., `pesa-privacy-policy`)
   - Deploy path: `.` (current directory)

5. **Deploy Updates**
   After making changes to `privacy-policy.html`:
   ```bash
   netlify deploy --prod
   ```

6. **Get Your Site URL**
   ```bash
   netlify open
   ```

---

### Method 3: GitHub Integration (Recommended for Continuous Deployment)

This method automatically deploys whenever you push changes to GitHub.

#### Steps:

1. **Push This Repository to GitHub**
   ```bash
   git add .
   git commit -m "Add Netlify deployment"
   git push origin main
   ```

2. **Connect to Netlify**
   - Log into [Netlify](https://app.netlify.com)
   - Click "Add new site" → "Import an existing project"
   - Select "GitHub" and authorize Netlify
   - Choose your `FIMS-APPS` repository

3. **Configure Build Settings**
   - Base directory: `netlify-deploy`
   - Build command: (leave empty)
   - Publish directory: `.` (or leave empty)
   - Click "Deploy site"

4. **Automatic Deployments**
   - Every push to your GitHub repository will automatically trigger a deployment
   - Changes to `privacy-policy.html` will be live within minutes

---

## 📝 Configuration Details

### netlify.toml Explanation

```toml
[build]
  publish = "."      # Publish the current directory
  command = ""       # No build command needed (static HTML)
```

This configuration tells Netlify:
- There's no build step required (it's a static HTML file)
- Publish everything in the current directory

---

## 🔗 Using the Privacy Policy URL in Your App

After deployment, update your app configuration:

### Android (app.json or google-services.json):
```json
{
  "privacyPolicyUrl": "https://your-site-name.netlify.app/privacy-policy.html"
}
```

### iOS (Info.plist):
```xml
<key>PrivacyPolicyURL</key>
<string>https://your-site-name.netlify.app/privacy-policy.html</string>
```

### In Your React Native App:
```javascript
const PRIVACY_POLICY_URL = 'https://your-site-name.netlify.app/privacy-policy.html';

// Use in ProfileScreen or settings
<TouchableOpacity onPress={() => Linking.openURL(PRIVACY_POLICY_URL)}>
  <Text>Privacy Policy</Text>
</TouchableOpacity>
```

---

## ✏️ Updating the Privacy Policy

### If Using Manual/CLI Deployment:

1. Edit `privacy-policy.html` with your changes
2. Re-deploy:
   ```bash
   cd netlify-deploy
   netlify deploy --prod
   ```

### If Using GitHub Integration:

1. Edit `privacy-policy.html`
2. Commit and push:
   ```bash
   git add netlify-deploy/privacy-policy.html
   git commit -m "Update privacy policy"
   git push origin main
   ```
3. Netlify will automatically deploy the changes

---

## 🌐 Custom Domain Setup (Optional)

If you own a domain (e.g., `fims.chandrapur.gov.in`):

1. **In Netlify Dashboard:**
   - Go to "Domain settings"
   - Click "Add custom domain"
   - Enter your domain: `privacy.fims.chandrapur.gov.in`

2. **Configure DNS:**
   - Add a CNAME record in your DNS provider:
     - Type: CNAME
     - Name: privacy
     - Value: `your-site-name.netlify.app`
   - Wait for DNS propagation (5-30 minutes)

3. **Enable HTTPS:**
   - Netlify automatically provisions a free SSL certificate via Let's Encrypt
   - Your site will be accessible at: `https://privacy.fims.chandrapur.gov.in`

---

## 🔒 Security & Best Practices

1. **HTTPS**: Netlify automatically provides free HTTPS for all sites
2. **CDN**: Your privacy policy is served via Netlify's global CDN for fast access
3. **Version Control**: Keep `privacy-policy.html` in Git for version history
4. **Regular Updates**: Update the "Last Updated" date when making changes

---

## 📊 Monitoring & Analytics

### View Deployment Status:
```bash
netlify status
```

### View Site Logs:
- Log into Netlify dashboard
- Select your site
- Go to "Deploys" tab to see deployment history

### Add Analytics (Optional):
- In Netlify dashboard → "Site settings" → "Analytics"
- Enable Netlify Analytics for visitor statistics

---

## 🆘 Troubleshooting

### Issue: 404 Error After Deployment
**Solution**: Make sure `privacy-policy.html` is in the root of the `netlify-deploy` folder.

### Issue: Changes Not Showing Up
**Solution**: 
- Clear browser cache
- Check deployment status in Netlify dashboard
- Wait 1-2 minutes for CDN to update

### Issue: CLI Command Not Found
**Solution**:
```bash
npm install -g netlify-cli
# or
npx netlify-cli deploy --prod
```

---

## 📞 Support

- **Netlify Documentation**: [https://docs.netlify.com](https://docs.netlify.com)
- **Netlify Support**: [https://answers.netlify.com](https://answers.netlify.com)
- **FIMS Support**: Contact your system administrator

---

## ✅ Quick Start Checklist

- [ ] Create Netlify account
- [ ] Deploy `netlify-deploy` folder to Netlify
- [ ] Get and note down the deployment URL
- [ ] Test privacy policy URL in browser
- [ ] (Optional) Set custom domain name
- [ ] Update privacy policy URL in your mobile app
- [ ] Test privacy policy link in the app
- [ ] Set up automatic deployments (GitHub integration)

---

**Your privacy policy URL will look like:**
- Default: `https://your-site-name.netlify.app/privacy-policy.html`
- Custom: `https://fims-privacy-policy.netlify.app/privacy-policy.html`
- Domain: `https://privacy.fims.chandrapur.gov.in`

Use this URL in your Play Store/App Store submission and in your mobile app settings.
