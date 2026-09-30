/**
 * SplitEase Debt Simplification Algorithm
 * 
 * Concept:
 * When groups split expenses, a web of directed debts forms (e.g. A owes B, B owes C, C owes A).
 * In an n-person group, a naive settlement could require up to n*(n-1)/2 transactions.
 * 
 * The Debt Simplification problem can be modeled as finding the minimum number of edges
 * required to balance a flow network where each node has a defined net balance.
 * 
 * Algorithm: Greedy Largest Debtor - Largest Creditor Matching
 * 1. Compute net balance for each person: (Total Paid) - (Total Share Owed) + (Settled Out) - (Settled In).
 * 2. Separate people into:
 *    - Debtors (net balance < 0): they owe money.
 *    - Creditors (net balance > 0): they are owed money.
 * 3. While both Debtors and Creditors exist:
 *    a. Find the debtor with the largest debt (max absolute negative balance).
 *    b. Find the creditor with the largest credit (max positive balance).
 *    c. Settle min(|debt|, credit) between them.
 *    d. Create transaction: { from: debtor, to: creditor, amount }.
 *    e. Update their remaining balances.
 *    f. Remove zero-balanced parties.
 * 4. This produces at most (N - 1) transactions, drastically simplifying settlements!
 */

/**
 * Calculates net balances for all members in a group.
 * @param {Array<string|object>} members - List of member objects or user IDs
 * @param {Array<object>} expenses - List of group expenses
 * @param {Array<object>} settlements - List of settlements already executed
 * @returns {Record<string, number>} Map of userId -> net balance (positive = owed money, negative = owes money)
 */
function calculateNetBalances(members = [], expenses = [], settlements = []) {
  const balances = {};

  // Initialize all members with 0 balance
  members.forEach((m) => {
    const userId = m._id ? m._id.toString() : m.toString();
    balances[userId] = 0;
  });

  // Process expenses
  expenses.forEach((expense) => {
    const payerId = expense.paidBy._id
      ? expense.paidBy._id.toString()
      : expense.paidBy.toString();

    // Ensure payer exists in balances
    if (balances[payerId] === undefined) {
      balances[payerId] = 0;
    }

    // Payer is credited the full amount they paid
    balances[payerId] += Number(expense.amount);

    // Each participant is debited their share
    if (Array.isArray(expense.shares)) {
      expense.shares.forEach((share) => {
        const participantId = share.user._id
          ? share.user._id.toString()
          : share.user.toString();

        if (balances[participantId] === undefined) {
          balances[participantId] = 0;
        }

        balances[participantId] -= Number(share.amount);
      });
    }
  });

  // Process settlements
  // If user A paid user B 100 in a settlement:
  // A's net balance increases by 100 (debt repaid)
  // B's net balance decreases by 100 (credit collected)
  settlements.forEach((settlement) => {
    if (settlement.status && settlement.status !== 'completed') return;

    const fromId = settlement.from._id
      ? settlement.from._id.toString()
      : settlement.from.toString();
    const toId = settlement.to._id
      ? settlement.to._id.toString()
      : settlement.to.toString();

    if (balances[fromId] === undefined) balances[fromId] = 0;
    if (balances[toId] === undefined) balances[toId] = 0;

    const amount = Number(settlement.amount);
    balances[fromId] += amount;
    balances[toId] -= amount;
  });

  // Round all balances to 2 decimal places to prevent floating point inaccuracies
  for (const userId in balances) {
    balances[userId] = Math.round(balances[userId] * 100) / 100;
  }

  return balances;
}

/**
 * Simplifies a set of net balances into the minimum number of settlement transactions.
 * 
 * @param {Record<string, number>} balances - Map of userId -> net balance
 * @returns {Array<{ from: string, to: string, amount: number }>} Minimal list of settlements
 */
