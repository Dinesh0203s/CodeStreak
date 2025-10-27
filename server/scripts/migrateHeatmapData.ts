import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Submission from '../models/Submission.js';
import ActivityHeatmap from '../models/ActivityHeatmap.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/codestreak';

async function migrateHeatmapData() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing heatmap data (optional - remove if you want to keep existing data)
    await ActivityHeatmap.deleteMany({});
    console.log('🧹 Cleared existing heatmap data');

    // Get all users
    const users = await User.find({});
    console.log(`📊 Found ${users.length} users to process`);

    for (const user of users) {
      console.log(`\nProcessing user: ${user.email}`);
      const dateMap: { [key: string]: { app: number; leetcode: number; codechef: number } } = {};

      // 1. Get app submissions
      const submissions = await Submission.find({ userId: user._id })
        .select('solvedAt')
        .sort({ solvedAt: 1 });

      submissions.forEach((submission) => {
        const date = new Date(submission.solvedAt);
        date.setHours(0, 0, 0, 0);
        const dateKey = date.toISOString().split('T')[0];
        
        if (!dateMap[dateKey]) {
          dateMap[dateKey] = { app: 0, leetcode: 0, codechef: 0 };
        }
        dateMap[dateKey].app++;
      });

      console.log(`  - Found ${submissions.length} app submissions`);

      // 2. Add LeetCode submission dates
      if (user.leetcodeStats && user.leetcodeStats.submissionDates) {
        user.leetcodeStats.submissionDates.forEach((item) => {
          if (!dateMap[item.date]) {
            dateMap[item.date] = { app: 0, leetcode: 0, codechef: 0 };
          }
          dateMap[item.date].leetcode = item.count;
        });
        console.log(`  - Found ${user.leetcodeStats.submissionDates.length} days of LeetCode activity`);
      }

      // 3. Add CodeChef submission dates
      if (user.codechefStats && user.codechefStats.submissionDates) {
        user.codechefStats.submissionDates.forEach((item) => {
          if (!dateMap[item.date]) {
            dateMap[item.date] = { app: 0, leetcode: 0, codechef: 0 };
          }
          dateMap[item.date].codechef = item.count;
        });
        console.log(`  - Found ${user.codechefStats.submissionDates.length} days of CodeChef activity`);
      }

      // 4. Create heatmap entries
      const bulkOps = Object.entries(dateMap).map(([dateKey, sources]) => {
        const date = new Date(dateKey);
        date.setHours(0, 0, 0, 0);
        
        return {
          updateOne: {
            filter: { firebaseUid: user.firebaseUid, dateKey },
            update: {
              $set: {
                userId: user._id,
                date,
                sources: {
                  app: sources.app,
                  leetcode: sources.leetcode,
                  codechef: sources.codechef,
                },
                count: sources.app + sources.leetcode + sources.codechef,
              },
            },
            upsert: true,
          },
        };
      });

      if (bulkOps.length > 0) {
        await ActivityHeatmap.bulkWrite(bulkOps);
        console.log(`  ✅ Created ${bulkOps.length} heatmap entries`);
      }
    }

    console.log('\n🎉 Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
migrateHeatmapData();
