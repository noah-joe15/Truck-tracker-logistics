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
        logActivity({ 
          module: 'auth', 
          action: 'login', 
          description: 'User logged in', 
          user: user 
        });
      }
      
      // Trigger the truck animation!
      this.playTruckAnimation();
    } else {
      alert('Invalid credentials.\n\nDefault Login:\nUsername: admin\nPassword: admin');
    }
  },

  playTruckAnimation() {
    const overlay = document.getElementById('truckDriveOverlay');
    const loginCard = document.querySelector('.login-card');
    const truckSound = document.getElementById('truckSound');
    
    // 1. Fade out the login card
    if (loginCard) {
      loginCard.classList.add('driving-away');
    }
    
    // 2. Show the truck overlay after a brief delay
    setTimeout(() => {
      if (overlay) {
        overlay.classList.add('active');
      }
      
      // 3. Play the truck sound (with volume control)
      if (truckSound) {
        truckSound.volume = 0.6; // 50% volume so it's not too loud
        truckSound.currentTime = 0;
        
        // Try to play - browsers may block autoplay
        const playPromise = truckSound.play();
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            console.log('Audio autoplay blocked by browser:', error);
            // Sound won't play, but animation will still work
          });
        }
      }
      
      // 4. After animation completes, show the app
      setTimeout(() => {
        // Stop the sound
        if (truckSound) {
          truckSound.pause();
          truckSound.currentTime = 0;
        }
        
        // Hide the overlay
        if (overlay) {
          overlay.classList.remove('active');
        }
        
        // Show the main app
        App.showApp();
        
      }, 3500); // 3.5 seconds matches the CSS animation duration
      
    }, 400); // Small delay to let the card fade out first
  },

  logout() {
    if (typeof logActivity === 'function') {
      logActivity({ 
        module: 'auth', 
        action: 'logout', 
        description: 'User logged out', 
        user: 'admin' 
      });
    }
    localStorage.removeItem('iltm_logged_in');
    location.reload();
  }
};
