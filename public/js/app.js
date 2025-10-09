// Frontend state and API helper
const API = {
  token: null,
  async request(path, options = {}) {
    const headers = { 'Content-Type': 'application/json' };
    if (this.token) headers['Authorization'] = `Bearer ${this.token}`;
    const res = await fetch(path, { ...options, headers });
    const data = await res.json();
    if (!data.success && data.message) throw new Error(data.message);
    return data;
  },
  login(username, password) {
    return this.request('/api/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) });
  },
  bootstrap() { return this.request('/api/auth/bootstrap', { method: 'POST' }); },
  getProducts(params = '') { return this.request(`/api/products${params}`); },
  createProduct(body) { return this.request('/api/products', { method: 'POST', body: JSON.stringify(body) }); },
  updateProduct(id, body) { return this.request(`/api/products/${id}`, { method: 'PUT', body: JSON.stringify(body) }); },
  deleteProduct(id) { return this.request(`/api/products/${id}`, { method: 'DELETE' }); },
  getCustomers(params='') { return this.request(`/api/customers${params}`); },
  createCustomer(body) { return this.request('/api/customers', { method: 'POST', body: JSON.stringify(body) }); },
  updateCustomer(id, body) { return this.request(`/api/customers/${id}`, { method: 'PUT', body: JSON.stringify(body) }); },
  getInventoryKPIs() { return this.request('/api/inventory/kpis'); },
  adjustStock(id, delta) { return this.request(`/api/inventory/adjust/${id}`, { method: 'POST', body: JSON.stringify({ delta }) }); },
  createTransaction(body) { return this.request('/api/transactions', { method: 'POST', body: JSON.stringify(body) }); },
  getTransactions(scope='recent') { return this.request(`/api/transactions?scope=${scope}`); },
  getDashboard() { return this.request('/api/reports/dashboard'); }
};

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
    document.getElementById(`${key}-section`).classList.add('active');
    els.navButtons.forEach(b => b.classList.remove('active'));
    [...els.navButtons].find(b => b.dataset.section === key).classList.add('active');
  }

  async function initAuth() {
    try { await API.bootstrap(); } catch {}
    const stored = localStorage.getItem('pos_auth');
    if (stored) {
      const { token, user } = JSON.parse(stored);
      API.token = token; state.user = user; els.currentUser.textContent = user.name || user.username;
      els.login.classList.add('hidden'); els.main.classList.remove('hidden');
      await Promise.all([
        POS.loadProducts(), Inventory.load(), Customers.load(), Reports.load()
      ]);
      showSection('pos');
    } else {
      els.login.classList.remove('hidden');
    }
    els.loading.style.display = 'none';
  }

  function bindEvents() {
    els.loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        const { success, token, user } = await API.login(els.username.value, els.password.value);
        if (success) {
          API.token = token; state.user = user; els.currentUser.textContent = user.name || user.username;
          localStorage.setItem('pos_auth', JSON.stringify({ token, user }));
          els.login.classList.add('hidden'); els.main.classList.remove('hidden');
          await Promise.all([
            POS.loadProducts(), Inventory.load(), Customers.load(), Reports.load()
          ]);
          showSection('pos');
        }
      } catch (err) {
        alert(err.message);
      }
    });

    els.logoutBtn.addEventListener('click', () => {
      localStorage.removeItem('pos_auth');
      API.token = null; state.user = null; window.location.reload();
    });

    els.navButtons.forEach(btn => btn.addEventListener('click', () => showSection(btn.dataset.section)));

    els.globalSearch.addEventListener('keyup', (e) => {
      const q = e.target.value.trim();
      POS.search(q);
    });

    // Settings forms
    document.getElementById('tax-settings-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const tax = parseFloat(document.getElementById('tax-rate').value || '18');
      state.taxRate = tax; POS.recalculate();
      alert('Tax settings saved');
    });

    document.getElementById('store-settings-form').addEventListener('submit', (e) => {
      e.preventDefault();
      alert('Store settings saved');
    });
  }

  return {
    state,
    init() { bindEvents(); initAuth(); }
  };
})();

document.addEventListener('DOMContentLoaded', App.init);
