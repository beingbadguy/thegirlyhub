# Social Login - Quick Reference Card

**Print this or keep it open while setting up OAuth**

---

## Google - 10 Minutes ⚡

### Console: https://console.cloud.google.com

1. New Project → name "GirlyHub"
2. Search "Google+ API" → Enable
3. Credentials → Create OAuth 2.0 → Web App
4. Redirect URIs:
   - `http://localhost:3000/api/auth/google`
   - `http://localhost:3000`
5. Copy: **Client ID** and **Client Secret**

### Update .env:
```env
GOOGLE_CLIENT_ID=<CLIENT_ID>.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=<CLIENT_SECRET>
NEXT_PUBLIC_GOOGLE_CLIENT_ID=<CLIENT_ID>.apps.googleusercontent.com
```

### Test: http://localhost:3000/login

---

## Facebook - 15 Minutes ⚡

### Developer Console: https://developers.facebook.com/apps

1. My Apps → Create App → Consumer
2. Name: "GirlyHub"
3. Add Product → Facebook Login
4. Facebook Login → Settings
5. Valid OAuth Redirect URIs:
   - `http://localhost:3000`
6. Settings → Basic
7. Copy: **App ID** and **App Secret**

### Update .env:
```env
FACEBOOK_APP_ID=<APP_ID>
FACEBOOK_APP_SECRET=<APP_SECRET>
NEXT_PUBLIC_FACEBOOK_APP_ID=<APP_ID>
```

### Test: http://localhost:3000/login

---

## Apple - 30 Minutes + $99 ⚠️

### Developer Account: https://developer.apple.com

1. Certificates, Identifiers & Profiles
2. Identifiers → App IDs → + → Web
3. Identifier: `com.example.girlyhub`
4. Services IDs → + → `com.example.girlyhub.web`
5. Configure → Domains: `yourdomain.com`
6. Return URLs: `https://yourdomain.com/api/auth/apple/callback`
7. Keys → + → Enable "Sign in with Apple"
8. Download `.p8` file
9. Copy: **Team ID** (from Account → Membership)

### Update .env:
```env
APPLE_CLIENT_ID=com.example.girlyhub.web
APPLE_TEAM_ID=<TEAM_ID>
APPLE_KEY_ID=<KEY_ID_FROM_p8_FILE>
APPLE_PRIVATE_KEY=<CONTENT_OF_p8_FILE>
NEXT_PUBLIC_APPLE_CLIENT_ID=com.example.girlyhub.web
NEXT_PUBLIC_APPLE_REDIRECT_URI=https://yourdomain.com/api/auth/apple/callback
```

### Note: HTTPS only (production only)

---

## What to Add to .env

### Easiest (Start Here)
```env
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_secret
```

### Then Add (Optional)
```env
NEXT_PUBLIC_FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_secret
```

### Last (Most Complex)
```env
NEXT_PUBLIC_APPLE_CLIENT_ID=com.example.girlyhub.web
APPLE_TEAM_ID=your_team_id
APPLE_KEY_ID=your_key_id
APPLE_PRIVATE_KEY=your_private_key_content
```

---

## Test Credentials Location

### Google
- Console: https://console.cloud.google.com
- Project settings → Credentials
- Your Web Application client

### Facebook  
- Dashboard: https://developers.facebook.com/apps
- Your app → Settings → Basic
- App ID and App Secret at top

### Apple
- Portal: https://developer.apple.com
- Certificates → Identifiers & Profiles → Keys
- Download .p8 file
- Team ID: Account → Membership

---

## Verify Setup Works

1. **Add to .env** - One or more credentials
2. **Run**: `npm run dev`
3. **Visit**: http://localhost:3000/login
4. **Should See**: Social login buttons
5. **Click**: Try one button
6. **Verify**: Provider popup appears
7. **Success**: Can sign in and redirects home

---

## Troubleshoot

| Issue | Fix |
|-------|-----|
| Buttons don't show | Add credentials to .env, restart server |
| Wrong redirect URI | Match exactly: `http://localhost:3000/api/auth/google` |
| Invalid client ID | Check copied value has no spaces |
| Popup won't open | Check browser console (F12), restart server |
| "Unable to complete" | Check Backend logs, verify MongoDB |

---

## Fast Setup (5 min demo)

Want to test without real credentials?

Use environment-specific placeholder:
```env
# For testing (shows warning message)
# Fill these with real values later:
NEXT_PUBLIC_GOOGLE_CLIENT_ID=
NEXT_PUBLIC_FACEBOOK_APP_ID=
NEXT_PUBLIC_APPLE_CLIENT_ID=
```

Buttons won't work but you'll see the message showing what's needed.

---

## .env Template

Copy-paste and fill:

```env
# GOOGLE
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
NEXT_PUBLIC_GOOGLE_CLIENT_ID=

# FACEBOOK
FACEBOOK_APP_ID=
FACEBOOK_APP_SECRET=
NEXT_PUBLIC_FACEBOOK_APP_ID=

# APPLE
APPLE_CLIENT_ID=
APPLE_TEAM_ID=
APPLE_KEY_ID=
APPLE_PRIVATE_KEY=
NEXT_PUBLIC_APPLE_CLIENT_ID=
NEXT_PUBLIC_APPLE_REDIRECT_URI=
```

---

## File Locations

| File | Purpose |
|------|---------|
| `.env` | **Add credentials here** |
| `components/SocialAuthButtons.tsx` | Frontend component |
| `app/api/auth/google/route.ts` | Google backend handler |
| `app/api/auth/facebook/route.ts` | Facebook backend handler |
| `app/api/auth/apple/route.ts` | Apple backend handler |
| `docs/SOCIAL_LOGIN_SETUP.md` | Full setup guide |

---

**Need Help?** 
See: `docs/SOCIAL_LOGIN_SETUP.md` for complete instructions
