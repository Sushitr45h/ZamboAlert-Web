// src/context/AppStateContext.js
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import * as Location from 'expo-location';

const AppStateContext = createContext(null);

const MOCK_PODS = [
  { id: 'pod-01', label: 'Pod-01', rssi: -58 },
  { id: 'pod-02', label: 'Pod-02', rssi: -74 },
];

export function AppStateProvider({ children }) {
  const [sosActive, setSosActive]       = useState(false);
  const [disasterType, setDisasterType] = useState(null); // 'earthquake' | 'flood' | 'fire'
  const [bluetoothOn]                   = useState(true);
  const [gpsLocked, setGpsLocked]       = useState(false);
  const [coords, setCoords]             = useState(null);
  const [nearbyPods, setNearbyPods]     = useState([]);
  const [log, setLog]                   = useState([
    { id: '1', type: 'info', message: 'App initialized', time: nowLabel() },
  ]);
  const pollRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;
        const pos = await Location.getCurrentPositionAsync({});
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGpsLocked(true);
      } catch (e) {
        setGpsLocked(false);
      }
    })();
  }, []);

  function addLog(type, message) {
    setLog((prev) => [{ id: String(Date.now()), type, message, time: nowLabel() }, ...prev]);
  }

  function startBeacon(type) {
    setSosActive(true);
    setDisasterType(type);
    addLog('sos', `SOS beacon started — ${type.toUpperCase()} emergency — broadcasting over BLE`);
    pollRef.current = setTimeout(() => {
      setNearbyPods(MOCK_PODS);
      addLog('detected', 'Detected by Pod-01 — bridged to LoRa mesh');
    }, 4000);
  }

  function stopBeacon() {
    setSosActive(false);
    setDisasterType(null);
    setNearbyPods([]);
    if (pollRef.current) clearTimeout(pollRef.current);
    addLog('info', 'SOS beacon stopped');
  }

  useEffect(() => () => pollRef.current && clearTimeout(pollRef.current), []);

  return (
    <AppStateContext.Provider
      value={{ sosActive, disasterType, bluetoothOn, gpsLocked, coords, nearbyPods, log, startBeacon, stopBeacon }}
    >
      {children}
    </AppStateContext.Provider>
  );
}

export function useAppState() {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error('useAppState must be used inside AppStateProvider');
  return ctx;
}

function nowLabel() {
  const d = new Date();
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
