const Group = require('../models/Group');
const Expense = require('../models/Expense');
const Settlement = require('../models/Settlement');
const ActivityLog = require('../models/ActivityLog');
const User = require('../models/User');
const { calculateNetBalances, simplifyDebts } = require('../utils/debtSimplifier');

// @desc    Get balances and simplified settlements for a group
// @route   GET /api/groups/:id/balances
// @access  Private
const getGroupBalances = async (req, res, next) => {
  try {
    const { id } = req.params;

    const group = await Group.findById(id).populate('members', 'name email avatar');
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    const isMember = group.members.some(
      (m) => m._id.toString() === req.user._id.toString()
    );
    if (!isMember) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const expenses = await Expense.find({ group: id });
    const settlements = await Settlement.find({ group: id, status: 'completed' })
      .populate('from', 'name email avatar')
      .populate('to', 'name email avatar')
      .sort({ date: -1, createdAt: -1 });

    // Compute net balance per user
    const netBalancesMap = calculateNetBalances(group.members, expenses, settlements);

    // Run debt simplification algorithm
    const simplified = simplifyDebts(netBalancesMap);

    // Map user entities to simplified settlements
    const userMap = {};
    group.members.forEach((m) => {
      userMap[m._id.toString()] = {
        _id: m._id,
        name: m.name,
        email: m.email,
        avatar: m.avatar,
      };
    });

    const enrichedSettlements = simplified.map((s) => ({
      from: userMap[s.from] || { _id: s.from, name: 'Unknown User' },
      to: userMap[s.to] || { _id: s.to, name: 'Unknown User' },
      amount: s.amount,
    }));

    // Member balances list for UI display
    const memberBalances = group.members.map((m) => ({
      user: m,
      netBalance: netBalancesMap[m._id.toString()] || 0,
    }));

    const totalGroupSpent = expenses.reduce((sum, e) => sum + e.amount, 0);

    res.status(200).json({
      success: true,
      totalGroupSpent,
      memberBalances,
      simplifiedDebts: enrichedSettlements,
      settlementHistory: settlements,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Record a settlement
// @route   POST /api/groups/:id/settle
// @access  Private
const recordSettlement = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { from, to, amount, notes, date } = req.body;

    if (!from || !to || !amount) {
      return res.status(400).json({
        success: false,
        message: 'From user, to user, and settlement amount are required',
      });
    }

    if (from.toString() === to.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Payer and receiver cannot be the same user',
      });
    }

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid settlement amount',
      });
    }

    const group = await Group.findById(id).populate('members', 'name email avatar');
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    const fromUser = await User.findById(from);
    const toUser = await User.findById(to);

    if (!fromUser || !toUser) {
      return res.status(404).json({
        success: false,
        message: 'One or both settlement users were not found',
      });
    }

    const settlement = await Settlement.create({
      group: id,
      from,
      to,
      amount: Math.round(numAmount * 100) / 100,
      date: date || Date.now(),
      notes: notes || '',
      status: 'completed',
    });

    await ActivityLog.create({
      group: id,
      user: req.user._id,
      action: 'SETTLEMENT_RECORDED',
      description: `${fromUser.name} paid ${toUser.name} ₹${settlement.amount.toFixed(2)}`,
      metadata: {
        settlementId: settlement._id,
        from: fromUser._id,
        to: toUser._id,
        amount: settlement.amount,
      },
    });

    const populated = await Settlement.findById(settlement._id)
      .populate('from', 'name email avatar')
      .populate('to', 'name email avatar');

    res.status(201).json({
      success: true,
      settlement: populated,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getGroupBalances,
  recordSettlement,
};