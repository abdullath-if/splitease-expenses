const express = require('express');
const router = express.Router();
const {
  getGroups,
  getGroupById,
  createGroup,
  updateGroup,
  addMember,
  removeMember,
} = require('../controllers/groupController');
const {
  getGroupExpenses,
  createExpense,
} = require('../controllers/expenseController');
const {
  getGroupBalances,
  recordSettlement,
} = require('../controllers/settlementController');
const { getGroupActivity } = require('../controllers/dashboardController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.route('/')
  .get(getGroups)
  .post(createGroup);

router.route('/:id')
  .get(getGroupById)
  .put(updateGroup);

router.post('/:id/members', addMember);
router.delete('/:id/members/:userId', removeMember);

// Nested routes for group expenses
router.route('/:id/expenses')
  .get(getGroupExpenses)
  .post(createExpense);

// Nested routes for balances & settlements
router.get('/:id/balances', getGroupBalances);
router.post('/:id/settle', recordSettlement);

// Group activity
router.get('/:id/activity', getGroupActivity);

module.exports = router;