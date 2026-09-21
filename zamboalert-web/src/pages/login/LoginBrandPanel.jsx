export default function LoginBrandPanel() {
  return (
    <div className="hidden lg:flex lg:w-[48%] xl:w-[52%] relative flex-col items-center justify-center bg-gradient-to-br from-[#991b1b] via-[#7f1d1d] to-[#450a0a] overflow-hidden">
      <div className="absolute top-[-15%] left-[-15%] w-[70%] h-[70%] rounded-full bg-red-500/15 blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-amber-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute top-[40%] right-[10%] w-[40%] h-[40%] rounded-full bg-red-800/20 blur-[100px] pointer-events-none" />
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative z-10 px-12 xl:px-16 max-w-lg text-center">
        <div className="mb-8 flex flex-col items-center">
          <div className="w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10 flex items-center justify-center mb-5 shadow-lg shadow-black/20">
            <img src="/zamboalert.png" alt="ZamboAlert Logo" className="w-14 h-14 object-contain" />
          </div>
          <h1 className="text-4xl xl:text-5xl font-extrabold text-white tracking-tight leading-tight">
            ZamboAlert
          </h1>
          <p className="text-[11px] font-bold text-red-200/70 uppercase tracking-[0.25em] mt-3">
            Disaster Response Portal
          </p>
        </div>

        <p className="text-base xl:text-lg text-red-100/80 leading-relaxed mb-10 font-light">
          Empowering Zamboanga's barangays with real-time disaster monitoring, rapid response coordination, and community resilience tools.
        </p>

        <div className="mt-12 pt-6 border-t border-white/[0.08]">
          <p className="text-[11px] text-red-200/40 tracking-wide">
            City Disaster Risk Reduction &amp; Management Office
          </p>
          <p className="text-[10px] text-red-200/25 mt-1">Zamboanga City, Philippines</p>
        </div>
      </div>
    </div>
  );
}
