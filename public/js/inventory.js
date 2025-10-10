const Inventory = (() => {
  const els = {
    tbody: document.getElementById('inventory-tbody'),
    addBtn: document.getElementById('add-product-btn'),
    modal: document.getElementById('add-product-modal'),
    saveBtn: document.getElementById('save-product'),
    filter: document.getElementById('inventory-filter'),
    search: document.getElementById('inventory-search'),
  };
  
  let allProducts = [];

  function statusBadge(stock) {
    if (stock <= 0) return '<span class="status-badge status-out">Out of Stock</span>';
    if (stock <= 5) return '<span class="status-badge status-low">Low Stock</span>';
    return '<span class="status-badge status-instock">In Stock</span>';
  }

  function render(list) {
    els.tbody.innerHTML = list.map(p => `
      <tr data-id="${p._id}">
        <td>${p.name}</td>
        <td>${p.category}</td>
        <td>₹${p.price.toFixed(2)}</td>
        <td>${p.stock}</td>
        <td>${statusBadge(p.stock)}</td>
        <td>
          <button class="btn btn-secondary dec">-1</button>
          <button class="btn btn-secondary inc">+1</button>
          <button class="btn btn-danger delete">Del</button>
        </td>
      </tr>
    `).join('');

    // Re-bind events
    els.tbody.querySelectorAll('.delete').forEach(b => b.addEventListener('click', async (e) => {
      const id = e.target.closest('tr').dataset.id;
      if (confirm('Are you sure you want to delete this product?')) { 
        await API.deleteProduct(id); 
        await load(); 
      }
    }));
    els.tbody.querySelectorAll('.inc').forEach(b => b.addEventListener('click', async (e) => {
      const id = e.target.closest('tr').dataset.id;
      await API.adjustStock(id, +1); 
      await load();
    }));
    els.tbody.querySelectorAll('.dec').forEach(b => b.addEventListener('click', async (e) => {
      const id = e.target.closest('tr').dataset.id;
      await API.adjustStock(id, -1); 
      await load();
    }));
  }
  
  function toggleModal(show) {
      els.modal?.classList.toggle('active', show);
  }

  async function saveProduct() {
    const body = {
      name: document.getElementById('product-name').value,
      category: document.getElementById('product-category').value,
      price: parseFloat(document.getElementById('product-price').value || '0'),
      stock: parseInt(document.getElementById('product-stock').value || '0', 10),
      barcode: document.getElementById('product-barcode').value
    };
    if (!body.name || !body.category || !body.price) {
        alert('Name, Category, and Price are required.');
        return;
    }
    await API.createProduct(body); 
    toggleModal(false); 
    await load(); 
    document.getElementById('add-product-form').reset();
  }

  function filterData() {
    const q = els.search.value.trim().toLowerCase();
    const cat = els.filter.value;
    const filtered = allProducts.filter(p => 
      (cat === 'all' || p.category === cat) && 
      (!q || p.name.toLowerCase().includes(q))
    );
    render(filtered);
  }

  async function load() {
    try {
        const { data } = await API.getProducts('');
        allProducts = data;
        filterData();
    } catch (err) {
        console.error("Failed to load inventory:", err);
        els.tbody.innerHTML = `<tr><td colspan="6" style="color: var(--color-danger);">Could not load inventory.</td></tr>`;
    }
  }

  function bindEvents() {
    els.addBtn?.addEventListener('click', () => toggleModal(true));
    els.saveBtn?.addEventListener('click', saveProduct);
    els.modal?.querySelector('.close')?.addEventListener('click', () => toggleModal(false));
    els.filter?.addEventListener('change', filterData);
    els.search?.addEventListener('input', filterData);
  }

  return { 
    load, // Expose load so other modules can refresh it
    init() { 
      bindEvents();
      return load();
    }
  };
})();