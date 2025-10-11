// API Helper object must be defined FIRST
const API = {
  token: null,
  async request(path, options = {}) {
    const headers = {};
    if (this.token) headers['Authorization'] = `Bearer ${this.token}`;
    
    // Do not set Content-Type for FormData, browser does it
    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    try {
      // Stringify body only if it's not FormData
      if (options.body && !(options.body instanceof FormData)) {
        options.body = JSON.stringify(options.body);
      }

      const res = await fetch(path, { ...options, headers });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || `Request failed with status ${res.status}`);
      }
      if (!data.success && data.message) {
         // Handle cases where API returns success: false but a 200 status
         throw new Error(data.message);
      }
      return data;
    } catch (err) {
      console.error(`API Error: ${err.message}`);
      // You might want to show a user-friendly error message here
      throw err; // Re-throw the error so the calling function can catch it
    }
  },
  login(username, password) {
    return this.request('/api/auth/login', { method: 'POST', body: { username, password } });
  },
  bootstrap() { return this.request('/api/auth/bootstrap', { method: 'POST' }); },
  getProducts(params = '') { return this.request(`/api/products${params}`); },
  createProduct(formData) { return this.request('/api/products', { method: 'POST', body: formData }); },
  deleteProduct(id) { return this.request(`/api/products/${id}`, { method: 'DELETE' }); },
  getCustomers(params='') { return this.request(`/api/customers${params}`); },
  createCustomer(body) { return this.request('/api/customers', { method: 'POST', body }); },
  adjustStock(id, delta) { return this.request(`/api/inventory/adjust/${id}`, { method: 'POST', body: { delta } }); },
  createTransaction(body) { return this.request('/api/transactions', { method: 'POST', body }); },
  getDashboard() { return this.request('/api/reports/dashboard'); }
};

// ... (Rest of App logic remains the same)
// App shell logic, nav, auth, global search
const App = (() => {
  const state = {
    taxRate: 18,
    currency: 'INR',
    user: null
  };

  const els = {
    loading: document.getElementById('loading-screen'),
    login: document.getElementById('login-screen'),
    main: document.getElementById('main-app'),
    loginForm: document.getElementById('login-form'),
    username: document.getElementById('username'),
    password: document.getElementById('password'),
    logoutBtn: document.getElementById('logout-btn'),
    navButtons: document.querySelectorAll('.nav-btn'),
    sections: document.querySelectorAll('.content-section'),
    globalSearch: document.getElementById('global-search'),
    currentUser: document.getElementById('current-user'),
  };

  function showSection(key) {
    els.sections.forEach(s => s.classList.remove('active'));
    document.getElementById(`${key}-section`)?.classList.add('active');
    
    els.navButtons.forEach(b => b.classList.remove('active'));
    const activeBtn = [...els.navButtons].find(b => b.dataset.section === key);
    if(activeBtn) activeBtn.classList.add('active');
  }
  
  async function initializeModules() {
    // This function now initializes all parts of the application
    await Promise.all([
      POS.init(), 
      Inventory.init(), 
      Customers.init(), 
      Reports.init(),
      Settings.init()
    ]);
    showSection('pos');
  }

  async function initAuth() {
    try {
      await API.bootstrap();
    } catch (err) {
      console.log('Admin user likely already exists.');
    }
    
    const stored = localStorage.getItem('pos_auth');
    if (stored) {
      const { token, user } = JSON.parse(stored);
      API.token = token; 
      state.user = user; 
      els.currentUser.textContent = user.name || user.username;
      
      els.login.classList.add('hidden'); 
      els.main.classList.remove('hidden');
      
      await initializeModules();
    } else {
      els.login.classList.remove('hidden');
    }
    els.loading.style.display = 'none';
  }

  async function handleLogin(e) {
    e.preventDefault();
    try {
      const { success, token, user } = await API.login(els.username.value, els.password.value);
      if (success) {
        API.token = token; 
        state.user = user; 
        els.currentUser.textContent = user.name || user.username;
        localStorage.setItem('pos_auth', JSON.stringify({ token, user }));
        
        els.login.classList.add('hidden'); 
        els.main.classList.remove('hidden');
        
        await initializeModules();
      }
    } catch (err) {
      alert(`Login failed: ${err.message}`);
    }
  }

  function handleLogout() {
    localStorage.removeItem('pos_auth');
    API.token = null; 
    state.user = null; 
    window.location.reload();
  }

  function bindEvents() {
    els.loginForm.addEventListener('submit', handleLogin);
    els.logoutBtn.addEventListener('click', handleLogout);
    els.navButtons.forEach(btn => btn.addEventListener('click', () => showSection(btn.dataset.section)));
    els.globalSearch.addEventListener('input', (e) => {
        if(typeof POS !== 'undefined' && POS.search) {
            POS.search(e.target.value);
        }
    });
  }

  return {
    state,
    init() { 
      bindEvents(); 
      initAuth(); 
    }
  };
})();

document.addEventListener('DOMContentLoaded', App.init);