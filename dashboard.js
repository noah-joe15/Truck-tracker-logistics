const Dashboard = {
  render() {
    const trucks = DB.trucks();
    const trips = DB.trips();
    const expenses = DB.expenses();
    const income = DB.income();
    const debts = DB.debts();

    const totalIncome = income.reduce((s, x) => s + Number(x.amount || 0), 0);
    const totalExpense = expenses.reduce((s, x) => s + Number(x.amount || 0), 0);
    const pendingDebt = debts.filter(d => !d.paid).reduce((s, x) => s + Number(x.amount || 0), 0);
    const cashInHand = totalIncome - totalExpense;

      // Fuel Analysis
    const fuelExpenses = expenses.filter(e => 
      e.category === 'Fuel (Diesel/Petrol)' || e.category === 'Fuel'
    );
    const totalFuelCost = fuelExpenses.reduce((s, x) => s + Number(x.amount || 0), 0);
    
    const DIESEL_PRICE_PER_LITER = 3430; 
    
    // Calculate total liters: use recorded liters, or calculate from amount if missing
    const totalFuelLiters = fuelExpenses.reduce((s, x) => {
      const liters = Number(x.liters || 0);
      return s + (liters > 0 ? liters : (Number(x.amount || 0) / DIESEL_PRICE_PER_LITER));
    }, 0);

    return `
      <h1 class="section-title">${Icons.truck} Fleet Overview</h1>
      
      <div class="kpi-grid">
        <div class="kpi-card kpi-hero revenue">
          <div class="kpi-icon-wrapper revenue"><i class="fas fa-dollar-sign"></i></div>
          <div class="kpi-label">Cash In Hand</div>
          <div class="kpi-value">${Utils.fmtTZS(cashInHand)}</div>
        </div>
        <div class="kpi-card cost">
          <div class="kpi-icon-wrapper cost"><i class="fas fa-clock"></i></div>
          <div class="kpi-label">Pending Debt</div>
          <div class="kpi-value">${Utils.fmtTZS(pendingDebt)}</div>
        </div>
        <div class="kpi-card cost">
          <div class="kpi-icon-wrapper cost"><i class="fas fa-chart-line"></i></div>
          <div class="kpi-label">Expenses</div>
          <div class="kpi-value">${Utils.fmtTZS(totalExpense)}</div>
        </div>
        <div class="kpi-card profit">
          <div class="kpi-icon-wrapper profit"><i class="fas fa-coins"></i></div>
          <div class="kpi-label">Net Profit</div>
          <div class="kpi-value">${Utils.fmtTZS(totalIncome - totalExpense)}</div>
        </div>
        <div class="kpi-card fleet">
          <div class="kpi-icon-wrapper fleet"><i class="fas fa-truck"></i></div>
          <div class="kpi-label">Active Trucks</div>
          <div class="kpi-value">${trucks.length}</div>
        </div>
        <div class="kpi-card trips">
          <div class="kpi-icon-wrapper trips"><i class="fas fa-clipboard-list"></i></div>
          <div class="kpi-label">Total Trips</div>
          <div class="kpi-value">${trips.length}</div>
        </div>
      </div>

      <div class="form-section">
        <h2>${Icons.fuel} Fuel Analysis</h2>
        <p style="color:#64748b; margin-bottom: 16px; font-size: 14px;">
          Total Fuel Used: <strong>${calculatedLiters.toFixed(1)} L</strong> | 
          Total Fuel Cost: <strong>${Utils.fmtTZS(totalFuelCost)}</strong> |
          EWURA Price: <strong>${Utils.fmtTZS(DIESEL_PRICE_PER_LITER)}/L</strong>
        </p>
        <div class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>Truck</th>
                <th>Fuel Used (L)</th>
                <th>Fuel Cost (TZS)</th>
                <th>% of Total</th>
              </tr>
            </thead>
            <tbody>
              ${this.fuelRows(trucks, fuelExpenses, calculatedLiters, DIESEL_PRICE_PER_LITER)}
            </tbody>
          </table>
        </div>
      </div>

      <div class="form-section">
        <h2>${Icons.activity} Fleet Performance</h2>
        <div class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>Truck</th>
                <th>Profit</th>
                <th>Eco (Km/L)</th>
                <th>Service Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>${this.fleetRows(trucks, trips, expenses, income)}</tbody>
          </table>
        </div>
      </div>
    `;
  },

  fuelRows(trucks, fuelExpenses, totalLiters, pricePerLiter) {
    if (!trucks.length) {
      return '<tr><td colspan="4" style="text-align:center; color:#64748b; padding: 30px;">No trucks added yet.</td></tr>';
    }

    return trucks.map(t => {
      const truckFuelExpenses = fuelExpenses.filter(e => e.truckId === t.id);
      const truckFuelCost = truckFuelExpenses.reduce((s, x) => s + Number(x.amount || 0), 0);
      const truckLiters = truckFuelExpenses.reduce((s, x) => s + Number(x.liters || 0), 0);
      
      // Calculate liters from amount if not recorded
      const calculatedLiters = truckLiters > 0 ? truckLiters : (truckFuelCost / pricePerLiter);
      const percentage = totalLiters > 0 ? ((calculatedLiters / totalLiters) * 100).toFixed(1) : 0;

      return `<tr>
        <td data-label="Truck">${Utils.esc(t.plateNumber)}</td>
        <td data-label="Fuel Used (L)">${calculatedLiters.toFixed(1)}</td>
        <td data-label="Fuel Cost (TZS)">${Utils.fmtTZS(truckFuelCost)}</td>
        <td data-label="% of Total">${percentage}%</td>
      </tr>`;
    }).join('');
  },

  fleetRows(trucks, trips, expenses, income) {
    if (!trucks.length) {
      return '<tr><td colspan="5" style="text-align:center; color:#64748b; padding: 30px;">No trucks added yet.</td></tr>';
    }
    
    return trucks.map(t => {
      const tTrips = trips.filter(x => x.truckId === t.id);
      const rev = income.filter(x => x.truckId === t.id).reduce((s, x) => s + Number(x.amount || 0), 0);
      const exp = expenses.filter(x => x.truckId === t.id).reduce((s, x) => s + Number(x.amount || 0), 0);
      const km = tTrips.reduce((s, x) => s + Number(x.distance || 0), 0);
      const fuel = expenses.filter(x => x.truckId === t.id && (x.category === 'Fuel (Diesel/Petrol)' || x.category === 'Fuel'))
                           .reduce((s, x) => s + Number(x.liters || 0), 0);
      const eco = fuel > 0 ? (km / fuel).toFixed(1) : '0.0';
      
      return `<tr>
        <td data-label="Truck">${Utils.esc(t.plateNumber)}</td>
        <td data-label="Profit">${Utils.fmtTZS(rev - exp)}</td>
        <td data-label="Eco (Km/L)">${eco}</td>
        <td data-label="Status">${Utils.statusBadge(t.serviceStatus || 'Active')}</td>
        <td data-label="Action"><button class="btn-success" onclick="Trucks.markService('${t.id}')">Service Done</button></td>
      </tr>`;
    }).join('');
  },

  totalFuel() {
    return DB.expenses().filter(e => e.category === 'Fuel (Diesel/Petrol)' || e.category === 'Fuel')
      .reduce((s, x) => s + Number(x.liters || 0), 0);
  },
  
  totalFuelCost(expenses) {
    return expenses.filter(e => e.category === 'Fuel (Diesel/Petrol)' || e.category === 'Fuel')
      .reduce((s, x) => s + Number(x.amount || 0), 0);
  },

  markServiceDone() {
    const id = document.getElementById('serviceTruck').value;
    if (!id) return alert('Please select a truck first.');
    Trucks.markService(id);
    App.refresh();
  }
};
