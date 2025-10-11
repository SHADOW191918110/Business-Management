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
    els.productGrid.innerHTML = list.map(p => `
      <div class="product-card" data-id="${p._id}">
        <div class="product-image"><i class="fas fa-box"></i></div>
        <div class="product-info">
          <span class="product-name">${p.name}</span>
          <span class="product-price">₹${p.price.toFixed(2)}</span>
        </div>
      </div>
    `).join('');
    els.productGrid.querySelectorAll('.product-card').forEach(card => card.addEventListener('click', () => addToCart(card.dataset.id)));
  }

  function addToCart(id) {
    const product = state.products.find(p => p._id === id);
    if (!product) return;
    const existing = state.cart.find(ci => ci._id === id);
    if (existing) { existing.qty += 1; }
    else { state.cart.push({ ...product, qty: 1 }); }
    renderCart();
  }

  function renderCart() {
    els.cartItems.innerHTML = state.cart.map(ci => `
      <div class="cart-item" data-id="${ci._id}">
        <div>${ci.name}</div>
        <div class="qty-control">
          <button class="dec">-</button>
          <span>${ci.qty}</span>
          <button class="inc">+</button>
        </div>
        <div>₹${(ci.price * ci.qty).toFixed(2)}</div>
        <button class="btn btn-danger remove"><i class="fas fa-times"></i></button>
      </div>
    `).join('');
    recalcTotals();
  }

  function changeQty(id, delta) {
    const item = state.cart.find(ci => ci._id === id);
    if (!item) return;
    item.qty += delta;
    if (item.qty <= 0) state.cart = state.cart.filter(ci => ci._id !== id);
    renderCart();
  }

  function removeItem(id) { state.cart = state.cart.filter(ci => ci._id !== id); renderCart(); }

  function recalcTotals() {
    const subtotal = state.cart.reduce((s, ci) => s + ci.price * ci.qty, 0);
    const tax = +(subtotal * (App.state.taxRate / 100)).toFixed(2);
    const total = +(subtotal + tax).toFixed(2);
    els.subtotal.textContent = `₹${subtotal.toFixed(2)}`;
    els.tax.textContent = `₹${tax.toFixed(2)}`;
    els.total.textContent = `₹${total.toFixed(2)}`;
    return { subtotal, tax, total };
  }

  function toggleModal(modalId, show) {
    document.getElementById(modalId)?.classList.toggle('active', show);
  }

  function openPaymentModal() {
    const totals = recalcTotals();
    els.paymentItems.innerHTML = state.cart.map(ci => `<div>${ci.qty} x ${ci.name} - ₹${(ci.price * ci.qty).toFixed(2)}</div>`).join('');
    els.paymentTotal.textContent = `₹${totals.total.toFixed(2)}`;
    toggleModal('payment-modal', true);
  }

  async function completeSale() {
    const payload = {
      items: state.cart.map(ci => ({ product: ci._id, quantity: ci.qty })),
      taxRate: App.state.taxRate,
      paymentMethod: document.querySelector('.payment-method.active').dataset.method,
      amountReceived: parseFloat(els.amountReceived.value || '0')
    };
    try {
      const { success } = await API.createTransaction(payload);
      if (success) {
        alert('Sale completed!');
        state.cart = [];
        renderCart();
        toggleModal('payment-modal', false);
        Reports.load();
      }
    } catch (err) {
      alert(err.message);
    }
  }

  function bindEvents() {
    els.clearCart.addEventListener('click', () => { state.cart = []; renderCart(); });
    els.payNow.addEventListener('click', () => { if (state.cart.length) openPaymentModal(); else alert('Cart is empty'); });

    
    // ** Event Delegation **
    // Listen for clicks on the cart container instead of each button
    els.cartItems.addEventListener('click', (e) => {
        const target = e.target;
        const cartItem = target.closest('.cart-item');
        if (!cartItem) return;
        const id = cartItem.dataset.id;
        
        if (target.matches('.inc')) {
            changeQty(id, +1);
        } else if (target.matches('.dec')) {
            changeQty(id, -1);
        } else if (target.matches('.remove') || target.closest('.remove')) {
            removeItem(id);
        }
    });

    document.querySelectorAll('.modal .close').forEach(el => 
      el.addEventListener('click', () => toggleModal(el.closest('.modal').id, false))
    );
        
    document.querySelector('#payment-modal [data-action="cancel"]').addEventListener('click', () => toggleModal('payment-modal', false));
        
    document.querySelectorAll('.payment-method').forEach(btn => btn.addEventListener('click', () => {
      document.querySelectorAll('.payment-method').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    }));
    els.confirmPayment.addEventListener('click', completeSale);

    els.categoryBtns.forEach(btn => btn.addEventListener('click', () => {
      els.categoryBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.currentCategory = btn.dataset.category;
      filterProducts();
    }));
  }

  function filterProducts(query) {
    const q = (query || document.getElementById('global-search').value).trim().toLowerCase();
    state.filtered = state.products.filter(p => {
      const categoryMatch = state.currentCategory === 'all' || p.category === state.currentCategory;
      const queryMatch = !q || p.name.toLowerCase().includes(q);
      return categoryMatch && queryMatch;
    });
    renderProducts(state.filtered);
  }
  
  async function loadProducts() {
    try {
      const { data } = await API.getProducts('');
      state.products = data; 
      state.filtered = data; 
      renderProducts(data);
    } catch (err) { console.error(err); }
  }

  return {
    recalculate: recalcTotals,
    search: filterProducts,
    init: function() {
      bindEvents();
      return loadProducts();
    }
  };
})();