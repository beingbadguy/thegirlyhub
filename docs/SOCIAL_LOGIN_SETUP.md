# Social Login Setup Guide

Social login is implemented but **not working** because API credentials are missing from `.env` file.

This guide shows how to get credentials for **Google**, **Facebook**, and **Apple** OAuth.

---

## Quick Status

- ✅ Frontend: SocialAuthButtons component ready
- ✅ Backend: All three providers implemented
- ❌ Configuration: **Missing API credentials in `.env`**

---

## Google OAuth 2.0

### Step 1: Create Google Cloud Project
1. Go to https://console.cloud.google.com
2. Create a new project (name it "GirlyHub" or similar)
3. Wait for project to be created

### Step 2: Enable Google+ API
1. Search for "Google+ API" in the search bar
2. Click on it and press "Enable"

### Step 3: Create OAuth 2.0 Credentials
1. Go to **Credentials** (left sidebar)
2. Click **+ Create Credentials** → **OAuth 2.0 Client ID**
3. If prompted, configure the OAuth consent screen first:
   - **User Type**: External
   - **App name**: GirlyHub
   - **User support email**: your-email@gmail.com
   - **Developer contact**: your-email@gmail.com
   - Click "Save and Continue" through all screens

4. Back to Credentials, click **+ Create Credentials** → **OAuth 2.0 Client ID**
5. **Application type**: Web application
6. **Name**: GirlyHub Web Client

### Step 4: Configure Redirect URIs
Add these authorized redirect URIs:

```
http://localhost:3000/api/auth/google
http://localhost:3000
https://yourdomain.com/api/auth/google
https://yourdomain.com
```

### Step 5: Get Your Credentials
1. Copy **Client ID** and **Client Secret** from the credentials page
2. Update `.env`:

```env
GOOGLE_CLIENT_ID=<your-client-id>.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=<your-client-secret>
NEXT_PUBLIC_GOOGLE_CLIENT_ID=<your-client-id>.apps.googleusercontent.com
```

### Step 6: Test
1. Run `npm run dev`
2. Go to login page
3. Click "Continue with Google"
4. Should see Google login popup

---

## Facebook Login

### Step 1: Create Facebook App
1. Go to https://developers.facebook.com/apps
2. Click **My Apps** → **Create App**
3. **App Type**: Consumer
4. **App Name**: GirlyHub
5. Fill other fields and click **Create App**

### Step 2: Add Facebook Login Product
1. In your app dashboard, click **+ Add Product**
2. Search for "Facebook Login" and click **Set Up**
3. Choose **Web** as platform

### Step 3: Configure App Settings
1. Go to **Settings** → **Basic**
2. Copy **App ID** and **App Secret**

### Step 4: Add Authorized Redirect URIs
1. Go to **Facebook Login** → **Settings**
2. Under "Valid OAuth Redirect URIs", add:

```
http://localhost:3000
https://yourdomain.com
```

3. Click **Save Changes**

### Step 5: Add Test Users
1. Go to **Roles** → **Test Users**
2. Click **+ Create Test User**
3. Create a test account you can use for testing

### Step 6: Update .env
```env
FACEBOOK_APP_ID=<your-app-id>
FACEBOOK_APP_SECRET=<your-app-secret>
NEXT_PUBLIC_FACEBOOK_APP_ID=<your-app-id>
```

### Step 7: Test
1. Run `npm run dev`
2. Go to login page
3. Click "Continue with Facebook"
4. Should see Facebook login popup

---

## Apple Sign In

### Requirements
- ⚠️ **Apple Developer Account** ($99/year)
- ⚠️ **More Complex** than Google/Facebook
- ⚠️ **Only works on HTTPS** (not localhost)
- Mainly for iOS apps, but works for web too

### Step 1: Get Apple Developer Account
1. Go to https://developer.apple.com
2. Register with Apple ID
3. Enroll in Apple Developer Program ($99/year)

### Step 2: Create App ID
1. Go to **Certificates, Identifiers & Profiles**
2. Click **Identifiers** → **App IDs**
3. Click **+** to create new
4. **App Type**: Web
5. **Description**: GirlyHub Web
6. **Identifier**: com.example.girlyhub (or your domain)

### Step 3: Create Services ID
1. Go to **Identifiers** → **Services IDs**
2. Click **+** to create new
3. Register the identifier: `com.example.girlyhub.web`
4. In **Sign In with Apple**, click "Configure"
5. **Domains**: yourdomain.com
6. **Return URLs**: 
   - https://yourdomain.com/api/auth/apple/callback
   - https://yourdomain.com

### Step 4: Create Private Key
1. Go to **Keys**
2. Click **+** to create new key
3. Enable "Sign in with Apple"
4. Click **Configure** and select your App ID
5. Click **Save** then **Register**
6. **Download the .p8 file** (save it safely)

### Step 5: Get Team ID
1. Go to **Account** → **Membership** 
2. Copy your **Team ID** (format: XXXXXXXXXX)

