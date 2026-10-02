const DB = {
  get(key, fallback = []) {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
    catch { return fallback; }
  },
  set(key, value) { localStorage.setItem(key, JSON.stringify(value)); },
  push(key, item) {
    const arr = this.get(key);
    arr.push({ ...item, id: Date.now() + Math.random().toString(36).slice(2, 6) });
    this.set(key, arr);
    return arr;
  },
  update(key, id, patch) {
    const arr = this.get(key).map(x => x.id === id ? { ...x, ...patch } : x);
    this.set(key, arr);
    return arr;
  },
  remove(key, id) {
    this.set(key, this.get(key).filter(x => x.id !== id));
  },
  clearAll() { localStorage.clear(); },

  trucks:     () => DB.get('trucks'),
  drivers:    () => DB.get('drivers'),
  customers:  () => DB.get('customers'),
  trips:      () => DB.get('trips'),
  expenses:   () => DB.get('expenses'),
  income:     () => DB.get('income'),
  debts:      () => DB.get('debts'),
  compliance: () => DB.get('compliance'),
};
