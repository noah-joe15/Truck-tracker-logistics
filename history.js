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
        <h2><svg><use href="#i-clock"/></svg> Activity History</h2>
      </div>

      <div class="history-summary">
        <div class="summary-stat">
          <div class="stat-icon"><svg><use href="#i-chart"/></svg></div>
          <div class="stat-body">
            <div class="stat-label">Total Activities</div>
            <div class="stat-value">${total.toLocaleString()}</div>
          </div>
        </div>
        <div class="summary-stat">
          <div class="stat-icon"><svg><use href="#i-clock"/></svg></div>
          <div class="stat-body">
            <div class="stat-label">Today</div>
            <div class="stat-value">${stats.today}</div>
          </div>
        </div>
        <div class="summary-stat">
          <div class="stat-icon"><svg><use href="#i-clock"/></svg></div>
          <div class="stat-body">
            <div class="stat-label">Last 7 Days</div>
            <div class="stat-value">${stats.last7}</div>
          </div>
        </div>
        <div class="summary-stat">
          <div class="stat-icon"><svg><use href="#i-file"/></svg></div>
          <div class="stat-body">
            <div class="stat-label">Top Module</div>
            <div class="stat-value">${stats.topModule || '—'}</div>
          </div>
        </div>
        <div class="summary-stat">
          <div class="stat-icon"><svg><use href="#i-user"/></svg></div>
          <div class="stat-body">
            <div class="stat-label">Top User</div>
            <div class="stat-value">${stats.topUser || '—'}</div>
          </div>
        </div>
      </div>

      <div class="module-panel">
        <h3><svg><use href="#i-chart"/></svg> Activity by Module</h3>
        ${this.renderModuleBars(stats.byModule, total)}
      </div>

      <div class="history-filters">
        <div class="filter-field">
          <label>Search</label>
          <input type="text" id="hSearch" placeholder="Search description or reference..."
                 value="${Utils.esc(this.filters.search)}">
        </div>
        <div class="filter-field">
          <label>Module</label>
          <select id="hModule">
            <option value="">All modules</option>
            ${stats.moduleList.map(m => `<option value="${Utils.esc(m)}" ${this.filters.module===m?'selected':''}>${Utils.esc(m)}</option>`).join('')}
          </select>
        </div>
        <div class="filter-field">
          <label>Action</label>
          <select id="hAction">
            <option value="">All actions</option>
            ${['create','update','delete','login','logout','export'].map(a =>
              `<option value="${a}" ${this.filters.action===a?'selected':''}>${a}</option>`).join('')}
          </select>
        </div>
        <div class="filter-field">
          <label>From</label>
          <input type="date" id="hFrom" value="${this.filters.from}">
        </div>
        <div class="filter-field">
          <label>To</label>
          <input type="date" id="hTo" value="${this.filters.to}">
        </div>
        <div class="filter-field" style="display:flex; gap:6px; align-items:flex-end;">
          <button class="btn-icon-action primary" onclick="History.applyFilters()">
            <svg><use href="#i-filter"/></svg> Apply
          </button>
          <button class="btn-icon-action danger" onclick="History.clearFilters()">
            <svg><use href="#i-x"/></svg>
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
            <button class="btn-icon-action" onclick="History.exportPDF()">
              <svg><use href="#i-file"/></svg> PDF
            </button>
            <button class="btn-icon-action" onclick="History.exportExcel()">
              <svg><use href="#i-table"/></svg> Excel
            </button>
          </div>
        </div>

        ${entries.length === 0 ? `
          <div class="empty-history">
            <svg><use href="#i-inbox"/></svg>
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
    let today = 0, last7 = 0;
    const byModule = {}, byAction = {}, byUser = {};
    const moduleSet = new Set();

    all.forEach(e => {
      const t = new Date(e.ts).getTime();
      if (now - t < dayMs) today++;
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
      today, last7,
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

  // ===================== PDF EXPORT =====================
  exportPDF() {
    const entries = this.getFiltered();
    if (!entries.length) return alert('No data to export.');

    logActivity({
      module: 'history', action: 'export',
      description: 'Exported activity log as PDF',
      ref: `${entries.length} rows`, user: 'admin'
    });

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const stats = this.computeStats();

    doc.setFontSize(18); doc.setTextColor(30, 58, 138);
    doc.text('MALIBORA — Activity Log', 14, 16);
    doc.setFontSize(10); doc.setTextColor(100);
    doc.text(`Generated: ${new Date().toLocaleString('en-GB')}`, 14, 22);
    doc.text(`Period: ${this.filters.from || 'start'} to ${this.filters.to || 'now'}  |  Total: ${entries.length}`, 14, 27);

    doc.autoTable({
      startY: 32,
      head: [['Time', 'Module', 'Action', 'Description', 'Reference', 'User']],
      body: entries.map(e => [
        e.ts.replace('T',' ').slice(0,16),
        e.module, e.action, e.description, e.ref, e.user
      ]),
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [30, 58, 138] },
      alternateRowStyles: { fillColor: [241, 245, 249] }
    });

    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8); doc.setTextColor(120);
      doc.text(`Page ${i} of ${totalPages}`, doc.internal.pageSize.getWidth() - 30, doc.internal.pageSize.getHeight() - 8);
    }

    doc.save(`malibora-activity-${Utils.today()}.pdf`);
    App.refresh();
  },

  // ===================== EXCEL EXPORT =====================
  exportExcel() {
    const entries = this.getFiltered();
    if (!entries.length) return alert('No data to export.');

    logActivity({
      module: 'history', action: 'export',
      description: 'Exported activity log as Excel',
      ref: `${entries.length} rows`, user: 'admin'
    });

    const stats = this.computeStats();
    const wb = XLSX.utils.book_new();

    // Summary sheet
    const summaryData = [
      ['MALIBORA — Activity Log Summary'],
      ['Generated', new Date().toLocaleString('en-GB')],
      ['Total Activities', ActivityLog.all().length],
      ['Filtered Rows', entries.length],
      ['Today', stats.today],
      ['Last 7 Days', stats.last7],
      ['Top Module', stats.topModule || '—'],
      ['Top User', stats.topUser || '—'],
      [],
      ['By Module'],
      ...Object.entries(stats.byModule).sort((a,b)=>b[1]-a[1]),
      [],
      ['By Action'],
      ...Object.entries(stats.byAction).sort((a,b)=>b[1]-a[1])
    ];
    const ws1 = XLSX.utils.aoa_to_sheet(summaryData);
    ws1['!cols'] = [{ wch: 20 }, { wch: 30 }];
    XLSX.utils.book_append_sheet(wb, ws1, 'Summary');

    // Activity Log sheet
    const logData = [['Time','Module','Action','Description','Reference','User']]
      .concat(entries.map(e => [e.ts, e.module, e.action, e.description, e.ref, e.user]));
    const ws2 = XLSX.utils.aoa_to_sheet(logData);
    ws2['!cols'] = [{ wch: 22 }, { wch: 14 }, { wch: 10 }, { wch: 40 }, { wch: 20 }, { wch: 12 }];
    XLSX.utils.book_append_sheet(wb, ws2, 'Activity Log');

    XLSX.writeFile(wb, `malibora-activity-${Utils.today()}.xlsx`);
    App.refresh();
  }
};
