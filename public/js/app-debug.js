// Simplified debug version of app.js with error handling and logging
console.log('Loading POS Application...');

// API helper with better error handling
const API = {
  token: null,
  baseUrl: window.location.origin,
  
  async request(path, options = {}) {
    try {
      console.log(`API Request: ${options.method || 'GET'} ${path}`);
      const headers = { 'Content-Type': 'application/json' };
      if (this.token) headers['Authorization'] = `Bearer ${this.token}`;
      
      const res = await fetch(path, { ...options, headers });
      console.log(`API Response: ${res.status} ${res.statusText}`);
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      
      const data = await res.json();
      console.log('API Data:', data);
      
      if (!data.success && data.message) {
        throw new Error(data.message);
      }
      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },
  
  login(username, password) {
    return this.request('/api/auth/login', { 
      method: 'POST', 
      body: JSON.stringify({ username, password }) 
    });
  },
  
  bootstrap() { 
    return this.request('/api/auth/bootstrap', { method: 'POST' }); 
  },
  
  getProducts(params = '') { 
    return this.request(`/api/products${params}`); 
  },
  
  createProduct(body) { 
    return this.request('/api/products', { 
      method: 'POST', 
      body: JSON.stringify(body) 
    }); 
  },
  
  updateProduct(id, body) { 
    return this.request(`/api/products/${id}`, { 
      method: 'PUT', 
      body: JSON.stringify(body) 
    }); 
  },
  
  deleteProduct(id) { 
    return this.request(`/api/products/${id}`, { method: 'DELETE' }); 
  },
  
  getCustomers(params='') { 
    return this.request(`/api/customers${params}`); 
  },
  
  createCustomer(body) { 
    return this.request('/api/customers', { 
      method: 'POST', 
      body: JSON.stringify(body) 
    }); 
  },
  
  updateCustomer(id, body) { 
    return this.request(`/api/customers/${id}`, { 
      method: 'PUT', 
      body: JSON.stringify(body) 
    }); 
  },
  
  getInventoryKPIs() { 
    return this.request('/api/inventory/kpis'); 
  },
  
  adjustStock(id, delta) { 
    return this.request(`/api/inventory/adjust/${id}`, { 
      method: 'POST', 
      body: JSON.stringify({ delta }) 
    }); 
  },
  
  createTransaction(body) { 
    return this.request('/api/transactions', { 
      method: 'POST', 
      body: JSON.stringify(body) 
    }); 
  },
  
  getTransactions(scope='recent') { 
    return this.request(`/api/transactions?scope=${scope}`); 
  },
  
  getDashboard() { 
    return this.request('/api/reports/dashboard'); 
  }
};

// Main App with extensive error handling
const App = (() => {
  const state = {
    taxRate: 18,
    currency: 'INR',
    user: null
  };

  const els = {};

  function initElements() {
    try {
      console.log('Initializing DOM elements...');
      els.loading = document.getElementById('loading-screen');
      els.login = document.getElementById('login-screen');
      els.main = document.getElementById('main-app');
      els.loginForm = document.getElementById('login-form');
      els.username = document.getElementById('username');
      els.password = document.getElementById('password');
      els.logoutBtn = document.getElementById('logout-btn');
      els.navButtons = document.querySelectorAll('.nav-btn');
      els.sections = document.querySelectorAll('.content-section');
      els.globalSearch = document.getElementById('global-search');
      els.currentUser = document.getElementById('current-user');
      
      console.log('DOM elements initialized successfully');
      return true;
    } catch (error) {
      console.error('Error initializing DOM elements:', error);
      return false;
    }
  }

  function showSection(key) {
    try {
      console.log(`Showing section: ${key}`);
      els.sections.forEach(s => s.classList.remove('active'));
      
      const targetSection = document.getElementById(`${key}-section`);
      if (targetSection) {
        targetSection.classList.add('active');
      }
      
      els.navButtons.forEach(b => b.classList.remove('active'));
      const activeBtn = [...els.navButtons].find(b => b.dataset.section === key);
      if (activeBtn) {
        activeBtn.classList.add('active');
      }
    } catch (error) {
      console.error('Error showing section:', error);
    }
  }

  async function initAuth() {
    try {
      console.log('Initializing authentication...');
      
      // Try to bootstrap admin user
      try {
        await API.bootstrap();
        console.log('Bootstrap completed');
      } catch (err) {
        console.log('Bootstrap failed (may already exist):', err.message);
      }
      
      // Check for stored auth
      const stored = localStorage.getItem('pos_auth');
      if (stored) {
        console.log('Found stored auth, attempting to restore session...');
        try {
          const { token, user } = JSON.parse(stored);
          API.token = token;
          state.user = user;
          
          if (els.currentUser) {
            els.currentUser.textContent = user.name || user.username;
          }
          
          // Hide login, show main app
          if (els.login) els.login.classList.add('hidden');
          if (els.main) els.main.classList.remove('hidden');
          
          console.log('Loading initial data...');
          
          // Load data with individual error handling
          try {
            if (window.POS && typeof window.POS.loadProducts === 'function') {
              await window.POS.loadProducts();
            }
          } catch (err) {
            console.error('Failed to load products:', err);
          }
          
          try {
            if (window.Inventory && typeof window.Inventory.load === 'function') {
              await window.Inventory.load();
            }
          } catch (err) {
            console.error('Failed to load inventory:', err);
          }
          
          try {
            if (window.Customers && typeof window.Customers.load === 'function') {
              await window.Customers.load();
            }
          } catch (err) {
            console.error('Failed to load customers:', err);
          }
          
          try {
            if (window.Reports && typeof window.Reports.load === 'function') {
              await window.Reports.load();
            }
          } catch (err) {
            console.error('Failed to load reports:', err);
          }
          
          showSection('pos');
          console.log('Session restored successfully');
        } catch (err) {
          console.error('Failed to restore session:', err);
          localStorage.removeItem('pos_auth');
          showLoginScreen();
        }
      } else {
        console.log('No stored auth found, showing login screen');
        showLoginScreen();
      }
    } catch (error) {
      console.error('Fatal error in initAuth:', error);
      showLoginScreen();
    } finally {
      // Always hide loading screen
      hideLoadingScreen();
    }
  }

  function showLoginScreen() {
    try {
      if (els.login) els.login.classList.remove('hidden');
      if (els.main) els.main.classList.add('hidden');
    } catch (error) {
      console.error('Error showing login screen:', error);
    }
  }

  function hideLoadingScreen() {
    try {
      if (els.loading) {
        els.loading.style.display = 'none';
      }
      console.log('Loading screen hidden');
    } catch (error) {
      console.error('Error hiding loading screen:', error);
    }
  }

  function bindEvents() {
    try {
      console.log('Binding events...');
      
      // Login form
      if (els.loginForm) {
        els.loginForm.addEventListener('submit', async (e) => {
          e.preventDefault();
          console.log('Login form submitted');
          
          try {
            const username = els.username ? els.username.value : '';
            const password = els.password ? els.password.value : '';
            
            console.log(`Attempting login for user: ${username}`);
            
            const { success, token, user } = await API.login(username, password);
            
            if (success && token && user) {
              console.log('Login successful');
              API.token = token;
              state.user = user;
              
              if (els.currentUser) {
                els.currentUser.textContent = user.name || user.username;
              }
              
              localStorage.setItem('pos_auth', JSON.stringify({ token, user }));
              
              if (els.login) els.login.classList.add('hidden');
              if (els.main) els.main.classList.remove('hidden');
              
              // Load data after login
              console.log('Loading data after login...');
              
              try {
                if (window.POS && typeof window.POS.loadProducts === 'function') {
                  await window.POS.loadProducts();
                }
                if (window.Inventory && typeof window.Inventory.load === 'function') {
                  await window.Inventory.load();
                }
                if (window.Customers && typeof window.Customers.load === 'function') {
                  await window.Customers.load();
                }
                if (window.Reports && typeof window.Reports.load === 'function') {
                  await window.Reports.load();
                }
              } catch (err) {
                console.error('Error loading data after login:', err);
              }
              
              showSection('pos');
            }
          } catch (err) {
            console.error('Login failed:', err);
            alert('Login failed: ' + err.message);
          }
        });
      }

      // Logout button
      if (els.logoutBtn) {
        els.logoutBtn.addEventListener('click', () => {
          console.log('Logout clicked');
          localStorage.removeItem('pos_auth');
          API.token = null;
          state.user = null;
          window.location.reload();
        });
      }

      // Navigation buttons
      if (els.navButtons) {
        els.navButtons.forEach(btn => {
          btn.addEventListener('click', () => {
            const section = btn.dataset.section;
            console.log(`Navigation clicked: ${section}`);
            showSection(section);
          });
        });
      }

      // Global search
      if (els.globalSearch) {
        els.globalSearch.addEventListener('keyup', (e) => {
          const q = e.target.value.trim();
          if (window.POS && typeof window.POS.search === 'function') {
            window.POS.search(q);
          }
        });
      }

      // Settings forms
      const taxForm = document.getElementById('tax-settings-form');
      if (taxForm) {
        taxForm.addEventListener('submit', (e) => {
          e.preventDefault();
          const taxInput = document.getElementById('tax-rate');
          const tax = parseFloat(taxInput ? taxInput.value : '18') || 18;
          state.taxRate = tax;
          
          if (window.POS && typeof window.POS.recalculate === 'function') {
            window.POS.recalculate();
          }
          
          alert('Tax settings saved');
        });
      }

      const storeForm = document.getElementById('store-settings-form');
      if (storeForm) {
        storeForm.addEventListener('submit', (e) => {
          e.preventDefault();
          alert('Store settings saved');
        });
      }
      
      console.log('Events bound successfully');
    } catch (error) {
      console.error('Error binding events:', error);
    }
  }

  return {
    state,
    init() {
      try {
        console.log('Initializing POS Application...');
        
        const elementsOk = initElements();
        if (!elementsOk) {
          throw new Error('Failed to initialize DOM elements');
        }
        
        bindEvents();
        initAuth();
        
        console.log('POS Application initialized successfully');
      } catch (error) {
        console.error('Fatal error initializing app:', error);
        
        // Emergency fallback - hide loading screen and show error
        const loading = document.getElementById('loading-screen');
        if (loading) {
          loading.innerHTML = `
            <div style="text-align: center; color: #ef4444;">
              <h3>Application Error</h3>
              <p>Failed to initialize POS system</p>
              <p><small>${error.message}</small></p>
              <button onclick="window.location.reload()" style="margin-top: 20px; padding: 10px 20px; background: #4f46e5; color: white; border: none; border-radius: 5px; cursor: pointer;">
                Reload Application
              </button>
            </div>
          `;
        }
      }
    }
  };
})();

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing app...');
    App.init();
  });
} else {
  console.log('DOM already loaded, initializing app immediately...');
  App.init();
}