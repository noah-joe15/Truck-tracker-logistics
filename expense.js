const Expenses = {
  // Comprehensive Tanzania trucking expense categories
  categories: [
    'Fuel (Diesel/Petrol)',
    'Maintenance & Servicing',
    'Spare Parts',
    'Tolls & Weighbridge',
    'Parking Fees',
    'Driver Allowance / Per Diem',
    'Loading / Offloading',
    'LATRA / Regulatory Fees',
    'Insurance Renewal',
    'Fines / Penalties',
    'Other'
  ],

  // Tanzanian Mobile Money Providers
  mobileProviders: ['M-Pesa (Vodacom)', 'Tigo Pesa', 'Airtel Money', 'HaloPesa (TTCL)'],

  // Tanzanian Banks
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

    return `
      <h2 class="section-title"><i class="fas fa-wallet"></i> Expense Management</h2>
      
      <div class="form-section">
        <h2><i class="fas fa-plus-circle"></i> Record New Expense</h2>
        
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
            <label>Assigned Driver (Auto-filled)</label>
            <input type="text" id="expDriver" class="input-field" readonly placeholder="Select a truck first" style="background-color: #f1f5f9; color: #64748b;">
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>Expense Category</label>
            <select id="expCategory" class="input-field">
              <option value="">-- Choose Category --</option>
              ${this.categories.map(c => `<option value="${c}">${c}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label>Amount (TZS)</label>
            <input type="number" id="expAmount" class="input-field" placeholder="0.00" min="0">
          </div>
        </div>

        <div class="form-group">
          <label>Description / Notes</label>
          <input type="text" id="expDesc" class="input-field" placeholder="e.g., Oil change, Dar to Arusha toll, Weighbridge fee">
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
          
          <!-- Conditional: Mobile Money Providers -->
          <div class="form-group" id="mobileProviderGroup" style="display: none;">
            <label>Mobile Provider</label>
            <select id="expMobileProvider" class="input-field">
              <option value="">-- Select Provider --</option>
              ${this.mobileProviders.map(m => `<option value="${m}">${m}</option>`).join('')}
            </select>
          </div>

          <!-- Conditional: Banks -->
          <div class="form-group" id="bankGroup" style="display: none;">
            <label>Bank Name</label>
            <select id="expBank" class="input-field">
              <option value="">-- Select Bank --</option>
              ${this.banks.map(b => `<option value="${b}">${b}</option>`).join('')}
            </select>
          </div>
        </div>

        <button class="btn-primary" onclick="Expenses.save()" style="margin-top: 24px;">
          <i class="fas fa-save"></i> Save Transaction
        </button>
      </div>

      <div class="form-section">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <h2 style="margin: 0;"><i class="fas fa-history"></i> Recent Expenses</h2>
          <span class="badge badge-danger">Total Spent: ${Utils.fmtTZS(totalExp)}</span>
        </div>
        <div class="table-responsive">
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
                let paymentDetail = e.method;
                if (e.method === 'Mobile' && e.mobileProvider) paymentDetail += ` (${e.mobileProvider})`;
                if (e.method === 'Bank' && e.bank) paymentDetail += ` (${e.bank})`;

                return `
                <tr>
                  <td>${Utils.fmtDate(e.date)}</td>
                  <td>${truck ? Utils.esc(truck.plateNumber) : '---'}</td>
                  <td>${driver ? Utils.esc(driver.name) : '---'}</td>
                  <td><span class="badge badge-info">${Utils.esc(e.category)}</span></td>
                  <td><strong>${Utils.fmtTZS(e.amount)}</strong></td>
                  <td>${Utils.esc(paymentDetail)}</td>
                  <td>${Utils.esc(e.description || '---')}</td>
                  <td>
                    <button class="btn-danger" onclick="Expenses.remove('${e.id}')">
                      <i class="fas fa-trash"></i>
                    </button>
                  </td>
                </tr>`;
              }).join('') : '<tr><td colspan="8" style="text-align: center; padding: 40px; color: #64748b;">No expenses recorded yet.</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  // Auto-fill the driver when a truck is selected
  autoFillDriver() {
    const truckSelect = document.getElementById('expTruck');
    const driverInput = document.getElementById('expDriver');
    
    if (!truckSelect || !driverInput) return;

    const selectedOption = truckSelect.options[truckSelect.selectedIndex];
    const driverId = selectedOption.getAttribute('data-driver');

    if (driverId) {
      const drivers = DB.drivers();
      const driver = drivers.find(d => d.id === driverId);
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

  // Show/Hide Mobile or Bank dropdowns based on payment method
  togglePaymentDetails() {
    const method = document.getElementById('expMethod').value;
    const mobileGroup = document.getElementById('mobileProviderGroup');
    const bankGroup = document.getElementById('bankGroup');

    // Reset visibility
    mobileGroup.style.display = 'none';
    bankGroup.style.display = 'none';

    // Show relevant group
    if (method === 'Mobile') {
      mobileGroup.style.display = 'block';
    } else if (method === 'Bank') {
      bankGroup.style.display = 'block';
    }
  },

  save() {
    const date = document.getElementById('expDate').value;
    const truckId = document.getElementById('expTruck').value;
    const category = document.getElementById('expCategory').value;
    const amount = Number(document.getElementById('expAmount').value);
    const method = document.getElementById('expMethod').value;

    // Validation
    if (!date) return alert('Please select a date.');
    if (!truckId) return alert('Please select a truck.');
    if (!category) return alert('Please select an expense category.');
    if (!amount || amount <= 0) return alert('Please enter a valid amount greater than 0.');
    if (!method) return alert('Please select a payment method.');

    // Gather conditional payment details
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

    // Find the driver ID based on the selected truck (for data consistency)
    const truckSelect = document.getElementById('expTruck');
    const driverId = truckSelect.options[truckSelect.selectedIndex].getAttribute('data-driver') || '';

    const expense = {
      date: date,
      truckId: truckId,
      driverId: driverId,
      category: category,
      amount: amount,
      description: document.getElementById('expDesc').value,
      method: method,
      mobileProvider: mobileProvider,
      bank: bank
    };

    DB.push('expenses', expense);
    
    // Reset form partially for convenience
    document.getElementById('expAmount').value = '';
    document.getElementById('expDesc').value = '';
    document.getElementById('expMethod').value = '';
    this.togglePaymentDetails();
    
    alert('Expense recorded successfully!');
    App.refresh();
  },

  remove(id) {
    if (confirm('Are you sure you want to delete this expense record? This cannot be undone.')) {
      DB.remove('expenses', id);
      App.refresh();
    }
  }
};
