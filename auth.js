const Auth = {
  init() {
    document.getElementById('loginBtn').addEventListener('click', () => this.login());
    document.getElementById('logoutBtn').addEventListener('click', () => this.logout());
    if (localStorage.getItem('iltm_logged_in') === '1') App.showApp();
  },
  login() {
    const u = document.getElementById('loginUser').value.trim();
    const p = document.getElementById('loginPass').value;
    const stored = DB.get('credentials', { user: 'admin', pass: 'admin' });
    if (u === stored.user && p === stored.pass) {
      localStorage.setItem('iltm_logged_in', '1');
      App.showApp();
    } else {
      alert('Invalid credentials. Default: admin / admin');
    }
  },
  logout() {
    localStorage.removeItem('iltm_logged_in');
    location.reload();
  }
};
