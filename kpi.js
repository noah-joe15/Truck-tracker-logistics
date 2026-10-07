const KPI = {
  render() {
    const trucks = DB.trucks(), trips = DB.trips();
    const expenses = DB.expenses(), income = DB.income();
    const drivers = DB.drivers();

    const totalRev = income.reduce((s, x) => s + Number(x.amount || 0), 0);
    const totalExp = expenses.reduce((s, x) => s + Number(x.amount || 0), 0);
    const totalKm  = trips.reduce((s, x) => s + Number(x.distance || 0), 0);
    
    // Fix: Check for both fuel category variations
    const totalFuel = expenses.filter(e => 
      e.category === 'Fuel (Diesel/Petrol)' || e.category === 'Fuel'
    ).reduce((s, x) => s + Number(x.liters || 0), 0);
    
    const avgEco = totalFuel > 0 ? (totalKm / totalFuel).toFixed(2) : '0.00';
    const inTransit = trips.filter(t => t.status === 'In Transit').length;
    const onTime = trips.filter(t => t.status === 'Completed' && t.onTime).length;
    const completed = trips.filter(t => t.status === 'Completed').length;
    const onTimeRate = completed > 0 ? ((onTime / completed) * 100).toFixed(0) : 0;
    const costPer100km = totalKm > 0 ? Math.round((totalExp / totalKm) * 100) : 0;

    return `
      <div class="section-title">
        <h2>${Icons.activity} KPI Operations Dashboard</h2>
        <span class="live-badge">Live</span>
      </div>

      <div class="kpi-grid">
        <div class="kpi-card kpi-hero revenue">
          <div class="kpi-icon-wrapper revenue"><i class="fas fa-dollar-sign"></i></div>
          <div class="kpi-label">Total Revenue</div>
          <div class="kpi-value">${Utils.fmtTZS(totalRev)}</div>
        </div>
        <div class="kpi-card kpi-hero profit">
          <div class="kpi-icon-wrapper profit"><i class="fas fa-coins"></i></div>
          <div class="kpi-label">Net Profit</div>
          <div class="kpi-value">${Utils.fmtTZS(totalRev - totalExp)}</div>
        </div>
        <div class="kpi-card cost">
          <div class="kpi-icon-wrapper cost"><i class="fas fa-chart-line"></i></div>
          <div class="kpi-label">Cost / 100 km</div>
          <div class="kpi-value">${Utils.fmtTZS(costPer100km)}</div>
        </div>
        <div class="kpi-card trips">
          <div class="kpi-icon-wrapper trips"><i class="fas fa-check-circle"></i></div>
          <div class="kpi-label">On-Time Rate</div>
          <div class="kpi-value">${onTimeRate}%</div>
        </div>
        <div class="kpi-card fleet">
          <div class="kpi-icon-wrapper fleet"><i class="fas fa-truck"></i></div>
          <div class="kpi-label">Active Trucks</div>
          <div class="kpi-value">${trucks.length}</div>
        </div>
        <div class="kpi-card transit">
          <div class="kpi-icon-wrapper transit"><i class="fas fa-route"></i></div>
          <div class="kpi-label">In Transit</div>
          <div class="kpi-value">${inTransit}</div>
        </div>
        <div class="kpi-card trips">
          <div class="kpi-icon-wrapper trips"><i class="fas fa-clipboard-check"></i></div>
          <div class="kpi-label">Trips Completed</div>
          <div class="kpi-value">${completed}</div>
        </div>
        <div class="kpi-card cost">
          <div class="kpi-icon-wrapper cost"><i class="fas fa-gas-pump"></i></div>
          <div class="kpi-label">Avg Km/L</div>
          <div class="kpi-value">${avgEco}</div>
        </div>
        <div class="kpi-card fleet">
          <div class="kpi-icon-wrapper fleet"><i class="fas fa-road"></i></div>
          <div class="kpi-label">Total Km</div>
          <div class="kpi-value">${Utils.fmtNum(totalKm)}</div>
        </div>
      </div>

      <div class="form-section">
        <h2>${Icons.users} Driver Accountability</h2>
        <div class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>Driver</th>
                <th>Truck</th>
                <th>Trips</th>
                <th>Km</th>
                <th>Revenue</th>
                <th>Fuel (L)</th>
                <th>Km/L</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>${this.driverRows(drivers, trucks, trips, income, expenses)}</tbody>
          </table>
        </div>
      </div>

      <div class="chart-grid">
        <div class="chart-box">
          <h3>${Icons.chart} Monthly Trips &amp; Revenue</h3>
          <div class="chart-container">
            <canvas id="kpiMonthlyChart"></canvas>
          </div>
        </div>
        <div class="chart-box">
          <h3>${Icons.fuel} Fuel Spend by Truck</h3>
          <div class="chart-container">
            <canvas id="kpiFuelChart"></canvas>
          </div>
        </div>
      </div>
    `;
  },

  driverRows(drivers, trucks, trips, income, expenses) {
    if (!drivers.length) {
      return '<tr><td colspan="8" style="text-align:center; color:#64748b; padding: 30px;">No drivers assigned yet. Add drivers in the Drivers section.</td></tr>';
    }
    
    return drivers.map(d => {
      const truck = trucks.find(t => t.id === d.truckId);
      const dTrips = trips.filter(t => t.driverId === d.id);
      const km = dTrips.reduce((s, x) => s + Number(x.distance || 0), 0);
      const rev = income.filter(x => x.driverId === d.id).reduce((s, x) => s + Number(x.amount || 0), 0);
      
      // Fix: Check for both fuel category variations
      const fuel = expenses.filter(e => 
        e.driverId === d.id && (e.category === 'Fuel (Diesel/Petrol)' || e.category === 'Fuel')
      ).reduce((s, x) => s + Number(x.liters || 0), 0);
      
      const eco = fuel > 0 ? (km / fuel).toFixed(1) : '0.0';
      
      return `<tr>
        <td data-label="Driver">${Utils.esc(d.name)}</td>
        <td data-label="Truck">${truck ? Utils.esc(truck.plateNumber) : '---'}</td>
        <td data-label="Trips">${dTrips.length}</td>
        <td data-label="Km">${Utils.fmtNum(km)}</td>
        <td data-label="Revenue">${Utils.fmtTZS(rev)}</td>
        <td data-label="Fuel (L)">${fuel.toFixed(1)}</td>
        <td data-label="Km/L">${eco}</td>
        <td data-label="Status">${Utils.statusBadge(d.status || 'Active')}</td>
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
    const canvas = document.getElementById('kpiMonthlyChart');
    if (!canvas) return;
    
    new Chart(canvas, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          { label: 'Trips', data: labels.map(m => months[m].trips), backgroundColor: '#f59e0b', yAxisID: 'y' },
          { label: 'Revenue', data: labels.map(m => months[m].revenue), type: 'line', borderColor: '#3b82f6', backgroundColor: 'rgba(59, 130, 246, 0.1)', yAxisID: 'y1' }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom' } },
        scales: {
          y:  { position: 'left', title: { display: true, text: 'Trips' }, beginAtZero: true },
          y1: { position: 'right', title: { display: true, text: 'TZS' }, grid: { drawOnChartArea: false }, beginAtZero: true }
        }
      }
    });
  },

  renderFuelChart() {
    const trucks = DB.trucks(), expenses = DB.expenses();
    
    // Fix: Check for both fuel category variations and calculate from amount if liters not recorded
    const DIESEL_PRICE_PER_LITER = 3430; // EWURA standard price
    
    const data = trucks.map(t => {
      const truckFuelExpenses = expenses.filter(e => 
        e.truckId === t.id && (e.category === 'Fuel (Diesel/Petrol)' || e.category === 'Fuel')
      );
      
      const totalLiters = truckFuelExpenses.reduce((s, x) => s + Number(x.liters || 0), 0);
      const totalCost = truckFuelExpenses.reduce((s, x) => s + Number(x.amount || 0), 0);
      
      // Use recorded liters or calculate from amount
      const liters = totalLiters > 0 ? totalLiters : (totalCost / DIESEL_PRICE_PER_LITER);
      
      return {
        label: t.plateNumber,
        value: totalCost
      };
    }).filter(d => d.value > 0);
    
    const canvas = document.getElementById('kpiFuelChart');
    if (!canvas) return;

    if (!data.length) {
      canvas.parentElement.innerHTML = '<div class="chart-empty"><i class="fas fa-gas-pump"></i><p>No fuel expenses recorded yet.</p></div>';
      return;
    }

    new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: data.map(d => d.label),
        datasets: [{ 
          data: data.map(d => d.value), 
          backgroundColor: ['#f59e0b', '#3b82f6', '#16a34a', '#dc2626', '#8b5cf6', '#ec4899', '#14b8a6'] 
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { 
          legend: { position: 'bottom' },
          tooltip: {
            callbacks: {
              label: function(context) {
                return context.label + ': ' + Utils.fmtTZS(context.parsed);
              }
            }
          }
        }
      }
    });
  }
};
