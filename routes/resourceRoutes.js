// ShikshaShare Educational Resources Routes
const express = require('express');
const router = express.Router();
const db = require('../utils/database');
const { requireAuth, optionalAuth } = require('../middleware/authMiddleware');
const { processResourceImages, validateAndSavePhotos } = require('../utils/imageStorage');
const { calculateMaxPrice } = require('../utils/priceCalculator');

/**
 * POST /api/resources/upload
 * Endpoint to upload and persist resource photos to disk
 */
router.post('/upload', optionalAuth, (req, res) => {
  try {
    const { images, image } = req.body;
    const validation = validateAndSavePhotos(images, image);
    if (!validation.valid) {
      return res.status(400).json({ success: false, message: validation.error });
    }
    return res.json({ success: true, photos: validation.photos });
  } catch (err) {
    console.error('[Resources Upload Error]:', err);
    return res.status(500).json({ success: false, message: 'Failed to process photo upload.' });
  }
});

/**
 * GET /api/resources
 * Query, search, and filter educational resources
 */
router.get('/', (req, res) => {
  try {
    const {
      search,
      category,
      educationLevel,
      level, // alias
      stream,
      branch,
      semester,
      type,
      condition,
      status,
      providerId,
      featured
    } = req.query;

    const queryLevel = educationLevel || level;
    let resources = db.getCollection('resources');

    // Filter by search keyword
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      resources = resources.filter(r =>
        (r.title && r.title.toLowerCase().includes(q)) ||
        (r.description && r.description.toLowerCase().includes(q)) ||
        (r.subject && r.subject.toLowerCase().includes(q)) ||
        (r.providerName && r.providerName.toLowerCase().includes(q)) ||
        (r.location && r.location.toLowerCase().includes(q)) ||
        (r.branch && r.branch.toLowerCase().includes(q))
      );
    }

    // Filter by education level
    if (queryLevel && queryLevel !== 'all') {
      resources = resources.filter(r => r.educationLevel === queryLevel);
    }

    // Filter by category
    if (category && category !== 'all') {
      resources = resources.filter(r => r.category === category);
    }

    // Filter by type ('free' vs 'buy')
    if (type && type !== 'all') {
      resources = resources.filter(r => r.type === type);
    }

    // Filter by stream
    if (stream && stream !== 'all') {
      resources = resources.filter(r => r.stream === stream);
    }

    // Filter by branch
    if (branch && branch !== 'all') {
      resources = resources.filter(r => r.branch === branch);
    }

    // Filter by semester
    if (semester && semester !== 'all') {
      resources = resources.filter(r => r.semester === semester);
    }

    // Filter by condition
    if (condition && condition !== 'all') {
      resources = resources.filter(r => r.condition === condition);
    }

    // Filter by status (available, reserved, claimed, sold)
    if (status && status !== 'all') {
      resources = resources.filter(r => (r.status || 'available') === status);
    }

    // Filter by provider
    if (providerId) {
      resources = resources.filter(r => r.providerId === providerId);
    }

    // Filter by featured
    if (featured === 'true') {
      resources = resources.filter(r => r.featured === true);
    }

    return res.json({
      success: true,
      count: resources.length,
      resources
    });
  } catch (err) {
    console.error('[Resources Error - List]:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve resources.' });
  }
});

/**
 * GET /api/resources/:id
 * Retrieve full details for a single resource
 */
router.get('/:id', (req, res) => {
  const resource = db.findById('resources', req.params.id);
  if (!resource) {
    return res.status(404).json({
      success: false,
      message: `Resource with ID '${req.params.id}' not found.`
    });
  }

  return res.json({
    success: true,
    resource
  });
});

/**
 * POST /api/resources
 * Create a new educational resource listing
 */
