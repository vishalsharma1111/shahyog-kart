const express = require('express');
const router = express.Router();
const { query } = require('../config/db');
const notificationService = require('../services/notificationService');

// @desc Submit public contact inquiry
// @route POST /api/contact
router.post('/', async (req, res) => {
  try {
    const { name, email, phone, subject = 'General Inquiry', message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and message are required.'
      });
    }

    const result = await query(
      `INSERT INTO contact_inquiries (name, email, phone, subject, message)
       VALUES (?, ?, ?, ?, ?)`,
      [name.trim(), email.toLowerCase().trim(), phone || null, subject.trim(), message.trim()]
    );

    // Notify admins
    notificationService.notifyAdmins(
      'New Citizen Inquiry Received 📩',
      `Message from ${name.trim()} (${email.trim()}): "${subject.trim()}".`,
      'support',
      result.insertId,
      'support'
    );

    res.status(201).json({
      success: true,
      message: 'Thank you for reaching out! Our team has received your message and will respond shortly.',
      inquiryId: result.insertId
    });
  } catch (error) {
    console.error('Contact inquiry submission error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc List inquiries (Admin only)
// @route GET /api/contact
router.get('/', async (req, res) => {
  try {
    const inquiries = await query('SELECT * FROM contact_inquiries ORDER BY created_at DESC LIMIT 50');
    res.json({ success: true, count: inquiries.length, inquiries });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
