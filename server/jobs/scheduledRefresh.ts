import cron from 'node-cron';
import User from '../models/User.js';
import axios from 'axios';

// IST is UTC+5:30, so 11 PM IST = 5:30 PM UTC = 17:30 UTC
// Cron format: minute hour day month dayOfWeek
// To run at 11 PM IST (17:30 UTC), we use: '30 17 * * *'
// But to run between 11 PM to 12 AM IST, we can run every hour from 17:30 to 18:30 UTC
// Or better: run at 11:00 PM IST = 17:30 UTC, and also at 11:30 PM IST = 18:00 UTC
// Actually, let's run it once at 11:30 PM IST (18:00 UTC) to be in the middle of the hour

const PORT = process.env.PORT || 3000;
const API_BASE_URL = `http://localhost:${PORT}/api`;

/**
 * Refresh stats for a single user
 */
async function refreshUserStats(firebaseUid: string): Promise<void> {
  try {
    const response = await axios.post(`${API_BASE_URL}/users/${firebaseUid}/refresh-stats`, {}, {
      timeout: 60000, // 60 seconds timeout per user
    });
    console.log(`✅ Refreshed stats for user: ${firebaseUid}`);
    return response.data;
  } catch (error: any) {
    console.error(`❌ Failed to refresh stats for user ${firebaseUid}:`, error.message);
    throw error;
  }
}

/**
 * Refresh stats for all users (or users in a specific college)
 */
async function refreshAllUsersStats(collegeName?: string): Promise<{ success: number; failed: number; total: number }> {
  try {
    // Find all users (or users from specific college)
    const query: any = { 
      role: { $in: ['user', undefined, null] }, // Only regular users, not admins
    };
    
    if (collegeName) {
      query.college = collegeName;
    }

    const users = await User.find(query).select('firebaseUid email displayName college').limit(1000);
    
    console.log(`🔄 Starting to refresh stats for ${users.length} users${collegeName ? ` in college: ${collegeName}` : ''}...`);
    
    let successCount = 0;
    let failedCount = 0;
    
    // Process users in batches to avoid overwhelming the system
    const batchSize = 5; // Process 5 users at a time
    for (let i = 0; i < users.length; i += batchSize) {
      const batch = users.slice(i, i + batchSize);
      
      await Promise.allSettled(
        batch.map(async (user) => {
          try {
            await refreshUserStats(user.firebaseUid);
            successCount++;
          } catch (error) {
            failedCount++;
          }
        })
      );
      
      // Small delay between batches to avoid rate limiting
      if (i + batchSize < users.length) {
        await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
      }
    }
    
    console.log(`✅ Completed refreshing stats: ${successCount} succeeded, ${failedCount} failed out of ${users.length} total`);
    
    return {
      success: successCount,
      failed: failedCount,
      total: users.length,
    };
  } catch (error: any) {
    console.error('❌ Error in refreshAllUsersStats:', error.message);
    throw error;
  }
}

/**
 * Scheduled job to refresh all users daily at 11:00 PM IST
 * IST = UTC + 5:30, so 11:00 PM IST = 5:30 PM UTC = 17:30 UTC
 */
export function startScheduledRefresh(): void {
  // Run at 11:00 PM IST (17:30 UTC) every day
  // Cron: minute hour day month dayOfWeek
  // '30 17 * * *' = 17:30 UTC (11:00 PM IST) every day
  cron.schedule('30 17 * * *', async () => {
    console.log('🕐 Scheduled refresh job started at', new Date().toISOString());
    try {
      const result = await refreshAllUsersStats();
      console.log('✅ Scheduled refresh completed:', result);
    } catch (error: any) {
      console.error('❌ Scheduled refresh failed:', error.message);
    }
  }, {
    scheduled: true,
    timezone: 'Asia/Kolkata', // IST timezone
  });
  
  console.log('📅 Scheduled refresh job configured: Daily at 11:00 PM IST (17:30 UTC)');
}

/**
 * Manual refresh function (can be called from API)
 */
export async function manualRefreshAllUsers(collegeName?: string): Promise<{ success: number; failed: number; total: number }> {
  return await refreshAllUsersStats(collegeName);
}

