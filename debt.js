const Debt = {
  render() {
    const customers = DB.customers();
    const debts = DB.debts();
    const outstanding = debts.filter(d => !d.paid).reduce((s, x) => s + Number(x.amount || 0), 0);

    return `
      <div class="section-title">
        <h2>${Icons.dollar} Collect Debt Payment</h2>
      </div>

      <div class="form-section">
        <h2>Receive Payment</h2>
        
        <div class="kpi-card cost" style="margin-bottom: 20px;">
          <div class="kpi-icon-wrapper cost"><i class="fas fa-hand-holding-usd"></i></div>
          <div class="kpi-label">Outstanding Debt</div>
          <div class="kpi-value">${Utils.fmtTZS(outstanding)}</div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>Date</label>
            <input type="date" id="debtDate" class="input-field" value="${Utils.today()}">
          </div>
          <div class="form-group">
            <label>Customer</label>
            <select id="debtCustomer" class="input-field">
              ${Utils.optionsHTML(customers, 'name', 'id', 'Select Customer...')}
            </select>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>Amount (TZS)</label>
            <input type="number" id="debtAmount" class="input-field" placeholder="0.00" min="0">
          </div>
          <div class="form-group">
            <label>Payment Option</label>
            <select id="debtOption" class="input-field">
              <option>Full Payment</option>
              <option>Partial / Half</option>
            </select>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>Payment Method</label>
            <select id="debtMethod" class="input-field">
              <option>Cash</option>
              <option>Bank</option>
              <option>Mobile</option>
            </select>
          </div>
          <div class="form-group">
            <label>Bank (if applicable)</label>
            <select id="debtBank" class="input-field">
              <option value="">Select Bank...</option>
              ${Utils.banks.map(b => `<option>${b}</option>`).join('')}
            </select>
          </div>
        </div>

        <div class="form-group">
          <label>Description</label>
          <input type="text" id="debtDesc" class="input-field" placeholder="e.g., Payment for invoice #123">
        </div>

        <button class="btn-primary" onclick="Debt.save()">
          <i class="fas fa-save"></i> Save Payment
        </button>
      </div>

      <div class="form-section">
        <h2>${Icons.clock} Debt History</h2>
        <div class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Customer</th>
                <th>Amount</th>
                <th>Method</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>${this.rows(debts, customers)}</tbody>
          </table>
        </div>
      </div>
    `;
  },

  rows(debts, customers) {
    if (!debts.length) {
      return '<tr><td colspan="6" style="text-align:center; color:#64748b; padding: 30px;">No debt records yet.</td></tr>';
    }
    return debts.map(d => {
      const c = customers.find(x => x.id === d.customerId);
      return `<tr>
        <td data-label="Date">${Utils.fmtDate(d.date)}</td>
        <td data-label="Customer">${c ? Utils.esc(c.name) : '---'}</td>
        <td data-label="Amount">${Utils.fmtTZS(d.amount)}</td>
        <td data-label="Method">${Utils.esc(d.method)}</td>
        <td data-label="Status">${Utils.statusBadge(d.paid ? 'Completed' : 'Pending')}</td>
        <td data-label="Action">${!d.paid ? `<button class="btn-success" onclick="Debt.markPaid('${d.id}')">Mark Paid</button>` : '---'}</td>
      </tr>`;
    }).join('');
  },

  save() {
    const d = {
      date: document.getElementById('debtDate').value,
      customerId: document.getElementById('debtCustomer').value,
      amount: document.getElementById('debtAmount').value,
      option: document.getElementById('debtOption').value,
      method: document.getElementById('debtMethod').value,
      bank: document.getElementById('debtBank').value,
      description: document.getElementById('debtDesc').value,
      paid: true
    };
    
    if (!d.customerId || !d.amount) {
      return alert('Customer and amount are required.');
    }
    
    DB.push('debts', d);
    
    if (typeof logActivity === 'function') {
      logActivity({ module: 'debts', action: 'create', description: `Debt payment ${Utils.fmtTZS(d.amount)}`, ref: d.customerId, user: 'admin' });
    }
    
    DB.push('income', {
      date: d.date,
      customerId: d.customerId,
      amount: d.amount,
      method: d.method,
      description: 'Debt Payment: ' + (d.description || ''),
      type: 'Debt Payment'
    });
    
    App.refresh();
  },

  markPaid(id) {
    DB.update('debts', id, { paid: true });
    if (typeof logActivity === 'function') {
      logActivity({ module: 'debts', action: 'update', description: `Marked debt ${id} as paid`, ref: id, user: 'admin' });
    }
    App.refresh();
  }
};
