const Group = require('../models/Group');
const Expense = require('../models/Expense');
const Settlement = require('../models/Settlement');
const ActivityLog = require('../models/ActivityLog');
const { calculateNetBalances } = require('../utils/debtSimplifier');

// @desc    Get dashboard metrics, charts, and activity
// @route   GET /api/dashboard
// @access  Private
const getDashboardData = async (req, res, next) => {
  try {
    const userId = req.user._id.toString();

    // 1. Get user groups
    const groups = await Group.find({ members: req.user._id })
      .populate('members', 'name email avatar')
      .sort({ updatedAt: -1 });

    const groupIds = groups.map((g) => g._id);

    // 2. Calculate net balances across all groups
    let totalOwedToYou = 0;
    let totalYouOwe = 0;
    const groupBalancesSummary = [];

    for (const group of groups) {
      const expenses = await Expense.find({ group: group._id });
      const settlements = await Settlement.find({ group: group._id, status: 'completed' });
      const balances = calculateNetBalances(group.members, expenses, settlements);

      const myNet = balances[userId] || 0;
      if (myNet > 0) {
        totalOwedToYou += myNet;
      } else if (myNet < 0) {
        totalYouOwe += Math.abs(myNet);
      }

      groupBalancesSummary.push({
        groupId: group._id,
        groupName: group.name,
        groupType: group.type,
        myBalance: myNet,
        memberCount: group.members.length,
      });
    }

    // 3. Category Breakdown (for Pie Chart)
    // Find all expenses in user groups where user had a share
    const allExpenses = await Expense.find({
      group: { $in: groupIds },
      'shares.user': req.user._id,
    });

    const categoryMap = {};
    let totalUserSpending = 0;

    allExpenses.forEach((exp) => {
      const userShare = exp.shares.find(
        (s) => s.user.toString() === userId
      );
      if (userShare) {
        const cat = exp.category || 'Other';
        categoryMap[cat] = (categoryMap[cat] || 0) + userShare.amount;
        totalUserSpending += userShare.amount;
      }
    });

    const categoryData = Object.entries(categoryMap).map(([name, value]) => ({
      name,
      value: Math.round(value * 100) / 100,
    }));

    // 4. Monthly Spend Trend (Line Chart - Last 6 Months)
    const monthlyMap = {};
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();

    // Initialize last 6 months
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${monthNames[d.getMonth()]} ${d.getFullYear().toString().slice(-2)}`;
      monthlyMap[key] = 0;
    }

    allExpenses.forEach((exp) => {
      const expDate = new Date(exp.date);
      const key = `${monthNames[expDate.getMonth()]} ${expDate.getFullYear().toString().slice(-2)}`;
      if (monthlyMap[key] !== undefined) {
        const userShare = exp.shares.find(
          (s) => s.user.toString() === userId
        );
        if (userShare) {
          monthlyMap[key] += userShare.amount;
        }
      }
    });

    const monthlyTrend = Object.entries(monthlyMap).map(([month, spend]) => ({
      month,
      spend: Math.round(spend * 100) / 100,
    }));

    // 5. Recent Activity Feed
    const recentActivity = await ActivityLog.find({ group: { $in: groupIds } })
      .populate('user', 'name email avatar')
      .populate('group', 'name type')
      .sort({ timestamp: -1 })
      .limit(15);

    res.status(200).json({
      success: true,
      metrics: {
        totalOwedToYou: Math.round(totalOwedToYou * 100) / 100,
        totalYouOwe: Math.round(totalYouOwe * 100) / 100,
        netBalance: Math.round((totalOwedToYou - totalYouOwe) * 100) / 100,
        totalUserSpending: Math.round(totalUserSpending * 100) / 100,
        totalGroups: groups.length,
      },
      groupBalances: groupBalancesSummary,
      categoryData,
      monthlyTrend,
      recentActivity,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get activity logs for a group
// @route   GET /api/groups/:id/activity
// @access  Private
const getGroupActivity = async (req, res, next) => {
  try {
    const { id } = req.params;
    const group = await Group.findById(id);
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    const isMember = group.members.some(
      (m) => m.toString() === req.user._id.toString()
    );
    if (!isMember) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const activity = await ActivityLog.find({ group: id })
      .populate('user', 'name email avatar')
      .sort({ timestamp: -1 })
      .limit(50);

    res.status(200).json({
      success: true,
      count: activity.length,
      activity,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardData,
  getGroupActivity,
};