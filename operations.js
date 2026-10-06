const Operations = {
  render() {
    const trucks = DB.trucks(), drivers = DB.drivers(), customers = DB.customers();
    const trips = DB.trips().sort((a, b) => new Date(b.date) - new Date(a.date));

    return `
      <div class="section-title"><h2>${Icons.clipboard} Operations — Trip Management</h2></div>

      <div class="form-section">
        <h2>${Icons.plus} Record New Trip</h2>
        
        <div class="form-row">
          <div class="form-group">
            <label>Date</label>
            <input type="date" id="tripDate" class="input-field" value="${Utils.today()}">
          </div>
          <div class="form-group">
            <label>Truck</label>
            <select id="tripTruck" class="input-field" onchange="Operations.autoFillDriver()">
              ${Utils.optionsHTML(trucks, 'plateNumber', 'id', 'Select Truck...')}
            </select>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>Driver (Auto-filled from Truck)</label>
            <input type="text" id="tripDriver" class="input-field" readonly placeholder="Select a truck first" style="background-color: #f1f5f9; color: #64748b;">
            <input type="hidden" id="tripDriverId">
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
            <select id="tripType" class="input-field"><option>Single Trip</option><option>Round Trip</option></select>
          </div>
          <div class="form-group">
            <label>Load Status</label>
            <select id="tripLoad" class="input-field"><option>Loaded</option><option>Empty</option></select>
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
            <label>Total Trip Price (TZS)</label>
            <input type="number" id="tripTotalPrice" class="input-field" placeholder="0.00" min="0" oninput="Operations.calculateBalance()">
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>Amount Paid Now (TZS)</label>
            <input type="number" id="tripPaidAmount" class="input-field" placeholder="0.00" min="0" oninput="Operations.calculateBalance()">
          </div>
          <div class="form-group">
            <label>Remaining Balance (Debt)</label>
            <input type="text" id="tripBalance" class="input-field" readonly value="0 TZS" style="background-color: #fef2f2; color: #dc2626; font-weight: bold;">
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>Status</label>
            <select id="tripStatus" class="input-field"><option>In Transit</option><option>Completed</option></select>
          </div>
          <div class="form-group">
            <label>On Time?</label>
            <select id="tripOnTime" class="input-field"><option value="1">Yes</option><option value="0">No</option></select>
          </div>
        </div>

        <div id="fuelEstimate" class="smart-estimate" style="display:none;"></div>

        <button class="btn-primary" onclick="Operations.saveTrip()">
          <i class="fas fa-save"></i> Save Trip & Process Payment
        </button>
      </div>

      <div class="form-section">
        <h2>${Icons.clock} Trip History</h2>
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

  autoFillDriver() {
    const truckSelect = document.getElementById('tripTruck');
    const driverInput = document.getElementById('tripDriver');
    const driverIdInput = document.getElementById('tripDriverId');
    if (!truckSelect || !driverInput) return;

    const selectedOption = truckSelect.options[truckSelect.selectedIndex];
    const driverId = selectedOption.getAttribute('data-driver');

    if (driverId) {
      const driver = DB.drivers().find(d => d.id === driverId);
      if (driver) {
        driverInput.value = driver.name;
        driverIdInput.value = driver.id;
        driverInput.style.color = '#0f172a';
        driverInput.style.backgroundColor = '#ffffff';
      }
    } else {
      driverInput.value = '';
      driverIdInput.value = '';
      driverInput.placeholder = 'No driver assigned to this truck';
      driverInput.style.color = '#64748b';
      driverInput.style.backgroundColor = '#f1f5f9';
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
      distInput.value = Math.round(R * c * 1.25); // 1.25 factor for road curvature
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
        <td data-label="Action"><button class="btn-danger" onclick="Operations.deleteTrip('${t.id}')"><i class="fas fa-trash"></i></button></td>
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
    const customerId = document.getElementById('tripCustomer').value;
    const driverId = document.getElementById('tripDriverId').value;

    const trip = {
      date: document.getElementById('tripDate').value,
      truckId: document.getElementById('tripTruck').value,
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

    if (!trip.truckId || !trip.driverId) return alert('Please select a truck (and ensure it has a driver assigned).');
    if (!trip.from || !trip.to) return alert('Please select both Origin and Destination regions.');
    
    // 1. Save the Trip
    DB.push('trips', trip);

    // 2. Record Income (if paid > 0)
    if (paidAmount > 0) {
      DB.push('income', {
        date: trip.date, truckId: trip.truckId, driverId: trip.driverId,
        customerId: trip.customerId, amount: paidAmount, method: 'Cash',
        description: `Payment for trip ${trip.from} to ${trip.to}`
      });
    }

    // 3. Auto-Create Debt Record (if balance > 0)
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
      App.refresh();
    }
  }
};
