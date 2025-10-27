import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { connectToMongoDB } from '../config/db.js';
import Challenge from '../models/Challenge.js';

dotenv.config();

const challenges = [
  {
    title: 'Two Sum',
    description: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target. You may assume that each input would have exactly one solution, and you may not use the same element twice.',
    difficulty: 'easy',
    problemUrl: 'https://leetcode.com/problems/two-sum/',
    platform: 'leetcode',
    problemId: '1',
    tags: ['Array', 'Hash Table'],
    date: new Date(),
    isActive: true,
  },
  {
    title: 'Reverse Linked List',
    description: 'Given the head of a singly linked list, reverse the list, and return the reversed list.',
    difficulty: 'easy',
    problemUrl: 'https://leetcode.com/problems/reverse-linked-list/',
    platform: 'leetcode',
    problemId: '206',
    tags: ['Linked List', 'Recursion'],
    date: new Date(),
    isActive: true,
  },
  {
    title: 'Best Time to Buy and Sell Stock',
    description: 'You are given an array prices where prices[i] is the price of a given stock on the ith day. You want to maximize your profit by choosing a single day to buy one stock and choosing a different day in the future to sell that stock.',
    difficulty: 'easy',
    problemUrl: 'https://leetcode.com/problems/best-time-to-buy-and-sell-stock/',
    platform: 'leetcode',
    problemId: '121',
    tags: ['Array', 'Dynamic Programming'],
    date: new Date(),
    isActive: true,
  },
  {
    title: 'Maximum Subarray',
    description: 'Given an integer array nums, find the contiguous subarray (containing at least one number) which has the largest sum and return its sum.',
    difficulty: 'medium',
    problemUrl: 'https://leetcode.com/problems/maximum-subarray/',
    platform: 'leetcode',
    problemId: '53',
    tags: ['Array', 'Divide and Conquer', 'Dynamic Programming'],
    date: new Date(),
    isActive: true,
  },
  {
    title: 'Longest Palindromic Substring',
    description: 'Given a string s, return the longest palindromic substring in s.',
    difficulty: 'medium',
    problemUrl: 'https://leetcode.com/problems/longest-palindromic-substring/',
    platform: 'leetcode',
    problemId: '5',
    tags: ['String', 'Dynamic Programming'],
    date: new Date(),
    isActive: true,
  },
];

async function seedChallenges() {
  try {
    await connectToMongoDB();
    console.log('🌱 Seeding challenges...');

    // Clear existing challenges for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    await Challenge.deleteMany({
      date: { $gte: today, $lt: tomorrow },
    });

    // Insert challenges
    const inserted = await Challenge.insertMany(challenges);
    console.log(`✅ Successfully seeded ${inserted.length} challenges`);

    // Set first one as today's challenge
    if (inserted.length > 0) {
      const todayChallenge = inserted[0];
      todayChallenge.date = new Date();
      todayChallenge.date.setHours(0, 0, 0, 0);
      await todayChallenge.save();
      console.log(`📅 Set "${todayChallenge.title}" as today's challenge`);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding challenges:', error);
    process.exit(1);
  }
}

seedChallenges();

