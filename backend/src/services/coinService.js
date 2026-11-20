const { query, transaction } = require('../config/db');
const notificationService = require('./notificationService');

class CoinService {
  /**
   * Determine coins earned for a given category and quantity using active reward rules
   */
  async calculateCoinsForDonation(category, quantity, itemName = '') {
    const rules = await query('SELECT * FROM reward_rules WHERE is_active = 1');

    // 1. Try matching specific item name pattern if provided (e.g. 'Jackets', 'Notebooks')
    let matchedRule = null;
    if (itemName) {
      matchedRule = rules.find(r =>
        r.item_name_pattern &&
        itemName.toLowerCase().includes(r.item_name_pattern.toLowerCase())
      );
    }

    // 2. Try matching exact category
    if (!matchedRule) {
      matchedRule = rules.find(r => r.category.toLowerCase() === category.toLowerCase());
    }

    // 3. Fallback to 'Default' rule
    if (!matchedRule) {
      matchedRule = rules.find(r => r.category.toLowerCase() === 'default') || {
        coins_per_unit: 5,
        description: '5 Coins per unit'
      };
    }

    const rate = parseFloat(matchedRule.coins_per_unit);
    const qty = Math.max(1, parseInt(quantity, 10) || 1);
    const coins = Math.round(rate * qty);

    return {
      coins,
      ratePerUnit: rate,
      ruleCategory: matchedRule.category,
      ruleDescription: matchedRule.description
    };
  }

  /**
   * Award reward coins to the donor ONLY upon verified receipt by NGO
   * Guaranteed idempotent (never awards twice for the same donation)
   */
  async awardDonationCoins(donationId, externalConn = null) {
    const executeLogic = async (conn) => {
      // 1. Fetch donation record
      const [donations] = await conn.execute(
        'SELECT * FROM donations WHERE id = ? FOR UPDATE',
        [donationId]
      );
      if (donations.length === 0) {
        throw new Error(`Donation #${donationId} not found.`);
      }

      const don = donations[0];

      // Verification Guard: Never award if coins were already credited
      if (don.coins_awarded && don.coins_awarded > 0) {
        return {
          awarded: false,
          reason: 'Coins already awarded for this donation.',
          coinsAwarded: don.coins_awarded
        };
      }

      // Verification Guard: Must be in verified state
      const verifiedStatuses = ['Received by NGO', 'Distributed', 'Distributed to beneficiaries', 'Completed'];
      if (!verifiedStatuses.includes(don.status)) {
        throw new Error(`Cannot award coins: donation status is "${don.status}". Must be verified by NGO first.`);
      }

      // Resolve donor user ID
      let donorUserId = don.donor_id;
      if (!donorUserId && don.donor_email) {
        const [users] = await conn.execute(
          'SELECT id FROM users WHERE email = ?',
          [don.donor_email]
        );
        if (users.length > 0) donorUserId = users[0].id;
      }

      if (!donorUserId) {
        return {
          awarded: false,
          reason: 'Donation has no associated registered user account.',
          coinsAwarded: 0
        };
      }

      // 2. Calculate coins earned
      const { coins, ratePerUnit, ruleCategory } = await this.calculateCoinsForDonation(
        don.category,
        don.quantity,
        don.item_name
      );

      if (coins <= 0) {
        return { awarded: false, coinsAwarded: 0 };
      }

      // 3. Fetch user coin state
      const [userRows] = await conn.execute(
        'SELECT id, name, reward_coins, total_coins_earned FROM users WHERE id = ? FOR UPDATE',
        [donorUserId]
      );
      const user = userRows[0];
      const newBalance = (user.reward_coins || 0) + coins;
      const newTotalEarned = (user.total_coins_earned || 0) + coins;

      // 4. Update user balance
      await conn.execute(
        `UPDATE users
         SET reward_coins = ?, total_coins_earned = ?
         WHERE id = ?`,
        [newBalance, newTotalEarned, donorUserId]
      );

      // 5. Update donation with awarded count
      await conn.execute(
        'UPDATE donations SET coins_awarded = ? WHERE id = ?',
        [coins, donationId]
      );

      // 6. Record in coin_transactions ledger
      const randStr = Math.floor(1000 + Math.random() * 9000);
      const txnCode = `TXN-COIN-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${randStr}`;

      const description = `Earned ${coins} Shahyog Coins for verified donation: ${don.quantity}x ${don.item_name} (${ruleCategory}).`;

      await conn.execute(
        `INSERT INTO coin_transactions (
          transaction_code, user_id, type, coins, balance_after, reference_id, reference_type, description
        ) VALUES (?, ?, 'earned', ?, ?, ?, 'donation', ?)`,
        [txnCode, donorUserId, coins, newBalance, donationId, description]
      );

      // Notify donor of reward coins credit
      notificationService.notify(
        donorUserId,
        'Reward Coins Credited! 🎉',
        `You earned +${coins} Shahyog Coins (Worth ₹${coins}) for your verified donation! Redeemable during shopping checkout.`,
        'reward',
        donationId,
        'donation'
      );

      return {
        awarded: true,
        coinsAwarded: coins,
        newBalance,
        donorName: user.name,
        transactionCode: txnCode
      };
    };

    if (externalConn) {
      return await executeLogic(externalConn);
    } else {
      return await transaction(executeLogic);
    }
  }