### Step 6: Update .env
Extract values from the .p8 file:

```env
APPLE_TEAM_ID=<your-team-id>
APPLE_CLIENT_ID=com.example.girlyhub.web
APPLE_KEY_ID=<key-id-from-file>
APPLE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n<content>\n-----END PRIVATE KEY-----
NEXT_PUBLIC_APPLE_CLIENT_ID=com.example.girlyhub.web
NEXT_PUBLIC_APPLE_REDIRECT_URI=https://yourdomain.com/api/auth/apple/callback
```

### Step 7: Test (Production Only)
- Apple Sign In only works on **HTTPS**
- Localhost testing not supported
- Deploy to production first to test

---

## Troubleshooting

### Google Login Not Working

**Problem**: "Could not load Google login" error
- Check `NEXT_PUBLIC_GOOGLE_CLIENT_ID` is set correctly
- Verify redirect URI is added in Google Console
- Try incognito mode (clear cookies)

**Problem**: "Invalid Client ID" error
- Check you copied the correct Client ID
- Make sure it ends with `.apps.googleusercontent.com`

**Problem**: "Redirect URI mismatch"
- Add the exact redirect URI to Google Console
- Include `http://localhost:3000` for local development

### Facebook Login Not Working

**Problem**: "Could not load Facebook login" error
- Check `NEXT_PUBLIC_FACEBOOK_APP_ID` is set
- Check app is not in Development mode when testing

**Problem**: "Invalid app ID" error
- Verify you copied the correct App ID
- Make sure app is created correctly

**Problem**: "Redirect URI not whitelisted"
- Go to Facebook Login → Settings
- Add redirect URI: `http://localhost:3000`
- Click Save

### Apple Login Not Working

**Problem**: "Apple login failed or was cancelled"
- Apple only works on **HTTPS** (not localhost)
- Wait 15 minutes after updating configuration
- Try on production domain

**Problem**: "Invalid certificate"
- Verify .p8 private key is correct
- Check Team ID matches
- Ensure Key ID is correct

---

## Testing

### Test Credentials

For **Google** and **Facebook**, use your personal accounts or create test accounts.

For **Facebook**, use test users:
```
Username: test_xxxx@facebook.com
Password: (generated by Facebook)
```

### Test Flow

1. **Add to Cart**: Add any product
2. **Login Page**: Click social login button
3. **Authorize**: Grant requested permissions
4. **Auto-Login**: Should be logged in automatically
5. **Checkout**: Should have pre-filled name/email

### What Should Happen

✅ User is created with social provider ID
✅ Name is pre-filled from provider
✅ Email is stored
✅ User is redirected to homepage
✅ Cart is preserved after login

---

## Production Deployment

### Before Going Live

1. **Google**: Switch from test to verified app
2. **Facebook**: Move app to production mode
3. **Apple**: App must be on HTTPS domain
4. Test all three providers on production
5. Verify emails are being sent for new users

### Environment

Update these for production:

```env
# Production domain
NODE_ENV=production
NEXT_PUBLIC_GOOGLE_CLIENT_ID=<production-client-id>
NEXT_PUBLIC_FACEBOOK_APP_ID=<production-app-id>
NEXT_PUBLIC_APPLE_CLIENT_ID=<production-client-id>
```

---

## Current Issue

The component shows:
```
⚠️ Social login not configured. Add OAuth credentials to .env file.
```

**Solution**: Add credentials from above sections to `.env` file.

The `.env` file has been updated with placeholders:

```env
# ============================================
# SOCIAL LOGIN - OAuth 2.0
# ============================================
# Google Login
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
NEXT_PUBLIC_GOOGLE_CLIENT_ID=

# Facebook Login
FACEBOOK_APP_ID=
FACEBOOK_APP_SECRET=
NEXT_PUBLIC_FACEBOOK_APP_ID=

# Apple Sign In
APPLE_CLIENT_ID=
APPLE_TEAM_ID=
APPLE_KEY_ID=
APPLE_PRIVATE_KEY=
NEXT_PUBLIC_APPLE_CLIENT_ID=
NEXT_PUBLIC_APPLE_REDIRECT_URI=
```

**Fill these in** with credentials from setup above.

---

## Next Steps

1. Choose at least **one provider** (Google is easiest)
2. Follow setup steps for that provider
3. Add credentials to `.env`
4. Restart dev server: `npm run dev`
5. Test on login page
6. Add other providers as needed

---

## Support

**Stuck?** Check:
- Browser console for errors (F12 → Console)
- Server logs for API errors
- Credentials are exactly copied (no extra spaces)
- Redirect URI matches exactly
- .env file is saved and server restarted

---

## Files Involved

- Frontend: `components/SocialAuthButtons.tsx`
- Backend: 
  - `app/api/auth/google/route.ts`
  - `app/api/auth/facebook/route.ts`
  - `app/api/auth/apple/route.ts`
- Auth Logic: `lib/socialAuth.ts`
- Config: `.env` file

All code is **ready**, just needs **credentials**.
