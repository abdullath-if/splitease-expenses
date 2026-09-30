const express = require('express');
const router = express.Router();
const {
  updateExpense,
  deleteExpense,
} = require('../controllers/expenseController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.route('/:id')
  .put(updateExpense)
  .delete(deleteExpense);

module.exports = router;