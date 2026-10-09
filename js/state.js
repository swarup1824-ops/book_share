// ShikshaShare State Management & Persistence Layer
// "Connecting Students, Resources & Community"

const STORAGE_KEYS = {
  CURRENT_USER: 'shikshashare_current_user',
  STUDENT_PROFILE: 'shikshashare_student_profile',
  RESOURCES: 'shikshashare_resources',
  REQUIREMENTS: 'shikshashare_community_requirements',
  MY_REQUESTS: 'shikshashare_my_requests',
  SAVED_ITEMS: 'shikshashare_saved_items',
  DISTRIBUTIONS: 'shikshashare_distributions',
  DONATIONS: 'shikshashare_donations'
};

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

    // Seed Resources
    if (!localStorage.getItem(STORAGE_KEYS.RESOURCES)) {
      localStorage.setItem(STORAGE_KEYS.RESOURCES, JSON.stringify(INITIAL_RESOURCES));
    }

    // Seed Community Requirements
    if (!localStorage.getItem(STORAGE_KEYS.REQUIREMENTS)) {
      localStorage.setItem(STORAGE_KEYS.REQUIREMENTS, JSON.stringify(INITIAL_COMMUNITY_REQUIREMENTS));
    }

    // Seed My Requests
    if (!localStorage.getItem(STORAGE_KEYS.MY_REQUESTS)) {
      const initialUserRequests = [
        {
          id: 'user-req-1',
          resourceId: 'res-free-1',
          resourceTitle: 'Operating System Concepts (Silberschatz Dinosaur Book) - 10th Edition',
          category: 'academic_books',
          type: 'free_claim',
          status: 'Accepted - Ready for Pickup',
          contactName: 'Priya Iyer (Donor)',
          contactInfo: '+91 98111 54321',
          location: 'Vile Parle West, Mumbai',
          date: '2026-09-03',
          amount: 0,
          note: 'Donor accepted your free claim! Meet at Vile Parle station West entrance at 4:30 PM Saturday.'
        },
        {
          id: 'user-req-2',
          resourceId: 'res-sale-1',
          resourceTitle: 'Data Structures and Algorithms in C++ (4th Edition)',
          category: 'academic_books',
          type: 'buy_request',
          status: 'Pending Provider Response',
          contactName: 'Aarav Sharma (Provider)',
          contactInfo: '+91 98200 12345',
          location: 'Campus Library Gate / Andheri, Mumbai',
          date: '2026-09-04',
          amount: 320,
          note: 'You offered to purchase for ₹320. Waiting for provider confirmation.'
        },
        {
          id: 'user-req-3',
          requirementId: 'req-1',
          requirementTitle: '25 School Bags Needed for Primary & Middle School Children',
          category: 'school_bags',
          type: 'community_pledge',
          status: 'Pledged - Handover Scheduled',
          organizationName: 'Pratham Shiksha Foundation',
          contactInfo: '+91 98201 44521',
          location: 'Pratham Community Centre, Chembur Naka, Mumbai',
          date: '2026-09-02',
          quantityPledged: 2,
          note: 'You pledged 2 school bags for the Chembur primary student drive.'
        }
      ];
      localStorage.setItem(STORAGE_KEYS.MY_REQUESTS, JSON.stringify(initialUserRequests));
    }

    // Saved Items
    if (!localStorage.getItem(STORAGE_KEYS.SAVED_ITEMS)) {
      localStorage.setItem(STORAGE_KEYS.SAVED_ITEMS, JSON.stringify(['res-sale-2', 'res-free-4']));
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
  }

  // Current User & Auth
  getCurrentUser() {
    try {
      const userStr = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      return userStr ? JSON.parse(userStr) : null;
    } catch (e) {
      console.error('Failed to parse current user', e);
      return null;
    }
  }

  setCurrentUser(user) {
    if (user) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    }
    window.dispatchEvent(new CustomEvent('shikshashare:authChanged', { detail: { user } }));
  }

  loginAsDemoUser(userId) {
    const found = DEMO_USERS.find(u => u.id === userId);
    if (found) {
      this.setCurrentUser(found);
      return found;
    }
    return null;
  }

  registerUser(userData) {
    const newUser = {
      id: 'user-' + Date.now(),
      name: userData.name || 'New Community Member',
      email: userData.email || '',
      role: userData.role || 'student',
      roleLabel: this.getRoleLabel(userData.role || 'student'),
      institution: userData.institution || userData.organizationName || 'Community Member',
      educationLevel: userData.educationLevel || 'college',
      stream: userData.stream || '',
      branch: userData.branch || '',
      semester: userData.semester || '',
      location: userData.location || 'Mumbai',
      avatar: (userData.name || 'U').substring(0, 2).toUpperCase()
    };
    this.setCurrentUser(newUser);
    return newUser;
  }

  logout() {
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
      case 'donor': return 'Resource Donor';
      case 'community': return 'Community Partner';
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
      currentUser.educationLevel = updated.level;
      currentUser.stream = updated.stream;
      currentUser.branch = updated.branch;
      currentUser.semester = updated.semester;
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(currentUser));
    }

    window.dispatchEvent(new CustomEvent('shikshashare:profileUpdated', { detail: updated }));
    return updated;
  }

  // Resources
  getResources() {
    try {
      const items = localStorage.getItem(STORAGE_KEYS.RESOURCES);
      return items ? JSON.parse(items) : INITIAL_RESOURCES;
    } catch (e) {
      return INITIAL_RESOURCES;
    }
  }

  getResourceById(id) {
    const resources = this.getResources();
    return resources.find(r => r.id === id) || null;
  }

  addResource(resourceData) {
    const resources = this.getResources();
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
      type: resourceData.type || 'buy',
      price: resourceData.type === 'free' ? 0 : Number(resourceData.price || 0),
      originalPrice: Number(resourceData.originalPrice || 0),
      location: resourceData.location || 'Campus / Mumbai',
      providerName: resourceData.providerName || (this.getCurrentUser()?.name || 'Community Member'),
      providerRole: resourceData.type === 'free' ? 'Donor' : 'Resource Provider',
      description: resourceData.description || '',
      image: resourceData.image || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80',
      availability: 'Available for Pickup',
      dateAdded: new Date().toISOString().split('T')[0],
      featured: false
    };

    resources.unshift(newResource);
    localStorage.setItem(STORAGE_KEYS.RESOURCES, JSON.stringify(resources));
    window.dispatchEvent(new CustomEvent('shikshashare:resourceAdded', { detail: newResource }));
    return newResource;
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
    return newReq;
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
      status: 'Pledged - Pending Handover',
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

    return { requirement: req, pledge: newRequest };
  }

  recordDistribution(reqId, quantity, beneficiaryNotes) {
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
      distributedBy: this.getCurrentUser()?.name || 'Coordinator',
      status: 'Completed'
    };

    distributions.unshift(distRecord);
    localStorage.setItem(STORAGE_KEYS.DISTRIBUTIONS, JSON.stringify(distributions));
    window.dispatchEvent(new CustomEvent('shikshashare:distributionRecorded', { detail: distRecord }));
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
    const isFree = resource.type === 'free';
    const newRequest = {
      id: 'req-' + Date.now(),
      resourceId: resource.id,
      resourceTitle: resource.title,
      category: resource.category,
      type: isFree ? 'free_claim' : 'buy_request',
      status: isFree ? 'Requested - Awaiting Donor Handover' : 'Offer Sent to Provider',
      contactName: resource.providerName,
      contactInfo: 'Shared upon confirmation',
      location: resource.location,
      date: new Date().toISOString().split('T')[0],
      amount: resource.price,
      note: studentNotes || (isFree ? 'Student submitted a 100% free claim.' : `Purchase request for ₹${resource.price}`)
    };

    userRequests.unshift(newRequest);
    localStorage.setItem(STORAGE_KEYS.MY_REQUESTS, JSON.stringify(userRequests));
    window.dispatchEvent(new CustomEvent('shikshashare:requestAdded', { detail: newRequest }));
    return newRequest;
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
    return !isCurrentlySaved;
  }
}

// Instantiate global state singleton
const stateManager = new StateManager();
