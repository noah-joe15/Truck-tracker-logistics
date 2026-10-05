const Auth = {
  init() {
    document.getElementById('loginBtn').addEventListener('click', () => this.login());
  },
  login() {
    const username = document.getElementById('loginUser').value;
    const password = document.getElementById('loginPass').value;
    
    // Simple authentication (replace with your logic)
    if (username === 'admin' && password === 'admin') {
      localStorage.setItem('iltm_logged_in', 'true');
      App.showApp();
    } else {
      alert('Invalid credentials. Try: admin / admin');
    }
  }
};
