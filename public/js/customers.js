// Customers UI
const Customers = (() => {
  const els = {
    grid: document.getElementById('customers-grid'),
    addBtn: document.getElementById('add-customer-btn'),
    modal: document.getElementById('add-customer-modal'),
    save: document.getElementById('save-customer'),
  };

  function card(c) {
    return `
      <div class="customer-card">
        <strong>${c.name}</strong>
        <div>${c.phone || ''}</div>
        <div>${c.email || ''}</div>
        <div class="customer-actions">
          <button class="btn btn-secondary" data-id="${c._id}" data-action="edit">Edit</button>
        </div>
      </div>
    `;
  }

  function render(list) { els.grid.innerHTML = list.map(card).join(''); }

  async function load() {
    const { data } = await API.getCustomers('');
    render(data);
  }

  function openModal() { els.modal.style.display = 'flex'; }
  function closeModal() { els.modal.style.display = 'none'; }

  async function saveCustomer() {
    const body = {
      name: document.getElementById('customer-name').value,
      phone: document.getElementById('customer-phone').value,
      email: document.getElementById('customer-email').value,
      address: document.getElementById('customer-address').value
    };
    await API.createCustomer(body); closeModal(); await load();
  }

  function bind() {
    els.addBtn.addEventListener('click', openModal);
    els.save.addEventListener('click', saveCustomer);
    document.querySelector('#add-customer-modal .close').addEventListener('click', closeModal);
  }

  return { load, bind };
})();

document.addEventListener('DOMContentLoaded', Customers.bind);
