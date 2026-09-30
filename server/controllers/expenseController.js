const Expense = require('../models/Expense');
const Group = require('../models/Group');
const ActivityLog = require('../models/ActivityLog');
const { validateAndComputeShares } = require('../utils/debtSimplifier');

// @desc    Get all expenses for a group (with optional filters)
// @route   GET /api/groups/:id/expenses
// @access  Private
const getGroupExpenses = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { category, payer, startDate, endDate, search } = req.query;

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

    const query = { group: id };

    if (category && category !== 'All') {
      query.category = category;
    }

    if (payer && payer !== 'All') {
      query.paidBy = payer;
    }

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    if (search) {
      query.description = { $regex: search, $options: 'i' };
    }

    const expenses = await Expense.find(query)
      .populate('paidBy', 'name email avatar')
      .populate('shares.user', 'name email avatar')
      .sort({ date: -1, createdAt: -1 });

    res.status(200).json({
      success: true,
      count: expenses.length,
      expenses,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new expense
// @route   POST /api/groups/:id/expenses
// @access  Private
const createExpense = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      description,
      amount,
      paidBy,
      splitType,
      shares,
      category,
      date,
      notes,
    } = req.body;

    const group = await Group.findById(id).populate('members', 'name');
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    const isMember = group.members.some(
      (m) => m._id.toString() === req.user._id.toString()
    );
    if (!isMember) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid expense amount greater than 0',
      });
    }

    // Validate shares
    const validation = validateAndComputeShares(
      numAmount,
      splitType || 'equal',
      shares
    );
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: validation.error,
      });
    }

    const expense = await Expense.create({
      group: id,
      description: description.trim(),
      amount: numAmount,
      paidBy: paidBy || req.user._id,
      splitType: splitType || 'equal',
      shares: validation.computedShares,
      category: category || 'Other',
      date: date || Date.now(),
      notes: notes || '',
    });

    // Populate for response & log
    const populated = await Expense.findById(expense._id)
      .populate('paidBy', 'name email avatar')
      .populate('shares.user', 'name email avatar');

    await ActivityLog.create({
      group: id,
      user: req.user._id,
      action: 'EXPENSE_CREATED',
      description: `${req.user.name} added "${expense.description}" (₹${expense.amount.toFixed(2)})`,
      metadata: { expenseId: expense._id, amount: expense.amount },
    });

    res.status(201).json({
      success: true,
      expense: populated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update expense
// @route   PUT /api/expenses/:id
// @access  Private
const updateExpense = async (req, res, next) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) {
      return res.status(404).json({ success: false, message: 'Expense not found' });
    }

    const group = await Group.findById(expense.group);
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    const isMember = group.members.some(
      (m) => m.toString() === req.user._id.toString()
    );
    if (!isMember) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const {
      description,
      amount,
      paidBy,
      splitType,
      shares,
      category,
      date,
      notes,
    } = req.body;

    const newAmount = amount !== undefined ? Number(amount) : expense.amount;
    const newSplitType = splitType || expense.splitType;
    const newShares = shares || expense.shares;

    // Validate
    const validation = validateAndComputeShares(newAmount, newSplitType, newShares);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: validation.error,
      });
    }

    if (description) expense.description = description.trim();
    expense.amount = newAmount;
    if (paidBy) expense.paidBy = paidBy;
    expense.splitType = newSplitType;
    expense.shares = validation.computedShares;
    if (category) expense.category = category;
    if (date) expense.date = date;
    if (notes !== undefined) expense.notes = notes.trim();

    await expense.save();

    const populated = await Expense.findById(expense._id)
      .populate('paidBy', 'name email avatar')
      .populate('shares.user', 'name email avatar');

    await ActivityLog.create({
      group: expense.group,
      user: req.user._id,
      action: 'EXPENSE_UPDATED',
      description: `${req.user.name} updated expense "${expense.description}"`,
      metadata: { expenseId: expense._id, amount: expense.amount },
    });

    res.status(200).json({
      success: true,
      expense: populated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete expense
// @route   DELETE /api/expenses/:id
// @access  Private
const deleteExpense = async (req, res, next) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) {
      return res.status(404).json({ success: false, message: 'Expense not found' });
    }

    const group = await Group.findById(expense.group);
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    const isMember = group.members.some(
      (m) => m.toString() === req.user._id.toString()
    );
    if (!isMember) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const expenseDesc = expense.description;
    const expenseAmount = expense.amount;
    const groupId = expense.group;

    await expense.deleteOne();

    await ActivityLog.create({
      group: groupId,
      user: req.user._id,
      action: 'EXPENSE_DELETED',
      description: `${req.user.name} deleted expense "${expenseDesc}" (₹${expenseAmount.toFixed(2)})`,
      metadata: { amount: expenseAmount },
    });

    res.status(200).json({
      success: true,
      message: 'Expense removed successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getGroupExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
};