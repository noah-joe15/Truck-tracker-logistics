const Debt = {
  render() {
    const customers = DB.customers();
    const debts = DB.debts();
    const outstanding = debts.filter(d => !d.paid).reduce((s, x) => s + Number(x.amount || 0), 0);

    return `
      <h1 class="section-title">${Icons.dollar} Collect Debt Payment</h1>
      <div class="form-section">
        <p style="color:#94a3b8;">Outstanding Debt: <b style="color:#f59e0b;">${Utils.fmtTZS(outstanding)}</b></p>
        <div class="form-row">
          <div><label>Date</label><input type="date" id="debtDate" value="${Utils.today()}"></div>
          <div><label>Customer</label>
            <select id="debtCustomer">${Utils.optionsHTML(customers, 'name', 'id')}</select>
          </div>
          <div><label>Amount (TZS)</label><input type="number" id="debtAmount"></div>
          <div><label>Payment Option</label>
            <select id="debtOption"><option>Full Payment</option><option>Partial / Half</option></select>
          </div>
        </div>
        <div class="form-row">
          <div><label>Method</label>
            <select id="debtMethod"><option>Cash</option><option>Bank</option><option>Mobile</option></select>
          </div>
          <div><label>Bank (if applicable)</label>
            <select id="debtBank">${Utils.banks.map(b => `<option>${b}</option>`).join('')}</select>
          </div>
          <div><label>Description</label><input type="text" id="debtDesc"></div>
        </div>
        <button class="btn-primary" onclick="Debt.save()">SAVE PAYMENT</button>
      </div>

      <div class="form-section">
        <h2>${Icons.clock} Debt History</h2>
        <table class="data-table">
          <thead><tr><th>Date</th><th>Customer</th><th>Amount</th><th>Method</th><th>Status</th><th>Action</th></tr></thead>
          <tbody>${this.rows(debts, customers)}</tbody>
        </table>
      </div>
    `;
  },

  rows(debts, customers) {
    if (!debts.length) return '<tr><td colspan="6" style="text-align:center;color:#64748b;">No debt records</td></tr>';
    return debts.map(d => {
      const c = customers.find(x => x.id === d.customerId);
      return `<tr>
        <td>${Utils.fmtDate(d.date)}</td>
        <td>${c ? Utils.esc(c.name) : '---'}</td>
        <td>${Utils.fmtTZS(d.amount)}</td>
        <td>${Utils.esc(d.method)}</td>
        <td>${Utils.statusBadge(d.paid ? 'Completed' : 'Pending')}</td>
        <td>${!d.paid ? `<button class="btn-success" onclick="Debt.markPaid('${d.id}')">Mark Paid</button>` : '---'}</td>
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
    if (!d.customerId || !d.amount) return alert('Customer and amount required');
    DB.push('debts', d);
    DB.push('income', { ...d, type: 'Debt Payment' });
    App.refresh();
  },

  markPaid(id) { DB.update('debts', id, { paid: true }); App.refresh(); }
};
