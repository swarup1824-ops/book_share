// ShikshaShare User & Profile Management Routes
const express = require('express');
const router = express.Router();
const db = require('../utils/database');
const { requireAuth, optionalAuth } = require('../middleware/authMiddleware');

/**
 * GET /api/users/profile
 * Returns the current authenticated user's profile
 */
router.get('/profile', requireAuth, (req, res) => {
  const user = db.findById('users', req.user.id);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found.' });
  }

  const { password, ...safeUser } = user;
  return res.json({ success: true, profile: safeUser });
});

/**
 * PUT /api/users/profile
 * Updates student education/curriculum preferences and contact info
 */
router.put('/profile', requireAuth, (req, res) => {
  try {
    const {
      name,
      institution,
      educationLevel,
      level, // frontend alias
      stream,
      branch,
      semester,
      classNum,
      exam,
      location,
      city
    } = req.body;

    const updates = {};
    if (name !== undefined) updates.name = name.trim();
    if (institution !== undefined) updates.institution = institution.trim();
    if (educationLevel !== undefined) updates.educationLevel = educationLevel;
    if (level !== undefined) updates.educationLevel = level;
    if (stream !== undefined) updates.stream = stream;
    if (branch !== undefined) updates.branch = branch;
    if (semester !== undefined) updates.semester = semester;
    if (classNum !== undefined) updates.classNum = classNum;
    if (exam !== undefined) updates.exam = exam;
    if (location !== undefined) updates.location = location;
    if (city !== undefined) updates.city = city;

    const updatedUser = db.updateById('users', req.user.id, updates);
    if (!updatedUser) {
      return res.status(404).json({ success: false, message: 'User profile not found.' });
    }

    const { password, ...safeUser } = updatedUser;
    return res.json({
      success: true,
      message: 'Profile preferences updated successfully.',
      profile: safeUser
    });
  } catch (err) {
    console.error('[User Error - Profile Update]:', err);
    return res.status(500).json({ success: false, message: 'Failed to update profile.' });
  }
});

/**
 * GET /api/users/saved
 * Returns array of saved resource IDs for current user
 */
router.get('/saved', requireAuth, (req, res) => {
  const user = db.findById('users', req.user.id);
  const savedIds = (user && Array.isArray(user.savedItems)) ? user.savedItems : [];
  
  // Also optionally return full resource items if query ?populate=true
  if (req.query.populate === 'true') {
    const allResources = db.getCollection('resources');
    const items = allResources.filter(r => savedIds.includes(r.id));
    return res.json({ success: true, savedIds, items });
  }

  return res.json({ success: true, savedIds });
});

/**
 * POST /api/users/saved/:resourceId
 * Toggles a resource in user's saved/wishlist items
 */
router.post('/saved/:resourceId', requireAuth, (req, res) => {
  const { resourceId } = req.params;
  const user = db.findById('users', req.user.id);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found.' });
  }

  let savedItems = Array.isArray(user.savedItems) ? [...user.savedItems] : [];
  const exists = savedItems.includes(resourceId);

  if (exists) {
    savedItems = savedItems.filter(id => id !== resourceId);
  } else {
    savedItems.push(resourceId);
  }

  db.updateById('users', req.user.id, { savedItems });

  return res.json({
    success: true,
    isSaved: !exists,
    message: !exists ? 'Resource saved to wishlist.' : 'Resource removed from wishlist.',
    savedItems
  });
});

/**
 * GET /api/users
 * Returns list of public users/providers/donors (sanitized)
 */
router.get('/', optionalAuth, (req, res) => {
  const users = db.getCollection('users');
  const safeUsers = users.map(u => {
    const { password, mobile, ...safe } = u;
    return safe;
  });

  return res.json({ success: true, count: safeUsers.length, users: safeUsers });
});

/**
 * GET /api/users/:id
 * Returns public profile for a specific user
 */
router.get('/:id', (req, res) => {
  const user = db.findById('users', req.params.id);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found.' });
  }

  const { password, mobile, ...safeUser } = user;
  const userResources = db.find('resources', r => r.providerId === user.id);

  return res.json({
    success: true,
    user: {
      ...safeUser,
      activeListings: userResources
    }
  });
});

module.exports = router;
