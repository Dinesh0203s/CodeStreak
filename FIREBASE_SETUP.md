# Firebase Setup Guide for CodeStreak

## 🔥 Quick Firebase Configuration

### Step 1: Enable Authentication
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project: `pinmypic-18139`
3. Navigate to **Authentication** → **Sign-in method**
4. Enable the following providers:
   - ✅ **Email/Password** (First option)
   - ✅ **Google** (Third option)

### Step 2: Create Firestore Database
1. In Firebase Console, go to **Firestore Database**
2. Click **Create database**
3. Choose **Start in production mode** (we'll update rules later)
4. Select a location (choose closest to your region)
5. Click **Done**

### Step 3: Update Firestore Security Rules
1. In Firestore Database, go to **Rules** tab
2. Replace the default rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read and write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Allow authenticated users to read leaderboards
    match /leaderboards/{document} {
      allow read: if request.auth != null;
    }
    
    // Allow authenticated users to read challenges
    match /challenges/{document} {
      allow read: if request.auth != null;
    }
  }
}
```

3. Click **Publish**

### Step 4: Test the App
1. Go to `http://localhost:3000`
2. Try signing up with email/password
3. Try logging in with Google
4. Complete the onboarding process

## 🚨 Troubleshooting

### If you get "client is offline" error:
- Make sure Firestore Database is created
- Check that security rules are published
- Verify your internet connection

### If Google login doesn't work:
- Make sure Google provider is enabled in Authentication
- Check that your domain is authorized (localhost:3000 should work automatically)

### If you get permission errors:
- Make sure Firestore security rules are updated
- Check that the user is properly authenticated

## ✅ Success Indicators

When everything is working correctly:
- ✅ You can sign up with email/password
- ✅ You can login with Google
- ✅ Onboarding process works
- ✅ Dashboard loads with user data
- ✅ No console errors related to Firebase

## 🔧 Additional Configuration (Optional)

### Enable Firebase Analytics (Optional)
1. Go to **Analytics** in Firebase Console
2. Follow the setup wizard
3. This will help track user engagement

### Configure Firebase Storage (Optional)
1. Go to **Storage** in Firebase Console
2. Click **Get started**
3. This will be needed for profile pictures later

---

**Need help?** Check the browser console for specific error messages and refer to the Firebase documentation.

