const Compliance = {
  categories: ['LATRA Permit', 'Insurance', 'Road Fitness', 'Parking', 'Penalty', 'Vehicle License'],

  render() {
    const trucks = DB.trucks();
    const list = DB.compliance().sort((a, b) => new Date(a.expiry) - new Date(b.expiry));
    const expiringSoon = list.filter(c => {
      const days = Math.ceil((new Date(c.expiry) - new Date()) / 86400000);
      return days >= 0 && days < 30;
    }).length;
    const expired = list.filter(c => {
      const days = Math.ceil((new Date(c.expiry) - new Date()) / 86400000);
      return days < 0;
    }).length;

    return `
      <div class="section-title">
        <h2>${Icons.shield} Regulatory &amp; Compliance</h2>
      </div>

      <div class="kpi-grid" style="margin-bottom: 20px;">
        <div class="kpi-card cost">
          <div class="kpi-icon-wrapper cost"><i class="fas fa-exclamation-triangle"></i></div>
          <div class="kpi-label">Expiring Soon</div>
          <div class="kpi-value">${expiringSoon}</div>
        </div>
        <div class="kpi-card" style="border-color: var(--danger);">
          <div class="kpi-icon-wrapper" style="background: rgba(220, 38, 38, 0.12); color: var(--danger);"><i class="fas fa-times-circle"></i></div>
          <div class="kpi-label">Expired</div>
          <div class="kpi-value" style="color: var(--danger);">${expired}</div>
        </div>
      </div>

      <div class="form-section">
        <h2>${Icons.plus} Add Compliance Record</h2>
        
        <div class="form-row">
          <div class="form-group">
            <label>Category</label>
            <select id="cmpCat" class="input-field">
              ${this.categories.map(c => `<option>${c}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label>Truck</label>
            <select id="cmpTruck" class="input-field">
              ${Utils.optionsHTML(trucks, 'plateNumber', 'id', 'Select Truck...')}
            </select>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>Expiry Date</label>
            <input type="date" id="cmpExpiry" class="input-field">
          </div>
          <div class="form-group">
            <label>Amount (TZS)</label>
            <input type="number" id="cmpAmount" class="input-field" placeholder="0.00" min="0">
          </div>
        </div>

        <div class="form-group">
          <label>Receipt No.</label>
          <input type="text" id="cmpRef" class="input-field" placeholder="Receipt or reference number">
        </div>

        <button class="btn-primary" onclick="Compliance.add()">
          <i class="fas fa-save"></i> Add Compliance Record
        </button>
      </div>

      <div class="form-section">
        <h2>${Icons.clipboard} Compliance Status</h2>
        <div class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Truck</th>
                <th>Expiry</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>${this.rows(list, trucks)}</tbody>
          </table>
        </div>
      </div>
    `;
  },

  rows(list, trucks) {
    if (!list.length) {
      return '<tr><td colspan="5" style="text-align:center; color:#64748b; padding: 30px;">No compliance records yet.</td></tr>';
    }
    return list.map(c => {
      const t = trucks.find(x => x.id === c.truckId);
      const days = Math.ceil((new Date(c.expiry) - new Date()) / 86400000);
      const status = days < 0 ? 'Expired' : days < 30 ? 'Overdue' : 'Active';
      return `<tr>
        <td data-label="Item">${Utils.esc(c.category)}</td>
        <td data-label="Truck">${t ? Utils.esc(t.plateNumber) : '---'}</td>
        <td data-label="Expiry">${Utils.fmtDate(c.expiry)}</td>
        <td data-label="Status">${Utils.statusBadge(status)}</td>
        <td data-label="Action"><button class="btn-danger" onclick="Compliance.remove('${c.id}')"><i class="fas fa-trash"></i> Delete</button></td>
      </tr>`;
    }).join('');
  },

  add() {
    const rec = {
      category: document.getElementById('cmpCat').value,
      truckId: document.getElementById('cmpTruck').value,
      expiry: document.getElementById('cmpExpiry').value,
      amount: document.getElementById('cmpAmount').value,
      ref: document.getElementById('cmpRef').value
    };
    if (!rec.truckId || !rec.expiry) return alert('Truck and expiry date are required.');
    DB.push('compliance', rec);
logActivity({ module: 'compliance', action: 'create', description: `Added ${rec.category} for truck`, ref: rec.truckId, user: 'admin' });
App.refresh();
  },

  remove(id) {
    if (confirm('Delete this compliance record?')) {
      DB.remove('compliance', id);
logActivity({ module: 'compliance', action: 'delete', description: `Deleted compliance record ${id}`, ref: id, user: 'admin' });
App.refresh();
    }
  }
};
