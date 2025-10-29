# MongoDB Setup Guide

## Prerequisites

1. **Install MongoDB locally**
   - Download from: https://www.mongodb.com/try/download/community
   - Or use MongoDB Atlas for cloud hosting
   - For Windows, you can also use Chocolatey: `choco install mongodb`

2. **Start MongoDB service**
   - Windows: MongoDB should start automatically as a service
   - Or run manually: `mongod --dbpath="C:\data\db"` (create the directory first)
   - Verify it's running: `mongosh` should connect to `mongodb://localhost:27017`

## Environment Setup

The `.env` file is already configured with:
```
MONGODB_URI=mongodb://localhost:27017/codestreak
PORT=3000
```

The database name is **codestreak** and will be created automatically when you first connect.

## Running the Application

1. **Start MongoDB** (if not running as a service)
   ```bash
   mongod
   ```

2. **Start the backend server** (in one terminal)
   ```bash
   npm run server
   ```
   Server will run on http://localhost:3000

3. **Start the frontend** (in another terminal)
   ```bash
   npm run dev
   ```
   Frontend will run on http://localhost:8080

## API Endpoints

- `GET /api/health` - Health check
- `POST /api/users/create-or-update` - Create or update user
- `GET /api/users/:firebaseUid` - Get user by Firebase UID
- `PUT /api/users/:firebaseUid` - Update user profile
- `GET /api/users` - Get all users (for admin)

## Database Schema

The `users` collection contains:
- `firebaseUid` (unique, indexed)
- `email`
- `displayName`
- `photoURL`
- `fullName`
- `college`
- `department`
- `passoutYear`
- `leetcodeHandle`
- `codechefHandle`
- `createdAt`
- `updatedAt`

