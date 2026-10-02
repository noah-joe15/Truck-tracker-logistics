const App = {
  views: {
    dashboard:  Dashboard,
    kpi:        KPI,
    map:        MapView,
    history:    { render: () => Operations.render() },
    analytics:  Analytics,
    debt:       Debt,
    operations: Operations,
    compliance: Compliance,
    settings:   { render: () => App.settingsView() }
  },

  init() {
    Auth.init();
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.addEventListener('click', () => this.navigate(btn.dataset.view));
    });
  },

  showApp() {
    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('appShell').classList.remove('hidden');
    this.navigate('dashboard');
  },

  navigate(view) {
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    const activeBtn = document.querySelector(`[data-view="${view}"]`);
    if (activeBtn) activeBtn.classList.add('active');
    const v = this.views[view];
    if (!v) return;
    document.getElementById('viewContainer').innerHTML = v.render();
    if (v.afterRender) v.afterRender();
  },

  refresh() {
    const active = document.querySelector('.nav-btn.active');
    if (active) this.navigate(active.dataset.view);
  },

  settingsView() {
    return `
      <h1 class="section-title">${Icons.settings} Settings</h1>
      <div class="form-section">
        <h2>${Icons.download} Data Management</h2>
        <button class="btn-primary" onclick="App.exportBackup()">${Icons.download} Download Backup</button>
        <label class="btn-primary" style="display:inline-flex;margin-left:8px;cursor:pointer;">
          ${Icons.upload} Restore File
          <input type="file" accept=".json" style="display:none;" onchange="App.importBackup(event)">
        </label>
      </div>
      <div class="form-section">
        <h2>${Icons.clipboard} Expense Categories</h2>
        <p style="color:#94a3b8;">Fuel, Maintenance, Tolls, Parking, Salary, Other</p>
      </div>
      <div class="form-section" style="border:2px solid #dc2626;">
        <h2 style="color:#dc2626;">${Icons.danger} Danger Zone</h2>
        <button class="btn-danger" onclick="App.factoryReset()">${Icons.trash} Factory Reset App</button>
      </div>
    `;
  },

  exportBackup() {
    const data = {
      trucks: DB.trucks(), drivers: DB.drivers(), customers: DB.customers(),
      trips: DB.trips(), expenses: DB.expenses(), income: DB.income(),
      debts: DB.debts(), compliance: DB.compliance()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `malibora-backup-${Utils.today()}.json`;
    a.click();
  },

  importBackup(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const data = JSON.parse(ev.target.result);
        Object.keys(data).forEach(k => DB.set(k, data[k]));
        alert('Backup restored successfully.');
        App.refresh();
      } catch { alert('Invalid backup file.'); }
    };
    reader.readAsText(file);
  },

  factoryReset() {
    if (confirm('This will DELETE ALL DATA. Are you sure you want to continue?')) {
      DB.clearAll();
      location.reload();
    }
  }
};

document.addEventListener('DOMContentLoaded', () => App.init());
