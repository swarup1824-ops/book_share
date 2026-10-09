// ShikshaShare Main Application Controller
// "Connecting Students, Resources & Community"

document.addEventListener('DOMContentLoaded', () => {
  // --- View References ---
  const views = {
    home: document.getElementById('view-home'),
    resources: document.getElementById('view-resources'),
    community: document.getElementById('view-community'),
    donate: document.getElementById('view-donate'),
    about: document.getElementById('view-about'),
    dashboard: document.getElementById('view-dashboard')
  };

  const navLinks = document.querySelectorAll('.site-header .nav-link');
  const mobileNavItems = document.querySelectorAll('.mobile-bottom-item');

  // --- Search & Filter Elements (Resources Page) ---
  const resourceSearchInput = document.getElementById('resourceSearchInput');
  const filterEducationLevel = document.getElementById('filterEducationLevel');
  const filterStreamGroup = document.getElementById('filterStreamGroup');
  const filterStream = document.getElementById('filterStream');
  const filterBranchGroup = document.getElementById('filterBranchGroup');
  const filterBranch = document.getElementById('filterBranch');
  const filterSemesterGroup = document.getElementById('filterSemesterGroup');
  const filterSemester = document.getElementById('filterSemester');
  const filterClassGroup = document.getElementById('filterClassGroup');
  const filterClass = document.getElementById('filterClass');
  const filterCategory = document.getElementById('filterCategory');
  const filterCondition = document.getElementById('filterCondition');
  const resultsCountLabel = document.getElementById('resultsCountLabel');
  const resourcesGrid = document.getElementById('resourcesGrid');
  const resourcesEmptyBox = document.getElementById('resourcesEmptyBox');

  // Active filter state
  let activeFilters = {
    search: '',
    level: 'all',
    stream: 'all',
    branch: 'all',
    semester: 'all',
    classNum: 'all',
    category: 'all',
    type: 'all', // 'all', 'free', 'buy'
    condition: 'all'
  };

  // --- Initialize App ---
  initPopulateDropdowns();
  initNavigation();
  initAuth();
  initFilterControls();
  initModals();
  initDonationForm();

  // Initial renders
  renderAuthUI();
  renderHome();
  renderResources();
  renderCommunity();
  renderDashboard();

  // Global event listeners for state sync
  window.addEventListener('shikshashare:authChanged', () => {
    renderAuthUI();
    renderDashboard();
    renderHome();
    renderResources();
  });

  window.addEventListener('shikshashare:resourceAdded', () => {
    renderHome();
    renderResources();
    renderDashboard();
    showToast('Resource listed successfully on ShikshaShare!', 'success');
  });

  window.addEventListener('shikshashare:requirementAdded', () => {
    renderHome();
    renderCommunity();
    renderDashboard();
    showToast('Community requirement published successfully!', 'success');
  });

  window.addEventListener('shikshashare:requirementPledged', (e) => {
    renderHome();
    renderCommunity();
    renderDashboard();
    const qty = e.detail?.pledge?.quantityPledged || e.detail?.request?.quantityPledged || 1;
    const org = e.detail?.requirement?.organizationName || 'Community Partner';
    showToast(`Thank you! Pledged ${qty} item(s) to ${org}.`, 'success');
  });

  window.addEventListener('shikshashare:distributionRecorded', () => {
    renderCommunity();
    renderDashboard();
  });

  window.addEventListener('shikshashare:requestAdded', () => {
    renderDashboard();
    showToast('Resource request sent to provider/donor!', 'success');
  });

  window.addEventListener('shikshashare:profileUpdated', () => {
    renderDashboard();
    renderResources();
    showToast('Curriculum profile preferences updated!', 'success');
  });

  window.addEventListener('shikshashare:savedChanged', () => {
    renderResources();
    renderDashboard();
  });


  // =========================================================================
  // 1. Navigation & Routing
  // =========================================================================
  function switchView(viewName) {
    if (!views[viewName]) return;

    // Toggle active view container
    Object.keys(views).forEach(k => {
      views[k].classList.remove('active-view');
    });
    views[viewName].classList.add('active-view');

    // Update desktop nav
    navLinks.forEach(link => {
      if (link.getAttribute('data-view') === viewName) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });

    // Update mobile bottom nav
    mobileNavItems.forEach(item => {
      if (item.getAttribute('data-view') === viewName) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    // Rerender active view context
    if (viewName === 'home') renderHome();
    if (viewName === 'resources') renderResources();
    if (viewName === 'community') renderCommunity();
    if (viewName === 'dashboard') renderDashboard();

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function initNavigation() {
    // Brand Logo -> Home
    const brandLogoHome = document.getElementById('brandLogoHome');
    if (brandLogoHome) brandLogoHome.addEventListener('click', () => switchView('home'));

    // Desktop Nav Items
    navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        const targetView = e.currentTarget.getAttribute('data-view');
        switchView(targetView);
      });
    });

    // Mobile Nav Items
    mobileNavItems.forEach(item => {
      item.addEventListener('click', (e) => {
        const targetView = e.currentTarget.getAttribute('data-view');
        switchView(targetView);
      });
    });

    // Mobile nav toggle
    const mobileNavToggle = document.getElementById('mobileNavToggle');
    if (mobileNavToggle) {
      mobileNavToggle.addEventListener('click', () => {
        const navMenu = document.querySelector('.nav-menu');
        if (navMenu) {
          if (navMenu.style.display === 'flex') {
            navMenu.style.display = '';
          } else {
            navMenu.style.display = 'flex';
            navMenu.style.flexDirection = 'column';
            navMenu.style.position = 'absolute';
            navMenu.style.top = '72px';
            navMenu.style.left = '0';
            navMenu.style.right = '0';
            navMenu.style.background = '#ffffff';
            navMenu.style.padding = '16px';
            navMenu.style.borderBottom = '1px solid var(--border-color)';
            navMenu.style.boxShadow = 'var(--shadow-md)';
          }
        }
      });
    }

    // Hero buttons
    const heroFindBtn = document.getElementById('heroFindBtn');
    if (heroFindBtn) heroFindBtn.addEventListener('click', () => switchView('resources'));

    const heroDonateBtn = document.getElementById('heroDonateBtn');
    if (heroDonateBtn) heroDonateBtn.addEventListener('click', () => switchView('donate'));

    // User Intent 4-Card Buttons
    const intentNeedBtn = document.getElementById('intentNeedBtn');
    if (intentNeedBtn) {
      intentNeedBtn.addEventListener('click', () => {
        activeFilters.type = 'all';
        updateFilterTypePills('all');
        switchView('resources');
      });
    }

    const intentHaveBtn = document.getElementById('intentHaveBtn');
    if (intentHaveBtn) {
      intentHaveBtn.addEventListener('click', () => {
        const user = stateManager.getCurrentUser();
        if (!user) {
          openModal('authModal');
          return;
        }
        if (user.role === 'provider' || user.role === 'student') {
          openModal('providerAddListingModal');
        } else if (user.role === 'donor') {
          switchView('donate');
        } else {
          openModal('providerAddListingModal');
        }
      });
    }

    const intentDonateBtn = document.getElementById('intentDonateBtn');
    if (intentDonateBtn) intentDonateBtn.addEventListener('click', () => switchView('donate'));

    const intentCommunityBtn = document.getElementById('intentCommunityBtn');
    if (intentCommunityBtn) intentCommunityBtn.addEventListener('click', () => switchView('community'));

    // Spotlight CTAs
    const viewAllCommunityNeedsBtn = document.getElementById('viewAllCommunityNeedsBtn');
    if (viewAllCommunityNeedsBtn) viewAllCommunityNeedsBtn.addEventListener('click', () => switchView('community'));

    const viewAllResourcesBtn = document.getElementById('viewAllResourcesBtn');
    if (viewAllResourcesBtn) viewAllResourcesBtn.addEventListener('click', () => switchView('resources'));

    // Community post requirement button
    const communityPostReqBtn = document.getElementById('communityPostReqBtn');
    if (communityPostReqBtn) {
      communityPostReqBtn.addEventListener('click', () => {
        openModal('postRequirementModal');
      });
    }

    // Footer links
    document.querySelectorAll('[data-footer-view]').forEach(a => {
      a.addEventListener('click', (e) => {
        e.preventDefault();
        const targetView = a.getAttribute('data-footer-view');
        const level = a.getAttribute('data-footer-level');
        const type = a.getAttribute('data-footer-type');

        if (level) {
          activeFilters.level = level;
          if (filterEducationLevel) filterEducationLevel.value = level;
          updateProgressiveFilterVisibility(level);
        }
        if (type) {
          activeFilters.type = type;
          updateFilterTypePills(type);
        }

        switchView(targetView);
      });
    });

    // Footer Admin Portal link
    const footerAdminPortalLink = document.getElementById('footerAdminPortalLink');
    if (footerAdminPortalLink) {
      footerAdminPortalLink.addEventListener('click', (e) => {
        e.preventDefault();
        // Set to admin demo profile for instant access
        stateManager.loginAsDemoUser('user-admin');
        switchView('dashboard');
        showToast('Entered Admin Console as System Administrator', 'info');
      });
    }
  }


  // =========================================================================
  // 2. Authentication & User Profiles
  // =========================================================================
  function initAuth() {
    const authModal = document.getElementById('authModal');
    const authTabLogin = document.getElementById('authTabLogin');
    const authTabRegister = document.getElementById('authTabRegister');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const regRole = document.getElementById('regRole');
    const regOrgGroup = document.getElementById('regOrgGroup');

    // Header buttons
    const headerLoginBtn = document.getElementById('headerLoginBtn');
    if (headerLoginBtn) {
      headerLoginBtn.addEventListener('click', () => {
        openAuthModal('login');
      });
    }

    const headerRegisterBtn = document.getElementById('headerRegisterBtn');
    if (headerRegisterBtn) {
      headerRegisterBtn.addEventListener('click', () => {
        openAuthModal('register');
      });
    }

    const headerSignOutBtn = document.getElementById('headerSignOutBtn');
    if (headerSignOutBtn) {
      headerSignOutBtn.addEventListener('click', () => {
        stateManager.logout();
        showToast('You have signed out.', 'info');
        switchView('home');
      });
    }

    const userProfileBtn = document.getElementById('userProfileBtn');
    if (userProfileBtn) {
      userProfileBtn.addEventListener('click', () => {
        switchView('dashboard');
      });
    }

    // Auth Modal Tabs
    authTabLogin.addEventListener('click', () => {
      authTabLogin.classList.add('active');
      authTabRegister.classList.remove('active');
      loginForm.style.display = 'block';
      registerForm.style.display = 'none';
      document.getElementById('authModalTitle').textContent = 'Sign In to ShikshaShare';
    });

    authTabRegister.addEventListener('click', () => {
      authTabRegister.classList.add('active');
      authTabLogin.classList.remove('active');
      loginForm.style.display = 'none';
      registerForm.style.display = 'block';
      document.getElementById('authModalTitle').textContent = 'Join ShikshaShare Community';
    });

    // Role selection in registration
    regRole.addEventListener('change', (e) => {
      if (e.target.value === 'community') {
        regOrgGroup.style.display = 'block';
      } else {
        regOrgGroup.style.display = 'none';
      }
    });

    // Demo user instant chips
    document.querySelectorAll('.demo-user-chip').forEach(chip => {
      chip.addEventListener('click', (e) => {
        const demoId = chip.getAttribute('data-demo-id');
        const user = stateManager.loginAsDemoUser(demoId);
        closeModal('authModal');
        if (user) {
          showToast(`Switched account to: ${user.name} (${user.roleLabel})`, 'success');
          switchView('dashboard');
        }
      });
    });

    // Login Form Submit
    if (loginForm) {
      loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const emailInput = document.getElementById('loginEmail');
        const email = emailInput ? emailInput.value.trim().toLowerCase() : '';
        const found = DEMO_USERS.find(u => u.email.toLowerCase() === email || u.name.toLowerCase().includes(email));
        let user;
        if (found) {
          user = stateManager.loginAsDemoUser(found.id);
        } else {
          // Default to student demo or active user
          user = stateManager.loginAsDemoUser('user-student');
        }
        closeModal('authModal');
        showToast(`Welcome back, ${user.name}!`, 'success');
        switchView('dashboard');
      });
    }

    // Register Form Submit
    registerForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const role = document.getElementById('regRole').value;
      const name = document.getElementById('regName').value.trim();
      const email = document.getElementById('regEmail').value.trim();
      const org = document.getElementById('regOrg').value.trim();
      const location = document.getElementById('regLocation').value.trim();

      const newUser = stateManager.registerUser({
        role,
        name,
        email,
        organizationName: org,
        location
      });

      closeModal('authModal');
      showToast(`Welcome to ShikshaShare, ${newUser.name}!`, 'success');
      switchView('dashboard');
    });
  }

  function openAuthModal(mode = 'login') {
    openModal('authModal');
    if (mode === 'register') {
      document.getElementById('authTabRegister').click();
    } else {
      document.getElementById('authTabLogin').click();
    }
  }

  function renderAuthUI() {
    const user = stateManager.getCurrentUser();
    const authLoggedOut = document.getElementById('authLoggedOut');
    const authLoggedIn = document.getElementById('authLoggedIn');

    if (authLoggedOut && authLoggedIn) {
      if (user) {
        authLoggedOut.style.display = 'none';
        authLoggedIn.style.display = 'flex';
        const nameEl = document.getElementById('headerUserName');
        if (nameEl) nameEl.textContent = user.name;
        const avatarEl = document.getElementById('userAvatarPill');
        if (avatarEl) avatarEl.textContent = user.avatar || user.name.substring(0, 2).toUpperCase();
      } else {
        authLoggedOut.style.display = 'flex';
        authLoggedIn.style.display = 'none';
      }
    }
  }


  // =========================================================================
  // 3. Dropdown Population & Filter Controls
  // =========================================================================
  function initPopulateDropdowns() {
    // Categories
    const categoryOptions = CATEGORIES.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    if (filterCategory) filterCategory.innerHTML = '<option value="all">All Categories</option>' + categoryOptions;

    const donateCategory = document.getElementById('donateCategory');
    if (donateCategory) donateCategory.innerHTML = '<option value="">Select Resource Category</option>' + categoryOptions;

    const listingCategory = document.getElementById('listingCategory');
    if (listingCategory) listingCategory.innerHTML = categoryOptions;

    const postReqCategory = document.getElementById('postReqCategory');
    if (postReqCategory) postReqCategory.innerHTML = categoryOptions;

    // Branches for college
    const branchOptions = COLLEGE_BRANCHES.map(b => `<option value="${b}">${b}</option>`).join('');
    if (filterBranch) filterBranch.innerHTML = '<option value="all">All Branches</option>' + branchOptions;

    const editBranch = document.getElementById('editBranch');
    if (editBranch) editBranch.innerHTML = branchOptions;

    // Semesters for college
    const semOptions = COLLEGE_SEMESTERS.map(s => `<option value="${s}">${s}</option>`).join('');
    if (filterSemester) filterSemester.innerHTML = '<option value="all">All Semesters</option>' + semOptions;

    const editSemester = document.getElementById('editSemester');
    if (editSemester) editSemester.innerHTML = semOptions;

    // Streams for HSC
    const streamOptions = STREAMS_HSC.map(s => `<option value="${s}">${s}</option>`).join('');
    if (filterStream) filterStream.innerHTML = '<option value="all">All Streams</option>' + streamOptions;

    // Classes for School
    const classOptions = SCHOOL_CLASSES.map(c => `<option value="${c}">${c}</option>`).join('');
    if (filterClass) filterClass.innerHTML = '<option value="all">All Classes</option>' + classOptions;

    // Linked Needs for Donate Form
    updateDonateLinkedNeedsDropdown();
  }

  function updateDonateLinkedNeedsDropdown() {
    const donateLinkedNeed = document.getElementById('donateLinkedNeed');
    if (!donateLinkedNeed) return;
    const reqs = stateManager.getCommunityRequirements().filter(r => r.status !== 'Fulfilled');
    const opts = reqs.map(r => `<option value="${r.id}">[${r.organizationName}] ${r.title} (${r.quantityReceived}/${r.quantityNeeded} received)</option>`).join('');
    donateLinkedNeed.innerHTML = '<option value="">General Donation (Available to any student)</option>' + opts;
  }

  function initFilterControls() {
    // Search input
    if (resourceSearchInput) {
      resourceSearchInput.addEventListener('input', (e) => {
        activeFilters.search = e.target.value.toLowerCase().trim();
        renderResources();
      });
    }

    // Education Level change -> progressive filters
    if (filterEducationLevel) {
      filterEducationLevel.addEventListener('change', (e) => {
        const lvl = e.target.value;
        activeFilters.level = lvl;
        activeFilters.stream = 'all';
        activeFilters.branch = 'all';
        activeFilters.semester = 'all';
        activeFilters.classNum = 'all';
        updateProgressiveFilterVisibility(lvl);
        renderResources();
      });
    }

    if (filterStream) {
      filterStream.addEventListener('change', (e) => {
        activeFilters.stream = e.target.value;
        renderResources();
      });
    }

    if (filterBranch) {
      filterBranch.addEventListener('change', (e) => {
        activeFilters.branch = e.target.value;
        renderResources();
      });
    }

    if (filterSemester) {
      filterSemester.addEventListener('change', (e) => {
        activeFilters.semester = e.target.value;
        renderResources();
      });
    }

    if (filterClass) {
      filterClass.addEventListener('change', (e) => {
        activeFilters.classNum = e.target.value;
        renderResources();
      });
    }

    if (filterCategory) {
      filterCategory.addEventListener('change', (e) => {
        activeFilters.category = e.target.value;
        renderResources();
      });
    }

    if (filterCondition) {
      filterCondition.addEventListener('change', (e) => {
        activeFilters.condition = e.target.value;
        renderResources();
      });
    }

    // Resource Type Pills
    document.querySelectorAll('.filter-pill-btn[data-type]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const type = btn.getAttribute('data-type');
        activeFilters.type = type;
        updateFilterTypePills(type);
        renderResources();
      });
    });

    // Reset filters
    const resetFiltersBtn = document.getElementById('resetFiltersBtn');
    if (resetFiltersBtn) {
      resetFiltersBtn.addEventListener('click', resetAllFilters);
    }
    const clearSearchBtn = document.getElementById('clearSearchBtn');
    if (clearSearchBtn) {
      clearSearchBtn.addEventListener('click', resetAllFilters);
    }

    // Community page org filter pills
    document.querySelectorAll('.filter-pill-btn[data-org-filter]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.filter-pill-btn[data-org-filter]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const filter = btn.getAttribute('data-org-filter');
        renderCommunity(filter);
      });
    });
  }

  function updateFilterTypePills(type) {
    document.querySelectorAll('.filter-pill-btn[data-type]').forEach(b => {
      if (b.getAttribute('data-type') === type) {
        b.classList.add('active');
      } else {
        b.classList.remove('active');
      }
    });
  }

  function updateProgressiveFilterVisibility(level) {
    if (filterStreamGroup) filterStreamGroup.style.display = (level === 'hsc') ? 'flex' : 'none';
    if (filterBranchGroup) filterBranchGroup.style.display = (level === 'college') ? 'flex' : 'none';
    if (filterSemesterGroup) filterSemesterGroup.style.display = (level === 'college') ? 'flex' : 'none';
    if (filterClassGroup) filterClassGroup.style.display = (level === 'school') ? 'flex' : 'none';
  }

  function resetAllFilters() {
    activeFilters = {
      search: '',
      level: 'all',
      stream: 'all',
      branch: 'all',
      semester: 'all',
      classNum: 'all',
      category: 'all',
      type: 'all',
      condition: 'all'
    };

    if (resourceSearchInput) resourceSearchInput.value = '';
    if (filterEducationLevel) filterEducationLevel.value = 'all';
    if (filterStream) filterStream.value = 'all';
    if (filterBranch) filterBranch.value = 'all';
    if (filterSemester) filterSemester.value = 'all';
    if (filterClass) filterClass.value = 'all';
    if (filterCategory) filterCategory.value = 'all';
    if (filterCondition) filterCondition.value = 'all';

    updateProgressiveFilterVisibility('all');
    updateFilterTypePills('all');
    renderResources();
  }


  // =========================================================================
  // 4. View Rendering: Home
  // =========================================================================
  function renderHome() {
    // 1. Community Requirements Preview (Top 3 open or partially fulfilled)
    const homeCommunityPreviewGrid = document.getElementById('homeCommunityPreviewGrid');
    if (homeCommunityPreviewGrid) {
      const allReqs = stateManager.getCommunityRequirements();
      const topReqs = allReqs.slice(0, 3);
      homeCommunityPreviewGrid.innerHTML = topReqs.map(r => createCommunityReqCardHTML(r)).join('');
      attachCommunityCardEvents(homeCommunityPreviewGrid);
    }

    // 2. Curated Educational Resources Preview (Top 3 items)
    const homeResourcesPreviewGrid = document.getElementById('homeResourcesPreviewGrid');
    if (homeResourcesPreviewGrid) {
      const allResources = stateManager.getResources();
      const topResources = allResources.slice(0, 3);
      homeResourcesPreviewGrid.innerHTML = topResources.map(r => createResourceCardHTML(r)).join('');
      attachResourceCardEvents(homeResourcesPreviewGrid);
    }
  }


  // =========================================================================
  // 5. View Rendering: Resources (Discovery)
  // =========================================================================
  function renderResources() {
    if (!resourcesGrid) return;

    let items = stateManager.getResources();

    // 1. Keyword search filter
    if (activeFilters.search) {
      const q = activeFilters.search;
      items = items.filter(r =>
        r.title.toLowerCase().includes(q) ||
        (r.subject && r.subject.toLowerCase().includes(q)) ||
        (r.branch && r.branch.toLowerCase().includes(q)) ||
        (r.description && r.description.toLowerCase().includes(q)) ||
        (r.providerName && r.providerName.toLowerCase().includes(q))
      );
    }

    // 2. Education Level
    if (activeFilters.level !== 'all') {
      items = items.filter(r => r.educationLevel === activeFilters.level);
    }

    // 3. Sub-filters
    if (activeFilters.stream !== 'all') {
      items = items.filter(r => r.stream === activeFilters.stream);
    }
    if (activeFilters.branch !== 'all') {
      items = items.filter(r => r.branch === activeFilters.branch);
    }
    if (activeFilters.semester !== 'all') {
      items = items.filter(r => r.semester === activeFilters.semester);
    }

    // 4. Category
    if (activeFilters.category !== 'all') {
      items = items.filter(r => r.category === activeFilters.category);
    }

    // 5. Resource Type (buy vs free)
    if (activeFilters.type !== 'all') {
      items = items.filter(r => r.type === activeFilters.type);
    }

    // 6. Condition
    if (activeFilters.condition !== 'all') {
      items = items.filter(r => r.condition === activeFilters.condition);
    }

    // Update count label
    if (resultsCountLabel) {
      resultsCountLabel.textContent = `Showing ${items.length} ${items.length === 1 ? 'resource' : 'resources'}`;
    }

    // Empty state handling
    if (items.length === 0) {
      resourcesGrid.innerHTML = '';
      if (resourcesEmptyBox) resourcesEmptyBox.style.display = 'block';
    } else {
      if (resourcesEmptyBox) resourcesEmptyBox.style.display = 'none';
      resourcesGrid.innerHTML = items.map(r => createResourceCardHTML(r)).join('');
      attachResourceCardEvents(resourcesGrid);
    }
  }

  function createResourceCardHTML(res) {
    const isFree = res.type === 'free';
    const isSaved = stateManager.isSaved(res.id);
    const cat = CATEGORIES.find(c => c.id === res.category);
    const catName = cat ? cat.name : 'Educational Resource';

    return `
      <div class="resource-card" data-res-id="${res.id}">
        <div class="resource-image-wrap">
          <img src="${res.image}" alt="${escapeHTML(res.title)}" loading="lazy">
          <div class="resource-pill-overlay">
            ${isFree
              ? '<span class="badge badge-free">100% Free / Donated</span>'
              : `<span class="badge badge-price">For Sale • ₹${res.price}</span>`
            }
          </div>
          <button class="resource-save-btn ${isSaved ? 'saved' : ''}" data-save-id="${res.id}" title="${isSaved ? 'Remove from Saved' : 'Save Resource'}">
            <svg viewBox="0 0 24 24" fill="${isSaved ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" width="16" height="16">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
            </svg>
          </button>
        </div>

        <div class="resource-body">
          <div class="resource-category-tag">${catName}</div>
          <h3 class="resource-title" title="${escapeHTML(res.title)}">${escapeHTML(res.title)}</h3>

          <div class="resource-curriculum-meta">
            ${res.educationLevel ? `<span class="meta-chip">${formatEduLevel(res.educationLevel)}</span>` : ''}
            ${res.branch ? `<span class="meta-chip">${escapeHTML(res.branch)}</span>` : ''}
            ${res.semester ? `<span class="meta-chip">${escapeHTML(res.semester)}</span>` : ''}
          </div>

          <div class="resource-details-meta">
            <div class="meta-row">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
              <span>${escapeHTML(res.location)}</span>
            </div>
            <div class="meta-row">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
              <span>Condition: <strong>${escapeHTML(res.condition)}</strong> • By ${escapeHTML(res.providerName)}</span>
            </div>
          </div>

          <div class="resource-footer-row">
            <div class="resource-price-display">
              ${isFree
                ? '<span class="price-main" style="color: var(--color-accent); font-size: 1rem;">Free Access</span>'
                : `<span class="price-main">₹${res.price}</span>${res.originalPrice ? `<span class="price-original">M.R.P. ₹${res.originalPrice}</span>` : ''}`
              }
            </div>
            <button class="btn btn-outline btn-sm view-res-detail-btn" data-detail-id="${res.id}">
              View Details
            </button>
          </div>
        </div>
      </div>
    `;
  }

  function attachResourceCardEvents(container) {
    // Card detail button
    container.querySelectorAll('.view-res-detail-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const resId = btn.getAttribute('data-detail-id');
        openResourceDetailModal(resId);
      });
    });

    // Whole card click
    container.querySelectorAll('.resource-card').forEach(card => {
      card.addEventListener('click', () => {
        const resId = card.getAttribute('data-res-id');
        openResourceDetailModal(resId);
      });
    });

    // Save toggle
    container.querySelectorAll('.resource-save-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const resId = btn.getAttribute('data-save-id');
        const isNowSaved = stateManager.toggleSavedItem(resId);
        btn.classList.toggle('saved', isNowSaved);
        showToast(isNowSaved ? 'Saved resource to your list' : 'Removed from saved items', 'info');
      });
    });
  }


  // =========================================================================
  // 6. View Rendering: Community (Requirements & Partners)
  // =========================================================================
  function renderCommunity(filter = 'all') {
    const communityGrid = document.getElementById('communityFullRequirementsGrid');
    if (!communityGrid) return;

    let reqs = stateManager.getCommunityRequirements();

    if (filter === 'ngo') {
      reqs = reqs.filter(r => r.organizationType.includes('NGO'));
    } else if (filter === 'nss') {
      reqs = reqs.filter(r => r.organizationType.includes('NSS'));
    } else if (filter === 'trust') {
      reqs = reqs.filter(r => r.organizationType.includes('Trust') || r.organizationType.includes('Foundation') || r.organizationType.includes('Orphanage'));
    }

    communityGrid.innerHTML = reqs.map(r => createCommunityReqCardHTML(r)).join('');
    attachCommunityCardEvents(communityGrid);

    // Partners list
    const partnersGrid = document.getElementById('communityPartnersListGrid');
    if (partnersGrid) {
      partnersGrid.innerHTML = COMMUNITY_PARTNERS_LIST.map(p => `
        <div class="partner-card">
          <div class="partner-card-header">
            <div class="partner-avatar">${p.name.substring(0, 2).toUpperCase()}</div>
            <div>
              <div class="partner-title">${escapeHTML(p.name)}</div>
              <span class="badge badge-partner" style="font-size: 0.68rem;">${escapeHTML(p.type)}</span>
            </div>
          </div>
          <p class="partner-desc">${escapeHTML(p.description)}</p>
          <div class="partner-stat-row">
            <span>Focus: ${escapeHTML(p.location)}</span>
            <span><strong>${p.studentsBenefited}+</strong> Assisted</span>
          </div>
        </div>
      `).join('');
    }
  }

  function createCommunityReqCardHTML(req) {
    const percent = Math.min(100, Math.round(((req.quantityReceived || 0) / req.quantityNeeded) * 100));
    const isFulfilled = req.status === 'Fulfilled';

    return `
      <div class="req-card" data-req-id="${req.id}">
        <div class="req-header-meta">
          <span class="badge ${isFulfilled ? 'badge-verified' : 'badge-urgent'}">
            ${escapeHTML(req.status)}
          </span>
          <span style="font-size: 0.74rem; color: var(--text-muted);">
            Posted: ${req.datePosted}
          </span>
        </div>

        <div class="req-org-block">
          <div class="req-org-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle></svg>
          </div>
          <div>
            <div class="req-org-name">${escapeHTML(req.organizationName)}</div>
            <div class="req-org-type">${escapeHTML(req.organizationType)} • Verified</div>
          </div>
        </div>

        <h3 class="req-title">${escapeHTML(req.title)}</h3>
        <p class="req-desc">${escapeHTML(req.description)}</p>

        <div class="req-progress-wrap">
          <div class="req-progress-labels">
            <span>Community Progress</span>
            <span class="count">${req.quantityReceived} of ${req.quantityNeeded} Received (${percent}%)</span>
          </div>
          <div class="progress-bar-bg">
            <div class="progress-bar-fill" style="width: ${percent}%;"></div>
          </div>
        </div>

        <div class="req-footer-meta">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
          <span>Drop-off: ${escapeHTML(req.dropLocation)}</span>
        </div>

        <div class="req-actions-group">
          ${isFulfilled
            ? '<button class="btn btn-secondary btn-sm btn-block" disabled>Drive Completed</button>'
            : `<button class="btn btn-accent btn-sm btn-block pledge-need-btn" data-req-id="${req.id}">Support This Need</button>`
          }
        </div>
      </div>
    `;
  }

  function attachCommunityCardEvents(container) {
    container.querySelectorAll('.pledge-need-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const reqId = btn.getAttribute('data-req-id');
        openPledgeModal(reqId);
      });
    });

    container.querySelectorAll('.req-card').forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.closest('.pledge-need-btn')) return;
        const reqId = card.getAttribute('data-req-id');
        const req = stateManager.getCommunityRequirementById(reqId);
        if (req && req.status !== 'Fulfilled') {
          openPledgeModal(reqId);
        }
      });
    });
  }


  // =========================================================================
  // 7. Resource Detail Modal & Requests
  // =========================================================================
  function openResourceDetailModal(resourceId) {
    const res = stateManager.getResourceById(resourceId);
    if (!res) return;

    const isFree = res.type === 'free';
    const modalResTitle = document.getElementById('modalResTitle');
    const modalResBody = document.getElementById('modalResBody');
    const modalResFooter = document.getElementById('modalResFooter');

    modalResTitle.textContent = res.title;

    modalResBody.innerHTML = `
      <div style="display: flex; gap: 20px; flex-direction: column;">
        <div style="width: 100%; height: 220px; border-radius: var(--radius-md); overflow: hidden; background: #f1f5f9;">
          <img src="${res.image}" alt="${escapeHTML(res.title)}" style="width: 100%; height: 100%; object-fit: cover;">
        </div>

        <div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            ${isFree
              ? '<span class="badge badge-free" style="font-size: 0.85rem; padding: 4px 10px;">100% Free / Donated</span>'
              : `<span class="badge badge-price" style="font-size: 0.85rem; padding: 4px 10px;">For Sale • ₹${res.price}</span>`
            }
            <span style="font-size: 0.82rem; color: var(--text-muted);">Added on ${res.dateAdded}</span>
          </div>

          <h2 style="font-size: 1.25rem; font-weight: 700; margin-bottom: 8px; color: var(--text-heading);">${escapeHTML(res.title)}</h2>
          <p style="color: var(--text-body); line-height: 1.6; margin-bottom: 16px;">${escapeHTML(res.description)}</p>

          <div style="background-color: var(--bg-surface-subtle); padding: 16px; border-radius: var(--radius-md); border: 1px solid var(--border-color); display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 0.85rem;">
            <div><strong>Education Level:</strong> ${formatEduLevel(res.educationLevel)}</div>
            <div><strong>Condition:</strong> ${escapeHTML(res.condition)}</div>
            ${res.branch ? `<div><strong>Branch:</strong> ${escapeHTML(res.branch)}</div>` : ''}
            ${res.semester ? `<div><strong>Semester:</strong> ${escapeHTML(res.semester)}</div>` : ''}
            <div><strong>Provider / Donor:</strong> ${escapeHTML(res.providerName)}</div>
            <div><strong>Pickup Location:</strong> ${escapeHTML(res.location)}</div>
          </div>
        </div>
      </div>
    `;

    modalResFooter.innerHTML = `
      <button class="btn btn-ghost btn-sm" data-close-modal="resourceDetailModal">Close</button>
      ${isFree
        ? `<button class="btn btn-accent btn-sm" id="modalClaimFreeBtn" data-res-id="${res.id}">Request Free Donation</button>`
        : `<button class="btn btn-primary btn-sm" id="modalBuyBtn" data-res-id="${res.id}">Request to Purchase (₹${res.price})</button>`
      }
    `;

    // Bind footer action
    const claimBtn = document.getElementById('modalClaimFreeBtn');
    if (claimBtn) {
      claimBtn.addEventListener('click', () => {
        stateManager.requestResource(res.id, 'free_claim');
        closeModal('resourceDetailModal');
      });
    }

    const buyBtn = document.getElementById('modalBuyBtn');
    if (buyBtn) {
      buyBtn.addEventListener('click', () => {
        stateManager.requestResource(res.id, 'buy_request');
        closeModal('resourceDetailModal');
      });
    }

    openModal('resourceDetailModal');
  }


  // =========================================================================
  // 8. Support / Pledge Community Need Modal
  // =========================================================================
  function openPledgeModal(reqId) {
    const req = stateManager.getCommunityRequirementById(reqId);
    if (!req) return;

    document.getElementById('supportNeedId').value = req.id;
    document.getElementById('supportNeedTitle').textContent = `Support: ${req.organizationName}`;

    const summaryBox = document.getElementById('supportNeedSummary');
    summaryBox.innerHTML = `
      <div style="font-weight: 700; color: var(--text-heading); margin-bottom: 4px;">${escapeHTML(req.title)}</div>
      <div style="font-size: 0.82rem; color: var(--text-muted); margin-bottom: 6px;">
        ${req.quantityReceived} of ${req.quantityNeeded} items received so far
      </div>
      <div style="font-size: 0.8rem; color: var(--text-body);">
        <strong>Drop Location:</strong> ${escapeHTML(req.dropLocation)} • <strong>Coordinator:</strong> ${escapeHTML(req.contactPerson)}
      </div>
    `;

    document.getElementById('pledgeQuantity').value = 1;
    document.getElementById('pledgeQuantity').max = Math.max(1, req.quantityNeeded - (req.quantityReceived || 0));

    openModal('supportNeedModal');
  }

  // Pledge form submit
  const supportNeedForm = document.getElementById('supportNeedForm');
  if (supportNeedForm) {
    supportNeedForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const reqId = document.getElementById('supportNeedId').value;
      const qty = document.getElementById('pledgeQuantity').value;
      const notes = document.getElementById('pledgeNotes').value.trim();

      stateManager.pledgeToRequirement(reqId, qty, notes);
      closeModal('supportNeedModal');
    });
  }


  // =========================================================================
  // 9. Streamlined Donation Form
  // =========================================================================
  function initDonationForm() {
    const donateForm = document.getElementById('donateResourceForm');
    const donateThankYouBox = document.getElementById('donateThankYouBox');
    const donateAnotherBtn = document.getElementById('donateAnotherBtn');
    const viewDonationInListBtn = document.getElementById('viewDonationInListBtn');

    if (donateForm) {
      donateForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const category = document.getElementById('donateCategory').value;
        const title = document.getElementById('donateTitle').value.trim();
        const educationLevel = document.getElementById('donateEducationLevel').value;
        const condition = document.getElementById('donateCondition').value;
        const description = document.getElementById('donateDescription').value.trim();
        const quantity = Number(document.getElementById('donateQuantity').value) || 1;
        const location = document.getElementById('donateLocation').value.trim();
        const linkedNeedId = document.getElementById('donateLinkedNeed').value;

        // If linked to a community need, also record pledge
        if (linkedNeedId) {
          stateManager.pledgeToRequirement(linkedNeedId, quantity, `Donated: ${title}`);
        }

        // Add resource to listing as 100% free
        stateManager.addResource({
          title,
          category,
          educationLevel,
          condition,
          description,
          type: 'free',
          price: 0,
          location,
          image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80'
        });

        // Show thank you message
        donateForm.style.display = 'none';
        donateThankYouBox.style.display = 'block';
      });
    }

    if (donateAnotherBtn) {
      donateAnotherBtn.addEventListener('click', () => {
        donateForm.reset();
        donateForm.style.display = 'block';
        donateThankYouBox.style.display = 'none';
      });
    }

    if (viewDonationInListBtn) {
      viewDonationInListBtn.addEventListener('click', () => {
        activeFilters.type = 'free';
        updateFilterTypePills('free');
        switchView('resources');
      });
    }
  }


  // =========================================================================
  // 10. Role-Specific Dashboards Rendering
  // =========================================================================
  function renderDashboard() {
    const user = stateManager.getCurrentUser();
    const role = user ? user.role : 'student';

    // Header info
    document.getElementById('dashAvatar').textContent = user ? user.avatar : 'SP';
    document.getElementById('dashGreeting').textContent = user ? `Welcome, ${user.name}` : 'Welcome back';
    document.getElementById('dashRoleBadge').textContent = user ? user.roleLabel : 'Student';
    document.getElementById('dashSubtitle').textContent = user?.institution || user?.location || 'ShikshaShare Academic Community';

    // Hide all dashboard panels first
    document.querySelectorAll('.role-dash-panel').forEach(p => p.style.display = 'none');

    const actionWrap = document.getElementById('dashContextActionWrap');
    actionWrap.innerHTML = '';

    if (role === 'student') {
      renderStudentDashboard(actionWrap);
    } else if (role === 'provider') {
      renderProviderDashboard(actionWrap);
    } else if (role === 'donor') {
      renderDonorDashboard(actionWrap);
    } else if (role === 'community') {
      renderCommunityPartnerDashboard(actionWrap);
    } else if (role === 'admin') {
      renderAdminDashboard(actionWrap);
    }
  }

  // 1. Student Dashboard
  function renderStudentDashboard(actionWrap) {
    const panel = document.getElementById('dashContentStudent');
    if (!panel) return;
    panel.style.display = 'block';

    actionWrap.innerHTML = `
      <button class="btn btn-outline btn-sm" id="dashPersonalizeBtn">Edit Curriculum Profile</button>
    `;
    document.getElementById('dashPersonalizeBtn').addEventListener('click', openPersonalizeModal);

    const profile = stateManager.getStudentProfile();
    const curriculumDisplay = document.getElementById('studentCurriculumDisplay');
    if (curriculumDisplay) {
      curriculumDisplay.textContent = `${formatEduLevel(profile.level)} • ${profile.branch || profile.stream || 'General'} • ${profile.semester || ''}`;
    }

    // Recommended for student syllabus
    const recGrid = document.getElementById('studentRecommendedGrid');
    if (recGrid) {
      const allResources = stateManager.getResources();
      // Match by level & branch or sem
      let matching = allResources.filter(r =>
        r.educationLevel === profile.level &&
        (!profile.branch || r.branch === profile.branch || r.stream === profile.stream)
      );
      if (matching.length === 0) matching = allResources.slice(0, 3);
      recGrid.innerHTML = matching.slice(0, 3).map(r => createResourceCardHTML(r)).join('');
      attachResourceCardEvents(recGrid);
    }

    // Free resources for student
    const freeGrid = document.getElementById('studentFreeGrid');
    if (freeGrid) {
      const freeResources = stateManager.getResources().filter(r => r.type === 'free');
      freeGrid.innerHTML = freeResources.slice(0, 3).map(r => createResourceCardHTML(r)).join('');
      attachResourceCardEvents(freeGrid);
    }

    // Community needs for student
    const commNeedsGrid = document.getElementById('studentCommunityNeedsGrid');
    if (commNeedsGrid) {
      const reqs = stateManager.getCommunityRequirements().slice(0, 2);
      commNeedsGrid.innerHTML = reqs.map(r => createCommunityReqCardHTML(r)).join('');
      attachCommunityCardEvents(commNeedsGrid);
    }

    // Student requests table
    const tableBody = document.getElementById('studentRequestsTableBody');
    if (tableBody) {
      const requests = stateManager.getUserRequests();
      if (requests.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 24px;">No active requests or claims yet. Browse resources to claim or purchase.</td></tr>';
      } else {
        tableBody.innerHTML = requests.map(req => `
          <tr>
            <td><strong>${escapeHTML(req.resourceTitle || req.requirementTitle || 'Resource')}</strong></td>
            <td><span class="badge ${req.type === 'free_claim' ? 'badge-free' : 'badge-price'}">${req.type === 'free_claim' ? 'Free Claim' : (req.type === 'community_pledge' ? 'Community Pledge' : 'Purchase Offer')}</span></td>
            <td><span class="badge badge-partner">${escapeHTML(req.status)}</span></td>
            <td>${escapeHTML(req.contactName || req.organizationName || 'Provider')}</td>
            <td>${req.date}</td>
            <td style="font-size: 0.8rem; color: var(--text-muted);">${escapeHTML(req.note || '')}</td>
          </tr>
        `).join('');
      }
    }

    // Student quick search
    const quickSearch = document.getElementById('studentQuickSearchInput');
    if (quickSearch) {
      quickSearch.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          activeFilters.search = quickSearch.value.trim().toLowerCase();
          if (resourceSearchInput) resourceSearchInput.value = quickSearch.value;
          switchView('resources');
        }
      });
    }

    // Student action buttons
    const studentPersonalizeBtn = document.getElementById('studentPersonalizeBtn');
    if (studentPersonalizeBtn) studentPersonalizeBtn.addEventListener('click', openPersonalizeModal);
    const studentBrowseFreeBtn = document.getElementById('studentBrowseFreeBtn');
    if (studentBrowseFreeBtn) {
      studentBrowseFreeBtn.addEventListener('click', () => {
        activeFilters.type = 'free';
        updateFilterTypePills('free');
        switchView('resources');
      });
    }
  }

  // 2. Provider Dashboard
  function renderProviderDashboard(actionWrap) {
    const panel = document.getElementById('dashContentProvider');
    if (!panel) return;
    panel.style.display = 'block';

    actionWrap.innerHTML = `
      <button class="btn btn-primary btn-sm" id="dashAddListingBtn">+ List Resource for Sale</button>
    `;
    const dashAddListingBtn = document.getElementById('dashAddListingBtn');
    if (dashAddListingBtn) dashAddListingBtn.addEventListener('click', () => openModal('providerAddListingModal'));
    const providerAddListingBtn = document.getElementById('providerAddListingBtn');
    if (providerAddListingBtn) providerAddListingBtn.addEventListener('click', () => openModal('providerAddListingModal'));

    // Provider's active listings
    const user = stateManager.getCurrentUser();
    const allResources = stateManager.getResources();
    const myListings = allResources.filter(r => r.providerRole === 'Resource Provider' || r.providerRole === 'Student / Provider');

    document.getElementById('providerListingsCount').textContent = myListings.length;
    const grid = document.getElementById('providerListingsGrid');
    if (grid) {
      grid.innerHTML = myListings.map(r => createResourceCardHTML(r)).join('');
      attachResourceCardEvents(grid);
    }
  }

  // 3. Donor Dashboard
  function renderDonorDashboard(actionWrap) {
    const panel = document.getElementById('dashContentDonor');
    if (!panel) return;
    panel.style.display = 'block';

    actionWrap.innerHTML = `
      <button class="btn btn-accent btn-sm" id="dashDonateBtn">+ Donate A Resource</button>
    `;
    const dashDonateBtn = document.getElementById('dashDonateBtn');
    if (dashDonateBtn) dashDonateBtn.addEventListener('click', () => switchView('donate'));
    const donorNewDonateBtn = document.getElementById('donorNewDonateBtn');
    if (donorNewDonateBtn) donorNewDonateBtn.addEventListener('click', () => switchView('donate'));

    // Community Needs to support
    const reqs = stateManager.getCommunityRequirements().filter(r => r.status !== 'Fulfilled');
    const donorNeedsGrid = document.getElementById('donorCommunityNeedsGrid');
    if (donorNeedsGrid) {
      donorNeedsGrid.innerHTML = reqs.slice(0, 3).map(r => createCommunityReqCardHTML(r)).join('');
      attachCommunityCardEvents(donorNeedsGrid);
    }

    // Donor History
    const historyTable = document.getElementById('donorHistoryTableBody');
    if (historyTable) {
      const userRequests = stateManager.getUserRequests().filter(r => r.type === 'community_pledge' || r.amount === 0);
      if (userRequests.length === 0) {
        historyTable.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 20px;">No pledges recorded yet. Choose a community drive above to support!</td></tr>';
      } else {
        historyTable.innerHTML = userRequests.map(r => `
          <tr>
            <td><strong>${escapeHTML(r.requirementTitle || r.resourceTitle || 'Resource Donation')}</strong></td>
            <td>${escapeHTML(r.organizationName || r.contactName || 'Community Partner')}</td>
            <td>${r.quantityPledged || 1} item(s)</td>
            <td>${r.date}</td>
            <td><span class="badge badge-verified">${escapeHTML(r.status)}</span></td>
          </tr>
        `).join('');
      }
    }
  }

  // 4. Community Partner Dashboard
  function renderCommunityPartnerDashboard(actionWrap) {
    const panel = document.getElementById('dashContentCommunity');
    if (!panel) return;
    panel.style.display = 'block';

    actionWrap.innerHTML = `
      <button class="btn btn-primary btn-sm" id="dashPostReqBtn">+ Post Community Need</button>
    `;
    const dashPostReqBtn = document.getElementById('dashPostReqBtn');
    if (dashPostReqBtn) dashPostReqBtn.addEventListener('click', () => openModal('postRequirementModal'));
    const partnerPostReqBtn = document.getElementById('partnerPostReqBtn');
    if (partnerPostReqBtn) partnerPostReqBtn.addEventListener('click', () => openModal('postRequirementModal'));

    const user = stateManager.getCurrentUser();
    const reqs = stateManager.getCommunityRequirements();
    const myReqs = reqs.filter(r => r.organizationName === user?.organizationName || r.organizationType?.includes('NSS'));

    const partnerGrid = document.getElementById('partnerMyRequirementsGrid');
    if (partnerGrid) {
      partnerGrid.innerHTML = (myReqs.length > 0 ? myReqs : reqs.slice(0, 2)).map(r => createCommunityReqCardHTML(r)).join('');
      attachCommunityCardEvents(partnerGrid);
    }

    // Distributions Log
    const distTable = document.getElementById('partnerDistributionsTableBody');
    if (distTable) {
      const dists = stateManager.getDistributions();
      distTable.innerHTML = dists.map(d => `
        <tr>
          <td><strong>${escapeHTML(d.requirementTitle)}</strong></td>
          <td>${escapeHTML(d.beneficiaries)}</td>
          <td>${d.quantity} units</td>
          <td>${d.date}</td>
          <td>${escapeHTML(d.distributedBy)}</td>
          <td><span class="badge badge-verified">${escapeHTML(d.status)}</span></td>
        </tr>
      `).join('');
    }
  }

  // 5. Admin Console Dashboard
  function renderAdminDashboard(actionWrap) {
    const panel = document.getElementById('dashContentAdmin');
    if (!panel) return;
    panel.style.display = 'block';

    actionWrap.innerHTML = `
      <button class="btn btn-outline btn-sm" id="dashAdminExportBtn">Generate CEP Report</button>
    `;
    const dashAdminExportBtn = document.getElementById('dashAdminExportBtn');
    if (dashAdminExportBtn) {
      dashAdminExportBtn.addEventListener('click', () => {
        showToast('CEP Project Impact Report generated successfully.', 'success');
      });
    }

    const resources = stateManager.getResources();
    document.getElementById('adminTotalResources').textContent = resources.length;

    // Moderation table
    const modTable = document.getElementById('adminModerationTableBody');
    if (modTable) {
      modTable.innerHTML = resources.slice(0, 6).map(r => `
        <tr>
          <td><strong>${escapeHTML(r.title)}</strong></td>
          <td>${formatEduLevel(r.category)}</td>
          <td>${formatEduLevel(r.educationLevel)}</td>
          <td><span class="badge ${r.type === 'free' ? 'badge-free' : 'badge-price'}">${r.type === 'free' ? 'Free' : `₹${r.price}`}</span></td>
          <td>${escapeHTML(r.providerName)}</td>
          <td><span class="badge badge-verified">Verified</span></td>
        </tr>
      `).join('');
    }

    // Partners verification
    const partnerTable = document.getElementById('adminPartnersTableBody');
    if (partnerTable) {
      partnerTable.innerHTML = COMMUNITY_PARTNERS_LIST.map(p => `
        <tr>
          <td><strong>${escapeHTML(p.name)}</strong></td>
          <td>${escapeHTML(p.type)}</td>
          <td>${escapeHTML(p.location)}</td>
          <td>${p.activeDrives} Drives</td>
          <td>${p.studentsBenefited} Students</td>
          <td><span class="badge badge-verified">Approved Partner</span></td>
        </tr>
      `).join('');
    }
  }


  // =========================================================================
  // 11. Modals Management & Action Forms
  // =========================================================================
  function initModals() {
    // Close modal triggers via delegation (supports dynamic buttons like in modalResFooter)
    document.addEventListener('click', (e) => {
      const closeBtn = e.target.closest('[data-close-modal]');
      if (closeBtn) {
        e.preventDefault();
        const modalId = closeBtn.getAttribute('data-close-modal');
        closeModal(modalId);
      }
    });

    // Close on overlay backdrop click
    document.querySelectorAll('.modal-overlay').forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          closeModal(modal.id);
        }
      });
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const activeModal = document.querySelector('.modal-overlay.active-modal');
        if (activeModal) {
          closeModal(activeModal.id);
        }
      }
    });

    // Post Community Requirement Form Submit
    const postReqForm = document.getElementById('postRequirementForm');
    if (postReqForm) {
      postReqForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const title = document.getElementById('postReqTitle').value.trim();
        const category = document.getElementById('postReqCategory').value;
        const quantityNeeded = document.getElementById('postReqQuantity').value;
        const targetBeneficiaries = document.getElementById('postReqBeneficiaries').value.trim();
        const dropLocation = document.getElementById('postReqDropLocation').value.trim();
        const description = document.getElementById('postReqDescription').value.trim();

        stateManager.addCommunityRequirement({
          title,
          category,
          quantityNeeded,
          targetBeneficiaries,
          dropLocation,
          description
        });

        closeModal('postRequirementModal');
        postReqForm.reset();
      });
    }

    // Provider Add Listing Form Submit
    const providerForm = document.getElementById('providerListingForm');
    if (providerForm) {
      const listingType = document.getElementById('listingType');
      const listingPriceGroup = document.getElementById('listingPriceGroup');

      listingType.addEventListener('change', (e) => {
        if (e.target.value === 'free') {
          listingPriceGroup.style.display = 'none';
        } else {
          listingPriceGroup.style.display = 'block';
        }
      });

      providerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const title = document.getElementById('listingTitle').value.trim();
        const category = document.getElementById('listingCategory').value;
        const educationLevel = document.getElementById('listingEducationLevel').value;
        const type = document.getElementById('listingType').value;
        const price = type === 'free' ? 0 : Number(document.getElementById('listingPrice').value || 0);
        const condition = document.getElementById('listingCondition').value;
        const location = document.getElementById('listingLocation').value.trim();
        const description = document.getElementById('listingDescription').value.trim();

        stateManager.addResource({
          title,
          category,
          educationLevel,
          type,
          price,
          condition,
          location,
          description,
          image: 'https://images.unsplash.com/photo-1532012164546-f432f2e3777a?auto=format&fit=crop&w=600&q=80'
        });

        closeModal('providerAddListingModal');
        providerForm.reset();
      });
    }

    // Student Profile Modal Form Submit
    const profileForm = document.getElementById('studentProfileForm');
    const editLevelSelect = document.getElementById('editLevel');
    if (editLevelSelect) {
      editLevelSelect.addEventListener('change', (e) => {
        const isCollege = e.target.value === 'college';
        const bGroup = document.getElementById('editBranchGroup');
        const sGroup = document.getElementById('editSemesterGroup');
        if (bGroup) bGroup.style.display = isCollege ? 'block' : 'none';
        if (sGroup) sGroup.style.display = isCollege ? 'block' : 'none';
      });
    }

    if (profileForm) {
      profileForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const level = document.getElementById('editLevel').value;
        const branch = document.getElementById('editBranch').value;
        const semester = document.getElementById('editSemester').value;
        const college = document.getElementById('editCollege').value.trim();

        stateManager.updateStudentProfile({
          level,
          branch,
          semester,
          college
        });

        closeModal('studentProfileModal');
      });
    }
  }

  function openPersonalizeModal() {
    const profile = stateManager.getStudentProfile();
    const editLevel = document.getElementById('editLevel');
    const editBranch = document.getElementById('editBranch');
    const editSemester = document.getElementById('editSemester');
    const editCollege = document.getElementById('editCollege');
    const bGroup = document.getElementById('editBranchGroup');
    const sGroup = document.getElementById('editSemesterGroup');

    const isCollege = (profile.level || 'college') === 'college';
    if (bGroup) bGroup.style.display = isCollege ? 'block' : 'none';
    if (sGroup) sGroup.style.display = isCollege ? 'block' : 'none';

    if (editLevel) editLevel.value = profile.level || 'college';
    if (editBranch) editBranch.value = profile.branch || COLLEGE_BRANCHES[0];
    if (editSemester) editSemester.value = profile.semester || COLLEGE_SEMESTERS[2];
    if (editCollege) editCollege.value = profile.college || 'VJTI Mumbai';

    openModal('studentProfileModal');
  }

  function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('active-modal');
      document.body.style.overflow = 'hidden';
    }
  }

  function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('active-modal');
      document.body.style.overflow = '';
    }
  }


  // =========================================================================
  // 12. Helper & Toast Utilities
  // =========================================================================
  function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
        ${type === 'success'
          ? '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline>'
          : '<circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line>'
        }
      </svg>
      <span>${escapeHTML(message)}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

  function escapeHTML(str) {
    if (!str) return '';
    return String(str)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function formatEduLevel(lvl) {
    switch (lvl) {
      case 'school': return 'School (5th–10th)';
      case 'hsc': return 'HSC (11th–12th)';
      case 'college': return 'College / Undergraduate';
      case 'masters': return 'Master\'s';
      case 'competitive': return 'Competitive Exam';
      default: return lvl || 'Academic';
    }
  }
});
