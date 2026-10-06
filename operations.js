const Operations = {
  render() {
    const trucks = DB.trucks(), drivers = DB.drivers(), customers = DB.customers();
    const trips = DB.trips().sort((a, b) => new Date(b.date) - new Date(a.date));

    return `
      <div class="section-title">
        <h2>${Icons.clipboard} Operations — Trip Management</h2>
      </div>

      <div class="form-section">
        <h2>${Icons.plus} Record New Trip</h2>
        
        <div class="form-row">
          <div class="form-group">
            <label>Date</label>
            <input type="date" id="tripDate" class="input-field" value="${Utils.today()}">
          </div>
          <div class="form-group">
            <label>Truck</label>
            <select id="tripTruck" class="input-field">
              ${Utils.optionsHTML(trucks, 'plateNumber', 'id', 'Select Truck...')}
            </select>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>Driver</label>
            <select id="tripDriver" class="input-field">
              ${Utils.optionsHTML(drivers, 'name', 'id', 'Select Driver...')}
            </select>
          </div>
          <div class="form-group">
            <label>Customer</label>
            <select id="tripCustomer" class="input-field">
              ${Utils.optionsHTML(customers, 'name', 'id', 'Select Customer...')}
            </select>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>Type</label>
            <select id="tripType" class="input-field">
              <option>Single Trip</option>
              <option>Round Trip</option>
            </select>
          </div>
          <div class="form-group">
            <label>Load Status</label>
            <select id="tripLoad" class="input-field">
              <option>Loaded</option>
              <option>Empty</option>
            </select>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>From</label>
            <input type="text" id="tripFrom" class="input-field" placeholder="Dar es Salaam">
          </div>
          <div class="form-group">
            <label>To</label>
            <input type="text" id="tripTo" class="input-field" placeholder="Arusha">
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>Distance (Km)</label>
            <input type="number" id="tripDist" class="input-field" placeholder="0" min="0" oninput="Operations.updateFuelEstimate()">
          </div>
          <div class="form-group">
            <label>Revenue (TZS)</label>
            <input type="number" id="tripRevenue" class="input-field" placeholder="0.00" min="0">
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>Status</label>
            <select id="tripStatus" class="input-field">
              <option>In Transit</option>
              <option>Completed</option>
            </select>
          </div>
          <div class="form-group">
            <label>On Time?</label>
            <select id="tripOnTime" class="input-field">
              <option value="1">Yes</option>
              <option value="0">No</option>
            </select>
          </div>
        </div>

        <div id="fuelEstimate" class="smart-estimate" style="display:none;"></div>

        <button class="btn-primary" onclick="Operations.saveTrip()">
          <i class="fas fa-save"></i> Save Trip
        </button>
      </div>

      <div class="form-section">
        <h2>${Icons.clock} Trip History</h2>
        <div class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Truck</th>
                <th>Driver</th>
                <th>Route</th>
                <th>Km</th>
                <th>Revenue</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>${this.tripRows(trips, trucks, drivers)}</tbody>
          </table>
        </div>
      </div>
    `;
  },

  tripRows(trips, trucks, drivers) {
    if (!trips.length) {
      return '<tr><td colspan="8" style="text-align:center; color:#64748b; padding: 30px;">No trips recorded yet.</td></tr>';
    }
    return trips.map(t => {
      const truck = trucks.find(x => x.id === t.truckId);
      const driver = drivers.find(x => x.id === t.driverId);
      return `<tr>
        <td data-label="Date">${Utils.fmtDate(t.date)}</td>
        <td data-label="Truck">${truck ? Utils.esc(truck.plateNumber) : '---'}</td>
        <td data-label="Driver">${driver ? Utils.esc(driver.name) : '---'}</td>
        <td data-label="Route">${Utils.esc(t.from)} &rarr; ${Utils.esc(t.to)}</td>
        <td data-label="Km">${Utils.fmtNum(t.distance)}</td>
        <td data-label="Revenue">${Utils.fmtTZS(t.revenue)}</td>
        <td data-label="Status">${Utils.statusBadge(t.status)}</td>
        <td data-label="Action"><button class="btn-danger" onclick="Operations.deleteTrip('${t.id}')"><i class="fas fa-trash"></i> Delete</button></td>
      </tr>`;
    }).join('');
  },

  updateFuelEstimate() {
    const km = Number(document.getElementById('tripDist').value) || 0;
    const est = Utils.estimateFuel(km);
    const el = document.getElementById('fuelEstimate');
    if (km > 0) {
      el.style.display = 'flex';
      el.innerHTML = `<i class="fas fa-gas-pump"></i> Smart Fuel Estimate: <b>${est.liters} L</b> &asymp; <b>${Utils.fmtTZS(est.cost)}</b>`;
    } else {
      el.style.display = 'none';
    }
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
    if (!trip.truckId || !trip.driverId) return alert('Please select a truck and driver.');
    DB.push('trips', trip);
    if (Number(trip.revenue) > 0) {
      DB.push('income', {
        date: trip.date,
        truckId: trip.truckId,
        driverId: trip.driverId,
        customerId: trip.customerId,
        amount: trip.revenue,
        method: 'Cash',
        description: `Trip ${trip.from} to ${trip.to}`
      });
    }
    App.refresh();
  },

  deleteTrip(id) {
    if (confirm('Delete this trip?')) {
      DB.remove('trips', id);
      App.refresh();
    }
  }
};
