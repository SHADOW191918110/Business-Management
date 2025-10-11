const Reports = (() => {
  const els = {
    todaySales: document.getElementById('today-sales'),
    todayTransactions: document.getElementById('today-transactions'),
    totalProducts: document.getElementById('total-products'),
    totalCustomers: document.getElementById('total-customers'),
    list: document.getElementById('transactions-list')
  };

  function renderRecent(list) {
    els.list.innerHTML = list.map(t => `
      <div class="trx">
        <div><strong>#${t._id.slice(-6)}</strong> • ₹${t.total.toFixed(2)} • ${new Date(t.createdAt).toLocaleTimeString()}</div>
        <div>${t.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}</div>
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
    } catch(err) {
        console.error("Failed to load reports data", err);
    }
  }
  
  return {
    load,
    init() {
        // No events to bind, just load data
        return load();
    }
  };
})();