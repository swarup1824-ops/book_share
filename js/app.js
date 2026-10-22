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

  let providerPhotoCtrl = null;

  // =========================================================================
  // 1. Navigation & Role-Based Access Routing Configuration
  // =========================================================================
  const ROLE_PERMISSIONS = {
    guest: {
      views: ['home', 'resources', 'community', 'donate', 'about'],
      nav: ['navHome', 'navResources', 'navCommunity', 'navDonate', 'navAbout'],
      mobileNav: ['mNavHome', 'mNavResources', 'mNavCommunity', 'mNavDonate'],
      defaultDashboard: 'home'
    },
    student: {
      views: ['home', 'resources', 'community', 'about', 'dashboard'],
      nav: ['navHome', 'navResources', 'navCommunity', 'navAbout'],
      mobileNav: ['mNavHome', 'mNavResources', 'mNavCommunity', 'mNavProfile'],
      defaultDashboard: 'dashboard'
    },
    provider: {
      views: ['home', 'resources', 'community', 'donate', 'about', 'dashboard'],
      nav: ['navHome', 'navResources', 'navCommunity', 'navDonate', 'navAbout'],
      mobileNav: ['mNavHome', 'mNavResources', 'mNavCommunity', 'mNavDonate', 'mNavProfile'],
      defaultDashboard: 'dashboard'
    },
    community: {
      views: ['home', 'community', 'about', 'dashboard'],
      nav: ['navHome', 'navCommunity', 'navAbout'],
      mobileNav: ['mNavHome', 'mNavCommunity', 'mNavProfile'],
      defaultDashboard: 'dashboard'
    },
    admin: {
      views: ['home', 'resources', 'community', 'donate', 'about', 'dashboard'],
      nav: ['navHome', 'navResources', 'navCommunity', 'navDonate', 'navAbout'],
      mobileNav: ['mNavHome', 'mNavResources', 'mNavCommunity', 'mNavDonate', 'mNavProfile'],
      defaultDashboard: 'dashboard'
    }
  };


  function updateNavigationForRole(role = 'guest') {
    const permissions = ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.guest;

    // Desktop nav
    navLinks.forEach(link => {
      if (permissions.nav.includes(link.id)) {
        link.style.display = '';
      } else {
        link.style.display = 'none';
      }
    });

    // Mobile bottom nav
    mobileNavItems.forEach(item => {
      if (permissions.mobileNav.includes(item.id)) {
        item.style.display = '';
      } else {
        item.style.display = 'none';
      }
    });
  }

  function switchView(viewName) {
    const user = stateManager.getCurrentUser();
    const role = user ? user.role : 'guest';
    const permissions = ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.guest;

    if (!views[viewName]) {
      viewName = 'home';
    }

    // Role-based access control check
    if (!permissions.views.includes(viewName)) {
      const roleLabel = user ? user.roleLabel : 'Guest';
      const capName = viewName.charAt(0).toUpperCase() + viewName.slice(1);

      if (!user && viewName === 'dashboard') {
        showToast('Please sign in to access your ShikshaShare dashboard.', 'info');
        openAuthModal('login');
      } else {
        showToast(`Access restricted: The ${capName} section is not accessible for ${roleLabel} accounts. Redirected to your dashboard.`, 'info');
      }

      const redirectView = user ? 'dashboard' : 'home';
      if (viewName !== redirectView) {
        return switchView(redirectView);
      }
      return;
    }

    // Keep URL hash in sync for direct navigation
    if (window.location.hash.slice(1) !== viewName) {
      history.pushState(null, '', `#${viewName}`);
    }

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
        openModal('providerAddListingModal');
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
        const user = stateManager.getCurrentUser();
        if (!user) {
          showToast('Please sign in as a Community Partner (NGO / NSS) to post a drive.', 'info');
          openModal('authModal');
          return;
        }
        if (user.role !== 'community' && user.role !== 'admin') {
          showToast(`Only verified Community Partners and Administrators can publish community drives. Your account is '${user.roleLabel}'.`, 'error');
          return;
        }
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

    // Footer Admin Portal link (strictly role-gated)
    const footerAdminPortalLink = document.getElementById('footerAdminPortalLink');
    if (footerAdminPortalLink) {
      footerAdminPortalLink.addEventListener('click', (e) => {
        e.preventDefault();
        const user = stateManager.getCurrentUser();
        if (user && user.role === 'admin') {
          switchView('dashboard');
          showToast('Welcome to the System Administration Console.', 'info');
        } else if (user) {
          showToast(`Access Denied: System Administrator privileges required. Your account is logged in as '${user.roleLabel}'.`, 'error');
          switchView('dashboard');
        } else {
          showToast('Access Denied: Please sign in with an authorized Administrator account.', 'info');
          openAuthModal('login');
        }
      });
    }

    // Direct URL hash synchronization & back/forward button support
    window.addEventListener('hashchange', () => {
      const hash = window.location.hash.slice(1);
      if (hash && views[hash]) {
        switchView(hash);
      }
    });

    // Handle initial URL hash on startup
    const initialHash = window.location.hash.slice(1);
    if (initialHash && views[initialHash]) {
      switchView(initialHash);
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
    const authStatusMessage = document.getElementById('authStatusMessage');

    function setAuthMessage(text, type = 'error') {
      if (!authStatusMessage) return;
      if (!text) {
        authStatusMessage.style.display = 'none';
        authStatusMessage.className = 'auth-message';
        authStatusMessage.textContent = '';
        return;
      }
      authStatusMessage.className = `auth-message ${type}`;
      authStatusMessage.textContent = text;
      authStatusMessage.style.display = 'block';
    }

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
        updateNavigationForRole('guest');
        showToast('You have signed out securely.', 'info');
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
    if (authTabLogin && authTabRegister) {
      authTabLogin.addEventListener('click', () => {
        authTabLogin.classList.add('active');
        authTabRegister.classList.remove('active');
        if (loginForm) loginForm.style.display = 'block';
        if (registerForm) registerForm.style.display = 'none';
        document.getElementById('authModalTitle').textContent = 'Sign In to ShikshaShare';
        setAuthMessage('');
      });

      authTabRegister.addEventListener('click', () => {
        authTabRegister.classList.add('active');
        authTabLogin.classList.remove('active');
        if (loginForm) loginForm.style.display = 'none';
        if (registerForm) registerForm.style.display = 'block';
        document.getElementById('authModalTitle').textContent = 'Join ShikshaShare Community';
        setAuthMessage('');
      });
    }

    // Password Show/Hide Toggle Buttons
    document.querySelectorAll('.password-toggle-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetId = btn.getAttribute('data-toggle-target');
        const input = document.getElementById(targetId);
        if (!input) return;
        const isPassword = input.type === 'password';
        input.type = isPassword ? 'text' : 'password';
        const eyeShow = btn.querySelector('.eye-show');
        const eyeHide = btn.querySelector('.eye-hide');
        if (eyeShow && eyeHide) {
          eyeShow.style.display = isPassword ? 'none' : 'block';
          eyeHide.style.display = isPassword ? 'block' : 'none';
        }
      });
    });

    // Forgot Password Link
    const forgotPasswordLink = document.getElementById('forgotPasswordLink');
    if (forgotPasswordLink) {
      forgotPasswordLink.addEventListener('click', (e) => {
        e.preventDefault();
        const identifier = document.getElementById('loginIdentifier')?.value.trim();
        if (identifier) {
          setAuthMessage(`Password recovery link has been dispatched to: ${identifier}`, 'info');
          showToast(`Password reset link dispatched to ${identifier}`, 'info');
        } else {
          setAuthMessage('Please enter your Email ID or Mobile Number above to receive password reset instructions.', 'info');
          document.getElementById('loginIdentifier')?.focus();
        }
      });
    }

    // Login Form Submit (Direct backend authentication with role dispatch)
    if (loginForm) {
      loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        setAuthMessage('');
        const identifier = document.getElementById('loginIdentifier')?.value.trim() || '';
        const password = document.getElementById('loginPassword')?.value || '';

        if (!identifier || !password) {
          setAuthMessage('Please provide both your Email ID / Mobile Number and password.', 'error');
          return;
        }

        const result = await stateManager.login(identifier, password);
        if (result.success && result.user) {
          closeModal('authModal');
          loginForm.reset();
          updateNavigationForRole(result.user.role);
          showToast(`Welcome back, ${result.user.name}! (${result.user.roleLabel})`, 'success');
          // Automatically route to user's assigned role dashboard
          switchView('dashboard');
        } else {
          setAuthMessage(result.error || 'Authentication failed. Please verify credentials and try again.', 'error');
        }
      });
    }


    // Register Form Submit (Role validation and dynamic role assignment)
    if (registerForm) {
      registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        setAuthMessage('');
        const name = document.getElementById('regName')?.value.trim() || '';
        const email = document.getElementById('regEmail')?.value.trim() || '';
        const mobile = document.getElementById('regMobile')?.value.trim() || '';
        const role = document.getElementById('regRole')?.value || '';
        const password = document.getElementById('regPassword')?.value || '';
        const confirmPassword = document.getElementById('regConfirmPassword')?.value || '';

        if (!name || !email || !mobile || !password || !confirmPassword) {
          setAuthMessage('Please fill in all required registration fields.', 'error');
          return;
        }

        if (!role) {
          setAuthMessage('Please select your role from the dropdown (Student, Resource Provider, or Community Partner).', 'error');
          return;
        }

        if (role === 'admin') {
          setAuthMessage('System Administrator accounts cannot be created via public registration.', 'error');
          return;
        }

        if (password.length < 6) {
          setAuthMessage('Password must be at least 6 characters long.', 'error');
          return;
        }

        if (password !== confirmPassword) {
          setAuthMessage('Passwords do not match. Please verify and re-enter.', 'error');
          return;
        }

        const result = await stateManager.register({
          name,
          email,
          mobile,
          password,
          role
        });

        if (result.success && result.user) {
          closeModal('authModal');
          registerForm.reset();
          updateNavigationForRole(result.user.role);
          showToast(`Account registered successfully as ${result.user.roleLabel}! Welcome to ShikshaShare, ${result.user.name}!`, 'success');
          // Open dashboard for user's assigned role
          switchView('dashboard');
        } else {
          setAuthMessage(result.error || 'Registration failed. Please try again.', 'error');
        }
      });
    }
  }

  function openAuthModal(mode = 'login') {
    const statusMsg = document.getElementById('authStatusMessage');
    if (statusMsg) {
      statusMsg.style.display = 'none';
      statusMsg.textContent = '';
      statusMsg.className = 'auth-message';
    }
    openModal('authModal');
    if (mode === 'register') {
      const regTab = document.getElementById('authTabRegister');
      if (regTab) regTab.click();
    } else {
      const loginTab = document.getElementById('authTabLogin');
      if (loginTab) loginTab.click();
    }
  }

  function initHeaderNotifications() {
    const notifBtn = document.getElementById('headerNotifBtn');
    const notifDropdown = document.getElementById('headerNotifDropdown');
    const notifBadge = document.getElementById('headerNotifBadge');
    const notifUnreadTag = document.getElementById('notifUnreadTag');
    const notifList = document.getElementById('headerNotifList');
    const markAllBtn = document.getElementById('notifMarkAllReadBtn');
    const notifWrap = document.getElementById('headerNotifWrap');

    function renderNotifications(data) {
      const notifications = Array.isArray(data?.notifications) ? data.notifications : stateManager.getNotifications();
      const unreadCount = data?.unreadCount !== undefined ? data.unreadCount : notifications.filter(n => !n.read).length;

      if (notifBadge) {
        if (unreadCount > 0) {
          notifBadge.style.display = 'flex';
          notifBadge.textContent = unreadCount > 99 ? '99+' : String(unreadCount);
        } else {
          notifBadge.style.display = 'none';
        }
      }

      if (notifUnreadTag) {
        notifUnreadTag.textContent = `${unreadCount} new`;
      }

      if (notifList) {
        if (!notifications || notifications.length === 0) {
          notifList.innerHTML = '<div class="notif-empty-state">No notifications yet</div>';
          return;
        }

        notifList.innerHTML = notifications.map(n => {
          const isUnread = !n.read;
          const timeStr = n.timestamp ? new Date(n.timestamp).toLocaleDateString(undefined, {
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
          }) : '';

          return `
            <div class="notif-item ${isUnread ? 'unread' : ''}" data-notif-id="${n.id}">
              <div class="notif-icon-bubble">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                  <line x1="3" y1="6" x2="21" y2="6"></line>
                  <path d="M16 10a4 4 0 0 1-8 0"></path>
                </svg>
              </div>
              <div class="notif-content">
                <div class="notif-title">${escapeHTML(n.resourceTitle || 'Resource Item')}</div>
                <div class="notif-message">${escapeHTML(n.message || `Purchase request for ₹${n.price || 0}`)}</div>
                <div class="notif-meta">
                  <span>${timeStr}</span>
                  ${n.price ? `<strong style="color: var(--color-primary);">₹${n.price}</strong>` : ''}
                </div>
              </div>
              ${isUnread ? '<div class="notif-unread-dot" title="Unread notification"></div>' : ''}
            </div>
          `;
        }).join('');

        notifList.querySelectorAll('.notif-item').forEach(item => {
          item.addEventListener('click', async () => {
            const notifId = item.getAttribute('data-notif-id');
            if (notifId) {
              await stateManager.markNotificationAsRead(notifId);
              item.classList.remove('unread');
              const dot = item.querySelector('.notif-unread-dot');
              if (dot) dot.remove();
            }
          });
        });
      }
    }

    if (notifBtn && notifDropdown) {
      notifBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isVisible = notifDropdown.style.display !== 'none';
        notifDropdown.style.display = isVisible ? 'none' : 'block';
        if (!isVisible) {
          stateManager.fetchNotifications().then(renderNotifications);
        }
      });

      document.addEventListener('click', (e) => {
        if (notifWrap && !notifWrap.contains(e.target)) {
          notifDropdown.style.display = 'none';
        }
      });
    }

    if (markAllBtn) {
      markAllBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        await stateManager.markAllNotificationsAsRead();
        const notifs = stateManager.getNotifications();
        renderNotifications({ unreadCount: 0, notifications: notifs });
      });
    }

    window.addEventListener('shikshashare:notificationsUpdated', (e) => {
      renderNotifications(e.detail);
    });

    const user = stateManager.getCurrentUser();
    if (user) {
      stateManager.fetchNotifications().then(renderNotifications);
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
        if (avatarEl) avatarEl.textContent = getInitials(user.name);
        stateManager.fetchNotifications();
      } else {
        authLoggedOut.style.display = 'flex';
        authLoggedIn.style.display = 'none';
        const badge = document.getElementById('headerNotifBadge');
        if (badge) badge.style.display = 'none';
        const dropdown = document.getElementById('headerNotifDropdown');
        if (dropdown) dropdown.style.display = 'none';
      }
    }

    // Synchronize navigation visibility with active user role
    updateNavigationForRole(user ? user.role : 'guest');
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

    // Strictly use actual uploaded photos; no random stock substitution
    const photoList = Array.isArray(res.images) && res.images.length > 0
      ? res.images
      : (res.image ? [res.image] : []);
    const mainPhoto = photoList[0] || 'assets/logo.png';
    const hasMultiplePhotos = photoList.length > 1;

    return `
      <div class="resource-card" data-res-id="${res.id}">
        <div class="resource-image-wrap">
          <img src="${mainPhoto}" alt="${escapeHTML(res.title)}" loading="lazy">
          <div class="resource-pill-overlay">
            ${isFree
              ? '<span class="badge badge-free">100% Free / Donated</span>'
              : `<span class="badge badge-price">For Sale • ₹${res.price}</span>`
            }
          </div>
          ${hasMultiplePhotos ? `
            <div class="resource-photo-count-pill" title="${photoList.length} photos available">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                <polyline points="21 15 16 10 5 21"></polyline>
              </svg>
              <span>${photoList.length} photos</span>
            </div>
          ` : ''}
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
          <button class="btn btn-outline btn-sm btn-contact-partner" data-partner-name="${escapeHTML(p.name)}" style="margin-top: 12px; width: 100%;">
            Contact Partner
          </button>
        </div>
      `).join('');

      partnersGrid.querySelectorAll('.btn-contact-partner').forEach(btn => {
        btn.addEventListener('click', () => {
          const name = btn.getAttribute('data-partner-name');
          openContactPartnerModal(name);
        });
      });
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

    // Strictly use actual uploaded photos of this resource
    const photoList = Array.isArray(res.images) && res.images.length > 0
      ? res.images
      : (res.image ? [res.image] : ['assets/logo.png']);
    const hasMultiple = photoList.length > 1;

    modalResBody.innerHTML = `
      <div class="product-detail-layout">
        <!-- Amazon/Flipkart Style Photo Gallery -->
        <div class="product-gallery">
          <div class="gallery-main-wrap">
            <img id="detailMainPhoto" class="gallery-main-img" src="${photoList[0]}" alt="${escapeHTML(res.title)}">
            ${hasMultiple ? `<span id="detailPhotoIndicator" class="gallery-photo-indicator">Photo 1 of ${photoList.length}</span>` : ''}
          </div>

          ${hasMultiple ? `
            <div class="gallery-thumbnails-strip" id="detailThumbnailsStrip" role="tablist" aria-label="Resource photo thumbnails">
              ${photoList.map((photo, idx) => `
                <button type="button" class="gallery-thumb-btn ${idx === 0 ? 'active' : ''}" data-photo-idx="${idx}" aria-label="View photo ${idx + 1} of ${photoList.length}">
                  <img src="${photo}" alt="Thumbnail ${idx + 1}">
                </button>
              `).join('')}
            </div>
          ` : ''}
        </div>

        <!-- Product Information & Specifications -->
        <div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; flex-wrap: wrap; gap: 6px;">
            ${isFree
              ? '<span class="badge badge-free" style="font-size: 0.85rem; padding: 4px 10px;">100% Free / Donated</span>'
              : `<span class="badge badge-price" style="font-size: 0.85rem; padding: 4px 10px;">For Sale • ₹${res.price}</span>`
            }
            <span style="font-size: 0.82rem; color: var(--text-muted);">Added on ${res.dateAdded || 'Recently'}</span>
          </div>

          <h2 style="font-size: 1.25rem; font-weight: 700; margin-bottom: 8px; color: var(--text-heading);">${escapeHTML(res.title)}</h2>
          <p style="color: var(--text-body); line-height: 1.6; margin-bottom: 16px;">${escapeHTML(res.description || 'Verified actual educational resource listing on ShikshaShare.')}</p>

          <div style="background-color: var(--bg-surface-subtle); padding: 14px; border-radius: var(--radius-md); border: 1px solid var(--border-color); display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 0.84rem;">
            <div><strong>Education Level:</strong> ${formatEduLevel(res.educationLevel)}</div>
            <div><strong>Condition:</strong> ${escapeHTML(res.condition || 'Good')}</div>
            ${res.branch ? `<div><strong>Branch:</strong> ${escapeHTML(res.branch)}</div>` : ''}
            ${res.semester ? `<div><strong>Semester:</strong> ${escapeHTML(res.semester)}</div>` : ''}
            <div><strong>Resource Provider:</strong> ${escapeHTML(res.providerName)}</div>
            <div><strong>Pickup Location:</strong> ${escapeHTML(res.location)}</div>
          </div>
        </div>
      </div>
    `;

    // Interactive thumbnail switching (Amazon / Flipkart behavior)
    if (hasMultiple) {
      const mainImg = document.getElementById('detailMainPhoto');
      const indicator = document.getElementById('detailPhotoIndicator');
      const thumbBtns = modalResBody.querySelectorAll('.gallery-thumb-btn');

      const switchPhoto = (idx) => {
        if (!photoList[idx]) return;
        mainImg.style.opacity = '0.4';
        setTimeout(() => {
          mainImg.src = photoList[idx];
          mainImg.style.opacity = '1';
        }, 50);

        if (indicator) {
          indicator.textContent = `Photo ${idx + 1} of ${photoList.length}`;
        }

        thumbBtns.forEach((btn, bIdx) => {
          btn.classList.toggle('active', bIdx === idx);
        });
      };

      thumbBtns.forEach((btn) => {
        const idx = parseInt(btn.getAttribute('data-photo-idx'), 10);
        btn.addEventListener('click', () => switchPhoto(idx));
        btn.addEventListener('mouseenter', () => switchPhoto(idx));
      });
    }

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

    const donatePhotoCtrl = createPhotoUploadController({
      dropzoneEl: document.getElementById('donatePhotoDropzone'),
      fileInputEl: document.getElementById('donatePhotosInput'),
      previewGridEl: document.getElementById('donatePhotoPreviewGrid'),
      errorEl: document.getElementById('donatePhotoError'),
      maxPhotos: 6
    });

    if (donateForm) {
      donateForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // 1. Mandatory Photo Check
        const photoCheck = donatePhotoCtrl.validate();
        if (!photoCheck.valid) {
          donatePhotoCtrl.showError(photoCheck.error);
          const dropzone = document.getElementById('donatePhotoDropzone');
          if (dropzone) dropzone.scrollIntoView({ behavior: 'smooth', block: 'center' });
          showToast(photoCheck.error, 'error');
          return;
        }

        const category = document.getElementById('donateCategory').value;
        const title = document.getElementById('donateTitle').value.trim();
        const educationLevel = document.getElementById('donateEducationLevel').value;
        const condition = document.getElementById('donateCondition').value;
        const description = document.getElementById('donateDescription').value.trim();
        const quantity = Number(document.getElementById('donateQuantity').value) || 1;
        const location = document.getElementById('donateLocation').value.trim();
        const linkedNeedId = document.getElementById('donateLinkedNeed').value;

        const uploadedPhotos = donatePhotoCtrl.getPhotos();

        await stateManager.submitDonation({
          title,
          category,
          educationLevel,
          condition,
          description,
          quantity,
          location,
          linkedNeedId,
          image: uploadedPhotos[0],
          images: uploadedPhotos
        });

        donatePhotoCtrl.clear();

        // Show thank you message
        donateForm.style.display = 'none';
        donateThankYouBox.style.display = 'block';
      });
    }

    if (donateAnotherBtn) {
      donateAnotherBtn.addEventListener('click', () => {
        donatePhotoCtrl.clear();
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
    document.getElementById('dashAvatar').textContent = user ? getInitials(user.name) : 'SP';
    document.getElementById('dashGreeting').textContent = user ? `Welcome, ${user.name}` : 'Welcome back';
    document.getElementById('dashRoleBadge').textContent = user ? user.roleLabel : 'Student';
    document.getElementById('dashSubtitle').textContent = user?.institution || user?.location || 'ShikshaShare Academic Community';

    // Hide all dashboard panels first
    document.querySelectorAll('.role-dash-panel').forEach(p => p.style.display = 'none');

    const actionWrap = document.getElementById('dashContextActionWrap');
    actionWrap.innerHTML = '';

    if (role === 'student') {
      renderStudentDashboard(actionWrap);
    } else if (role === 'provider' || role === 'donor') {
      renderProviderDashboard(actionWrap);
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
    const dashPersonalizeBtn = document.getElementById('dashPersonalizeBtn');
    if (dashPersonalizeBtn) dashPersonalizeBtn.addEventListener('click', openPersonalizeModal);

    const profile = stateManager.getStudentProfile();
    const curriculumDisplay = document.getElementById('studentCurriculumDisplay');
    if (curriculumDisplay) {
      curriculumDisplay.textContent = `${formatEduLevel(profile.level)} • ${profile.branch || profile.stream || 'General'} • ${profile.semester || ''}`;
    }

    // Recommended for student syllabus
    const recGrid = document.getElementById('studentRecommendedGrid');
    if (recGrid) {
      const allResources = stateManager.getResources();
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
      const user = stateManager.getCurrentUser();
      const allRequests = stateManager.getUserRequests();
      const requests = user
        ? allRequests.filter(r => !r.studentId || r.studentId === user.id || r.studentName === user.name)
        : allRequests;

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

    // Saved Resources (Wishlist) for student
    const savedGrid = document.getElementById('studentSavedGrid');
    if (savedGrid) {
      const savedIds = stateManager.getSavedItems();
      const allResources = stateManager.getResources();
      const savedResources = allResources.filter(r => savedIds.includes(r.id));

      if (savedResources.length === 0) {
        savedGrid.innerHTML = `
          <div style="grid-column: 1 / -1; text-align: center; padding: 32px 16px; background: #ffffff; border: 1px dashed var(--border-color); border-radius: 12px;">
            <p style="color: var(--text-muted); margin-bottom: 12px; font-size: 0.95rem;">You haven't bookmarked any resources yet.</p>
            <button class="btn btn-outline btn-sm" id="studentBrowseToSaveBtn">Browse Resources to Bookmark</button>
          </div>
        `;
        const browseBtn = document.getElementById('studentBrowseToSaveBtn');
        if (browseBtn) browseBtn.addEventListener('click', () => switchView('resources'));
      } else {
        savedGrid.innerHTML = savedResources.map(r => createResourceCardHTML(r)).join('');
        attachResourceCardEvents(savedGrid);
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

  // 2. Resource Provider Dashboard
  function renderProviderDashboard(actionWrap) {
    const panel = document.getElementById('dashContentProvider');
    if (!panel) return;
    panel.style.display = 'block';

    actionWrap.innerHTML = `
      <button class="btn btn-primary btn-sm" id="dashAddListingBtn">+ Add New Resource</button>
      <button class="btn btn-accent btn-sm" id="dashDonateBtn" style="margin-left: 8px;">+ Donate to Community</button>
    `;
    const dashAddListingBtn = document.getElementById('dashAddListingBtn');
    if (dashAddListingBtn) dashAddListingBtn.addEventListener('click', () => openModal('providerAddListingModal'));
    const dashDonateBtn = document.getElementById('dashDonateBtn');
    if (dashDonateBtn) dashDonateBtn.addEventListener('click', () => switchView('donate'));
    const providerAddListingBtn = document.getElementById('providerAddListingBtn');
    if (providerAddListingBtn) providerAddListingBtn.addEventListener('click', () => openModal('providerAddListingModal'));

    // Provider's active listings - Strictly user's own listings only
    const user = stateManager.getCurrentUser();
    const allResources = stateManager.getResources();
    const myListings = user ? allResources.filter(r => r.providerId === user.id) : [];

    const countEl = document.getElementById('providerListingsCount');
    if (countEl) countEl.textContent = myListings.length;

    const grid = document.getElementById('providerListingsGrid');
    if (grid) {
      if (myListings.length === 0) {
        grid.innerHTML = `
          <div style="grid-column: 1 / -1; text-align: center; padding: 36px 16px; background: #ffffff; border: 1px dashed var(--border-color); border-radius: 12px;">
            <p style="color: var(--text-muted); font-size: 0.95rem; margin-bottom: 12px;">You have no active resource listings yet.</p>
            <button class="btn btn-primary btn-sm" id="providerEmptyAddBtn">+ Add Your First Listing</button>
          </div>
        `;
        const emptyAddBtn = document.getElementById('providerEmptyAddBtn');
        if (emptyAddBtn) emptyAddBtn.addEventListener('click', () => openModal('providerAddListingModal'));
      } else {
        grid.innerHTML = myListings.map(r => {
          const photoList = Array.isArray(r.images) && r.images.length > 0
            ? r.images
            : (r.image ? [r.image] : ['assets/logo.png']);
          const mainImg = photoList[0];
          const hasMultiple = photoList.length > 1;

          return `
          <div class="resource-card" data-resource-id="${r.id}">
            <div class="resource-img-wrap" style="position: relative;">
              <img src="${mainImg}" alt="${escapeHTML(r.title)}" loading="lazy">
              <span class="resource-type-pill ${r.type === 'free' ? 'pill-free' : 'pill-price'}">
                ${r.type === 'free' ? 'Free' : `₹${r.price}`}
              </span>
              ${hasMultiple ? `
                <span class="resource-photo-count-pill" style="bottom: 6px; right: 6px; font-size: 0.68rem; padding: 2px 6px;">
                  📷 ${photoList.length} photos
                </span>
              ` : ''}
            </div>
            <div class="resource-content">
              <div class="resource-header-row">
                <span class="badge ${r.availability && r.availability.includes('Available') ? 'badge-verified' : 'badge-partner'}">${escapeHTML(r.availability || 'Available')}</span>
                <span style="font-size: 0.78rem; color: var(--text-muted);">${r.dateAdded || ''}</span>
              </div>
              <h3 class="resource-title" style="margin-top: 8px;">${escapeHTML(r.title)}</h3>
              <p class="resource-desc">${escapeHTML(r.description || '')}</p>
              <div style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 14px;">
                <strong>Condition:</strong> ${escapeHTML(r.condition || 'Good')} • <strong>Location:</strong> ${escapeHTML(r.location || 'Campus')}
              </div>
              <div style="display: flex; gap: 8px; margin-top: auto;">
                <button class="btn btn-outline btn-sm btn-edit-listing" data-edit-id="${r.id}" style="flex: 1;">Edit Listing</button>
                <button class="btn btn-outline btn-sm btn-delete-listing" data-delete-id="${r.id}" style="color: #dc2626; border-color: #fca5a5;">Remove</button>
              </div>
            </div>
          </div>
        `;
        }).join('');

        // Attach Delete listing events
        grid.querySelectorAll('.btn-delete-listing').forEach(btn => {
          btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = btn.getAttribute('data-delete-id');
            if (confirm('Are you sure you want to remove this resource listing from ShikshaShare?')) {
              try {
                stateManager.deleteResource(id);
                showToast('Resource listing removed successfully.', 'success');
                renderProviderDashboard(actionWrap);
              } catch (err) {
                showToast(err.message, 'error');
              }
            }
          });
        });

        // Attach Edit listing events
        grid.querySelectorAll('.btn-edit-listing').forEach(btn => {
          btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = btn.getAttribute('data-edit-id');
            const target = stateManager.getResourceById(id);
            if (!target) return;

            const newTitle = prompt('Edit Resource Title:', target.title);
            if (newTitle === null) return;
            const newPrice = target.type === 'free' ? 0 : prompt('Edit Price (₹):', target.price);
            if (newPrice === null) return;
            const newLocation = prompt('Edit Pickup Location:', target.location);
            if (newLocation === null) return;

            try {
              stateManager.updateResource(id, {
                title: newTitle.trim() || target.title,
                price: Number(newPrice) || 0,
                location: newLocation.trim() || target.location
              });
              showToast('Resource listing updated successfully.', 'success');
              renderProviderDashboard(actionWrap);
            } catch (err) {
              showToast(err.message, 'error');
            }
          });
        });
      }
    }

    // Provider Enquiries and Purchase Requests Table
    const inqTable = document.getElementById('providerInquiriesTableBody');
    if (inqTable) {
      const userRequests = stateManager.getUserRequests();
      const myInquiries = user
        ? userRequests.filter(r => r.providerId === user.id)
        : [];

      const inqCountEl = document.getElementById('providerInquiriesCount');
      if (inqCountEl) inqCountEl.textContent = myInquiries.length;

      if (myInquiries.length === 0) {
        inqTable.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 24px;">No student enquiries or purchase requests received yet for your listings.</td></tr>';
      } else {
        inqTable.innerHTML = myInquiries.map(req => `
          <tr>
            <td><strong>${escapeHTML(req.resourceTitle || 'Resource Item')}</strong></td>
            <td>${escapeHTML(req.studentName || 'Student Requester')}</td>
            <td><span class="badge ${req.type === 'free_claim' ? 'badge-free' : 'badge-price'}">${req.type === 'free_claim' ? 'Free Claim' : 'Purchase Offer'}</span></td>
            <td><span class="badge badge-partner" id="req-status-${req.id}">${escapeHTML(req.status)}</span></td>
            <td>${req.date}</td>
            <td>
              <button class="btn btn-outline btn-sm btn-accept-req" data-req-id="${req.id}" style="padding: 4px 8px; font-size: 0.76rem;">Accept &amp; Coordinate</button>
            </td>
          </tr>
        `).join('');

        inqTable.querySelectorAll('.btn-accept-req').forEach(btn => {
          btn.addEventListener('click', () => {
            const reqId = btn.getAttribute('data-req-id');
            const targetReq = stateManager.updateRequestStatus(reqId, 'Handover Scheduled - Contact Shared');
            if (targetReq) {
              const statusEl = document.getElementById(`req-status-${reqId}`);
              if (statusEl) statusEl.textContent = targetReq.status;
              showToast('Student offer accepted! Contact details shared for campus collection.', 'success');
            }
          });
        });
      }
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
      const user = stateManager.getCurrentUser();
      const allRequests = stateManager.getUserRequests();
      const userRequests = allRequests.filter(r =>
        r.type === 'community_pledge' ||
        (user && (r.studentId === user.id || r.donorName === user.name)) ||
        r.amount === 0
      );

      const donorCountEl = document.getElementById('donorTotalCount');
      if (donorCountEl) donorCountEl.textContent = userRequests.length > 0 ? userRequests.length : 8;

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

    // Record Distribution button
    const partnerAddDistBtn = document.getElementById('partnerAddDistBtn');
    if (partnerAddDistBtn) {
      partnerAddDistBtn.addEventListener('click', () => {
        openRecordDistributionModal();
      });
    }

    const user = stateManager.getCurrentUser();
    const reqs = stateManager.getCommunityRequirements();
    const myReqs = reqs.filter(r =>
      (user && (r.organizationId === user.id || r.organizationName === user.organizationName || r.organizationName === user.name)) ||
      (!user && r.organizationType?.includes('NSS'))
    );

    const partnerGrid = document.getElementById('partnerMyRequirementsGrid');
    if (partnerGrid) {
      const displayReqs = myReqs.length > 0 ? myReqs : reqs;
      partnerGrid.innerHTML = displayReqs.map(r => createCommunityReqCardHTML(r)).join('');
      attachCommunityCardEvents(partnerGrid);
    }

    // Distributions Log
    const distTable = document.getElementById('partnerDistributionsTableBody');
    if (distTable) {
      const dists = stateManager.getDistributions();
      if (dists.length === 0) {
        distTable.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 20px;">No beneficiary distributions recorded yet. Click "+ Record Distribution" above.</td></tr>';
      } else {
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
  }

  // 5. Admin Console Dashboard
  function renderAdminDashboard(actionWrap) {
    const user = stateManager.getCurrentUser();
    // Security check: non-admin users cannot access admin dashboard
    if (!user || user.role !== 'admin') {
      showToast('Access Denied: System Administrator privileges required.', 'error');
      return switchView(user ? 'dashboard' : 'home');
    }

    const panel = document.getElementById('dashContentAdmin');
    if (!panel) return;
    panel.style.display = 'block';

    actionWrap.innerHTML = `
      <button class="btn btn-outline btn-sm" id="dashAdminExportBtn">Generate CEP Report</button>
    `;
    const dashAdminExportBtn = document.getElementById('dashAdminExportBtn');
    if (dashAdminExportBtn) {
      dashAdminExportBtn.addEventListener('click', async () => {
        const report = await stateManager.fetchAdminReport();
        openAdminReportModal(report);
      });
    }

    const resources = stateManager.getResources();
    const countEl = document.getElementById('adminTotalResources');
    if (countEl) countEl.textContent = resources.length;

    // Moderation queue table
    const modTable = document.getElementById('adminModerationTableBody');
    if (modTable) {
      modTable.innerHTML = resources.slice(0, 6).map(r => {
        const isVerified = r.moderationStatus === 'verified' || !r.moderationStatus;
        return `
          <tr>
            <td><strong>${escapeHTML(r.title)}</strong></td>
            <td>${formatEduLevel(r.category)}</td>
            <td>${formatEduLevel(r.educationLevel)}</td>
            <td><span class="badge ${r.type === 'free' ? 'badge-free' : 'badge-price'}">${r.type === 'free' ? 'Free' : `₹${r.price}`}</span></td>
            <td>${escapeHTML(r.providerName)}</td>
            <td>
              <span class="badge ${isVerified ? 'badge-verified' : 'badge-price'}" id="mod-badge-${r.id}">${isVerified ? 'Approved' : 'Flagged'}</span>
            </td>
            <td>
              <button class="btn btn-ghost btn-sm btn-toggle-mod" data-res-id="${r.id}" data-current="${isVerified ? 'verified' : 'flagged'}" style="padding: 2px 6px; font-size: 0.75rem;">
                ${isVerified ? 'Flag' : 'Approve'}
              </button>
            </td>
          </tr>
        `;
      }).join('');

      modTable.querySelectorAll('.btn-toggle-mod').forEach(btn => {
        btn.addEventListener('click', async () => {
          const resId = btn.getAttribute('data-res-id');
          const current = btn.getAttribute('data-current');
          const next = current === 'verified' ? 'flagged' : 'verified';
          await stateManager.updateModerationStatus(resId, next);
          btn.setAttribute('data-current', next);
          btn.textContent = next === 'verified' ? 'Flag' : 'Approve';
          const badgeEl = document.getElementById(`mod-badge-${resId}`);
          if (badgeEl) {
            badgeEl.className = `badge ${next === 'verified' ? 'badge-verified' : 'badge-price'}`;
            badgeEl.textContent = next === 'verified' ? 'Approved' : 'Flagged';
          }
          showToast(`Resource status set to '${next}'.`, 'info');
        });
      });
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

    // User & Role Management Table
    const usersTable = document.getElementById('adminUsersTableBody');
    if (usersTable) {
      const allUsers = stateManager.getRegisteredUsers();

      usersTable.innerHTML = allUsers.map(u => `
        <tr>
          <td><strong>${escapeHTML(u.name)}</strong></td>
          <td>${escapeHTML(u.email || u.mobile || 'N/A')}</td>
          <td><span class="badge badge-partner" id="role-badge-${u.id}">${escapeHTML(u.roleLabel || u.role)}</span></td>
          <td>${escapeHTML(u.institution || u.location || 'Mumbai')}</td>
          <td><span class="badge badge-verified">Active</span></td>
          <td>
            <select class="form-select form-select-sm admin-role-select" data-user-id="${u.id}" style="padding: 4px 8px; font-size: 0.8rem; border-radius: 6px; border: 1px solid var(--border-color);">
              <option value="student" ${u.role === 'student' ? 'selected' : ''}>Student</option>
              <option value="provider" ${u.role === 'provider' ? 'selected' : ''}>Resource Provider</option>
              <option value="community" ${u.role === 'community' ? 'selected' : ''}>Community Partner</option>
              <option value="admin" ${u.role === 'admin' ? 'selected' : ''}>System Administrator</option>
            </select>
          </td>
        </tr>
      `).join('');

      // Wire up role change dropdown
      usersTable.querySelectorAll('.admin-role-select').forEach(sel => {
        sel.addEventListener('change', async (e) => {
          const targetUserId = sel.getAttribute('data-user-id');
          const newRole = e.target.value;
          await stateManager.updateUserRole(targetUserId, newRole);

          const badgeEl = document.getElementById(`role-badge-${targetUserId}`);
          if (badgeEl) badgeEl.textContent = stateManager.getRoleLabel(newRole);

          showToast(`User role updated to '${stateManager.getRoleLabel(newRole)}'.`, 'success');
        });
      });
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
      providerPhotoCtrl = createPhotoUploadController({
        dropzoneEl: document.getElementById('listingPhotoDropzone'),
        fileInputEl: document.getElementById('listingPhotosInput'),
        previewGridEl: document.getElementById('listingPhotoPreviewGrid'),
        errorEl: document.getElementById('listingPhotoError'),
        maxPhotos: 6
      });

      const listingType = document.getElementById('listingType');
      const listingCondition = document.getElementById('listingCondition');
      const listingOriginalPrice = document.getElementById('listingOriginalPrice');
      const listingPurchaseDate = document.getElementById('listingPurchaseDate');
      const listingPriceInput = document.getElementById('listingPrice');
      const listingSaleSection = document.getElementById('listingSalePricingSection');
      const priceLimitCallout = document.getElementById('priceLimitCallout');
      const priceLimitBadge = document.getElementById('priceLimitBadge');
      const priceLimitMaxText = document.getElementById('priceLimitMaxText');
      const priceLimitDetailsText = document.getElementById('priceLimitDetailsText');
      const listingPriceError = document.getElementById('listingPriceError');

      if (listingPurchaseDate) {
        listingPurchaseDate.max = new Date().toISOString().split('T')[0];
      }

      function updatePriceLimitLiveUI() {
        const isFree = listingType ? listingType.value === 'free' : false;
        if (isFree) {
          if (listingSaleSection) listingSaleSection.style.display = 'none';
          if (priceLimitCallout) priceLimitCallout.style.display = 'none';
          if (listingPriceInput) {
            listingPriceInput.value = '0';
            listingPriceInput.removeAttribute('required');
          }
          if (listingPriceError) listingPriceError.style.display = 'none';
          return;
        }

        if (listingSaleSection) listingSaleSection.style.display = 'block';
        if (listingPriceInput) listingPriceInput.setAttribute('required', 'required');

        const condition = listingCondition ? listingCondition.value : 'Good';
        const origPrice = Number(listingOriginalPrice ? listingOriginalPrice.value : 0);
        const purchaseDate = listingPurchaseDate ? listingPurchaseDate.value : '';

        // Check Poor / Damaged condition first
        if (condition.includes('Poor') || condition.includes('Damaged')) {
          if (priceLimitCallout) {
            priceLimitCallout.style.display = 'block';
            priceLimitCallout.className = 'price-limit-callout blocked';
            if (priceLimitBadge) priceLimitBadge.textContent = 'Listing Blocked';
            if (priceLimitMaxText) priceLimitMaxText.textContent = 'Cannot Be Sold';
            if (priceLimitDetailsText) {
              priceLimitDetailsText.innerHTML = '<strong>Review Required:</strong> Poor or damaged items cannot be sold until reviewed by the platform moderation team.';
            }
          }
          if (listingPriceError) {
            listingPriceError.style.display = 'block';
            listingPriceError.textContent = 'Poor/Damaged items cannot be sold until reviewed.';
          }
          return;
        }

        if (!origPrice || !purchaseDate) {
          if (priceLimitCallout) {
            priceLimitCallout.style.display = 'block';
            priceLimitCallout.className = 'price-limit-callout';
            if (priceLimitBadge) priceLimitBadge.textContent = 'Automatic Price Limit';
            if (priceLimitMaxText) priceLimitMaxText.textContent = 'Enter original price & date';
            if (priceLimitDetailsText) {
              priceLimitDetailsText.textContent = 'Enter your item\'s original purchase price and purchase date to determine the maximum permissible price for students.';
            }
          }
          if (listingPriceError) listingPriceError.style.display = 'none';
          return;
        }

        const calc = PriceCalculator.calculateMaxPrice({
          originalPrice: origPrice,
          purchaseDate,
          condition,
          type: 'buy'
        });

        if (!calc.allowed) {
          if (priceLimitCallout) {
            priceLimitCallout.style.display = 'block';
            priceLimitCallout.className = 'price-limit-callout blocked';
            if (priceLimitBadge) priceLimitBadge.textContent = 'Invalid Input';
            if (priceLimitMaxText) priceLimitMaxText.textContent = 'Review Details';
            if (priceLimitDetailsText) priceLimitDetailsText.textContent = calc.error || 'Please provide a valid purchase date and price.';
          }
          if (listingPriceError) {
            listingPriceError.style.display = 'block';
            listingPriceError.textContent = calc.error;
          }
          return;
        }

        if (priceLimitCallout) {
          priceLimitCallout.style.display = 'block';
          priceLimitCallout.className = 'price-limit-callout valid';
          if (priceLimitBadge) priceLimitBadge.textContent = 'Fair Price Limit';
          if (priceLimitMaxText) priceLimitMaxText.textContent = `Max Allowed: ₹${calc.maxPrice}`;
          if (priceLimitDetailsText) {
            priceLimitDetailsText.innerHTML = `
              <div><strong>Formula:</strong> Original Price (₹${origPrice}) × Age Rate (${calc.ageLabel}) × Condition Rate (${calc.conditionLabel})</div>
              <div class="price-limit-breakdown">
                <span>Age: ${calc.monthsAge} months</span>
                <span>Age Rate: ${Math.round(calc.ageRate * 100)}%</span>
                <span>Condition Rate: ${Math.round(calc.conditionRate * 100)}%</span>
                <span>Max Price: <strong>₹${calc.maxPrice}</strong></span>
              </div>
            `;
          }
        }

        // Live check against entered selling price
        const currentPrice = Number(listingPriceInput?.value || 0);
        if (currentPrice > 0 && currentPrice > calc.maxPrice) {
          if (listingPriceError) {
            listingPriceError.style.display = 'block';
            listingPriceError.textContent = `Your asking price (₹${currentPrice}) exceeds the maximum permissible limit of ₹${calc.maxPrice}.`;
          }
        } else {
          if (listingPriceError) listingPriceError.style.display = 'none';
        }
      }

      if (listingType) listingType.addEventListener('change', updatePriceLimitLiveUI);
      if (listingCondition) listingCondition.addEventListener('change', updatePriceLimitLiveUI);
      if (listingOriginalPrice) {
        listingOriginalPrice.addEventListener('input', updatePriceLimitLiveUI);
        listingOriginalPrice.addEventListener('change', updatePriceLimitLiveUI);
      }
      if (listingPurchaseDate) {
        listingPurchaseDate.addEventListener('input', updatePriceLimitLiveUI);
        listingPurchaseDate.addEventListener('change', updatePriceLimitLiveUI);
      }
      if (listingPriceInput) {
        listingPriceInput.addEventListener('input', updatePriceLimitLiveUI);
        listingPriceInput.addEventListener('change', updatePriceLimitLiveUI);
      }

      providerForm.addEventListener('submit', (e) => {
        e.preventDefault();

        // 1. Mandatory Real Photo Validation
        const photoCheck = providerPhotoCtrl ? providerPhotoCtrl.validate() : { valid: true };
        if (!photoCheck.valid) {
          if (providerPhotoCtrl) providerPhotoCtrl.showError(photoCheck.error);
          const dropzone = document.getElementById('listingPhotoDropzone');
          if (dropzone) dropzone.scrollIntoView({ behavior: 'smooth', block: 'center' });
          showToast(photoCheck.error, 'error');
          return;
        }

        const title = document.getElementById('listingTitle').value.trim();
        const category = document.getElementById('listingCategory').value;
        const educationLevel = document.getElementById('listingEducationLevel').value;
        const type = document.getElementById('listingType').value;
        const condition = document.getElementById('listingCondition').value;
        const isFree = type === 'free';

        let price = 0;
        let originalPrice = 0;
        let purchaseDate = null;
        let maxPrice = 0;

        if (isFree) {
          price = 0;
          maxPrice = 0;
        } else {
          if (condition.includes('Poor') || condition.includes('Damaged')) {
            showToast('Poor/Damaged items cannot be sold until reviewed.', 'error');
            return;
          }

          originalPrice = Number(document.getElementById('listingOriginalPrice')?.value || 0);
          if (!originalPrice || originalPrice <= 0) {
            showToast('Please enter the original purchase price for items listed for sale.', 'error');
            return;
          }

          purchaseDate = document.getElementById('listingPurchaseDate')?.value;
          if (!purchaseDate) {
            showToast('Please select the purchase date to determine the price limit.', 'error');
            return;
          }

          const rawPrice = Number(document.getElementById('listingPrice')?.value || 0);
          if (!rawPrice || rawPrice <= 0) {
            showToast('Please enter an asking price greater than ₹0 for items listed for sale.', 'error');
            return;
          }

          const calc = PriceCalculator.calculateMaxPrice({
            originalPrice,
            purchaseDate,
            condition,
            type: 'buy'
          });

          if (!calc.allowed) {
            showToast(calc.error || 'Item cannot be sold with current parameters.', 'error');
            return;
          }

          if (rawPrice > calc.maxPrice) {
            showToast(`Selling price (₹${rawPrice}) cannot exceed the maximum permitted price of ₹${calc.maxPrice}.`, 'error');
            return;
          }

          price = rawPrice;
          maxPrice = calc.maxPrice;
        }

        const location = document.getElementById('listingLocation').value.trim();
        const description = document.getElementById('listingDescription').value.trim();
        const uploadedPhotos = providerPhotoCtrl ? providerPhotoCtrl.getPhotos() : [];

        try {
          stateManager.addResource({
            title,
            category,
            educationLevel,
            type: isFree ? 'free' : 'buy',
            price,
            originalPrice,
            purchaseDate,
            maxPrice,
            condition,
            location,
            description,
            image: uploadedPhotos[0],
            images: uploadedPhotos
          });

          if (providerPhotoCtrl) providerPhotoCtrl.clear();
          providerForm.reset();
          if (priceLimitCallout) priceLimitCallout.style.display = 'none';
          if (listingPriceError) listingPriceError.style.display = 'none';
          closeModal('providerAddListingModal');
          showToast(isFree ? 'Resource listed successfully as a free donation (₹0)!' : `Resource listed successfully for sale at ₹${price} (Max limit: ₹${maxPrice})!`, 'success');
        } catch (err) {
          showToast(err.message || 'Failed to list resource.', 'error');
        }
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

    // Community Partner Record Distribution Form Submit
    const distForm = document.getElementById('recordDistributionForm');
    if (distForm) {
      distForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const reqSelect = document.getElementById('distRequirementSelect');
        const reqId = reqSelect ? reqSelect.value : '';
        const beneficiaries = document.getElementById('distBeneficiaries')?.value.trim();
        const quantity = Number(document.getElementById('distQuantity')?.value) || 1;
        const distributedBy = document.getElementById('distDistributedBy')?.value.trim();

        stateManager.recordDistribution(reqId, quantity, beneficiaries, distributedBy);
        closeModal('recordDistributionModal');
        distForm.reset();
        showToast(`Educational distribution of ${quantity} units recorded successfully!`, 'success');
      });
    }

    // Community Partner Contact Inquiry Form Submit
    const contactForm = document.getElementById('contactPartnerForm');
    if (contactForm) {
      contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const toOrganization = document.getElementById('contactPartnerOrgName')?.value || 'Community Partner';
        const name = document.getElementById('contactSenderName')?.value.trim();
        const email = document.getElementById('contactSenderEmail')?.value.trim();
        const phone = document.getElementById('contactSenderPhone')?.value.trim();
        const subject = document.getElementById('contactSubject')?.value.trim();
        const message = document.getElementById('contactMessage')?.value.trim();

        await stateManager.submitContactInquiry({
          toOrganization,
          name,
          email,
          phone,
          subject,
          message
        });

        closeModal('contactPartnerModal');
        contactForm.reset();
        showToast(`Your message has been sent to ${toOrganization}!`, 'success');
      });
    }
  }

  function openAdminReportModal(report) {
    if (!report) return;
    const modalTitle = document.getElementById('adminReportTitle');
    const modalBody = document.getElementById('adminReportModalBody');
    const genAt = document.getElementById('adminReportGeneratedAt');

    if (modalTitle) modalTitle.textContent = report.title || 'ShikshaShare Academic CEP Impact Assessment Report';
    if (genAt) genAt.textContent = `Generated: ${new Date(report.generatedAt || Date.now()).toLocaleString()}`;

    const m = report.metrics || {};
    const drives = report.communityDrivesStatus || {};

    if (modalBody) {
      modalBody.innerHTML = `
        <div style="margin-bottom: 20px;">
          <div style="font-size: 0.9rem; color: var(--text-muted); margin-bottom: 14px;">Academic Year: <strong>${report.academicYear || '2026-2027'}</strong> • Institutional CEP Audit</div>
          <div class="dash-stats-row" style="margin-bottom: 20px;">
            <div class="stat-metric-card">
              <div class="stat-number">${m.totalListedMaterials || 0}</div>
              <div class="stat-label">Listed Resources (${m.freeMaterialsPercentage || 0}% Free)</div>
            </div>
            <div class="stat-metric-card">
              <div class="stat-number">${m.totalBeneficiariesReached || 0}</div>
              <div class="stat-label">Beneficiaries Reached</div>
            </div>
            <div class="stat-metric-card">
              <div class="stat-number">₹${(m.estimatedStudentSavingsRupees || 0).toLocaleString()}</div>
              <div class="stat-label">Student Savings Generated</div>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 20px;">
            <div style="background: var(--bg-surface-subtle); padding: 16px; border-radius: 8px; border: 1px solid var(--border-color);">
              <h4 style="font-size: 0.95rem; font-weight: 700; margin-bottom: 8px;">🌱 Environmental Sustainability</h4>
              <p style="font-size: 0.85rem; color: var(--text-body); margin-bottom: 4px;"><strong>Paper Waste Prevented:</strong> ~${m.paperWastePreventedKg || 0} kg</p>
              <p style="font-size: 0.85rem; color: var(--text-body);"><strong>Equivalent Trees Saved:</strong> ~${m.treesEquivalentSaved || 0} mature trees</p>
            </div>
            <div style="background: var(--bg-surface-subtle); padding: 16px; border-radius: 8px; border: 1px solid var(--border-color);">
              <h4 style="font-size: 0.95rem; font-weight: 700; margin-bottom: 8px;">🤝 Community Drives Status</h4>
              <p style="font-size: 0.85rem; color: var(--text-body); margin-bottom: 4px;"><strong>Total Active Drives:</strong> ${drives.total || 0}</p>
              <p style="font-size: 0.85rem; color: var(--text-body);"><strong>Fulfilled / In-Progress:</strong> ${drives.fulfilled || 0} completed, ${drives.partiallyFulfilled || 0} active</p>
            </div>
          </div>

          <div style="background: #ffffff; padding: 16px; border: 1px solid var(--border-color); border-radius: 8px;">
            <h4 style="font-size: 0.95rem; font-weight: 700; margin-bottom: 8px;">Institutional Verification Statement</h4>
            <p style="font-size: 0.82rem; color: var(--text-muted); line-height: 1.6;">
              This assessment report reflects real-time educational material reallocations and verified grassroot donations across participating colleges, NSS student wings, and registered community organizations for the Community Engagement Project (CEP).
            </p>
          </div>
        </div>
      `;
    }

    const printBtn = document.getElementById('adminPrintReportBtn');
    if (printBtn) {
      printBtn.onclick = () => window.print();
    }

    openModal('adminReportModal');
  }

  function openContactPartnerModal(partnerName) {
    const title = document.getElementById('contactPartnerModalTitle');
    const orgHidden = document.getElementById('contactPartnerOrgName');
    const user = stateManager.getCurrentUser();

    if (title) title.textContent = `Contact: ${partnerName}`;
    if (orgHidden) orgHidden.value = partnerName;

    const nameInput = document.getElementById('contactSenderName');
    const emailInput = document.getElementById('contactSenderEmail');
    const phoneInput = document.getElementById('contactSenderPhone');

    if (nameInput && user?.name) nameInput.value = user.name;
    if (emailInput && user?.email) emailInput.value = user.email;
    if (phoneInput && user?.mobile) phoneInput.value = user.mobile;

    openModal('contactPartnerModal');
  }

  function openRecordDistributionModal() {
    const select = document.getElementById('distRequirementSelect');
    if (select) {
      const reqs = stateManager.getCommunityRequirements();
      select.innerHTML = reqs.map(r => `<option value="${r.id}">${escapeHTML(r.title)} (${r.organizationName})</option>`).join('');
    }
    const distBy = document.getElementById('distDistributedBy');
    const user = stateManager.getCurrentUser();
    if (distBy && user) {
      distBy.value = user.name || '';
    }
    openModal('recordDistributionModal');
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
      if (modalId === 'providerAddListingModal' && providerPhotoCtrl) {
        providerPhotoCtrl.clear();
      }
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
  /**
   * Reusable Photo Upload Controller for resource forms
   * Handles multi-photo selection, drag & drop, client-side validation, previews,
   * removal, replacement, and strict requirement of real photos.
   */
  function createPhotoUploadController({
    dropzoneEl,
    fileInputEl,
    previewGridEl,
    errorEl,
    maxPhotos = 6,
    maxSizeBytes = 5 * 1024 * 1024
  }) {
    let photos = []; // Array of photo data URLs or persistent image URLs

    function showError(msg) {
      if (errorEl) {
        errorEl.innerHTML = `
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink: 0;">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <span>${escapeHTML(msg)}</span>
        `;
        errorEl.style.display = 'flex';
      }
      if (dropzoneEl) dropzoneEl.classList.add('has-error');
    }

    function clearError() {
      if (errorEl) {
        errorEl.textContent = '';
        errorEl.style.display = 'none';
      }
      if (dropzoneEl) dropzoneEl.classList.remove('has-error');
    }

    function renderPreviews() {
      if (!previewGridEl) return;
      if (photos.length === 0) {
        previewGridEl.innerHTML = '';
        return;
      }

      previewGridEl.innerHTML = photos.map((photo, idx) => `
        <div class="photo-preview-item" data-photo-idx="${idx}">
          <img src="${photo}" alt="Resource Photo ${idx + 1}">
          ${idx === 0
            ? '<span class="photo-main-badge">Cover</span>'
            : `<span class="photo-main-badge" style="background: rgba(17, 24, 39, 0.75);">Photo ${idx + 1}</span>`
          }
          <button type="button" class="photo-remove-btn" data-remove-idx="${idx}" title="Remove this photo" aria-label="Remove photo ${idx + 1}">&times;</button>
        </div>
      `).join('') + (photos.length < maxPhotos ? `
        <div class="photo-add-more-card" role="button" tabindex="0" title="Add another photo of this resource">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          <span>Add Photo</span>
        </div>
      ` : '');

      // Bind individual photo remove buttons
      previewGridEl.querySelectorAll('.photo-remove-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const rIdx = parseInt(btn.getAttribute('data-remove-idx'), 10);
          if (!isNaN(rIdx) && rIdx >= 0 && rIdx < photos.length) {
            photos.splice(rIdx, 1);
            renderPreviews();
            if (photos.length === 0) {
              showError('At least one actual resource photo is required before submitting.');
            } else {
              clearError();
            }
          }
        });
      });

      // Bind add more button inside preview grid
      const addMoreCard = previewGridEl.querySelector('.photo-add-more-card');
      if (addMoreCard) {
        addMoreCard.addEventListener('click', (e) => {
          e.stopPropagation();
          if (fileInputEl) fileInputEl.click();
        });
      }
    }

    function addFiles(fileList) {
      if (!fileList || fileList.length === 0) return;
      clearError();

      const files = Array.from(fileList);
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif', 'image/jpg'];

      for (const file of files) {
        const type = (file.type || '').toLowerCase();
        if (!allowedTypes.includes(type) && !type.startsWith('image/')) {
          showError(`"${file.name}" is not a supported image. Please upload JPG, PNG, or WEBP photos.`);
          return;
        }
        if (file.size > maxSizeBytes) {
          showError(`"${file.name}" exceeds the 5MB limit. Please select smaller images.`);
          return;
        }
      }

      if (photos.length + files.length > maxPhotos) {
        showError(`You can upload up to ${maxPhotos} photos per resource.`);
        return;
      }

      let readRemaining = files.length;
      files.forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
          photos.push(e.target.result);
          readRemaining--;
          if (readRemaining === 0) {
            clearError();
            renderPreviews();
          }
        };
        reader.onerror = () => {
          readRemaining--;
          showError(`Could not read "${file.name}". Please choose another photo.`);
        };
        reader.readAsDataURL(file);
      });

      if (fileInputEl) fileInputEl.value = '';
    }

    // Attach dropzone listeners
    if (dropzoneEl) {
      dropzoneEl.addEventListener('click', () => {
        if (fileInputEl) fileInputEl.click();
      });

      dropzoneEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (fileInputEl) fileInputEl.click();
        }
      });

      dropzoneEl.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzoneEl.classList.add('dragover');
      });

      dropzoneEl.addEventListener('dragenter', (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzoneEl.classList.add('dragover');
      });

      dropzoneEl.addEventListener('dragleave', (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzoneEl.classList.remove('dragover');
      });

      dropzoneEl.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzoneEl.classList.remove('dragover');
        if (e.dataTransfer && e.dataTransfer.files) {
          addFiles(e.dataTransfer.files);
        }
      });
    }

    if (fileInputEl) {
      fileInputEl.addEventListener('change', (e) => {
        if (e.target && e.target.files) {
          addFiles(e.target.files);
        }
      });
    }

    return {
      getPhotos: () => [...photos],
      setPhotos: (newPhotos) => {
        photos = Array.isArray(newPhotos) ? [...newPhotos] : [];
        clearError();
        renderPreviews();
      },
      clear: () => {
        photos = [];
        if (fileInputEl) fileInputEl.value = '';
        clearError();
        renderPreviews();
      },
      validate: () => {
        if (photos.length === 0) {
          return {
            valid: false,
            error: 'At least one actual resource photo is required before submitting.'
          };
        }
        return { valid: true };
      },
      showError,
      clearError
    };
  }
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

  // =========================================================================
  // 13. Application Initialization & Startup
  // =========================================================================
  initPopulateDropdowns();
  initNavigation();
  initAuth();
  initHeaderNotifications();
  initFilterControls();
  initModals();
  initDonationForm();

  // Initial UI renders
  renderAuthUI();
  renderHome();
  renderResources();
  renderCommunity();
  renderDashboard();

  // Global event listeners for state synchronization
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
    showToast('Resource request sent to provider!', 'success');
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
});

