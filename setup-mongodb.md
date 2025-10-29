# MongoDB Setup Guide for CodeStreak

## 🗄️ Local MongoDB Setup

### **Option 1: Install MongoDB Locally**

#### **Windows:**
1. Download MongoDB Community Server from [mongodb.com](https://www.mongodb.com/try/download/community)
2. Run the installer and follow the setup wizard
3. MongoDB will be installed to `C:\Program Files\MongoDB\Server\7.0\`
4. Add MongoDB to your PATH environment variable
5. Start MongoDB service: `net start MongoDB`

#### **macOS:**
```bash
# Using Homebrew
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb/brew/mongodb-community
```

#### **Linux (Ubuntu/Debian):**
```bash
# Import MongoDB public key
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -

# Create list file
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# Install MongoDB
sudo apt-get update
sudo apt-get install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod
```

### **Option 2: Use MongoDB Atlas (Cloud)**

1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a free account
3. Create a new cluster
4. Get your connection string
5. Update `backend/.env` with your Atlas connection string

### **Option 3: Use Docker (Recommended)**

```bash
# Run MongoDB in Docker
docker run -d --name mongodb -p 27017:27017 mongo:latest

# Or use Docker Compose
docker-compose up -d
```

## 🚀 **Quick Start with Docker**

Create a `docker-compose.yml` file:

```yaml
version: '3.8'
services:
  mongodb:
    image: mongo:latest
    container_name: codestreak-mongodb
    restart: always
    ports:
      - "27017:27017"
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: password
    volumes:
      - mongodb_data:/data/db

volumes:
  mongodb_data:
```

Run: `docker-compose up -d`

## 🔧 **Backend Setup**

1. **Install backend dependencies:**
   ```bash
   cd backend
   npm install
   ```

2. **Create environment file:**
   ```bash
   # Copy the example
   cp .env.example .env
   
   # Edit .env with your MongoDB connection string
   MONGODB_URI=mongodb://localhost:27017/codestreak
   JWT_SECRET=your-super-secret-jwt-key
   PORT=5000
   ```

3. **Start the backend:**
   ```bash
   npm run dev
   ```

## ✅ **Verify Setup**

1. **Check MongoDB connection:**
   ```bash
   # Connect to MongoDB
   mongosh
   
   # Or if using Docker
   docker exec -it codestreak-mongodb mongosh
   ```

2. **Test API endpoints:**
   ```bash
   # Health check
   curl http://localhost:5000/api/health
   
   # Register user
   curl -X POST http://localhost:5000/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"password123","displayName":"Test User"}'
   ```

## 🎯 **Database Structure**

```
codestreak/
├── users/           # User profiles and authentication
├── leaderboards/    # Global, college, department rankings
├── challenges/      # Daily challenges and solutions
├── notifications/   # User notifications
└── analytics/       # Usage analytics
```

## 🔍 **MongoDB Commands**

```javascript
// Connect to database
use codestreak

// View collections
show collections

// View users
db.users.find().pretty()

// View user count
db.users.countDocuments()

// Clear all data (development only)
db.users.deleteMany({})
```

## 🚨 **Troubleshooting**

### **MongoDB not starting:**
- Check if port 27017 is available
- Check MongoDB logs
- Try restarting the service

### **Connection refused:**
- Ensure MongoDB is running
- Check firewall settings
- Verify connection string

### **Authentication failed:**
- Check username/password
- Verify database name
- Check user permissions

## 📊 **Production Considerations**

1. **Security:**
   - Use strong JWT secrets
   - Enable MongoDB authentication
   - Use environment variables
   - Set up proper firewall rules

2. **Performance:**
   - Create appropriate indexes
   - Monitor query performance
   - Use connection pooling
   - Set up monitoring

3. **Backup:**
   - Regular database backups
   - Test restore procedures
   - Monitor disk space

---

**Need help?** Check the MongoDB documentation or create an issue in the repository.

