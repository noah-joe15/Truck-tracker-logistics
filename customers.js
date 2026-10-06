const Customers = {
  render() {
    const list = DB.customers();
    return `
      <div class="section-title"><h2>${Icons.users} Manage Customers</h2></div>
      <div class="form-section">
        <h2>${Icons.plus} Add Customer</h2>
        <div class="form-row">
          <div class="form-group">
            <label>Customer / Company Name</label>
            <input type="text" id="custName" class="input-field" placeholder="Customer full name or company">
          </div>
          <div class="form-group">
            <label>Phone Number</label>
            <input type="text" id="custPhone" class="input-field" placeholder="+255...">
          </div>
          <div class="form-group">
            <label>Location / Address</label>
            <input type="text" id="custLocation" class="input-field" placeholder="City / Region">
          </div>
        </div>
        <button class="btn-primary" onclick="Customers.add()"><i class="fas fa-user-plus"></i> Add Customer</button>
      </div>

      <div class="form-section">
        <h2>${Icons.clipboard} Customer List</h2>
        <div class="table-wrapper">
          <table class="data-table">
            <thead><tr><th>Name</th><th>Phone</th><th>Location</th><th>Action</th></tr></thead>
            <tbody>
              ${list.length ? list.map(c => `
                <tr>
                  <td data-label="Name">${Utils.esc(c.name)}</td>
                  <td data-label="Phone">${Utils.esc(c.phone || '---')}</td>
                  <td data-label="Location">${Utils.esc(c.location || '---')}</td>
                  <td data-label="Action"><button class="btn-danger" onclick="Customers.remove('${c.id}')"><i class="fas fa-trash"></i> Delete</button></td>
                </tr>
              `).join('') : '<tr><td colspan="4" style="text-align:center; color:#64748b; padding: 30px;">No customers added yet.</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  add() {
    const c = {
      name: document.getElementById('custName').value.trim(),
      phone: document.getElementById('custPhone').value,
      location: document.getElementById('custLocation').value
    };
    if (!c.name) return alert('Customer name is required.');
    DB.push('customers', c);
    App.refresh();
  },

  remove(id) {
    if (confirm('Delete this customer?')) { DB.remove('customers', id); App.refresh(); }
  }
};
