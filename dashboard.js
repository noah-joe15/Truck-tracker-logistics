const Dashboard = {
  render() {
    const trucks    = DB.trucks();
    const trips     = DB.trips();
    const expenses  = DB.expenses();
    const income    = DB.income();
    const debts     = DB.debts();

    const totalIncome   = income.reduce((s, x) => s + Number(x.amount || 0), 0);
    const totalExpense  = expenses.reduce((s, x) => s + Number(x.amount || 0), 0);
    const pendingDebt   = debts.filter(d => !d.paid).reduce((s, x) => s + Number(x.amount || 0), 0);
    const cashInHand    = totalIncome - totalExpense;

    return `
      <h1 class="section-title">${Icons.truck} Fleet Overview</h1>
      <div class="summary-grid">
        <div class="summary-card">
          <h3>${Icons.dollar} Cash In Hand</h3>
          <div class="value">${Utils.fmtTZS(cashInHand)}</div>
        </div>
        <div class="summary-card">
          <h3>${Icons.clock} Pending Debt</h3>
          <div class="value">${Utils.fmtTZS(pendingDebt)}</div>
        </div>
        <div class="summary-card">
          <h3>${Icons.activity} Expenses</h3>
          <div class="value">${Utils.fmtTZS(totalExpense)}</div>
        </div>
        <div class="summary-card">
          <h3>${Icons.chart} Net Profit</h3>
          <div class="value">${Utils.fmtTZS(totalIncome - totalExpense)}</div>
        </div>
        <div class="summary-card">
          <h3>${Icons.truck} Active Trucks</h3>
          <div class="value">${trucks.length}</div>
        </div>
        <div class="summary-card">
          <h3>${Icons.clipboard} Total Trips</h3>
          <div class="value">${trips.length}</div>
        </div>
      </div>

      <div class="form-section">
        <h2>${Icons.warning} Maintenance Required</h2>
        <p style="color:#94a3b8;">Quick Service Action:
          <select id="serviceTruck">${Utils.optionsHTML(trucks, 'plateNumber', 'id', 'Select Truck...')}</select>
          <button class="btn-success" onclick="Dashboard.markServiceDone()">Mark Service Done</button>
        </p>
      </div>

      <div class="form-section">
        <h2>${Icons.activity} Fleet Performance</h2>
        <table class="data-table">
          <thead><tr><th>Truck</th><th>Profit</th><th>Eco (Km/L)</th><th>Service Status</th><th>Action</th></tr></thead>
          <tbody>${this.fleetRows(trucks, trips, expenses, income)}</tbody>
        </table>
      </div>
      
<div class="table-wrapper">
  <table class="data-table">
    <thead><tr><th>Truck</th><th>Profit</th><th>Eco (Km/L)</th><th>Service Status</th><th>Action</th></tr></thead>
    <tbody>
      ${trucks.map(t => `
        <tr>
          <td data-label="Truck">${Utils.esc(t.plateNumber)}</td>
          <td data-label="Profit">${Utils.fmtTZS(rev-exp)}</td>
          <td data-label="Eco (Km/L)">${eco}</td>
          <td data-label="Status">${Utils.statusBadge(t.serviceStatus || 'Active')}</td>
          <td data-label="Action"><button class="btn-success" onclick="Trucks.markService('${t.id}')">Service Done</button></td>
        </tr>`).join('')}
    </tbody>
  </table>
</div>

  fleetRows(trucks, trips, expenses, income) {
    if (!trucks.length) return '<tr><td colspan="5" style="text-align:center;color:#64748b;">No trucks yet</td></tr>';
    return trucks.map(t => {
      const tTrips = trips.filter(x => x.truckId === t.id);
      const rev = income.filter(x => x.truckId === t.id).reduce((s, x) => s + Number(x.amount || 0), 0);
      const exp = expenses.filter(x => x.truckId === t.id).reduce((s, x) => s + Number(x.amount || 0), 0);
      const km  = tTrips.reduce((s, x) => s + Number(x.distance || 0), 0);
      const fuel = expenses.filter(x => x.truckId === t.id && x.category === 'Fuel')
                           .reduce((s, x) => s + Number(x.liters || 0), 0);
      const eco = fuel > 0 ? (km / fuel).toFixed(1) : '0.0';
      return `<tr>
        <td>${Utils.esc(t.plateNumber)}</td>
        <td>${Utils.fmtTZS(rev - exp)}</td>
        <td>${eco}</td>
        <td>${Utils.statusBadge(t.serviceStatus || 'Active')}</td>
        <td><button class="btn-success" onclick="Trucks.markService('${t.id}')">Service Done</button></td>
      </tr>`;
    }).join('');
  },

  totalFuel() {
    return DB.expenses().filter(e => e.category === 'Fuel').reduce((s, x) => s + Number(x.liters || 0), 0);
  },
  totalFuelCost(expenses) {
    return expenses.filter(e => e.category === 'Fuel').reduce((s, x) => s + Number(x.amount || 0), 0);
  },
  fuelRows(trucks, trips, expenses) {
    const total = this.totalFuel();
    return trucks.map(t => {
      const liters = expenses.filter(e => e.truckId === t.id && e.category === 'Fuel')
                             .reduce((s, x) => s + Number(x.liters || 0), 0);
      const cost = expenses.filter(e => e.truckId === t.id && e.category === 'Fuel')
                           .reduce((s, x) => s + Number(x.amount || 0), 0);
      const pct = total > 0 ? ((liters / total) * 100).toFixed(1) : 0;
      return `<tr><td>${Utils.esc(t.plateNumber)}</td><td>${liters.toFixed(1)}</td>
              <td>${Utils.fmtTZS(cost)}</td><td>${pct}%</td></tr>`;
    }).join('');
  },

  markServiceDone() {
    const id = document.getElementById('serviceTruck').value;
    if (!id) return alert('Select a truck');
    Trucks.markService(id);
    App.refresh();
  }
};
