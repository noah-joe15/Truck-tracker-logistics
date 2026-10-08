// ============================================================
// TRIP OPERATIONS MODULE
// ============================================================

const TripOps = {
  brands: ['Scania', 'Howo', 'Fuso', 'Renault', 'Mercedes', 'Canter', 'Volvo', 'MAN'],

  render() {
    const trucks = DB.trucks();
    const drivers = DB.drivers();
    const customers = DB.customers();
    const trips = DB.trips().sort((a, b) => new Date(b.date) - new Date(a.date));

    return `
      <div class="section-title">
        <h2><i class="fas fa-clipboard-list"></i> Operations — Trip Management</h2>
      </div>

      <!-- GRID LAYOUT FOR FORMS (2 Columns) -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(450px, 1fr)); gap: 20px; margin-bottom: 30px;">
        
        <!-- ========== LEFT COLUMN: ADD TRUCK ========== -->
        <div class="form-section">
          <h2><i class="fas fa-truck"></i> Add New Truck</h2>
          <div class="form-row">
            <div class="form-group">
              <label>Truck Plate Number</label>
              <input type="text" id="truckPlate" class="input-field" placeholder="e.g., T 123 ABC">
            </div>
            <div class="form-group">
              <label>Brand</label>
              <select id="truckBrand" class="input-field">
                ${this.brands.map(b => `<option>${b}</option>`).join('')}
              </select>
            </div>
          </div>
          <div class="form-row">
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
              <label>Number of Trailers</label>
              <select id="truckTrailersCount" class="input-field" onchange="TripOps.renderTrailerPlates()">
                <option value="0">0 Trailers</option>
                <option value="1">1 Trailer</option>
                <option value="2">2 Trailers</option>
              </select>
            </div>
            <div class="form-group">
              <label>Fuel Type</label>
              <select id="truckFuel" class="input-field">
                <option>Diesel</option>
                <option>Petrol</option>
              </select>
            </div>
          </div>
          <div id="trailerPlatesContainer"></div>
          <button class="btn-primary" onclick="TripOps.addTruck()" style="margin-top: 12px; width: 100%;">
            <i class="fas fa-truck"></i> Add Truck
          </button>
        </div>

        <!-- ========== RIGHT COLUMN: ADD DRIVER ========== -->
        <div class="form-section">
          <h2><i class="fas fa-user"></i> Add New Driver</h2>
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
              <label>Assign Truck (Optional)</label>
              <select id="drvTruck" class="input-field">
                <option value="">None (Unassigned)</option>
                ${trucks.map(t => `<option value="${t.id}">${t.plateNumber}</option>`).join('')}
              </select>
            </div>
          </div>
          <button class="btn-primary" onclick="TripOps.addDriver()" style="margin-top: 12px; width: 100%;">
            <i class="fas fa-user-plus"></i> Add Driver
          </button>
        </div>

        <!-- ========== LEFT COLUMN ROW 2: ADD CUSTOMER ========== -->
        <div class="form-section">
          <h2><i class="fas fa-user-tie"></i> Add New Customer</h2>
          <div class="form-row">
            <div class="form-group">
              <label>Customer / Company Name</label>
              <input type="text" id="custName" class="input-field" placeholder="Customer full name or company">
            </div>
            <div class="form-group">
              <label>Phone Number</label>
              <input type="text" id="custPhone" class="input-field" placeholder="+255...">
            </div>
          </div>
          <div class="form-group">
            <label>Destination / Location</label>
            <select id="custLocation" class="input-field">
              <option value="">-- Select Region --</option>
              ${tzRegions.map(r => `<option value="${r}">${r}</option>`).join('')}
            </select>
          </div>
          <button class="btn-primary" onclick="TripOps.addCustomer()" style="margin-top: 12px; width: 100%;">
            <i class="fas fa-user-plus"></i> Add Customer
          </button>
        </div>

        <!-- ========== RIGHT COLUMN ROW 2: RECORD NEW TRIP ========== -->
        <div class="form-section">
          <h2><i class="fas fa-plus-circle"></i> Record New Trip</h2>
          
          <div class="form-row">
            <div class="form-group">
              <label>Date</label>
              <input type="date" id="tripDate" class="input-field" value="${Utils.today()}">
            </div>
            <div class="form-group">
              <label>Truck</label>
              <select id="tripTruck" class="input-field" onchange="TripOps.autoFillDriver()">
                <option value="">-- Select Truck --</option>
                ${trucks.map(t => `<option value="${t.id}" data-driver="${t.driverId || ''}">${t.plateNumber}</option>`).join('')}
              </select>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Select Driver</label>
              <select id="tripDriver" class="input-field">
                <option value="">-- Select Driver --</option>
                ${drivers.map(d => {
                  const truck = trucks.find(t => t.id === d.truckId);
                  return `<option value="${d.id}">${d.name}${truck ? ' (' + Utils.esc(truck.plateNumber) + ')' : ' (Unassigned)'}</option>`;
                }).join('')}
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
              <label>From (Region)</label>
              <select id="tripFrom" class="input-field" onchange="TripOps.calculateDistance()">
                <option value="">-- Select Origin --</option>
                ${tzRegions.map(r => `<option value="${r}">${r}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label>To (Region)</label>
              <select id="tripTo" class="input-field" onchange="TripOps.calculateDistance()">
                <option value="">-- Select Destination --</option>
                ${tzRegions.map(r => `<option value="${r}">${r}</option>`).join('')}
              </select>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Distance (Km)</label>
              <input type="number" id="tripDist" class="input-field" placeholder="Auto" min="0" oninput="TripOps.updateFuelEstimate()">
            </div>
            <div class="form-group">
              <label>Total Price (TZS)</label>
              <input type="number" id="tripTotalPrice" class="input-field" placeholder="0.00" min="0" oninput="TripOps.calculateBalance()">
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Paid Now (TZS)</label>
              <input type="number" id="tripPaidAmount" class="input-field" placeholder="0.00" min="0" oninput="TripOps.calculateBalance()">
            </div>
            <div class="form-group">
              <label>Balance (Debt)</label>
              <input type="text" id="tripBalance" class="input-field" readonly value="0 TZS" style="background-color: #fef2f2; color: #dc2626; font-weight: bold;">
            </div>
          </div>

          <div id="fuelEstimate" class="smart-estimate" style="display:none; margin: 8px 0;"></div>

          <button class="btn-primary" onclick="TripOps.saveTrip()" style="margin-top: 12px; width: 100%;">
            <i class="fas fa-save"></i> Save Trip
          </button>
        </div>

      </div>

      <!-- ========== FULL WIDTH: TRIP HISTORY ========== -->
      <div class="form-section">
        <h2><i class="fas fa-history"></i> Trip History</h2>
        <div class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>Date</th><th>Truck</th><th>Driver</th><th>Route</th><th>Km</th>
                <th>Total Price</th><th>Paid</th><th>Balance</th><th>Status</th><th>Action</th>
              </tr>
            </thead>
            <tbody>${this.tripRows(trips, trucks, drivers)}</tbody>
          </table>
        </div>
      </div>
    `;
  },

  renderTrailerPlates() {
    const count = Number(document.getElementById('truckTrailersCount').value) || 0;
    const container = document.getElementById('trailerPlatesContainer');
    if (count === 0) {
      container.innerHTML = '';
      return;
    }
    let html = '<div class="form-row">';
    for (let i = 1; i <= count; i++) {
      html += `
        <div class="form-group">
          <label>Trailer ${i} Plate Number</label>
          <input type="text" id="trailerPlate${i}" class="input-field" placeholder="Trailer ${i} plate">
        </div>
      `;
    }
    html += '</div>';
    container.innerHTML = html;
  },

  addTruck() {
    const plate = document.getElementById('truckPlate').value.trim();
    if (!plate) return alert('Truck plate number is required.');

    const trailerCount = Number(document.getElementById('truckTrailersCount').value) || 0;
    const trailerPlates = [];
    for (let i = 1; i <= trailerCount; i++) {
      const tp = document.getElementById(`trailerPlate${i}`).value.trim();
      if (tp) trailerPlates.push(tp);
    }

    const truck = {
      plateNumber: plate,
      brand: document.getElementById('truckBrand').value,
      model: document.getElementById('truckModel').value,
      year: document.getElementById('truckYear').value,
      trailers: `${trailerCount} Trailer${trailerCount !== 1 ? 's' : ''}`,
      trailerPlates: trailerPlates,
      fuelType: document.getElementById('truckFuel').value,
      serviceStatus: 'Active'
    };

    DB.push('trucks', truck);
    if (typeof logActivity === 'function') {
      logActivity({ module: 'trucks', action: 'create', description: `Added truck ${truck.plateNumber}`, ref: truck.plateNumber, user: 'admin' });
    }
    alert(`Truck "${plate}" added successfully with ${trailerCount} trailer(s)!`);
    App.refresh();
  },

  addDriver() {
    const name = document.getElementById('drvName').value.trim();
    if (!name) return alert('Driver name is required.');

    const d = {
      name: name,
      phone: document.getElementById('drvPhone').value,
      license: document.getElementById('drvLicense').value,
      truckId: document.getElementById('drvTruck').value,
      status: 'Active'
    };

    DB.push('drivers', d);
    if (typeof logActivity === 'function') {
      logActivity({ module: 'drivers', action: 'create', description: `Added driver ${d.name}`, ref: d.name, user: 'admin' });
    }
    alert(`Driver "${name}" added successfully!`);
    App.refresh();
  },

  addCustomer() {
    const name = document.getElementById('custName').value.trim();
    if (!name) return alert('Customer name is required.');

    const c = {
      name: name,
      phone: document.getElementById('custPhone').value,
      location: document.getElementById('custLocation').value
    };

    DB.push('customers', c);
    if (typeof logActivity === 'function') {
      logActivity({ module: 'customers', action: 'create', description: `Added customer ${c.name}`, ref: c.name, user: 'admin' });
    }
    alert(`Customer "${name}" added successfully!`);
    App.refresh();
  },

  autoFillDriver() {
    const truckSelect = document.getElementById('tripTruck');
    const driverSelect = document.getElementById('tripDriver');
    if (!truckSelect || !driverSelect) return;

    const truckId = truckSelect.value;
    const drivers = DB.drivers();
    const assignedDriver = drivers.find(d => d.truckId === truckId);
    
    if (assignedDriver) {
      driverSelect.value = assignedDriver.id;
    } else {
      driverSelect.value = '';
    }
  },

  calculateBalance() {
    const total = Number(document.getElementById('tripTotalPrice').value) || 0;
    const paid = Number(document.getElementById('tripPaidAmount').value) || 0;
    const balance = total - paid;
    const balanceInput = document.getElementById('tripBalance');

    if (balance > 0) {
      balanceInput.value = Utils.fmtTZS(balance) + ' (Debt)';
      balanceInput.style.color = '#dc2626';
      balanceInput.style.backgroundColor = '#fef2f2';
    } else if (balance === 0 && total > 0) {
      balanceInput.value = 'Fully Paid';
      balanceInput.style.color = '#16a34a';
      balanceInput.style.backgroundColor = '#f0fdf4';
    } else {
      balanceInput.value = '0 TZS';
      balanceInput.style.color = '#64748b';
      balanceInput.style.backgroundColor = '#f1f5f9';
    }
  },

  calculateDistance() {
    const from = document.getElementById('tripFrom').value;
    const to = document.getElementById('tripTo').value;
    const distInput = document.getElementById('tripDist');

    if (from && to && regionCoords[from] && regionCoords[to]) {
      const lat1 = regionCoords[from].lat, lon1 = regionCoords[from].lon;
      const lat2 = regionCoords[to].lat, lon2 = regionCoords[to].lon;
      const R = 6371;
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a = Math.sin(dLat/2)*Math.sin(dLat/2) + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)*Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      distInput.value = Math.round(R * c * 1.25);
      this.updateFuelEstimate();
    } else {
      distInput.value = '';
      this.updateFuelEstimate();
    }
  },

  tripRows(trips, trucks, drivers) {
    if (!trips.length) return '<tr><td colspan="10" style="text-align:center; color:#64748b; padding: 30px;">No trips recorded yet.</td></tr>';
    return trips.map(t => {
      const truck = trucks.find(x => x.id === t.truckId);
      const driver = drivers.find(x => x.id === t.driverId);
      const balance = (Number(t.totalPrice) || 0) - (Number(t.paidAmount) || 0);
      return `<tr>
        <td data-label="Date">${Utils.fmtDate(t.date)}</td>
        <td data-label="Truck">${truck ? Utils.esc(truck.plateNumber) : '---'}</td>
        <td data-label="Driver">${driver ? Utils.esc(driver.name) : '---'}</td>
        <td data-label="Route">${Utils.esc(t.from)} &rarr; ${Utils.esc(t.to)}</td>
        <td data-label="Km">${Utils.fmtNum(t.distance)}</td>
        <td data-label="Total">${Utils.fmtTZS(t.totalPrice)}</td>
        <td data-label="Paid">${Utils.fmtTZS(t.paidAmount)}</td>
        <td data-label="Balance" style="color: ${balance > 0 ? '#dc2626' : '#16a34a'}; font-weight:bold;">${balance > 0 ? Utils.fmtTZS(balance) : 'Paid'}</td>
        <td data-label="Status">${Utils.statusBadge(t.status)}</td>
        <td data-label="Action"><button class="btn-danger" onclick="TripOps.deleteTrip('${t.id}')"><i class="fas fa-trash"></i></button></td>
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
    const totalPrice = Number(document.getElementById('tripTotalPrice').value) || 0;
    const paidAmount = Number(document.getElementById('tripPaidAmount').value) || 0;
    const balance = totalPrice - paidAmount;
    
    const truckId = document.getElementById('tripTruck').value;
    const driverId = document.getElementById('tripDriver').value;
    const customerId = document.getElementById('tripCustomer').value;

    const trip = {
      date: document.getElementById('tripDate').value,
      truckId: truckId,
      driverId: driverId,
      customerId: customerId,
      type: document.getElementById('tripType').value,
      loadStatus: document.getElementById('tripLoad').value,
      from: document.getElementById('tripFrom').value,
      to: document.getElementById('tripTo').value,
      distance: document.getElementById('tripDist').value,
      totalPrice: totalPrice,
      paidAmount: paidAmount,
      status: document.getElementById('tripStatus').value,
      onTime: document.getElementById('tripOnTime').value === '1'
    };

    if (!trip.truckId) return alert('Please select a truck.');
    if (!trip.driverId) return alert('Please select a driver from the dropdown.');
    if (!trip.from || !trip.to) return alert('Please select both Origin and Destination regions.');

    DB.push('trips', trip);
    
    if (typeof logActivity === 'function') {
      logActivity({ module: 'trips', action: 'create', description: `Trip ${trip.from} to ${trip.to}`, ref: trip.truckId, user: 'admin' });
    }

    if (paidAmount > 0) {
      DB.push('income', {
        date: trip.date, truckId: trip.truckId, driverId: trip.driverId,
        customerId: trip.customerId, amount: paidAmount, method: 'Cash',
        description: `Payment for trip ${trip.from} to ${trip.to}`
      });
    }

    if (balance > 0 && customerId) {
      DB.push('debts', {
        date: trip.date,
        customerId: customerId,
        amount: balance,
        option: 'Partial Payment',
        method: 'Pending',
        description: `Balance from trip ${trip.from} to ${trip.to}`,
        paid: false
      });
    }

    alert('Trip saved successfully! Income and/or Debt records updated automatically.');
    App.refresh();
  },

  deleteTrip(id) {
    if (confirm('Delete this trip? Note: This will NOT automatically reverse associated income or debt records.')) {
      DB.remove('trips', id);
      if (typeof logActivity === 'function') {
        logActivity({ module: 'trips', action: 'delete', description: `Deleted trip ${id}`, ref: id, user: 'admin' });
      }
      App.refresh();
    }
  }
};
