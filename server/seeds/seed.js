require('dotenv').config();
const mongoose = require('mongoose');
const { connectDB } = require('../config/db');
const User = require('../models/User');
const Group = require('../models/Group');
const Expense = require('../models/Expense');
const Settlement = require('../models/Settlement');
const ActivityLog = require('../models/ActivityLog');
const { validateAndComputeShares } = require('../utils/debtSimplifier');

const seedData = async (shouldExit = true) => {
  try {
    console.log('[Seed] Checking database collections...');
    await User.deleteMany({});
    await Group.deleteMany({});
    await Expense.deleteMany({});
    await Settlement.deleteMany({});
    await ActivityLog.deleteMany({});

    console.log('[Seed] Creating demo users...');
    const users = await User.create([
      {
        name: 'Alex Rivera (Demo)',
        email: 'demo@splitease.com',
        password: 'password123',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=AlexRivera',
      },
      {
        name: 'Priya Sharma',
        email: 'priya@example.com',
        password: 'password123',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=PriyaSharma',
      },
      {
        name: 'Aman Verma',
        email: 'aman@example.com',
        password: 'password123',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=AmanVerma',
      },
      {
        name: 'Sarah Chen',
        email: 'sarah@example.com',
        password: 'password123',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=SarahChen',
      },
      {
        name: 'Carlos Gomez',
        email: 'carlos@example.com',
        password: 'password123',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=CarlosGomez',
      },
    ]);

    const [alex, priya, aman, sarah, carlos] = users;

    console.log('[Seed] Creating groups...');
    // Group 1: Goa Beach Trip
    const goaGroup = await Group.create({
      name: 'Goa Beach Trip 🏖️',
      type: 'Trip',
      description: 'Annual beach vacation with coastal shacks, bike rentals, and water sports!',
      members: [alex._id, priya._id, aman._id, sarah._id, carlos._id],
      createdBy: alex._id,
    });

    // Group 2: Greenwood Flat 402
    const flatGroup = await Group.create({
      name: 'Greenwood Flat 402 🏠',
      type: 'Home',
      description: 'Shared flat utilities, groceries, Wi-Fi, and maintenance expenses.',
      members: [alex._id, aman._id, carlos._id],
      createdBy: alex._id,
    });

    // Group 3: Weekend Dinner Club
    const dinnerGroup = await Group.create({
      name: 'Weekend Dinner Club 🍷',
      type: 'Other',
      description: 'Exploring new gourmet bistros, cafes, and rooftop dining spots.',
      members: [alex._id, priya._id, sarah._id],
      createdBy: priya._id,
    });

    console.log('[Seed] Adding expenses to Goa Beach Trip...');
    // 1. Villa Rental - Equal split among 5
    const exp1Shares = validateAndComputeShares(18000, 'equal', [
      { user: alex._id },
      { user: priya._id },
      { user: aman._id },
      { user: sarah._id },
      { user: carlos._id },
    ]).computedShares;

    await Expense.create({
      group: goaGroup._id,
      description: 'Private 3BHK Villa Booking in Anjuna',
      amount: 18000,
      paidBy: alex._id,
      splitType: 'equal',
      shares: exp1Shares,
      category: 'Lodging',
      date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      notes: 'Paid via credit card for 3 nights',
    });

    // 2. Beach Shack Seafood Dinner - Exact amounts
    const exp2Shares = validateAndComputeShares(6500, 'exact', [
      { user: alex._id, amount: 1500 },
      { user: priya._id, amount: 1200 },
      { user: aman._id, amount: 1800 },
      { user: sarah._id, amount: 1000 },
      { user: carlos._id, amount: 1000 },
    ]).computedShares;

    await Expense.create({
      group: goaGroup._id,
      description: 'Beach Shack Crab & Seafood Feast',
      amount: 6500,
      paidBy: priya._id,
      splitType: 'exact',
      shares: exp2Shares,
      category: 'Food',
      date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      notes: 'Aman had lobster, hence higher exact share',
    });

    // 3. Scuba Diving & Jet Skiing - Percentage split
    const exp3Shares = validateAndComputeShares(12000, 'percentage', [
      { user: alex._id, percentage: 25 },
      { user: priya._id, percentage: 25 },
      { user: aman._id, percentage: 20 },
      { user: sarah._id, percentage: 15 },
      { user: carlos._id, percentage: 15 },
    ]).computedShares;

    await Expense.create({
      group: goaGroup._id,
      description: 'Scuba Diving & Watersports Package',
      amount: 12000,
      paidBy: aman._id,
      splitType: 'percentage',
      shares: exp3Shares,
      category: 'Entertainment',
      date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      notes: 'Split by adventure level preference',
    });

    // 4. Thar Rental & Fuel - Equal split
    const exp4Shares = validateAndComputeShares(7500, 'equal', [
      { user: alex._id },
      { user: priya._id },
      { user: aman._id },
      { user: sarah._id },
      { user: carlos._id },
    ]).computedShares;

    await Expense.create({
      group: goaGroup._id,
      description: 'Self-Drive 4x4 Thar & Fuel',
      amount: 7500,
      paidBy: carlos._id,
      splitType: 'equal',
      shares: exp4Shares,
      category: 'Transport',
      date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    });

    // 5. Flea Market Groceries & Drinks - Exact split
    const exp5Shares = validateAndComputeShares(3200, 'exact', [
      { user: alex._id, amount: 800 },
      { user: priya._id, amount: 600 },
      { user: aman._id, amount: 700 },
      { user: sarah._id, amount: 600 },
      { user: carlos._id, amount: 500 },
    ]).computedShares;

    await Expense.create({
      group: goaGroup._id,
      description: 'Night Market Snacks & Refreshments',
      amount: 3200,
      paidBy: sarah._id,
      splitType: 'exact',
      shares: exp5Shares,
      category: 'Groceries',
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    });

    // 6. Sunset Boat Cruise - Equal split
    const exp6Shares = validateAndComputeShares(4800, 'equal', [
      { user: alex._id },
      { user: priya._id },
      { user: aman._id },
      { user: sarah._id },
      { user: carlos._id },
    ]).computedShares;

    await Expense.create({
      group: goaGroup._id,
      description: 'Chapora River Sunset Boat Cruise',
      amount: 4800,
      paidBy: alex._id,
      splitType: 'equal',
      shares: exp6Shares,
      category: 'Entertainment',
      date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    });

    // 7. Airport Cabs - Equal split among 4
    const exp7Shares = validateAndComputeShares(2400, 'equal', [
      { user: alex._id },
      { user: priya._id },
      { user: aman._id },
      { user: sarah._id },
    ]).computedShares;

    await Expense.create({
      group: goaGroup._id,
      description: 'Dabolim Airport Drop-off Cabs',
      amount: 2400,
      paidBy: priya._id,
      splitType: 'equal',
      shares: exp7Shares,
      category: 'Transport',
      date: new Date(),
    });

    // Seed a settlement in Goa group: Aman paid Alex 2000
    await Settlement.create({
      group: goaGroup._id,
      from: aman._id,
      to: alex._id,
      amount: 2000,
      notes: 'Initial UPI transfer for villa share',
      status: 'completed',
    });

    console.log('[Seed] Adding expenses to Greenwood Flat...');
    const flatExp1 = validateAndComputeShares(1500, 'equal', [
      { user: alex._id },
      { user: aman._id },
      { user: carlos._id },
    ]).computedShares;

    await Expense.create({
      group: flatGroup._id,
      description: 'Airtel Xstream Fiber 300Mbps Plan',
      amount: 1500,
      paidBy: alex._id,
      splitType: 'equal',
      shares: flatExp1,
      category: 'Utilities',
      date: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
    });

    const flatExp2 = validateAndComputeShares(4200, 'equal', [
      { user: alex._id },
      { user: aman._id },
      { user: carlos._id },
    ]).computedShares;

    await Expense.create({
      group: flatGroup._id,
      description: 'Monthly Kitchen Staples & Groceries',
      amount: 4200,
      paidBy: aman._id,
      splitType: 'equal',
      shares: flatExp2,
      category: 'Groceries',
      date: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
    });

    const flatExp3 = validateAndComputeShares(3600, 'exact', [
      { user: alex._id, amount: 1200 },
      { user: aman._id, amount: 1400 },
      { user: carlos._id, amount: 1000 },
    ]).computedShares;

    await Expense.create({
      group: flatGroup._id,
      description: 'Bescom Electricity & Water Bill',
      amount: 3600,
      paidBy: carlos._id,
      splitType: 'exact',
      shares: flatExp3,
      category: 'Utilities',
      date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    });

    const flatExp4 = validateAndComputeShares(3000, 'percentage', [
      { user: alex._id, percentage: 40 },
      { user: aman._id, percentage: 30 },
      { user: carlos._id, percentage: 30 },
    ]).computedShares;

    await Expense.create({
      group: flatGroup._id,
      description: 'Living Room Beanbags & Balcony Plants',
      amount: 3000,
      paidBy: alex._id,
      splitType: 'percentage',
      shares: flatExp4,
      category: 'Shopping',
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    });

    console.log('[Seed] Adding expenses to Dinner Club...');
    const dinExp1 = validateAndComputeShares(3300, 'equal', [
      { user: alex._id },
      { user: priya._id },
      { user: sarah._id },
    ]).computedShares;

    await Expense.create({
      group: dinnerGroup._id,
      description: 'Artisanal Sourdough Pizza & Wine',
      amount: 3300,
      paidBy: priya._id,
      splitType: 'equal',
      shares: dinExp1,
      category: 'Food',
      date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    });

    const dinExp2 = validateAndComputeShares(2400, 'exact', [
      { user: alex._id, amount: 900 },
      { user: priya._id, amount: 800 },
      { user: sarah._id, amount: 700 },
    ]).computedShares;

    await Expense.create({
      group: dinnerGroup._id,
      description: 'Craft Microbrewery Beer Flights',
      amount: 2400,
      paidBy: sarah._id,
      splitType: 'exact',
      shares: dinExp2,
      category: 'Entertainment',
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    });

    console.log('[Seed] Populating Activity Logs...');
    const activities = [
      {
        group: goaGroup._id,
        user: alex._id,
        action: 'GROUP_CREATED',
        description: 'Alex Rivera created "Goa Beach Trip 🏖️"',
        timestamp: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
      },
      {
        group: goaGroup._id,
        user: alex._id,
        action: 'EXPENSE_CREATED',
        description: 'Alex added "Private 3BHK Villa Booking in Anjuna" (₹18,000.00)',
        timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      },
      {
        group: goaGroup._id,
        user: priya._id,
        action: 'EXPENSE_CREATED',
        description: 'Priya added "Beach Shack Crab & Seafood Feast" (₹6,500.00)',
        timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      },
      {
        group: goaGroup._id,
        user: aman._id,
        action: 'EXPENSE_CREATED',
        description: 'Aman added "Scuba Diving & Watersports Package" (₹12,000.00)',
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      },
      {
        group: goaGroup._id,
        user: aman._id,
        action: 'SETTLEMENT_RECORDED',
        description: 'Aman Verma paid Alex Rivera ₹2,000.00',
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
      {
        group: flatGroup._id,
        user: alex._id,
        action: 'GROUP_CREATED',
        description: 'Alex Rivera created "Greenwood Flat 402 🏠"',
        timestamp: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
      },
      {
        group: flatGroup._id,
        user: aman._id,
        action: 'EXPENSE_CREATED',
        description: 'Aman added "Monthly Kitchen Staples & Groceries" (₹4,250.00)',
        timestamp: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
      },
      {
        group: dinnerGroup._id,
        user: priya._id,
        action: 'EXPENSE_CREATED',
        description: 'Priya added "Artisanal Sourdough Pizza & Wine" (₹3,300.00)',
        timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      },
    ];

    await ActivityLog.insertMany(activities);

    console.log('[Seed] Data seeded successfully.');
    if (shouldExit) {
      process.exit(0);
    }
  } catch (error) {
    console.error('Seed script error:', error);
    if (shouldExit) process.exit(1);
    throw error;
  }
};

if (require.main === module) {
  connectDB().then(() => seedData(true));
}

module.exports = { seedData };