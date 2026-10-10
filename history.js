// =====================================================
// HISTORY MODULE — Activity Log Viewer + Exports
// =====================================================
const History = {
  PAGE_SIZE: 15,
  page: 1,
  filters: { search: '', module: '', action: '', from: '', to: '' },

  render() {
    const entries = this.getFiltered();
    const total = ActivityLog.all().length;
    const stats = this.computeStats();

    return `
      <div class="section-title">
        <h2><svg style="width:24px;height:24px"><use href="#i-clock"/></svg> Activity History</h2>
      </div>

      <div class="history-summary">
        <div class="summary-stat">
          <div class="stat-icon"><svg style="width:20px;height:20px"><use href="#i-chart"/></svg></div>
          <div class="stat-body">
            <div class="stat-label">Total System Actions</div>
            <div class="stat-value">${total.toLocaleString()}</div>
          </div>
        </div>
        <div class="summary-stat">
          <div class="stat-icon"><svg style="width:20px;height:20px"><use href="#i-clock"/></svg></div>
          <div class="stat-body">
            <div class="stat-label">Actions Today</div>
            <div class="stat-value">${stats.today}</div>
          </div>
        </div>
        <div class="summary-stat">
          <div class="stat-icon"><svg style="width:20px;height:20px"><use href="#i-clock"/></svg></div>
          <div class="stat-body">
            <div class="stat-label">Actions This Week</div>
            <div class="stat-value">${stats.last7}</div>
          </div>
        </div>
        <div class="summary-stat">
          <div class="stat-icon"><svg style="width:20px;height:20px"><use href="#i-file"/></svg></div>
          <div class="stat-body">
            <div class="stat-label">Most Active Area</div>
            <div class="stat-value">${this.friendlyModuleName(stats.topModule) || '—'}</div>
          </div>
        </div>
        <div class="summary-stat">
          <div class="stat-icon" style="background: rgba(220, 38, 38, 0.1); color: var(--danger);">
            <svg style="width:20px;height:20px"><use href="#i-x"/></svg>
          </div>
          <div class="stat-body">
            <div class="stat-label">Deletions Today</div>
            <div class="stat-value" style="color: var(--danger);">${stats.deletionsToday || 0}</div>
          </div>
        </div> 
      </div>

      <div class="module-panel">
        <h3><svg style="width:18px;height:18px"><use href="#i-chart"/></svg> Activity by Module</h3>
        ${this.renderModuleBars(stats.byModule, total)}
      </div>

      <div class="history-filters">
        <div class="filter-field">
          <label>Search</label>
          <input type="text" id="hSearch" class="input-field" placeholder="Search description or reference..." value="${Utils.esc(this.filters.search)}">
        </div>
        <div class="filter-field">
          <label>Module</label>
          <select id="hModule" class="input-field">
            <option value="">All modules</option>
            ${stats.moduleList.map(m => `<option value="${Utils.esc(m)}" ${this.filters.module===m?'selected':''}>${Utils.esc(m)}</option>`).join('')}
          </select>
        </div>
        <div class="filter-field">
          <label>Action</label>
          <select id="hAction" class="input-field">
            <option value="">All actions</option>
            ${['create','update','delete','login','logout','export'].map(a => `<option value="${a}" ${this.filters.action===a?'selected':''}>${a}</option>`).join('')}
          </select>
        </div>
        <div class="filter-field">
          <label>From</label>
          <input type="date" id="hFrom" class="input-field" value="${this.filters.from}">
        </div>
        <div class="filter-field">
          <label>To</label>
          <input type="date" id="hTo" class="input-field" value="${this.filters.to}">
        </div>
        <div class="filter-field" style="display:flex; gap:6px; align-items:flex-end;">
          <button class="btn-icon-action primary" onclick="History.applyFilters()">
            <svg style="width:16px;height:16px"><use href="#i-filter"/></svg> Apply
          </button>
          <button class="btn-icon-action danger" onclick="History.clearFilters()">
            <svg style="width:16px;height:16px"><use href="#i-x"/></svg>
          </button>
        </div>
      </div>

      <div class="history-table-wrap">
        <div style="padding:14px 16px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; border-bottom:1px solid var(--border);">
          <h3 style="margin:0; font-size:15px; font-weight:700; color:var(--primary-dark); display:flex; align-items:center; gap:8px;">
            <svg style="width:18px;height:18px;color:var(--primary)"><use href="#i-table"/></svg>
            Activity Log <span style="color:var(--text-light); font-weight:500; font-size:13px;">(${entries.length} results)</span>
          </h3>
          <div class="export-btns">
            <button class="btn-icon-action" onclick="History.exportBusinessReport()">
  <svg style="width:16px;height:16px"><use href="#i-file"/></svg> Business Report
</button>
            <button class="btn-icon-action" onclick="History.exportExcel()">
              <svg style="width:16px;height:16px"><use href="#i-table"/></svg> Excel
            </button>
          </div>
        </div>

        ${entries.length === 0 ? `
          <div class="empty-history">
            <svg style="width:56px;height:56px;opacity:0.3;margin-bottom:12px;color:var(--primary)"><use href="#i-inbox"/></svg>
            <p>No activities match your filters.</p>
          </div>
        ` : `
          <div style="overflow-x:auto; -webkit-overflow-scrolling:touch;">
            <table class="history-table">
              <thead>
                <tr>
                  <th>Time</th><th>Module</th><th>Action</th>
                  <th>Description</th><th>Reference</th><th>User</th>
                </tr>
              </thead>
              <tbody>
                ${this.renderPage(entries)}
              </tbody>
            </table>
          </div>
          <div class="pagination">
            <div>Page ${this.page} of ${Math.max(1, Math.ceil(entries.length / this.PAGE_SIZE))}</div>
            <div class="pagination-btns">
              <button onclick="History.goPage(1)" ${this.page===1?'disabled':''}>First</button>
              <button onclick="History.goPage(${this.page-1})" ${this.page===1?'disabled':''}>
                <svg style="width:14px;height:14px"><use href="#i-chevron-left"/></svg>
              </button>
              <button onclick="History.goPage(${this.page+1})" ${this.page>=Math.ceil(entries.length/this.PAGE_SIZE)?'disabled':''}>
                <svg style="width:14px;height:14px"><use href="#i-chevron-right"/></svg>
              </button>
              <button onclick="History.goPage(${Math.ceil(entries.length/this.PAGE_SIZE)})" ${this.page>=Math.ceil(entries.length/this.PAGE_SIZE)?'disabled':''}>Last</button>
            </div>
          </div>
        `}
      </div>
    `;
  },

  friendlyModuleName(module) {
    const names = {
      'trucks': 'Trucks',
      'drivers': 'Drivers',
      'customers': 'Customers',
      'trips': 'Trips',
      'expenses': 'Expenses',
      'income': 'Payments',
      'debts': 'Debt Collection',
      'compliance': 'Compliance',
      'auth': 'Login / Logout',
      'system': 'System',
      'history': 'History'
    };
    return names[module] || module;
  },

  renderModuleBars(byModule, total) {
    if (!Object.keys(byModule).length) {
      return '<p style="color:var(--text-light); font-size:13px; text-align:center; padding:20px;">No data yet.</p>';
    }
    const sorted = Object.entries(byModule).sort((a,b)=>b[1]-a[1]);
    const max = sorted[0][1];
    return sorted.map(([name, count]) => `
      <div class="module-bar-row">
        <div class="module-bar-top">
          <span class="mod-name">${Utils.esc(name)}</span>
          <span class="mod-count">${count}</span>
        </div>
        <div class="module-bar-track">
          <div class="module-bar-fill" style="width:${(count/max*100).toFixed(1)}%"></div>
        </div>
      </div>
    `).join('');
  },

  renderPage(entries) {
    const start = (this.page - 1) * this.PAGE_SIZE;
    const slice = entries.slice(start, start + this.PAGE_SIZE);
    return slice.map(e => `
      <tr>
        <td class="time-cell" data-label="Time">${Utils.fmtDate(e.ts)} ${e.ts.slice(11,16)}</td>
        <td data-label="Module"><span class="module-pill">${Utils.esc(e.module)}</span></td>
        <td data-label="Action"><span class="action-pill ${e.action}">${Utils.esc(e.action)}</span></td>
        <td class="desc-cell" data-label="Description" title="${Utils.esc(e.description)}">${Utils.esc(e.description)}</td>
        <td data-label="Reference">${Utils.esc(e.ref || '—')}</td>
        <td data-label="User">${Utils.esc(e.user)}</td>
      </tr>
    `).join('');
  },

  computeStats() {
    const all = ActivityLog.all();
    const now = Date.now();
    const dayMs = 86400000;
    
    let today = 0, last7 = 0, deletionsToday = 0;
    const byModule = {}, byAction = {}, byUser = {};
    const moduleSet = new Set();

    all.forEach(e => {
      const t = new Date(e.ts).getTime();
      
      if (now - t < dayMs) {
        today++;
        if (e.action === 'delete') deletionsToday++; 
      }
      
      if (now - t < 7 * dayMs) last7++;
      
      byModule[e.module] = (byModule[e.module] || 0) + 1;
      byAction[e.action] = (byAction[e.action] || 0) + 1;
      byUser[e.user] = (byUser[e.user] || 0) + 1;
      moduleSet.add(e.module);
    });

    const top = (obj) => {
      const entries = Object.entries(obj);
      if (!entries.length) return '';
      return entries.sort((a,b)=>b[1]-a[1])[0][0];
    };

    return {
      today, 
      last7, 
      deletionsToday,
      topModule: top(byModule),
      topUser: top(byUser),
      byModule, byAction, byUser,
      moduleList: [...moduleSet].sort()
    };
  },

  getFiltered() {
    const { search, module, action, from, to } = this.filters;
    const q = search.toLowerCase();
    return ActivityLog.all().filter(e => {
      if (module && e.module !== module) return false;
      if (action && e.action !== action) return false;
      if (from && e.ts.slice(0,10) < from) return false;
      if (to && e.ts.slice(0,10) > to) return false;
      if (q) {
        const hay = (e.description + ' ' + e.ref + ' ' + e.user + ' ' + e.module).toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  },

  applyFilters() {
    this.filters = {
      search: document.getElementById('hSearch').value.trim(),
      module: document.getElementById('hModule').value,
      action: document.getElementById('hAction').value,
      from: document.getElementById('hFrom').value,
      to: document.getElementById('hTo').value
    };
    this.page = 1;
    App.refresh();
  },

  clearFilters() {
    this.filters = { search: '', module: '', action: '', from: '', to: '' };
    this.page = 1;
    App.refresh();
  },

  goPage(p) {
    const entries = this.getFiltered();
    const max = Math.max(1, Math.ceil(entries.length / this.PAGE_SIZE));
    this.page = Math.max(1, Math.min(p, max));
    App.refresh();
  },

    exportBusinessReport() {
    const trips = DB.trips();
    const income = DB.income();
    const expenses = DB.expenses();
    const trucks = DB.trucks();
    const drivers = DB.drivers();

    // 1. Calculate KPIs
    const totalRevenue = income.reduce((s, x) => s + Number(x.amount || 0), 0);
    const totalExpenses = expenses.reduce((s, x) => s + Number(x.amount || 0), 0);
    const netProfit = totalRevenue - totalExpenses;
    const totalKm = trips.reduce((s, x) => s + Number(x.distance || 0), 0);
    
    const fuelExpenses = expenses.filter(e => e.category === 'Fuel (Diesel/Petrol)' || e.category === 'Fuel');
    const totalFuelCost = fuelExpenses.reduce((s, x) => s + Number(x.amount || 0), 0);
    const totalFuelLiters = fuelExpenses.reduce((s, x) => {
      const liters = Number(x.liters || 0);
      return s + (liters > 0 ? liters : (Number(x.amount || 0) / 3430));
    }, 0);

    const avgKmL = totalFuelLiters > 0 ? (totalKm / totalFuelLiters).toFixed(2) : '0.00';
    const costPer100km = totalKm > 0 ? Math.round((totalExpenses / totalKm) * 100) : 0;

    // 2. Initialize PDF
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();

    // 3. Header
    doc.setFillColor(30, 58, 138);
    doc.rect(0, 0, pageWidth, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('MALIBORA LOGISTICS', 14, 18);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Business Performance Report', 14, 26);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString('en-GB')}`, 14, 34);
    doc.text(`Period: All Time`, pageWidth - 14, 34, { align: 'right' });

    let yPos = 50;

    // 4. Executive Summary (KPIs)
    doc.setTextColor(30, 58, 138);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Executive Summary', 14, yPos);
    yPos += 8;

    const kpiData = [
      ['Total Revenue', Utils.fmtTZS(totalRevenue)],
      ['Trip Running Costs', Utils.fmtTZS(totalExpenses)],
      ['Net Profit', Utils.fmtTZS(netProfit)],
      ['Total Distance', `${Utils.fmtNum(totalKm)} Km`],
      ['Average KM/L', `${avgKmL} L`],
      ['Cost per 100 Km', Utils.fmtTZS(costPer100km)],
      ['Active Trucks', trucks.length.toString()],
      ['Total Trips', trips.length.toString()]
    ];

    doc.autoTable({
      startY: yPos,
      head: [['Metric', 'Value']],
      body: kpiData,
      theme: 'grid',
      headStyles: { fillColor: [30, 58, 138], textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 10, cellPadding: 3 },
      columnStyles: {
        0: { fontStyle: 'bold', width: 70 },
        1: { halign: 'right', fontStyle: 'bold' }
      }
    });
    yPos = doc.lastAutoTable.finalY + 15;

    // 5. Driver Accountability Table
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }

    doc.setTextColor(30, 58, 138);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Driver Accountability', 14, yPos);
    yPos += 8;

    const driverTableData = drivers.map(d => {
      const truck = trucks.find(t => t.id === d.truckId);
      const dTrips = trips.filter(t => t.driverId === d.id);
      const dKm = dTrips.reduce((s, x) => s + Number(x.distance || 0), 0);
      const dRev = income.filter(x => x.driverId === d.id).reduce((s, x) => s + Number(x.amount || 0), 0);
      const dFuel = expenses.filter(e => e.driverId === d.id && (e.category === 'Fuel (Diesel/Petrol)' || e.category === 'Fuel'))
                            .reduce((s, x) => {
                              const liters = Number(x.liters || 0);
                              return s + (liters > 0 ? liters : (Number(x.amount || 0) / 3430));
                            }, 0);
      const dEco = dFuel > 0 ? (dKm / dFuel).toFixed(1) : '0.0';

      return [
        Utils.esc(d.name),
        truck ? Utils.esc(truck.plateNumber) : 'Unassigned',
        dTrips.length.toString(),
        Utils.fmtNum(dKm),
        Utils.fmtTZS(dRev),
        dFuel.toFixed(1) + ' L',
        dEco
      ];
    });

    doc.autoTable({
      startY: yPos,
      head: [['Driver', 'Truck', 'Trips', 'Total Km', 'Revenue', 'Fuel Used', 'KM/L']],
      body: driverTableData,
      theme: 'striped',
      headStyles: { fillColor: [30, 58, 138], textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: {
        4: { halign: 'right' },
        5: { halign: 'right' },
        6: { halign: 'right' }
      }
    });

    // 6. Footer on all pages
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.setFont('helvetica', 'normal');
      doc.text('MALIBORA International Logistics Truck Management System', 14, doc.internal.pageSize.getHeight() - 10);
      doc.text(`Page ${i} of ${totalPages}`, pageWidth - 14, doc.internal.pageSize.getHeight() - 10, { align: 'right' });
    }

    // 7. Save and Log
    doc.save(`malibora-business-report-${Utils.today()}.pdf`);
    
    if (typeof logActivity === 'function') {
      logActivity({
        module: 'history',
        action: 'export',
        description: 'Exported Business Performance Report as PDF',
        ref: 'Business Report',
        user: 'admin'
      });
    }
    
    App.refresh();
  },
