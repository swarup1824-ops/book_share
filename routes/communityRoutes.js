// ShikshaShare Community Requirements, Partners & Drives Routes
const express = require('express');
const router = express.Router();
const db = require('../utils/database');
const { requireAuth, optionalAuth, requireRole } = require('../middleware/authMiddleware');

/**
 * GET /api/community/requirements
 * List community resource drives with optional category & status filtering
 */
router.get('/requirements', (req, res) => {
  try {
    const { category, status, urgency, organizationId } = req.query;
    let requirements = db.getCollection('communityRequirements');

    if (category && category !== 'all') {
      requirements = requirements.filter(r => r.category === category);
    }

    if (status && status !== 'all') {
      requirements = requirements.filter(r => r.status.toLowerCase() === status.toLowerCase());
    }

    if (urgency && urgency !== 'all') {
      requirements = requirements.filter(r => r.urgency.toLowerCase() === urgency.toLowerCase());
    }

    if (organizationId) {
      requirements = requirements.filter(r => r.organizationId === organizationId);
    }

    return res.json({
      success: true,
      count: requirements.length,
      requirements
    });
  } catch (err) {
    console.error('[Community Error - List Requirements]:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve community requirements.' });
  }
});

/**
 * GET /api/community/requirements/:id
 * Retrieve details for a single community requirement
 */
router.get('/requirements/:id', (req, res) => {
  const requirement = db.findById('communityRequirements', req.params.id);
  if (!requirement) {
    return res.status(404).json({ success: false, message: 'Community requirement not found.' });
  }
  return res.json({ success: true, requirement });
});

/**
 * POST /api/community/requirements
 * Publish a new grassroot community resource drive (Community Partners & Admin only)
 */
router.post('/requirements', requireAuth, requireRole('community', 'admin'), (req, res) => {
  try {
    const {
      title,
      category = 'academic_books',
      quantityNeeded = 10,
      targetBeneficiaries,
      dropLocation,
      description = '',
      urgency = 'High',
      organizationName,
      organizationType,
      contactPerson,
      contactPhone
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Requirement title is required.' });
    }
    if (!targetBeneficiaries || !targetBeneficiaries.trim()) {
      return res.status(400).json({ success: false, message: 'Target beneficiaries information is required.' });
    }
    if (!dropLocation || !dropLocation.trim()) {
      return res.status(400).json({ success: false, message: 'Drop-off / collection location is required.' });
    }

    const orgName = organizationName || req.user?.organizationName || req.user?.name || 'Community Partner Organization';
    const orgType = organizationType || req.user?.organizationType || 'NSS College Unit / Registered NGO';
    const person = contactPerson || req.user?.name || 'Drive Incharge';
    const phone = contactPhone || req.user?.mobile || '+91 98000 00000';

    const newReq = {
      id: `req-${Date.now()}`,
      title: title.trim(),
      organizationId: req.user?.id || 'org-partner',
      organizationName: orgName,
      organizationType: orgType,
      category,
      quantityNeeded: Math.max(1, Number(quantityNeeded) || 10),
      quantityReceived: 0,
      status: 'Open',
      urgency,
      targetBeneficiaries: targetBeneficiaries.trim(),
      dropLocation: dropLocation.trim(),
      contactPerson: person,
      contactPhone: phone,
      datePosted: new Date().toISOString().split('T')[0],
      description: description.trim(),
      verified: true
    };

    db.insert('communityRequirements', newReq);

    return res.status(201).json({
      success: true,
      message: 'Community requirement drive published successfully!',
      requirement: newReq
    });
  } catch (err) {
    console.error('[Community Error - Create Requirement]:', err);
    return res.status(500).json({ success: false, message: 'Failed to publish requirement.' });
  }
});

/**
 * PUT /api/community/requirements/:id
 * Update an existing requirement drive (Owner organization or Admin only)
 */
router.put('/requirements/:id', requireAuth, (req, res) => {
  const existing = db.findById('communityRequirements', req.params.id);
  if (!existing) {
    return res.status(404).json({ success: false, message: 'Community requirement not found.' });
  }

  // Enforce ownership: only organization owner or admin can update
  if (req.user.role !== 'admin' && existing.organizationId && existing.organizationId !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'Access denied: You can only edit your own organization requirements.'
    });
  }

  const updates = { ...req.body };
  delete updates.id;

  const updated = db.updateById('communityRequirements', req.params.id, updates);
  return res.json({ success: true, message: 'Requirement updated successfully.', requirement: updated });
});

/**
 * DELETE /api/community/requirements/:id
 * Remove a requirement drive (Owner organization or Admin only)
 */
router.delete('/requirements/:id', requireAuth, (req, res) => {
  const existing = db.findById('communityRequirements', req.params.id);
  if (!existing) {
    return res.status(404).json({ success: false, message: 'Community requirement not found.' });
  }

  // Enforce ownership: only organization owner or admin can delete
  if (req.user.role !== 'admin' && existing.organizationId && existing.organizationId !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'Access denied: You can only remove your own organization requirements.'
    });
  }

  db.deleteById('communityRequirements', req.params.id);
  return res.json({ success: true, message: 'Community requirement drive deleted successfully.' });
});

/**
 * POST /api/community/requirements/:id/pledge
 * Support a drive with pledged materials
 */
