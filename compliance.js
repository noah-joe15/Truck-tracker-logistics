const Compliance = {
  categories: ['LATRA Permit', 'Insurance', 'Road Fitness', 'Parking', 'Penalty', 'Vehicle License'],

  render() {
    const trucks = DB.trucks();
    const list = DB.compliance().sort((a, b) => new Date(a.expiry) - new Date(b.expiry));
    return `
      <h1 class="section-title">${Icons.shield} Regulatory &amp; Compliance</h1>
      <div class="form-section">
        <h2>${Icons.plus} Add Compliance Record</h2>
        <div class="form-row">
          <div><label>Category</label>
            <select id="cmpCat">${this.categories.map(c => `<option>${c}</option>`).join('')}</select>
          </div>
          <div><label>Truck</label>
            <select id="cmpTruck">${Utils.optionsHTML(trucks, 'plateNumber', 'id')}</select>
          </div>
          <div><label>Expiry Date</label><input type="date" id="cmpExpiry"></div>
          <div><label>Amount (TZS)</label><input type="number" id="cmpAmount"></div>
          <div><label>Receipt No.</label><input type="text" id="cmpRef"></div>
        </div>
        <button class="btn-primary" onclick="Compliance.add()">Add Compliance Record</button>
      </div>
      <div class="form-section">
        <h2>${Icons.clipboard} Compliance Status</h2>
        <table class="data-table">
          <thead><tr><th>Item</th><th>Truck</th><th>Expiry</th><th>Status</th><th>Action</th></tr></thead>
          <tbody>${this.rows(list, trucks)}</tbody>
        </table>
      </div>
    `;
  },

  rows(list, trucks) {
    if (!list.length) return '<tr><td colspan="5" style="text-align:center;color:#64748b;">No records</td></tr>';
    return list.map(c => {
      const t = trucks.find(x => x.id === c.truckId);
      const days = Math.ceil((new Date(c.expiry) - new Date()) / 86400000);
      const status = days < 0 ? 'Expired' : days < 30 ? 'Overdue' : 'Active';
      return `<tr>
        <td>${Utils.esc(c.category)}</td>
        <td>${t ? Utils.esc(t.plateNumber) : '---'}</td>
        <td>${Utils.fmtDate(c.expiry)}</td>
        <td>${Utils.statusBadge(status)}</td>
        <td><button class="btn-danger" onclick="Compliance.remove('${c.id}')">${Icons.trash} Delete</button></td>
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
    if (!rec.truckId || !rec.expiry) return alert('Truck and expiry required');
    DB.push('compliance', rec);
    App.refresh();
  },
  remove(id) { if (confirm('Delete?')) { DB.remove('compliance', id); App.refresh(); } }
};
