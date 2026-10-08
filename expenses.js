const Expenses = {
  // State for the batch entry
  batchExpenses: {}, // Stores { 'Category Name': Amount }
  
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
    
    // Calculate total of currently selected batch
    const batchTotal = Object.values(this.batchExpenses).reduce((sum, val) => sum + Number(val || 0), 0);
    const selectedCount = Object.keys(this.batchExpenses).length;

    return `
      <div class="section-title">
        <h2><i class="fas fa-wallet"></i> Expense Management</h2>
      </div>
      
      <!-- 1. TRIP DETAILS -->
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

      <!-- 2. MANAGE CATEGORIES -->
      <div class="form-section" style="background: rgba(241, 245, 249, 0.5); border: 1px dashed var(--border);">
        <div style="display: flex; gap: 10px; align-items: flex-end;">
          <div class="form-group" style="flex: 1; margin: 0;">
            <label><i class="fas fa-tags"></i> Add New Category</label>
            <input type="text" id="newCategoryInput" class="input-field" placeholder="e.g., Car Wash, Lunch">
          </div>
          <button class="btn-primary" onclick="Expenses.addNewCategory()" style="margin: 0; padding: 11px 20px;">
            <i class="fas fa-plus"></i> Add
          </button>
        </div>
      </div>

      <!-- 3. EXPENSE TRAY (MULTI-SELECT) -->
      <div class="form-section">
        <h2><i class="fas fa-clipboard-list"></i> 2. Select Expenses & Enter Costs</h2>
        <p style="color: var(--text-light); font-size: 13px; margin-bottom: 15px;">
          Tick the boxes below for expenses incurred, then enter the cost for each.
        </p>
        
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 12px; margin-bottom: 20px;">
          ${this.categories.map(cat => {
            const isSelected = this.batchExpenses.hasOwnProperty(cat);
            const amount = this.batchExpenses[cat] || '';
            
            return `
              <div style="border: 1px solid var(--border); border-radius: 8px; padding: 12px; background: ${isSelected ? '#f0f9ff' : 'white'}; transition: all 0.2s;">
                <div style="display: flex; align-items: center; gap: 10px; margin-bottom: ${isSelected ? '10px' : '0'};">
                  <input type="checkbox" id="chk_${cat.replace(/\s+/g, '_')}" 
                    ${isSelected ? 'checked' : ''} 
                    onchange="Expenses.toggleExpense('${Utils.esc(cat)}')"
                    style="width: 18px; height: 18px; cursor: pointer;">
                  <label for="chk_${cat.replace(/\s+/g, '_')}" style="font-weight: 600; color: var(--text); cursor: pointer; flex: 1;">
                    ${Utils.esc(cat)}
                  </label>
                </div>
                ${isSelected ? `
                  <div style="margin-top: 8px;">
                    <label style="font-size: 11px; color: var(--text-light); display: block; margin-bottom: 4px;">Amount (TZS)</label>
                    <input type="number" 
                      value="${amount}" 
                      oninput="Expenses.updateAmount('${Utils.esc(cat)}', this.value)"
                      class="input-field" 
                      placeholder="0.00" 
                      style="width: 100%; padding: 8px; font-size: 14px;"
                      autofocus>
                  </div>
                ` : ''}
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <!-- 4. SAVE BATCH -->
      ${selectedCount > 0 ? `
        <div class="form-section" style="background: linear-gradient(135deg, #f0f9ff, #e0f2fe); border: 2px solid var(--primary);">
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 15px;">
            <div>
              <h3 style="margin: 0; color: var(--primary-dark);">
                <i class="fas fa-calculator"></i> Batch Total
              </h3>
              <p style="margin: 4px 0 0 0; color: var(--text-light); font-size: 13px;">
                ${selectedCount} item(s) selected
              </p>
            </div>
            <div style="text-align: right;">
              <div style="font-size: 28px; font-weight: 800; color: var(--primary); line-height: 1;">
                ${Utils.fmtTZS(batchTotal)}
              </div>
            </div>
          </div>
          <button class="btn-primary" onclick="Expenses.saveBatch()" style="margin-top: 15px; width: 100%; font-size: 16px; padding: 14px;">
            <i class="fas fa-save"></i> Save All ${selectedCount} Expenses
          </button>
        </div>
      ` : ''}

      <!-- 5. HISTORY -->
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

  // Add a new category to the list
  addNewCategory() {
    const input = document.getElementById('newCategoryInput');
    const val = input.value.trim();
    if (!val) return alert('Please enter a category name.');
    if (this.categories.includes(val)) return alert('Category already exists.');
    
    this.categories.push(val);
    input.value = '';
    App.refresh(); // Re-render to show new checkbox
  },

  // Toggle checkbox on/off
  toggleExpense(category) {
    if (this.batchExpenses.hasOwnProperty(category)) {
      delete this.batchExpenses[category];
    } else {
      this.batchExpenses[category] = 0;
    }
    App.refresh();
  },

  // Update amount for a specific category
  updateAmount(category, value) {
    this.batchExpenses[category] = Number(value) || 0;
    // We don't refresh the whole app here to keep focus on the input, 
    // but the total updates on the next render or via direct DOM manipulation if we wanted to be fancy.
    // For simplicity, let's just trigger a refresh to update the Total Display.
    // Actually, to keep focus, we should update the DOM directly.
    const totalEl = document.querySelector('.form-section[style*="linear-gradient"] .fa-calculator');
    if(totalEl) {
       // This is a bit hacky, better to just refresh if performance allows, 
       // but for a small app, let's just update the text node of the total.
       const totalVal = Object.values(this.batchExpenses).reduce((a,b) => a + b, 0);
       const totalDisplay = document.querySelector('.form-section[style*="linear-gradient"] div[style*="font-size: 28px"]');
       if(totalDisplay) totalDisplay.innerText = Utils.fmtTZS(totalVal);
    }
  },

  saveBatch() {
    // 1. Validate Header Info
    const date = document.getElementById('expDate').value;
    const truckId = document.getElementById('expTruck').value;
    const method = document.getElementById('expMethod').value;

    if (!date) return alert('Please select a date in the Trip Details section.');
    if (!truckId) return alert('Please select a truck in the Trip Details section.');
    if (!method) return alert('Please select a Payment Method in the Trip Details section.');
    
    const categories = Object.keys(this.batchExpenses);
    if (categories.length === 0) return alert('Please select at least one expense.');

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
    let totalAmount = 0;

    categories.forEach(cat => {
      const amount = this.batchExpenses[cat];
      if (amount <= 0) return; // Skip zero values

      const expense = {
        date, 
        truckId, 
        driverId, 
        category: cat, 
        amount: amount,
        description: `Batch entry: ${cat}`, // Auto description
        method, 
        mobileProvider, 
        bank
      };

      DB.push('expenses', expense);
      totalAmount += amount;
      savedCount++;
      
      if (typeof logActivity === 'function') {
        logActivity({ 
          module: 'expenses', 
          action: 'create', 
          description: `Batch Expense: ${cat} - ${Utils.fmtTZS(amount)}`, 
          ref: truckId, 
          user: 'admin' 
        });
      }
    });

    // 3. Cleanup
    this.batchExpenses = {}; // Clear the list
    alert(`Successfully saved ${savedCount} expense(s) totaling ${Utils.fmtTZS(totalAmount)}!`);
    App.refresh();
  },

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
