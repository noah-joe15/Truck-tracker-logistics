const Operations = {
  render() {
    const trucks = DB.trucks(), drivers = DB.drivers(), customers = DB.customers();
    const trips = DB.trips().sort((a, b) => new Date(b.date) - new Date(a.date));

    return `
      <h1 class="section-title">${Icons.clipboard} Operations -- Trip Management</h1>

      <div class="form-section">
        <h2>${Icons.plus} Record New Trip</h2>
        <div class="form-row">
          <div><label>Date</label><input type="date" id="tripDate" value="${Utils.today()}"></div>
          <div><label>Truck</label><select id="tripTruck">${Utils.optionsHTML(trucks, 'plateNumber', 'id')}</select></div>
          <div><label>Driver</label><select id="tripDriver">${Utils.optionsHTML(drivers, 'name', 'id')}</select></div>
          <div><label>Customer</label><select id="tripCustomer">${Utils.optionsHTML(customers, 'name', 'id')}</select></div>
        </div>
        <div class="form-row">
          <div><label>Type</label>
            <select id="tripType"><option>Single Trip</option><option>Round Trip</option></select>
          </div>
          <div><label>Load Status</label>
            <select id="tripLoad"><option>Loaded</option><option>Empty</option></select>
          </div>
          <div><label>From</label><input type="text" id="tripFrom" placeholder="Dar es Salaam"></div>
          <div><label>To</label><input type="text" id="tripTo" placeholder="Arusha"></div>
        </div>
        <div class="form-row">
          <div><label>Distance (Km)</label><input type="number" id="tripDist" oninput="Operations.updateFuelEstimate()"></div>
          <div><label>Revenue (TZS)</label><input type="number" id="tripRevenue"></div>
          <div><label>Status</label>
            <select id="tripStatus"><option>In Transit</option><option>Completed</option></select>
          </div>
          <div><label>On Time?</label>
            <select id="tripOnTime"><option value="1">Yes</option><option value="0">No</option></select>
          </div>
        </div>
        <div id="fuelEstimate" style="margin:12px 0;color:#f59e0b;"></div>
        <button class="btn-primary" onclick="Operations.saveTrip()">Save Trip</button>
      </div>

      <div class="form-section">
        <h2>${Icons.clock} Trip History</h2>
        <table class="data-table">
          <thead><tr><th>Date</th><th>Truck</th><th>Driver</th><th>Route</th><th>Km</th>
          <th>Revenue</th><th>Status</th><th>Action</th></tr></thead>
          <tbody>${this.tripRows(trips, trucks, drivers)}</tbody>
        </table>
      </div>
    `;
  },

  tripRows(trips, trucks, drivers) {
    if (!trips.length) return '<tr><td colspan="8" style="text-align:center;color:#64748b;">No trips recorded</td></tr>';
    return trips.map(t => {
      const truck = trucks.find(x => x.id === t.truckId);
      const driver = drivers.find(x => x.id === t.driverId);
      return `<tr>
        <td>${Utils.fmtDate(t.date)}</td>
        <td>${truck ? Utils.esc(truck.plateNumber) : '---'}</td>
        <td>${driver ? Utils.esc(driver.name) : '---'}</td>
        <td>${Utils.esc(t.from)} &rarr; ${Utils.esc(t.to)}</td>
        <td>${Utils.fmtNum(t.distance)}</td>
        <td>${Utils.fmtTZS(t.revenue)}</td>
        <td>${Utils.statusBadge(t.status)}</td>
        <td><button class="btn-danger" onclick="Operations.deleteTrip('${t.id}')">${Icons.trash} Delete</button></td>
      </tr>`;
    }).join('');
  },

  updateFuelEstimate() {
    const km = Number(document.getElementById('tripDist').value) || 0;
    const est = Utils.estimateFuel(km);
    document.getElementById('fuelEstimate').innerHTML =
      `${Icons.fuel} Smart Fuel Estimate: <b>${est.liters} L</b> &asymp; <b>${Utils.fmtTZS(est.cost)}</b>`;
  },

  saveTrip() {
    const trip = {
      date: document.getElementById('tripDate').value,
      truckId: document.getElementById('tripTruck').value,
      driverId: document.getElementById('tripDriver').value,
      customerId: document.getElementById('tripCustomer').value,
      type: document.getElementById('tripType').value,
      loadStatus: document.getElementById('tripLoad').value,
      from: document.getElementById('tripFrom').value,
      to: document.getElementById('tripTo').value,
      distance: document.getElementById('tripDist').value,
      revenue: document.getElementById('tripRevenue').value,
      status: document.getElementById('tripStatus').value,
      onTime: document.getElementById('tripOnTime').value === '1'
    };
    if (!trip.truckId || !trip.driverId) return alert('Select truck and driver');
    DB.push('trips', trip);
    if (Number(trip.revenue) > 0) {
      DB.push('income', {
        date: trip.date, truckId: trip.truckId, driverId: trip.driverId,
        customerId: trip.customerId, amount: trip.revenue, method: 'Cash',
        description: `Trip ${trip.from} to ${trip.to}`
      });
    }
    App.refresh();
  },

  deleteTrip(id) {
    if (confirm('Delete this trip?')) { DB.remove('trips', id); App.refresh(); }
  }
};
