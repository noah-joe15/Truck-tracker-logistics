const MapView = {
  render() {
    const trips = DB.trips().filter(t => t.status === 'In Transit');
    const trucks = DB.trucks(), drivers = DB.drivers();

    return `
      <h1 class="section-title">${Icons.map} Live Map -- Active Fleet Routes</h1>
      <div class="form-section">
        <p style="color:#94a3b8;">Active Trucks: <b style="color:#f59e0b;">${trips.length}</b></p>
        <div id="liveMap" style="display:flex;align-items:center;justify-content:center;flex-direction:column;padding:24px;">
          ${trips.length === 0
            ? `<div style="text-align:center;color:#64748b;">
                ${Icons.truck}
                <p style="margin-top:12px;">No trucks currently in transit</p>
              </div>`
            : trips.map(t => {
                const truck = trucks.find(x => x.id === t.truckId);
                const driver = drivers.find(x => x.id === t.driverId);
                return `<div class="map-truck-card">
                  <b>${Icons.truck} ${truck ? Utils.esc(truck.plateNumber) : 'Unknown'}</b><br>
                  <span>Driver:</span> ${driver ? Utils.esc(driver.name) : '---'}<br>
                  <span>Route:</span> ${Utils.esc(t.from)} &rarr; ${Utils.esc(t.to)}<br>
                  <span>Distance:</span> ${Utils.fmtNum(t.distance)} km
                </div>`;
              }).join('')
          }
        </div>
      </div>
      <div class="alert-box info">
        ${Icons.info}
        <div class="alert-text">
          <strong>Integration Note</strong>
          Connect with Google Maps or Mapbox API for real GPS tracking of your fleet.
        </div>
      </div>
    `;
  }
};
