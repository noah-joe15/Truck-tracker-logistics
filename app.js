const App = {
  views: {
    dashboard:  Dashboard,
    kpi:        KPI,
    expenses:   Expenses,
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
    // Remove active class from all buttons
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    
    // Add active class to the clicked button
    const activeBtn = document.querySelector(`[data-view="${view}"]`);
    if (activeBtn) activeBtn.classList.add('active');
    
    // Render the view
    const v = this.views[view];
    if (!v) return;
    
    document.getElementById('viewContainer').innerHTML = v.render();
    
    // Call afterRender if it exists (for charts, etc.)
    if (v.afterRender) {
      setTimeout(() => v.afterRender(), 50); // Small delay ensures DOM is ready
    }
  },

  refresh() {
    const active = document.querySelector('.nav-btn.active');
    if (active) this.navigate(active.dataset.view);
  },

  settingsView() {
    return `
      <div class="section-title">
        <h2><i class="fas fa-cog"></i> Settings</h2>
      </div>
      <div class="form-section">
        <h2><i class="fas fa-database"></i> Data Management</h2>
        <div style="display: flex; gap: 12px; flex-wrap: wrap; margin-top: 16px;">
          <button class="btn-primary" style="width: auto;" onclick="App.exportBackup()">
            <i class="fas fa-download"></i> Download Backup
          </button>
          <label class="btn-primary" style="width: auto; cursor: pointer; display: inline-flex; align-items: center; gap: 8px;">
            <i class="fas fa-upload"></i> Restore File
            <input type="file" accept=".json" style="display: none;" onchange="App.importBackup(event)">
          </label>
        </div>
      </div>
      <div class="form-section" style="border: 2px solid var(--danger);">
        <h2 style="color: var(--danger);"><i class="fas fa-exclamation-triangle"></i> Danger Zone</h2>
        <p style="color: var(--text-light); margin-bottom: 12px;">This will permanently delete all trucks, drivers, trips, and financial records.</p>
        <button class="btn-danger" onclick="App.factoryReset()">
          <i class="fas fa-trash"></i> Factory Reset App
        </button>
      </div>
    `;
  },

  exportBackup() {
    const data = {
      trucks: DB.trucks(), 
      drivers: DB.drivers(), 
      customers: DB.customers(),
      trips: DB.trips(), 
      expenses: DB.expenses(), 
      income: DB.income(),
      debts: DB.debts(), 
      compliance: DB.compliance()
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
      } catch { 
        alert('Invalid backup file. Please select a valid .json file.'); 
      }
    };
    reader.readAsText(file);
  },

  factoryReset() {
    if (confirm('WARNING: This will DELETE ALL DATA permanently. Are you sure you want to continue?')) {
      DB.clearAll();
      location.reload();
    }
  }
};

// =========================================================
// INITIALIZATION & MOBILE MENU TOGGLE
// =========================================================
document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize the main App (sets up login button and nav clicks)
  App.init();

  // 2. Mobile menu toggle logic
  const burger = document.getElementById('burgerBtn');
  const sidebar = document.getElementById('sidebar');
  const scrim = document.getElementById('scrim');
  
  if (burger) {
    burger.addEventListener('click', () => {
      document.body.classList.toggle('nav-open');
      burger.classList.toggle('active');
    });
  }
  
  if (scrim) {
    scrim.addEventListener('click', () => {
      document.body.classList.remove('nav-open');
      if (burger) burger.classList.remove('active');
    });
  }
  
  // Close menu when clicking a nav button on mobile
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (window.innerWidth < 1080) {
        document.body.classList.remove('nav-open');
        if (burger) burger.classList.remove('active');
      }
    });
  });
});
