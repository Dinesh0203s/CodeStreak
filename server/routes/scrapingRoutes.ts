import express, { Request, Response } from 'express';
import axios from 'axios';
import { load } from 'cheerio';

// Type definitions for scraping responses
interface LeetCodeData {
  username: string;
  solvedProblems: number;
  totalProblems: number;
  easySolved: number;
  mediumSolved: number;
  hardSolved: number;
  ranking: number;
  contestRating: number;
  profileUrl: string;
  success: boolean;
}

interface CodeChefData {
  username: string;
  problemsSolved: number;
  rating: number;
  stars: string;
  globalRank: number;
  countryRank: number;
  profileUrl: string;
  success: boolean;
}

const router = express.Router();

// Scrape LeetCode profile
router.get('/leetcode/:username', async (req: Request, res: Response) => {
  try {
    const { username } = req.params;

    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }

    const url = `https://leetcode.com/${username}/`;
    
    // Initialize variables
    let solvedProblems = 0;
    let totalProblems = 0;
    let ranking = 0;
    let contestRating = 0;
    let easySolved = 0;
    let mediumSolved = 0;
    let hardSolved = 0;

    // Method 1: Try public API endpoints first (most reliable)
    const apiEndpoints = [
      `https://leetcode-stats-api.herokuapp.com/${username}`,
      `https://leetcode-stats-api.herokuapp.com/api/${username}`,
      `https://leetcode-stats-api.herokuapp.com/api/stats/${username}`
    ];
    
    let apiResponse = null;
    let lastApiError = null;
    
    for (const endpoint of apiEndpoints) {
      try {
        apiResponse = await axios.get(endpoint, {
          timeout: 10000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'en-US,en;q=0.9',
          }
        });
        
        if (apiResponse.status === 200 && apiResponse.data && apiResponse.data.status === 'success') {
          const data = apiResponse.data;
          solvedProblems = data.totalSolved || 0;
          easySolved = data.easySolved || 0;
          mediumSolved = data.mediumSolved || 0;
          hardSolved = data.hardSolved || 0;
          ranking = data.ranking || 0;
          contestRating = data.contributionPoints || 0;
          
          // If we got data from API, try to get total problems from GraphQL
          try {
            const graphqlResponse = await axios.post('https://leetcode.com/graphql/', {
              query: `query { allQuestionsCount { difficulty count } }`,
            }, {
              headers: {
                'Content-Type': 'application/json',
                'Origin': 'https://leetcode.com',
              },
              timeout: 5000,
            });
            
            if (graphqlResponse.data?.data?.allQuestionsCount) {
              graphqlResponse.data.data.allQuestionsCount.forEach((q: any) => {
                totalProblems += q.count;
              });
            }
          } catch (e) {
            // Ignore GraphQL errors for total problems count
          }
          
          if (solvedProblems > 0) {
            return res.json({
              username,
              solvedProblems,
              totalProblems,
              easySolved,
              mediumSolved,
              hardSolved,
              ranking,
              contestRating,
              profileUrl: url,
              success: true,
            });
          }
          break; // Success but no problems solved, continue to GraphQL
        }
      } catch (error: any) {
        lastApiError = error;
        continue; // Try next endpoint
      }
    }

    // Method 2: Try GraphQL API (more detailed data)
    try {
      const graphqlResponse = await axios.post(
        'https://leetcode.com/graphql/',
        {
          query: `
            query userPublicProfile($username: String!) {
              matchedUser(username: $username) {
                username
                profile {
                  ranking
                  userAvatar
                }
                submitStatsGlobal {
                  acSubmissionNum {
                    difficulty
                    count
                  }
                }
              }
              allQuestionsCount {
                difficulty
                count
              }
            }
          `,
          variables: { username },
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Referer': `https://leetcode.com/${username}/`,
            'Origin': 'https://leetcode.com',
            'Accept': 'application/json',
            'Accept-Language': 'en-US,en;q=0.9',
          },
          timeout: 15000,
        }
      );

      const data = graphqlResponse.data?.data;
      
      if (data?.matchedUser) {
        const submitStats = data.matchedUser.submitStatsGlobal?.acSubmissionNum || [];
        
        if (submitStats.length > 0) {
          submitStats.forEach((stat: any) => {
            if (stat.difficulty === 'Easy') easySolved = stat.count;
            if (stat.difficulty === 'Medium') mediumSolved = stat.count;
            if (stat.difficulty === 'Hard') hardSolved = stat.count;
          });
          solvedProblems = easySolved + mediumSolved + hardSolved;
        }
        
        const allQuestions = data.allQuestionsCount || [];
        allQuestions.forEach((q: any) => {
          totalProblems += q.count;
        });

        ranking = data.matchedUser.profile?.ranking || 0;
        
        // If we got data from GraphQL, return immediately
        if (solvedProblems > 0 || ranking > 0) {
          return res.json({
            username,
            solvedProblems,
            totalProblems,
            easySolved,
            mediumSolved,
            hardSolved,
            ranking,
            contestRating,
            profileUrl: url,
            success: solvedProblems > 0,
          });
        }
      } else {
        // User not found or profile is private
        if (graphqlResponse.data?.errors) {
          return res.status(404).json({ 
            error: 'LeetCode profile not found',
            details: graphqlResponse.data.errors[0]?.message || 'The username may be incorrect or the profile may be private',
          });
        }
        
        return res.status(404).json({ 
          error: 'LeetCode profile not found',
          details: 'The profile may be private or the username is incorrect. Please ensure your profile is set to public.',
        });
      }
    } catch (graphqlError: any) {
      console.log('GraphQL API failed:', graphqlError.response?.status, graphqlError.response?.data?.errors?.[0]?.message || graphqlError.message);
      
      // If GraphQL fails with 404, return error
      if (graphqlError.response?.status === 404 || graphqlError.response?.data?.errors) {
        return res.status(404).json({ 
          error: 'LeetCode profile not found',
          details: 'The username may be incorrect or the profile may be private',
        });
      }
    }

    // Return results even if partial
    res.json({
      username,
      solvedProblems: solvedProblems || 0,
      totalProblems: totalProblems || 0,
      easySolved: easySolved || 0,
      mediumSolved: mediumSolved || 0,
      hardSolved: hardSolved || 0,
      ranking: ranking || 0,
      contestRating: contestRating || 0,
      profileUrl: url,
      success: solvedProblems > 0 || totalProblems > 0,
    });
  } catch (error: any) {
    console.error('Error scraping LeetCode:', error);
    
    if (error.response?.status === 404) {
      return res.status(404).json({ error: 'LeetCode profile not found' });
    }
    
    res.status(500).json({ 
      error: error.message || 'Failed to fetch LeetCode profile',
      details: 'The profile might be private or the username is incorrect. Make sure your LeetCode profile is set to public.',
    });
  }
});

