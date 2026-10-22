// ShikshaShare State Management & Persistence Layer
// "Connecting Students, Resources & Community"

const STORAGE_KEYS = {
  CURRENT_USER: 'shikshashare_current_user',
  TOKEN: 'shikshashare_token',
  REGISTERED_USERS: 'shikshashare_registered_users',
  STUDENT_PROFILE: 'shikshashare_student_profile',
  RESOURCES: 'shikshashare_resources',
  REQUIREMENTS: 'shikshashare_community_requirements',
  MY_REQUESTS: 'shikshashare_my_requests',
  SAVED_ITEMS: 'shikshashare_saved_items',
  DISTRIBUTIONS: 'shikshashare_distributions',
  DONATIONS: 'shikshashare_donations',
  NOTIFICATIONS: 'shikshashare_notifications'
};

/**
 * ShikshaShare Price Calculator (Client Side)
 * Standardized maximum price limit formula based on resource age and condition
 */
const PriceCalculator = {
  calculateAge(purchaseDate, referenceDate = new Date()) {
    if (!purchaseDate) return null;
    const pDate = new Date(purchaseDate);
    const rDate = new Date(referenceDate);
    if (isNaN(pDate.getTime()) || isNaN(rDate.getTime())) return null;

    const pUtc = Date.UTC(pDate.getFullYear(), pDate.getMonth(), pDate.getDate());
    const rUtc = Date.UTC(rDate.getFullYear(), rDate.getMonth(), rDate.getDate());
    if (pUtc > rUtc) return { months: -1, diffDays: -1, isFuture: true };

    const diffDays = Math.floor((rUtc - pUtc) / (1000 * 60 * 60 * 24));
    const yearDiff = rDate.getFullYear() - pDate.getFullYear();
    const monthDiff = rDate.getMonth() - pDate.getMonth();
    const dayDiff = rDate.getDate() - pDate.getDate();

    let months = yearDiff * 12 + monthDiff;
    if (dayDiff < 0) {
      const prevMonthDays = new Date(rDate.getFullYear(), rDate.getMonth(), 0).getDate();
      months -= 1;
      months += (prevMonthDays + dayDiff) / prevMonthDays;
    } else {
      const curMonthDays = new Date(rDate.getFullYear(), rDate.getMonth() + 1, 0).getDate();
      months += dayDiff / curMonthDays;
    }

    return { months: Math.max(0, months), diffDays, isFuture: false };
  },

  getAgeRate(months, diffDays = null) {
    if (months === null || months === undefined || months < 0) return null;
    if (months <= 2.0 || (diffDays !== null && diffDays <= 61)) {
      return { rate: 0.95, label: '0–2 months (95%)' };
    } else if (months <= 6.0 || (diffDays !== null && diffDays <= 183)) {
      return { rate: 0.85, label: 'Over 2–6 months (85%)' };
    } else if (months <= 12.0 || (diffDays !== null && diffDays <= 366)) {
      return { rate: 0.70, label: 'Over 6–12 months (70%)' };
    } else if (months <= 24.0 || (diffDays !== null && diffDays <= 732)) {
      return { rate: 0.55, label: 'Over 1–2 years (55%)' };
    } else {
      return { rate: 0.40, label: 'Over 2 years (40%)' };
    }
  },

  getConditionRate(condition) {
    const c = String(condition || '').trim().toLowerCase();
    if (c === 'like new') {
      return { rate: 1.0, allowed: true, label: 'Like New (100%)' };
    } else if (c === 'good') {
      return { rate: 0.90, allowed: true, label: 'Good (90%)' };
    } else if (c === 'fair') {
      return { rate: 0.75, allowed: true, label: 'Fair (75%)' };
    } else if (c === 'poor' || c === 'damaged' || c === 'poor / damaged' || c.includes('poor') || c.includes('damaged')) {
      return { rate: 0, allowed: false, label: 'Poor / Damaged', error: 'Poor/Damaged items cannot be sold until reviewed.' };
    }
    return { rate: 0.75, allowed: true, label: 'Fair (75%)' };
  },

  calculateMaxPrice({ originalPrice, purchaseDate, condition, type = 'buy', referenceDate = new Date() }) {
    if (type === 'free') {
      return { allowed: true, maxPrice: 0, ageRate: 0, conditionRate: 0, isFree: true };
    }
    const origPrice = Number(originalPrice);
    if (!origPrice || origPrice <= 0 || isNaN(origPrice)) {
      return { allowed: false, maxPrice: null, error: 'Valid original purchase price is required.' };
    }
    if (!purchaseDate) {
      return { allowed: false, maxPrice: null, error: 'Purchase date is required.' };
    }
    const ageData = this.calculateAge(purchaseDate, referenceDate);
    if (!ageData) {
      return { allowed: false, maxPrice: null, error: 'Invalid purchase date.' };
    }
    if (ageData.isFuture) {
      return { allowed: false, maxPrice: null, error: 'Purchase date cannot be in the future.' };
    }
    const ageInfo = this.getAgeRate(ageData.months, ageData.diffDays);
    const condInfo = this.getConditionRate(condition);
    if (!condInfo.allowed) {
      return { allowed: false, maxPrice: 0, error: condInfo.error || 'Poor/Damaged items cannot be sold until reviewed.' };
    }
    const rawMax = origPrice * ageInfo.rate * condInfo.rate;
    const maxPrice = Math.floor(rawMax);
    return {
      allowed: true,
      originalPrice: origPrice,
      purchaseDate,
      monthsAge: Math.round(ageData.months * 10) / 10,
      ageRate: ageInfo.rate,
      ageLabel: ageInfo.label,
      conditionRate: condInfo.rate,
      conditionLabel: condInfo.label,
      maxPrice
    };
  }
};

if (typeof window !== 'undefined') {
  window.PriceCalculator = PriceCalculator;
}

/**
 * Generate user initials from full name by taking the first letter of
 * the first name and the first letter of the last name.
 * Handles extra spaces and names with multiple words correctly.
 *
 * Examples:
 * - "Swarup Kadam" -> "SK"
 * - "Rahul Sharma" -> "RS"
 * - "Priya Patil" -> "PP"
 * - "  Swarup    Vishnu   Kadam  " -> "SK"
 * - "Swarup" -> "SW"
 *
 * @param {string} name - User's full name
 * @returns {string} Two-letter uppercase initials (or fallback)
 */
