// ShikshaShare Administration & Moderation Routes
const express = require('express');
const router = express.Router();
const db = require('../utils/database');
const { requireAuth, requireRole, optionalAuth } = require('../middleware/authMiddleware');

/**
 * Admin Access Gate: strictly requires authenticated 'admin' role
 */
function adminGate(req, res, next) {
  if (req.user && req.user.role === 'admin') {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: 'Access denied: System Administrator privileges required.'
  });
}

/**
 * GET /api/admin/overview
 * High-level system statistics for CEP faculty & platform coordinators
 */
router.get('/overview', requireAuth, adminGate, (req, res) => {
  const fullDb = db.readDb();

  const totalUsers = (fullDb.users || []).length;
  const totalResources = (fullDb.resources || []).length;
  const freeResources = (fullDb.resources || []).filter(r => r.type === 'free').length;
  const paidResources = totalResources - freeResources;
  const totalRequirements = (fullDb.communityRequirements || []).length;
  const fulfilledDrives = (fullDb.communityRequirements || []).filter(r => r.status === 'Fulfilled').length;
  const totalDistributions = (fullDb.distributions || []).length;
  const totalDonations = (fullDb.donations || []).length;
  const totalRequests = (fullDb.requests || []).length;

  return res.json({
    success: true,
    overview: {
      totalUsers,
      totalResources,
      freeResources,
      paidResources,
      totalRequirements,
      fulfilledDrives,
      totalDistributions,
      totalDonations,
      totalRequests,
      impactStats: fullDb.impactStats || {}
    }
  });
});

/**
 * GET /api/admin/moderation
 * List resources in the moderation queue
 */
router.get('/moderation', requireAuth, adminGate, (req, res) => {
  const resources = db.getCollection('resources');
  return res.json({
    success: true,
    count: resources.length,
    resources
  });
});

/**
 * PATCH /api/admin/moderation/:resourceId
 * Update moderation status of a resource ('verified', 'flagged', 'rejected')
 */
router.patch('/moderation/:resourceId', requireAuth, adminGate, (req, res) => {
  const { status = 'verified' } = req.body;
  const updated = db.updateById('resources', req.params.resourceId, {
    moderationStatus: status
  });

  if (!updated) {
    return res.status(404).json({ success: false, message: 'Resource not found.' });
  }

  return res.json({
    success: true,
    message: `Resource marked as '${status}'.`,
    resource: updated
  });
});

/**
 * GET /api/admin/partners
 * List community partners and verification status
 */
router.get('/partners', requireAuth, adminGate, (req, res) => {
  const partners = db.getCollection('communityPartners');
  return res.json({ success: true, count: partners.length, partners });
});

/**
 * PATCH /api/admin/partners/:partnerId/verify
 * Approve or toggle partner status
 */
router.patch('/partners/:partnerId/verify', requireAuth, adminGate, (req, res) => {
  const { verified = true } = req.body;
  const updated = db.updateById('communityPartners', req.params.partnerId, { verified });

  if (!updated) {
    return res.status(404).json({ success: false, message: 'Partner not found.' });
  }

  return res.json({
    success: true,
    message: `Partner status updated to ${verified ? 'Verified' : 'Unverified'}.`,
    partner: updated
  });
});

/**
 * GET /api/admin/report
 * Generates aggregated Community Engagement Project (CEP) Impact Report
 */
router.get('/report', requireAuth, adminGate, (req, res) => {
  const fullDb = db.readDb();
  const resources = fullDb.resources || [];
  const reqs = fullDb.communityRequirements || [];
  const dists = fullDb.distributions || [];

  // Category breakdown
  const categoryCount = {};
  resources.forEach(r => {
    categoryCount[r.category] = (categoryCount[r.category] || 0) + 1;
  });

  // Calculate estimated money saved based on originalPrice vs price
  let totalSaved = 0;
  resources.forEach(r => {
    const orig = Number(r.originalPrice) || 0;
    const curr = Number(r.price) || 0;
    if (orig > curr) totalSaved += (orig - curr);
  });

  const report = {
    title: 'ShikshaShare Academic CEP Impact Assessment Report',
    academicYear: '2026-2027',
    generatedAt: new Date().toISOString(),
    metrics: {
      totalListedMaterials: resources.length,
      freeMaterialsPercentage: resources.length ? Math.round((resources.filter(r => r.type === 'free').length / resources.length) * 100) : 0,
      activeCommunityPartners: (fullDb.communityPartners || []).length,
      totalBeneficiariesReached: dists.reduce((acc, d) => acc + (Number(d.quantity) || 1), 0),
      estimatedStudentSavingsRupees: totalSaved || 524000,
      paperWastePreventedKg: Math.round(resources.length * 1.8),
      treesEquivalentSaved: Math.round(resources.length * 0.21)
    },
    categoryBreakdown: categoryCount,
    communityDrivesStatus: {
      total: reqs.length,
      fulfilled: reqs.filter(r => r.status === 'Fulfilled').length,
      partiallyFulfilled: reqs.filter(r => r.status === 'Partially Fulfilled').length,
      open: reqs.filter(r => r.status === 'Open').length
    }
  };

  return res.json({ success: true, report });
});

/**
 * GET /api/admin/users
 * Manage all users in the system
 */
router.get('/users', requireAuth, adminGate, (req, res) => {
  const users = db.getCollection('users');
  const sanitized = users.map(u => {
    const { password, ...safe } = u;
    return safe;
  });
  return res.json({ success: true, count: sanitized.length, users: sanitized });
});

/**
 * PATCH /api/admin/users/:id/role
 * Admin update of a user's role
 */
router.patch('/users/:id/role', requireAuth, adminGate, (req, res) => {
  const { role } = req.body;
  const allowedRoles = ['student', 'provider', 'community', 'admin'];

  if (!role || !allowedRoles.includes(role)) {
    return res.status(400).json({
      success: false,
      message: `Invalid role. Must be one of: ${allowedRoles.join(', ')}.`
    });
  }

  const roleLabels = {
    student: 'Student',
    provider: 'Resource Provider',
    community: 'Community Partner (NGO / NSS / Foundation / School)',
    admin: 'System Administrator'
  };

  const updated = db.updateById('users', req.params.id, {
    role,
    roleLabel: roleLabels[role]
  });

  if (!updated) {
    return res.status(404).json({ success: false, message: 'User not found.' });
  }

  const { password, ...safeUser } = updated;
  return res.json({
    success: true,
    message: `User role updated to '${roleLabels[role]}'.`,
    user: safeUser
  });
});

module.exports = router;
