document.addEventListener('DOMContentLoaded', function(){
  function escapeHtml(str) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  // Default coordinates for Barangay Tumaga (placeholder)
  const defaultLat = 8.476;
  const defaultLng = 123.610;

  const barangayLocations = [
    {name: 'Zone 1', lat: 8.4782, lng: 123.6095},
    {name: 'Zone 2', lat: 8.4750, lng: 123.6130},
    {name: 'Zone 3', lat: 8.4771, lng: 123.6070},
    {name: 'Brgy. San Roque', lat: 8.4740, lng: 123.6080},
    {name: 'Highway 7', lat: 8.4728, lng: 123.6124}
  ];

  function initMap(containerId, lat=defaultLat, lng=defaultLng){
    const el = document.getElementById(containerId);
    if(!el) return null;
    const placeholder = el.querySelector('.map-placeholder');
    if(placeholder) placeholder.style.display = 'none';

    const map = L.map(containerId, {zoomControl:true, attributionControl:false}).setView([lat,lng], 14);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {maxZoom:19}).addTo(map);

    return {map, markers: []};
  }

  const dashboardMap = initMap('tumaga-map');

  let selectedAlertId = null;

  function getAlertLocation(alert) {
    return barangayLocations.find(loc => loc.name === alert.location) || {lat: defaultLat, lng: defaultLng};
  }

  function clearMapMarkers() {
    dashboardMap.markers.forEach(({marker}) => dashboardMap.map.removeLayer(marker));
    dashboardMap.markers.length = 0;
  }

  function renderMapMarkers(highlightId = null) {
    if(!dashboardMap) return;
    clearMapMarkers();

    alertSystem.alerts.forEach(alert => {
      const loc = getAlertLocation(alert);
      const isHighlighted = alert.id === highlightId;
      const marker = L.circleMarker([loc.lat, loc.lng], {
        radius: isHighlighted ? 14 : 10,
        color: '#ffffff',
        weight: isHighlighted ? 4 : 2,
        fillColor: alert.status === 'Active' ? '#dc2626' : '#059669',
        fillOpacity: 1
      }).addTo(dashboardMap.map);

      marker.bindPopup(`
        <div style="color:#000;font-weight:600;">
          ${escapeHtml(alert.type)} SOS<br>
          <strong>${escapeHtml(alert.location)}</strong><br>
          Respondent: ${escapeHtml(alert.respondent.name)}<br>
          Status: ${escapeHtml(alert.status)}
        </div>
      `);

      marker.on('click', () => {
        selectAlert(alert.id);
      });

      dashboardMap.markers.push({id: alert.id, marker});
    });
  }

  function selectAlert(alertId) {
    const selected = alertSystem.alerts.find(alert => alert.id === alertId);
    if(!selected) return;
    selectedAlertId = alertId;
    const loc = getAlertLocation(selected);
    dashboardMap.map.panTo([loc.lat, loc.lng]);
    renderMapMarkers(alertId);
    document.getElementById('active-user-name').textContent = selected.reportedBy;
    document.getElementById('active-user-status').textContent = selected.status;
    document.getElementById('active-sos-details').innerHTML = `
      <strong>Alert ID:</strong> ${escapeHtml(selected.id)}<br>
      <strong>Type:</strong> ${escapeHtml(selected.type)}<br>
      <strong>Location:</strong> ${escapeHtml(selected.location)}<br>
      <strong>Respondent:</strong> ${escapeHtml(selected.respondent.name)} (${escapeHtml(selected.respondent.role)})<br>
      <strong>Reported At:</strong> ${escapeHtml(formatTime(selected.timestamp))}<br>
      <strong>Barangay:</strong> Tumaga
    `;
  }

  window.selectAlert = selectAlert;

  function getLocationOptions() {
    return barangayLocations.map(loc => `<option value="${loc.name}">${loc.name}</option>`).join('');
  }

  const alertSystem = {
    users: [
      {id: 'U01', name: 'Admin', role: 'Coordinator', online: true, location: 'Zone 2'},
      {id: 'U02', name: 'Maria Dela Cruz', role: 'Responder', online: true, location: 'Zone 3'},
      {id: 'U03', name: 'Juan Ramos', role: 'Responder', online: false, location: 'Brgy. San Roque'},
      {id: 'U04', name: 'Supervisor', role: 'Supervisor', online: true, location: 'Zone 1'}
    ],
    alerts: [
      {id: '#A102', type: 'Flood', location: 'Zone 3', status: 'Active', timestamp: new Date(), reportedBy: 'Community Member', respondent: {name: 'Maria Dela Cruz', role: 'Responder', location: 'Zone 3'}},
      {id: '#A101', type: 'Fire', location: 'Brgy. San Roque', status: 'Resolved', timestamp: new Date(Date.now() - 3600000), reportedBy: 'Witness', respondent: {name: 'Juan Ramos', role: 'Responder', location: 'Brgy. San Roque'}},
      {id: '#A100', type: 'Accident', location: 'Highway 7', status: 'Resolved', timestamp: new Date(Date.now() - 7200000), reportedBy: 'Traffic Watch', respondent: {name: 'Supervisor', role: 'Supervisor', location: 'Zone 1'}}
    ],
    addAlert: function(type, location, reportedBy) {
      const respondent = this.users.find(u => u.online && u.location === location) || {name: 'Nearby responder', role: 'Responder', location};
      const newAlert = {
        id: '#A' + Math.floor(100 + Math.random() * 900),
        type,
        location,
        status: 'Active',
        timestamp: new Date(),
        reportedBy,
        respondent
      };
      this.alerts.unshift(newAlert);
      renderAlerts();
      renderRespondents();
      updateSummary();
      window.selectAlert(newAlert.id);
      this.showNotification(type, location);
      return newAlert;
    },
    resolveAlert: function(alertId) {
      const alert = this.alerts.find(a => a.id === alertId);
      if(alert) {
        alert.status = 'Resolved';
        updateSummary();
        renderAlerts();
        renderMapMarkers(selectedAlertId);
      }
    },
    showNotification: function(type, location) {
      const msg = `New ${type} alert in ${location}`;
      if('Notification' in window && Notification.permission === 'granted') {
        new Notification('ZamboAlert', {body: msg, icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23dc2626"><polygon points="12,2 20,20 4,20"/></svg>'});
      }
      console.log('Alert:', msg);
    }
  };

  function formatTime(date) {
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  }

  function updateSummary() {
    const activeCount = alertSystem.alerts.filter(alert => alert.status === 'Active').length;
    const resolvedCount = alertSystem.alerts.filter(alert => alert.status === 'Resolved').length;
    const totalAlerts = alertSystem.alerts.length;
    const avgMs = alertSystem.alerts.reduce((sum, alert) => {
      const delta = alert.status === 'Resolved' ? Date.now() - alert.timestamp.getTime() : 0;
      return sum + delta;
    }, 0);
    const avgMinutes = resolvedCount ? Math.round((avgMs / resolvedCount) / 60000) : 0;

    document.getElementById('active-alerts-count').textContent = activeCount;
    document.getElementById('resolved-count').textContent = resolvedCount;
    document.getElementById('avg-response').textContent = `${avgMinutes}m`;
    document.getElementById('users-count').textContent = alertSystem.users.length;
  }

  function renderAlerts() {
    const tbody = document.querySelector('#alerts-table tbody');
    tbody.innerHTML = alertSystem.alerts.map(alert => {
      const safeId = escapeHtml(alert.id);
      return `
        <tr data-alert-id="${safeId}">
          <td>${safeId}</td>
          <td><i class="fas fa-bell-on"></i> ${escapeHtml(alert.type)}</td>
          <td>${escapeHtml(alert.location)}</td>
          <td><span class="pill ${alert.status === 'Active' ? 'warn' : 'ok'}">${escapeHtml(alert.status)}</span></td>
          <td><button class="btn resolve-btn" data-alert-id="${safeId}">Resolve</button></td>
        </tr>
      `;
    }).join('');

    document.querySelectorAll('#alerts-table .resolve-btn').forEach(btn => {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        window.alertSystem.resolveAlert(this.getAttribute('data-alert-id'));
      });
    });

    document.querySelectorAll('#alerts-table tbody tr').forEach(tr => {
      tr.addEventListener('click', () => {
        const alertId = tr.getAttribute('data-alert-id');
        selectAlert(alertId);
      });
    });
  }

  function renderRespondents() {
    const tbody = document.querySelector('#respondents-table tbody');
    tbody.innerHTML = alertSystem.users.map(user => {
      return `
        <tr>
          <td>${escapeHtml(user.name)}</td>
          <td>${escapeHtml(user.role)}</td>
          <td>${user.online ? 'Online' : 'Offline'}</td>
          <td>${escapeHtml(user.location)}</td>
          <td><button class="btn contact-btn" data-user-name="${escapeHtml(user.name)}">Contact</button></td>
        </tr>
      `;
    }).join('');

    document.querySelectorAll('#respondents-table .contact-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        alert('Contact ' + this.getAttribute('data-user-name'));
      });
    });
  }

  function renderLocationOptions() {
    const select = document.getElementById('alert-location');
    select.innerHTML = getLocationOptions();
  }

  renderLocationOptions();
  renderAlerts();
  renderRespondents();
  renderMapMarkers();
  updateSummary();

  if('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }

  window.alertSystem = alertSystem;

  var departments = {
    '911': 'Emergency Services (911)',
    'fire': 'Fire Department',
    'police': 'Police',
    'rescue': 'Rescue Team'
  };

  function closeCallModal() {
    document.getElementById('call-modal').style.display = 'none';
  }

  function closeAlertModal() {
    document.getElementById('alert-modal').style.display = 'none';
  }

  var callBtn = document.getElementById('call-btn');
  if (callBtn) {
    callBtn.addEventListener('click', function() {
      document.getElementById('call-modal').style.display = 'flex';
    });
  }

  var closeCallModalBtn = document.getElementById('close-call-modal-btn');
  if (closeCallModalBtn) {
    closeCallModalBtn.addEventListener('click', closeCallModal);
  }

  document.querySelectorAll('.call-btn[data-dept]').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var department = this.getAttribute('data-dept');
      var dept = departments[department] || department;
      alert('Initiating call to ' + dept + '...\n\nIn production, this would use a VoIP service to establish the call.');
      closeCallModal();
    });
  });

  var closeAlertModalBtn = document.getElementById('close-alert-modal-btn');
  if (closeAlertModalBtn) {
    closeAlertModalBtn.addEventListener('click', closeAlertModal);
  }

  var cancelAlertBtn = document.getElementById('cancel-alert-btn');
  if (cancelAlertBtn) {
    cancelAlertBtn.addEventListener('click', closeAlertModal);
  }

  document.getElementById('create-alert-btn').addEventListener('click', function() {
    document.getElementById('alert-modal').style.display = 'flex';
  });

  document.getElementById('submit-alert-btn').addEventListener('click', function() {
    var type = document.getElementById('alert-type').value;
    var location = document.getElementById('alert-location').value;
    var user = document.getElementById('alert-user').value.trim() || 'Community Member';
    alertSystem.addAlert(type, location, user);
    closeAlertModal();
  });

});

