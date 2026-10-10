const KPI = {
  showOnTimeDetails: false, // State to toggle the detailed view

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

    // If showing details, render the completed trips list
    if (this.showOnTimeDetails) {
      const completedTrips = trips
        .filter(t => t.status === 'Completed')
        .sort((a, b) => new Date(b.completedAt || b.date) - new Date(a.completedAt || a.date));

      return `
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;500;600;700&display=swap');
          * { font-family: 'Hanken Grotesk', system-ui, -apple-system, sans-serif; font-variant-numeric: tabular-nums; }
          
          .kpi-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 2px solid #e0e3e8; }
          .kpi-header h1 { font-size: 20px; font-weight: 600; color: #1e3a8a; margin: 0; letter-spacing: -0.3px; }
          .kpi-date { font-size: 13px; color: #64748b; font-weight: 500; }
          
          .btn-back {
            background: #f1f5f9; color: #1e3a8a; border: 1px solid #e0e3e8; border-radius: 8px;
            padding: 10px 20px; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s;
            display: inline-flex; align-items: center; gap: 8px;
          }
          .btn-back:hover { background: #e2e8f0; }

          .details-panel {
            background: #ffffff; border: 1px solid #e0e3e8; border-radius: 10px; overflow: hidden;
          }
          .details-header {
            padding: 20px; border-bottom: 1px solid #e0e3e8; display: flex; justify-content: space-between; align-items: center;
          }
          .details-title { font-size: 16px; font-weight: 600; color: #1e3a8a; margin: 0; }
          
          .trip-detail-row {
            display: grid; grid-template-columns: 1.5fr 2fr 1fr 1fr; gap: 16px;
            padding: 16px 20px; border-bottom: 1px solid #f1f5f9; align-items: center;
          }
          .trip-detail-row:last-child { border-bottom: none; }
          .trip-detail-row:hover { background: #f8fafc; }
          
          .detail-truck { font-weight: 600; color: #0f172a; font-size: 14px; }
          .detail-route { font-size: 13px; color: #64748b; margin-top: 2px; }
          .detail-date { font-size: 13px; color: #64748b; }
          .detail-status { 
            font-size: 13px; font-weight: 600; padding: 4px 10px; border-radius: 6px; 
            display: inline-block; text-align: center; width: fit-content;
          }
          .detail-status.ontime { background: #f0fdf4; color: #16a34a; }
          .detail-status.late { background: #fef2f2; color: #dc2626; }
          
          .empty-details { padding: 40px; text-align: center; color: #64748b; font-size: 14px; }

          @media (max-width: 820px) {
            .trip-detail-row { grid-template-columns: 1fr 1fr; gap: 12px; }
            .trip-detail-row > :nth-child(2) { grid-column: span 2; }
          }
        </style>

        <div class="kpi-header">
          <h1>Operations KPIs</h1>
          <div class="kpi-date">${today}</div>
        </div>

        <div class="details-panel">
          <div class="details-header">
            <h2 class="details-title">Completed Trips Details</h2>
            <button class="btn-back" onclick="KPI.toggleOnTimeDetails()">
              ← Back to Efficiency
            </button>
          </div>
          
          ${completedTrips.length > 0 ? completedTrips.map(trip => {
            const truck = trucks.find(t => t.id === trip.truckId);
            const isOnTime = trip.onTime;
            return `
              <div class="trip-detail-row">
                <div>
                  <div class="detail-truck">${truck ? Utils.esc(truck.plateNumber) : 'Unknown Truck'}</div>
                  <div class="detail-route">${Utils.esc(trip.from)} → ${Utils.esc(trip.to)}</div>
                </div>
                <div class="detail-date">
                  Completed: ${Utils.fmtDate(trip.completedAt || trip.date)}
                </div>
                <div class="detail-date">
                  Distance: ${Utils.fmtNum(trip.distance)} km
                </div>
                <div>
                  <span class="detail-status ${isOnTime ? 'ontime' : 'late'}">
                    ${isOnTime ? 'On Time' : 'Late'}
                  </span>
                </div>
              </div>
            `;
          }).join('') : '<div class="empty-details">No completed trips recorded yet.</div>'}
        </div>
      `;
    }

    // Normal KPI View
    return `
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;500;600;700&display=swap');
        
        * {
          font-family: 'Hanken Grotesk', system-ui, -apple-system, sans-serif;
          font-variant-numeric: tabular-nums;
        }
        
        .kpi-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          padding-bottom: 16px;
          border-bottom: 2px solid #e0e3e8;
        }
        
        .kpi-header h1 {
          font-size: 20px;
          font-weight: 600;
          color: #1e3a8a;
          margin: 0;
          letter-spacing: -0.3px;
        }
        
        .kpi-date {
          font-size: 13px;
          color: #64748b;
          font-weight: 500;
        }
        
        .kpi-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }
        
        .kpi-card {
          background: #ffffff;
          border: 1px solid #e0e3e8;
          border-radius: 10px;
          padding: 20px;
          transition: box-shadow 0.2s;
        }
        
        .kpi-card:hover {
          box-shadow: 0 2px 8px rgba(0,0,0,0.06);
        }
        
        .kpi-label {
          font-size: 13px;
          font-weight: 500;
          color: #64748b;
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .kpi-value {
          font-size: 28px;
          font-weight: 700;
          color: #1e3a8a;
          letter-spacing: -0.5px;
          line-height: 1.1;
        }
        
        .kpi-value.revenue { color: #16a34a; }
        .kpi-value.cost { color: #f59e0b; }
        .kpi-value.profit { color: #1e40af; }
        .kpi-value.warning { color: #dc2626; }
        
        .kpi-sub {
          font-size: 12px;
          color: #94a3b8;
          margin-top: 6px;
        }
        
        .hero-panel {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0;
          background: #ffffff;
          border: 1px solid #e0e3e8;
          border-radius: 10px;
          margin-bottom: 24px;
          overflow: hidden;
        }
        
        .hero-left {
          padding: 28px;
          border-right: 1px solid #e0e3e8;
        }
        
        .hero-label {
          font-size: 13px;
          font-weight: 500;
          color: #64748b;
          margin-bottom: 12px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .hero-value {
          font-size: clamp(32px, 4vw, 48px);
          font-weight: 700;
          color: #1e40af;
          letter-spacing: -1.5px;
          line-height: 1;
          margin-bottom: 8px;
        }
        
        .hero-value .currency {
          font-size: 0.55em;
          margin-left: 8px;
          color: #64748b;
          font-weight: 500;
        }
        
        .hero-margin {
          font-size: 13px;
          color: #64748b;
        }
        
        .hero-margin strong {
          color: #16a34a;
          font-weight: 600;
        }
        
        .hero-right {
          padding: 28px;
        }
        
        .revenue-bar {
          height: 14px;
          background: #e0e3e8;
          border-radius: 7px;
          overflow: hidden;
          margin-bottom: 12px;
        }
        
        .revenue-fill {
          height: 100%;
          background: #1e40af;
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
          color: #64748b;
        }
        
        .legend-value {
          font-weight: 600;
          color: #1e3a8a;
        }
        
        .legend-row.total {
          padding-top: 8px;
          border-top: 1px solid #e0e3e8;
          margin-top: 4px;
        }
        
        .section-title {
          font-size: 15px;
          font-weight: 600;
          color: #1e3a8a;
          margin: 24px 0 16px 0;
        }
        
        .efficiency-panel {
          background: #ffffff;
          border: 1px solid #e0e3e8;
          border-radius: 10px;
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          margin-bottom: 24px;
          overflow: hidden;
        }
        
        .efficiency-item {
          padding: 24px;
          border-right: 1px solid #e0e3e8;
        }
        
        .efficiency-item:last-child {
          border-right: none;
        }
        
        .efficiency-label {
          font-size: 13px;
          font-weight: 500;
          color: #64748b;
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .efficiency-value {
          font-size: 24px;
          font-weight: 700;
          color: #1e3a8a;
          letter-spacing: -0.5px;
          margin-bottom: 4px;
        }
        
        .efficiency-note {
          font-size: 12px;
          color: #94a3b8;
        }

        .clickable-card {
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .clickable-card:hover {
          background: #f8fafc;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        }
        
        .fleet-panel {
          background: #ffffff;
          border: 1px solid #e0e3e8;
          border-radius: 10px;
          padding: 24px;
          margin-bottom: 24px;
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
          color: #1e3a8a;
        }
        
        .fleet-util {
          font-size: 13px;
          color: #64748b;
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
          background: #e0e3e8;
        }
        
        .fleet-segment.active {
          background: #1e40af;
        }
        
        .fleet-summary {
          font-size: 13px;
          color: #64748b;
        }
        
        .chart-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
        }
        
        .chart-box {
          background: #ffffff;
          border: 1px solid #e0e3e8;
          border-radius: 10px;
          padding: 20px;
        }
        
        .chart-title {
          font-size: 14px;
          font-weight: 600;
          color: #1e3a8a;
          margin: 0 0 16px 0;
        }
        
        @media (max-width: 820px) {
          .hero-panel { grid-template-columns: 1fr; }
          .hero-left { border-right: none; border-bottom: 1px solid #e0e3e8; }
          .efficiency-panel { grid-template-columns: repeat(2, 1fr); }
          .efficiency-item:nth-child(2) { border-right: none; }
          .efficiency-item:nth-child(2n) { border-right: none; }
          .chart-grid { grid-template-columns: 1fr; }
          .kpi-grid { grid-template-columns: repeat(2, 1fr); }
        }
      </style>
      
      <div class="kpi-header">
        <h1>Operations KPIs</h1>
        <div class="kpi-date">${today}</div>
      </div>
      
      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-label">Total Revenue</div>
          <div class="kpi-value revenue">${Utils.fmtTZS(totalRev)}</div>
          <div class="kpi-sub">Gross income from trips</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Trip Running Costs</div>
          <div class="kpi-value cost">${Utils.fmtTZS(tripExpenses)}</div>
          <div class="kpi-sub">Fuel, driver & turnboy allowances</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Net Profit</div>
          <div class="kpi-value profit">${Utils.fmtTZS(netProfit)}</div>
          <div class="kpi-sub">Revenue minus all expenses</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Total Expenses</div>
          <div class="kpi-value cost">${Utils.fmtTZS(totalExp)}</div>
          <div class="kpi-sub">All operational costs</div>
        </div>
      </div>
      
      <div class="hero-panel">
        <div class="hero-left">
          <div class="hero-label">Net profit</div>
          <div class="hero-value">${Utils.fmtTZS(netProfit)}<span class="currency">TZS</span></div>
          <div class="hero-margin">Profit margin <strong>${profitMargin}%</strong></div>
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
        <div class="efficiency-item clickable-card" onclick="KPI.toggleOnTimeDetails()" title="Click to view completed trips">
          <div class="efficiency-label">On-time rate</div>
          <div class="efficiency-value" style="color: ${completed === 0 ? '#dc2626' : '#1e3a8a'}; display: flex; align-items: center; gap: 8px;">
            ${completed === 0 ? '–' : onTimeRate + '%'}
            <svg style="width: 16px; height: 16px; opacity: 0.5;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
          </div>
          <div class="efficiency-note" style="color: ${completed === 0 ? '#dc2626' : '#94a3b8'}">
            ${completed === 0 ? 'Needs completed trips' : 'Tap to view details'}
          </div>
        </div>
      </div>
      
      <h2 class="section-title">Fleet</h2>
      <div class="fleet-panel">
        <div class="fleet-header">
          <div class="fleet-title">Total distance covered</div>
          <div class="fleet-util">Fleet utilization ${fleetUtilization}%</div>
        </div>
        <div style="font-size: 36px; font-weight: 700; color: #1e3a8a; letter-spacing: -1px; margin-bottom: 16px;">
          ${Utils.fmtNum(totalKm)} <span style="font-size: 16px; color: #64748b; font-weight: 500;">km</span>
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

  toggleOnTimeDetails() {
    this.showOnTimeDetails = !this.showOnTimeDetails;
    App.refresh();
  },

  afterRender() {
    if (!this.showOnTimeDetails) {
      this.renderMonthlyChart();
      this.renderFuelChart();
    }
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
          { label: 'Trips', data: labels.map(m => months[m].trips), backgroundColor: '#1e40af', yAxisID: 'y' },
          { label: 'Revenue', data: labels.map(m => months[m].revenue), type: 'line', borderColor: '#16a34a', backgroundColor: 'rgba(22, 163, 74, 0.1)', yAxisID: 'y1', tension: 0.4 }
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
      canvas.parentElement.innerHTML = '<div style="display: flex; align-items: center; justify-content: center; height: 280px; color: #64748b;">No fuel expenses recorded yet.</div>';
      return;
    }

    new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: data.map(d => d.label),
        datasets: [{ 
          data: data.map(d => d.value), 
          backgroundColor: ['#1e40af', '#f59e0b', '#16a34a', '#dc2626', '#8b5cf6', '#ec4899', '#06b6d4'],
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
