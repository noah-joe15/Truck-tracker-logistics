const Expenses = {
  // State to hold items before saving
  pendingExpenses: [],

  categories: [
    'Fuel (Diesel/Petrol)', 'Maintenance & Servicing', 'Spare Parts',
    'Tolls & Weighbridge', 'Parking Fees', 'Driver Allowance / Per Diem',
    'Loading / Offloading', 'LATRA / Regulatory Fees', 'Insurance Renewal',
    'Fines / Penalties', 'Other'
  ],
  mobileProviders: ['M-Pesa (Vodacom)', 'Tigo Pesa', 'Airtel Money', 'HaloPesa (TTCL)'],
  banks: [
    'CRDB Bank', 'NMB Bank', 'NBC Bank', 'Stanbic Bank', 'Absa Bank',
    'Exim Bank', 'DTB', 'Azania Bank', 'KCB Bank', 'Equity Bank',
    'TCB (Postal)', 'PBZ'
  ],

  render() {
    const trucks = DB.trucks();
    const drivers = DB.drivers();
    const expenses = DB.expenses().sort((a, b) => new Date(b.date) - new Date(a.date));
    const totalExp = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
    
    // Calculate total of current pending batch
    const pendingTotal = this.pendingExpenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);

    return `
      <div class="section-title">
        <h2><i class="fas fa-wallet"></i> Expense Management</h2>
      </div>
      
      <!-- 1. TRIP DETAILS (Applies to all items in this batch) -->
      <div class="form-section">
        <h2><i class="fas fa-truck"></i> 1. Trip Details</h2>
        <div class="form-row">
          <div class="form-group">
            <label>Date</label>
            <input type="date" id="expDate" class="input-field" value="${Utils.today()}">
          </div>
          <div class="form-group">
            <label>Select Truck</label>
            <select id="expTruck" class="input-field" onchange="Expenses.autoFillDriver()">
              <option value="">-- Choose Truck --</option>
              ${trucks.map(t => `<option value="${t.id}" data-driver="${t.driverId || ''}">${t.plateNumber} (${t.brand || 'Truck'})</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label>Assigned Driver</label>
            <input type="text" id="expDriver" class="input-field" readonly placeholder="Select a truck first" style="background-color: #f1f5f9; color: #64748b;">
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>Payment Method</label>
            <select id="expMethod" class="input-field" onchange="Expenses.togglePaymentDetails()">
              <option value="">-- Select Method --</option>
              <option value="Cash">Cash</option>
              <option value="Mobile">Mobile Money</option>
              <option value="Bank">Bank Transfer</option>
            </select>
          </div>
          
          <div class="form-group" id="mobileProviderGroup" style="display: none;">
            <label>Mobile Provider</label>
            <select id="expMobileProvider" class="input-field">
              <option value="">-- Select Provider --</option>
              ${this.mobileProviders.map(m => `<option value="${m}">${m}</option>`).join('')}
            </select>
          </div>

          <div class="form-group" id="bankGroup" style="display: none;">
            <label>Bank Name</label>
            <select id="expBank" class="input-field">
              <option value="">-- Select Bank --</option>
              ${this.banks.map(b => `<option value="${b}">${b}</option>`).join('')}
            </select>
          </div>
        </div>
      </div>

      <!-- 2. ADD ITEMS (The Batch List) -->
      <div class="form-section">
        <h2><i class="fas fa-plus-circle"></i> 2. Add Expense Items</h2>
        <div class="form-row">
          <div class="form-group" style="flex: 2;">
            <label>Expense Category</label>
            <select id="expCategory" class="input-field">
              <option value="">-- Choose Category --</option>
              ${this.categories.map(c => `<option value="${c}">${c}</option>`).join('')}
            </select>
          </div>
          <div class="form-group" style="flex: 1;">
            <label>Amount (TZS)</label>
            <input type="number" id="expAmount" class="input-field" placeholder="0.00" min="0">
          </div>
          <div class="form-group" style="flex: 2;">
            <label>Description / Notes (Optional)</label>
            <input type="text" id="expDesc" class="input-field" placeholder="e.g., Oil change, Weighbridge fee">
          </div>
        </div>
        <button class="btn-primary" onclick="Expenses.addItem()" style="margin-top: 10px; width: 100%;">
          <i class="fas fa-plus"></i> Add Item to List
        </button>
      </div>

      <!-- 3. PENDING LIST & SAVE -->
      <div class="form-section" style="${this.pendingExpenses.length === 0 ? 'display:none;' : ''}">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <h2 style="margin: 0; color: var(--primary);"><i class="fas fa-list"></i> Pending Items (${this.pendingExpenses.length})</h2>
          <span class="badge badge-danger" style="font-size: 16px; padding: 8px 12px;">Batch Total: ${Utils.fmtTZS(pendingTotal)}</span>
        </div>
        
        <div class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>Category</th>
                <th>Amount</th>
                <th>Description</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              ${this.pendingExpenses.map((item, index) => `
                <tr>
                  <td data-label="Category"><span class="badge badge-info">${Utils.esc(item.category)}</span></td>
                  <td data-label="Amount"><strong>${Utils.fmtTZS(item.amount)}</strong></td>
                  <td data-label="Description">${Utils.esc(item.description || '---')}</td>
                  <td data-label="Action">
                    <button class="btn-danger" onclick="Expenses.removePendingItem(${index})">
                      <i class="fas fa-times"></i> Remove
                    </button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        
        <button class="btn-primary" onclick="Expenses.saveBatch()" style="margin-top: 20px; width: 100%; background: linear-gradient(135deg, #16a34a, #15803d);">
          <i class="fas fa-save"></i> Save All Expenses (${this.pendingExpenses.length} Items)
        </button>
      </div>

      <!-- 4. HISTORY -->
      <div class="form-section">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <h2 style="margin: 0;"><i class="fas fa-history"></i> Recent Expenses</h2>
          <span class="badge badge-danger">Total Spent: ${Utils.fmtTZS(totalExp)}</span>
        </div>
        <div class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Truck</th>
                <th>Driver</th>
                <th>Category</th>
                <th>Amount</th>
                <th>Payment</th>
                <th>Description</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              ${expenses.length ? expenses.map(e => {
                const truck = trucks.find(t => t.id === e.truckId);
                const driver = drivers.find(d => d.id === e.driverId);
                let paymentDetail = e.method || '---';
                if (e.method === 'Mobile' && e.mobileProvider) paymentDetail += ` (${e.mobileProvider})`;
                if (e.method === 'Bank' && e.bank) paymentDetail += ` (${e.bank})`;

                return `
                <tr>
                  <td data-label="Date">${Utils.fmtDate(e.date)}</td>
                  <td data-label="Truck">${truck ? Utils.esc(truck.plateNumber) : '---'}</td>
                  <td data-label="Driver">${driver ? Utils.esc(driver.name) : '---'}</td>
                  <td data-label="Category"><span class="badge badge-info">${Utils.esc(e.category)}</span></td>
                  <td data-label="Amount"><strong>${Utils.fmtTZS(e.amount)}</strong></td>
                  <td data-label="Payment">${Utils.esc(paymentDetail)}</td>
                  <td data-label="Description">${Utils.esc(e.description || '---')}</td>
                  <td data-label="Action">
                    <button class="btn-danger" onclick="Expenses.remove('${e.id}')">
                      <i class="fas fa-trash"></i>
                    </button>
                  </td>
                </tr>`;
              }).join('') : '<tr><td colspan="8" style="text-align:center; color:#64748b; padding: 30px;">No expenses recorded yet.</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  // --- LOGIC ---

  autoFillDriver() {
    const truckSelect = document.getElementById('expTruck');
    const driverInput = document.getElementById('expDriver');
    if (!truckSelect || !driverInput) return;

    const selectedOption = truckSelect.options[truckSelect.selectedIndex];
    const driverId = selectedOption.getAttribute('data-driver');

    if (driverId) {
      const driver = DB.drivers().find(d => d.id === driverId);
      if (driver) {
        driverInput.value = driver.name;
        driverInput.style.color = '#0f172a';
        driverInput.style.backgroundColor = '#ffffff';
      } else {
        driverInput.value = 'Driver not found';
      }
    } else {
      driverInput.value = '';
      driverInput.placeholder = 'No driver assigned to this truck';
      driverInput.style.color = '#64748b';
      driverInput.style.backgroundColor = '#f1f5f9';
    }
  },

  togglePaymentDetails() {
    const method = document.getElementById('expMethod').value;
    document.getElementById('mobileProviderGroup').style.display = method === 'Mobile' ? 'block' : 'none';
    document.getElementById('bankGroup').style.display = method === 'Bank' ? 'block' : 'none';
  },

  // Add item to the pending list
  addItem() {
    const category = document.getElementById('expCategory').value;
    const amount = Number(document.getElementById('expAmount').value);
    const description = document.getElementById('expDesc').value;

    if (!category) return alert('Please select a category.');
    if (!amount || amount <= 0) return alert('Please enter a valid amount.');

    // Add to array
    this.pendingExpenses.push({ category, amount, description });
    
    // Clear inputs for next item
    document.getElementById('expCategory').value = '';
    document.getElementById('expAmount').value = '';
    document.getElementById('expDesc').value = '';
    document.getElementById('expCategory').focus();

    // Refresh view to show new list
    App.refresh();
  },

  // Remove item from pending list
  removePendingItem(index) {
    this.pendingExpenses.splice(index, 1);
    App.refresh();
  },

  // Save all pending items to database
  saveBatch() {
    // 1. Validate Header Info
    const date = document.getElementById('expDate').value;
    const truckId = document.getElementById('expTruck').value;
    const method = document.getElementById('expMethod').value;

    if (!date) return alert('Please select a date in the Trip Details section.');
    if (!truckId) return alert('Please select a truck in the Trip Details section.');
    if (!method) return alert('Please select a Payment Method in the Trip Details section.');
    if (this.pendingExpenses.length === 0) return alert('Your list is empty. Add items first.');

    // Validate Payment specifics
    let mobileProvider = '';
    let bank = '';
    if (method === 'Mobile') {
      mobileProvider = document.getElementById('expMobileProvider').value;
      if (!mobileProvider) return alert('Please select a Mobile Money provider.');
    }
    if (method === 'Bank') {
      bank = document.getElementById('expBank').value;
      if (!bank) return alert('Please select a Bank.');
    }

    const truckSelect = document.getElementById('expTruck');
    const driverId = truckSelect.options[truckSelect.selectedIndex].getAttribute('data-driver') || '';

    // 2. Loop and Save
    let savedCount = 0;
    this.pendingExpenses.forEach(item => {
      const expense = {
        date, 
        truckId, 
        driverId, 
        category: item.category, 
        amount: item.amount,
        description: item.description,
        method, 
        mobileProvider, 
        bank
      };

      DB.push('expenses', expense);
      
      if (typeof logActivity === 'function') {
        logActivity({ 
          module: 'expenses', 
          action: 'create', 
          description: `Batch Expense: ${item.category} - ${Utils.fmtTZS(item.amount)}`, 
          ref: truckId, 
          user: 'admin' 
        });
      }
      savedCount++;
    });

    // 3. Cleanup
    this.pendingExpenses = []; // Clear the list
    alert(`Successfully saved ${savedCount} expense(s)!`);
    App.refresh();
  },

  // Delete from history
  remove(id) {
    if (confirm('Are you sure you want to delete this expense record? This cannot be undone.')) {
      DB.remove('expenses', id);
      if (typeof logActivity === 'function') {
        logActivity({ module: 'expenses', action: 'delete', description: `Deleted expense ${id}`, ref: id, user: 'admin' });
      }
      App.refresh();
    }
  }
};
