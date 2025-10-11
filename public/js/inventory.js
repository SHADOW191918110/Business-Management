const Inventory = (() => {
  const els = {
    tbody: document.getElementById('inventory-tbody'),
    addBtn: document.getElementById('add-product-btn'),
    modal: document.getElementById('add-product-modal'),
    save: document.getElementById('save-product'),
    filter: document.getElementById('inventory-filter'),
    search: document.getElementById('inventory-search'),
    form: document.getElementById('add-product-form'),
  };

  function statusBadge(stock) {
    if (stock <= 0) return '<span class="status-badge status-out">Out</span>';
    if (stock <= 5) return '<span class="status-badge status-low">Low</span>';
    return '<span class="status-badge status-instock">In Stock</span>';
  }

  function render(list) {
    // You may want to add a new <th> for Image in index.html
    els.tbody.innerHTML = list.map(p => {
      const imgSrc = (p.imageData && p.imageMimeType) 
        ? `data:${p.imageMimeType};base64,${p.imageData}`
        : ''; // Add a placeholder if you want
      return `
        <tr data-id="${p._id}">
          <td>${p._id.slice(-6)}</td>
          <td>
            <div style="display: flex; align-items: center; gap: 8px;">
              <img src="${imgSrc}" alt="${p.name}" width="40" height="40" style="object-fit: cover; border-radius: 4px;">
              <span>${p.name}</span>
            </div>
          </td>
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
      `
    }).join('');

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
    els.form.reset();
    els.modal.classList.toggle('active', show); 
  }

  async function saveProduct() {
    const formData = new FormData();
    formData.append('name', document.getElementById('product-name').value);
    formData.append('category', document.getElementById('product-category').value);
    formData.append('price', parseFloat(document.getElementById('product-price').value || '0'));
    formData.append('stock', parseInt(document.getElementById('product-stock').value || '0', 10));
    formData.append('barcode', document.getElementById('product-barcode').value);
    
    const imageFile = document.getElementById('product-image').files[0];
    if (imageFile) {
      formData.append('productImage', imageFile);
    }

    await API.createProduct(formData); 
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
    document.querySelector('#add-product-modal [data-action="cancel"]').addEventListener('click', () => toggleModal(false));
  }

  return { 
    load,
    init() { 
      bindEvents();
      return load();
    } 
  };
})();