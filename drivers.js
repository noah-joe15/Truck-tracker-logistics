const Drivers = {
  render() {
    const drivers = DB.drivers(), trucks = DB.trucks();
    return `
      <div class="section-title"><h2>${Icons.users} Manage Drivers</h2></div>
      <div class="form-section">
        <h2>${Icons.plus} Add Driver</h2>
        <div class="form-row">
          <div class="form-group">
            <label>Full Name</label>
            <input type="text" id="drvName" class="input-field" placeholder="Driver full name">
          </div>
          <div class="form-group">
            <label>Phone Number</label>
            <input type="text" id="drvPhone" class="input-field" placeholder="+255...">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>License No.</label>
            <input type="text" id="drvLicense" class="input-field" placeholder="License number">
          </div>
          <div class="form-group">
            <label>Assign Truck</label>
            <select id="drvTruck" class="input-field">${Utils.optionsHTML(trucks, 'plateNumber', 'id', 'None (Unassigned)')}</select>
          </div>
        </div>
        <button class="btn-primary" onclick="Drivers.add()"><i class="fas fa-user-plus"></i> Add Driver</button>
      </div>

      <div class="form-section">
        <h2>${Icons.clipboard} Driver List</h2>
        <div class="table-wrapper">
          <table class="data-table">
            <thead><tr><th>Name</th><th>Phone</th><th>License</th><th>Assigned Truck</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>${this.rows(drivers, trucks)}</tbody>
          </table>
        </div>
      </div>
    `;
  },

  rows(drivers, trucks) {
    if (!drivers.length) return '<tr><td colspan="6" style="text-align:center; color:#64748b; padding: 30px;">No drivers added yet.</td></tr>';
    return drivers.map(d => {
      const t = trucks.find(x => x.id === d.truckId);
      return `<tr>
        <td data-label="Name">${Utils.esc(d.name)}</td>
        <td data-label="Phone">${Utils.esc(d.phone || '---')}</td>
        <td data-label="License">${Utils.esc(d.license || '---')}</td>
        <td data-label="Truck">${t ? Utils.esc(t.plateNumber) : '<span style="color:#94a3b8">Unassigned</span>'}</td>
        <td data-label="Status">${Utils.statusBadge(d.status || 'Active')}</td>
        <td data-label="Action"><button class="btn-danger" onclick="Drivers.remove('${d.id}')"><i class="fas fa-trash"></i> Delete</button></td>
      </tr>`;
    }).join('');
  },

  add() {
    const d = {
      name: document.getElementById('drvName').value.trim(),
      phone: document.getElementById('drvPhone').value,
      license: document.getElementById('drvLicense').value,
      truckId: document.getElementById('drvTruck').value,
      status: 'Active'
    };
    if (!d.name) return alert('Driver name is required.');
    DB.push('drivers', d);
    App.refresh();
  },

  remove(id) {
    if (confirm('Delete this driver?')) { DB.remove('drivers', id); App.refresh(); }
  }
};
