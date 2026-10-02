const KPI = {
  render() {
    const trucks = DB.trucks(), trips = DB.trips();
    const expenses = DB.expenses(), income = DB.income();
    const drivers = DB.drivers();

    const totalRev = income.reduce((s, x) => s + Number(x.amount || 0), 0);
    const totalExp = expenses.reduce((s, x) => s + Number(x.amount || 0), 0);
    const totalKm  = trips.reduce((s, x) => s + Number(x.distance || 0), 0);
    const totalFuel = expenses.filter(e => e.category === 'Fuel').reduce((s, x) => s + Number(x.liters || 0), 0);
    const avgEco = totalFuel > 0 ? (totalKm / totalFuel).toFixed(2) : '0.00';
    const inTransit = trips.filter(t => t.status === 'In Transit').length;
    const onTime = trips.filter(t => t.status === 'Completed' && t.onTime).length;
    const completed = trips.filter(t => t.status === 'Completed').length;
    const onTimeRate = completed > 0 ? ((onTime / completed) * 100).toFixed(0) : 0;
    const costPer100km = totalKm > 0 ? Math.round((totalExp / totalKm) * 100) : 0;

    return `
      <h1 class="section-title">${Icons.activity} KPI Operations Dashboard</h1>
      <p style="color:#64748b;margin-bottom:20px;">Computed live from your operations data
        <span class="badge badge-success" style="margin-left:6px;">Live</span>
      </p>

      <div class="summary-grid">
        <div class="summary-card"><h3>${Icons.truck} Active Trucks</h3><div class="value">${trucks.length}</div></div>
        <div class="summary-card"><h3>${Icons.fuel} Avg Km/L</h3><div class="value">${avgEco}</div></div>
        <div class="summary-card"><h3>${Icons.clock} On-Time Rate</h3><div class="value">${onTimeRate}%</div></div>
        <div class="summary-card"><h3>${Icons.check} Trips Completed</h3><div class="value">${completed}</div></div>
        <div class="summary-card"><h3>${Icons.map} In Transit</h3><div class="value">${inTransit}</div></div>
        <div class="summary-card"><h3>${Icons.activity} Total Km</h3><div class="value">${Utils.fmtNum(totalKm)}</div></div>
        <div class="summary-card"><h3>${Icons.dollar} Total Revenue</h3><div class="value">${Utils.fmtTZS(totalRev)}</div></div>
        <div class="summary-card"><h3>${Icons.chart} Net Profit</h3><div class="value">${Utils.fmtTZS(totalRev - totalExp)}</div></div>
        <div class="summary-card"><h3>${Icons.fuel} Cost / 100 km</h3><div class="value">${Utils.fmtTZS(costPer100km)}</div></div>
      </div>

      <div class="form-section">
        <h2>${Icons.users} Driver Accountability</h2>
        <table class="data-table">
          <thead><tr><th>Driver</th><th>Truck</th><th>Trips</th><th>Km</th><th>Revenue</th>
          <th>Fuel (L)</th><th>Km/L</th><th>Status</th></tr></thead>
          <tbody>${this.driverRows(drivers, trucks, trips, income, expenses)}</tbody>
        </table>
      </div>

      <div class="chart-grid">
        <div class="chart-box"><h3>${Icons.chart} Monthly Trips &amp; Revenue</h3><canvas id="kpiMonthlyChart"></canvas></div>
        <div class="chart-box"><h3>${Icons.fuel} Fuel Spend by Truck</h3><canvas id="kpiFuelChart"></canvas></div>
      </div>
    `;
  },

  driverRows(drivers, trucks, trips, income, expenses) {
    if (!drivers.length) return '<tr><td colspan="8" style="text-align:center;color:#64748b;">No drivers yet</td></tr>';
    return drivers.map(d => {
      const truck = trucks.find(t => t.id === d.truckId);
      const dTrips = trips.filter(t => t.driverId === d.id);
      const km = dTrips.reduce((s, x) => s + Number(x.distance || 0), 0);
      const rev = income.filter(x => x.driverId === d.id).reduce((s, x) => s + Number(x.amount || 0), 0);
      const fuel = expenses.filter(e => e.driverId === d.id && e.category === 'Fuel')
                           .reduce((s, x) => s + Number(x.liters || 0), 0);
      const eco = fuel > 0 ? (km / fuel).toFixed(1) : '0.0';
      return `<tr>
        <td>${Utils.esc(d.name)}</td>
        <td>${truck ? Utils.esc(truck.plateNumber) : '---'}</td>
        <td>${dTrips.length}</td>
        <td>${Utils.fmtNum(km)}</td>
        <td>${Utils.fmtTZS(rev)}</td>
        <td>${fuel.toFixed(1)}</td>
        <td>${eco}</td>
        <td>${Utils.statusBadge(d.status || 'Active')}</td>
      </tr>`;
    }).join('');
  },

  afterRender() {
    this.renderMonthlyChart();
    this.renderFuelChart();
  },

  renderMonthlyChart() {
    const trips = DB.trips(), income = DB.income();
    const months = {};
    trips.forEach(t => {
      const m = Utils.monthKey(t.date);
      months[m] = months[m] || { trips: 0, revenue: 0 };
      months[m].trips++;
    });
    income.forEach(i => {
      const m = Utils.monthKey(i.date);
      months[m] = months[m] || { trips: 0, revenue: 0 };
      months[m].revenue += Number(i.amount || 0);
    });
    const labels = Object.keys(months).sort();
    if (!labels.length) return;
    new Chart(document.getElementById('kpiMonthlyChart'), {
      type: 'bar',
      data: {
        labels,
        datasets: [
          { label: 'Trips', data: labels.map(m => months[m].trips), backgroundColor: '#f59e0b', yAxisID: 'y' },
          { label: 'Revenue', data: labels.map(m => months[m].revenue), type: 'line', borderColor: '#3b82f6', yAxisID: 'y1' }
        ]
      },
      options: {
        responsive: true,
        scales: {
          y:  { position: 'left',  title: { display: true, text: 'Trips' } },
          y1: { position: 'right', title: { display: true, text: 'TZS' }, grid: { drawOnChartArea: false } }
        }
      }
    });
  },

  renderFuelChart() {
    const trucks = DB.trucks(), expenses = DB.expenses();
    const data = trucks.map(t => ({
      label: t.plateNumber,
      value: expenses.filter(e => e.truckId === t.id && e.category === 'Fuel')
                     .reduce((s, x) => s + Number(x.amount || 0), 0)
    }));
    if (!data.length) return;
    new Chart(document.getElementById('kpiFuelChart'), {
      type: 'doughnut',
      data: {
        labels: data.map(d => d.label),
        datasets: [{ data: data.map(d => d.value), backgroundColor: ['#f59e0b', '#3b82f6', '#16a34a', '#dc2626', '#8b5cf6', '#ec4899'] }]
      }
    });
  }
};
