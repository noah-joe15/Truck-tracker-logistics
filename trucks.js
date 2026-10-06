const Trucks = {
  brands: ['Scania', 'Howo', 'Fuso', 'Renault', 'Mercedes', 'Canter'],

  render() {
    const trucks = DB.trucks();
    return `
      <div class="section-title"><h2>${Icons.truck} Manage Trucks</h2></div>
      <div class="form-section">
        <h2>${Icons.plus} Add New Truck</h2>
        <div class="form-row">
          <div class="form-group">
            <label>Plate Number</label>
            <input type="text" id="truckPlate" class="input-field" placeholder="e.g., T 123 ABC">
          </div>
          <div class="form-group">
            <label>Brand</label>
            <select id="truckBrand" class="input-field">${this.brands.map(b => `<option>${b}</option>`).join('')}</select>
          </div>
          <div class="form-group">
            <label>Model</label>
            <input type="text" id="truckModel" class="input-field" placeholder="e.g., R500">
          </div>
          <div class="form-group">
            <label>Year</label>
            <input type="number" id="truckYear" class="input-field" value="2024" min="1990" max="2030">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Trailers</label>
            <select id="truckTrailers" class="input-field"><option>0 Trailers</option><option>1 Trailer</option><option>2 Trailers</option></select>
          </div>
          <div class="form-group">
            <label>Fuel Type</label>
            <select id="truckFuel" class="input-field"><option>Diesel</option><option>Petrol</option></select>
          </div>
        </div>
        <button class="btn-primary" onclick="Trucks.add()"><i class="fas fa-truck"></i> Add Truck</button>
      </div>

      <div class="form-section">
        <h2>${Icons.clipboard} Fleet List</h2>
        <div class="table-wrapper">
          <table class="data-table">
            <thead><tr><th>Plate</th><th>Brand</th><th>Model</th><th>Year</th><th>Trailers</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>${this.rows(trucks)}</tbody>
          </table>
        </div>
      </div>
    `;
  },

  rows(trucks) {
    if (!trucks.length) return '<tr><td colspan="7" style="text-align:center; color:#64748b; padding: 30px;">No trucks added yet.</td></tr>';
    return trucks.map(t => `
      <tr>
        <td data-label="Plate">${Utils.esc(t.plateNumber)}</td>
        <td data-label="Brand">${Utils.esc(t.brand)}</td>
        <td data-label="Model">${Utils.esc(t.model || '---')}</td>
        <td data-label="Year">${t.year || '---'}</td>
        <td data-label="Trailers">${Utils.esc(t.trailers || '0')}</td>
        <td data-label="Status">${Utils.statusBadge(t.serviceStatus || 'Active')}</td>
        <td data-label="Action"><button class="btn-danger" onclick="Trucks.remove('${t.id}')"><i class="fas fa-trash"></i> Delete</button></td>
      </tr>
    `).join('');
  },

  add() {
    const truck = {
      plateNumber: document.getElementById('truckPlate').value.trim(),
      brand: document.getElementById('truckBrand').value,
      model: document.getElementById('truckModel').value,
      year: document.getElementById('truckYear').value,
      trailers: document.getElementById('truckTrailers').value,
      fuelType: document.getElementById('truckFuel').value,
      serviceStatus: 'Active'
    };
    if (!truck.plateNumber) return alert('Plate number is required.');
    DB.push('trucks', truck);
    App.refresh();
  },

  remove(id) {
    if (confirm('Delete this truck?')) { DB.remove('trucks', id); App.refresh(); }
  },

  markService(id) {
    DB.update('trucks', id, { serviceStatus: 'Active', lastService: Utils.today() });
  }
};
