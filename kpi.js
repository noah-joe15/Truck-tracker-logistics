const KPI = {
  render() {
    const trucks = DB.trucks(), trips = DB.trips();
    const expenses = DB.expenses(), income = DB.income();
    const drivers = DB.drivers();

    const totalRev = income.reduce((s, x) => s + Number(x.amount || 0), 0);
    const totalExp = expenses.reduce((s, x) => s + Number(x.amount || 0), 0);
    const tripExpenses = expenses
      .filter(e => e.tripId || ['Fuel', 'Driver Allowance', 'Turnboy Allowance'].includes(e.category))
      .reduce((s, x) => s + Number(x.amount || 0), 0);
    const totalKm  = trips.reduce((s, x) => s + Number(x.distance || 0), 0);
    
    const DIESEL_PRICE = 3430;
    const fuelExpenses = expenses.filter(e => 
      e.category === 'Fuel (Diesel/Petrol)' || e.category === 'Fuel'
    );
    
    const totalFuel = fuelExpenses.reduce((s, x) => {
      const liters = Number(x.liters || 0);
      return s + (liters > 0 ? liters : (Number(x.amount || 0) / DIESEL_PRICE));
    }, 0);
    
    const avgEco = totalFuel > 0 ? (totalKm / totalFuel).toFixed(2) : '0.00';
    const inTransit = trips.filter(t => t.status === 'In Transit').length;
    const onTime = trips.filter(t => t.status === 'Completed' && t.onTime).length;
    const completed = trips.filter(t => t.status === 'Completed').length;
    const onTimeRate = completed > 0 ? ((onTime / completed) * 100).toFixed(0) : 0;
    
    // Fixed calculations
    const runningCosts = totalRev > 0 ? totalRev - (totalRev - totalExp) : totalExp;
    const costPer100km = totalKm > 0 ? Math.round((runningCosts / totalKm) * 100) : 0;
    const netProfit = totalRev - totalExp;
    const profitMargin = totalRev > 0 ? ((netProfit / totalRev) * 100).toFixed(1) : '0.0';
    const fleetUtilization = trucks.length > 0 ? Math.round((inTransit / trucks.length) * 100) : 0;

    const today = new Date().toLocaleDateString('en-GB', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

    return `
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;500;600;700&display=swap');
        
        :root {
          --bg: #f2f3f5;
          --surface: #ffffff;
          --ink: #12161d;
          --muted: #5d6675;
          --line: #e0e3e8;
          --accent: #1b44c8;
          --neutral: #c9ccd3;
          --warning: #a15c07;
        }
        
        @media (prefers-color-scheme: dark) {
          :root {
            --bg: #0f1218;
            --surface: #161a22;
            --ink: #eceef2;
            --muted: #98a1b0;
            --line: #262c37;
            --accent: #7c9bff;
            --neutral: #3a4150;
            --warning: #e0a24a;
          }
        }
        
        * {
          font-family: 'Hanken Grotesk', system-ui, -apple-system, sans-serif;
          font-variant-numeric: tabular-nums;
        }
        
        .kpi-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 28px;
          padding-bottom: 16px;
          border-bottom: 1px solid var(--line);
        }
        
        .kpi-header h1 {
          font-size: 20px;
          font-weight: 600;
          color: var(--ink);
          margin: 0;
          letter-spacing: -0.3px;
        }
        
        .kpi-date {
          font-size: 13px;
          color: var(--muted);
        }
        
        .hero-panel {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0;
          background: var(--surface);
          border: 1px solid var(--line);
          border-radius: 10px;
          margin-bottom: 20px;
          overflow: hidden;
        }
        
        .hero-left {
          padding: 28px;
          border-right: 1px solid var(--line);
        }
        
        .hero-label {
          font-size: 13px;
          font-weight: 500;
          color: var(--muted);
          margin-bottom: 12px;
        }
        
        .hero-value {
          font-size: clamp(34px, 5vw, 52px);
          font-weight: 600;
          color: var(--accent);
          letter-spacing: -1.5px;
          line-height: 1;
          margin-bottom: 8px;
        }
        
        .hero-value .currency {
          font-size: 0.6em;
          margin-left: 8px;
          color: var(--muted);
          font-weight: 500;
        }
        
        .hero-margin {
          font-size: 13px;
          color: var(--muted);
        }
        
        .hero-right {
          padding: 28px;
        }
        
        .revenue-bar {
          height: 14px;
          background: var(--neutral);
          border-radius: 7px;
          overflow: hidden;
          margin-bottom: 12px;
        }
        
        .revenue-fill {
          height: 100%;
          background: var(--accent);
          width: ${profitMargin}%;
          border-radius: 7px;
        }
        
        .revenue-legend {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        
        .legend-row {
          display: flex;
          justify-content: space-between;
          font-size: 13px;
        }
        
        .legend-label {
          color: var(--muted);
        }
        
        .legend-value {
          font-weight: 600;
          color: var(--ink);
        }
        
        .legend-row.total {
          padding-top: 8px;
          border-top: 1px solid var(--line);
          margin-top: 4px;
        }
        
        .section-title {
          font-size: 15px;
          font-weight: 600;
          color: var(--ink);
          margin: 28px 0 16px 0;
        }
        
        .efficiency-panel {
          background: var(--surface);
          border: 1px solid var(--line);
          border-radius: 10px;
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          margin-bottom: 20px;
          overflow: hidden;
        }
        
        .efficiency-item {
          padding: 24px;
          border-right: 1px solid var(--line);
        }
        
        .efficiency-item:last-child {
          border-right: none;
        }
        
        .efficiency-label {
          font-size: 13px;
          font-weight: 500;
          color: var(--muted);
          margin-bottom: 8px;
        }
        
        .efficiency-value {
          font-size: 24px;
          font-weight: 600;
          color: var(--ink);
          letter-spacing: -0.5px;
          margin-bottom: 4px;
        }
        
        .efficiency-note {
          font-size: 12px;
          color: var(--muted);
        }
        
        .fleet-panel {
          background: var(--surface);
          border: 1px solid var(--line);
          border-radius: 10px;
          padding: 24px;
          margin-bottom: 20px;
        }
        
        .fleet-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        
        .fleet-title {
          font-size: 15px;
          font-weight: 600;
          color: var(--ink);
        }
        
        .fleet-util {
          font-size: 13px;
          color: var(--muted);
        }
        
        .fleet-bar {
          height: 24px;
          display: flex;
          border-radius: 6px;
          overflow: hidden;
          margin-bottom: 12px;
        }
        
        .fleet-segment {
          height: 100%;
          background: var(--neutral);
        }
        
        .fleet-segment.active {
          background: var(--accent);
        }
        
        .fleet-summary {
          font-size: 13px;
          color: var(--muted);
        }
        
        .chart-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
        }
        
        .chart-box {
          background: var(--surface);
          border: 1px solid var(--line);
          border-radius: 10px;
          padding: 20px;
        }
        
        .chart-title {
          font-size: 14px;
          font-weight: 600;
          color: var(--ink);
          margin: 0 0 16px 0;
        }
        
        @media (max-width: 820px) {
          .hero-panel {
            grid-template-columns: 1fr;
          }
          
          .hero-left {
            border-right: none;
            border-bottom: 1px solid var(--line);
          }
          
          .efficiency-panel {
            grid-template-columns: repeat(2, 1fr);
          }
          
          .efficiency-item:nth-child(2) {
            border-right: none;
          }
          
          .efficiency-item:nth-child(2n) {
            border-right: none;
          }
          
          .chart-grid {
            grid-template-columns: 1fr;
          }
        }
      </style>
      
      <div class="kpi-header">
        <h1>Operations KPIs</h1>
        <div class="kpi-date">${today}</div>
      </div>
      
      <div class="hero-panel">
        <div class="hero-left">
          <div class="hero-label">Net profit</div>
          <div class="hero-value">${Utils.fmtTZS(netProfit)}<span class="currency">TZS</span></div>
          <div class="hero-margin">Profit margin ${profitMargin}%</div>
        </div>
        <div class="hero-right">
          <div class="hero-label">Where revenue went</div>
          <div class="revenue-bar" role="progressbar" aria-valuenow="${profitMargin}" aria-valuemin="0" aria-valuemax="100">
            <div class="revenue-fill"></div>
          </div>
          <div class="revenue-legend">
            <div class="legend-row">
              <span class="legend-label">Net profit</span>
              <span class="legend-value">${Utils.fmtTZS(netProfit)} (${profitMargin}%)</span>
            </div>
            <div class="legend-row">
              <span class="legend-label">Running costs</span>
              <span class="legend-value">${Utils.fmtTZS(runningCosts)} (${100 - profitMargin}%)</span>
            </div>
            <div class="legend-row total">
              <span class="legend-label">Total revenue</span>
              <span class="legend-value">${Utils.fmtTZS(totalRev)}</span>
            </div>
          </div>
        </div>
      </div>
      
      <h2 class="section-title">Efficiency</h2>
      <div class="efficiency-panel">
        <div class="efficiency-item">
          <div class="efficiency-label">Cost per 100 km</div>
          <div class="efficiency-value">${Utils.fmtTZS(costPer100km)}</div>
          <div class="efficiency-note">TZS</div>
        </div>
        <div class="efficiency-item">
          <div class="efficiency-label">Fuel efficiency</div>
          <div class="efficiency-value">${avgEco}</div>
          <div class="efficiency-note">km/l</div>
        </div>
        <div class="efficiency-item">
          <div class="efficiency-label">Trips completed</div>
          <div class="efficiency-value">${completed}</div>
          <div class="efficiency-note">this period</div>
        </div>
        <div class="efficiency-item">
          <div class="efficiency-label">On-time rate</div>
          <div class="efficiency-value" style="color: ${completed === 0 ? 'var(--warning)' : 'var(--ink)'}">
            ${completed === 0 ? '–' : onTimeRate + '%'}
          </div>
          <div class="efficiency-note" style="color: ${completed === 0 ? 'var(--warning)' : 'var(--muted)'}">
            ${completed === 0 ? 'Needs completed trips' : 'of all trips'}
          </div>
        </div>
      </div>
      
      <h2 class="section-title">Fleet</h2>
      <div class="fleet-panel">
        <div class="fleet-header">
          <div class="fleet-title">Total distance covered</div>
          <div class="fleet-util">Fleet utilization ${fleetUtilization}%</div>
        </div>
        <div style="font-size: 36px; font-weight: 600; color: var(--ink); letter-spacing: -1px; margin-bottom: 16px;">
          ${Utils.fmtNum(totalKm)} <span style="font-size: 16px; color: var(--muted); font-weight: 500;">km</span>
        </div>
        <div class="fleet-bar" role="progressbar" aria-valuenow="${fleetUtilization}" aria-valuemin="0" aria-valuemax="100">
          ${trucks.map((t, i) => {
            const isInTransit = trips.some(trip => trip.truckId === t.id && trip.status === 'In Transit');
            return `<div class="fleet-segment ${isInTransit ? 'active' : ''}" style="flex: 1" title="${Utils.esc(t.plateNumber)}"></div>`;
          }).join('')}
        </div>
        <div class="fleet-summary">
          ${trucks.length} trucks, ${inTransit} in transit, ${trucks.length - inTransit} idle
        </div>
      </div>
      
      <div class="chart-grid">
        <div class="chart-box">
          <h3 class="chart-title">Monthly trips and revenue</h3>
          <div style="height: 280px;">
            <canvas id="kpiMonthlyChart"></canvas>
          </div>
        </div>
        <div class="chart-box">
          <h3 class="chart-title">Fuel spend by truck</h3>
          <div style="height: 280px;">
            <canvas id="kpiFuelChart"></canvas>
          </div>
        </div>
      </div>
    `;
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
          { label: 'Trips', data: labels.map(m => months[m].trips), backgroundColor: '#1b44c8', yAxisID: 'y' },
          { label: 'Revenue', data: labels.map(m => months[m].revenue), type: 'line', borderColor: '#1b44c8', backgroundColor: 'rgba(27, 68, 200, 0.1)', yAxisID: 'y1', tension: 0.4 }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { 
          legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 8 } }
        },
        scales: {
          y:  { position: 'left', title: { display: true, text: 'Trips' }, grid: { color: 'rgba(0,0,0,0.05)' }, beginAtZero: true },
          y1: { position: 'right', title: { display: true, text: 'TZS' }, grid: { drawOnChartArea: false, color: 'rgba(0,0,0,0.05)' }, beginAtZero: true }
        }
      }
    });
  },

  renderFuelChart() {
    const trucks = DB.trucks(), expenses = DB.expenses();
    
    const data = trucks.map(t => {
      const truckFuelExpenses = expenses.filter(e => 
        e.truckId === t.id && (e.category === 'Fuel (Diesel/Petrol)' || e.category === 'Fuel')
      );
      
      const totalCost = truckFuelExpenses.reduce((s, x) => s + Number(x.amount || 0), 0);
      
      return {
        label: t.plateNumber,
        value: totalCost
      };
    }).filter(d => d.value > 0);
    
    const canvas = document.getElementById('kpiFuelChart');
    if (!canvas) return;

    if (!data.length) {
      canvas.parentElement.innerHTML = '<div style="display: flex; align-items: center; justify-content: center; height: 280px; color: var(--muted);">No fuel expenses recorded yet.</div>';
      return;
    }

    new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: data.map(d => d.label),
        datasets: [{ 
          data: data.map(d => d.value), 
          backgroundColor: ['#1b44c8', '#c9ccd3', '#5d6675', '#e0e3e8', '#94a3b8', '#64748b', '#475569'],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '65%',
        plugins: { 
          legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 12, padding: 15 } },
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
