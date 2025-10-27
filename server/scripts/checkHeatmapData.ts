import dotenv from 'dotenv';
import mongoose from 'mongoose';
import ActivityHeatmap from '../models/ActivityHeatmap.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/codestreak';

async function checkHeatmapData() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Check total count
    const totalCount = await ActivityHeatmap.countDocuments();
    console.log(`\n📊 Total heatmap entries: ${totalCount}`);

    // Get sample data
    const samples = await ActivityHeatmap.find().limit(5);
    console.log('\n📝 Sample entries:');
    samples.forEach((entry) => {
      console.log(`  - ${entry.firebaseUid} | ${entry.dateKey} | Count: ${entry.count} | Sources: app=${entry.sources.app}, leetcode=${entry.sources.leetcode}, codechef=${entry.sources.codechef}`);
    });

    // Get unique users
    const uniqueUsers = await ActivityHeatmap.distinct('firebaseUid');
    console.log(`\n👥 Unique users with heatmap data: ${uniqueUsers.length}`);
    
    // Check specific user
    const testUid = 'vF6aVDdR1lh4WodVHXQXQcMLBgv2';
    const userEntries = await ActivityHeatmap.find({ firebaseUid: testUid });
    console.log(`\n🔍 Entries for user ${testUid}: ${userEntries.length}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkHeatmapData();
