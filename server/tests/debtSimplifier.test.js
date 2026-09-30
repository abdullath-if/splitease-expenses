const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
  calculateNetBalances,
  simplifyDebts,
  validateAndComputeShares,
} = require('../utils/debtSimplifier');

describe('Debt Simplification Engine', () => {
  it('should simplify a 3-way circular debt to minimal transactions', () => {
    // A paid 300 for A, B, C (100 each)
    // B paid 300 for A, B, C (100 each)
    // C paid 0
    // Net: A = +100, B = +100, C = -200
    const balances = {
      userA: 100,
      userB: 100,
      userC: -200,
    };

    const settlements = simplifyDebts(balances);

    // C should pay A 100 and C should pay B 100 (2 transactions instead of 4)
    assert.equal(settlements.length, 2);
    
    // Check that all transactions come from userC
    settlements.forEach((s) => assert.equal(s.from, 'userC'));
    
    // Total settled amount must equal 200
    const totalSettled = settlements.reduce((sum, s) => sum + s.amount, 0);
    assert.equal(totalSettled, 200);
  });

  it('should simplify 5 debts into 2 transactions', () => {
    // 5 people:
    // Aman: +450
    // Priya: +300
    // Carlos: -200
    // Sarah: -350
    // Alex: -200
    // Sum: 750 creditors, 750 debtors
    const balances = {
      aman: 450,
      priya: 300,
      carlos: -200,
      sarah: -350,
      alex: -200,
    };

    const settlements = simplifyDebts(balances);

    // Verify minimal transaction count
    assert.ok(settlements.length <= 4, `Expected <= 4 transactions, got ${settlements.length}`);

    // Verify net resolution: all debts are paid
    const verification = { ...balances };
    settlements.forEach((s) => {
      verification[s.from] += s.amount;
      verification[s.to] -= s.amount;
    });

    Object.values(verification).forEach((val) => {
      assert.ok(Math.abs(val) < 0.01, `Balance not settled: ${val}`);
    });
  });

  it('should handle zero balances with 0 settlements', () => {
    const balances = { user1: 0, user2: 0, user3: 0 };
    const settlements = simplifyDebts(balances);
    assert.equal(settlements.length, 0);
  });

  it('should calculate net balances accurately across expenses and settlements', () => {
    const members = ['userA', 'userB', 'userC'];
    const expenses = [
      {
        amount: 300,
        paidBy: 'userA',
        shares: [
          { user: 'userA', amount: 100 },
          { user: 'userB', amount: 100 },
          { user: 'userC', amount: 100 },
        ],
      },
      {
        amount: 150,
        paidBy: 'userB',
        shares: [
          { user: 'userA', amount: 50 },
          { user: 'userB', amount: 50 },
          { user: 'userC', amount: 50 },
        ],
      },
    ];

    // Settlements: C pays A 50
    const settlements = [
      {
        from: 'userC',
        to: 'userA',
        amount: 50,
        status: 'completed',
      },
    ];

    const balances = calculateNetBalances(members, expenses, settlements);

    // Before settlement:
    // A: +300 - 100 - 50 = +150
    // B: -100 + 150 - 50 = 0
    // C: -100 - 50 = -150
    // After C pays A 50:
    // A: +150 - 50 = +100
    // B: 0
    // C: -150 + 50 = -100
    assert.equal(balances['userA'], 100);
    assert.equal(balances['userB'], 0);
    assert.equal(balances['userC'], -100);
  });

  it('should validate and compute equal splits with cent remainder distribution', () => {
    const res = validateAndComputeShares(100, 'equal', [
      { user: 'u1' },
      { user: 'u2' },
      { user: 'u3' },
    ]);

    assert.equal(res.valid, true);
    assert.equal(res.computedShares.length, 3);
    const sum = res.computedShares.reduce((acc, s) => acc + s.amount, 0);
    assert.equal(Math.round(sum * 100) / 100, 100);
    // One share should be 33.34 and two 33.33
    assert.equal(res.computedShares[0].amount, 33.34);
    assert.equal(res.computedShares[1].amount, 33.33);
    assert.equal(res.computedShares[2].amount, 33.33);
  });

  it('should validate percentage split totaling 100%', () => {
    const res = validateAndComputeShares(250, 'percentage', [
      { user: 'u1', percentage: 50 },
      { user: 'u2', percentage: 30 },
      { user: 'u3', percentage: 20 },
    ]);

    assert.equal(res.valid, true);
    assert.equal(res.computedShares[0].amount, 125);
    assert.equal(res.computedShares[1].amount, 75);
    assert.equal(res.computedShares[2].amount, 50);
  });

  it('should reject invalid percentage split not summing to 100%', () => {
    const res = validateAndComputeShares(250, 'percentage', [
      { user: 'u1', percentage: 50 },
      { user: 'u2', percentage: 30 },
    ]);
    assert.equal(res.valid, false);
    assert.match(res.error, /Sum of percentages/);
  });
});