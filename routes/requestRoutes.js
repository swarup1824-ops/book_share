// ShikshaShare Resource Requests & Claims Routes
const express = require('express');
const router = express.Router();
const db = require('../utils/database');
const { requireAuth, optionalAuth } = require('../middleware/authMiddleware');

/**
 * GET /api/requests
 * Get all requests or filter by student/provider
 */
router.get('/', optionalAuth, (req, res) => {
  try {
    const { studentId, providerId, type, status } = req.query;
    let requests = db.getCollection('requests');

    // Filter by student
    const targetStudentId = studentId || (req.user ? req.user.id : null);
    if (studentId) {
      requests = requests.filter(r => r.studentId === studentId);
    } else if (req.user && !providerId) {
      // If user is provider or student, return their relevant requests
      requests = requests.filter(r => r.studentId === req.user.id || r.providerId === req.user.id);
    }

    if (providerId) {
      requests = requests.filter(r => r.providerId === providerId);
    }

    if (type) {
      requests = requests.filter(r => r.type === type);
    }

    if (status) {
      requests = requests.filter(r => r.status === status);
    }

    return res.json({
      success: true,
      count: requests.length,
      requests
    });
  } catch (err) {
    console.error('[Requests Error - List]:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve requests.' });
  }
});

/**
 * GET /api/requests/:id
 * Retrieve details of a specific request
 */
router.get('/:id', (req, res) => {
  const request = db.findById('requests', req.params.id);
  if (!request) {
    return res.status(404).json({ success: false, message: 'Request record not found.' });
  }
  return res.json({ success: true, request });
});

/**
 * POST /api/requests
 * Submit a request to buy or claim a free resource
 */
router.post('/', optionalAuth, (req, res) => {
  try {
    const { resourceId, type, note, studentNotes, amount } = req.body;

    if (!resourceId) {
      return res.status(400).json({ success: false, message: 'resourceId is required.' });
    }

    const resource = db.findById('resources', resourceId);
    if (!resource) {
      return res.status(404).json({ success: false, message: 'Requested resource not found.' });
    }

    const isFree = resource.type === 'free';
    const requestType = type || (isFree ? 'free_claim' : 'buy_request');

    const studentName = req.user?.name || req.body.studentName || 'Student Requester';
    const studentId = req.user?.id || req.body.studentId || 'guest-student';
    const contactInfo = req.user?.mobile || req.body.contactInfo || 'Shared upon confirmation';

    const newRequest = {
      id: `req-${Date.now()}`,
      resourceId: resource.id,
      resourceTitle: resource.title,
      category: resource.category,
      type: requestType,
      status: isFree ? 'Requested - Awaiting Free Handover' : 'Offer Sent to Provider',
      studentId,
      studentName,
      providerId: resource.providerId || 'user-provider',
      contactName: resource.providerName || 'Provider',
      contactInfo: contactInfo,
      location: resource.location,
      date: new Date().toISOString().split('T')[0],
      amount: isFree ? 0 : (Number(amount) || resource.price || 0),
      note: note || studentNotes || (isFree ? 'Student submitted a 100% free claim.' : `Purchase request for ₹${resource.price}`)
    };

    db.insert('requests', newRequest);

    // Persist user-specific notification strictly for the provider who owns this listing
    if (resource.providerId) {
      const newNotification = {
        id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        userId: resource.providerId, // Notify ONLY the provider of this specific resource
        type: requestType,
        requestId: newRequest.id,
        resourceId: resource.id,
        resourceTitle: resource.title,
        requesterId: studentId,
        requesterName: studentName,
        requesterContact: contactInfo,
        price: newRequest.amount,
        timestamp: new Date().toISOString(),
        read: false,
        message: requestType === 'free_claim'
          ? `${studentName} requested to claim your free donation "${resource.title}". Contact: ${contactInfo}`
          : `${studentName} sent a purchase request for "${resource.title}" at ₹${newRequest.amount}. Contact: ${contactInfo}`
      };
      db.insert('notifications', newNotification);
    }

    return res.status(201).json({
      success: true,
      message: isFree ? 'Free resource claim submitted!' : 'Purchase request sent to provider.',
      request: newRequest
    });
  } catch (err) {
    console.error('[Requests Error - Create]:', err);
    return res.status(500).json({ success: false, message: 'Failed to submit request.' });
  }
});

/**
 * PATCH /api/requests/:id/status
 * Update status of a request (Accept, Reject, Handover Complete)
 * Allowed for the listing's provider, the requester student, or admin
 */
router.patch('/:id/status', requireAuth, (req, res) => {
  const { status, note } = req.body;
  if (!status) {
    return res.status(400).json({ success: false, message: 'New status is required.' });
  }

  const existing = db.findById('requests', req.params.id);
  if (!existing) {
    return res.status(404).json({ success: false, message: 'Request not found.' });
  }

  // Authorization check
  const isAuthorized = req.user.role === 'admin' ||
    existing.providerId === req.user.id ||
    existing.studentId === req.user.id;

  if (!isAuthorized) {
    return res.status(403).json({
      success: false,
      message: 'Access denied: You are not authorized to update this request.'
    });
  }

  const updates = { status };
  if (note) updates.note = note;

  const updatedRequest = db.updateById('requests', req.params.id, updates);

  return res.json({
    success: true,
    message: `Request status updated to '${status}'.`,
    request: updatedRequest
  });
});

module.exports = router;
