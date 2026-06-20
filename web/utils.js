/**
 * Shared utility functions for ZamboAlert web application.
 * Eliminates duplicated helper logic across pages.
 */

import { BARANGAY_LOCATIONS, DEFAULT_COORDS } from './constants.js';

/** Format a Date to HH:MM string */
export function formatTime(date) {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

/** Resolve an alert's location name to coordinates */
export function getAlertLocation(alert) {
  return BARANGAY_LOCATIONS.find(loc => loc.name === alert.location) || { lat: DEFAULT_COORDS.lat, lng: DEFAULT_COORDS.lng };
}

/** Generate location <option> elements HTML from BARANGAY_LOCATIONS */
export function getLocationOptionsHTML() {
  return BARANGAY_LOCATIONS.map(loc => `<option value="${loc.name}">${loc.name}</option>`).join('');
}

/** Show/hide a modal element by ID */
export function showModal(modalId) {
  document.getElementById(modalId).style.display = 'flex';
}

/** Hide a modal element by ID */
export function hideModal(modalId) {
  document.getElementById(modalId).style.display = 'none';
}

/** Request browser notification permission if not already granted */
export function requestNotificationPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}

/** Send a browser notification (if granted) */
export function sendNotification(title, body) {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, {
      body,
      icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23dc2626"><polygon points="12,2 20,20 4,20"/></svg>',
    });
  }
}

/** Initialize a Leaflet map on a container element */
export function initMap(containerId, lat = DEFAULT_COORDS.lat, lng = DEFAULT_COORDS.lng) {
  const el = document.getElementById(containerId);
  if (!el) return null;
  const placeholder = el.querySelector('.map-placeholder');
  if (placeholder) placeholder.style.display = 'none';

  const map = L.map(containerId, { zoomControl: true, attributionControl: false }).setView([lat, lng], 14);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);

  return { map, markers: [] };
}

/** Clear all markers from a map instance */
export function clearMapMarkers(mapInstance) {
  mapInstance.markers.forEach(({ marker }) => mapInstance.map.removeLayer(marker));
  mapInstance.markers.length = 0;
}
