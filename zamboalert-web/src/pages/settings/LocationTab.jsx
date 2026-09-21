import { Info, RefreshCw, Save } from "lucide-react";
import { getGeofenceAreaKm2 } from "./settingsUtils";

export default function LocationTab({
  lat,
  setLat,
  lng,
  setLng,
  radius,
  setRadius,
  mapType,
  setMapType,
  mapContainerRef,
  handleLocationSave,
  handleRecenterMap,
}) {
  return (
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

        <div className="lg:col-span-8 flex flex-col h-[350px] lg:h-auto border border-slate-200 rounded-xl overflow-hidden shadow-inner relative bg-slate-100 min-h-[300px]">
          <div ref={mapContainerRef} className="w-full h-full z-0" />

          <div className="absolute top-2.5 right-2.5 z-10 bg-slate-950/85 backdrop-blur-xs text-white border border-slate-800/80 px-2.5 py-1.5 rounded-lg text-[9px] font-mono leading-tight pointer-events-none max-w-xs shadow-md">
            <span className="font-bold text-red-400 uppercase block tracking-wider mb-0.5">Tactical Map Preview</span>
            Center: {parseFloat(lat).toFixed(4)}°N, {parseFloat(lng).toFixed(4)}°E<br />
            Geofence Area: ~{getGeofenceAreaKm2(radius)} km²
          </div>
        </div>
      </div>
    </div>
  );
}
