const MapView = {
  map: null,
  markers: {},

    render() {
    const trips = DB.trips().filter(t => t.status === 'In Transit');
    const trucks = DB.trucks();
    const drivers = DB.drivers();
    
    return `
      <div class="section-title">
        <h2><i class="fas fa-map-marked-alt"></i> Live Map -- Active Fleet Routes</h2>
      </div>
      
      <div class="form-section" style="padding: 0; overflow: hidden; position: relative;">
        <div id="map" style="height: 600px; width: 100%; position: relative; z-index: 1;"></div>
      </div>
      
      <div class="form-section" style="margin-top: 20px;">
        <h3><i class="fas fa-info-circle"></i> Active Trucks: <span style="color: var(--accent);">${trips.length}</span></h3>
        <div id="truckList" style="margin-top: 16px;">
          ${this.truckListHTML(trips, trucks, drivers)}
        </div>
      </div>
      
      <div class="alert-box info" style="margin-top: 20px;">
        <i class="fas fa-info-circle"></i>
        <div class="alert-text">
          <strong>Real-Time Tracking:</strong> To enable real GPS tracking, integrate with GPS devices or mobile apps that send location updates to the system.
        </div>
      </div>
    `;
  },

  truckListHTML(trips, trucks, drivers) {
    if (!trips.length) {
      return '<p style="color: var(--text-light); padding: 20px; text-align: center;">No trucks currently in transit.</p>';
    }
    
    return trips.map(trip => {
      const truck = trucks.find(t => t.id === trip.truckId);
      const driver = drivers.find(d => d.id === trip.driverId);
      return `
        <div style="padding: 12px; border: 1px solid var(--border); border-radius: 8px; margin-bottom: 12px; background: var(--white);">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <strong style="color: var(--primary-dark);">${truck ? Utils.esc(truck.plateNumber) : 'Unknown Truck'}</strong>
              <div style="font-size: 13px; color: var(--text-light); margin-top: 4px;">
                <i class="fas fa-user"></i> ${driver ? Utils.esc(driver.name) : 'Unknown Driver'}
              </div>
              <div style="font-size: 13px; color: var(--text-light); margin-top: 2px;">
                <i class="fas fa-route"></i> ${Utils.esc(trip.from)} → ${Utils.esc(trip.to)}
              </div>
              <div style="font-size: 13px; color: var(--text-light); margin-top: 2px;">
                <i class="fas fa-tachometer-alt"></i> ${Utils.fmtNum(trip.distance || 0)} km
              </div>
            </div>
            <span class="badge badge-info">In Transit</span>
          </div>
        </div>
      `;
    }).join('');
  },

  afterRender() {
    this.initMap();
  },

  initMap() {
    // Wait for DOM to be ready
    setTimeout(() => {
      // Initialize map centered on Tanzania
      this.map = L.map('map', {
        zoomControl: true,
        attributionControl: true
      }).setView([-6.369028, 34.888822], 6);
      
      // Fix map size after initialization
      setTimeout(() => {
        if (this.map) {
          this.map.invalidateSize();
        }
      }, 200);
      
      // Add OpenStreetMap tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
      }).addTo(this.map);

      // Add markers for active trips
      const trips = DB.trips().filter(t => t.status === 'In Transit');
      const trucks = DB.trucks();
      const drivers = DB.drivers();

      trips.forEach((trip, index) => {
        const truck = trucks.find(t => t.id === trip.truckId);
        const driver = drivers.find(d => d.id === trip.driverId);
        
        // Get coordinates for from and to locations
        const fromCoords = this.getRegionCoords(trip.from);
        const toCoords = this.getRegionCoords(trip.to);
        
        if (fromCoords && toCoords) {
          // Create a custom icon for the truck
          const truckIcon = L.divIcon({
            className: 'custom-truck-marker',
            html: `<div style="
              background: linear-gradient(135deg, var(--primary), var(--primary-light));
              width: 40px;
              height: 40px;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              border: 3px solid white;
              box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            "><i class="fas fa-truck" style="color: white; font-size: 18px;"></i></div>`,
            iconSize: [40, 40],
            iconAnchor: [20, 20]
          });

          // Add marker at starting location (or midpoint for simulation)
          const midLat = (fromCoords.lat + toCoords.lat) / 2;
          const midLon = (fromCoords.lon + toCoords.lon) / 2;
          
          const marker = L.marker([midLat, midLon], { icon: truckIcon }).addTo(this.map);
          
          // Add popup with truck info
          const popupContent = `
            <div style="min-width: 200px;">
              <h4 style="margin: 0 0 8px 0; color: var(--primary-dark);">${truck ? Utils.esc(truck.plateNumber) : 'Unknown Truck'}</h4>
              <div style="font-size: 13px;">
                <div><i class="fas fa-user" style="color: var(--primary);"></i> ${driver ? Utils.esc(driver.name) : 'Unknown Driver'}</div>
                <div style="margin-top: 4px;"><i class="fas fa-route" style="color: var(--primary);"></i> ${Utils.esc(trip.from)} → ${Utils.esc(trip.to)}</div>
                <div style="margin-top: 4px;"><i class="fas fa-tachometer-alt" style="color: var(--primary);"></i> ${Utils.fmtNum(trip.distance || 0)} km</div>
                <div style="margin-top: 4px;"><i class="fas fa-info-circle" style="color: var(--primary);"></i> ${Utils.statusBadge(trip.status)}</div>
              </div>
            </div>
          `;
          
          marker.bindPopup(popupContent);
          this.markers[trip.id] = marker;

          // Draw route line
          const routeLine = L.polyline([
            [fromCoords.lat, fromCoords.lon],
            [toCoords.lat, toCoords.lon]
          ], {
            color: '#3b82f6',
            weight: 3,
            opacity: 0.7,
            dashArray: '10, 10'
          }).addTo(this.map);

          // Fit bounds to show all markers
          if (trips.length > 0) {
            const group = new L.featureGroup([marker, routeLine]);
            this.map.fitBounds(group.getBounds().pad(0.1));
          }
        }
      });

      // If no active trips, show Tanzania
      if (trips.length === 0) {
        this.map.setView([-6.369028, 34.888822], 6);
      }
    }, 100);
  },

  getRegionCoords(regionName) {
    if (!regionName || !regionCoords[regionName]) {
      // Default to Dar es Salaam if region not found
      return { lat: -6.7924, lon: 39.2083 };
    }
    return regionCoords[regionName];
  },

  refreshMap() {
    if (this.map) {
      this.map.remove();
      this.initMap();
    }
  }
};
