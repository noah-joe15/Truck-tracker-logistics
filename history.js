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

    return `
      <style>
        .history-table-container {
          max-height: 600px;
          overflow-y: auto;
          border: 1px solid var(--border);
          border-radius: 8px;
        }
        
        .history-table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0;
        }
        
        .history-table thead th {
          position: sticky;
          top: 0;
          background: #1e3a8a;
          color: white;
          z-index: 10;
          padding: 12px 16px;
          text-align: left;
          font-weight: 600;
          font-size: 13px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .history-table tbody tr {
          border-bottom: 1px solid #f1f5f9;
        }
        
        .history-table tbody tr:hover {
          background: #f8fafc;
        }
        
        .history-table td {
          padding: 12px 16px;
          font-size: 13px;
          color: #0f172a;
        }
        
        .module-pill {
          display: inline-block;
          padding: 4px 10px;
          border-radius: 6px;
          background: #f1f5f9;
          font-size: 12px;
          font-weight: 500;
          color: #64748b;
        }
        
        .action-pill {
          display: inline-block;
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
        }
        
        .action-pill.create { background: #f0fdf4; color: #16a34a; }
        .action-pill.update { background: #eff6ff; color: #1e40af; }
        .action-pill.delete { background: #fef2f2; color: #dc2626; }
        .action-pill.login { background: #f5f3ff; color: #7c3aed; }
        .action-pill.export { background: #fffbeb; color: #d97706; }
        
        .time-cell {
          font-family: 'Courier New', monospace;
          font-size: 12px;
          color: #64748b;
        }
        
        /* Custom scrollbar for webkit browsers */
        .history-table-container::-webkit-scrollbar {
          width: 8px;
        }
        
        .history-table-container::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 4px;
        }
        
        .history-table-container::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 4px;
        }
        
        .history-table-container::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      </style>
      
      <div class="section-title">
        <h2><svg style="width:24px;height:24px"><use href="#i-clock"/></svg> System Activity History</h2>
      </div>

      <!-- Export Buttons -->
      <div class="form-section" style="padding: 16px; margin-bottom: 20px;">
        <h3 style="margin: 0 0 12px 0; font-size: 14px; color: var(--text);">
          <svg style="width:16px;height:16px; vertical-align: middle; margin-right: 6px;"><use href="#i-download"/></svg>
          Download Reports
        </h3>
        <div style="display: flex; gap: 12px; flex-wrap: wrap;">
          <button class="btn-primary" onclick="History.exportBusinessReport()" style="flex: 1; min-width: 200px;">
            <svg style="width:16px;height:16px; margin-right: 8px;"><use href="#i-file"/></svg>
            Business Performance Report (PDF)
          </button>
          <button class="btn-icon-action" onclick="History.exportExcel()" style="flex: 1; min-width: 200px;">
            <svg style="width:16px;height:16px; margin-right: 8px;"><use href="#i-table"/></svg>
            Activity Log (Excel)
          </button>
        </div>
      </div>

      <!-- Filters -->
      <div class="history-filters">
        <div class="filter-field">
          <label>Search</label>
          <input type="text" id="hSearch" class="input-field" placeholder="Search description or reference..." value="${Utils.esc(this.filters.search)}">
        </div>
        <div class="filter-field">
          <label>Module</label>
          <select id="hModule" class="input-field">
            <option value="">All modules</option>
            ${this.getModuleList().map(m => `<option value="${Utils.esc(m)}" ${this.filters.module===m?'selected':''}>${Utils.esc(m)}</option>`).join('')}
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

      <!-- Activity Log Table with Independent Scroll -->
      <div class="history-table-wrap">
        <div style="padding:14px 16px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; border-bottom:1px solid var(--border); background: white;">
          <h3 style="margin:0; font-size:15px; font-weight:700; color:var(--primary-dark); display:flex; align-items:center; gap:8px;">
            <svg style="width:18px;height:18px;color:var(--primary)"><use href="#i-table"/></svg>
            Activity Log <span style="color:var(--text-light); font-weight:500; font-size:13px;">(${entries.length} of ${total} entries)</span>
          </h3>
        </div>

        ${entries.length === 0 ? `
          <div class="empty-history">
            <svg style="width:56px;height:56px;opacity:0.3;margin-bottom:12px;color:var(--primary)"><use href="#i-inbox"/></svg>
            <p>No activities match your filters.</p>
          </div>
        ` : `
          <div class="history-table-container">
            <table class="history-table">
              <thead>
                <tr>
                  <th style="min-width: 150px;">Time</th>
                  <th style="min-width: 120px;">Module</th>
                  <th style="min-width: 100px;">Action</th>
                  <th>Description</th>
                  <th style="min-width: 150px;">Reference</th>
                  <th style="min-width: 100px;">User</th>
                </tr>
              </thead>
              <tbody>
                ${this.renderPage(entries)}
              </tbody>
            </table>
          </div>
          <div class="pagination" style="margin-top: 16px;">
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

  getModuleList() {
    const modules = new Set(ActivityLog.all().map(e => e.module));
    return [...modules].sort();
  },

  renderPage(entries) {
    const start = (this.page - 1) * this.PAGE_SIZE;
    const slice = entries.slice(start, start + this.PAGE_SIZE);
    return slice.map(e => `
      <tr>
        <td class="time-cell" data-label="Time">${Utils.fmtDate(e.ts)} ${e.ts.slice(11,16)}</td>
        <td data-label="Module"><span class="module-pill">${this.friendlyModuleName(e.module)}</span></td>
        <td data-label="Action"><span class="action-pill ${e.action}">${Utils.esc(e.action)}</span></td>
        <td class="desc-cell" data-label="Description" title="${Utils.esc(e.description)}">${Utils.esc(e.description)}</td>
        <td data-label="Reference">${Utils.esc(e.ref || '—')}</td>
        <td data-label="User">${Utils.esc(e.user)}</td>
      </tr>
    `).join('');
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
    // Scroll to top of table when changing pages
    const tableContainer = document.querySelector('.history-table-container');
    if (tableContainer) {
      tableContainer.scrollTop = 0;
    }
    App.refresh();
  },

  exportBusinessReport() {
    const trips = DB.trips();
    const income = DB.income();
    const expenses = DB.expenses();
    const trucks = DB.trucks();
    const drivers = DB.drivers();

    const totalRevenue = income.reduce((s, x) => s + Number(x.amount || 0), 0);
    const totalExpenses = expenses.reduce((s, x) => s + Number(x.amount || 0), 0);
    const netProfit = totalRevenue - totalExpenses;
    const totalKm = trips.reduce((s, x) => s + Number(x.distance || 0), 0);
    
    const fuelExpenses = expenses.filter(e => e.category === 'Fuel (Diesel/Petrol)' || e.category === 'Fuel');
    const totalFuelLiters = fuelExpenses.reduce((s, x) => {
      const liters = Number(x.liters || 0);
      return s + (liters > 0 ? liters : (Number(x.amount || 0) / 3430));
    }, 0);

    const avgKmL = totalFuelLiters > 0 ? (totalKm / totalFuelLiters).toFixed(2) : '0.00';
    const costPer100km = totalKm > 0 ? Math.round((totalExpenses / totalKm) * 100) : 0;

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();

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

    let yPos = 50;

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
      styles: { fontSize: 10, cellPadding: 3 }
    });
    yPos = doc.lastAutoTable.finalY + 15;

    if (yPos > 250) { doc.addPage(); yPos = 20; }

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

      return [Utils.esc(d.name), truck ? Utils.esc(truck.plateNumber) : 'Unassigned', dTrips.length.toString(), Utils.fmtNum(dKm), Utils.fmtTZS(dRev), dFuel.toFixed(1) + ' L', dEco];
    });

    doc.autoTable({
      startY: yPos,
      head: [['Driver', 'Truck', 'Trips', 'Total Km', 'Revenue', 'Fuel Used', 'KM/L']],
      body: driverTableData,
      theme: 'striped',
      headStyles: { fillColor: [30, 58, 138], textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 3 }
    });

    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text('MALIBORA ILTM System', 14, doc.internal.pageSize.getHeight() - 10);
      doc.text(`Page ${i} of ${totalPages}`, pageWidth - 14, doc.internal.pageSize.getHeight() - 10, { align: 'right' });
    }

    doc.save(`malibora-business-report-${Utils.today()}.pdf`);
    
    if (typeof logActivity === 'function') {
      logActivity({ module: 'history', action: 'export', description: 'Exported Business Performance Report', ref: 'PDF', user: 'admin' });
    }
    App.refresh();
  },

  exportExcel() {
    const entries = this.getFiltered();
    if (!entries.length) return alert('No data to export.');

    const wb = XLSX.utils.book_new();
    const wsData = [['Time', 'Module', 'Action', 'Description', 'Reference', 'User']].concat(entries.map(e => [e.ts, e.module, e.action, e.description, e.ref, e.user]));
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, ws, 'Activity Log');
    XLSX.writeFile(wb, `malibora-activity-${Utils.today()}.xlsx`);
    
    if (typeof logActivity === 'function') {
      logActivity({ module: 'history', action: 'export', description: 'Exported Activity Log as Excel', ref: `${entries.length} rows`, user: 'admin' });
    }
    App.refresh();
  }
};
