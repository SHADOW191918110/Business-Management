const Reports = (() => {
  const els = {
    todaySales: document.getElementById('today-sales'),
    todayTransactions: document.getElementById('today-transactions'),
    totalProducts: document.getElementById('total-products'),
    totalCustomers: document.getElementById('total-customers'),
    list: document.getElementById('transactions-list')
  };

  function renderRecent(list) {
    if (!list || list.length === 0) {
        els.list.innerHTML = `<p style="color: var(--color-text-secondary);">No recent transactions.</p>`;
        return;
    }
    els.list.innerHTML = list.map(t => `
      <div class="summary-row">
        <span>#${t._id.slice(-6)} - ${new Date(t.createdAt).toLocaleTimeString()}</span>
        <strong>₹${t.total.toFixed(2)}</strong>
      </div>
    `).join('');
  }

  async function load() {
    try {
        const { data } = await API.getDashboard();
        els.todaySales.textContent = `₹${data.todaySales.toFixed(2)}`;
        els.todayTransactions.textContent = data.todayTransactions;
        els.totalProducts.textContent = data.totalProducts;
        els.totalCustomers.textContent = data.totalCustomers;
        renderRecent(data.recent || []);
    } catch (err) {
        console.error("Failed to load reports:", err);
    }
  }
  
  return {
    load,
    init() {
        return load();
    }
  };
})();