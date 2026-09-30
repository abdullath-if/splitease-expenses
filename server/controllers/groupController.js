const Group = require('../models/Group');
const Expense = require('../models/Expense');
const Settlement = require('../models/Settlement');
const ActivityLog = require('../models/ActivityLog');
const User = require('../models/User');
const { calculateNetBalances } = require('../utils/debtSimplifier');

// @desc    Get all groups for current user
// @route   GET /api/groups
// @access  Private
const getGroups = async (req, res, next) => {
  try {
    const groups = await Group.find({ members: req.user._id })
      .populate('members', 'name email avatar')
      .populate('createdBy', 'name email')
      .sort({ updatedAt: -1 });

    // Calculate user net balance for each group
    const groupsWithBalances = await Promise.all(
      groups.map(async (group) => {
        const expenses = await Expense.find({ group: group._id });
        const settlements = await Settlement.find({ group: group._id, status: 'completed' });
        
        const balances = calculateNetBalances(group.members, expenses, settlements);
        const myBalance = balances[req.user._id.toString()] || 0;
        
        const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

        return {
          ...group.toObject(),
          myBalance,
          totalExpenses,
          expenseCount: expenses.length,
        };
      })
    );

    res.status(200).json({
      success: true,
      count: groupsWithBalances.length,
      groups: groupsWithBalances,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single group details
// @route   GET /api/groups/:id
// @access  Private
const getGroupById = async (req, res, next) => {
  try {
    const group = await Group.findById(req.params.id)
      .populate('members', 'name email avatar')
      .populate('createdBy', 'name email avatar');

    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    // Check membership
    const isMember = group.members.some(
      (m) => m._id.toString() === req.user._id.toString()
    );
    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: 'You are not a member of this group',
      });
    }

    res.status(200).json({
      success: true,
      group,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new group
// @route   POST /api/groups
// @access  Private
const createGroup = async (req, res, next) => {
  try {
    const { name, type, description, memberEmails } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Group name is required' });
    }

    // Creator is always a member
    const memberIds = [req.user._id];

    // Resolve memberEmails if provided
    if (Array.isArray(memberEmails) && memberEmails.length > 0) {
      for (const email of memberEmails) {
        const cleanEmail = email.toLowerCase().trim();
        if (cleanEmail === req.user.email) continue;

        let memberUser = await User.findOne({ email: cleanEmail });
        if (!memberUser) {
          // Create auto-invited user account
          const displayName = cleanEmail.split('@')[0];
          memberUser = await User.create({
            name: displayName.charAt(0).toUpperCase() + displayName.slice(1),
            email: cleanEmail,
            password: 'password123',
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(cleanEmail)}`,
          });
        }
        if (!memberIds.some((id) => id.toString() === memberUser._id.toString())) {
          memberIds.push(memberUser._id);
        }
      }
    }

    const group = await Group.create({
      name: name.trim(),
      type: type || 'Other',
      description: description || '',
      members: memberIds,
      createdBy: req.user._id,
    });

    await ActivityLog.create({
      group: group._id,
      user: req.user._id,
      action: 'GROUP_CREATED',
      description: `${req.user.name} created the group "${group.name}"`,
    });

    const populatedGroup = await Group.findById(group._id)
      .populate('members', 'name email avatar')
      .populate('createdBy', 'name email');

    res.status(201).json({
      success: true,
      group: populatedGroup,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update group
// @route   PUT /api/groups/:id
// @access  Private
const updateGroup = async (req, res, next) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    const isMember = group.members.some(
      (m) => m.toString() === req.user._id.toString()
    );
    if (!isMember) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const { name, type, description } = req.body;
    if (name) group.name = name.trim();
    if (type) group.type = type;
    if (description !== undefined) group.description = description.trim();

    await group.save();

    await ActivityLog.create({
      group: group._id,
      user: req.user._id,
      action: 'GROUP_UPDATED',
      description: `${req.user.name} updated group details`,
    });

    const populated = await Group.findById(group._id)
      .populate('members', 'name email avatar')
      .populate('createdBy', 'name email');

    res.status(200).json({
      success: true,
      group: populated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add member to group
// @route   POST /api/groups/:id/members
// @access  Private
const addMember = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Member email is required' });
    }

    const group = await Group.findById(req.params.id);
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    const isMember = group.members.some(
      (m) => m.toString() === req.user._id.toString()
    );
    if (!isMember) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const cleanEmail = email.toLowerCase().trim();
    let userToAdd = await User.findOne({ email: cleanEmail });

    if (!userToAdd) {
      const displayName = cleanEmail.split('@')[0];
      userToAdd = await User.create({
        name: displayName.charAt(0).toUpperCase() + displayName.slice(1),
        email: cleanEmail,
        password: 'password123',
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(cleanEmail)}`,
      });
    }

    if (group.members.some((m) => m.toString() === userToAdd._id.toString())) {
      return res.status(400).json({
        success: false,
        message: 'User is already a member of this group',
      });
    }

    group.members.push(userToAdd._id);
    await group.save();

    await ActivityLog.create({
      group: group._id,
      user: req.user._id,
      action: 'MEMBER_ADDED',
      description: `${req.user.name} added ${userToAdd.name} (${userToAdd.email}) to the group`,
    });

    const updatedGroup = await Group.findById(group._id)
      .populate('members', 'name email avatar')
      .populate('createdBy', 'name email');

    res.status(200).json({
      success: true,
      group: updatedGroup,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove member from group
// @route   DELETE /api/groups/:id/members/:userId
// @access  Private
const removeMember = async (req, res, next) => {
  try {
    const { id, userId } = req.params;
    const group = await Group.findById(id);

    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    // Check balances to prevent removing a member with unsettled debt
    const expenses = await Expense.find({ group: id });
    const settlements = await Settlement.find({ group: id, status: 'completed' });
    const balances = calculateNetBalances(group.members, expenses, settlements);

    const userBalance = balances[userId] || 0;
    if (Math.abs(userBalance) > 0.05) {
      return res.status(400).json({
        success: false,
        message: `Cannot remove member with unsettled balance (${userBalance > 0 ? '+' : ''}${userBalance.toFixed(2)}). Please settle up first.`,
      });
    }

    const removedUser = await User.findById(userId);

    group.members = group.members.filter((m) => m.toString() !== userId);
    await group.save();

    await ActivityLog.create({
      group: group._id,
      user: req.user._id,
      action: 'MEMBER_REMOVED',
      description: `${req.user.name} removed ${removedUser ? removedUser.name : 'a member'} from the group`,
    });

    const updatedGroup = await Group.findById(group._id)
      .populate('members', 'name email avatar')
      .populate('createdBy', 'name email');

    res.status(200).json({
      success: true,
      group: updatedGroup,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getGroups,
  getGroupById,
  createGroup,
  updateGroup,
  addMember,
  removeMember,
};