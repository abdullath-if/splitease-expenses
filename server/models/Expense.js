const mongoose = require('mongoose');

const shareSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    percentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
  },
  { _id: false }
);

const expenseSchema = new mongoose.Schema(
  {
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group',
      required: [true, 'Group ID is required'],
      index: true,
    },
    description: {
      type: String,
      required: [true, 'Please provide an expense description'],
      trim: true,
      maxlength: [120, 'Description cannot exceed 120 characters'],
    },
    amount: {
      type: Number,
      required: [true, 'Please specify the expense amount'],
      min: [0.01, 'Amount must be at least 0.01'],
    },
    paidBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Payer is required'],
    },
    splitType: {
      type: String,
      enum: ['equal', 'exact', 'percentage'],
      default: 'equal',
    },
    shares: {
      type: [shareSchema],
      validate: {
        validator: function (v) {
          return Array.isArray(v) && v.length > 0;
        },
        message: 'Expense must have at least one participant share',
      },
    },
    category: {
      type: String,
      enum: [
        'Food',
        'Transport',
        'Lodging',
        'Entertainment',
        'Utilities',
        'Groceries',
        'Shopping',
        'Other',
      ],
      default: 'Other',
    },
    date: {
      type: Date,
      default: Date.now,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [300, 'Notes cannot exceed 300 characters'],
      default: '',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Expense', expenseSchema);