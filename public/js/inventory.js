const Inventory = (() => {
  const els = {
    tbody: document.getElementById('inventory-tbody'),
    addBtn: document.getElementById('add-product-btn'),
    modal: document.getElementById('add-product-modal'),
    save: document.getElementById('save-product'),
    filter: document.getElementById('inventory-filter'),
    search: document.getElementById('inventory-search'),
  };

  function statusBadge(stock) {
    if (stock <= 0) return '<span class="status-badge status-out">Out</span>';
    if (stock <= 5) return '<span class="status-badge status-low">Low</span>';
    return '<span class="status-badge status-instock">In Stock</span>';
  }

  function render(list) {
    els.tbody.innerHTML = list.map(p => `
      <tr data-id="${p._id}">
        <td>${p._id.slice(-6)}</td>
        <td>${p.name}</td>
        <td>${p.category}</td>
        <td>₹${p.price.toFixed(2)}</td>
        <td>${p.stock}</td>
        <td>${statusBadge(p.stock)}</td>
        <td>
          <button class="btn btn-secondary edit">Edit</button>
          <button class="btn btn-danger delete">Delete</button>
          <button class="btn btn-secondary inc">+1</button>
          <button class="btn btn-secondary dec">-1</button>
        </td>
      </tr>
    `).join('');

    els.tbody.querySelectorAll('.delete').forEach(b => b.addEventListener('click', async (e) => {
      const id = e.target.closest('tr').dataset.id;
      if (confirm('Delete product?')) { await API.deleteProduct(id); await load(); }
    }));
    els.tbody.querySelectorAll('.inc').forEach(b => b.addEventListener('click', async (e) => {
      const id = e.target.closest('tr').dataset.id;
      await API.adjustStock(id, +1); await load();
    }));
    els.tbody.querySelectorAll('.dec').forEach(b => b.addEventListener('click', async (e) => {
      const id = e.target.closest('tr').dataset.id;
      await API.adjustStock(id, -1); await load();
    }));
  }

  function toggleModal(show) { 
    els.modal.classList.toggle('active', show); 
  }

  async function saveProduct() {
    const body = {
      name: document.getElementById('product-name').value,
      category: document.getElementById('product-category').value,
      price: parseFloat(document.getElementById('product-price').value || '0'),
      stock: parseInt(document.getElementById('product-stock').value || '0', 10),
      barcode: document.getElementById('product-barcode').value
    };
    await API.createProduct(body); 
    toggleModal(false); 
    await load(); 
    POS.init(); // Refresh POS products
  }

  async function load() {
    const { data } = await API.getProducts('');
    render(data);
  }

  function bindEvents() {
    els.addBtn.addEventListener('click', () => toggleModal(true));
    els.save.addEventListener('click', saveProduct);
    document.querySelector('#add-product-modal .close').addEventListener('click', () => toggleModal(false));
  }

  return { 
    load,
    init() { 
      bindEvents();
      return load();
    } 
  };
})();