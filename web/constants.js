/**
 * Shared constants for ZamboAlert web application.
 * Single source of truth for location data, status colors, and configuration.
 */

export const DEFAULT_COORDS = { lat: 8.476, lng: 123.610 };

export const BARANGAY_LOCATIONS = [
  { name: 'Zone 1', lat: 8.4782, lng: 123.6095 },
  { name: 'Zone 2', lat: 8.4750, lng: 123.6130 },
  { name: 'Zone 3', lat: 8.4771, lng: 123.6070 },
  { name: 'Brgy. San Roque', lat: 8.4740, lng: 123.6080 },
  { name: 'Highway 7', lat: 8.4728, lng: 123.6124 },
];

export const ALERT_TYPES = ['Flood', 'Fire', 'Accident', 'Medical', 'Security'];

export const STATUS_COLORS = {
  Active: '#dc2626',
  Resolved: '#059669',
};

export const DEPARTMENTS = {
  '911': 'Emergency Services (911)',
  fire: 'Fire Department',
  police: 'Police',
  rescue: 'Rescue Team',
};