router.post('/', optionalAuth, (req, res) => {
  try {
    const {
      title,
      category,
      educationLevel = 'college',
      stream = '',
      branch = '',
      semester = '',
      subject = '',
      condition = 'Good',
      type = 'buy',
      price = 0,
      originalPrice = 0,
      purchaseDate,
      location,
      description = '',
      image,
      images,
      availability = 'Available for Pickup'
    } = req.body;

    // Validation
    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Resource title is required.' });
    }
    if (!category || !category.trim()) {
      return res.status(400).json({ success: false, message: 'Resource category is required.' });
    }
    if (!location || !location.trim()) {
      return res.status(400).json({ success: false, message: 'Pickup / handover location is required.' });
    }

    const isFree = type === 'free';
    let parsedPrice = isFree ? 0 : Math.max(0, Number(price) || 0);
    let calculatedMaxPrice = 0;
    let ageRate = 1.0;
    let conditionRate = 1.0;

    if (isFree) {
      parsedPrice = 0;
      calculatedMaxPrice = 0;
    } else {
      if (!price || Number(price) <= 0) {
        return res.status(400).json({ success: false, message: 'Please enter a valid asking price greater than ₹0 for items listed for sale.' });
      }
      if (!originalPrice || Number(originalPrice) <= 0) {
        return res.status(400).json({ success: false, message: 'Original purchase price is required for items listed for sale.' });
      }
      if (!purchaseDate) {
        return res.status(400).json({ success: false, message: 'Purchase date is required to calculate resource age and price limit.' });
      }

      const priceLimit = calculateMaxPrice({
        originalPrice,
        purchaseDate,
        condition,
        type: 'buy'
      });

      if (!priceLimit.allowed) {
        return res.status(400).json({ success: false, message: priceLimit.error });
      }

      calculatedMaxPrice = priceLimit.maxPrice;
      ageRate = priceLimit.ageRate;
      conditionRate = priceLimit.conditionRate;

      if (parsedPrice > calculatedMaxPrice) {
        return res.status(400).json({
          success: false,
          message: `Selling price (₹${parsedPrice}) exceeds the calculated maximum price of ₹${calculatedMaxPrice}.`
        });
      }
    }

    // Mandatory photo validation - require at least 1 actual photo, no stock photo fallbacks
    const photoValidation = validateAndSavePhotos(images, image);
    if (!photoValidation.valid) {
      return res.status(400).json({ success: false, message: photoValidation.error });
    }
    const savedPhotos = photoValidation.photos;

    const providerName = req.user ? req.user.name : (req.body.providerName || 'Community Member');
    const providerId = req.user ? req.user.id : (req.body.providerId || 'guest');
    const providerRole = isFree ? 'Resource Provider (Free Donation)' : (req.user?.role === 'student' ? 'Student / Provider' : 'Resource Provider');

    const newResource = {
      id: `res-${Date.now()}`,
      title: title.trim(),
      category: category.trim(),
      educationLevel,
      stream,
      branch,
      semester,
      subject,
      condition,
      type: isFree ? 'free' : 'buy',
      price: parsedPrice,
      originalPrice: Number(originalPrice) || 0,
      purchaseDate: purchaseDate || null,
      maxPrice: calculatedMaxPrice,
      ageRate,
      conditionRate,
      location: location.trim(),
      providerId,
      providerName,
      providerRole,
      description: description.trim(),
      image: savedPhotos[0],
      images: savedPhotos,
      availability,
      dateAdded: new Date().toISOString().split('T')[0],
      featured: false,
      status: 'available',
      moderationStatus: 'verified'
    };

    db.insert('resources', newResource);

    return res.status(201).json({
      success: true,
      message: 'Resource listed successfully on ShikshaShare!',
      resource: newResource
    });
  } catch (err) {
    console.error('[Resources Error - Create]:', err);
    return res.status(500).json({ success: false, message: 'Failed to create resource listing.' });
  }
});

/**
 * PUT /api/resources/:id
 * Update an existing resource listing (Owner or Admin only)
 */
router.put('/:id', requireAuth, (req, res) => {
  const resource = db.findById('resources', req.params.id);
  if (!resource) {
    return res.status(404).json({ success: false, message: 'Resource not found.' });
  }

  // Authorization check (only owner or admin can update)
  if (req.user.role !== 'admin' && resource.providerId && resource.providerId !== req.user.id) {
    return res.status(403).json({ success: false, message: 'Access denied: You can only edit your own listings.' });
  }

  const updates = { ...req.body };
  delete updates.id; // Prevent ID mutation

  const targetType = updates.type || resource.type;
  if (targetType === 'free') {
    updates.price = 0;
    updates.maxPrice = 0;
  } else {
    const origPrice = updates.originalPrice !== undefined ? updates.originalPrice : resource.originalPrice;
    const purDate = updates.purchaseDate !== undefined ? updates.purchaseDate : resource.purchaseDate;
    const cond = updates.condition !== undefined ? updates.condition : resource.condition;
    const askPrice = updates.price !== undefined ? Number(updates.price) : resource.price;

    if (origPrice && purDate && cond) {
      const priceLimit = calculateMaxPrice({
        originalPrice: origPrice,
        purchaseDate: purDate,
        condition: cond,
        type: 'buy'
      });

      if (!priceLimit.allowed) {
        return res.status(400).json({ success: false, message: priceLimit.error });
      }

      updates.maxPrice = priceLimit.maxPrice;
      updates.ageRate = priceLimit.ageRate;
      updates.conditionRate = priceLimit.conditionRate;

      if (askPrice > priceLimit.maxPrice) {
        return res.status(400).json({
          success: false,
          message: `Selling price (₹${askPrice}) exceeds the calculated maximum price of ₹${priceLimit.maxPrice}.`
        });
      }
    }
  }

  // If photos are provided during update, validate and process them
  if (updates.images || updates.image) {
    const photoValidation = validateAndSavePhotos(updates.images, updates.image);
    if (photoValidation.valid) {
      updates.images = photoValidation.photos;
      updates.image = photoValidation.photos[0];
    }
  }

  const updatedResource = db.updateById('resources', req.params.id, updates);

  return res.json({
    success: true,
    message: 'Resource listing updated successfully.',
    resource: updatedResource
  });
});

/**
 * DELETE /api/resources/:id
 * Remove a resource listing (Owner or Admin only)
 */
router.delete('/:id', requireAuth, (req, res) => {
  const resource = db.findById('resources', req.params.id);
  if (!resource) {
    return res.status(404).json({ success: false, message: 'Resource not found.' });
  }

  // Authorization check (only owner or admin can delete)
  if (req.user.role !== 'admin' && resource.providerId && resource.providerId !== req.user.id) {
    return res.status(403).json({ success: false, message: 'Access denied: You can only delete your own listings.' });
  }

  db.deleteById('resources', req.params.id);

  return res.json({
    success: true,
    message: 'Resource listing removed successfully.'
  });
});

module.exports = router;