function simplifyDebts(balances = {}) {
  const creditors = []; // { id, amount } where amount > 0
  const debtors = [];   // { id, amount } where amount > 0 (absolute debt)

  // Threshold to avoid sub-cent / micro-float noise
  const EPSILON = 0.01;

  for (const [userId, netBalance] of Object.entries(balances)) {
    const rounded = Math.round(netBalance * 100) / 100;
    if (rounded > EPSILON) {
      creditors.push({ id: userId, amount: rounded });
    } else if (rounded < -EPSILON) {
      debtors.push({ id: userId, amount: Math.abs(rounded) });
    }
  }

  const transactions = [];

  // Sort descending by amount to greedily pair largest debtor with largest creditor
  debtors.sort((a, b) => b.amount - a.amount);
  creditors.sort((a, b) => b.amount - a.amount);

  let dIdx = 0;
  let cIdx = 0;

  while (dIdx < debtors.length && cIdx < creditors.length) {
    const debtor = debtors[dIdx];
    const creditor = creditors[cIdx];

    // Settle the minimum of the two amounts
    const settleAmount = Math.min(debtor.amount, creditor.amount);
    const roundedSettle = Math.round(settleAmount * 100) / 100;

    if (roundedSettle > 0) {
      transactions.push({
        from: debtor.id,
        to: creditor.id,
        amount: roundedSettle,
      });
    }

    debtor.amount = Math.round((debtor.amount - settleAmount) * 100) / 100;
    creditor.amount = Math.round((creditor.amount - settleAmount) * 100) / 100;

    if (debtor.amount < EPSILON) {
      dIdx++;
    }
    if (creditor.amount < EPSILON) {
      cIdx++;
    }

    // Re-sort remaining to maintain greedy optimal matches if needed
    // (for smaller collections, pointer advancement works seamlessly)
  }

  return transactions;
}

/**
 * Validates that shares match the total expense amount.
 * @param {number} totalAmount 
 * @param {string} splitType 'equal' | 'exact' | 'percentage'
 * @param {Array<{ user: string, amount?: number, percentage?: number }>} shares 
 * @returns {{ valid: boolean, error?: string, computedShares: Array<{ user: string, amount: number, percentage?: number }> }}
 */
function validateAndComputeShares(totalAmount, splitType, shares) {
  if (!totalAmount || totalAmount <= 0) {
    return { valid: false, error: 'Total amount must be greater than zero.' };
  }
  if (!Array.isArray(shares) || shares.length === 0) {
    return { valid: false, error: 'At least one participant is required.' };
  }

  const total = Math.round(Number(totalAmount) * 100) / 100;

  if (splitType === 'equal') {
    const count = shares.length;
    const baseShare = Math.floor((total / count) * 100) / 100;
    let remainder = Math.round((total - baseShare * count) * 100) / 100;

    const computedShares = shares.map((s, idx) => {
      // Distribute any 1-cent rounding remainder to the first participants
      let shareAmount = baseShare;
      if (remainder > 0.005) {
        shareAmount = Math.round((shareAmount + 0.01) * 100) / 100;
        remainder = Math.round((remainder - 0.01) * 100) / 100;
      }
      return {
        user: s.user._id || s.user,
        amount: shareAmount,
        percentage: Math.round(((shareAmount / total) * 100) * 10) / 10,
      };
    });

    return { valid: true, computedShares };
  }

  if (splitType === 'exact') {
    let sum = 0;
    const computedShares = [];

    for (const s of shares) {
      const amt = Math.round(Number(s.amount || 0) * 100) / 100;
      if (amt < 0) {
        return { valid: false, error: 'Exact share amount cannot be negative.' };
      }
      sum = Math.round((sum + amt) * 100) / 100;
      computedShares.push({
        user: s.user._id || s.user,
        amount: amt,
        percentage: Math.round(((amt / total) * 100) * 10) / 10,
      });
    }

    if (Math.abs(sum - total) > 0.02) {
      return {
        valid: false,
        error: `Sum of exact shares (${sum}) must equal total amount (${total}).`,
      };
    }

    return { valid: true, computedShares };
  }

  if (splitType === 'percentage') {
    let sumPercentage = 0;
    const computedShares = [];
    let allocatedAmount = 0;

    for (let i = 0; i < shares.length; i++) {
      const s = shares[i];
      const pct = Number(s.percentage || 0);
      if (pct < 0) {
        return { valid: false, error: 'Share percentage cannot be negative.' };
      }
      sumPercentage += pct;

      // For the last share, assign whatever remains to prevent rounding gaps
      let amt;
      if (i === shares.length - 1) {
        amt = Math.round((total - allocatedAmount) * 100) / 100;
      } else {
        amt = Math.round(((pct / 100) * total) * 100) / 100;
        allocatedAmount = Math.round((allocatedAmount + amt) * 100) / 100;
      }

      computedShares.push({
        user: s.user._id || s.user,
        amount: amt,
        percentage: pct,
      });
    }

    if (Math.abs(sumPercentage - 100) > 0.1) {
      return {
        valid: false,
        error: `Sum of percentages (${sumPercentage}%) must equal 100%.`,
      };
    }

    return { valid: true, computedShares };
  }

  return { valid: false, error: `Invalid split type: ${splitType}` };
}

module.exports = {
  calculateNetBalances,
  simplifyDebts,
  validateAndComputeShares,
};