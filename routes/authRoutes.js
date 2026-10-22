// ShikshaShare Authentication Routes
const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const db = require('../utils/database');
const { generateToken, requireAuth } = require('../middleware/authMiddleware');

/**
 * Returns human-readable label for a role
 */
function getRoleLabel(role) {
  switch (role) {
    case 'student': return 'Student';
    case 'provider': return 'Resource Provider';
    case 'community': return 'Community Partner (NGO / NSS / Foundation / School)';
    case 'admin': return 'System Administrator';
    default: return 'Community Member';
  }
}

/**
 * Validates password with bcrypt, with graceful fallback for unhashed seed records
 */
async function comparePasswords(plainPassword, storedPassword) {
  if (!storedPassword) return false;
  if (storedPassword.startsWith('$2a$') || storedPassword.startsWith('$2b$')) {
    return await bcrypt.compare(plainPassword, storedPassword);
  }
  // Plaintext match fallback for demo seed records, then hash on update
  return plainPassword === storedPassword;
}

/**
 * POST /api/auth/register
 * Register a new student or community member
 */
router.post('/register', async (req, res) => {
  try {
    const {
      name,
      email,
      mobile,
      password,
      role = 'student',
      institution,
      educationLevel = 'college',
      stream = 'B.Tech / B.E.',
      branch = 'Computer Engineering / CS / IT',
      semester = 'Semester 3',
      location = 'Mumbai'
    } = req.body;

    // Validation
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Full name is required.' });
    }
    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, message: 'Valid email address is required.' });
    }
    if (!mobile || !mobile.trim()) {
      return res.status(400).json({ success: false, message: 'Mobile number is required.' });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
    }

    // Role validation: Public registration only allows student, provider, community
    const allowedRoles = ['student', 'provider', 'community'];
    if (role === 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin accounts cannot be created via public registration. Protected administrator access only.'
      });
    }
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role selected. Please choose from: Student, Resource Provider, or Community Partner.'
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanMobile = mobile.trim().replace(/\D/g, '');

    // Check existing accounts
    const existingUser = db.findOne('users', u => {
      const uEmail = (u.email || '').toLowerCase();
      const uPhone = (u.mobile || '').replace(/\D/g, '');
      return (uEmail && uEmail === cleanEmail) || (cleanMobile && uPhone && uPhone === cleanMobile);
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this Email ID or Mobile Number is already registered.'
      });
    }

    // Hash password with bcrypt
    const hashedPassword = await bcrypt.hash(password, 10);

    const nameParts = (name || '').trim().split(/\s+/).filter(Boolean);
    const initials = nameParts.length === 0
      ? 'U'
      : nameParts.length === 1
        ? (nameParts[0].length > 1 ? nameParts[0].substring(0, 2).toUpperCase() : nameParts[0][0].toUpperCase())
        : (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase();

    const newUser = {
      id: `user-${Date.now()}`,
      name: name.trim(),
      email: cleanEmail,
      mobile: cleanMobile,
      password: hashedPassword,
      role,
      roleLabel: getRoleLabel(role),
      institution: institution || (role === 'student' ? 'College Student' : 'Community Member'),
      educationLevel,
      stream,
      branch,
      semester,
      location,
      city: location,
      avatar: initials,
      emailVerified: true,
      savedItems: [],
      registeredAt: new Date().toISOString()
    };

    db.insert('users', newUser);

    const token = generateToken(newUser);
    const { password: _, ...safeUser } = newUser;

    return res.status(201).json({
      success: true,
      message: 'Registration successful! Welcome to ShikshaShare.',
      token,
      user: safeUser
    });
  } catch (err) {
    console.error('[Auth Error - Register]:', err);
    return res.status(500).json({
      success: false,
      message: 'An unexpected server error occurred during registration.'
    });
  }
});

/**
 * POST /api/auth/login
 * Log in using email or mobile number and password
 */
router.post('/login', async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both Email ID/Mobile Number and password.'
      });
    }

    const cleanId = identifier.trim().toLowerCase();
    const cleanPhone = cleanId.replace(/\D/g, '');

    const user = db.findOne('users', u => {
      const uEmail = (u.email || '').toLowerCase();
      const uPhone = (u.mobile || '').replace(/\D/g, '');
      return (uEmail && uEmail === cleanId) || (cleanPhone && uPhone && uPhone === cleanPhone);
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'No account found matching this Email ID or Mobile Number.'
      });
    }

    const isMatch = await comparePasswords(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Incorrect password. Please verify and try again.'
      });
    }

    const token = generateToken(user);
    const { password: _, ...safeUser } = user;

    return res.json({
      success: true,
      message: 'Login successful.',
      token,
      user: safeUser
    });
  } catch (err) {
    console.error('[Auth Error - Login]:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error during authentication.'
    });
  }
});


/**
 * GET /api/auth/me
 * Returns profile of currently authenticated user
 */
router.get('/me', requireAuth, (req, res) => {
  return res.json({
    success: true,
    user: req.user
  });
});

module.exports = router;
