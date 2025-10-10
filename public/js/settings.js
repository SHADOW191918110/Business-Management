const Settings = (() => {
  function bindEvents() {
    const storeForm = document.getElementById('store-settings-form');
    const taxForm = document.getElementById('tax-settings-form');

    storeForm?.addEventListener('submit', (e) => {
      e.preventDefault();
      alert('Store settings saved (demo).');
    });

    taxForm?.addEventListener('submit', (e) => {
      e.preventDefault();
      const taxRate = parseFloat(document.getElementById('tax-rate').value || '18');
      App.state.taxRate = taxRate; // Update global state
      alert(`Tax rate updated to ${taxRate}%.`);
    });
  }

  return { 
      init() {
          bindEvents();
          // No data to load, so we return a resolved promise
          return Promise.resolve();
      }
  };
})();