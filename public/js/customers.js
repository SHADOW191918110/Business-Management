const Customers = (() => {
  const els = {
    grid: document.getElementById('customers-grid'),
    addBtn: document.getElementById('add-customer-btn'),
    modal: document.getElementById('add-customer-modal'),
    save: document.getElementById('save-customer'),
  };

  function render(list) { 
    els.grid.innerHTML = list.map(c => `
      <div class="customer-card">
        <strong>${c.name}</strong>
        <div>${c.phone || ''}</div>
        <div>${c.email || ''}</div>
        <div class="customer-actions">
          <button class="btn btn-secondary" data-id="${c._id}" data-action="edit">Edit</button>
        </div>
      </div>
    `).join(''); 
  }

  async function load() {
    const { data } = await API.getCustomers('');
    render(data);
  }
  
  function toggleModal(show) {
    els.modal.classList.toggle('active', show);
  }

  async function saveCustomer() {
    const body = {
      name: document.getElementById('customer-name').value,
      phone: document.getElementById('customer-phone').value,
      email: document.getElementById('customer-email').value,
      address: document.getElementById('customer-address').value
    };
    await API.createCustomer(body); 
    toggleModal(false); 
    await load();
  }

  function bindEvents() {
    els.addBtn.addEventListener('click', () => toggleModal(true));
    els.save.addEventListener('click', saveCustomer);
    document.querySelector('#add-customer-modal .close').addEventListener('click', () => toggleModal(false));
  }

  return { 
    load,
    init() { 
      bindEvents();
      return load();
    } 
  };
})();