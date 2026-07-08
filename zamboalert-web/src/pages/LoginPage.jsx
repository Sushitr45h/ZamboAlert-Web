import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

import {
  Lock,
  Mail,
  User,
  ShieldAlert,
  Clock,
  Fingerprint,
  Smartphone,
  CheckCircle2,
  Eye,
  EyeOff,
} from "lucide-react";

/* Credentials login only */

export default function LoginPage() {
  const navigate = useNavigate();

  /* ── credential-login states ── */
  const [view, setView] = useState("login"); // login | register | verify | mfa | locked
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [emailOpened, setEmailOpened] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const resendRef = useRef(null);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutTime, setLockoutTime] = useState(0);
  const [mfaCode, setMfaCode] = useState("123456");
  const [strength, setStrength] = useState({
    score: 0,
    label: "None",
    color: "bg-slate-200",
    checks: { length: false, upper: false, lower: false, number: false, special: false },
  });
  const [notification, setNotification] = useState({ msg: "", type: "" }); // { msg: "...", type: "error" | "success" | "info" }
  const timerRef = useRef(null);
  const notificationTimeoutRef = useRef(null);

  /* QR login disabled */


  /* ─── credential-login side-effects ─────────────── */
  useEffect(() => {
    const generateMfa = () => setMfaCode(Math.floor(100000 + Math.random() * 900000).toString());
    generateMfa();
    const i = setInterval(generateMfa, 30000);
    return () => clearInterval(i);
  }, []);

  useEffect(() => {
    const checks = {
      length:  password.length >= 8,
      upper:   /[A-Z]/.test(password),
      lower:   /[a-z]/.test(password),
      number:  /[0-9]/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };
    const count = Object.values(checks).filter(Boolean).length;
    let label = "None", color = "bg-slate-200";
    if (password.length > 0) {
      if (count <= 2)            { label = "Weak (Insecure)";  color = "bg-red-700";   }
      else if (count <= 4)       { label = "Medium (Fair)";    color = "bg-amber-500"; }
      else                       { label = "Strong (Secure)";  color = "bg-green-500"; }
    }
    setStrength({ score: count, label, color, checks });
  }, [password]);

  useEffect(() => {
    if (lockoutTime > 0) {
      timerRef.current = setInterval(() => {
        setLockoutTime((t) => {
          if (t <= 1) { clearInterval(timerRef.current); setView("login"); setFailedAttempts(0); return 0; }
          return t - 1;
        });
      }, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [lockoutTime]);

  const showNotificationMsg = (msg, type = "error") => {
    if (notificationTimeoutRef.current) clearTimeout(notificationTimeoutRef.current);
    setNotification({ msg, type });
    notificationTimeoutRef.current = setTimeout(() => {
      setNotification({ msg: "", type: "" });
    }, 4000);
  };

  useEffect(() => {
    return () => {
      if (notificationTimeoutRef.current) clearTimeout(notificationTimeoutRef.current);
    };
  }, []);

  /* Resend countdown — starts when MFA view opens or timer resets to 60 */
  useEffect(() => {
    if (view !== "mfa") return;
    if (resendTimer <= 0) return;
    resendRef.current = setInterval(() => {
      setResendTimer((t) => {
        if (t <= 1) { clearInterval(resendRef.current); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(resendRef.current);
  }, [view, resendTimer === 60]); // eslint-disable-line react-hooks/exhaustive-deps

  const BACKEND_URL = "http://localhost:5000";

  /* ─── handlers ──────────────────────────────────── */
  const handleLogin = async (e) => {
    e.preventDefault();
    if (failedAttempts >= 2) { setView("locked"); setLockoutTime(30); return; }
    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json();

      if (response.ok) {
        setView("mfa");
        setResendTimer(60);
        setEmailOpened(false);
        showNotificationMsg("2FA Code sent to your official email.", "success");
      } else {
        if (data.unverified) {
          setEmail(data.email);
          setView("verify");
          showNotificationMsg(data.message, "warning");
        } else {
          const a = failedAttempts + 1;
          setFailedAttempts(a);
          showNotificationMsg(`${data.message || "Invalid username or password!"} Attempt ${a}/3.`, "error");
        }
      }
    } catch (err) {
      showNotificationMsg("Cannot connect to backend server. Make sure it is running.", "error");
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, firstName, lastName, phoneNumber }),
      });
      const data = await response.json();

      if (response.ok) {
        setView("verify");
        showNotificationMsg("Verification code and temporary password sent to your email.", "success");
      } else {
        showNotificationMsg(data.message || "Registration failed", "error");
      }
    } catch (err) {
      showNotificationMsg("Cannot connect to backend server. Make sure it is running.", "error");
    }
  };

  const handleVerifyEmail = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/verify-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: verificationCode }),
      });
      const data = await response.json();

      if (response.ok) {
        showNotificationMsg("Email verified successfully! You can now log in.", "success");
        setView("login");
        setEmail("");
        setUsername("");
        setPassword("");
        setConfirmPassword("");
        setVerificationCode("");
        setPhoneNumber("");
      } else {
        showNotificationMsg(data.message || "Invalid verification code!", "error");
      }
    } catch (err) {
      showNotificationMsg("Cannot connect to backend server.", "error");
    }
  };

  const handleMfa = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/verify-2fa`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, code: otp }),
      });
      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("zamboalert_auth", JSON.stringify({
          token: data.token,
          user: data.user,
          expiry: data.expiry,
        }));
        navigate("/dashboard");
      } else {
        showNotificationMsg(data.message || "Invalid MFA Code!", "error");
      }
    } catch (err) {
      showNotificationMsg("Cannot connect to backend server.", "error");
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();

      if (response.ok) {
        showNotificationMsg("Password reset code sent to your email.", "success");
        setView("reset_password");
        setVerificationCode("");
        setPassword("");
        setConfirmPassword("");
      } else {
        showNotificationMsg(data.message || "Failed to request password reset", "error");
      }
    } catch (err) {
      showNotificationMsg("Cannot connect to backend server. Make sure it is running.", "error");
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      showNotificationMsg("Passwords do not match!", "error");
      return;
    }
    if (strength.score < 3) {
      showNotificationMsg("Password is too weak. Please ensure it is at least medium strength.", "error");
      return;
    }
    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: verificationCode, newPassword: password }),
      });
      const data = await response.json();

      if (response.ok) {
        showNotificationMsg("Password reset successfully! You can now log in.", "success");
        setView("login");
        setEmail("");
        setUsername("");
        setPassword("");
        setConfirmPassword("");
        setVerificationCode("");
      } else {
        showNotificationMsg(data.message || "Failed to reset password", "error");
      }
    } catch (err) {
      showNotificationMsg("Cannot connect to backend server. Make sure it is running.", "error");
    }
  };

  /* QR panel removed */


  /* ════════════════════════════════════════════════════
     RENDER
  ════════════════════════════════════════════════════ */
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col relative overflow-hidden font-sans">
      {/* Decorative ambient background glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[55%] h-[55%] rounded-full bg-rose-100/30 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[55%] h-[55%] rounded-full bg-red-100/20 blur-[130px] pointer-events-none" />

      {/* Main */}
      <div className="flex-1 flex items-center justify-center p-6 relative z-10">
        <div className="w-full max-w-md bg-white border border-slate-100 rounded-2xl p-6 md:p-8 shadow-2xl shadow-slate-200/60 relative overflow-hidden">

          {/* ZamboAlert Modal Header / Brand */}
          <div className="flex flex-col items-center justify-center mt-2 mb-6">
            <img
              src="/zamboalert.png"
              alt="ZamboAlert Logo"
              className="w-14 h-14 object-contain mb-2"
            />
            <span className="font-extrabold text-2xl text-slate-900 tracking-tight">ZamboAlert</span>
            <p className="text-[10px] font-bold text-red-700/80 uppercase tracking-widest mt-2.5">Disaster Response Portal</p>
          </div>

          {/* Toast Notification Message Banner Overlay */}
          {notification.msg && (
            <div className={`mb-4 p-3 rounded-lg border text-xs flex items-center justify-between transition-all duration-300 animate-pulse-once ${
              notification.type === "success" 
                ? "bg-green-50 border-green-200 text-green-800" 
                : notification.type === "info" 
                ? "bg-blue-50 border-blue-200 text-blue-800" 
                : "bg-rose-50 border-rose-200 text-red-800"
            }`}>
              <div className="flex items-center gap-2">
                {notification.type === "success" ? <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" /> : <ShieldAlert className="h-4 w-4 text-red-700 flex-shrink-0" />}
                <span>{notification.msg}</span>
              </div>
              <button 
                type="button" 
                onClick={() => setNotification({ msg: "", type: "" })} 
                className="text-slate-400 hover:text-slate-600 bg-transparent border-0 cursor-pointer p-1 text-sm font-semibold leading-none ml-2"
              >
                ×
              </button>
            </div>
          )}

          {/* LOGIN */}
          {view === "login" && (
            <div>
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-slate-500 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="official@barangay.gov.ph"
                      className="w-full bg-white border border-slate-200 focus:border-red-700 rounded px-3 py-2 pl-10 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-colors"
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
                      type={showLoginPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-white border border-slate-200 focus:border-red-700 rounded px-3 py-2 pl-10 pr-10 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword((v) => !v)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer bg-transparent border-0 p-0"
                      aria-label={showLoginPassword ? "Hide password" : "Show password"}
                    >
                      {showLoginPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <div className="flex justify-end mt-1">
                    <button
                      type="button"
                      onClick={() => { setView("forgot_password"); setEmail(""); }}
                      className="text-xs text-red-700 hover:underline bg-transparent border-0 cursor-pointer p-0 font-medium"
                    >
                      Forgot Password?
                    </button>
                  </div>

                  </div>
                <button
                  type="submit"
                  className="w-full py-2.5 px-4 bg-red-700 hover:bg-red-800 text-white font-semibold text-sm rounded transition-colors shadow-md shadow-red-700/10 cursor-pointer"
                >
                  SIGN IN
                </button>
              </form>

              <div className="mt-4 pt-3 border-t border-slate-100 text-center text-xs text-slate-500">
                New official?{" "}
                <button
                  onClick={() => setView("register")}
                  className="text-red-700 font-semibold hover:underline bg-transparent border-0 cursor-pointer p-0"
                >
                  Register Account
                </button>
              </div>
            </div>
          )}

          {/* REGISTER */}
          {view === "register" && (
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-4">
              </h2>

              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-slate-500 mb-1">First Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <input type="text" required value={firstName} onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Juan"
                      className="w-full bg-white border border-slate-200 focus:border-red-700 rounded px-3 py-2 pl-10 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-colors" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-slate-500 mb-1">Last Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <input type="text" required value={lastName} onChange={(e) => setLastName(e.target.value)}
                      placeholder="Dela Cruz"
                      className="w-full bg-white border border-slate-200 focus:border-red-700 rounded px-3 py-2 pl-10 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-colors" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-slate-500 mb-1">Phone Number (Optional)</label>
                  <div className="relative">
                    <Smartphone className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <input type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="Enter your number"
                      className="w-full bg-white border border-slate-200 focus:border-red-700 rounded px-3 py-2 pl-10 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-colors" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-slate-500 mb-1">Official Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                      placeholder="official@barangay.gov.ph"
                      className="w-full bg-white border border-slate-200 focus:border-red-700 rounded px-3 py-2 pl-10 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-colors" />
                  </div>
                </div>

                <button type="submit"
                  className="w-full py-2.5 px-4 bg-red-700 hover:bg-red-800 text-white font-semibold text-sm rounded transition-colors cursor-pointer">
                  CREATE ACCOUNT
                </button>
              </form>

              <div className="mt-6 pt-4 border-t border-slate-100 text-center text-xs text-slate-500">
                Already registered?{" "}
                <button onClick={() => setView("login")} className="text-red-700 font-semibold hover:underline bg-transparent border-0 cursor-pointer p-0">
                  Sign In
                </button>
              </div>
            </div>
          )}

          {/* VERIFY */}
          {view === "verify" && (
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-2">
                <Mail className="text-red-700 h-4.5 w-4.5" /> Email Verification
              </h2>
              <p className="text-xs text-slate-500 mb-5">Please verify your identity. Enter the code sent to {email}.</p>

              <form onSubmit={handleVerifyEmail} className="space-y-4">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-slate-500 mb-1 text-center">6-Digit Verification Code</label>
                  <input type="text" maxLength={6} required value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ""))}
                    placeholder="123456"
                    className="w-full bg-white border border-slate-200 focus:border-red-700 rounded px-3 py-2 text-center font-mono tracking-widest text-lg text-slate-900 placeholder:text-slate-300 outline-none transition-colors" />
                </div>

                <button type="submit"
                  className="w-full py-2.5 px-4 bg-red-700 hover:bg-red-800 text-white font-semibold text-sm rounded transition-colors cursor-pointer">
                  VERIFY CODE
                </button>
              </form>

              <div className="mt-6 pt-4 border-t border-slate-100 text-center text-xs text-slate-500">
                Incorrect email?{" "}
                <button onClick={() => setView("register")} className="text-red-700 font-semibold hover:underline bg-transparent border-0 cursor-pointer p-0">
                  Back to Register
                </button>
              </div>
            </div>
          )}

          {/* MFA */}
          {view === "mfa" && (
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-2">
                <Fingerprint className="text-red-700 h-4.5 w-4.5" /> Two-Factor Verification
              </h2>
              <p className="text-xs text-slate-500 mb-4">MFA is mandatory for Barangay command nodes.</p>

              {/* Code sent info + resend timer */}
              <div className="mb-5 space-y-2">
                <div className="flex items-start gap-2 text-[11px] text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5">
                  <Mail className="h-3.5 w-3.5 text-red-700 flex-shrink-0 mt-0.5" />
                  <span>
                    A 6-digit verification code has been sent to your Gmail at{" "}
                    <span className="font-mono font-semibold text-slate-800">
                      {username
                        ? `${username.slice(0, 2)}${"..".repeat(2)}@gmail.com`
                        : "br**@gmail.com"}
                    </span>. Check your Gmail inbox to get the code.
                  </span>
                </div>

                {/* Resend row */}
                <div className="flex items-center justify-between px-1">
                  {resendTimer > 0 ? (
                    <p className="text-[11px] text-slate-400">
                      Resend code in{" "}
                      <span className="font-mono font-semibold text-slate-600">
                        {String(Math.floor(resendTimer / 60)).padStart(2, "0")}:
                        {String(resendTimer % 60).padStart(2, "0")}
                      </span>
                    </p>
                  ) : (
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          const response = await fetch(`${BACKEND_URL}/api/auth/resend-code`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ email: email || (username.includes("@") ? username : `${username}@gmail.com`), type: "mfa" }),
                          });
                          const data = await response.json();
                          if (response.ok) {
                            showNotificationMsg("A new MFA code has been sent to your email.", "success");
                            setResendTimer(60);
                            setEmailOpened(false);
                          } else {
                            showNotificationMsg(data.message, "error");
                          }
                        } catch (err) {
                          showNotificationMsg("Failed to resend MFA code.", "error");
                        }
                      }}
                      className="text-[11px] text-red-700 font-semibold hover:underline bg-transparent border-0 cursor-pointer p-0"
                    >
                      ↺ Send the code again
                    </button>
                  )}
                </div>
              </div>

              <form onSubmit={handleMfa} className="space-y-4">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-slate-500 mb-1 text-center">Enter 6-Digit Code from Email</label>
                  <input
                    type="text"
                    maxLength={6}
                    required
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    placeholder="––  ––  ––"
                    className="w-full bg-white border border-slate-200 focus:border-red-700 rounded px-3 py-2 text-center font-mono tracking-[0.4em] text-2xl text-slate-900 placeholder:text-slate-300 outline-none transition-colors"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 px-4 bg-red-700 hover:bg-red-800 text-white font-semibold text-sm rounded transition-colors cursor-pointer"
                >
                  AUTHORIZE SESSION
                </button>
              </form>
            </div>
          )}

          {/* LOCKED */}
          {view === "locked" && (
            <div className="text-center py-4">
              <ShieldAlert className="mx-auto text-red-700 h-10 w-10 animate-bounce mb-2" />
              <h2 className="text-lg font-bold text-slate-900 mb-2">Account Temporarily Locked</h2>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
                Too many failed authentication attempts. Access is restricted for security policies.
              </p>

              <div className="bg-rose-50 border border-rose-100 rounded p-4 inline-flex items-center gap-3 mb-6">
                <Clock className="text-red-700 h-5 w-5 animate-pulse" />
                <div className="text-left">
                  <span className="text-[9px] font-mono text-red-700 uppercase tracking-widest block">Lockout Timer</span>
                  <span className="text-lg font-mono text-red-700 font-bold">{lockoutTime} seconds remaining</span>
                </div>
              </div>

              <div className="text-xs text-slate-400">
                IP Logged: <code className="bg-slate-100 px-1.5 py-0.5 rounded text-red-700 font-mono">192.168.1.100</code>
              </div>
            </div>
          )}

          {/* FORGOT PASSWORD */}
          {view === "forgot_password" && (
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-2">
                <Lock className="text-red-700 h-4.5 w-4.5" /> Forgot Password
              </h2>
              <p className="text-xs text-slate-500 mb-5">Enter your official email address and we'll send you a password reset verification code.</p>

              <form onSubmit={handleForgotPassword} className="space-y-4">
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
                      className="w-full bg-white border border-slate-200 focus:border-red-700 rounded px-3 py-2 pl-10 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-colors"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 px-4 bg-red-700 hover:bg-red-800 text-white font-semibold text-sm rounded transition-colors cursor-pointer"
                >
                  SEND RESET CODE
                </button>
              </form>

              <div className="mt-6 pt-4 border-t border-slate-100 text-center text-xs text-slate-500">
                Remember your password?{" "}
                <button
                  type="button"
                  onClick={() => setView("login")}
                  className="text-red-700 font-semibold hover:underline bg-transparent border-0 cursor-pointer p-0"
                >
                  Back to Sign In
                </button>
              </div>
            </div>
          )}

          {/* RESET PASSWORD */}
          {view === "reset_password" && (
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-2">
                <Lock className="text-red-700 h-4.5 w-4.5" /> Reset Password
              </h2>
              <p className="text-xs text-slate-500 mb-5">Enter the verification code sent to {email} and choose a new password.</p>

              <form onSubmit={handleResetPassword} className="space-y-4">
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
                    className="w-full bg-white border border-slate-200 focus:border-red-700 rounded px-3 py-2 text-center font-mono tracking-widest text-lg text-slate-900 placeholder:text-slate-300 outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-slate-500 mb-1">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-white border border-slate-200 focus:border-red-700 rounded px-3 py-2 pl-10 pr-10 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer bg-transparent border-0 p-0"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>

                  {/* Password Strength Indicator */}
                  {password.length > 0 && (
                    <div className="mt-2 space-y-1.5 bg-slate-50 p-2.5 rounded border border-slate-100 text-left">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-slate-500 font-medium">Strength:</span>
                        <span className={`font-semibold ${
                          strength.score <= 2 ? "text-red-700" : strength.score <= 4 ? "text-amber-600" : "text-green-600"
                        }`}>{strength.label}</span>
                      </div>
                      <div className="h-1 w-full bg-slate-200 rounded-full overflow-hidden flex gap-0.5">
                        <div className={`h-full ${strength.color}`} style={{ width: `${(strength.score / 5) * 100}%` }}></div>
                      </div>
                      <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[9px] text-slate-500">
                        <div className="flex items-center gap-1">
                          <CheckCircle2 className={`h-3 w-3 ${strength.checks.length ? "text-green-500" : "text-slate-300"}`} />
                          <span>8+ Characters</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <CheckCircle2 className={`h-3 w-3 ${strength.checks.upper ? "text-green-500" : "text-slate-300"}`} />
                          <span>Uppercase letter</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <CheckCircle2 className={`h-3 w-3 ${strength.checks.lower ? "text-green-500" : "text-slate-300"}`} />
                          <span>Lowercase letter</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <CheckCircle2 className={`h-3 w-3 ${strength.checks.number ? "text-green-500" : "text-slate-300"}`} />
                          <span>Number</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <CheckCircle2 className={`h-3 w-3 ${strength.checks.special ? "text-green-500" : "text-slate-300"}`} />
                          <span>Special char</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-slate-500 mb-1">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-white border border-slate-200 focus:border-red-700 rounded px-3 py-2 pl-10 pr-10 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((v) => !v)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer bg-transparent border-0 p-0"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 px-4 bg-red-700 hover:bg-red-800 text-white font-semibold text-sm rounded transition-colors cursor-pointer"
                >
                  RESET PASSWORD
                </button>
              </form>

              <div className="mt-6 pt-4 border-t border-slate-100 text-center text-xs text-slate-500">
                Cancel resetting?{" "}
                <button
                  type="button"
                  onClick={() => setView("login")}
                  className="text-red-700 font-semibold hover:underline bg-transparent border-0 cursor-pointer p-0"
                >
                  Back to Sign In
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