  /**
   * Redeem coins during checkout with strict balance checks and atomicity
   */
  async redeemCoinsForOrder(userId, coinsToRedeem, orderId, orderTotal, conn) {
    if (!coinsToRedeem || coinsToRedeem <= 0) {
      return { redeemed: false, discountAmount: 0, coinsRedeemed: 0 };
    }

    const requestedCoins = parseInt(coinsToRedeem, 10);
    if (isNaN(requestedCoins) || requestedCoins <= 0) {
      throw new Error('Invalid coin redemption amount.');
    }

    // 1. Lock user row & verify balance
    const [userRows] = await conn.execute(
      'SELECT id, name, reward_coins, total_coins_redeemed FROM users WHERE id = ? FOR UPDATE',
      [userId]
    );

    if (userRows.length === 0) throw new Error('User not found.');
    const user = userRows[0];
    const currentCoins = user.reward_coins || 0;

    if (requestedCoins > currentCoins) {
      throw new Error(`Insufficient Shahyog Coins. You have ${currentCoins} coins, but requested to redeem ${requestedCoins}.`);
    }

    // 2. Policy: 1 Coin = ₹1. Discount cannot exceed order total.
    const maxRedeemableCoins = Math.floor(orderTotal);
    const coinsApplied = Math.min(requestedCoins, maxRedeemableCoins);
    const discountAmount = coinsApplied * 1.0; // 1 Coin = ₹1

    const newBalance = currentCoins - coinsApplied;
    const newTotalRedeemed = (user.total_coins_redeemed || 0) + coinsApplied;

    // 3. Update user coin balances
    await conn.execute(
      `UPDATE users
       SET reward_coins = ?, total_coins_redeemed = ?
       WHERE id = ?`,
      [newBalance, newTotalRedeemed, userId]
    );

    // 4. Log redemption transaction
    const randStr = Math.floor(1000 + Math.random() * 9000);
    const txnCode = `TXN-COIN-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${randStr}`;
    const description = `Redeemed ${coinsApplied} Shahyog Coins (₹${discountAmount}) on Order #${orderId}.`;

    await conn.execute(
      `INSERT INTO coin_transactions (
        transaction_code, user_id, type, coins, balance_after, reference_id, reference_type, description
      ) VALUES (?, ?, 'redeemed', ?, ?, ?, 'order', ?)`,
      [txnCode, userId, coinsApplied, newBalance, orderId, description]
    );

    return {
      redeemed: true,
      coinsRedeemed: coinsApplied,
      discountAmount,
      newBalance,
      transactionCode: txnCode
    };
  }

  /**
   * Get user coin summary: available, total earned, total redeemed, and recent transactions
   */
  async getUserCoinSummary(userId) {
    const [user] = await query(
      'SELECT id, name, email, reward_coins, total_coins_earned, total_coins_redeemed FROM users WHERE id = ?',
      [userId]
    );
    if (!user) throw new Error('User not found.');

    const transactions = await query(
      `SELECT * FROM coin_transactions
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT 50`,
      [userId]
    );

    const activeRules = await query(
      'SELECT * FROM reward_rules WHERE is_active = 1 ORDER BY coins_per_unit DESC'
    );

    return {
      availableCoins: user.reward_coins || 0,
      totalEarnedCoins: user.total_coins_earned || 0,
      totalRedeemedCoins: user.total_coins_redeemed || 0,
      rupeeValue: (user.reward_coins || 0) * 1.0, // 1 Coin = ₹1
      transactions,
      activeRules
    };
  }

  /**
   * Get all active reward rules
   */
  async getRewardRules() {
    return await query('SELECT * FROM reward_rules ORDER BY is_active DESC, coins_per_unit DESC');
  }

  /**
   * Admin can configure reward rules
   */
  async updateRewardRule(ruleId, coinsPerUnit, description = null, isActive = true) {
    await query(
      `UPDATE reward_rules
       SET coins_per_unit = ?, description = COALESCE(?, description), is_active = ?, updated_at = NOW()
       WHERE id = ?`,
      [coinsPerUnit, description, isActive ? 1 : 0, ruleId]
    );
    const [updated] = await query('SELECT * FROM reward_rules WHERE id = ?', [ruleId]);
    return updated;
  }

  /**
   * Admin can create a new reward rule
   */
  async createRewardRule(category, coinsPerUnit, description, itemNamePattern = null) {
    const res = await query(
      `INSERT INTO reward_rules (category, coins_per_unit, description, item_name_pattern, is_active)
       VALUES (?, ?, ?, ?, 1)`,
      [category, coinsPerUnit, description, itemNamePattern]
    );
    const [created] = await query('SELECT * FROM reward_rules WHERE id = ?', [res.insertId]);
    return created;
  }
}

module.exports = new CoinService();
