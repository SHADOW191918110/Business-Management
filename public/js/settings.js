// Settings UI (placeholder persistence in localStorage)
const Settings = (() => {
  function bind() {
    const storeForm = document.getElementById('store-settings-form');
    const taxForm = document.getElementById('tax-settings-form');

    storeForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const data = {
        name: document.getElementById('store-name').value,
        address: document.getElementById('store-address').value,
        phone: document.getElementById('store-phone').value,
      };
      localStorage.setItem('store_settings', JSON.stringify(data));
      alert('Store settings saved');
    });

    taxForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const data = {
        tax: parseFloat(document.getElementById('tax-rate').value || '18'),
        currency: document.getElementById('currency').value
      };
      localStorage.setItem('tax_settings', JSON.stringify(data));
      alert('Tax settings saved');
    });

    // Load stored settings
    const ss = localStorage.getItem('store_settings');
    if (ss) {
      const data = JSON.parse(ss);
      document.getElementById('store-name').value = data.name;
      document.getElementById('store-address').value = data.address;
      document.getElementById('store-phone').value = data.phone;
    }
    const ts = localStorage.getItem('tax_settings');
    if (ts) {
      const data = JSON.parse(ts);
      document.getElementById('tax-rate').value = data.tax;
      document.getElementById('currency').value = data.currency;
    }
  }

  return { bind };
})();

document.addEventListener('DOMContentLoaded', Settings.bind);
