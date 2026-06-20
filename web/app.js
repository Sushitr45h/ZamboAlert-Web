import { BARANGAY_LOCATIONS, DEFAULT_COORDS, STATUS_COLORS, DEPARTMENTS } from './constants.js';
import {
  formatTime,
  getAlertLocation,
  getLocationOptionsHTML,
  showModal,
  hideModal,
  requestNotificationPermission,
  sendNotification,
  initMap,
  clearMapMarkers,
} from './utils.js';

document.addEventListener('DOMContentLoaded', function () {
  const dashboardMap = initMap('tumaga-map');

  let selectedAlertId = null;

  function renderMapMarkers(highlightId = null) {
    if (!dashboardMap) return;
    clearMapMarkers(dashboardMap);

    alertSystem.alerts.forEach(alert => {
      const loc = getAlertLocation(alert);
      const isHighlighted = alert.id === highlightId;
      const marker = L.circleMarker([loc.lat, loc.lng], {
        radius: isHighlighted ? 14 : 10,
        color: '#ffffff',
        weight: isHighlighted ? 4 : 2,
        fillColor: STATUS_COLORS[alert.status] || STATUS_COLORS.Active,
        fillOpacity: 1,
      }).addTo(dashboardMap.map);

      marker.bindPopup(`
        <div style="color:#000;font-weight:600;">
          ${alert.type} SOS<br>
          <strong>${alert.location}</strong><br>
          Respondent: ${alert.respondent.name}<br>
          Status: ${alert.status}
        </div>
      `);

      marker.on('click', () => {
        selectAlert(alert.id);
      });

      dashboardMap.markers.push({ id: alert.id, marker });
    });
  }

  function selectAlert(alertId) {
    const selected = alertSystem.alerts.find(alert => alert.id === alertId);
    if (!selected) return;
    selectedAlertId = alertId;
    const loc = getAlertLocation(selected);
    dashboardMap.map.panTo([loc.lat, loc.lng]);
    renderMapMarkers(alertId);
    document.getElementById('active-user-name').textContent = selected.reportedBy;
    document.getElementById('active-user-status').textContent = selected.status;
    document.getElementById('active-sos-details').innerHTML = `
      <strong>Alert ID:</strong> ${selected.id}<br>
      <strong>Type:</strong> ${selected.type}<br>
      <strong>Location:</strong> ${selected.location}<br>
      <strong>Respondent:</strong> ${selected.respondent.name} (${selected.respondent.role})<br>
      <strong>Reported At:</strong> ${formatTime(selected.timestamp)}<br>
      <strong>Barangay:</strong> Tumaga
    `;
  }

  window.selectAlert = selectAlert;

  const alertSystem = {
    users: [
      { id: 'U01', name: 'Admin', role: 'Coordinator', online: true, location: 'Zone 2' },
      { id: 'U02', name: 'Maria Dela Cruz', role: 'Responder', online: true, location: 'Zone 3' },
      { id: 'U03', name: 'Juan Ramos', role: 'Responder', online: false, location: 'Brgy. San Roque' },
      { id: 'U04', name: 'Supervisor', role: 'Supervisor', online: true, location: 'Zone 1' },
    ],
    alerts: [
      { id: '#A102', type: 'Flood', location: 'Zone 3', status: 'Active', timestamp: new Date(), reportedBy: 'Community Member', respondent: { name: 'Maria Dela Cruz', role: 'Responder', location: 'Zone 3' } },
      { id: '#A101', type: 'Fire', location: 'Brgy. San Roque', status: 'Resolved', timestamp: new Date(Date.now() - 3600000), reportedBy: 'Witness', respondent: { name: 'Juan Ramos', role: 'Responder', location: 'Brgy. San Roque' } },
      { id: '#A100', type: 'Accident', location: 'Highway 7', status: 'Resolved', timestamp: new Date(Date.now() - 7200000), reportedBy: 'Traffic Watch', respondent: { name: 'Supervisor', role: 'Supervisor', location: 'Zone 1' } },
    ],
    addAlert: function (type, location, reportedBy) {
      const respondent = this.users.find(u => u.online && u.location === location) || { name: 'Nearby responder', role: 'Responder', location };
      const newAlert = {
        id: '#A' + Math.floor(100 + Math.random() * 900),
        type,
        location,
        status: 'Active',
        timestamp: new Date(),
        reportedBy,
        respondent,
      };
      this.alerts.unshift(newAlert);
      renderAlerts();
      renderRespondents();
      updateSummary();
      window.selectAlert(newAlert.id);
      sendNotification('ZamboAlert', `New ${type} alert in ${location}`);
      return newAlert;
    },
    resolveAlert: function (alertId) {
      const alert = this.alerts.find(a => a.id === alertId);
      if (alert) {
        alert.status = 'Resolved';
        updateSummary();
        renderAlerts();
        renderMapMarkers(selectedAlertId);
      }
    },
  };

  function updateSummary() {
    const activeCount = alertSystem.alerts.filter(alert => alert.status === 'Active').length;
    const resolvedCount = alertSystem.alerts.filter(alert => alert.status === 'Resolved').length;
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
      return `
        <tr data-alert-id="${alert.id}">
          <td>${alert.id}</td>
          <td><i class="fas fa-bell-on"></i> ${alert.type}</td>
          <td>${alert.location}</td>
          <td><span class="pill ${alert.status === 'Active' ? 'warn' : 'ok'}">${alert.status}</span></td>
          <td><button class="btn" onclick="window.alertSystem.resolveAlert('${alert.id}')">Resolve</button></td>
        </tr>
      `;
    }).join('');

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
          <td>${user.name}</td>
          <td>${user.role}</td>
          <td>${user.online ? 'Online' : 'Offline'}</td>
          <td>${user.location}</td>
          <td><button class="btn" onclick="alert('Contact ${user.name}');">Contact</button></td>
        </tr>
      `;
    }).join('');
  }

  function renderLocationOptions() {
    const select = document.getElementById('alert-location');
    if (select) select.innerHTML = getLocationOptionsHTML();
  }

  renderLocationOptions();
  renderAlerts();
  renderRespondents();
  renderMapMarkers();
  updateSummary();
  requestNotificationPermission();

  window.alertSystem = alertSystem;

  window.makeCall = function (department) {
    const dept = DEPARTMENTS[department] || department;
    alert(`Initiating call to ${dept}...\n\nIn production, this would use a VoIP service to establish the call.`);
  };

  window.closeAlertModal = function () {
    hideModal('alert-modal');
  };

  window.closeCallModal = function () {
    hideModal('call-modal');
  };

  const callBtn = document.getElementById('call-btn');
  if (callBtn) {
    callBtn.addEventListener('click', () => showModal('call-modal'));
  }

  const createAlertBtn = document.getElementById('create-alert-btn');
  if (createAlertBtn) {
    createAlertBtn.addEventListener('click', () => showModal('alert-modal'));
  }

  const submitAlertBtn = document.getElementById('submit-alert-btn');
  if (submitAlertBtn) {
    submitAlertBtn.addEventListener('click', () => {
      const type = document.getElementById('alert-type').value;
      const location = document.getElementById('alert-location').value;
      const user = document.getElementById('alert-user').value.trim() || 'Community Member';
      window.alertSystem.addAlert(type, location, user);
      window.closeAlertModal();
    });
  }
});
