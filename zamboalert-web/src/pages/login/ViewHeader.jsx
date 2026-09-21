export default function ViewHeader({ title, subtitle }) {
  return (
    <div className="hidden lg:block mb-6">
      <h2 className="text-2xl font-bold text-slate-900 tracking-tight">{title}</h2>
      <p className="text-sm text-slate-500 mt-1">{subtitle}</p>
    </div>
  );
}
