const Analytics = {
  render() {
    return `
      <h1 class="section-title">${Icons.chart} Analytics</h1>
      <div class="chart-grid">
        <div class="chart-box"><h3>${Icons.dollar} Income vs Expense (This Year)</h3><canvas id="chartIncExp"></canvas></div>
        <div class="chart-box"><h3>${Icons.activity} Expense Breakdown</h3><canvas id="chartExpBreak"></canvas></div>
        <div class="chart-box"><h3>${Icons.users} Revenue by Customer</h3><canvas id="chartRevCust"></canvas></div>
        <div class="chart-box"><h3>${Icons.truck} Trips by Truck</h3><canvas id="chartTripsTruck"></canvas></div>
      </div>
    `;
  },

  afterRender() {
    this.incExp(); this.expBreak(); this.revCust(); this.tripsTruck();
  },

  incExp() {
    const income = DB.income(), expenses = DB.expenses();
    const year = new Date().getFullYear();
    const months = Array.from({ length: 12 }, (_, i) => `${year}-${String(i + 1).padStart(2, '0')}`);
    const inc = months.map(m => income.filter(x => Utils.monthKey(x.date) === m).reduce((s, x) => s + Number(x.amount || 0), 0));
    const exp = months.map(m => expenses.filter(x => Utils.monthKey(x.date) === m).reduce((s, x) => s + Number(x.amount || 0), 0));
    new Chart(document.getElementById('chartIncExp'), {
      type: 'bar',
      data: {
        labels: months.map(m => m.slice(5)),
        datasets: [
          { label: 'Income', data: inc, backgroundColor: '#16a34a' },
          { label: 'Expense', data: exp, backgroundColor: '#dc2626' }
        ]
      }
    });
  },

  expBreak() {
    const expenses = DB.expenses();
    const cats = {};
    expenses.forEach(e => { cats[e.category || 'Other'] = (cats[e.category || 'Other'] || 0) + Number(e.amount || 0); });
    const keys = Object.keys(cats);
    if (!keys.length) return;
    new Chart(document.getElementById('chartExpBreak'), {
      type: 'pie',
      data: {
        labels: keys,
        datasets: [{ data: Object.values(cats), backgroundColor: ['#f59e0b', '#3b82f6', '#16a34a', '#dc2626', '#8b5cf6', '#ec4899', '#14b8a6'] }]
      }
    });
  },

  revCust() {
    const income = DB.income(), customers = DB.customers();
    const data = customers.map(c => ({
      name: c.name,
      total: income.filter(x => x.customerId === c.id).reduce((s, x) => s + Number(x.amount || 0), 0)
    })).filter(d => d.total > 0);
    if (!data.length) return;
    new Chart(document.getElementById('chartRevCust'), {
      type: 'bar',
      data: {
        labels: data.map(d => d.name),
        datasets: [{ label: 'Revenue (TZS)', data: data.map(d => d.total), backgroundColor: '#f59e0b' }]
      },
      options: { indexAxis: 'y' }
    });
  },

  tripsTruck() {
    const trips = DB.trips(), trucks = DB.trucks();
    const data = trucks.map(t => ({
      label: t.plateNumber,
      count: trips.filter(x => x.truckId === t.id).length
    }));
    if (!data.length) return;
    new Chart(document.getElementById('chartTripsTruck'), {
      type: 'bar',
      data: {
        labels: data.map(d => d.label),
        datasets: [{ label: 'Trips', data: data.map(d => d.count), backgroundColor: '#3b82f6' }]
      }
    });
  }
};
