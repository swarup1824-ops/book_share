// ShikshaShare Resource Donation & Community Pledging Routes
const express = require('express');
const router = express.Router();
const db = require('../utils/database');
const { requireAuth, optionalAuth, requireRole } = require('../middleware/authMiddleware');
const { validateAndSavePhotos } = require('../utils/imageStorage');

/**
 * GET /api/donations
 * List all donations and community pledges
 */
router.get('/', optionalAuth, (req, res) => {
  try {
    const { donorId, type, status, requirementId } = req.query;
    let donations = db.getCollection('donations');

    if (donorId) {
      donations = donations.filter(d => d.donorId === donorId);
    } else if (req.user) {
      donations = donations.filter(d => d.donorId === req.user.id);
    }

    if (type) {
      donations = donations.filter(d => d.type === type);
    }

    if (status) {
      donations = donations.filter(d => d.status === status);
    }

    if (requirementId) {
      donations = donations.filter(d => d.requirementId === requirementId);
    }

    return res.json({
      success: true,
      count: donations.length,
      donations
    });
  } catch (err) {
    console.error('[Donations Error - List]:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve donations.' });
  }
});

/**
 * GET /api/donations/:id
 * Retrieve details for a single donation
 */
router.get('/:id', (req, res) => {
  const donation = db.findById('donations', req.params.id);
  if (!donation) {
    return res.status(404).json({ success: false, message: 'Donation record not found.' });
  }
  return res.json({ success: true, donation });
});

/**
 * POST /api/donations
 * Submit a 100% free resource donation (Donors, Students & Admin)
 */
router.post('/', optionalAuth, (req, res) => {
  try {
    const {
      title,
      category,
      educationLevel = 'college',
      condition = 'Good',
      description = '',
      quantity = 1,
      location,
      linkedNeedId,
      image,
      images
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Resource title is required.' });
    }
    if (!category || !category.trim()) {
      return res.status(400).json({ success: false, message: 'Resource category is required.' });
    }
    if (!location || !location.trim()) {
      return res.status(400).json({ success: false, message: 'Drop-off / pickup location is required.' });
    }

    // Mandatory photo validation for donations
    const photoValidation = validateAndSavePhotos(images, image);
    if (!photoValidation.valid) {
      return res.status(400).json({ success: false, message: photoValidation.error });
    }
    const savedPhotos = photoValidation.photos;

    const donorName = req.user?.name || req.body.donorName || 'Community Member';
    const donorId = req.user?.id || req.body.donorId || 'guest-donor';
    const donorRole = req.user?.roleLabel || 'Resource Provider';
    const parsedQty = Math.max(1, Number(quantity) || 1);

    let linkedReq = null;
    if (linkedNeedId) {
      linkedReq = db.findById('communityRequirements', linkedNeedId);
      if (linkedReq) {
        const newReceived = (linkedReq.quantityReceived || 0) + parsedQty;
        const newStatus = newReceived >= linkedReq.quantityNeeded ? 'Fulfilled' : 'Partially Fulfilled';
        db.updateById('communityRequirements', linkedNeedId, {
          quantityReceived: newReceived,
          status: newStatus
        });
      }
    }

    // 1. Create entry in donations collection
    const newDonation = {
      id: `don-${Date.now()}`,
      donorId,
      donorName,
      donorRole,
      title: title.trim(),
      category: category.trim(),
      educationLevel,
      quantity: parsedQty,
      condition,
      location: location.trim(),
      description: description.trim(),
      image: savedPhotos[0],
      images: savedPhotos,
      type: linkedNeedId ? 'community_pledge' : 'general_donation',
      status: linkedNeedId ? 'Pledged - Handover Scheduled' : 'Available for Free Collection',
      requirementId: linkedNeedId || null,
      organizationName: linkedReq ? linkedReq.organizationName : null,
      date: new Date().toISOString().split('T')[0]
    };
    db.insert('donations', newDonation);

    // 2. Publish resource listing as 100% Free
    const newResource = {
      id: `res-${Date.now()}`,
      title: title.trim(),
      category: category.trim(),
      educationLevel,
      condition,
      type: 'free',
      price: 0,
      originalPrice: 0,
      location: location.trim(),
      providerId: donorId,
      providerName: donorName,
      providerRole: 'Resource Provider (Free Donation)',
      description: description.trim(),
      image: savedPhotos[0],
      images: savedPhotos,
      availability: 'Available for Free Collection',
      dateAdded: new Date().toISOString().split('T')[0],
      featured: true,
      status: 'available',
      moderationStatus: 'verified'
    };
    db.insert('resources', newResource);

    // 3. If linked to community need, also record in user requests as community_pledge
    if (linkedReq) {
      const newPledgeRequest = {
        id: `pledge-${Date.now()}`,
        requirementId: linkedReq.id,
        requirementTitle: linkedReq.title,
        category: linkedReq.category,
        type: 'community_pledge',
        status: 'Pledged - Handover Scheduled',
        studentId: donorId,
        studentName: donorName,
        organizationName: linkedReq.organizationName,
        contactInfo: linkedReq.contactPhone,
        location: linkedReq.dropLocation,
        date: new Date().toISOString().split('T')[0],
        quantityPledged: parsedQty,
        note: `Pledged ${parsedQty} items: ${title.trim()}`
      };
      db.insert('requests', newPledgeRequest);
    }

    // 4. Update impact stats
    const allDb = db.readDb();
    if (allDb.impactStats) {
      allDb.impactStats.resourcesShared = (allDb.impactStats.resourcesShared || 0) + parsedQty;
      db.writeDb(allDb);
    }

    return res.status(201).json({
      success: true,
      message: linkedReq
        ? `Thank you! Donated and pledged ${parsedQty} item(s) to ${linkedReq.organizationName}.`
        : 'Thank you! Educational resource donated 100% free on ShikshaShare.',
      donation: newDonation,
      resource: newResource
    });
  } catch (err) {
    console.error('[Donations Error - Create]:', err);
    return res.status(500).json({ success: false, message: 'Failed to process donation.' });
  }
});

/**
 * PATCH /api/donations/:id/status
 * Update donation pledge status (Donor owner or Admin only)
 */
router.patch('/:id/status', requireAuth, (req, res) => {
  const { status, note } = req.body;
  if (!status) {
    return res.status(400).json({ success: false, message: 'Status is required.' });
  }

  const existing = db.findById('donations', req.params.id);
  if (!existing) {
    return res.status(404).json({ success: false, message: 'Donation not found.' });
  }

  // Enforce ownership: donor owner or admin
  if (req.user.role !== 'admin' && existing.donorId && existing.donorId !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'Access denied: You can only update your own donations.'
    });
  }

  const updated = db.updateById('donations', req.params.id, { status, ...(note && { note }) });

  return res.json({ success: true, message: 'Donation status updated.', donation: updated });
});

module.exports = router;
