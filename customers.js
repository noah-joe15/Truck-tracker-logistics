const Customers = {
  render() {
    const list = DB.customers();
    return `
      <h1 class="section-title">${Icons.users} Manage Customers</h1>
      <div class="form-section">
        <div class="form-row">
          <div><label>Customer Name</label><input type="text" id="custName"></div>
          <div><label>Phone</label><input type="text" id="custPhone"></div>
          <div><label>Location</label><input type="text" id="custLocation"></div>
        </div>
        <button class="btn-primary" onclick="Customers.add()">${Icons.plus} Add Customer</button>
      </div>
      <div class="form-section">
        <table class="data-table">
          <thead><tr><th>Name</th><th>Phone</th><th>Location</th><th>Action</th></tr></thead>
          <tbody>${list.length ? list.map(c => `
            <tr><td>${Utils.esc(c.name)}</td><td>${Utils.esc(c.phone || '---')}</td>
            <td>${Utils.esc(c.location || '---')}</td>
            <td><button class="btn-danger" onclick="Customers.remove('${c.id}')">${Icons.trash} Delete</button></td></tr>
          `).join('') : '<tr><td colspan="4" style="text-align:center;color:#64748b;">No customers</td></tr>'}</tbody>
        </table>
      </div>
    `;
  },
  add() {
    const c = {
      name: document.getElementById('custName').value.trim(),
      phone: document.getElementById('custPhone').value,
      location: document.getElementById('custLocation').value
    };
    if (!c.name) return alert('Name required');
    DB.push('customers', c);
    App.refresh();
  },
  remove(id) { if (confirm('Delete?')) { DB.remove('customers', id); App.refresh(); } }
};
