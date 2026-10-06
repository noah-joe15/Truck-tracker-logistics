const Analytics = {
  render() {
    return `
      <div class="section-title">
        <h2>${Icons.chart} Analytics</h2>
      </div>
      
      <div class="chart-grid">
        <div class="chart-box">
          <h3>${Icons.dollar} Income vs Expense (This Year)</h3>
          <div class="chart-container">
            <canvas id="chartIncExp"></canvas>
          </div>
        </div>
        
        <div class="chart-box">
          <h3>${Icons.activity} Expense Breakdown</h3>
          <div class="chart-container">
            <canvas id="chartExpBreak"></canvas>
          </div>
        </div>
        
        <div class="chart-box">
          <h3>${Icons.users} Revenue by Customer</h3>
          <div class="chart-container">
            <canvas id="chartRevCust"></canvas>
          </div>
        </div>
        
        <div class="chart-box">
          <h3>${Icons.truck} Trips by Truck</h3>
          <div class="chart-container">
            <canvas id="chartTripsTruck"></canvas>
          </div>
        </div>
      </div>
    `;
  },

  afterRender() {
    this.incExp();
    this.expBreak();
    this.revCust();
    this.tripsTruck();
  },

  incExp() {
    const income = DB.income(), expenses = DB.expenses();
    const year = new Date().getFullYear();
    const months = Array.from({ length: 12 }, (_, i) => `${year}-${String(i + 1).padStart(2, '0')}`);
    const inc = months.map(m => income.filter(x => Utils.monthKey(x.date) === m).reduce((s, x) => s + Number(x.amount || 0), 0));
    const exp = months.map(m => expenses.filter(x => Utils.monthKey(x.date) === m).reduce((s, x) => s + Number(x.amount || 0), 0));
    const canvas = document.getElementById('chartIncExp');
    if (!canvas) return;

    new Chart(canvas, {
      type: 'bar',
      data: {
        labels: months.map(m => m.slice(5)),
        datasets: [
          { label: 'Income', data: inc, backgroundColor: '#16a34a' },
          { label: 'Expense', data: exp, backgroundColor: '#dc2626' }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom' } },
        scales: { y: { beginAtZero: true } }
      }
    });
  },

  expBreak() {
    const expenses = DB.expenses();
    const cats = {};
    expenses.forEach(e => { cats[e.category || 'Other'] = (cats[e.category || 'Other'] || 0) + Number(e.amount || 0); });
    const keys = Object.keys(cats);
    const canvas = document.getElementById('chartExpBreak');
    if (!canvas) return;

    if (!keys.length) {
      canvas.parentElement.innerHTML = '<div class="chart-empty"><i class="fas fa-chart-pie"></i><p>No expense data recorded yet.</p></div>';
      return;
    }

    new Chart(canvas, {
      type: 'pie',
      data: {
        labels: keys,
        datasets: [{ 
          data: Object.values(cats), 
          backgroundColor: ['#f59e0b', '#3b82f6', '#16a34a', '#dc2626', '#8b5cf6', '#ec4899', '#14b8a6'] 
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom' } }
      }
    });
  },

  revCust() {
    const income = DB.income(), customers = DB.customers();
    const data = customers.map(c => ({
      name: c.name,
      total: income.filter(x => x.customerId === c.id).reduce((s, x) => s + Number(x.amount || 0), 0)
    })).filter(d => d.total > 0);
    const canvas = document.getElementById('chartRevCust');
    if (!canvas) return;

    if (!data.length) {
      canvas.parentElement.innerHTML = '<div class="chart-empty"><i class="fas fa-users"></i><p>No customer revenue data yet.</p></div>';
      return;
    }

    new Chart(canvas, {
      type: 'bar',
      data: {
        labels: data.map(d => d.name),
        datasets: [{ label: 'Revenue (TZS)', data: data.map(d => d.total), backgroundColor: '#f59e0b' }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { x: { beginAtZero: true } }
      }
    });
  },

  tripsTruck() {
    const trips = DB.trips(), trucks = DB.trucks();
    const data = trucks.map(t => ({
      label: t.plateNumber,
      count: trips.filter(x => x.truckId === t.id).length
    })).filter(d => d.count > 0); // Only show trucks that actually have trips
    const canvas = document.getElementById('chartTripsTruck');
    if (!canvas) return;

    if (!data.length) {
      canvas.parentElement.innerHTML = '<div class="chart-empty"><i class="fas fa-truck"></i><p>No trip data recorded yet.</p></div>';
      return;
    }

    new Chart(canvas, {
      type: 'bar',
      data: {
        labels: data.map(d => d.label),
        datasets: [{ label: 'Trips', data: data.map(d => d.count), backgroundColor: '#3b82f6' }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
      }
    });
  }
};
