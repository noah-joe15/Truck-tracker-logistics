const Trucks = {
  brands: ['Scania', 'Howo', 'Fuso', 'Renault', 'Mercedes', 'Canter'],

  render() {
    const trucks = DB.trucks();
    return `
      <h1 class="section-title">${Icons.truck} Manage Trucks</h1>
      <div class="form-section">
        <h2>${Icons.plus} Add New Truck</h2>
        <div class="form-row">
          <div><label>Plate Number</label><input type="text" id="truckPlate"></div>
          <div><label>Brand</label>
            <select id="truckBrand">${this.brands.map(b => `<option>${b}</option>`).join('')}</select>
          </div>
          <div><label>Model</label><input type="text" id="truckModel"></div>
          <div><label>Year</label><input type="number" id="truckYear" value="2024"></div>
        </div>
        <div class="form-row">
          <div><label>Trailers</label>
            <select id="truckTrailers"><option>0 Trailers</option><option>1 Trailer</option><option>2 Trailers</option></select>
          </div>
          <div><label>Fuel Type</label>
            <select id="truckFuel"><option>Diesel</option><option>Petrol</option></select>
          </div>
        </div>
        <button class="btn-primary" onclick="Trucks.add()">Add Truck</button>
      </div>

      <div class="form-section">
        <h2>${Icons.clipboard} Fleet List</h2>
        <table class="data-table">
          <thead><tr><th>Plate</th><th>Brand</th><th>Model</th><th>Year</th><th>Trailers</th><th>Status</th><th>Action</th></tr></thead>
          <tbody>${this.rows(trucks)}</tbody>
        </table>
      </div>
    `;
  },

  rows(trucks) {
    if (!trucks.length) return '<tr><td colspan="7" style="text-align:center;color:#64748b;">No trucks added</td></tr>';
    return trucks.map(t => `
      <tr>
        <td>${Utils.esc(t.plateNumber)}</td>
        <td>${Utils.esc(t.brand)}</td>
        <td>${Utils.esc(t.model || '---')}</td>
        <td>${t.year || '---'}</td>
        <td>${Utils.esc(t.trailers || '0')}</td>
        <td>${Utils.statusBadge(t.serviceStatus || 'Active')}</td>
        <td><button class="btn-danger" onclick="Trucks.remove('${t.id}')">${Icons.trash} Delete</button></td>
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
    if (!truck.plateNumber) return alert('Plate number required');
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
