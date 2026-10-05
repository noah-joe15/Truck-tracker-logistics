const Auth = {
  init() {
    // Attach click event to the login button
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
      loginBtn.addEventListener('click', () => this.login());
    }
    
    // Allow pressing "Enter" key to login
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

    // Default credentials (you can change these later)
    const stored = DB.get('credentials', { user: 'admin', pass: 'admin' });

    if (user === stored.user && pass === stored.pass) {
      localStorage.setItem('iltm_logged_in', '1');
      App.showApp(); // This hides login and shows the dashboard
    } else {
      alert('Invalid credentials.\n\nDefault Login:\nUsername: admin\nPassword: admin');
    }
  },

  logout() {
    localStorage.removeItem('iltm_logged_in');
    location.reload();
  }
};
