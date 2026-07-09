import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  User,
  Shield,
  Activity,
  MapPin,
  Lock,
  Settings,
  LogOut,
  Bell,
  Save,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Search,
  Wifi,
  Globe,
  Sliders,
  Eye,
  EyeOff,
  Trash2,
  Plus,
  Map,
  Navigation,
  ArrowLeft,
  Info,
  Calendar,
  Layers,
  Battery,
  Signal,
  Check,
  X,
  FileText
} from "lucide-react";

export default function SettingsPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("account");

  // Success message toast state
  const [toastMsg, setToastMsg] = useState(null);
  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  // --- Account State ---
  const [profile, setProfile] = useState({
    name: "Admin Juan dela Cruz",
    email: "admin.tumaga@zamboalert.gov.ph",
    role: "BDRRM Officer - Tumaga Command",
    station: "Zone 4 Barangay Hall, Tumaga, Zamboanga City",
    joinedDate: "July 15, 2025"
  });

  const [rules, setRules] = useState({
    requireRescuerApproval: true,
    autoDispatchOnSOS: false,
    broadcastRadius: 1500, // meters
    allowGuestSOS: true
  });

  const [passwords, setPasswords] = useState({
    current: "",
    new: "",
    confirm: ""
  });
  const [showPassword, setShowPassword] = useState(false);

  const [notificationSettings, setNotificationSettings] = useState({
    emailAlerts: true,
    browserSound: true,
    highPrioritySMS: true,
    weeklyReport: false
  });

  const handleProfileSave = (e) => {
    e.preventDefault();
    showToast("Profile details updated successfully! (Mock)");
  };

  const handleSecuritySave = (e) => {
    e.preventDefault();
    if (passwords.new !== passwords.confirm) {
      alert("New password and confirm password do not match.");
      return;
    }
    showToast("Security settings updated successfully! (Mock)");
    setPasswords({ current: "", new: "", confirm: "" });
  };

  const handleToggleRule = async (key) => {
    const newValue = !rules[key];
    setRules((prev) => ({ ...prev, [key]: newValue }));

    let dbKey = key;
    if (key === "requireRescuerApproval") dbKey = "require_rescuer_approval";
    else if (key === "autoDispatchOnSOS") dbKey = "auto_dispatch_on_sos";
    else if (key === "broadcastRadius") dbKey = "broadcast_radius";
    else if (key === "allowGuestSOS") dbKey = "allow_guest_sos";

    try {
      const response = await fetch("http://localhost:5000/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: dbKey, value: newValue })
      });
      if (response.ok) {
        showToast(`Rule updated: ${key} is now ${newValue ? "Enabled" : "Disabled"}.`);
      } else {
        showToast("Failed to save setting in backend.");
      }
    } catch (err) {
      console.error("Failed to save rule setting", err);
      showToast("Error updating setting in backend database.");
    }
  };

  const handleToggleNotif = (key) => {
    setNotificationSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // --- Location & Map State ---
  const [lat, setLat] = useState("6.9214");
  const [lng, setLng] = useState("122.0790");
  const [radius, setRadius] = useState("1200");
  const [mapType, setMapType] = useState("street"); // street vs satellite

  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const circleRef = useRef(null);
  const tileLayerRef = useRef(null);

  // Initialize Map when activeTab becomes 'location'
  useEffect(() => {
    if (activeTab !== "location" || !mapContainerRef.current) return;

    // Small delay to ensure container is fully rendered and sized
    const timer = setTimeout(() => {
      if (mapRef.current) return;

      const initialLat = parseFloat(lat) || 6.9214;
      const initialLng = parseFloat(lng) || 122.0790;
      const initialRadius = parseFloat(radius) || 1200;

      const map = L.map(mapContainerRef.current, {
        zoomControl: true,
        attributionControl: false
      }).setView([initialLat, initialLng], 14);

      const url = mapType === "satellite"
        ? "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
        : "https://{s}.basemaps.cartocdn.com/rastertiles/light_all/{z}/{x}/{y}.png";

      const tileLayer = L.tileLayer(url, { maxZoom: 19 }).addTo(map);
      tileLayerRef.current = tileLayer;
      mapRef.current = map;

      // Add center marker
      const marker = L.marker([initialLat, initialLng], {
        draggable: true
      }).addTo(map);
      markerRef.current = marker;

      // Add geofence boundary circle
      const circle = L.circle([initialLat, initialLng], {
        color: "#dc2626",
        fillColor: "#fca5a5",
        fillOpacity: 0.15,
        weight: 2,
        dashArray: "5, 5",
        radius: initialRadius
      }).addTo(map);
      circleRef.current = circle;

      // Map Click to change coordinates
      map.on("click", (e) => {
        const { lat: clickLat, lng: clickLng } = e.latlng;
        setLat(clickLat.toFixed(6));
        setLng(clickLng.toFixed(6));
      });

      // Marker drag to change coordinates
      marker.on("dragend", () => {
        const position = marker.getLatLng();
        setLat(position.lat.toFixed(6));
        setLng(position.lng.toFixed(6));
      });
    }, 100);

    return () => {
      clearTimeout(timer);
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
        circleRef.current = null;
        tileLayerRef.current = null;
      }
    };
  }, [activeTab]);

  // Update map center and circle when coordinates/radius or map type changes
  useEffect(() => {
    if (!mapRef.current) return;

    const parsedLat = parseFloat(lat);
    const parsedLng = parseFloat(lng);
    const parsedRad = parseFloat(radius);

    if (isNaN(parsedLat) || isNaN(parsedLng)) return;

    const newLatLng = [parsedLat, parsedLng];

    if (markerRef.current) {
      markerRef.current.setLatLng(newLatLng);
    }

    if (circleRef.current && !isNaN(parsedRad)) {
      circleRef.current.setLatLng(newLatLng);
      circleRef.current.setRadius(parsedRad);
    }

    mapRef.current.panTo(newLatLng);
  }, [lat, lng, radius]);

  // Change Map tile layer type
  useEffect(() => {
    if (!mapRef.current) return;

    if (tileLayerRef.current) {
      mapRef.current.removeLayer(tileLayerRef.current);
    }

    const url = mapType === "satellite"
      ? "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
      : "https://{s}.basemaps.cartocdn.com/rastertiles/light_all/{z}/{x}/{y}.png";

    const tileLayer = L.tileLayer(url, { maxZoom: 19 }).addTo(mapRef.current);
    tileLayerRef.current = tileLayer;
  }, [mapType]);

  // Initial backend fetch for settings & rescuers
  useEffect(() => {
    const fetchBackendSettings = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/settings");
        if (response.ok) {
          const data = await response.json();
          setRules((prev) => ({
            ...prev,
            requireRescuerApproval: data.requireRescuerApproval !== undefined ? data.requireRescuerApproval : prev.requireRescuerApproval,
            autoDispatchOnSOS: data.auto_dispatch_on_sos !== undefined ? data.auto_dispatch_on_sos === "1" || data.auto_dispatch_on_sos === true : prev.autoDispatchOnSOS,
            broadcastRadius: data.broadcast_radius !== undefined ? parseInt(data.broadcast_radius) : prev.broadcastRadius,
            allowGuestSOS: data.allow_guest_sos !== undefined ? data.allow_guest_sos === "1" || data.allow_guest_sos === true : prev.allowGuestSOS,
          }));
        }
      } catch (err) {
        console.error("Failed to fetch settings from backend", err);
      }
    };

    fetchBackendSettings();
    fetchRescuers();
  }, []);

  // Fetch rescuers when activeTab switches to 'rescuers'
  useEffect(() => {
    if (activeTab === "rescuers") {
      fetchRescuers();
    }
  }, [activeTab]);

  const handleLocationSave = (e) => {
    e.preventDefault();
    showToast(`Barangay Geofence configuration updated! Radius: ${radius}m.`);
  };

  const handleRecenterMap = () => {
    setLat("6.9214");
    setLng("122.0790");
    setRadius("1200");
    if (mapRef.current) {
      mapRef.current.setView([6.9214, 122.0790], 14);
    }
    showToast("Reset map to default Tumaga Barangay Hall coordinates.");
  };

  // --- Admin Activity Logs Mock Data ---
  const [activitySearch, setActivitySearch] = useState("");
  
  const mockActivityLogs = [
    { id: "ACT-849", timestamp: "2026-07-10 09:42:15", operator: "Admin Juan", action: "Admin password change", detail: "Password successfully updated", status: "success", ip: "192.168.1.105" },
    { id: "ACT-848", timestamp: "2026-07-10 08:15:30", operator: "Admin Juan", action: "Update geofence radius", detail: "Expanded boundary radius from 1000m to 1200m", status: "success", ip: "192.168.1.105" },
    { id: "ACT-847", timestamp: "2026-07-09 18:22:11", operator: "Admin Juan", action: "Approved Rescuer Unit", detail: "Verified Registration request for 'Medic Unit 1'", status: "success", ip: "192.168.1.105" },
    { id: "ACT-846", timestamp: "2026-07-09 16:54:02", operator: "Admin Juan", action: "Toggle Onboarding Rule", detail: "Enabled 'Require Administrator Approval' for new rescuers", status: "success", ip: "192.168.1.105" },
    { id: "ACT-844", timestamp: "2026-07-08 11:05:44", operator: "Admin Juan", action: "Incident Dispatch", detail: "Dispatched Rescue Team Alpha to SOS #42 (Flood Alert, Zone 5)", status: "success", ip: "192.168.1.108" },
    { id: "ACT-843", timestamp: "2026-07-08 10:55:12", operator: "Admin Juan", action: "Failed login attempt", detail: "Incorrect password for username: admin_juan", status: "failed", ip: "112.198.88.22" },
    { id: "ACT-842", timestamp: "2026-07-07 14:12:09", operator: "Admin Juan", action: "Resigned Rescuer Removed", detail: "Archived account for Rescuer Unit 'Rescue Team Gamma'", status: "warning", ip: "192.168.1.105" }
  ];

  const filteredActivities = mockActivityLogs.filter((log) => {
    const matchesSearch = log.action.toLowerCase().includes(activitySearch.toLowerCase()) || 
                          log.detail.toLowerCase().includes(activitySearch.toLowerCase()) || 
                          log.id.toLowerCase().includes(activitySearch.toLowerCase()) ||
                          log.operator.toLowerCase().includes(activitySearch.toLowerCase());
    return matchesSearch;
  });

  // Database Rescuer States and Handlers
  const [rescuerSubTab, setRescuerSubTab] = useState("accounts"); // 'accounts' or 'telemetry'
  const [dbRescuers, setDbRescuers] = useState([]);
  const [isFetchingRescuers, setIsFetchingRescuers] = useState(false);
  const [selectedRescuerForReview, setSelectedRescuerForReview] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [accountsSearch, setAccountsSearch] = useState("");
  const [accountsFilter, setAccountsFilter] = useState("all"); // 'all', 'pending', 'verified'

  const fetchRescuers = async () => {
    setIsFetchingRescuers(true);
    try {
      const response = await fetch("http://localhost:5000/api/rescuers");
      if (response.ok) {
        const data = await response.json();
        setDbRescuers(data);
      }
    } catch (err) {
      console.error("Failed to fetch rescuers", err);
    } finally {
      setIsFetchingRescuers(false);
    }
  };

  const handleVerifyRescuer = async (id) => {
    try {
      const response = await fetch(`http://localhost:5000/api/rescuers/verify/${id}`, {
        method: "POST"
      });
      if (response.ok) {
        showToast("Rescuer verified and approved successfully.");
        fetchRescuers();
        if (selectedRescuerForReview && selectedRescuerForReview.id === id) {
          setSelectedRescuerForReview(prev => prev ? { ...prev, is_verified: 1, status: "available" } : null);
        }
      } else {
        const errData = await response.json();
        alert(errData.message || "Failed to verify rescuer");
      }
    } catch (err) {
      console.error("Connection error", err);
      alert("Failed to connect to backend server");
    }
  };

  const handleRejectRescuer = async (id) => {
    if (!window.confirm("Are you sure you want to reject and delete this rescuer account request?")) {
      return;
    }
    try {
      const response = await fetch(`http://localhost:5000/api/rescuers/${id}`, {
        method: "DELETE"
      });
      if (response.ok) {
        showToast("Rescuer registration rejected and account deleted.");
        fetchRescuers();
        setShowReviewModal(false);
        setSelectedRescuerForReview(null);
      } else {
        const errData = await response.json();
        alert(errData.message || "Failed to delete rescuer account");
      }
    } catch (err) {
      console.error("Connection error", err);
      alert("Failed to connect to backend server");
    }
  };

  const [rescuerSearch, setRescuerSearch] = useState("");
  const [rescuerFilter, setRescuerFilter] = useState("all");

  const mockRescuerLogs = [
    { id: "RL-501", timestamp: "2026-07-10 10:12:00", unit: "Rescue Team Alpha", type: "GPS Ping", battery: 94, signal: -58, status: "online", notes: "Coordinates [6.9220, 122.0800] - Stable link" },
    { id: "RL-502", timestamp: "2026-07-10 10:09:44", unit: "Medic Unit 1", type: "Status Change", battery: 78, signal: -62, status: "online", notes: "Changed status to AVAILABLE" },
    { id: "RL-503", timestamp: "2026-07-10 10:05:12", unit: "Rescue Team Beta", type: "Low Battery Warning", battery: 15, signal: -75, status: "warning", notes: "Critical battery: 15%. Charger recommended" },
    { id: "RL-504", timestamp: "2026-07-10 09:59:30", unit: "Rescue Team Alpha", type: "SOS Dispatch", battery: 95, signal: -60, status: "busy", notes: "Accepted assignment for SOS alert #45" },
    { id: "RL-505", timestamp: "2026-07-10 09:30:12", unit: "Medic Unit 1", type: "Network Reconnect", battery: 80, signal: -45, status: "online", notes: "Reconnected to Gateway GW-01" },
    { id: "RL-506", timestamp: "2026-07-10 09:12:45", unit: "Rescue Team Beta", type: "GPS Ping", battery: 20, signal: -82, status: "warning", notes: "Weak signal detected from Zone 7 Boundary" },
    { id: "RL-507", timestamp: "2026-07-10 08:45:00", unit: "Rescue Team Gamma", type: "Disconnect", battery: 52, signal: -98, status: "offline", notes: "Connection timed out. Last seen 15m ago" },
    { id: "RL-508", timestamp: "2026-07-10 08:30:11", unit: "Medic Unit 1", type: "Registration Approval", battery: 100, signal: -52, status: "online", notes: "Successfully verified and onboarded to tactical dashboard" }
  ];

  const filteredRescuers = mockRescuerLogs.filter((log) => {
    const matchesSearch = log.unit.toLowerCase().includes(rescuerSearch.toLowerCase()) || 
                          log.notes.toLowerCase().includes(rescuerSearch.toLowerCase()) ||
                          log.type.toLowerCase().includes(rescuerSearch.toLowerCase());
    const matchesFilter = rescuerFilter === "all" || log.status === rescuerFilter;
    return matchesSearch && matchesFilter;
  });

  const handleLogout = () => {
    localStorage.removeItem("zamboalert_auth");
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans relative antialiased">
      {/* Toast Alert */}
      {toastMsg && (
        <div className="fixed bottom-5 right-5 z-[9999] bg-slate-900 border border-slate-800 text-white px-4 py-3 rounded-lg shadow-xl shadow-slate-900/20 flex items-center gap-2.5 max-w-sm animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Check size={12} strokeWidth={3} />
          </div>
          <span className="text-[11px] font-medium tracking-wide">{toastMsg}</span>
        </div>
      )}

      {/* --- Top Navbar --- */}
      <header className="bg-white border-b border-red-100/60 sticky top-0 z-[100] h-12 flex items-center px-4 justify-between select-none">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center justify-center w-7 h-7 rounded hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer border border-slate-100"
            title="Back to Tactical Dashboard"
          >
            <ArrowLeft size={16} />
          </button>
          <div className="h-4 w-px bg-slate-200" />
          <div className="flex items-center gap-2">
            <Settings size={15} className="text-red-600 animate-spin-slow" />
            <span className="text-xs font-bold font-mono tracking-wider uppercase text-slate-900">
              ZamboAlert
            </span>
            <span className="text-[10px] font-semibold bg-red-50 text-red-700 border border-red-100/70 px-1.5 py-0.5 rounded font-mono uppercase tracking-widest">
              Settings Panel
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex flex-col text-right">
            <span className="text-[10px] font-bold text-slate-700 leading-tight">Barangay Tumaga Control</span>
            <span className="text-[8px] font-mono text-slate-500 tracking-wider">Zamboanga City, PH</span>
          </div>
        </div>
      </header>

      {/* --- Main Dashboard Container --- */}
      <main className="flex-grow max-w-7xl w-full mx-auto p-4 md:p-6 flex flex-col md:flex-row gap-6">
        {/* --- Side Tab Navigation --- */}
        <aside className="w-full md:w-64 flex-shrink-0 flex flex-col gap-4">
          <div className="bg-white rounded-xl border border-slate-200/60 p-4 shadow-sm">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <div className="w-10 h-10 rounded-full bg-red-50 border border-red-100 flex items-center justify-center text-red-600 font-bold text-xs uppercase font-mono shadow-xs">
                {profile.name.split(" ").map(n => n[0]).join("")}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-xs font-bold text-slate-900 truncate">{profile.name}</h3>
                <span className="text-[9px] font-mono font-medium text-slate-500 uppercase tracking-wide block truncate">
                  {profile.role.split(" - ")[0]}
                </span>
              </div>
            </div>

            <nav className="flex flex-row md:flex-col gap-1 mt-4 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
              {[
                { id: "account", label: "Account & System", icon: User },
                { id: "activity", label: "Admin Activity Logs", icon: Activity },
                { id: "rescuers", label: "Rescuer Logs", icon: Shield },
                { id: "location", label: "Location & Geofence", icon: MapPin }
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer whitespace-nowrap md:w-full border ${
                      isActive
                        ? "bg-red-50 text-red-800 border-red-100/70 shadow-xs"
                        : "bg-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50 border-transparent"
                    }`}
                  >
                    <Icon size={14} className={isActive ? "text-red-600" : "text-slate-500"} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
              
              <button
                onClick={handleLogout}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-bold tracking-wide transition-all cursor-pointer whitespace-nowrap md:w-full border bg-red-600 hover:bg-red-700 text-white border-red-600 shadow-xs md:mt-2"
              >
                <LogOut size={14} className="text-white" />
                <span>Logout</span>
              </button>
            </nav>
          </div>

          <div className="hidden md:flex bg-gradient-to-br from-red-900 to-red-950 rounded-xl p-4 text-white border border-red-800/20 shadow-lg relative overflow-hidden">
            <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-y-4 translate-x-4">
              <Settings size={180} />
            </div>
            <h4 className="text-[10px] font-bold tracking-widest uppercase text-red-300 font-mono flex items-center gap-1.5">
              <Sliders size={10} /> System Mode
            </h4>
            <p className="text-xs font-medium mt-2 leading-relaxed text-slate-200">
              Mesh nodes and LoRa sensors are operating normally. Dispatches are tracked locally.
            </p>
            <div className="flex items-center gap-2 mt-4 text-[9px] font-mono text-red-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Local LoRa Gateway Active
            </div>
          </div>
        </aside>

        {/* --- Main Settings Panel Content --- */}
        <section className="flex-1 flex flex-col min-w-0">
          <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm p-5 flex-grow flex flex-col min-h-[550px]">
            
            {/* TABS CONTAINER */}
            <div className="flex-grow flex flex-col">
              
              {/* --- TAB 1: ACCOUNT & SYSTEM --- */}
              {activeTab === "account" && (
                <div className="space-y-6 animate-in fade-in-30 duration-200 flex-grow">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-mono">
                      Account & System Administration
                    </h2>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Manage administrator profiles, system behavior settings, password security, and alerts dispatch rules.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Profile Admin Card */}
                    <div className="border border-slate-100 rounded-xl p-4 bg-slate-50/50 space-y-4">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                        <span className="text-[10px] font-bold text-slate-700 tracking-wider uppercase font-mono">
                          Administrator Profile
                        </span>
                        <User size={13} className="text-slate-400" />
                      </div>
                      <form onSubmit={handleProfileSave} className="space-y-3.5">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase">Administrator Name</label>
                          <input
                            type="text"
                            value={profile.name}
                            onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                            className="w-full bg-white border border-slate-200/80 rounded px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-red-500/30 focus:border-red-500"
                            placeholder="Full name"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase">Government Email</label>
                          <input
                            type="email"
                            value={profile.email}
                            onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                            className="w-full bg-white border border-slate-200/80 rounded px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-red-500/30 focus:border-red-500"
                            placeholder="Email address"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase">Role / Title</label>
                          <input
                            type="text"
                            value={profile.role}
                            onChange={(e) => setProfile({ ...profile, role: e.target.value })}
                            className="w-full bg-white border border-slate-200/80 rounded px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-red-500/30 focus:border-red-500"
                            placeholder="Role or Office title"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase">Assigned Base / Station</label>
                          <input
                            type="text"
                            value={profile.station}
                            onChange={(e) => setProfile({ ...profile, station: e.target.value })}
                            className="w-full bg-white border border-slate-200/80 rounded px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-red-500/30 focus:border-red-500"
                            placeholder="Command center details"
                          />
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-1">
                          <span>Joined: {profile.joinedDate}</span>
                        </div>
                        <button
                          type="submit"
                          className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-semibold tracking-wide transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <Save size={12} />
                          Save Profile Changes
                        </button>
                      </form>
                    </div>

                    {/* Rescuer Rules Card */}
                    <div className="space-y-6">
                      <div className="border border-slate-100 rounded-xl p-4 bg-slate-50/50 space-y-4">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                          <span className="text-[10px] font-bold text-slate-700 tracking-wider uppercase font-mono">
                            Rescuer Onboarding Rules
                          </span>
                          <Sliders size={13} className="text-slate-400" />
                        </div>
                        
                        <div className="space-y-4">
                          <div className="flex items-start gap-3">
                            <input
                              type="checkbox"
                              id="require-approval-settings"
                              checked={rules.requireRescuerApproval}
                              onChange={() => handleToggleRule("requireRescuerApproval")}
                              className="mt-0.5 rounded border-slate-300 text-red-600 focus:ring-red-500 cursor-pointer"
                            />
                            <label htmlFor="require-approval-settings" className="flex-1 text-[10px] text-slate-600 leading-tight cursor-pointer font-sans">
                              <span className="font-bold text-slate-900 block uppercase mb-0.5">Require Admin Approval</span>
                              When enabled, rescuers signing up via the mobile application require manual admin review and approval before they can be dispatched.
                            </label>
                          </div>

                          <div className="flex items-start gap-3">
                            <input
                              type="checkbox"
                              id="auto-dispatch-settings"
                              checked={rules.autoDispatchOnSOS}
                              onChange={() => handleToggleRule("autoDispatchOnSOS")}
                              className="mt-0.5 rounded border-slate-300 text-red-600 focus:ring-red-500 cursor-pointer"
                            />
                            <label htmlFor="auto-dispatch-settings" className="flex-1 text-[10px] text-slate-600 leading-tight cursor-pointer font-sans">
                              <span className="font-bold text-slate-900 block uppercase mb-0.5">Auto-Route & Dispatch SOS</span>
                              When enabled, the nearest available verified rescuer unit will automatically receive dispatch orders immediately upon SOS detection.
                            </label>
                          </div>                          
                        </div>
                      </div>

                      {/* Security Card */}
                      <div className="border border-slate-100 rounded-xl p-4 bg-slate-50/50 space-y-4">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                          <span className="text-[10px] font-bold text-slate-700 tracking-wider uppercase font-mono">
                            Security Settings
                          </span>
                          <Lock size={13} className="text-slate-400" />
                        </div>
                        <form onSubmit={handleSecuritySave} className="space-y-3">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase">Current Password</label>
                            <input
                              type="password"
                              value={passwords.current}
                              onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                              className="w-full bg-white border border-slate-200/80 rounded px-2.5 py-1.2 text-xs focus:outline-none focus:ring-1 focus:ring-red-500/30 focus:border-red-500"
                              placeholder="••••••••"
                              required
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-slate-500 uppercase">New Password</label>
                              <input
                                type="password"
                                value={passwords.new}
                                onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                                className="w-full bg-white border border-slate-200/80 rounded px-2.5 py-1.2 text-xs focus:outline-none focus:ring-1 focus:ring-red-500/30 focus:border-red-500"
                                placeholder="Min. 8 characters"
                                required
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-slate-500 uppercase">Confirm Password</label>
                              <input
                                type="password"
                                value={passwords.confirm}
                                onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                                className="w-full bg-white border border-slate-200/80 rounded px-2.5 py-1.2 text-xs focus:outline-none focus:ring-1 focus:ring-red-500/30 focus:border-red-500"
                                placeholder="Re-enter password"
                                required
                              />
                            </div>
                          </div>

                          <button
                            type="submit"
                            className="w-full py-2 bg-red-700 hover:bg-red-800 text-white rounded text-xs font-semibold tracking-wide transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            <Lock size={12} />
                            Change Admin Password
                          </button>
                        </form>
                      </div>
                    </div>
                  </div>

                  {/* System Notifications & System Actions */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                    <div className="space-y-4">
                      <span className="text-[10px] font-bold text-slate-700 tracking-wider uppercase font-mono block">
                        Sound & Alert Notifications
                      </span>
                      <div className="space-y-3.5 bg-slate-50/20 p-4 border border-slate-100 rounded-xl">
                        {[
                          { id: "emailAlerts", label: "Incident Email Alerts", desc: "Receive email reports for every unresolved critical incident." },
                          { id: "browserSound", label: "Browser Alert Alarm", desc: "Play critical sirens/beeps on tactical dashboard during SOS triggers." },
                          { id: "highPrioritySMS", label: "Urgent SMS Announcements", desc: "Mirror SOS notifications to community council mobile phones." },
                          { id: "weeklyReport", label: "Weekly Dispatch Report", desc: "Email automated weekly stats logs to Barangay Captain." }
                        ].map((notif) => (
                          <div key={notif.id} className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <span className="text-[10.5px] font-bold text-slate-900 block">{notif.label}</span>
                              <span className="text-[9px] text-slate-500 block leading-tight mt-0.5">{notif.desc}</span>
                            </div>
                            <button
                              onClick={() => handleToggleNotif(notif.id)}
                              className={`relative inline-flex h-4.5 w-8 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                notificationSettings[notif.id] ? "bg-red-600" : "bg-slate-300"
                              }`}
                            >
                              <span
                                className={`pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                                  notificationSettings[notif.id] ? "translate-x-3.5" : "translate-x-0"
                                }`}
                              />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* --- TAB 2: ACTIVITY LOG --- */}
              {activeTab === "activity" && (
                <div className="space-y-5 animate-in fade-in-30 duration-200 flex-grow flex flex-col">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-mono">
                        Admin Activity Logs
                      </h2>
                      <p className="text-[11px] text-slate-500 mt-1">
                        History of administrative system settings, security changes, and dispatch operations.
                      </p>
                    </div>
                    
                    <button
                      onClick={() => showToast("Refreshing admin activity database... (Mock)")}
                      className="self-start sm:self-auto flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 text-[10px] font-bold tracking-wider uppercase rounded transition-colors shadow-xs cursor-pointer font-mono"
                    >
                      <RefreshCw size={10} />
                      Refresh
                    </button>
                  </div>

                  {/* Activity Search */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1 relative">
                      <Search className="absolute left-2.5 top-2.5 text-slate-400" size={13} />
                      <input
                        type="text"
                        placeholder="Search logs by operator, ID, or action..."
                        value={activitySearch}
                        onChange={(e) => setActivitySearch(e.target.value)}
                        className="w-full bg-slate-50/50 border border-slate-200/80 rounded pl-8.5 pr-3 py-1.8 text-xs focus:outline-none focus:ring-1 focus:ring-red-500/30 focus:border-red-500 placeholder-slate-400"
                      />
                    </div>
                  </div>

                  {/* Table Layout */}
                  <div className="border border-slate-200/70 rounded-xl overflow-hidden flex-grow bg-white min-h-[300px]">
                    <div className="overflow-x-auto">
                      <table className="w-full text-[10.5px] text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-250 font-mono text-[9px] uppercase tracking-wider text-slate-500">
                            <th className="p-3 pl-4">Log ID</th>
                            <th className="p-3">Timestamp</th>
                            <th className="p-3">Operator</th>
                            <th className="p-3">Action</th>
                            <th className="p-3">Details</th>
                            <th className="p-3">IP Address</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-mono">
                          {filteredActivities.length === 0 ? (
                            <tr>
                              <td colSpan="6" className="p-8 text-center text-slate-400 italic">
                                No admin activity logs found.
                              </td>
                            </tr>
                          ) : (
                            filteredActivities.map((log) => (
                              <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                                <td className="p-3 pl-4 font-bold text-red-900">{log.id}</td>
                                <td className="p-3 text-slate-500 whitespace-nowrap">{log.timestamp}</td>
                                <td className="p-3 font-semibold text-slate-800">{log.operator}</td>
                                <td className="p-3 font-medium text-slate-900 whitespace-nowrap">{log.action}</td>
                                <td className="p-3 text-slate-600 max-w-xs truncate" title={log.detail}>{log.detail}</td>
                                <td className="p-3 text-slate-400">{log.ip}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-[9px] text-slate-400 font-mono px-1">
                    <span>Showing {filteredActivities.length} logs of {mockActivityLogs.length} entries</span>
                    <span>Database Engine: SQLite (Local Offline Cache)</span>
                  </div>
                </div>
              )}

              {/* --- TAB 3: RESCUER LOGS & ACCOUNT MANAGEMENT --- */}
              {activeTab === "rescuers" && (
                <div className="space-y-5 animate-in fade-in-30 duration-200 flex-grow flex flex-col">
                  
                  {/* Tab Title and Description */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-mono">
                        Rescuer Account & Log Management
                      </h2>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Verify registered rescuer identity submissions, approve mobile access requests, and review telemetry/signals.
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => fetchRescuers()}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 text-[10px] font-bold tracking-wider uppercase rounded transition-colors shadow-xs cursor-pointer font-mono"
                      >
                        <RefreshCw size={10} className={isFetchingRescuers ? "animate-spin" : ""} />
                        Refresh Data
                      </button>
                    </div>
                  </div>

                  {/* Sub-tab selection */}
                  <div className="flex border-b border-slate-200">
                    <button
                      type="button"
                      onClick={() => setRescuerSubTab("accounts")}
                      className={`pb-2.5 px-4 text-[10.5px] font-mono font-bold uppercase border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
                        rescuerSubTab === "accounts"
                          ? "border-red-750 text-red-800 font-extrabold"
                          : "border-transparent text-slate-400 hover:text-slate-600"
                      }`}
                    >
                      <User size={13} />
                      Rescuer Accounts
                      {dbRescuers.some(r => !r.is_verified) && (
                        <span className="ml-1 bg-amber-500 text-white text-[8px] font-sans font-bold px-1.5 py-0.5 rounded-full animate-pulse">
                          {dbRescuers.filter(r => !r.is_verified).length} PENDING
                        </span>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setRescuerSubTab("telemetry")}
                      className={`pb-2.5 px-4 text-[10.5px] font-mono font-bold uppercase border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
                        rescuerSubTab === "telemetry"
                          ? "border-red-750 text-red-800 font-extrabold"
                          : "border-transparent text-slate-400 hover:text-slate-600"
                      }`}
                    >
                      <Wifi size={13} />
                      Telemetry & Connectivity Logs
                    </button>
                  </div>

                  {/* SUBTAB 1: ACCOUNT VERIFICATION */}
                  {rescuerSubTab === "accounts" && (
                    <div className="space-y-4 flex-grow flex flex-col">
                      
                      {/* Stats cards for rescuer accounts */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="bg-white border border-slate-200/85 p-3.5 rounded-xl flex items-center justify-between shadow-xs">
                          <div>
                            <span className="text-[9px] font-bold text-slate-400 uppercase font-mono block">Total Registered</span>
                            <span className="text-xl font-bold text-slate-800 font-mono mt-0.5 block">{dbRescuers.length}</span>
                          </div>
                          <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                            <User size={18} />
                          </div>
                        </div>

                        <div className={`p-3.5 rounded-xl border flex items-center justify-between shadow-xs transition-colors ${
                          dbRescuers.some(r => !r.is_verified) 
                            ? "bg-amber-50/40 border-amber-205 text-amber-805" 
                            : "bg-white border-slate-200/85 text-slate-800"
                        }`}>
                          <div>
                            <span className="text-[9px] font-bold text-slate-400 uppercase font-mono block">Pending Verification</span>
                            <span className="text-xl font-bold font-mono mt-0.5 block">
                              {dbRescuers.filter(r => !r.is_verified).length}
                            </span>
                          </div>
                          <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                            dbRescuers.some(r => !r.is_verified)
                              ? "bg-amber-100/60 text-amber-600 animate-pulse"
                              : "bg-slate-100 text-slate-500"
                          }`}>
                            <AlertTriangle size={18} />
                          </div>
                        </div>

                        <div className="bg-emerald-50/20 border border-emerald-100/80 p-3.5 rounded-xl flex items-center justify-between shadow-xs text-emerald-800">
                          <div>
                            <span className="text-[9px] font-bold text-emerald-600/70 uppercase font-mono block">Verified Rescuers</span>
                            <span className="text-xl font-bold text-emerald-700 font-mono mt-0.5 block">
                              {dbRescuers.filter(r => r.is_verified).length}
                            </span>
                          </div>
                          <div className="w-9 h-9 rounded-lg bg-emerald-100/50 flex items-center justify-center text-emerald-600">
                            <CheckCircle size={18} />
                          </div>
                        </div>
                      </div>

                      {/* Filter & Search Bar */}
                      <div className="flex flex-col sm:flex-row gap-3">
                        <div className="flex-1 relative">
                          <Search className="absolute left-2.5 top-2.5 text-slate-400" size={13} />
                          <input
                            type="text"
                            placeholder="Search accounts by name, email, phone or ID..."
                            value={accountsSearch}
                            onChange={(e) => setAccountsSearch(e.target.value)}
                            className="w-full bg-slate-50/50 border border-slate-205 rounded pl-8.5 pr-3 py-1.8 text-xs focus:outline-none focus:ring-1 focus:ring-red-500/30 focus:border-red-500 placeholder-slate-400"
                          />
                        </div>
                        <div className="flex gap-2">
                          {["all", "pending", "verified"].map((status) => (
                            <button
                              key={status}
                              type="button"
                              onClick={() => setAccountsFilter(status)}
                              className={`px-3 py-1.8 border rounded text-[9.5px] font-bold font-mono tracking-wider uppercase transition-all cursor-pointer ${
                                accountsFilter === status
                                  ? "bg-red-700 text-white border-red-700 shadow-xs"
                                  : "bg-white text-slate-650 hover:text-slate-900 border-slate-200"
                              }`}
                            >
                              {status}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Rescuers Table */}
                      <div className="border border-slate-200/70 rounded-xl overflow-hidden flex-grow bg-white min-h-[300px]">
                        <div className="overflow-x-auto">
                          <table className="w-full text-[10.5px] text-left border-collapse">
                            <thead>
                              <tr className="bg-slate-50 border-b border-slate-250 font-mono text-[9px] uppercase tracking-wider text-slate-500">
                                <th className="p-3 pl-4">ID</th>
                                <th className="p-3">Rescuer Details</th>
                                <th className="p-3">Phone</th>
                                <th className="p-3">Document Info</th>
                                <th className="p-3">Status</th>
                                <th className="p-3 text-right pr-4">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-mono">
                              {isFetchingRescuers ? (
                                <tr>
                                  <td colSpan="6" className="p-8 text-center text-slate-400 italic">
                                    Fetching registered rescuer accounts from SQLite database...
                                  </td>
                                </tr>
                              ) : dbRescuers.length === 0 ? (
                                <tr>
                                  <td colSpan="6" className="p-8 text-center text-slate-400 italic">
                                    No registered rescuer accounts found.
                                  </td>
                                </tr>
                              ) : dbRescuers.filter((rescuer) => {
                                const fullName = `${rescuer.first_name || ""} ${rescuer.last_name || ""}`.toLowerCase();
                                const email = (rescuer.email || "").toLowerCase();
                                const idNumber = (rescuer.id_number || "").toLowerCase();
                                const idType = (rescuer.id_type || "").toLowerCase();
                                const phone = (rescuer.phone_number || "").toLowerCase();
                                const matchesSearch = fullName.includes(accountsSearch.toLowerCase()) || 
                                                      email.includes(accountsSearch.toLowerCase()) ||
                                                      idNumber.includes(accountsSearch.toLowerCase()) ||
                                                      idType.includes(accountsSearch.toLowerCase()) ||
                                                      phone.includes(accountsSearch.toLowerCase());
                                const matchesFilter = accountsFilter === "all" || 
                                                      (accountsFilter === "pending" && !rescuer.is_verified) || 
                                                      (accountsFilter === "verified" && rescuer.is_verified);
                                return matchesSearch && matchesFilter;
                              }).length === 0 ? (
                                <tr>
                                  <td colSpan="6" className="p-8 text-center text-slate-400 italic">
                                    No rescuer accounts match the selected filters.
                                  </td>
                                </tr>
                              ) : (
                                dbRescuers
                                  .filter((rescuer) => {
                                    const fullName = `${rescuer.first_name || ""} ${rescuer.last_name || ""}`.toLowerCase();
                                    const email = (rescuer.email || "").toLowerCase();
                                    const idNumber = (rescuer.id_number || "").toLowerCase();
                                    const idType = (rescuer.id_type || "").toLowerCase();
                                    const phone = (rescuer.phone_number || "").toLowerCase();
                                    const matchesSearch = fullName.includes(accountsSearch.toLowerCase()) || 
                                                          email.includes(accountsSearch.toLowerCase()) ||
                                                          idNumber.includes(accountsSearch.toLowerCase()) ||
                                                          idType.includes(accountsSearch.toLowerCase()) ||
                                                          phone.includes(accountsSearch.toLowerCase());
                                    const matchesFilter = accountsFilter === "all" || 
                                                          (accountsFilter === "pending" && !rescuer.is_verified) || 
                                                          (accountsFilter === "verified" && rescuer.is_verified);
                                    return matchesSearch && matchesFilter;
                                  })
                                  .map((rescuer) => (
                                    <tr key={rescuer.id} className="hover:bg-slate-50/60 transition-colors">
                                      <td className="p-3 pl-4 font-bold text-slate-600">R-{rescuer.id}</td>
                                      <td className="p-3">
                                        <div className="font-semibold text-slate-800 text-[11px] font-sans">
                                          {rescuer.first_name} {rescuer.last_name}
                                        </div>
                                        <div className="text-slate-500 font-mono text-[9.5px] mt-0.5 select-all">{rescuer.email}</div>
                                      </td>
                                      <td className="p-3 font-semibold text-slate-705 select-all">
                                        {rescuer.phone_number || "--"}
                                      </td>
                                      <td className="p-3">
                                        <span className="font-semibold text-slate-600">{rescuer.id_type}</span>
                                        <div className="text-slate-450 font-mono text-[9px] mt-0.5">{rescuer.id_number}</div>
                                      </td>
                                      <td className="p-3">
                                        {rescuer.is_verified === 1 ? (
                                          <span className="px-1.5 py-0.5 rounded text-[8.5px] font-bold uppercase flex items-center gap-1 w-fit border bg-emerald-50 text-emerald-700 border-emerald-100">
                                            <span className="w-1 h-1 rounded-full bg-emerald-500" />
                                            Verified
                                          </span>
                                        ) : (
                                          <span className="px-1.5 py-0.5 rounded text-[8.5px] font-bold uppercase flex items-center gap-1 w-fit border bg-amber-50 text-amber-700 border-amber-100 animate-pulse">
                                            <span className="w-1 h-1 rounded-full bg-amber-500" />
                                            Pending Approval
                                          </span>
                                        )}
                                      </td>
                                      <td className="p-3 text-right pr-4">
                                        <div className="flex gap-1.5 justify-end">
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setSelectedRescuerForReview(rescuer);
                                              setShowReviewModal(true);
                                            }}
                                            title="Review Documents"
                                            className="p-1 text-slate-500 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded transition-all cursor-pointer flex items-center justify-center gap-1 text-[9px] font-bold font-sans uppercase px-1.5 py-1"
                                          >
                                            <Eye size={10} />
                                            Review
                                          </button>
                                          
                                          {rescuer.is_verified !== 1 && (
                                            <button
                                              type="button"
                                              onClick={() => handleVerifyRescuer(rescuer.id)}
                                              title="Approve & Verify Account"
                                              className="p-1 text-emerald-750 hover:text-white bg-emerald-50 hover:bg-emerald-600 border border-emerald-200 hover:border-emerald-600 rounded transition-all cursor-pointer flex items-center justify-center gap-1 text-[9px] font-bold font-sans uppercase px-1.5 py-1"
                                            >
                                              <CheckCircle size={10} />
                                              Approve
                                            </button>
                                          )}

                                          <button
                                            type="button"
                                            onClick={() => handleRejectRescuer(rescuer.id)}
                                            title="Reject & Delete Account"
                                            className="p-1.5 text-red-650 hover:text-white bg-red-50 hover:bg-red-600 border border-red-200 hover:border-red-600 rounded transition-all cursor-pointer flex items-center justify-center"
                                          >
                                            <Trash2 size={10} />
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      <div className="flex justify-between items-center text-[9px] text-slate-400 font-mono px-1">
                        <span>Database Server: http://localhost:5000/api/rescuers</span>
                        <span>Auto-sync: Active (Live DB state)</span>
                      </div>
                    </div>
                  )}

                  {/* SUBTAB 2: TELEMETRY LOGS (Existing Feature) */}
                  {rescuerSubTab === "telemetry" && (
                    <div className="space-y-4 flex-grow flex flex-col">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <p className="text-[10px] text-slate-500 font-mono">
                          LIVE TELEMETRY FROM ESP32 LORA NODES & BLUETOOTH MOBILE GPS
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => showToast("Clearing current telemetry filter... (Mock)")}
                            className="px-2.5 py-1.5 bg-white border border-slate-205 hover:border-slate-300 text-slate-650 text-[10px] font-bold uppercase rounded transition-colors shadow-xs cursor-pointer font-mono"
                          >
                            Clear Filters
                          </button>
                          <button
                            onClick={() => showToast("Broadcasting diagnostic signal... (Mock)")}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-bold tracking-wider uppercase rounded transition-colors shadow-xs cursor-pointer font-mono"
                          >
                            <Wifi size={10} />
                            Ping Mesh
                          </button>
                        </div>
                      </div>

                      {/* Rescuer Search / Filter */}
                      <div className="flex flex-col sm:flex-row gap-3">
                        <div className="flex-1 relative">
                          <Search className="absolute left-2.5 top-2.5 text-slate-400" size={13} />
                          <input
                            type="text"
                            placeholder="Search logs by rescuer, type, or event..."
                            value={rescuerSearch}
                            onChange={(e) => setRescuerSearch(e.target.value)}
                            className="w-full bg-slate-50/50 border border-slate-205 rounded pl-8.5 pr-3 py-1.8 text-xs focus:outline-none focus:ring-1 focus:ring-red-500/30 focus:border-red-500 placeholder-slate-400"
                          />
                        </div>
                        <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1 sm:pb-0">
                          {["all", "online", "busy", "warning", "offline"].map((status) => (
                            <button
                              key={status}
                              onClick={() => setRescuerFilter(status)}
                              className={`px-3 py-1.8 border rounded text-[9.5px] font-bold font-mono tracking-wider uppercase transition-all cursor-pointer ${
                                rescuerFilter === status
                                  ? "bg-red-700 text-white border-red-700 shadow-xs"
                                  : "bg-white text-slate-650 hover:text-slate-900 border-slate-200"
                              }`}
                            >
                              {status}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Table Layout */}
                      <div className="border border-slate-200/70 rounded-xl overflow-hidden flex-grow bg-white min-h-[300px]">
                        <div className="overflow-x-auto">
                          <table className="w-full text-[10.5px] text-left border-collapse">
                            <thead>
                              <tr className="bg-slate-50 border-b border-slate-250 font-mono text-[9px] uppercase tracking-wider text-slate-500">
                                <th className="p-3 pl-4">Log ID</th>
                                <th className="p-3">Time</th>
                                <th className="p-3">Rescuer Unit</th>
                                <th className="p-3">Event Type</th>
                                <th className="p-3">Status</th>
                                <th className="p-3">Battery</th>
                                <th className="p-3">Signal</th>
                                <th className="p-3">Log Details</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-mono">
                              {filteredRescuers.length === 0 ? (
                                <tr>
                                  <td colSpan="8" className="p-8 text-center text-slate-400 italic">
                                    No rescuer logs match the selected filter.
                                  </td>
                                </tr>
                              ) : (
                                filteredRescuers.map((log) => (
                                  <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                                    <td className="p-3 pl-4 font-bold text-slate-700">{log.id}</td>
                                    <td className="p-3 text-slate-500 whitespace-nowrap">{log.timestamp}</td>
                                    <td className="p-3 font-semibold text-slate-800">{log.unit}</td>
                                    <td className="p-3">
                                      <span className="font-semibold text-slate-600">{log.type}</span>
                                    </td>
                                    <td className="p-3">
                                      <span className={`px-1.5 py-0.5 rounded text-[8.5px] font-bold uppercase flex items-center gap-1 w-fit border ${
                                        log.status === "online" ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                                        log.status === "busy" ? "bg-amber-50 text-amber-700 border-amber-100" :
                                        log.status === "warning" ? "bg-red-50 text-red-700 border-red-100" :
                                        "bg-slate-100 text-slate-650 border-slate-200"
                                      }`}>
                                        <span className={`w-1 h-1 rounded-full ${
                                          log.status === "online" ? "bg-emerald-500" :
                                          log.status === "busy" ? "bg-amber-500 animate-pulse" :
                                          log.status === "warning" ? "bg-red-600 animate-bounce" :
                                          "bg-slate-400"
                                        }`} />
                                        {log.status}
                                      </span>
                                    </td>
                                    <td className="p-3 font-semibold">
                                      <div className="flex items-center gap-1 text-slate-700">
                                        <Battery size={12} className={log.battery <= 20 ? "text-red-600" : "text-emerald-600"} />
                                        <span className={log.battery <= 20 ? "text-red-700 font-bold" : ""}>
                                          {log.battery}%
                                        </span>
                                      </div>
                                    </td>
                                    <td className="p-3">
                                      <div className="flex items-center gap-1 text-slate-700">
                                        <Signal size={12} className={log.signal <= -80 ? "text-red-600" : "text-slate-500"} />
                                        <span className="text-[10px]">{log.signal} dBm</span>
                                      </div>
                                    </td>
                                    <td className="p-3 text-slate-600 whitespace-nowrap truncate max-w-[200px]" title={log.notes}>
                                      {log.notes}
                                    </td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      <div className="flex justify-between items-center text-[9px] text-slate-400 font-mono px-1">
                        <span>Active Rescuer Mesh Devices: 3 Units connected</span>
                        <span>Last diagnostic scan: Just now</span>
                      </div>
                    </div>
                  )}

                </div>
              )}

              {/* --- TAB 4: LOCATION & GEOFENCE --- */}
              {activeTab === "location" && (
                <div className="space-y-5 animate-in fade-in-30 duration-200 flex-grow flex flex-col">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-mono">
                      Location & Geofence Boundaries
                    </h2>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Configure coordinates of the command center and geofencing boundaries for Barangay Tumaga's local emergency response zone.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-grow">
                    {/* Location Form Configuration (4 cols) */}
                    <div className="lg:col-span-4 flex flex-col gap-4">
                      <form onSubmit={handleLocationSave} className="space-y-4 bg-slate-50/50 p-4 border border-slate-100 rounded-xl">
                        <div className="pb-2 border-b border-slate-200/55 flex justify-between items-center">
                          <span className="text-[10px] font-bold text-slate-700 tracking-wider uppercase font-mono">
                            Boundary Configuration
                          </span>
                          <span className="text-[8px] font-mono font-bold bg-red-50 border border-red-100 text-red-700 px-1.5 rounded uppercase">
                            Zone 4 Base
                          </span>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase">Command Latitude</label>
                          <input
                            type="number"
                            step="0.000001"
                            value={lat}
                            onChange={(e) => setLat(e.target.value)}
                            className="w-full bg-white border border-slate-200/80 rounded px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-red-500/30 focus:border-red-500 font-mono"
                            placeholder="6.9214"
                            required
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase">Command Longitude</label>
                          <input
                            type="number"
                            step="0.000001"
                            value={lng}
                            onChange={(e) => setLng(e.target.value)}
                            className="w-full bg-white border border-slate-200/80 rounded px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-red-500/30 focus:border-red-500 font-mono"
                            placeholder="122.0790"
                            required
                          />
                        </div>

                        <div className="space-y-1">
                          <div className="flex justify-between items-center">
                            <label className="text-[10px] font-bold text-slate-500 uppercase">Geofence Radius (m)</label>
                            <span className="text-[9px] font-mono font-bold text-red-700">{radius}m</span>
                          </div>
                          <input
                            type="number"
                            value={radius}
                            onChange={(e) => setRadius(e.target.value)}
                            className="w-full bg-white border border-slate-200/80 rounded px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-red-500/30 focus:border-red-500 font-mono"
                            placeholder="1200"
                            required
                          />
                        </div>

                        <div className="pt-2 text-[9px] text-slate-400 space-y-1 font-mono">
                          <div className="flex items-center gap-1.5">
                            <Info size={10} className="text-slate-500" />
                            <span className="font-sans leading-tight">Click map to relocate base center coordinates.</span>
                          </div>
                          <div className="font-sans leading-tight">Drag the blue pin to reposition boundary.</div>
                        </div>

                        <button
                          type="submit"
                          className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-semibold tracking-wide transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <Save size={12} />
                          Save Location Boundary
                        </button>
                      </form>

                      {/* Map Options card */}
                      <div className="bg-slate-50/30 border border-slate-200/60 rounded-xl p-4 space-y-3.5">
                        <span className="text-[10px] font-bold text-slate-700 tracking-wider uppercase font-mono block">
                          Interactive Map Settings
                        </span>
                        
                        <div className="space-y-2">
                          <label className="text-[9px] font-bold text-slate-500 uppercase block">Map Source Style</label>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => setMapType("street")}
                              className={`py-1.5 border rounded text-[9.5px] font-bold font-mono tracking-wider uppercase transition-all cursor-pointer text-center ${
                                mapType === "street"
                                  ? "bg-red-50 text-red-800 border-red-200"
                                  : "bg-white text-slate-600 hover:text-slate-900 border-slate-200"
                              }`}
                            >
                              Light Street Map
                            </button>
                            <button
                              type="button"
                              onClick={() => setMapType("satellite")}
                              className={`py-1.5 border rounded text-[9.5px] font-bold font-mono tracking-wider uppercase transition-all cursor-pointer text-center ${
                                mapType === "satellite"
                                  ? "bg-red-50 text-red-800 border-red-200"
                                  : "bg-white text-slate-600 hover:text-slate-900 border-slate-200"
                              }`}
                            >
                              Esri Satellite
                            </button>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={handleRecenterMap}
                          className="w-full py-2 border border-slate-200 hover:border-slate-300 bg-white text-slate-700 rounded text-[9px] font-bold tracking-wider font-mono uppercase transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <RefreshCw size={10} />
                          Reset to Barangay Defaults
                        </button>
                      </div>
                    </div>

                    {/* Interactive Leaflet Map Preview (8 cols) */}
                    <div className="lg:col-span-8 flex flex-col h-[350px] lg:h-auto border border-slate-200 rounded-xl overflow-hidden shadow-inner relative bg-slate-100 min-h-[300px]">
                      {/* Leaflet div */}
                      <div ref={mapContainerRef} className="w-full h-full z-0" />
                      
                      {/* Map Overlay Badge */}
                      <div className="absolute top-2.5 right-2.5 z-10 bg-slate-950/85 backdrop-blur-xs text-white border border-slate-800/80 px-2.5 py-1.5 rounded-lg text-[9px] font-mono leading-tight pointer-events-none max-w-xs shadow-md">
                        <span className="font-bold text-red-400 uppercase block tracking-wider mb-0.5">Tactical Map Preview</span>
                        Center: {parseFloat(lat).toFixed(4)}°N, {parseFloat(lng).toFixed(4)}°E<br />
                        Geofence Area: ~{((Math.PI * Math.pow(parseFloat(radius) || 1200, 2)) / 1000000).toFixed(2)} km²
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        </section>
      </main>

      {/* Rescuer Account Review Modal */}
      {showReviewModal && selectedRescuerForReview && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield size={16} className="text-red-500 animate-pulse" />
                <h3 className="text-xs font-bold uppercase tracking-wider font-mono">
                  Review Rescuer Account Request
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowReviewModal(false);
                  setSelectedRescuerForReview(null);
                }}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-5 flex-grow select-text">
              
              {/* Virtual ID Preview */}
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2 font-mono">Submitted Document Preview</span>
                <div className="relative overflow-hidden w-full max-w-sm mx-auto aspect-[1.586/1] bg-gradient-to-tr from-slate-950 via-slate-800 to-red-950 rounded-2xl border border-slate-800 p-4 shadow-xl flex flex-col justify-between text-white font-mono uppercase tracking-wider">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-red-600/10 rounded-full blur-2xl" />
                  <div className="absolute bottom-0 left-0 w-32 h-32 bg-slate-150/5 rounded-full blur-xl" />
                  
                  <div className="flex justify-between items-start border-b border-slate-700/60 pb-2">
                    <div>
                      <div className="text-[10px] font-bold text-red-500">ZAMBOALERT NETWORK</div>
                      <div className="text-[8px] text-slate-400 font-sans tracking-normal">BDRRM RESCUE UNIT</div>
                    </div>
                    <div className="text-[9px] bg-red-950/80 border border-red-800/50 text-red-400 font-bold px-2 py-0.5 rounded">
                      {selectedRescuerForReview.id_type || "OFFICIAL ID"}
                    </div>
                  </div>

                  <div className="flex gap-4 my-2 flex-grow items-center">
                    <div className="w-16 h-16 bg-slate-700 border border-slate-600 rounded-lg flex flex-col items-center justify-center relative overflow-hidden">
                      <User size={32} className="text-slate-400" />
                      <div className="absolute bottom-0 inset-x-0 bg-slate-900/80 text-[7px] py-0.5 text-center text-red-405 font-bold">
                        {selectedRescuerForReview.status || "OFFLINE"}
                      </div>
                    </div>
                    
                    <div className="flex-grow space-y-1">
                      <div>
                        <div className="text-[8px] text-slate-500 font-sans tracking-normal">FULL NAME</div>
                        <div className="text-[11px] font-bold text-slate-200">
                          {selectedRescuerForReview.first_name} {selectedRescuerForReview.last_name}
                        </div>
                      </div>
                      <div>
                        <div className="text-[8px] text-slate-500 font-sans tracking-normal">ID NUMBER</div>
                        <div className="text-[10px] font-bold text-slate-300">
                          {selectedRescuerForReview.id_number || "PENDING"}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-end border-t border-slate-700/60 pt-2 text-[8px] text-slate-500 font-sans tracking-normal">
                    <div>
                      <span>STATUS: </span>
                      <span className={selectedRescuerForReview.is_verified ? "text-emerald-400 font-bold" : "text-amber-500 font-bold"}>
                        {selectedRescuerForReview.is_verified ? "VERIFIED & ACTIVE" : "PENDING VERIFICATION"}
                      </span>
                    </div>
                    <div>
                      <span>JOINED: </span>
                      <span className="text-slate-350">{selectedRescuerForReview.created_at ? new Date(selectedRescuerForReview.created_at).toLocaleDateString() : "PENDING"}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Submitted Details Table */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 space-y-3">
                <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block font-mono">Registration Information</span>
                
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase block">First Name</span>
                    <span className="font-semibold text-slate-800">{selectedRescuerForReview.first_name}</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase block">Last Name</span>
                    <span className="font-semibold text-slate-800">{selectedRescuerForReview.last_name}</span>
                  </div>
                  <div className="col-span-2 border-t border-slate-200/60 my-1" />
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase block">Email Address</span>
                    <span className="font-semibold text-slate-800 font-mono select-all">{selectedRescuerForReview.email}</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase block">Phone Number</span>
                    <span className="font-semibold text-slate-800 font-mono select-all">{selectedRescuerForReview.phone_number || "No phone number"}</span>
                  </div>
                  <div className="col-span-2 border-t border-slate-200/60 my-1" />
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase block">Submitted ID Type</span>
                    <span className="font-semibold text-slate-800">{selectedRescuerForReview.id_type}</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase block">Submitted ID Number</span>
                    <span className="font-semibold text-slate-800 font-mono">{selectedRescuerForReview.id_number}</span>
                  </div>
                </div>
              </div>

              {/* Onboarding info note */}
              <div className="text-[9.5px] text-slate-500 leading-normal flex items-start gap-1.5 p-2.5 bg-amber-50/50 border border-amber-100 rounded-lg">
                <Info size={12} className="text-amber-600 shrink-0 mt-0.5" />
                <p>
                  Review the details above to match the rescuer's identity. If verified, approve their access to let them start receiving SOS broadcasts on the ZamboAlert Rescuer App.
                </p>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 border-t border-slate-100 px-4 py-3 flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowReviewModal(false);
                  setSelectedRescuerForReview(null);
                }}
                className="px-3 py-1.5 bg-white border border-slate-200 text-slate-650 hover:bg-slate-55 text-[10px] font-bold uppercase rounded-lg transition-colors cursor-pointer"
              >
                Close
              </button>

              <button
                type="button"
                onClick={() => handleRejectRescuer(selectedRescuerForReview.id)}
                className="flex items-center gap-1 px-3 py-1.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 text-[10px] font-bold uppercase rounded-lg transition-colors cursor-pointer"
              >
                <Trash2 size={10} />
                Reject & Delete
              </button>

              {!selectedRescuerForReview.is_verified && (
                <button
                  type="button"
                  onClick={() => handleVerifyRescuer(selectedRescuerForReview.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all shadow-xs cursor-pointer"
                >
                  <CheckCircle size={10} />
                  Approve & Verify Account
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- Footer bar --- */}
      <footer className="bg-white border-t border-slate-200/50 py-3 text-center text-[9px] text-slate-400 font-mono select-none">
        ZamboAlert Command Portal v2.0-Alpha • Barangay Tumaga Safety Operations • Developed for Emergency Services
      </footer>
    </div>
  );
}
