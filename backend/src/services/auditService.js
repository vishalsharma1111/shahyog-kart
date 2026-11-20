const { query } = require('../config/db');

/**
 * Log an audit entry for sensitive operations.
 * @param {Object} entry
 * @param {number|null} entry.userId - User ID who triggered the action
 * @param {string} entry.action - E.g. 'CAMPAIGN_CREATE', 'PAYMENT_VERIFIED', 'NGO_VERIFIED'
 * @param {string} entry.entityType - E.g. 'campaign', 'payment', 'ngo', 'coin_transaction'
 * @param {number|null} entry.entityId - Primary key of related record
 * @param {Object|null} entry.previousValue - Previous state before update
 * @param {Object|null} entry.newValue - New state after update
 * @param {string|null} entry.ipAddress - IP address of client
 */
const logAudit = async ({
  userId = null,
  action,
  entityType,
  entityId = null,
  previousValue = null,
  newValue = null,
  ipAddress = null
}) => {
  try {
    await query(
      `INSERT INTO audit_logs 
        (user_id, action, entity_type, entity_id, previous_value, new_value, ip_address)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        action,
        entityType,
        entityId,
        previousValue ? JSON.stringify(previousValue) : null,
        newValue ? JSON.stringify(newValue) : null,
        ipAddress
      ]
    );
  } catch (err) {
    console.error('⚠️ Audit log write warning:', err.message);
  }
};

module.exports = { logAudit };
