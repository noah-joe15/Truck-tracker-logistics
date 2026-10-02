const Drivers = {
  render() {
    const drivers = DB.drivers(), trucks = DB.trucks();
    return `
      <h1 class="section-title">${Icons.users} Manage Drivers</h1>
      <div class="form-section">
        <h2>${Icons.plus} Add Driver</h2>
        <div class="form-row">
          <div><label>Name</label><input type="text" id="drvName"></div>
          <div><label>Phone</label><input type="text" id="drvPhone"></div>
          <div><label>License No.</label><input type="text" id="drvLicense"></div>
          <div><label>Assign Truck</label>
            <select id="drvTruck">${Utils.optionsHTML(trucks, 'plateNumber', 'id', 'None')}</select>
          </div>
        </div>
        <button class="btn-primary" onclick="Drivers.add()">Add Driver</button>
      </div>
      <div class="form-section">
        <h2>${Icons.clipboard} Driver List</h2>
        <table class="data-table">
          <thead><tr><th>Name</th><th>Phone</th><th>License</th><th>Truck</th><th>Action</th></tr></thead>
          <tbody>${this.rows(drivers, trucks)}</tbody>
        </table>
      </div>
    `;
  },
  rows(drivers, trucks) {
    if (!drivers.length) return '<tr><td colspan="5" style="text-align:center;color:#64748b;">No drivers</td></tr>';
    return drivers.map(d => {
      const t = trucks.find(x => x.id === d.truckId);
      return `<tr>
        <td>${Utils.esc(d.name)}</td>
        <td>${Utils.esc(d.phone || '---')}</td>
        <td>${Utils.esc(d.license || '---')}</td>
        <td>${t ? Utils.esc(t.plateNumber) : '---'}</td>
        <td><button class="btn-danger" onclick="Drivers.remove('${d.id}')">${Icons.trash} Delete</button></td>
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
    if (!d.name) return alert('Driver name required');
    DB.push('drivers', d);
    App.refresh();
  },
  remove(id) { if (confirm('Delete?')) { DB.remove('drivers', id); App.refresh(); } }
};
