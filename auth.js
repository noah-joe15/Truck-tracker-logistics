const Auth = {
  init() {
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
      loginBtn.addEventListener('click', () => this.login());
    }
    
    const loginPass = document.getElementById('loginPass');
    if (loginPass) {
      loginPass.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') this.login();
      });
    }
  },

  login() {
    const user = document.getElementById('loginUser').value.trim();
    const pass = document.getElementById('loginPass').value;
    const stored = DB.get('credentials', { user: 'admin', pass: 'admin' });

    if (user === stored.user && pass === stored.pass) {
      localStorage.setItem('iltm_logged_in', '1');
      if (typeof logActivity === 'function') {
        logActivity({ module: 'auth', action: 'login', description: 'User logged in', user: user });
      }
      App.showApp();
    } else {
      alert('Invalid credentials.\n\nDefault Login:\nUsername: admin\nPassword: admin');
    }
  },

  logout() {
    if (typeof logActivity === 'function') {
      logActivity({ module: 'auth', action: 'logout', description: 'User logged out', user: 'admin' });
    }
    localStorage.removeItem('iltm_logged_in');
    location.reload();
  }
};
