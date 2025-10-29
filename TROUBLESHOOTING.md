# CodeStreak Troubleshooting Guide

## 🚀 **Quick Fix for Login Issues**

### **Current Status:**
- ✅ **Backend**: Running on `http://localhost:5000`
- ✅ **Frontend**: Running on `http://localhost:3000`
- ✅ **Database**: Using Mock Database (no MongoDB required)
- ✅ **Authentication**: Google-only login

### **🔧 If Login Still Not Working:**

#### **Step 1: Check Backend Status**
```bash
# Test if backend is running
curl http://localhost:5000/api/health
# Should return: {"status":"OK","message":"CodeStreak API is running"}
```

#### **Step 2: Check Frontend Status**
```bash
# Open browser to:
http://localhost:3000
# Should show login page with Google button
```

#### **Step 3: Test Login Flow**
1. **Click "Continue with Google"** button
2. **Check browser console** for any errors
3. **Check network tab** for API calls
4. **Should redirect** to onboarding or dashboard

### **🐛 Common Issues & Solutions:**

#### **Issue 1: "Network Error" or "Failed to fetch"**
**Solution:**
```bash
# Restart backend
cd backend
node server.js

# In another terminal, restart frontend
npm start
```

#### **Issue 2: "CORS Error"**
**Solution:** Backend is configured for CORS, but if issues persist:
```bash
# Check if backend is running on port 5000
netstat -an | findstr :5000
```

#### **Issue 3: "Token Invalid" or Authentication Errors**
**Solution:** Clear browser storage:
```javascript
// In browser console:
localStorage.clear();
sessionStorage.clear();
// Then refresh page
```

#### **Issue 4: Frontend Compilation Errors**
**Solution:**
```bash
# Clear cache and restart
npm start
# Or if issues persist:
rm -rf node_modules package-lock.json
npm install
npm start
```

### **🔍 Debug Steps:**

#### **1. Check Backend Logs**
Look for these messages in backend terminal:
```
✅ Using Mock Database (no MongoDB required)
🚀 CodeStreak API running on port 5000
📊 Health check: http://localhost:5000/api/health
```

#### **2. Check Frontend Console**
Open browser DevTools (F12) and look for:
- **Network errors** in Console tab
- **API calls** in Network tab
- **Authentication errors** in Console tab

#### **3. Test API Directly**
```bash
# Test Google login endpoint
curl -X POST http://localhost:5000/api/auth/google \
  -H "Content-Type: application/json" \
  -d '{"email":"test@gmail.com","displayName":"Test User","googleId":"test123"}'
```

### **🎯 Expected Login Flow:**

1. **User clicks "Continue with Google"**
2. **Frontend sends request to `/api/auth/google`**
3. **Backend creates/updates user in mock database**
4. **Backend returns JWT token and user data**
5. **Frontend stores token and redirects to onboarding/dashboard**

### **📱 Test the App:**

1. **Open**: `http://localhost:3000`
2. **Click**: "Continue with Google" button
3. **Should see**: Success message and redirect
4. **If new user**: Goes to onboarding
5. **If returning user**: Goes to dashboard

### **🆘 Still Not Working?**

#### **Option 1: Use Mock Data**
The app uses mock Google login - it generates random users automatically. No real Google OAuth needed.

#### **Option 2: Check Ports**
Make sure ports 3000 and 5000 are not blocked:
```bash
# Check if ports are in use
netstat -an | findstr :3000
netstat -an | findstr :5000
```

#### **Option 3: Restart Everything**
```bash
# Kill all processes
taskkill /f /im node.exe

# Restart backend
cd backend
node server.js

# In new terminal, restart frontend
npm start
```

### **✅ Success Indicators:**

- **Backend**: Shows "CodeStreak API running on port 5000"
- **Frontend**: Shows login page with Google button
- **Login**: Clicking button creates user and redirects
- **Console**: No errors in browser DevTools

---

**Need more help?** Check the browser console for specific error messages and share them for targeted assistance.

