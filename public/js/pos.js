const POS = (() => {
  const els = {
    productGrid: document.getElementById('product-grid'),
    categoryBtns: document.querySelectorAll('.category-btn'),
    cartItems: document.getElementById('cart-items'),
    subtotal: document.getElementById('subtotal'),
    tax: document.getElementById('tax'),
    total: document.getElementById('total'),
    clearCart: document.getElementById('clear-cart'),
    payNow: document.getElementById('process-payment'),
    paymentModal: document.getElementById('payment-modal'),
    paymentItems: document.getElementById('payment-items'),
    paymentTotal: document.getElementById('payment-total'),
    amountReceived: document.getElementById('amount-received'),
    changeAmount: document.getElementById('change-amount'),
    confirmPayment: document.getElementById('confirm-payment'),
  };

  const state = { products: [], filtered: [], cart: [], currentCategory: 'all' };

  function renderProducts(list) {
    if (!list || list.length === 0) {
        els.productGrid.innerHTML = `<p style="color: var(--color-text-secondary); text-align: center; grid-column: 1 / -1;">No products found.</p>`;
        return;
    }
    els.productGrid.innerHTML = list.map(p => `
      <div class="product-card" data-id="${p._id}">
        <div class="product-image"><i class="fas fa-box"></i></div>
        <div class="product-info">
          <div class="product-name">${p.name}</div>
          <div class="product-price">₹${p.price.toFixed(2)}</div>
        </div>
      </div>
    `).join('');

    els.productGrid.querySelectorAll('.product-card').forEach(card => 
      card.addEventListener('click', () => addToCart(card.dataset.id))
    );
  }

  function addToCart(id) {
    const product = state.products.find(p => p._id === id);
    if (!product) return;
    if (product.stock <= 0) {
        alert(`${product.name} is out of stock!`);
        return;
    };
    const existing = state.cart.find(ci => ci._id === id);
    if (existing) {
        if(existing.qty < product.stock) {
            existing.qty += 1;
        } else {
            alert(`No more stock available for ${product.name}`);
        }
    } else { 
      state.cart.push({ ...product, qty: 1 }); 
    }
    renderCart();
  }

  function renderCart() {
    if(state.cart.length === 0) {
        els.cartItems.innerHTML = `<div style="text-align: center; color: var(--color-text-secondary); padding: 20px;">Cart is empty</div>`;
    } else {
        els.cartItems.innerHTML = state.cart.map(ci => `
          <div class="cart-item" data-id="${ci._id}">
            <div>${ci.name}</div>
            <div class="qty-control">
              <button class="dec">-</button>
              <span>${ci.qty}</span>
              <button class="inc">+</button>
            </div>
            <div>₹${(ci.price * ci.qty).toFixed(2)}</div>
            <button class="remove"><i class="fas fa-times"></i></button>
          </div>
        `).join('');
    }

    els.cartItems.querySelectorAll('.inc').forEach(b => b.addEventListener('click', (e) => changeQty(e.currentTarget.closest('.cart-item').dataset.id, +1)));
    els.cartItems.querySelectorAll('.dec').forEach(b => b.addEventListener('click', (e) => changeQty(e.currentTarget.closest('.cart-item').dataset.id, -1)));
    els.cartItems.querySelectorAll('.remove').forEach(b => b.addEventListener('click', (e) => removeItem(e.currentTarget.closest('.cart-item').dataset.id)));

    recalcTotals();
  }

  function changeQty(id, delta) {
    const item = state.cart.find(ci => ci._id === id);
    if (!item) return;
    const newQty = item.qty + delta;
    if (newQty <= 0) {
      state.cart = state.cart.filter(ci => ci._id !== id);
    } else if (newQty > item.stock) {
      alert(`Not enough stock for ${item.name}. Only ${item.stock} available.`);
    } else {
      item.qty = newQty;
    }
    renderCart();
  }

  function removeItem(id) { 
    state.cart = state.cart.filter(ci => ci._id !== id); 
    renderCart(); 
  }

  function recalcTotals() {
    const subtotal = state.cart.reduce((s, ci) => s + ci.price * ci.qty, 0);
    const tax = +(subtotal * (App.state.taxRate / 100)).toFixed(2);
    const total = +(subtotal + tax).toFixed(2);
    els.subtotal.textContent = `₹${subtotal.toFixed(2)}`;
    els.tax.textContent = `₹${tax.toFixed(2)}`;
    els.total.textContent = `₹${total.toFixed(2)}`;
    return { total };
  }
  
  function toggleModal(modalId, show) {
      document.getElementById(modalId)?.classList.toggle('active', show);
  }

  function openPaymentModal() {
    const { total } = recalcTotals();
    els.paymentItems.innerHTML = state.cart.map(ci => `<div>${ci.qty} x ${ci.name} - ₹${(ci.price * ci.qty).toFixed(2)}</div>`).join('');
    els.paymentTotal.textContent = `₹${total.toFixed(2)}`;
    els.amountReceived.value = total.toFixed(2);
    els.changeAmount.textContent = '₹0.00';
    toggleModal('payment-modal', true);
  }

  async function completeSale() {
    const payload = {
      items: state.cart.map(ci => ({ product: ci._id, quantity: ci.qty })),
      taxRate: App.state.taxRate,
      paymentMethod: document.querySelector('.payment-method.active')?.dataset.method || 'cash',
      amountReceived: parseFloat(els.amountReceived.value || '0')
    };

    try {
      await API.createTransaction(payload);
      alert('Sale completed!');
      state.cart = [];
      renderCart();
      toggleModal('payment-modal', false);
      Reports.load();
      Inventory.load();
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  }

  function bindEvents() {
    els.clearCart.addEventListener('click', () => { state.cart = []; renderCart(); });
    els.payNow.addEventListener('click', () => { if (state.cart.length) openPaymentModal(); else alert('Cart is empty'); });
    
    document.querySelectorAll('.modal .close').forEach(el => 
        el.addEventListener('click', (e) => toggleModal(e.target.closest('.modal').id, false))
    );
        
    document.querySelectorAll('.payment-method').forEach(btn => btn.addEventListener('click', (e) => {
      document.querySelectorAll('.payment-method').forEach(b => b.classList.remove('active'));
      e.currentTarget.classList.add('active');
    }));
    
    els.confirmPayment.addEventListener('click', completeSale);
    
    els.amountReceived.addEventListener('input', () => {
        const total = recalcTotals().total;
        const received = parseFloat(els.amountReceived.value || '0');
        const change = Math.max(0, received - total);
        els.changeAmount.textContent = `₹${change.toFixed(2)}`;
    });

    els.categoryBtns.forEach(btn => btn.addEventListener('click', () => {
      els.categoryBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.currentCategory = btn.dataset.category;
      filterProducts();
    }));
  }

  function filterProducts(query = document.getElementById('global-search').value) {
    const q = query.trim().toLowerCase();
    state.filtered = state.products.filter(p => {
      const categoryMatch = state.currentCategory === 'all' || p.category === state.currentCategory;
      const queryMatch = !q || p.name.toLowerCase().includes(q) || (p.barcode && p.barcode.includes(q));
      return categoryMatch && queryMatch;
    });
    renderProducts(state.filtered);
  }

  async function loadProducts() {
    try {
      const { data } = await API.getProducts('');
      state.products = data; 
      filterProducts();
    } catch (err) { 
        console.error(err); 
        els.productGrid.innerHTML = `<p style="color: var(--color-danger);">Could not load products.</p>`;
    }
  }

  return {
    search(q) { filterProducts(q); },
    init() {
        bindEvents();
        return loadProducts(); // Return the promise
    }
  };
})();