// Scrape CodeChef profile
router.get('/codechef/:username', async (req: Request, res: Response) => {
  try {
    const { username } = req.params;

    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }

    const url = `https://www.codechef.com/users/${username}`;
    
    // Initialize variables
    let problemsSolved = 0;
    let fullySolvedCount = 0;
    let partiallySolvedCount = 0;
    let rating = 0;
    let stars = '';
    let globalRank = 0;
    let countryRank = 0;
    
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        },
        timeout: 10000,
      });

      const $ = load(response.data);

      // Extract rating
      const ratingText = $('.rating-number').text().trim();
      const ratingMatch = ratingText.match(/(\d+)/);
      if (ratingMatch) {
        rating = parseInt(ratingMatch[1]);
      }

      // Extract rank
      const rankText = $('.rating-ranks strong').first().text().trim();
      const rankMatch = rankText.match(/(\d+)/);
      if (rankMatch) {
        globalRank = parseInt(rankMatch[1]);
      }

      // Robust scraping for solved problems count
      const problemsSection = $('.problems-solved');
      if (problemsSection.length > 0) {
        // Fully solved count
        const fullySolvedHeader = problemsSection.find('.content h5:contains("Fully Solved")');
        if (fullySolvedHeader.length > 0) {
          fullySolvedCount = fullySolvedHeader.next().find('a').length || 0;
        } else {
          // Alternative selector
          fullySolvedCount = problemsSection.find('h5:contains("Fully Solved")').next().find('a').length || 0;
        }
        
        // Partially solved count
        const partiallySolvedHeader = problemsSection.find('.content h5:contains("Partially Solved")');
        if (partiallySolvedHeader.length > 0) {
          partiallySolvedCount = partiallySolvedHeader.next().find('a').length || 0;
        } else {
          // Alternative selector
          partiallySolvedCount = problemsSection.find('h5:contains("Partially Solved")').next().find('a').length || 0;
        }
      }

      // Fallback methods if above didn't work
      if (fullySolvedCount === 0) {
        $('.rating-data-section').each((_, elem) => {
          const sectionText = $(elem).text().trim();
          if (sectionText.includes('Problems Solved')) {
            const solvedMatch = sectionText.match(/Problems Solved\s*\((\d+)\)/i);
            if (solvedMatch) {
              fullySolvedCount = parseInt(solvedMatch[1]);
            }
          }
        });
      }

      // Final fallback: search entire page text
      if (fullySolvedCount === 0) {
        const allText = $.text();
        const anySolvedMatch = allText.match(/Problems Solved\s*\(?\s*(\d+)\s*\)?/i);
        if (anySolvedMatch) {
          fullySolvedCount = parseInt(anySolvedMatch[1]);
        }
      }

      // Get total problems solved
      const totalSolvedText = $('h3').filter((_, el) => $(el).text().includes('Total Problems Solved')).text();
      const totalSolvedMatch = totalSolvedText.match(/Total Problems Solved:\s*(\d+)/i);
      if (totalSolvedMatch) {
        problemsSolved = parseInt(totalSolvedMatch[1]);
      } else {
        problemsSolved = fullySolvedCount + partiallySolvedCount;
      }

      // Extract stars/badges
      stars = $('.rating-star').text().trim() || 'Unrated';

      // Get country rank
      const countryRankText = $('.rating-ranks strong').last().text().trim();
      const countryRankMatch = countryRankText.match(/(\d+)/);
      if (countryRankMatch) {
        countryRank = parseInt(countryRankMatch[1]);
      }

      // Try alternative API
      try {
        const apiUrl = `https://codechef-api.vercel.app/handle/${username}`;
        const apiResponse = await axios.get(apiUrl, { timeout: 5000 });
        if (apiResponse.data && apiResponse.data.success) {
          if (apiResponse.data.globalRank && !globalRank) {
            globalRank = apiResponse.data.globalRank;
          }
          if (apiResponse.data.countryRank && !countryRank) {
            countryRank = apiResponse.data.countryRank;
          }
          if (apiResponse.data.rating && !rating) {
            rating = apiResponse.data.rating;
          }
          if (apiResponse.data.stars && !stars) {
            stars = apiResponse.data.stars;
          }
        }
      } catch (apiError) {
        // Ignore API errors, use scraped data
      }

      res.json({
        username,
        problemsSolved: problemsSolved || fullySolvedCount || 0,
        fullySolved: fullySolvedCount || 0,
        partiallySolved: partiallySolvedCount || 0,
        rating: rating || 0,
        stars: stars || 'Unrated',
        globalRank: globalRank || 0,
        countryRank: countryRank || 0,
        profileUrl: url,
        success: (problemsSolved > 0 || fullySolvedCount > 0) || rating > 0,
      });
    } catch (error: any) {
      if (error.response?.status === 404) {
        return res.status(404).json({ error: 'CodeChef profile not found' });
      }
      throw error;
    }
  } catch (error: any) {
    console.error('Error scraping CodeChef:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to fetch CodeChef profile',
      details: 'The profile might be private or the username is incorrect',
    });
  }
});

