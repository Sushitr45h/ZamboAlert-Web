import { CheckCircle2 } from "lucide-react";

export default function PasswordStrengthMeter({ strength, password }) {
  if (password.length === 0) return null;

  return (
    <div className="mt-2 space-y-1.5 bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-left">
      <div className="flex items-center justify-between text-[10px]">
        <span className="text-slate-500 font-medium">Strength:</span>
        <span
          className={`font-semibold ${
            strength.score <= 2 ? "text-red-700" : strength.score <= 4 ? "text-amber-600" : "text-green-600"
          }`}
        >
          {strength.label}
        </span>
      </div>
      <div className="h-1 w-full bg-slate-200 rounded-full overflow-hidden flex gap-0.5">
        <div
          className={`h-full ${strength.color} rounded-full transition-all duration-300`}
          style={{ width: `${(strength.score / 5) * 100}%` }}
        />
      </div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[9px] text-slate-500">
        {[
          { key: "length", label: "8+ Characters" },
          { key: "upper", label: "Uppercase letter" },
          { key: "lower", label: "Lowercase letter" },
          { key: "number", label: "Number" },
          { key: "special", label: "Special char" },
        ].map((item) => (
          <div key={item.key} className="flex items-center gap-1">
            <CheckCircle2
              className={`h-3 w-3 ${strength.checks[item.key] ? "text-green-500" : "text-slate-300"}`}
            />
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
