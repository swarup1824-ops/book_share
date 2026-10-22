// ShikshaShare In-App Notifications Routes
// Provides persistent, user-specific notifications for listing purchase requests and updates

const express = require('express');
const router = express.Router();
const db = require('../utils/database');
const { optionalAuth, requireAuth } = require('../middleware/authMiddleware');

/**
 * Resolve current user ID from token or custom auth header
 */
function resolveUserId(req) {
  if (req.user && req.user.id) return req.user.id;
  const headerId = req.headers['x-user-id'];
  if (headerId && typeof headerId === 'string') return headerId.trim();
  return null;
}

/**
 * GET /api/notifications
 * Retrieves notifications for the currently logged-in user
 */
router.get('/', optionalAuth, (req, res) => {
  try {
    const userId = resolveUserId(req);
    if (!userId) {
      return res.json({
        success: true,
        count: 0,
        unreadCount: 0,
        notifications: []
      });
    }

    const allNotifs = db.getCollection('notifications') || [];
    // Filter strictly for this specific user
    const userNotifs = allNotifs
      .filter(n => n.userId === userId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const unreadCount = userNotifs.filter(n => !n.read).length;

    return res.json({
      success: true,
      count: userNotifs.length,
      unreadCount,
      notifications: userNotifs
    });
  } catch (err) {
    console.error('[Notifications Error - List]:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve notifications.' });
  }
});

/**
 * PATCH /api/notifications/:id/read
 * Mark a specific notification as read
 */
router.patch('/:id/read', optionalAuth, (req, res) => {
  try {
    const userId = resolveUserId(req);
    const notifId = req.params.id;
    const notification = db.findById('notifications', notifId);

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found.' });
    }

    // Verify ownership
    if (userId && notification.userId !== userId) {
      return res.status(403).json({ success: false, message: 'Access denied: not your notification.' });
    }

    const updated = db.updateById('notifications', notifId, {
      read: true,
      readAt: new Date().toISOString()
    });

    return res.json({
      success: true,
      notification: updated
    });
  } catch (err) {
    console.error('[Notifications Error - Mark Read]:', err);
    return res.status(500).json({ success: false, message: 'Failed to update notification.' });
  }
});

/**
 * PATCH /api/notifications/read-all
 * Mark all notifications for current user as read
 */
router.patch('/read-all', optionalAuth, (req, res) => {
  try {
    const userId = resolveUserId(req);
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    const dbObj = db.readDb();
    if (!Array.isArray(dbObj.notifications)) {
      dbObj.notifications = [];
    }

    let updatedCount = 0;
    const now = new Date().toISOString();
    dbObj.notifications = dbObj.notifications.map(n => {
      if (n.userId === userId && !n.read) {
        updatedCount++;
        return { ...n, read: true, readAt: now };
      }
      return n;
    });

    db.writeDb(dbObj);

    return res.json({
      success: true,
      message: `Marked ${updatedCount} notifications as read.`,
      updatedCount
    });
  } catch (err) {
    console.error('[Notifications Error - Mark All Read]:', err);
    return res.status(500).json({ success: false, message: 'Failed to mark all as read.' });
  }
});

module.exports = router;