// Scrape LeetCode submission history (dates when problems were solved)
router.get('/leetcode/:username/submissions', async (req: Request, res: Response) => {
  try {
    const { username } = req.params;
    // Fetch maximum submissions (LeetCode allows up to 20000 in recent submissions)
    const limit = parseInt(req.query.limit as string) || 20000;

    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }

    try {
      // Use GraphQL to get ALL recent submissions (up to 1000)
      const graphqlResponse = await axios.post(
        'https://leetcode.com/graphql/',
        {
          query: `
            query recentAcSubmissions($username: String!, $limit: Int!) {
              recentAcSubmissionList(username: $username, limit: $limit) {
                id
                title
                titleSlug
                timestamp
                statusDisplay
                lang
              }
            }
          `,
          variables: { username, limit },
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Referer': `https://leetcode.com/${username}/`,
            'Origin': 'https://leetcode.com',
            'Accept': 'application/json',
          },
          timeout: 15000,
        }
      );

      const data = graphqlResponse.data?.data;
      
      if (data?.recentAcSubmissionList) {
        // Group ALL submissions by date (no date filtering)
        const dateMap: { [key: string]: number } = {};
        
        // Get unique problem slugs to fetch difficulties in batch
        const uniqueSlugs = [...new Set(data.recentAcSubmissionList.map((s: any) => s.titleSlug).filter(Boolean))];
        const difficultyMap: { [slug: string]: 'Easy' | 'Medium' | 'Hard' } = {};
        
        // Fetch difficulties for all problems in batches
        const batchSize = 50;
        for (let i = 0; i < uniqueSlugs.length; i += batchSize) {
          const batch = uniqueSlugs.slice(i, i + batchSize);
          try {
            const difficultyQuery = batch.map((slug: string, idx: number) => 
              `p${idx}: question(titleSlug: "${slug}") { difficulty }`
            ).join('\n');
            
            const difficultyResponse = await axios.post(
              'https://leetcode.com/graphql/',
              {
                query: `query { ${difficultyQuery} }`,
              },
              {
                headers: {
                  'Content-Type': 'application/json',
                  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                },
                timeout: 10000,
              }
            );
            
            if (difficultyResponse.data?.data) {
              batch.forEach((slug: string, idx: number) => {
                const difficulty = difficultyResponse.data.data[`p${idx}`]?.difficulty;
                if (difficulty) {
                  difficultyMap[slug] = difficulty;
                }
              });
            }
          } catch (err) {
            // Continue even if difficulty fetch fails
            console.log(`Failed to fetch difficulties for batch ${i}-${i + batchSize}`);
          }
        }
        
        // Store detailed submission data with difficulty
        const detailedSubmissions = data.recentAcSubmissionList.map((submission: any) => {
          if (submission.timestamp) {
            const date = new Date(parseInt(submission.timestamp) * 1000);
            date.setHours(0, 0, 0, 0);
            const dateKey = date.toISOString().split('T')[0];
            dateMap[dateKey] = (dateMap[dateKey] || 0) + 1;
          }
          
          return {
            submissionId: submission.id,
            problemTitle: submission.title,
            problemSlug: submission.titleSlug,
            problemUrl: `https://leetcode.com/problems/${submission.titleSlug}/`,
            timestamp: submission.timestamp ? new Date(parseInt(submission.timestamp) * 1000) : null,
            language: submission.lang,
            status: submission.statusDisplay,
            difficulty: submission.titleSlug ? difficultyMap[submission.titleSlug] : undefined,
          };
        }).filter((s: any) => s.timestamp !== null);

        // Convert to array format and sort by date
        const submissionDates = Object.entries(dateMap)
          .map(([date, count]) => ({
            date,
            count,
          }))
          .sort((a, b) => a.date.localeCompare(b.date));

        return res.json({
          success: true,
          username,
          submissionDates,
          detailedSubmissions, // Include detailed submission data
          totalSubmissions: data.recentAcSubmissionList.length,
          uniqueDates: submissionDates.length,
        });
      }

      return res.status(404).json({ 
        error: 'No submission data found',
        details: 'The profile may be private or the username is incorrect',
      });
    } catch (graphqlError: any) {
      console.error('Error fetching LeetCode submissions:', graphqlError.message);
      
      if (graphqlError.response?.status === 404 || graphqlError.response?.data?.errors) {
        return res.status(404).json({ 
          error: 'LeetCode profile not found',
          details: 'The username may be incorrect or the profile may be private',
        });
      }
      
      throw graphqlError;
    }
  } catch (error: any) {
    console.error('Error scraping LeetCode submissions:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to fetch LeetCode submission history',
      details: 'Unable to fetch submission dates. The profile might be private.',
    });
  }
});

