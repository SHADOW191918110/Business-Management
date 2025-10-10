const Customers = (() => {
  const els = {
    grid: document.getElementById('customers-grid'),
    addBtn: document.getElementById('add-customer-btn'),
    modal: document.getElementById('add-customer-modal'),
    saveBtn: document.getElementById('save-customer'),
    form: document.getElementById('add-customer-form'),
  };

  function render(list) { 
    if (!list || list.length === 0) {
        els.grid.innerHTML = `<p style="color: var(--color-text-secondary);">No customers found.</p>`;
        return;
    }
    els.grid.innerHTML = list.map(c => `
      <div class="customer-card">
        <strong>${c.name}</strong>
        <div>${c.phone || 'No phone'}</div>
        <div>${c.email || 'No email'}</div>
      </div>
    `).join(''); 
  }

  async function load() {
    try {
        const { data } = await API.getCustomers('');
        render(data);
    } catch (err) {
        console.error("Failed to load customers:", err);
        els.grid.innerHTML = `<p style="color: var(--color-danger);">Could not load customers.</p>`;
    }
  }

  function toggleModal(show) {
      els.modal?.classList.toggle('active', show);
  }
  
  async function saveCustomer() {
    const body = {
      name: document.getElementById('customer-name').value,
      phone: document.getElementById('customer-phone').value,
      email: document.getElementById('customer-email').value,
      address: document.getElementById('customer-address').value
    };
    if (!body.name) {
        alert("Customer name is required.");
        return;
    }
    await API.createCustomer(body); 
    toggleModal(false); 
    await load();
    els.form.reset();
  }

  function bindEvents() {
    els.addBtn?.addEventListener('click', () => toggleModal(true));
    els.saveBtn?.addEventListener('click', saveCustomer);
    els.modal?.querySelector('.close')?.addEventListener('click', () => toggleModal(false));
  }

  return { 
    load,
    init() { 
      bindEvents();
      return load();
    } 
  };
})();