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
    const costPer100km = totalKm > 0 ? Math.round((totalExp / totalKm) * 100) : 0;
    const netProfit = totalRev - totalExp;
    const profitMargin = totalRev > 0 ? ((netProfit / totalRev) * 100).toFixed(1) : 0;

    return `
      <div class="section-title" style="border-bottom: 2px solid var(--primary); padding-bottom: 12px;">
        <h2 style="display: flex; align-items: center; gap: 12px;">
          <svg style="width:28px;height:28px;color:var(--primary)"><use href="#i-chart"/></svg>
          <span>KPI OPERATIONS DASHBOARD</span>
        </h2>
        <span class="live-badge" style="background: linear-gradient(135deg, #10b981, #059669); animation: pulse 2s infinite;">● LIVE MONITORING</span>
      </div>

      <!-- FINANCIAL METRICS GRID -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px; margin-bottom: 24px;">
        <div style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border: 1px solid rgba(59, 130, 246, 0.3); border-radius: 12px; padding: 20px; position: relative; overflow: hidden;">
          <div style="position: absolute; top: 0; right: 0; width: 100px; height: 100px; background: radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 70%);"></div>
          <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8; margin-bottom: 8px;">Total Revenue</div>
          <div style="font-size: 28px; font-weight: 800; color: #10b981; font-family: 'Courier New', monospace; letter-spacing: -1px;">${Utils.fmtTZS(totalRev)}</div>
          <div style="margin-top: 8px; font-size: 12px; color: #64748b;">
            <span style="color: #10b981;">▲</span> Gross Income
          </div>
        </div>

        <div style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 12px; padding: 20px; position: relative; overflow: hidden;">
          <div style="position: absolute; top: 0; right: 0; width: 100px; height: 100px; background: radial-gradient(circle, rgba(245, 158, 11, 0.1) 0%, transparent 70%);"></div>
          <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8; margin-bottom: 8px;">Trip Running Costs</div>
          <div style="font-size: 28px; font-weight: 800; color: #f59e0b; font-family: 'Courier New', monospace; letter-spacing: -1px;">${Utils.fmtTZS(tripExpenses)}</div>
          <div style="margin-top: 8px; font-size: 12px; color: #64748b;">
            <span style="color: #f59e0b;">▼</span> Operational Expenses
          </div>
        </div>

        <div style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border: 1px solid rgba(139, 92, 246, 0.3); border-radius: 12px; padding: 20px; position: relative; overflow: hidden; grid-column: span 2;">
          <div style="position: absolute; top: 0; right: 0; width: 150px; height: 100%; background: linear-gradient(90deg, transparent, rgba(139, 92, 246, 0.05));"></div>
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8; margin-bottom: 8px;">Net Profit</div>
              <div style="font-size: 32px; font-weight: 800; color: ${netProfit >= 0 ? '#8b5cf6' : '#ef4444'}; font-family: 'Courier New', monospace; letter-spacing: -1px;">${Utils.fmtTZS(netProfit)}</div>
              <div style="margin-top: 8px; font-size: 12px; color: #64748b;">
                Profit Margin: <span style="color: ${profitMargin >= 0 ? '#10b981' : '#ef4444'}; font-weight: 700;">${profitMargin}%</span>
              </div>
            </div>
            <div style="text-align: right;">
              <div style="font-size: 11px; color: #94a3b8; margin-bottom: 4px;">Efficiency Score</div>
              <div style="font-size: 24px; font-weight: 700; color: #8b5cf6;">${parseFloat(profitMargin) >= 20 ? 'A+' : parseFloat(profitMargin) >= 15 ? 'A' : parseFloat(profitMargin) >= 10 ? 'B+' : 'B'}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- OPERATIONAL METRICS -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; margin-bottom: 24px;">
        <div style="background: #f8fafc; border-left: 4px solid #3b82f6; border-radius: 8px; padding: 16px;">
          <div style="font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Cost / 100 km</div>
          <div style="font-size: 24px; font-weight: 800; color: #f59e0b; font-family: 'Courier New', monospace; margin-top: 4px;">${Utils.fmtTZS(costPer100km)}</div>
        </div>
        <div style="background: #f8fafc; border-left: 4px solid #10b981; border-radius: 8px; padding: 16px;">
          <div style="font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">On-Time Rate</div>
          <div style="font-size: 24px; font-weight: 800; color: #10b981; font-family: 'Courier New', monospace; margin-top: 4px;">${onTimeRate}%</div>
        </div>
        <div style="background: #f8fafc; border-left: 4px solid #8b5cf6; border-radius: 8px; padding: 16px;">
          <div style="font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Active Trucks</div>
          <div style="font-size: 24px; font-weight: 800; color: #8b5cf6; font-family: 'Courier New', monospace; margin-top: 4px;">${trucks.length} <span style="font-size: 14px; color: #94a3b8;">units</span></div>
        </div>
        <div style="background: #f8fafc; border-left: 4px solid #f59e0b; border-radius: 8px; padding: 16px;">
          <div style="font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">In Transit</div>
          <div style="font-size: 24px; font-weight: 800; color: #f59e0b; font-family: 'Courier New', monospace; margin-top: 4px;">${inTransit} <span style="font-size: 14px; color: #94a3b8;">active</span></div>
        </div>
        <div style="background: #f8fafc; border-left: 4px solid #06b6d4; border-radius: 8px; padding: 16px;">
          <div style="font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Trips Completed</div>
          <div style="font-size: 24px; font-weight: 800; color: #06b6d4; font-family: 'Courier New', monospace; margin-top: 4px;">${completed}</div>
        </div>
        <div style="background: #f8fafc; border-left: 4px solid #ec4899; border-radius: 8px; padding: 16px;">
          <div style="font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Avg KM/L</div>
          <div style="font-size: 24px; font-weight: 800; color: #ec4899; font-family: 'Courier New', monospace; margin-top: 4px;">${avgEco}</div>
        </div>
      </div>

      <!-- TOTAL KM METRIC -->
      <div style="background: linear-gradient(90deg, #1e293b 0%, #334155 100%); border-radius: 12px; padding: 20px; margin-bottom: 24px; display: flex; align-items: center; justify-content: space-between;">
        <div>
          <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8; margin-bottom: 8px;">Total Distance Covered</div>
          <div style="font-size: 36px; font-weight: 800; color: #3b82f6; font-family: 'Courier New', monospace; letter-spacing: -2px;">${Utils.fmtNum(totalKm)} <span style="font-size: 18px; color: #64748b;">km</span></div>
        </div>
        <div style="text-align: right;">
          <div style="font-size: 11px; color: #94a3b8;">Fleet Utilization</div>
          <div style="font-size: 20px; font-weight: 700; color: #10b981;">${trucks.length > 0 ? ((completed / trucks.length) * 100).toFixed(0) : 0}%</div>
        </div>
      </div>

      <!-- DRIVER ACCOUNTABILITY TABLE -->
      <div class="form-section" style="border: 1px solid var(--border); border-radius: 12px; overflow: hidden;">
        <div style="background: linear-gradient(90deg, var(--primary-dark), var(--primary)); padding: 16px; color: white;">
          <h3 style="margin: 0; font-size: 15px; display: flex; align-items: center; gap: 8px;">
            <svg style="width:18px;height:18px;"><use href="#i-users"/></svg>
            DRIVER PERFORMANCE MATRIX
          </h3>
        </div>
        <div class="table-wrapper">
          <table class="data-table">
            <thead style="background: #f8fafc;">
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
            <tbody>${this.driverRows(drivers, trucks, trips, income, expenses, DIESEL_PRICE)}</tbody>
          </table>
        </div>
      </div>

      <!-- CHARTS -->
      <div class="chart-grid">
        <div class="chart-box" style="border: 1px solid var(--border); border-radius: 12px; overflow: hidden;">
          <div style="background: #f8fafc; padding: 12px 16px; border-bottom: 1px solid var(--border);">
            <h3 style="margin: 0; font-size: 14px; display: flex; align-items: center; gap: 8px;">
              <svg style="width:16px;height:16px;color:var(--primary)"><use href="#i-chart"/></svg>
              MONTHLY TRENDS ANALYSIS
            </h3>
          </div>
          <div class="chart-container" style="height: 300px;">
            <canvas id="kpiMonthlyChart"></canvas>
          </div>
        </div>
        <div class="chart-box" style="border: 1px solid var(--border); border-radius: 12px; overflow: hidden;">
          <div style="background: #f8fafc; padding: 12px 16px; border-bottom: 1px solid var(--border);">
            <h3 style="margin: 0; font-size: 14px; display: flex; align-items: center; gap: 8px;">
              <svg style="width:16px;height:16px;color:var(--primary)"><use href="#i-fuel"/></svg>
              FUEL CONSUMPTION BY TRUCK
            </h3>
          </div>
          <div class="chart-container" style="height: 300px;">
            <canvas id="kpiFuelChart"></canvas>
          </div>
        </div>
      </div>
    `;
  },

  driverRows(drivers, trucks, trips, income, expenses, dieselPrice) {
    if (!drivers.length) {
      return '<tr><td colspan="8" style="text-align:center; color:#64748b; padding: 30px;">No drivers assigned yet.</td></tr>';
    }
    
    return drivers.map(d => {
      const truck = trucks.find(t => t.id === d.truckId);
      const dTrips = trips.filter(t => t.driverId === d.id);
      const km = dTrips.reduce((s, x) => s + Number(x.distance || 0), 0);
      const rev = income.filter(x => x.driverId === d.id).reduce((s, x) => s + Number(x.amount || 0), 0);
      
      const driverFuelExpenses = expenses.filter(e => {
        const isFuel = e.category === 'Fuel (Diesel/Petrol)' || e.category === 'Fuel';
        const byDriver = e.driverId === d.id;
        const byTruck = truck && e.truckId === truck.id;
        return isFuel && (byDriver || byTruck);
      });
      
      const fuel = driverFuelExpenses.reduce((s, x) => {
        const liters = Number(x.liters || 0);
        return s + (liters > 0 ? liters : (Number(x.amount || 0) / dieselPrice));
      }, 0);
      
      const eco = fuel > 0 ? (km / fuel).toFixed(1) : '0.0';
      const performance = parseFloat(eco) >= 3 ? '#10b981' : parseFloat(eco) >= 2 ? '#f59e0b' : '#ef4444';
      
      return `<tr style="border-bottom: 1px solid var(--border);">
        <td style="font-weight: 600; color: var(--text);">${Utils.esc(d.name)}</td>
        <td>${truck ? Utils.esc(truck.plateNumber) : '<span style="color: #94a3b8;">Unassigned</span>'}</td>
        <td style="text-align: center; font-family: Courier New, monospace;">${dTrips.length}</td>
        <td style="text-align: right; font-family: Courier New, monospace;">${Utils.fmtNum(km)}</td>
        <td style="text-align: right; font-family: Courier New, monospace; font-weight: 600; color: #10b981;">${Utils.fmtTZS(rev)}</td>
        <td style="text-align: right; font-family: Courier New, monospace;">${fuel.toFixed(1)}</td>
        <td style="text-align: right; font-family: Courier New, monospace; font-weight: 700; color: ${performance};">${eco}</td>
        <td style="text-align: center;">${Utils.statusBadge(d.status || 'Active')}</td>
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
          { label: 'Trips', data: labels.map(m => months[m].trips), backgroundColor: '#3b82f6', yAxisID: 'y' },
          { label: 'Revenue', data: labels.map(m => months[m].revenue), type: 'line', borderColor: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.1)', yAxisID: 'y1', tension: 0.4 }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { 
          legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 8 } },
          tooltip: {
            backgroundColor: 'rgba(15, 23, 42, 0.9)',
            padding: 12,
            cornerRadius: 8,
            titleFont: { family: 'Courier New', size: 13 },
            bodyFont: { family: 'Courier New', size: 12 }
          }
        },
        scales: {
          y:  { position: 'left', title: { display: true, text: 'Trips', font: { family: 'Courier New' } }, grid: { color: 'rgba(0,0,0,0.05)' }, beginAtZero: true },
          y1: { position: 'right', title: { display: true, text: 'TZS', font: { family: 'Courier New' } }, grid: { drawOnChartArea: false, color: 'rgba(0,0,0,0.05)' }, beginAtZero: true }
        }
      }
    });
  },

  renderFuelChart() {
    const trucks = DB.trucks(), expenses = DB.expenses();
    const DIESEL_PRICE = 3430;
    
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
      canvas.parentElement.innerHTML = '<div class="chart-empty" style="display: flex; align-items: center; justify-content: center; height: 300px; color: #94a3b8;"><i class="fas fa-gas-pump" style="margin-right: 8px;"></i>No fuel expenses recorded yet.</div>';
      return;
    }

    new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: data.map(d => d.label),
        datasets: [{ 
          data: data.map(d => d.value), 
          backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '65%',
        plugins: { 
          legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 12, padding: 15, font: { family: 'Courier New', size: 11 } } },
          tooltip: {
            backgroundColor: 'rgba(15, 23, 42, 0.9)',
            padding: 12,
            cornerRadius: 8,
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