router.post('/requirements/:id/pledge', optionalAuth, (req, res) => {
  try {
    const { quantity = 1, donorNotes = '', donorName, contactInfo } = req.body;
    const reqId = req.params.id;

    const requirement = db.findById('communityRequirements', reqId);
    if (!requirement) {
      return res.status(404).json({ success: false, message: 'Requirement not found.' });
    }

    const qty = Math.max(1, Number(quantity) || 1);
    const newQtyReceived = (requirement.quantityReceived || 0) + qty;
    const newStatus = newQtyReceived >= requirement.quantityNeeded ? 'Fulfilled' : 'Partially Fulfilled';

    const updatedRequirement = db.updateById('communityRequirements', reqId, {
      quantityReceived: newQtyReceived,
      status: newStatus
    });

    const user = req.user;
    const donorNameStr = donorName || user?.name || 'Community Donor';
    const contactStr = contactInfo || user?.mobile || 'Provided upon coordination';

    const newRequest = {
      id: `pledge-${Date.now()}`,
      requirementId: requirement.id,
      requirementTitle: requirement.title,
      category: requirement.category,
      type: 'community_pledge',
      status: 'Pledged - Handover Scheduled',
      studentId: user?.id || 'guest-donor',
      studentName: donorNameStr,
      organizationName: requirement.organizationName,
      contactInfo: contactStr,
      location: requirement.dropLocation,
      date: new Date().toISOString().split('T')[0],
      quantityPledged: qty,
      donorName: donorNameStr,
      note: donorNotes || `Pledged ${qty} item(s) to ${requirement.organizationName}`
    };

    db.insert('requests', newRequest);

    return res.json({
      success: true,
      message: `Thank you! Pledged ${qty} item(s) to ${requirement.organizationName}.`,
      requirement: updatedRequirement,
      pledge: newRequest
    });
  } catch (err) {
    console.error('[Community Error - Pledge]:', err);
    return res.status(500).json({ success: false, message: 'Failed to record pledge.' });
  }
});

/**
 * GET /api/community/partners
 * List all verified community partners (NGOs, NSS units, Trusts)
 */
router.get('/partners', (req, res) => {
  const partners = db.getCollection('communityPartners');
  return res.json({ success: true, count: partners.length, partners });
});

/**
 * GET /api/community/distributions
 * List distribution records
 */
router.get('/distributions', (req, res) => {
  const distributions = db.getCollection('distributions');
  return res.json({ success: true, count: distributions.length, distributions });
});

/**
 * POST /api/community/distributions
 * Record distribution to student beneficiaries (Community Partners & Admin only)
 */
router.post('/distributions', requireAuth, requireRole('community', 'admin'), (req, res) => {
  try {
    const { requirementId, beneficiaries, quantity = 1, distributedBy, notes } = req.body;

    const reqItem = requirementId ? db.findById('communityRequirements', requirementId) : null;

    const newDist = {
      id: `dist-${Date.now()}`,
      requirementId: requirementId || null,
      requirementTitle: reqItem ? reqItem.title : 'Community Drive Handover',
      organizationName: reqItem ? reqItem.organizationName : (req.user?.organizationName || 'Community Partner'),
      beneficiaries: beneficiaries || 'Students in community ward',
      quantity: Math.max(1, Number(quantity) || 1),
      date: new Date().toISOString().split('T')[0],
      distributedBy: distributedBy || req.user?.name || 'Coordinator',
      notes: notes || '',
      status: 'Completed'
    };

    db.insert('distributions', newDist);

    return res.status(201).json({
      success: true,
      message: 'Distribution record logged successfully.',
      distribution: newDist
    });
  } catch (err) {
    console.error('[Community Error - Distribution]:', err);
    return res.status(500).json({ success: false, message: 'Failed to log distribution.' });
  }
});

/**
 * POST /api/community/contact
 * Send a contact / connection request to a community partner or drive
 */
router.post('/contact', optionalAuth, (req, res) => {
  try {
    const { name, email, phone, toOrganization, subject, message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Message content is required.' });
    }

    const newContactReq = {
      id: `conn-${Date.now()}`,
      fromUserId: req.user?.id || 'guest',
      fromName: name || req.user?.name || 'Community Member',
      fromEmail: email || req.user?.email || 'unspecified@shikshashare.org',
      fromPhone: phone || req.user?.mobile || '',
      toOrganization: toOrganization || 'General CEP Community Team',
      subject: subject || 'Community Inquiry',
      message: message.trim(),
      date: new Date().toISOString(),
      status: 'pending'
    };

    db.insert('contactRequests', newContactReq);

    return res.status(201).json({
      success: true,
      message: 'Your inquiry has been received. The community partner will reach out soon.',
      contactRequest: newContactReq
    });
  } catch (err) {
    console.error('[Community Error - Contact]:', err);
    return res.status(500).json({ success: false, message: 'Failed to send inquiry.' });
  }
});

/**
 * GET /api/community/contact
 * Retrieve contact requests (for partner or admin dashboard)
 */
router.get('/contact', optionalAuth, (req, res) => {
  const contacts = db.getCollection('contactRequests');
  return res.json({ success: true, count: contacts.length, contactRequests: contacts });
});

module.exports = router;
