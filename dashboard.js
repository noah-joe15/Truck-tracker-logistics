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

    const inTransit = trips.filter(t => t.status === 'In Transit');
    const needsAttention = trucks.filter(t => {
      const compliance = DB.compliance ? DB.compliance().filter(c => c.truckId === t.id && c.daysUntilExpiry <= 30) : [];
      return compliance.length > 0;
    }).length;

    const greeting = this.getGreeting();
    const statusText = this.getStatusText(trucks.length, inTransit.length, needsAttention);

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
          --success: #059669;
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
            --success: #10b981;
          }
        }
        
        * {
          font-family: 'Hanken Grotesk', system-ui, -apple-system, sans-serif;
          font-variant-numeric: tabular-nums;
        }
        
        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 24px;
          padding: 0 4px;
        }
        
        .dashboard-header h1 {
          font-size: 24px;
          font-weight: 600;
          color: var(--ink);
          margin: 0 0 8px 0;
          letter-spacing: -0.5px;
        }
        
        .dashboard-status {
          font-size: 13px;
          color: var(--muted);
          line-height: 1.5;
        }
        
        .dashboard-status .warning-count {
          color: var(--warning);
          font-weight: 600;
        }
        
        .btn-primary {
          background: var(--accent);
          color: white;
          border: none;
          border-radius: 10px;
          padding: 10px 20px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: opacity 0.2s;
        }
        
        .btn-primary:hover {
          opacity: 0.9;
        }
        
        .dashboard-grid {
          display: grid;
          grid-template-columns: 1.7fr 1fr;
          gap: 20px;
        }
        
        .panel {
          background: var(--surface);
          border: 1px solid var(--line);
          border-radius: 10px;
          padding: 20px;
          margin-bottom: 20px;
        }
        
        .panel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          padding-bottom: 12px;
          border-bottom: 1px solid var(--line);
        }
        
        .panel-title {
          font-size: 15px;
          font-weight: 600;
          color: var(--ink);
          margin: 0;
        }
        
        .panel-count {
          font-size: 13px;
          color: var(--muted);
          font-weight: 500;
        }
        
        .trip-row {
          display: grid;
          grid-template-columns: 2fr 1.5fr 1.5fr 1fr;
          gap: 16px;
          padding: 14px 0;
          border-bottom: 1px solid var(--line);
          align-items: center;
        }
        
        .trip-row:last-child {
          border-bottom: none;
        }
        
        .trip-id {
          font-weight: 600;
          color: var(--ink);
          font-size: 14px;
          margin-bottom: 4px;
        }
        
        .trip-route {
          font-size: 13px;
          color: var(--muted);
        }
        
        .truck-plate {
          font-weight: 600;
          color: var(--ink);
          font-size: 14px;
          margin-bottom: 2px;
        }
        
        .truck-driver {
          font-size: 12px;
          color: var(--muted);
        }
        
        .progress-track {
          height: 6px;
          background: var(--neutral);
          border-radius: 3px;
          overflow: hidden;
          margin-bottom: 4px;
        }
        
        .progress-fill {
          height: 100%;
          background: var(--accent);
          border-radius: 3px;
        }
        
        .progress-text {
          font-size: 12px;
          color: var(--muted);
          text-align: right;
        }
        
        .arrival-time {
          font-size: 13px;
          color: var(--ink);
          font-weight: 500;
        }
        
        .activity-item {
          padding: 12px 0;
          border-bottom: 1px solid var(--line);
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }
        
        .activity-item:last-child {
          border-bottom: none;
        }
        
        .activity-title {
          font-size: 14px;
          font-weight: 500;
          color: var(--ink);
          margin-bottom: 2px;
        }
        
        .activity-detail {
          font-size: 13px;
          color: var(--muted);
        }
        
        .activity-time {
          font-size: 12px;
          color: var(--muted);
          white-space: nowrap;
          margin-left: 12px;
        }
        
        .fleet-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 0;
          border-bottom: 1px solid var(--line);
        }
        
        .fleet-item:last-child {
          border-bottom: none;
        }
        
        .fleet-left {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        
        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--neutral);
        }
        
        .status-dot.in-transit {
          background: var(--accent);
        }
        
        .status-dot.needs-attention {
          background: var(--warning);
        }
        
        .fleet-plate {
          font-weight: 600;
          color: var(--ink);
          font-size: 14px;
        }
        
        .fleet-status {
          font-size: 13px;
          color: var(--muted);
          text-align: right;
        }
        
        .empty-state {
          text-align: center;
          padding: 40px 20px;
          color: var(--muted);
          font-size: 14px;
        }
        
        @media (max-width: 860px) {
          .dashboard-grid {
            grid-template-columns: 1fr;
          }
          
          .trip-row {
            grid-template-columns: 1fr 1fr;
            gap: 12px;
          }
          
          .trip-row > :nth-child(2) {
            display: none;
          }
        }
      </style>
      
      <div class="dashboard-header">
        <div>
          <h1>${greeting}</h1>
          <div class="dashboard-status">${statusText}</div>
        </div>
        <button class="btn-primary" onclick="App.navigate('operations')">New trip</button>
      </div>
      
      <div class="dashboard-grid">
        <div class="left-column">
          <div class="panel">
            <div class="panel-header">
              <h2 class="panel-title">Trips in progress</h2>
              <span class="panel-count">${inTransit.length} active</span>
            </div>
            ${inTransit.length > 0 ? inTransit.map(trip => {
              const truck = trucks.find(t => t.id === trip.truckId);
              const driver = DB.drivers().find(d => d.id === trip.driverId);
              const progress = trip.distance > 0 ? Math.min(100, Math.round((trip.distance * 0.6) / trip.distance * 100)) : 0;
              
              return `
                <div class="trip-row">
                  <div>
                    <div class="trip-id">${Utils.esc(trip.id.slice(0, 8).toUpperCase())}</div>
                    <div class="trip-route">${Utils.esc(trip.from)} → ${Utils.esc(trip.to)}</div>
                  </div>
                  <div>
                    <div class="truck-plate">${truck ? Utils.esc(truck.plateNumber) : 'Unknown'}</div>
                    <div class="truck-driver">${driver ? Utils.esc(driver.name) : 'No driver'}</div>
                  </div>
                  <div>
                    <div class="progress-track">
                      <div class="progress-fill" style="width: ${progress}%"></div>
                    </div>
                    <div class="progress-text">${progress}%</div>
                  </div>
                  <div class="arrival-time">Today</div>
                </div>
              `;
            }).join('') : '<div class="empty-state">No trips in progress. Start one with New trip.</div>'}
          </div>
          
          <div class="panel">
            <div class="panel-header">
              <h2 class="panel-title">Recent activity</h2>
            </div>
            ${this.getRecentActivity(trips, expenses)}
          </div>
        </div>
        
        <div class="right-column">
          <div class="panel">
            <div class="panel-header">
              <h2 class="panel-title">Fleet</h2>
            </div>
            ${trucks.length > 0 ? trucks.map(truck => {
              const isTransit = trips.some(t => t.truckId === truck.id && t.status === 'In Transit');
              return `
                <div class="fleet-item">
                  <div class="fleet-left">
                    <div class="status-dot ${isTransit ? 'in-transit' : ''}"></div>
                    <div class="fleet-plate">${Utils.esc(truck.plateNumber)}</div>
                  </div>
                  <div class="fleet-status">${isTransit ? 'In transit' : 'Idle'}</div>
                </div>
              `;
            }).join('') : '<div class="empty-state">No trucks added yet.</div>'}
          </div>
          
          <div class="panel">
            <div class="panel-header">
              <h2 class="panel-title">Needs attention</h2>
            </div>
            ${this.getNeedsAttention(trucks, trips)}
          </div>
        </div>
      </div>
    `;
  },

  getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  },

  getStatusText(totalTrucks, inTransit, needsAttention) {
    const parts = [];
    if (totalTrucks > 0) {
      parts.push(`${inTransit} of ${totalTrucks} trucks are on the road`);
    }
    if (needsAttention > 0) {
      parts.push(`<span class="warning-count">${needsAttention} items need attention</span>`);
    }
    return parts.length > 0 ? parts.join('. ') + '.' : 'No active operations.';
  },

  getRecentActivity(trips, expenses) {
    const activities = [];
    
    trips.slice(0, 3).forEach(trip => {
      activities.push({
        title: 'Trip departed',
        detail: `${trip.from} to ${trip.to}`,
        time: Utils.fmtDate(trip.date)
      });
    });
    
    expenses.slice(0, 2).forEach(exp => {
      if (exp.category === 'Fuel (Diesel/Petrol)' || exp.category === 'Fuel') {
        activities.push({
          title: 'Fuel purchase recorded',
          detail: Utils.fmtTZS(exp.amount),
          time: Utils.fmtDate(exp.date)
        });
      }
    });
    
    if (activities.length === 0) {
      return '<div class="empty-state">No recent activity.</div>';
    }
    
    return activities.map(a => `
      <div class="activity-item">
        <div>
          <div class="activity-title">${a.title}</div>
          <div class="activity-detail">${a.detail}</div>
        </div>
        <div class="activity-time">${a.time}</div>
      </div>
    `).join('');
  },

  getNeedsAttention(trucks, trips) {
    const items = [];
    
    trucks.forEach(truck => {
      const compliance = DB.compliance ? DB.compliance().filter(c => c.truckId === truck.id && c.daysUntilExpiry <= 30) : [];
      compliance.forEach(c => {
        items.push({
          title: `${c.category} expiring`,
          detail: `${Utils.esc(truck.plateNumber)} - ${c.daysUntilExpiry} days`
        });
      });
    });
    
    if (items.length === 0) {
      return '<div class="empty-state" style="color: var(--success);">Everything is up to date.</div>';
    }
    
    return items.map(item => `
      <div class="activity-item">
        <div>
          <div class="activity-title" style="color: var(--warning);">${item.title}</div>
          <div class="activity-detail">${item.detail}</div>
        </div>
      </div>
    `).join('');
  }
};
