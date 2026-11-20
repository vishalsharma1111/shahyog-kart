const { query } = require('../config/db');

// @desc Get user's saved addresses
// @route GET /api/addresses
const getAddresses = async (req, res) => {
  try {
    const addresses = await query(
      'SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC, created_at DESC',
      [req.user.id]
    );

    res.json({
      success: true,
      addresses
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Add a new address
// @route POST /api/addresses
const addAddress = async (req, res) => {
  try {
    const { full_name, phone, street, city, state, postal_code, country = 'India', is_default = false } = req.body;

    if (!full_name || !phone || !street || !city || !state || !postal_code) {
      return res.status(400).json({ success: false, message: 'All address fields are required.' });
    }

    if (is_default) {
      await query('UPDATE addresses SET is_default = 0 WHERE user_id = ?', [req.user.id]);
    }

    // Check if this is the first address, make default automatically
    const existing = await query('SELECT id FROM addresses WHERE user_id = ?', [req.user.id]);
    const makeDefault = is_default || existing.length === 0 ? 1 : 0;

    const result = await query(
      `INSERT INTO addresses (user_id, full_name, phone, street, city, state, postal_code, country, is_default)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, full_name.trim(), phone.trim(), street.trim(), city.trim(), state.trim(), postal_code.trim(), country.trim(), makeDefault]
    );

    const newAddr = await query('SELECT * FROM addresses WHERE id = ?', [result.insertId]);

    res.status(201).json({
      success: true,
      message: 'Address saved successfully!',
      address: newAddr[0]
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Delete an address
// @route DELETE /api/addresses/:id
const deleteAddress = async (req, res) => {
  try {
    const { id } = req.params;
    await query('DELETE FROM addresses WHERE id = ? AND user_id = ?', [id, req.user.id]);

    res.json({ success: true, message: 'Address removed successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Set an address as default
// @route PATCH /api/addresses/:id/default
const setDefaultAddress = async (req, res) => {
  try {
    const { id } = req.params;
    await query('UPDATE addresses SET is_default = 0 WHERE user_id = ?', [req.user.id]);
    await query('UPDATE addresses SET is_default = 1 WHERE id = ? AND user_id = ?', [id, req.user.id]);

    res.json({ success: true, message: 'Default delivery address updated.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAddresses,
  addAddress,
  deleteAddress,
  setDefaultAddress
};
