import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Lock,
  Mail,
  User,
  Shield,
  ShieldAlert,
  Check,
  X,
  Clock,
  Fingerprint,
} from "lucide-react";

export default function LoginPage() {
  const navigate = useNavigate();
  const [view, setView] = useState("login"); // login, register, verify, mfa, locked
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [verificationCode, setVerificationCode] = useState("");

  // Security simulation states
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutTime, setLockoutTime] = useState(0);
  const [mfaCode, setMfaCode] = useState("123456");

  // Strength meter checks
  const [strength, setStrength] = useState({
    score: 0,
    label: "None",
    color: "bg-slate-200",
    checks: {
      length: false,
      upper: false,
      lower: false,
      number: false,
      special: false,
    }
  });

  const timerRef = useRef(null);

  // Generate dynamic MFA code every 30 seconds
  useEffect(() => {
    const generateMfa = () => {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      setMfaCode(code);
    };

    generateMfa();
    const interval = setInterval(generateMfa, 30000);
    return () => clearInterval(interval);
  }, []);

  // Password strength logic
  useEffect(() => {
    const checks = {
      length: password.length >= 8,
      upper: /[A-Z]/.test(password),
      lower: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };

    const count = Object.values(checks).filter(Boolean).length;
    let label = "None";
    let color = "bg-slate-200";

    if (password.length > 0) {
      if (count <= 2) {
        label = "Weak (Insecure)";
        color = "bg-red-500";
      } else if (count === 3 || count === 4) {
        label = "Medium (Fair)";
        color = "bg-amber-500";
      } else {
        label = "Strong (Secure)";
        color = "bg-green-500";
      }
    }

    setStrength({ score: count, label, color, checks });
  }, [password]);

  // Lockout timer handler
  useEffect(() => {
    if (lockoutTime > 0) {
      timerRef.current = setInterval(() => {
        setLockoutTime((t) => {
          if (t <= 1) {
            clearInterval(timerRef.current);
            setView("login");
            setFailedAttempts(0);
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [lockoutTime]);

  const handleRegister = (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    const checksPassed = Object.values(strength.checks).every(Boolean);
    if (!checksPassed) {
      alert("Please ensure your password meets all strength requirements.");
      return;
    }

    setView("verify");
  };

  const handleVerifyEmail = (e) => {
    e.preventDefault();
    if (verificationCode === "123456") {
      alert("Email verified successfully! You can now log in.");
      setView("login");
      setEmail("");
      setUsername("");
      setPassword("");
      setConfirmPassword("");
    } else {
      alert("Invalid verification code! Use the simulated code '123456'.");
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (failedAttempts >= 2) {
      setView("locked");
      setLockoutTime(30);
      return;
    }

    // Standard simulated credential check
    // Simulating user exists: admin/admin123
    const isMockAdmin = username === "admin" && password === "admin123";

    if (isMockAdmin || (password && password.length >= 8)) {
      setView("mfa");
    } else {
      const attempts = failedAttempts + 1;
      setFailedAttempts(attempts);
      alert(`Invalid username or password! Attempt ${attempts}/3.`);
    }
  };

  const handleMfa = (e) => {
    e.preventDefault();
    if (otp === mfaCode || otp === "123456") {

      // Generate Simulated JWT Token
      const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
      const payload = btoa(JSON.stringify({
        sub: username || "admin",
        role: "barangay_official",
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 300 // 5 minute expiry
      }));
      const signature = btoa("hmac_sha256_signed_signature");
      const generatedToken = `${header}.${payload}.${signature}`;

      // Save token in storage
      localStorage.setItem("zamboalert_auth", JSON.stringify({
        token: generatedToken,
        user: username || "admin",
        expiry: Date.now() + 300 * 1000
      }));

      // ✅ Use React Router navigate instead of window.location.href
      navigate("/dashboard");
    } else {
      alert("Invalid MFA Code! Enter the rotating code shown below the input.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Header */}
      <header className="px-6 py-4 border-b border-red-100 bg-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="text-red-600 h-6 w-6" />
          <div>
            <span className="font-bold text-lg text-slate-900 leading-none block">ZamboAlert</span>
            <span className="text-[9px] font-mono text-red-600 uppercase tracking-widest">
              Security Gateway Node
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs font-mono text-slate-500">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-red-600 animate-pulse"></span>
            LOCAL AP ACTIVE
          </span>
        </div>
      </header>

      {/* Main Centered container */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-white border border-slate-200 rounded-lg p-6 shadow-xl relative overflow-hidden">

          {/* Red glow accent top */}
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-red-600 via-rose-500 to-red-600"></div>

          {/* Render Views */}
          {view === "login" && (
            <div>
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2 mb-1">
                <Lock className="text-red-600 h-5 w-5" /> Secure Authentication
              </h2>
              <p className="text-xs text-slate-500 mb-6">
                Access the ZamboAlert Barangay Monitoring portal.
              </p>

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-slate-500 mb-1">
                    Username / Email
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="e.g. admin"
                      className="w-full bg-white border border-slate-200 focus:border-red-600 rounded px-3 py-2 pl-10 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-slate-500 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-white border border-slate-200 focus:border-red-600 rounded px-3 py-2 pl-10 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-colors"
                    />
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1 flex justify-between">
                    <span>Mock Admin: admin / admin123</span>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white font-semibold text-sm rounded transition-colors shadow-md shadow-red-900/10 cursor-pointer"
                >
                  SIGN IN
                </button>
              </form>

              <div className="mt-6 pt-4 border-t border-slate-100 text-center text-xs text-slate-500">
                New official?{" "}
                <button
                  onClick={() => setView("register")}
                  className="text-red-600 font-semibold hover:underline bg-transparent border-0 cursor-pointer p-0"
                >
                  Register Account
                </button>
              </div>
            </div>
          )}

          {view === "register" && (
            <div>
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2 mb-1">
                <User className="text-red-600 h-5 w-5" /> Account Registration
              </h2>
              <p className="text-xs text-slate-500 mb-6">
                Set up your official security credentials.
              </p>

              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-slate-500 mb-1">
                    Official Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="official@barangay.gov.ph"
                      className="w-full bg-white border border-slate-200 focus:border-red-600 rounded px-3 py-2 pl-10 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-slate-500 mb-1">
                    Username
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="username"
                      className="w-full bg-white border border-slate-200 focus:border-red-600 rounded px-3 py-2 pl-10 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-slate-500 mb-1 flex justify-between">
                    <span>Password</span>
                    <span className="text-[10px] lowercase text-slate-400 font-semibold">
                      {strength.label}
                    </span>
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-white border border-slate-200 focus:border-red-600 rounded px-3 py-2 pl-10 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-colors"
                    />
                  </div>

                  {/* Password Strength Meter */}
                  {password.length > 0 && (
                    <div className="mt-2 space-y-1.5">
                      <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden flex">
                        <div
                          className={`h-full ${strength.color} transition-all duration-300`}
                          style={{ width: `${(strength.score / 5) * 100}%` }}
                        ></div>
                      </div>

                      {/* Password Policies */}
                      <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[9px] font-mono text-slate-500 mt-2">
                        <div className="flex items-center gap-1">
                          {strength.checks.length ? (
                            <Check size={10} className="text-green-600" />
                          ) : (
                            <X size={10} className="text-red-500" />
                          )}
                          8+ Characters
                        </div>
                        <div className="flex items-center gap-1">
                          {strength.checks.upper ? (
                            <Check size={10} className="text-green-600" />
                          ) : (
                            <X size={10} className="text-red-500" />
                          )}
                          Uppercase Letter
                        </div>
                        <div className="flex items-center gap-1">
                          {strength.checks.lower ? (
                            <Check size={10} className="text-green-600" />
                          ) : (
                            <X size={10} className="text-red-500" />
                          )}
                          Lowercase Letter
                        </div>
                        <div className="flex items-center gap-1">
                          {strength.checks.number ? (
                            <Check size={10} className="text-green-600" />
                          ) : (
                            <X size={10} className="text-red-500" />
                          )}
                          Number Digit
                        </div>
                        <div className="flex items-center gap-1 col-span-2">
                          {strength.checks.special ? (
                            <Check size={10} className="text-green-600" />
                          ) : (
                            <X size={10} className="text-red-500" />
                          )}
                          Special Character (!@#$...)
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-slate-500 mb-1">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-white border border-slate-200 focus:border-red-600 rounded px-3 py-2 pl-10 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-colors"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white font-semibold text-sm rounded transition-colors cursor-pointer"
                >
                  CREATE ACCOUNT
                </button>
              </form>

              <div className="mt-6 pt-4 border-t border-slate-100 text-center text-xs text-slate-500">
                Already registered?{" "}
                <button
                  onClick={() => setView("login")}
                  className="text-red-600 font-semibold hover:underline bg-transparent border-0 cursor-pointer p-0"
                >
                  Sign In
                </button>
              </div>
            </div>
          )}

          {view === "verify" && (
            <div>
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2 mb-1">
                <Mail className="text-red-600 h-5 w-5" /> Email Verification
              </h2>
              <p className="text-xs text-slate-500 mb-6">
                Please verify your identity. Enter the code sent to {email}.
              </p>

              <form onSubmit={handleVerifyEmail} className="space-y-4">
                <div className="bg-red-50 border border-red-100 rounded p-3 text-center mb-4">
                  <span className="text-[10px] font-mono text-red-600 block uppercase tracking-wider mb-1">
                    Simulator Notification
                    </span>
                  <span className="text-xs text-slate-600">
                    Simulated Verification Code: <strong className="text-slate-900 bg-slate-100 px-2 py-0.5 rounded font-mono text-sm">123456</strong>
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-slate-500 mb-1 text-center">
                    6-Digit Verification Code
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    required
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ""))}
                    placeholder="123456"
                    className="w-full bg-white border border-slate-200 focus:border-red-600 rounded px-3 py-2 text-center font-mono tracking-widest text-lg text-slate-900 placeholder:text-slate-300 outline-none transition-colors"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white font-semibold text-sm rounded transition-colors cursor-pointer"
                >
                  VERIFY CODE
                </button>
              </form>

              <div className="mt-6 pt-4 border-t border-slate-100 text-center text-xs text-slate-500">
                Incorrect email?{" "}
                <button
                  onClick={() => setView("register")}
                  className="text-red-600 font-semibold hover:underline bg-transparent border-0 cursor-pointer p-0"
                >
                  Back to Register
                </button>
              </div>
            </div>
          )}

          {view === "mfa" && (
            <div>
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2 mb-1">
                <Fingerprint className="text-red-600 h-5 w-5" /> Two-Factor Verification
              </h2>
              <p className="text-xs text-slate-500 mb-6">
                MFA is mandatory for Barangay command nodes.
              </p>

              <form onSubmit={handleMfa} className="space-y-4">
                {/* Google Authenticator Simulation */}
                <div className="flex flex-col items-center p-3 bg-slate-50 border border-slate-200 rounded mb-4">
                  {/* Simulated QR Code */}
                  <div className="w-24 h-24 bg-white p-1 border border-slate-200 rounded flex items-center justify-center relative">
                    <div className="w-full h-full border-4 border-slate-950 flex flex-wrap p-1 gap-1">
                      {Array.from({ length: 9 }).map((_, i) => (
                        <div
                          key={i}
                          className={`w-[22px] h-[22px] rounded-sm ${
                            i % 2 === 0 ? "bg-slate-950" : "bg-white"
                          }`}
                        ></div>
                      ))}
                    </div>
                    <Shield className="absolute h-5 w-5 text-red-600 fill-white stroke-2" />
                  </div>
                  <span className="text-[9px] font-mono text-slate-400 mt-2">
                    Secret Key: ZAMB-7O2S-ALRT-994K
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-slate-500 mb-1 text-center">
                    6-Digit Authenticator Code
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    required
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    placeholder="Enter TOTP Token"
                    className="w-full bg-white border border-slate-200 focus:border-red-600 rounded px-3 py-2 text-center font-mono tracking-widest text-lg text-slate-900 placeholder:text-slate-300 outline-none transition-colors"
                  />
                  <div className="text-[10px] text-slate-500 text-center mt-2.5 bg-slate-50 border border-slate-100 p-2 rounded">
                    Simulated rotating MFA code: <strong className="text-slate-900 font-mono text-xs">{mfaCode}</strong>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white font-semibold text-sm rounded transition-colors cursor-pointer"
                >
                  AUTHORIZE SESSION
                </button>
              </form>
            </div>
          )}

          {view === "locked" && (
            <div className="text-center py-6">
              <ShieldAlert className="mx-auto text-red-600 h-12 w-12 animate-bounce mb-3" />
              <h2 className="text-xl font-bold text-slate-900 mb-2">Account Temporarily Locked</h2>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mb-6">
                Too many failed authentication attempts. Access is restricted for security policies.
              </p>

              <div className="bg-red-50 border border-red-100 rounded p-4 inline-flex items-center gap-3 mb-6">
                <Clock className="text-red-600 h-5 w-5 animate-pulse" />
                <div className="text-left">
                  <span className="text-[9px] font-mono text-red-500 uppercase tracking-widest block">
                    Lockout Timer
                  </span>
                  <span className="text-lg font-mono text-red-900 font-bold">
                    {lockoutTime} seconds remaining
                  </span>
                </div>
              </div>

              <div className="text-xs text-slate-400">
                IP Logged: <code className="bg-slate-100 px-1.5 py-0.5 rounded text-red-600 font-mono">192.168.1.100</code>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