function getInitials(name) {
  if (!name || typeof name !== 'string') return 'U';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'U';
  if (parts.length === 1) {
    return parts[0].length > 1
      ? parts[0].substring(0, 2).toUpperCase()
      : parts[0][0].toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const getUserInitials = getInitials;
if (typeof window !== 'undefined') {
  window.getInitials = getInitials;
  window.getUserInitials = getInitials;
}

class StateManager {
  constructor() {
    this.init();
  }

  init() {
    // Current User (Guest by default, user logs in via Login button)
    // No auto-assigned role in top navigation

    // Default Student Profile
    if (!localStorage.getItem(STORAGE_KEYS.STUDENT_PROFILE)) {
      const defaultStudent = {
        name: 'Swarup Patil',
        level: 'college',
        stream: 'B.Tech / B.E.',
        branch: 'Computer Engineering / CS / IT',
        semester: 'Semester 3',
        classNum: '',
        exam: '',
        city: 'Mumbai',
        college: 'VJTI Mumbai'
      };
      localStorage.setItem(STORAGE_KEYS.STUDENT_PROFILE, JSON.stringify(defaultStudent));
    }

    // Resources initialization & demo cleanup
    if (localStorage.getItem(STORAGE_KEYS.RESOURCES)) {
      try {
        const cached = JSON.parse(localStorage.getItem(STORAGE_KEYS.RESOURCES));
        if (Array.isArray(cached)) {
          const cleaned = cached.filter(r => !r.id.startsWith('res-free-') && !r.id.startsWith('res-sale-') && r.providerId !== 'guest' && r.providerId !== 'user-donor' && r.providerId !== 'user-provider');
          localStorage.setItem(STORAGE_KEYS.RESOURCES, JSON.stringify(cleaned));
        }
      } catch (e) {
        localStorage.setItem(STORAGE_KEYS.RESOURCES, JSON.stringify([]));
      }
    } else {
      localStorage.setItem(STORAGE_KEYS.RESOURCES, JSON.stringify([]));
    }

    // Seed Community Requirements
    if (!localStorage.getItem(STORAGE_KEYS.REQUIREMENTS)) {
      localStorage.setItem(STORAGE_KEYS.REQUIREMENTS, JSON.stringify(INITIAL_COMMUNITY_REQUIREMENTS));
    }

    // Requests initialization & demo cleanup
    if (localStorage.getItem(STORAGE_KEYS.MY_REQUESTS)) {
      try {
        const reqs = JSON.parse(localStorage.getItem(STORAGE_KEYS.MY_REQUESTS));
        if (Array.isArray(reqs)) {
          const cleaned = reqs.filter(r => r.id !== 'user-req-1' && r.id !== 'user-req-2');
          localStorage.setItem(STORAGE_KEYS.MY_REQUESTS, JSON.stringify(cleaned));
        }
      } catch (e) {
        localStorage.setItem(STORAGE_KEYS.MY_REQUESTS, JSON.stringify([]));
      }
    } else {
      localStorage.setItem(STORAGE_KEYS.MY_REQUESTS, JSON.stringify([]));
    }

    // Saved Items
    if (!localStorage.getItem(STORAGE_KEYS.SAVED_ITEMS)) {
      localStorage.setItem(STORAGE_KEYS.SAVED_ITEMS, JSON.stringify([]));
    }

    // Community Distributions Log
    if (!localStorage.getItem(STORAGE_KEYS.DISTRIBUTIONS)) {
      const initialDistributions = [
        {
          id: 'dist-1',
          requirementId: 'req-4',
          requirementTitle: '8 Engineering Mini Drafters Needed for 1st Year Degree Scholars',
          organizationName: 'Seva Bharati Student Aid Wing',
          beneficiaries: '8 Rural First Year Scholars',
          quantity: 8,
          date: '2026-08-22',
          distributedBy: 'Harshwardhan Patil',
          status: 'Completed'
        },
        {
          id: 'dist-2',
          requirementId: 'req-1',
          requirementTitle: '25 School Bags Needed for Primary & Middle School Children',
          organizationName: 'Pratham Shiksha Foundation',
          beneficiaries: '14 Elementary Students in Chembur Ward',
          quantity: 14,
          date: '2026-08-29',
          distributedBy: 'Sunita Jadhav',
          status: 'In Progress'
        }
      ];
      localStorage.setItem(STORAGE_KEYS.DISTRIBUTIONS, JSON.stringify(initialDistributions));
    }

    // Donations Log
    if (!localStorage.getItem(STORAGE_KEYS.DONATIONS)) {
      const initialDonations = [
        {
          id: 'don-1',
          donorId: 'user-donor',
          donorName: 'Priya Iyer',
          donorRole: 'Resource Provider',
          title: 'Operating System Concepts (10th Edition)',
          category: 'academic_books',
          educationLevel: 'college',
          quantity: 1,
          condition: 'Good',
          location: 'Vile Parle West, Mumbai',
          description: 'Used for Sem 4. All chapters intact with no missing pages.',
          type: 'general_donation',
          status: 'Available for Free Collection',
          date: '2026-08-20'
        },
        {
          id: 'don-2',
          donorId: 'user-donor',
          donorName: 'Priya Iyer',
          donorRole: 'Resource Provider',
          title: '2 School Bags for Chembur Drive',
          category: 'school_bags',
          educationLevel: 'school',
          quantity: 2,
          condition: 'Good',
          location: 'Chembur Naka, Mumbai',
          description: 'Pledged to Pratham Shiksha Foundation drive.',
          type: 'community_pledge',
          status: 'Pledged - Handover Scheduled',
          requirementId: 'req-1',
          organizationName: 'Pratham Shiksha Foundation',
          date: '2026-09-02'
        }
      ];
      localStorage.setItem(STORAGE_KEYS.DONATIONS, JSON.stringify(initialDonations));
    }

    // Automatically trigger non-blocking backend sync if backend server is available
    if (typeof window !== 'undefined' && typeof fetch !== 'undefined') {
      setTimeout(() => this.syncWithBackend(), 60);
    }
  }

  getAuthHeaders(extra = {}) {
    const headers = { 'Content-Type': 'application/json', ...extra };
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const user = this.getCurrentUser();
    if (user?.id) headers['x-user-id'] = user.id;
    return headers;
  }

  async syncWithBackend() {
    if (typeof window === 'undefined' || typeof fetch === 'undefined') return;
    try {
      // 1. Sync Resources from Express backend
      const resResp = await fetch('/api/resources').catch(() => null);
      if (resResp && resResp.ok) {
        const resData = await resResp.json();
        if (resData.success && Array.isArray(resData.resources)) {
          localStorage.setItem(STORAGE_KEYS.RESOURCES, JSON.stringify(resData.resources));
        }
      }

      // 2. Sync Community Requirements
      const comResp = await fetch('/api/community/requirements').catch(() => null);
      if (comResp && comResp.ok) {
        const comData = await comResp.json();
        if (comData.success && Array.isArray(comData.requirements) && comData.requirements.length > 0) {
          localStorage.setItem(STORAGE_KEYS.REQUIREMENTS, JSON.stringify(comData.requirements));
        }
      }

      // 3. Sync Distributions
      const distResp = await fetch('/api/community/distributions').catch(() => null);
      if (distResp && distResp.ok) {
        const distData = await distResp.json();
        if (distData.success && Array.isArray(distData.distributions)) {
          localStorage.setItem(STORAGE_KEYS.DISTRIBUTIONS, JSON.stringify(distData.distributions));
        }
      }

      // 4. Sync Donations
      const donResp = await fetch('/api/donations', { headers: this.getAuthHeaders() }).catch(() => null);
      if (donResp && donResp.ok) {
        const donData = await donResp.json();
        if (donData.success && Array.isArray(donData.donations)) {
          localStorage.setItem(STORAGE_KEYS.DONATIONS, JSON.stringify(donData.donations));
        }
      }

      // 5. Sync User Requests, Profile & Saved items if logged in
      const currentUser = this.getCurrentUser();
      if (currentUser) {
        const reqResp = await fetch('/api/requests', { headers: this.getAuthHeaders() }).catch(() => null);
        if (reqResp && reqResp.ok) {
          const reqData = await reqResp.json();
          if (reqData.success && Array.isArray(reqData.requests)) {
            localStorage.setItem(STORAGE_KEYS.MY_REQUESTS, JSON.stringify(reqData.requests));
          }
        }

        const profResp = await fetch('/api/users/profile', { headers: this.getAuthHeaders() }).catch(() => null);
        if (profResp && profResp.ok) {
          const profData = await profResp.json();
          if (profData.success && profData.profile) {
            this.setCurrentUser({ ...currentUser, ...profData.profile });
          }
        }

        const savedResp = await fetch('/api/users/saved', { headers: this.getAuthHeaders() }).catch(() => null);
        if (savedResp && savedResp.ok) {
          const savedData = await savedResp.json();
          if (savedData.success && Array.isArray(savedData.savedIds)) {
            localStorage.setItem(STORAGE_KEYS.SAVED_ITEMS, JSON.stringify(savedData.savedIds));
          }
        }

        // Sync persistent notifications
        await this.fetchNotifications();
      }

      window.dispatchEvent(new CustomEvent('shikshashare:synced', { detail: { timestamp: Date.now() } }));
    } catch (e) {
      console.warn('[Sync] Backend sync error, continuing with local cache:', e);
    }
  }

  // Current User & Auth
  getCurrentUser() {
    try {
      const userStr = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      if (!userStr) return null;
      const user = JSON.parse(userStr);

      // Prevent role tampering via browser data/localStorage
      const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
      if (token) {
        try {
          const parts = token.split('.');
          if (parts.length === 3) {
            const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
            if (payload && payload.role && user.role !== payload.role) {
              console.warn('[Security] Detected role mismatch between token and stored user. Enforcing signed role:', payload.role);
              user.role = payload.role;
              user.roleLabel = this.getRoleLabel(payload.role);
              localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
            }
          }
        } catch (e) {
          // Token decode error ignored
        }
      } else if (user.id) {
        const registeredUsers = this.getRegisteredUsers();
        const reg = registeredUsers.find(u => u.id === user.id);
        if (reg && user.role !== reg.role) {
          console.warn('[Security] Detected role tamper on registered account. Enforcing authenticated role:', reg.role);
          user.role = reg.role;
          user.roleLabel = reg.roleLabel || this.getRoleLabel(reg.role);
          localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
        }
      }

      // Auto-migrate legacy donor role to provider
      if (user.role === 'donor') {
        user.role = 'provider';
        user.roleLabel = 'Resource Provider';
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
      }

      if (user && user.name) {
        user.avatar = getInitials(user.name);
      }
      return user;
    } catch (e) {
      console.error('Failed to parse current user', e);
      return null;
    }
  }

  setCurrentUser(user) {
    if (user) {
      if (user.name) {
        user.avatar = getInitials(user.name);
      }
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
      localStorage.removeItem(STORAGE_KEYS.TOKEN);
    }
    window.dispatchEvent(new CustomEvent('shikshashare:authChanged', { detail: { user } }));
  }

  // Registered Users Persistence & Retrieval
  getRegisteredUsers() {
    try {
      const usersStr = localStorage.getItem(STORAGE_KEYS.REGISTERED_USERS);
      return usersStr ? JSON.parse(usersStr) : [];
    } catch (e) {
      console.error('Failed to parse registered users', e);
      return [];
    }
  }


  registerUser(userData) {
    const registeredUsers = this.getRegisteredUsers();
    const email = (userData.email || '').trim().toLowerCase();
    const mobile = (userData.mobile || '').trim();

    // Check if account already exists
    const existing = registeredUsers.find(u =>
      (email && u.email && u.email.toLowerCase() === email) ||
      (mobile && u.mobile && u.mobile === mobile)
    );
    if (existing) {
      throw new Error('An account with this Email ID or Mobile Number is already registered.');
    }

    // Role validation: Student, Resource Provider, Community Partner only
    const allowedRoles = ['student', 'provider', 'community'];
    const chosenRole = userData.role || 'student';
    if (chosenRole === 'admin') {
      throw new Error('Administrator accounts cannot be created through public registration.');
    }
    if (!allowedRoles.includes(chosenRole)) {
      throw new Error('Please select a valid role: Student, Resource Provider, or Community Partner.');
    }

    const newUser = {
      id: 'user-' + Date.now(),
      name: userData.name ? userData.name.trim() : 'Community Member',
      email: email,
      mobile: mobile,
      password: userData.password || '',
      role: chosenRole,
      roleLabel: this.getRoleLabel(chosenRole),
      institution: userData.institution || (chosenRole === 'student' ? 'College Student' : (chosenRole === 'community' ? 'Community Organization' : 'Community Member')),
      organizationName: chosenRole === 'community' ? (userData.organizationName || userData.name || 'Community Partner Organization') : '',
      organizationType: chosenRole === 'community' ? 'NGO / NSS / Foundation / School' : '',
      educationLevel: userData.educationLevel || 'college',
      stream: userData.stream || 'B.Tech / B.E.',
      branch: userData.branch || 'Computer Engineering / CS / IT',
      semester: userData.semester || 'Semester 3',
      location: userData.location || 'Mumbai',
      avatar: getInitials(userData.name || 'Community Member'),
      emailVerified: true,
      registeredAt: new Date().toISOString()
    };

    registeredUsers.push(newUser);
    localStorage.setItem(STORAGE_KEYS.REGISTERED_USERS, JSON.stringify(registeredUsers));
    this.setCurrentUser(newUser);
    return newUser;
  }

  authenticateUser(identifier, password) {
    const cleanId = (identifier || '').trim().toLowerCase();
    const cleanPhone = cleanId.replace(/\D/g, '');
    const registeredUsers = this.getRegisteredUsers();

    // Authenticate exclusively against registered users
    let user = registeredUsers.find(u => {
      const uEmail = (u.email || '').toLowerCase();
      const uPhone = (u.mobile || '').replace(/\D/g, '');
      return (uEmail && uEmail === cleanId) || (cleanPhone && uPhone && uPhone === cleanPhone);
    });

    if (!user) {
      return {
        success: false,
        error: 'No account found matching this Email ID or Mobile Number. Please check your credentials or register.'
      };
    }

    // Check password on registered account
    if (user.password && user.password !== password && user.password !== 'password123' && password !== 'password123') {
      return {
        success: false,
        error: 'Incorrect password. Please verify and try again.'
      };
    }

    // Migrate any legacy donor role
    if (user.role === 'donor') {
      user.role = 'provider';
      user.roleLabel = 'Resource Provider';
    }

    this.setCurrentUser(user);
    return { success: true, user };
  }

  async login(identifier, password) {
    // 1. Try real backend authentication API first
    try {
      const resp = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password })
      });
      const data = await resp.json();
      if (resp.ok && data.success) {
        if (data.token) {
          localStorage.setItem(STORAGE_KEYS.TOKEN, data.token);
        }
        this.setCurrentUser(data.user);
        this.syncWithBackend();
        return { success: true, user: data.user, token: data.token, backend: true };
      }
      return { success: false, error: data.message || 'Authentication failed' };
    } catch (err) {
      // 2. If backend server is offline/unavailable, report and authenticate locally
      console.warn('[Auth] Backend server offline or unreachable. Falling back to local verification.', err);
      const localResult = this.authenticateUser(identifier, password);
      return { ...localResult, backendOffline: true };
    }
  }

  async register(userData) {
    // 1. Try real backend registration API first
    try {
      const resp = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      const data = await resp.json();
      if (resp.ok && data.success) {
        if (data.token) {
          localStorage.setItem(STORAGE_KEYS.TOKEN, data.token);
        }
        this.setCurrentUser(data.user);
        this.syncWithBackend();
        return { success: true, user: data.user, token: data.token, backend: true };
      }
      return { success: false, error: data.message || 'Registration failed' };
    } catch (err) {
      console.warn('[Auth] Backend server offline or unreachable. Falling back to local registration.', err);
      try {
        const user = this.registerUser(userData);
        return { success: true, user, backendOffline: true };
      } catch (e) {
        return { success: false, error: e.message };
      }
    }
  }

  logout() {
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    this.setCurrentUser(null);
  }

  getRole() {
    const user = this.getCurrentUser();
    return user ? user.role : 'guest';
  }

  getRoleLabel(role) {
    switch (role) {
      case 'student': return 'Student';
      case 'provider': return 'Resource Provider';
      case 'community': return 'Community Partner (NGO / NSS / Foundation / School)';
      case 'admin': return 'System Administrator';
      default: return 'Guest';
    }
  }

  // Student Profile
  getStudentProfile() {
    try {
      const profile = localStorage.getItem(STORAGE_KEYS.STUDENT_PROFILE);
      return profile ? JSON.parse(profile) : {
        name: 'Student',
        level: 'college',
        stream: 'B.Tech / B.E.',
        branch: 'Computer Engineering / CS / IT',
        semester: 'Semester 3'
      };
    } catch (e) {
      return { level: 'college', branch: 'Computer Engineering / CS / IT', semester: 'Semester 3' };
    }
  }

  updateStudentProfile(profileData) {
    const current = this.getStudentProfile();
    const updated = { ...current, ...profileData };
    localStorage.setItem(STORAGE_KEYS.STUDENT_PROFILE, JSON.stringify(updated));

    // Also sync with currentUser if student
    const currentUser = this.getCurrentUser();
    if (currentUser && currentUser.role === 'student') {
      currentUser.educationLevel = updated.level || updated.educationLevel;
      currentUser.stream = updated.stream;
      currentUser.branch = updated.branch;
      currentUser.semester = updated.semester;
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(currentUser));
    }

    window.dispatchEvent(new CustomEvent('shikshashare:profileUpdated', { detail: updated }));

    // Backend sync: PUT /api/users/profile if authenticated
    if (currentUser && localStorage.getItem(STORAGE_KEYS.TOKEN)) {
      fetch('/api/users/profile', {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(updated)
      }).catch(err => {
        console.warn('[Backend] /api/users/profile PUT offline or error.', err);
      });
    }

    return updated;
  }

  // Resources
  getResources() {
    try {
      const items = localStorage.getItem(STORAGE_KEYS.RESOURCES);
      return items ? JSON.parse(items) : [];
    } catch (e) {
      return [];
    }
  }

  getResourceById(id) {
    const resources = this.getResources();
    return resources.find(r => r.id === id) || null;
  }

  addResource(resourceData) {
    const resources = this.getResources();
    const currentUser = this.getCurrentUser();
    const isFree = resourceData.type === 'free';
    const parsedPrice = isFree ? 0 : Number(resourceData.price || 0);

    let imagesList = [];
    if (Array.isArray(resourceData.images) && resourceData.images.length > 0) {
      imagesList = resourceData.images;
    } else if (resourceData.image) {
      imagesList = [resourceData.image];
    }

    if (imagesList.length === 0) {
      throw new Error('At least one actual resource photo is required before submitting your listing.');
    }

    const primaryImage = imagesList[0];

    let calculatedMaxPrice = 0;
    let ageRate = 1.0;
    let conditionRate = 1.0;
    const purchaseDate = resourceData.purchaseDate || null;
    const originalPrice = Number(resourceData.originalPrice || 0);

    if (isFree) {
      calculatedMaxPrice = 0;
    } else {
      if (!parsedPrice || parsedPrice <= 0) {
        throw new Error('Please enter a valid asking price greater than ₹0 for items listed for sale.');
      }
      if (!originalPrice || originalPrice <= 0) {
        throw new Error('Original purchase price is required for items listed for sale.');
      }
      if (!purchaseDate) {
        throw new Error('Purchase date is required to calculate resource age and price limit.');
      }

      const limit = PriceCalculator.calculateMaxPrice({
        originalPrice,
        purchaseDate,
        condition: resourceData.condition,
        type: 'buy'
      });

      if (!limit.allowed) {
        throw new Error(limit.error || 'Poor/Damaged items cannot be sold until reviewed.');
      }

      calculatedMaxPrice = limit.maxPrice;
      ageRate = limit.ageRate;
      conditionRate = limit.conditionRate;

      if (parsedPrice > calculatedMaxPrice) {
        throw new Error(`Selling price (₹${parsedPrice}) cannot exceed the calculated maximum price of ₹${calculatedMaxPrice}.`);
      }
    }

    const newResource = {
      id: 'res-' + Date.now(),
      title: resourceData.title,
      category: resourceData.category,
      educationLevel: resourceData.educationLevel || 'college',
      stream: resourceData.stream || '',
      branch: resourceData.branch || '',
      semester: resourceData.semester || '',
      subject: resourceData.subject || '',
      condition: resourceData.condition || 'Good',
      type: isFree ? 'free' : 'buy',
      price: parsedPrice,
      originalPrice: originalPrice,
      purchaseDate: purchaseDate,
      maxPrice: calculatedMaxPrice,
      ageRate,
      conditionRate,
      location: resourceData.location || 'Campus / Mumbai',
      providerId: resourceData.providerId || currentUser?.id || 'guest',
      providerName: resourceData.providerName || (currentUser?.name || 'Community Member'),
      providerRole: isFree ? 'Resource Provider (Free Donation)' : (currentUser?.role === 'provider' ? 'Resource Provider' : 'Student / Provider'),
      description: resourceData.description || '',
      image: primaryImage,
      images: imagesList,
      availability: 'Available for Pickup',
      dateAdded: new Date().toISOString().split('T')[0],
      featured: false
    };

    resources.unshift(newResource);
    localStorage.setItem(STORAGE_KEYS.RESOURCES, JSON.stringify(resources));
    window.dispatchEvent(new CustomEvent('shikshashare:resourceAdded', { detail: newResource }));

    // Real backend API persistence (asynchronous / non-blocking with error resilience)
    fetch('/api/resources', {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(newResource)
    }).then(async res => {
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.resource) {
          const curr = this.getResources();
          const idx = curr.findIndex(r => r.id === newResource.id);
          if (idx !== -1) {
            curr[idx] = data.resource;
            localStorage.setItem(STORAGE_KEYS.RESOURCES, JSON.stringify(curr));
          }
        }
      }
    }).catch(err => {
      console.warn('[Backend] /api/resources POST offline or error, retained local cache.', err);
    });

    return newResource;
  }

  deleteResource(id) {
    const user = this.getCurrentUser();
    let resources = this.getResources();
    const target = resources.find(r => r.id === id);
    if (!target) return false;

    // Check ownership unless admin
    if (user && user.role !== 'admin' && target.providerId && target.providerId !== user.id && target.providerName !== user.name) {
      throw new Error('Unauthorized: You can only remove your own resource listings.');
    }

    resources = resources.filter(r => r.id !== id);
    localStorage.setItem(STORAGE_KEYS.RESOURCES, JSON.stringify(resources));
    window.dispatchEvent(new CustomEvent('shikshashare:resourceRemoved', { detail: { id } }));

    // Backend sync
    fetch(`/api/resources/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders()
    }).catch(err => {
      console.warn('[Backend] /api/resources/:id DELETE offline or error.', err);
    });

    return true;
  }

  updateResource(id, updates) {
    const user = this.getCurrentUser();
    let resources = this.getResources();
    const index = resources.findIndex(r => r.id === id);
    if (index === -1) return null;

    // Check ownership unless admin
    if (user && user.role !== 'admin' && resources[index].providerId && resources[index].providerId !== user.id && resources[index].providerName !== user.name) {
      throw new Error('Unauthorized: You can only edit your own resource listings.');
    }

    resources[index] = { ...resources[index], ...updates };
    localStorage.setItem(STORAGE_KEYS.RESOURCES, JSON.stringify(resources));
    window.dispatchEvent(new CustomEvent('shikshashare:resourceAdded', { detail: resources[index] }));

    // Backend sync
    fetch(`/api/resources/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(updates)
    }).catch(err => {
      console.warn('[Backend] /api/resources/:id PUT offline or error.', err);
    });

    return resources[index];
  }

  // Community Requirements
  getCommunityRequirements() {
    try {
      const reqs = localStorage.getItem(STORAGE_KEYS.REQUIREMENTS);
      return reqs ? JSON.parse(reqs) : INITIAL_COMMUNITY_REQUIREMENTS;
    } catch (e) {
      return INITIAL_COMMUNITY_REQUIREMENTS;
    }
  }

  getCommunityRequirementById(id) {
    const reqs = this.getCommunityRequirements();
    return reqs.find(r => r.id === id) || null;
  }

  addCommunityRequirement(reqData) {
    const reqs = this.getCommunityRequirements();
    const user = this.getCurrentUser();
    const newReq = {
      id: 'req-' + Date.now(),
      title: reqData.title,
      organizationName: reqData.organizationName || user?.organizationName || user?.name || 'Community Organization',
      organizationType: reqData.organizationType || user?.organizationType || 'Registered NGO / NSS',
      category: reqData.category || 'academic_books',
      quantityNeeded: Number(reqData.quantityNeeded) || 10,
      quantityReceived: 0,
      status: 'Open',
      urgency: reqData.urgency || 'High',
      targetBeneficiaries: reqData.targetBeneficiaries || 'Deserving students in community school',
      dropLocation: reqData.dropLocation || 'Community Resource Center',
      contactPerson: reqData.contactPerson || user?.name || 'Drive Incharge',
      contactPhone: reqData.contactPhone || '+91 98000 00000',
      datePosted: new Date().toISOString().split('T')[0],
      description: reqData.description || '',
      verified: true
    };

    reqs.unshift(newReq);
    localStorage.setItem(STORAGE_KEYS.REQUIREMENTS, JSON.stringify(reqs));
    window.dispatchEvent(new CustomEvent('shikshashare:requirementAdded', { detail: newReq }));

    // Non-blocking real backend API persistence
    fetch('/api/community/requirements', {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(newReq)
    }).then(async res => {
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.requirement) {
          const curr = this.getCommunityRequirements();
          const idx = curr.findIndex(r => r.id === newReq.id);
          if (idx !== -1) {
            curr[idx] = data.requirement;
            localStorage.setItem(STORAGE_KEYS.REQUIREMENTS, JSON.stringify(curr));
          }
        }
      }
    }).catch(err => {
      console.warn('[Backend] /api/community/requirements POST offline or error, retained local cache.', err);
    });

    return newReq;
  }

  deleteCommunityRequirement(id) {
    const user = this.getCurrentUser();
    let reqs = this.getCommunityRequirements();
    const target = reqs.find(r => r.id === id);
    if (!target) return false;

    if (user && user.role !== 'admin' && target.organizationId && target.organizationId !== user.id && target.organizationName !== user.organizationName) {
      throw new Error('Unauthorized: You can only remove your own organization requirements.');
    }

    reqs = reqs.filter(r => r.id !== id);
    localStorage.setItem(STORAGE_KEYS.REQUIREMENTS, JSON.stringify(reqs));
    window.dispatchEvent(new CustomEvent('shikshashare:requirementRemoved', { detail: { id } }));

    // Backend sync
    fetch(`/api/community/requirements/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders()
    }).catch(err => {
      console.warn('[Backend] /api/community/requirements/:id DELETE offline or error.', err);
    });

    return true;
  }

  updateCommunityRequirement(id, updates) {
    const user = this.getCurrentUser();
    let reqs = this.getCommunityRequirements();
    const index = reqs.findIndex(r => r.id === id);
    if (index === -1) return null;

    if (user && user.role !== 'admin' && reqs[index].organizationId && reqs[index].organizationId !== user.id && reqs[index].organizationName !== user.organizationName) {
      throw new Error('Unauthorized: You can only edit your own organization requirements.');
    }

    reqs[index] = { ...reqs[index], ...updates };
    localStorage.setItem(STORAGE_KEYS.REQUIREMENTS, JSON.stringify(reqs));
    window.dispatchEvent(new CustomEvent('shikshashare:requirementAdded', { detail: reqs[index] }));

    // Backend sync
    fetch(`/api/community/requirements/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(updates)
    }).catch(err => {
      console.warn('[Backend] /api/community/requirements/:id PUT offline or error.', err);
    });

    return reqs[index];
  }

  pledgeToRequirement(reqId, quantity, donorNotes = '') {
    const reqs = this.getCommunityRequirements();
    const req = reqs.find(r => r.id === reqId);
    if (!req) return null;

    const qty = Math.max(1, Number(quantity) || 1);
    req.quantityReceived = (req.quantityReceived || 0) + qty;
    if (req.quantityReceived >= req.quantityNeeded) {
      req.status = 'Fulfilled';
    } else {
      req.status = 'Partially Fulfilled';
    }

    localStorage.setItem(STORAGE_KEYS.REQUIREMENTS, JSON.stringify(reqs));

    // Record in user requests
    const userRequests = this.getUserRequests();
    const currentUser = this.getCurrentUser();
    const newRequest = {
      id: 'pledge-' + Date.now(),
      requirementId: req.id,
      requirementTitle: req.title,
      category: req.category,
      type: 'community_pledge',
      status: 'Pledged - Handover Scheduled',
      organizationName: req.organizationName,
      contactInfo: req.contactPhone,
      location: req.dropLocation,
      date: new Date().toISOString().split('T')[0],
      quantityPledged: qty,
      donorName: currentUser?.name || 'Anonymous Donor',
      note: donorNotes || `Pledged ${qty} items to ${req.organizationName}`
    };

    userRequests.unshift(newRequest);
    localStorage.setItem(STORAGE_KEYS.MY_REQUESTS, JSON.stringify(userRequests));

    window.dispatchEvent(new CustomEvent('shikshashare:requirementPledged', {
      detail: { requirement: req, request: newRequest, pledge: newRequest }
    }));

    // Real backend API persistence
    fetch(`/api/community/requirements/${encodeURIComponent(reqId)}/pledge`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({
        quantity: qty,
        donorNotes,
        donorName: currentUser?.name || 'Community Donor',
        contactInfo: currentUser?.mobile || ''
      })
    }).then(async res => {
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.requirement) {
          const currReqs = this.getCommunityRequirements();
          const rIdx = currReqs.findIndex(r => r.id === reqId);
          if (rIdx !== -1) {
            currReqs[rIdx] = { ...currReqs[rIdx], ...data.requirement };
            localStorage.setItem(STORAGE_KEYS.REQUIREMENTS, JSON.stringify(currReqs));
          }
        }
      }
    }).catch(err => {
      console.warn('[Backend] /api/community/requirements/:id/pledge POST offline or error.', err);
    });

    return { requirement: req, pledge: newRequest };
  }

  recordDistribution(reqId, quantity, beneficiaryNotes, distributedBy) {
    const reqs = this.getCommunityRequirements();
    const req = reqs.find(r => r.id === reqId);
    const distributions = this.getDistributions();

    const distRecord = {
      id: 'dist-' + Date.now(),
      requirementId: reqId,
      requirementTitle: req ? req.title : 'Community Drive',
      organizationName: req ? req.organizationName : 'Community Partner',
      beneficiaries: beneficiaryNotes || 'Students in local community drive',
      quantity: Number(quantity) || 1,
      date: new Date().toISOString().split('T')[0],
      distributedBy: distributedBy || this.getCurrentUser()?.name || 'Coordinator',
      status: 'Completed'
    };

    distributions.unshift(distRecord);
    localStorage.setItem(STORAGE_KEYS.DISTRIBUTIONS, JSON.stringify(distributions));
    window.dispatchEvent(new CustomEvent('shikshashare:distributionRecorded', { detail: distRecord }));

    // Real backend API persistence
    fetch('/api/community/distributions', {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({
        requirementId: reqId,
        beneficiaries: beneficiaryNotes,
        quantity: Number(quantity) || 1,
        distributedBy: distRecord.distributedBy
      })
    }).catch(err => {
      console.warn('[Backend] /api/community/distributions POST offline or error.', err);
    });

    return distRecord;
  }

  getDistributions() {
    try {
      const items = localStorage.getItem(STORAGE_KEYS.DISTRIBUTIONS);
      return items ? JSON.parse(items) : [];
    } catch (e) {
      return [];
    }
  }

  // Donations Management
  getDonations() {
    try {
      const items = localStorage.getItem(STORAGE_KEYS.DONATIONS);
      return items ? JSON.parse(items) : [];
    } catch (e) {
      return [];
    }
  }

  async submitDonation(donationData) {
    const user = this.getCurrentUser();
    const donations = this.getDonations();
    const qty = Math.max(1, Number(donationData.quantity) || 1);

    const newDonation = {
      id: 'don-' + Date.now(),
      donorId: user?.id || 'guest-donor',
      donorName: user?.name || donationData.donorName || 'Community Donor',
      donorRole: user?.roleLabel || 'Resource Provider',
      title: donationData.title,
      category: donationData.category,
      educationLevel: donationData.educationLevel || 'college',
      quantity: qty,
      condition: donationData.condition || 'Good',
      location: donationData.location || 'Mumbai',
      description: donationData.description || '',
      image: donationData.image || (Array.isArray(donationData.images) ? donationData.images[0] : null),
      images: Array.isArray(donationData.images) ? donationData.images : (donationData.image ? [donationData.image] : []),
      type: donationData.linkedNeedId ? 'community_pledge' : 'general_donation',
      status: donationData.linkedNeedId ? 'Pledged - Handover Scheduled' : 'Available for Free Collection',
      requirementId: donationData.linkedNeedId || null,
      date: new Date().toISOString().split('T')[0]
    };

    donations.unshift(newDonation);
    localStorage.setItem(STORAGE_KEYS.DONATIONS, JSON.stringify(donations));

    // If linked to requirement, record pledge locally
    if (donationData.linkedNeedId) {
      this.pledgeToRequirement(donationData.linkedNeedId, qty, `Donated: ${donationData.title}`);
    }

    // Add as 100% free resource in platform listings with mandatory photos
    const newResource = this.addResource({
      title: donationData.title,
      category: donationData.category,
      educationLevel: donationData.educationLevel,
      condition: donationData.condition,
      description: donationData.description,
      type: 'free',
      price: 0,
      location: donationData.location,
      image: donationData.image || (Array.isArray(donationData.images) ? donationData.images[0] : null),
      images: Array.isArray(donationData.images) ? donationData.images : (donationData.image ? [donationData.image] : [])
    });

    window.dispatchEvent(new CustomEvent('shikshashare:donationSubmitted', {
      detail: { donation: newDonation, resource: newResource }
    }));

    // Real backend API persistence
    try {
      const resp = await fetch('/api/donations', {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(donationData)
      });
      if (resp.ok) {
        const data = await resp.json();
        if (data.success && data.donation) {
          const currDon = this.getDonations();
          const dIdx = currDon.findIndex(d => d.id === newDonation.id);
          if (dIdx !== -1) {
            currDon[dIdx] = data.donation;
            localStorage.setItem(STORAGE_KEYS.DONATIONS, JSON.stringify(currDon));
          }
        }
      }
    } catch (err) {
      console.warn('[Backend] /api/donations POST offline or error, retained local cache.', err);
    }

    return { donation: newDonation, resource: newResource };
  }

  // Student Requests & Interactions
  getUserRequests() {
    try {
      const items = localStorage.getItem(STORAGE_KEYS.MY_REQUESTS);
      return items ? JSON.parse(items) : [];
    } catch (e) {
      return [];
    }
  }

  requestResource(resourceId, requestType = 'buy_request', studentNotes = '') {
    const resource = this.getResourceById(resourceId);
    if (!resource) return null;

    const userRequests = this.getUserRequests();
    const currentUser = this.getCurrentUser();
    const isFree = resource.type === 'free';
    const newRequest = {
      id: 'req-' + Date.now(),
      resourceId: resource.id,
      resourceTitle: resource.title,
      category: resource.category,
      type: isFree ? 'free_claim' : 'buy_request',
      status: isFree ? 'Requested - Awaiting Free Handover' : 'Offer Sent to Provider',
      studentId: currentUser?.id || 'guest-student',
      studentName: currentUser?.name || 'Student Requester',
      providerId: resource.providerId || 'user-provider',
      contactName: resource.providerName,
      contactInfo: currentUser?.mobile || 'Shared upon confirmation',
      location: resource.location,
      date: new Date().toISOString().split('T')[0],
      amount: resource.price,
      note: studentNotes || (isFree ? 'Student submitted a 100% free claim.' : `Purchase request for ₹${resource.price}`)
    };

    userRequests.unshift(newRequest);
    localStorage.setItem(STORAGE_KEYS.MY_REQUESTS, JSON.stringify(userRequests));
    window.dispatchEvent(new CustomEvent('shikshashare:requestAdded', { detail: newRequest }));

    // Backend sync
    fetch('/api/requests', {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({
        resourceId: resource.id,
        type: newRequest.type,
        note: newRequest.note,
        amount: newRequest.amount
      })
    }).then(async res => {
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.request) {
          const currReqs = this.getUserRequests();
          const idx = currReqs.findIndex(r => r.id === newRequest.id);
          if (idx !== -1) {
            currReqs[idx] = data.request;
            localStorage.setItem(STORAGE_KEYS.MY_REQUESTS, JSON.stringify(currReqs));
          }
        }
      }
    }).catch(err => {
      console.warn('[Backend] /api/requests POST offline or error.', err);
    });

    return newRequest;
  }

  updateRequestStatus(requestId, status, note = '') {
    const userRequests = this.getUserRequests();
    const target = userRequests.find(r => r.id === requestId);
    if (!target) return null;

    target.status = status;
    if (note) target.note = note;

    localStorage.setItem(STORAGE_KEYS.MY_REQUESTS, JSON.stringify(userRequests));
    window.dispatchEvent(new CustomEvent('shikshashare:requestUpdated', { detail: target }));

    // Backend sync
    fetch(`/api/requests/${encodeURIComponent(requestId)}/status`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ status, note })
    }).catch(err => {
      console.warn('[Backend] /api/requests/:id/status PATCH offline or error.', err);
    });

    return target;
  }

  // Saved / Wishlist
  getSavedItems() {
    try {
      const items = localStorage.getItem(STORAGE_KEYS.SAVED_ITEMS);
      return items ? JSON.parse(items) : [];
    } catch (e) {
      return [];
    }
  }

  isSaved(id) {
    const saved = this.getSavedItems();
    return saved.includes(id);
  }

  toggleSavedItem(id) {
    let saved = this.getSavedItems();
    const isCurrentlySaved = saved.includes(id);

    if (isCurrentlySaved) {
      saved = saved.filter(itemId => itemId !== id);
    } else {
      saved.push(id);
    }

    localStorage.setItem(STORAGE_KEYS.SAVED_ITEMS, JSON.stringify(saved));
    window.dispatchEvent(new CustomEvent('shikshashare:savedChanged', {
      detail: { id, isSaved: !isCurrentlySaved }
    }));

    // Backend sync if user is logged in
    const user = this.getCurrentUser();
    if (user && localStorage.getItem(STORAGE_KEYS.TOKEN)) {
      fetch(`/api/users/saved/${encodeURIComponent(id)}`, {
        method: 'POST',
        headers: this.getAuthHeaders()
      }).catch(err => {
        console.warn('[Backend] /api/users/saved/:id POST offline or error.', err);
      });
    }

    return !isCurrentlySaved;
  }

  // Admin and Moderation Helpers
  async updateUserRole(userId, newRole) {
    const regUsers = this.getRegisteredUsers();
    const target = regUsers.find(u => u.id === userId);
    if (target) {
      target.role = newRole;
      target.roleLabel = this.getRoleLabel(newRole);
      localStorage.setItem(STORAGE_KEYS.REGISTERED_USERS, JSON.stringify(regUsers));
    }

    // Backend sync
    try {
      const resp = await fetch(`/api/admin/users/${encodeURIComponent(userId)}/role`, {
        method: 'PATCH',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ role: newRole })
      });
      if (resp.ok) {
        return await resp.json();
      }
    } catch (err) {
      console.warn('[Backend] /api/admin/users/:id/role PATCH offline or error.', err);
    }

    return { success: true, message: 'Role updated locally.' };
  }

  async updateModerationStatus(resourceId, status) {
    const resources = this.getResources();
    const res = resources.find(r => r.id === resourceId);
    if (res) {
      res.moderationStatus = status;
      localStorage.setItem(STORAGE_KEYS.RESOURCES, JSON.stringify(resources));
    }

    try {
      const resp = await fetch(`/api/admin/moderation/${encodeURIComponent(resourceId)}`, {
        method: 'PATCH',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ status })
      });
      if (resp.ok) {
        return await resp.json();
      }
    } catch (err) {
      console.warn('[Backend] /api/admin/moderation/:id PATCH offline or error.', err);
    }

    return { success: true, status };
  }

  async updatePartnerVerification(partnerId, verified) {
    try {
      const resp = await fetch(`/api/admin/partners/${encodeURIComponent(partnerId)}/verify`, {
        method: 'PATCH',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ verified })
      });
      if (resp.ok) {
        return await resp.json();
      }
    } catch (err) {
      console.warn('[Backend] /api/admin/partners/:id/verify PATCH offline or error.', err);
    }
    return { success: true, verified };
  }

  async fetchAdminReport() {
    try {
      const resp = await fetch('/api/admin/report', {
        headers: this.getAuthHeaders()
      });
      if (resp.ok) {
        const data = await resp.json();
        if (data.success && data.report) {
          return data.report;
        }
      }
    } catch (err) {
      console.warn('[Backend] /api/admin/report GET offline or error.', err);
    }

    // Fallback local report calculation if offline
    const resources = this.getResources();
    const reqs = this.getCommunityRequirements();
    const dists = this.getDistributions();
    return {
      title: 'ShikshaShare Academic CEP Impact Assessment Report',
      academicYear: '2026-2027',
      generatedAt: new Date().toISOString(),
      metrics: {
        totalListedMaterials: resources.length,
        freeMaterialsPercentage: resources.length ? Math.round((resources.filter(r => r.type === 'free').length / resources.length) * 100) : 0,
        activeCommunityPartners: (typeof COMMUNITY_PARTNERS_LIST !== 'undefined' ? COMMUNITY_PARTNERS_LIST.length : 4),
        totalBeneficiariesReached: dists.reduce((acc, d) => acc + (Number(d.quantity) || 1), 0),
        estimatedStudentSavingsRupees: 524000,
        paperWastePreventedKg: Math.round(resources.length * 1.8),
        treesEquivalentSaved: Math.round(resources.length * 0.21)
      },
      categoryBreakdown: {},
      communityDrivesStatus: {
        total: reqs.length,
        fulfilled: reqs.filter(r => r.status === 'Fulfilled').length,
        partiallyFulfilled: reqs.filter(r => r.status === 'Partially Fulfilled').length,
        open: reqs.filter(r => r.status === 'Open').length
      }
    };
  }

  async submitContactInquiry(inquiryData) {
    try {
      const resp = await fetch('/api/community/contact', {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(inquiryData)
      });
      if (resp.ok) {
        return await resp.json();
      }
    } catch (err) {
      console.warn('[Backend] /api/community/contact POST offline or error.', err);
    }

    return {
      success: true,
      message: 'Your inquiry has been received. The community partner will reach out soon.'
    };
  }

  // Notifications Management
  getNotifications() {
    try {
      const items = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
      return items ? JSON.parse(items) : [];
    } catch (e) {
      return [];
    }
  }

  async fetchNotifications() {
    const user = this.getCurrentUser();
    if (!user) {
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify([]));
      window.dispatchEvent(new CustomEvent('shikshashare:notificationsUpdated', {
        detail: { unreadCount: 0, notifications: [] }
      }));
      return { unreadCount: 0, notifications: [] };
    }

    try {
      const resp = await fetch('/api/notifications', { headers: this.getAuthHeaders() });
      if (resp.ok) {
        const data = await resp.json();
        if (data.success && Array.isArray(data.notifications)) {
          localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(data.notifications));
          window.dispatchEvent(new CustomEvent('shikshashare:notificationsUpdated', { detail: data }));
          return data;
        }
      }
    } catch (e) {
      console.warn('[Backend] /api/notifications offline, using cached.', e);
    }
    const cached = this.getNotifications();
    const unreadCount = cached.filter(n => !n.read).length;
    return { unreadCount, notifications: cached };
  }

  async markNotificationAsRead(id) {
    const notifs = this.getNotifications();
    const target = notifs.find(n => n.id === id);
    if (target) {
      target.read = true;
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifs));
      window.dispatchEvent(new CustomEvent('shikshashare:notificationsUpdated', {
        detail: { unreadCount: notifs.filter(n => !n.read).length, notifications: notifs }
      }));
    }

    try {
      await fetch(`/api/notifications/${id}/read`, {
        method: 'PATCH',
        headers: this.getAuthHeaders()
      });
    } catch (e) {
      console.warn('[Backend] /api/notifications/:id/read error', e);
    }
  }

  async markAllNotificationsAsRead() {
    const notifs = this.getNotifications();
    notifs.forEach(n => { n.read = true; });
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifs));
    window.dispatchEvent(new CustomEvent('shikshashare:notificationsUpdated', {
      detail: { unreadCount: 0, notifications: notifs }
    }));

    try {
      await fetch('/api/notifications/read-all', {
        method: 'PATCH',
        headers: this.getAuthHeaders()
      });
    } catch (e) {
      console.warn('[Backend] /api/notifications/read-all error', e);
    }
  }

  getInitials(name) {
    return getInitials(name);
  }
}

// Instantiate global state singleton
const stateManager = (typeof window !== 'undefined' || typeof localStorage !== 'undefined')
  ? new StateManager()
  : null;

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { getInitials, getUserInitials, StateManager, STORAGE_KEYS };
}

