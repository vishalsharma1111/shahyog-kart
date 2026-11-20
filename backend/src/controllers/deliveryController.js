const deliveryService = require('../services/deliveryService');
const { query } = require('../config/db');

// @desc Get Delivery Partner dashboard overview
// @route GET /api/delivery/overview
const getDeliveryOverview = async (req, res) => {
  try {
    const data = await deliveryService.getPartnerDashboardOverview(req.user.id);
    res.json({ success: true, ...data });
  } catch (err) {
    console.error('Error fetching delivery overview:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc Get available pickup requests for delivery partners
// @route GET /api/delivery/available-pickups
const getAvailablePickups = async (req, res) => {
  try {
    const { city } = req.query;
    const requests = await deliveryService.getAvailablePickupRequests(city);
    res.json({ success: true, count: requests.length, pickupRequests: requests });
  } catch (err) {
    console.error('Error fetching available pickups:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc Accept a pickup request
// @route POST /api/delivery/pickups/:id/accept
const acceptPickup = async (req, res) => {
  try {
    const pickupRequestId = parseInt(req.params.id, 10);
    const result = await deliveryService.acceptPickupRequest(req.user.id, pickupRequestId);
    res.json({
      success: true,
      message: 'Pickup request accepted successfully! Trip assigned to you.',
      ...result
    });
  } catch (err) {
    console.error('Error accepting pickup request:', err);
    res.status(400).json({ success: false, message: err.message });
  }
};

// @desc Get partner assigned deliveries (active or completed)
// @route GET /api/delivery/my-deliveries
const getMyDeliveries = async (req, res) => {
  try {
    const { filter = 'active' } = req.query;
    const deliveries = await deliveryService.getPartnerDeliveries(req.user.id, filter);
    res.json({ success: true, count: deliveries.length, deliveries });
  } catch (err) {
    console.error('Error fetching deliveries:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc Update delivery status progression (Out for Pickup -> Collected -> Out for Delivery -> Arrived at NGO)
// @route PATCH /api/delivery/assignments/:id/status
const updateAssignmentStatus = async (req, res) => {
  try {
    const assignmentId = parseInt(req.params.id, 10);
    const { status, latitude, longitude, location_name, remarks } = req.body;

    const result = await deliveryService.updateDeliveryStatus(
      req.user.id,
      assignmentId,
      status,
      { latitude, longitude, location_name, remarks }
    );

    res.json({
      success: true,
      message: `Delivery status updated to "${status}".`,
      ...result
    });
  } catch (err) {
    console.error('Error updating delivery status:', err);
    res.status(400).json({ success: false, message: err.message });
  }
};

// @desc Regenerate or request new OTP for delivery
// @route POST /api/delivery/assignments/:id/request-otp
const requestOtp = async (req, res) => {
  try {
    const assignmentId = parseInt(req.params.id, 10);
    const result = await deliveryService.requestDeliveryOtp(assignmentId);
    res.json({ success: true, ...result });
  } catch (err) {
    console.error('Error requesting OTP:', err);
    res.status(400).json({ success: false, message: err.message });
  }
};

// @desc Submit and verify 6-digit OTP upon arrival at NGO
// @route POST /api/delivery/assignments/:id/verify-otp
const verifyOtp = async (req, res) => {
  try {
    const assignmentId = parseInt(req.params.id, 10);
    const { otp } = req.body;

    const result = await deliveryService.verifyDeliveryOtp(req.user.id, assignmentId, otp);
    res.json(result);
  } catch (err) {
    console.error('Error verifying delivery OTP:', err);
    res.status(400).json({ success: false, message: err.message });
  }
};

// @desc Get public or donor tracking timeline
// @route GET /api/delivery/tracking/:identifier
const getTracking = async (req, res) => {
  try {
    const { identifier } = req.params;
    const data = await deliveryService.getDeliveryTrackingTimeline(identifier);
    res.json({ success: true, ...data });
  } catch (err) {
    console.error('Error fetching tracking:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getDeliveryOverview,
  getAvailablePickups,
  acceptPickup,
  getMyDeliveries,
  updateAssignmentStatus,
  requestOtp,
  verifyOtp,
  getTracking
};
