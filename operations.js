// Tanzania Mainland Regions (2022 Census) & Approximate Capital Coordinates
const tzRegions = [
  'Arusha', 'Dar es Salaam', 'Dodoma', 'Geita', 'Iringa', 
  'Kagera', 'Katavi', 'Kigoma', 'Kilimanjaro', 'Lindi', 
  'Manyara', 'Mara', 'Mbeya', 'Morogoro', 'Mtwara', 
  'Mwanza', 'Njombe', 'Pwani', 'Rukwa', 'Ruvuma', 
  'Shinyanga', 'Simiyu', 'Singida', 'Tabora', 'Tanga', 'Songwe'
];

const regionCoords = {
  'Arusha': { lat: -3.3869, lon: 36.6830 },
  'Dar es Salaam': { lat: -6.7924, lon: 39.2083 },
  'Dodoma': { lat: -6.1630, lon: 35.7516 },
  'Geita': { lat: -2.8714, lon: 32.2275 },
  'Iringa': { lat: -7.7697, lon: 35.6917 },
  'Kagera': { lat: -1.3314, lon: 31.8133 },
  'Katavi': { lat: -6.3500, lon: 31.2500 },
  'Kigoma': { lat: -4.8767, lon: 29.6269 },
  'Kilimanjaro': { lat: -3.3500, lon: 37.3333 },
  'Lindi': { lat: -9.9972, lon: 39.7167 },
  'Manyara': { lat: -4.2167, lon: 35.7500 },
  'Mara': { lat: -1.5000, lon: 33.8000 },
  'Mbeya': { lat: -8.9000, lon: 33.4500 },
  'Morogoro': { lat: -6.8211, lon: 37.6636 },
  'Mtwara': { lat: -10.2694, lon: 40.1833 },
  'Mwanza': { lat: -2.5167, lon: 32.9000 },
  'Njombe': { lat: -9.3333, lon: 34.7667 },
  'Pwani': { lat: -7.1000, lon: 38.7000 },
  'Rukwa': { lat: -7.9500, lon: 31.1500 },
  'Ruvuma': { lat: -10.6833, lon: 35.6500 },
  'Shinyanga': { lat: -3.6667, lon: 33.4167 },
  'Simiyu': { lat: -2.8333, lon: 33.5500 },
  'Singida': { lat: -4.8167, lon: 34.7500 },
  'Tabora': { lat: -5.0167, lon: 32.8000 },
  'Tanga': { lat: -5.0667, lon: 39.1000 },
  'Songwe': { lat: -9.1167, lon: 33.5000 }
};

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
            <label>Trip Type</label>
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
            <label>From (Region)</label>
            <select id="tripFrom" class="input-field" onchange="Operations.calculateDistance()">
              <option value="">-- Select Origin Region --</option>
              ${tzRegions.map(r => `<option value="${r}">${r}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label>To (Region)</label>
            <select id="tripTo" class="input-field" onchange="Operations.calculateDistance()">
              <option value="">-- Select Destination Region --</option>
              ${tzRegions.map(r => `<option value="${r}">${r}</option>`).join('')}
            </select>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>Distance (Km)</label>
            <input type="number" id="tripDist" class="input-field" placeholder="Auto-calculated" min="0" oninput="Operations.updateFuelEstimate()">
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

  // Haversine formula to calculate road distance estimate
  calculateDistance() {
    const from = document.getElementById('tripFrom').value;
    const to = document.getElementById('tripTo').value;
    const distInput = document.getElementById('tripDist');

    if (from && to && regionCoords[from] && regionCoords[to]) {
      const lat1 = regionCoords[from].lat;
      const lon1 = regionCoords[from].lon;
      const lat2 = regionCoords[to].lat;
      const lon2 = regionCoords[to].lon;

      const R = 6371; // Earth radius in km
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      
      const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
        
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      
      // Multiply by 1.25 to approximate actual road distance vs straight-line distance
      const roadDistance = Math.round(R * c * 1.25);
      
      distInput.value = roadDistance;
      this.updateFuelEstimate();
    } else {
      distInput.value = '';
      this.updateFuelEstimate();
    }
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
    if (!trip.from || !trip.to) return alert('Please select both Origin and Destination regions.');
    
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
