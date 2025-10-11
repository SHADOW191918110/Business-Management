const Settings = (() => {
  function bindEvents() {
    const storeForm = document.getElementById('store-settings-form');
    const taxForm = document.getElementById('tax-settings-form');

    storeForm?.addEventListener('submit', (e) => {
      e.preventDefault();
      alert('Store settings saved');
    });

    taxForm?.addEventListener('submit', (e) => {
      e.preventDefault();
      const tax = parseFloat(document.getElementById('tax-rate').value || '18');
      App.state.taxRate = tax;
      if (typeof POS !== 'undefined' && POS.recalculate) {
          POS.recalculate();
      }
      alert('Tax settings saved');
    });
  }

  return { 
    init() {
      bindEvents();
      return Promise.resolve(); // No async data to load
    } 
  };
})();