// Scrape CodeChef submission history (dates when problems were solved)
router.get('/codechef/:username/submissions', async (req: Request, res: Response) => {
  try {
    const { username } = req.params;

    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }

    const url = `https://www.codechef.com/users/${username}`;
    
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        },
        timeout: 15000,
      });

      const $ = load(response.data);
      const dateMap: { [key: string]: number } = {};

      // Try to find ALL submission dates from activity or calendar (no date filtering)
      // CodeChef doesn't have a public API for submission dates, so we'll try to scrape from activity calendar
      const activityCalendar = $('.calendar-container, .rating-calendar, .activity-calendar');
      
      if (activityCalendar.length > 0) {
        // Find ALL activity dates in the calendar
        activityCalendar.find('[data-date], .activity-date, .calendar-day').each((_, elem) => {
          const dateAttr = $(elem).attr('data-date') || $(elem).attr('title') || $(elem).text().trim();
          if (dateAttr) {
            try {
              const date = new Date(dateAttr);
              if (!isNaN(date.getTime())) {
                date.setHours(0, 0, 0, 0);
                const dateKey = date.toISOString().split('T')[0];
                // Include ALL dates (no filtering)
                dateMap[dateKey] = (dateMap[dateKey] || 0) + 1;
              }
            } catch (e) {
              // Ignore invalid dates
            }
          }
        });
      }

      // Alternative: Try to get from solved problems section with dates
      $('.problems-solved a, .content a[href*="/problems/"]').each((_, elem) => {
        const dateText = $(elem).parent().find('.date, time, .timestamp').text().trim();
        if (dateText) {
          try {
            const date = new Date(dateText);
            if (!isNaN(date.getTime())) {
              date.setHours(0, 0, 0, 0);
              const dateKey = date.toISOString().split('T')[0];
              // Include ALL dates (no filtering)
              dateMap[dateKey] = (dateMap[dateKey] || 0) + 1;
            }
          } catch (e) {
            // Ignore invalid dates
          }
        }
      });

      // Try to extract submission dates from user's submission page
      try {
        const submissionUrl = `https://www.codechef.com/users/${username}/submissions`;
        const submissionResponse = await axios.get(submissionUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          },
          timeout: 10000,
        });

        const sub$ = load(submissionResponse.data);
        
        // Find all submission rows and extract detailed submission data
        const detailedSubmissions: any[] = [];
        sub$('table.dataTable tbody tr, .submission-row, .sub-list tr').each((_, row) => {
          const rowData = sub$(row);
          const problemLink = rowData.find('a[href*="/problems/"]').first();
          const problemTitle = problemLink.text().trim();
          const problemUrl = problemLink.attr('href');
          const problemSlug = problemUrl ? problemUrl.split('/problems/')[1]?.split('/')[0] : undefined;
          const dateCell = rowData.find('td:last-child, .date-cell, .submission-time').text().trim();
          const submissionId = rowData.find('a[href*="/viewsolution/"]').attr('href')?.split('/viewsolution/')[1];
          const language = rowData.find('td').eq(3).text().trim() || rowData.find('.language').text().trim();
          const status = rowData.find('td').eq(2).text().trim() || rowData.find('.status').text().trim();
          
          if (dateCell) {
            let parsedDate: Date | null = null;
            let dateKey: string | null = null;
            
            try {
              // CodeChef dates might be in various formats
              parsedDate = new Date(dateCell);
              if (!isNaN(parsedDate.getTime())) {
                parsedDate.setHours(0, 0, 0, 0);
                dateKey = parsedDate.toISOString().split('T')[0];
                dateMap[dateKey] = (dateMap[dateKey] || 0) + 1;
              }
            } catch (e) {
              // Try alternative date parsing
              const dateMatch = dateCell.match(/(\d{4})-(\d{2})-(\d{2})/);
              if (dateMatch) {
                dateKey = `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}`;
                dateMap[dateKey] = (dateMap[dateKey] || 0) + 1;
                parsedDate = new Date(dateKey);
              }
            }
            
            // Store detailed submission if we have valid data
            if (parsedDate && problemTitle && (submissionId || problemSlug)) {
              detailedSubmissions.push({
                submissionId: submissionId || `${problemSlug}-${parsedDate.getTime()}`,
                problemTitle,
                problemSlug,
                problemUrl: problemUrl?.startsWith('http') ? problemUrl : `https://www.codechef.com${problemUrl}`,
                timestamp: parsedDate,
                language: language || undefined,
                status: status || undefined,
              });
            }
          }
        });
      } catch (subError) {
        console.log('Could not fetch submission page:', subError.message);
        // Continue without submission page data
      }

      // Convert to array format and sort by date
      const submissionDates = Object.entries(dateMap)
        .map(([date, count]) => ({
          date,
          count,
        }))
        .sort((a, b) => a.date.localeCompare(b.date));

      // If no dates found, return empty array (CodeChef doesn't provide easy access to submission dates)
      return res.json({
        success: submissionDates.length > 0,
        username,
        submissionDates,
        detailedSubmissions: detailedSubmissions.length > 0 ? detailedSubmissions : undefined,
        totalSubmissions: detailedSubmissions.length,
        totalDates: submissionDates.length,
        note: submissionDates.length === 0 ? 'CodeChef does not provide public submission dates. Only activity calendar data is available.' : undefined,
      });
    } catch (error: any) {
      if (error.response?.status === 404) {
        return res.status(404).json({ error: 'CodeChef profile not found' });
      }
      throw error;
    }
  } catch (error: any) {
    console.error('Error scraping CodeChef submissions:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to fetch CodeChef submission history',
      details: 'CodeChef does not provide public submission dates. Activity calendar data may not be available.',
    });
  }
});

export default router;

