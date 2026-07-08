import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { db } from "../firebase";
import { doc, onSnapshot } from "firebase/firestore";

import {
  Lock,
  Mail,
  User,
  ShieldAlert,
  Clock,
  Fingerprint,
  Smartphone,
  RefreshCw,
  CheckCircle2,
  Loader2,
  Eye,
  EyeOff,
} from "lucide-react";

/* ─────────────────────────────────────────────────────────────
   Google-colour palette helper (used in QR panel)
───────────────────────────────────────────────────────────── */
const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    <path fill="none" d="M0 0h48v48H0z" />
  </svg>
);

/* QR phases:  idle → waiting → scanned → verifying → done */
const QR_PHASE = { IDLE: "idle", WAITING: "waiting", SCANNED: "scanned", VERIFYING: "verifying", DONE: "done", EXPIRED: "expired" };
const QR_TTL = 60; // seconds before QR expires

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

  /* ── QR-login states ── */
  const [qrPhase, setQrPhase] = useState(QR_PHASE.IDLE);
  const [qrToken, setQrToken] = useState("");
  const [qrCountdown, setQrCountdown] = useState(QR_TTL);
  const [qrGmailUser, setQrGmailUser] = useState("");
  const qrTimerRef = useRef(null);
  const pollingIntervalRef = useRef(null);
  const unsubscribeFirestoreRef = useRef(null);

  /* ─── Helpers ─────────────────────────────────────── */
  const generateQrToken = useCallback(() => {
    const rand = () => Math.random().toString(36).slice(2);
    return `${rand()}-${rand()}-${Date.now()}`;
  }, []);

  const handleQrLogin = useCallback(async (token) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/qr-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: token }),
      });
      const data = await response.json();
      if (response.ok) {
        setQrPhase(QR_PHASE.DONE);
        setTimeout(() => {
          localStorage.setItem("zamboalert_auth", JSON.stringify({
            token: data.token,
            user: data.user,
            expiry: data.expiry,
          }));
          navigate("/dashboard");
        }, 1800);
      } else {
        showNotificationMsg(data.message || "QR Code verification failed.", "error");
        setQrPhase(QR_PHASE.EXPIRED);
      }
    } catch (err) {
      showNotificationMsg("Connection to authentication server failed.", "error");
      setQrPhase(QR_PHASE.EXPIRED);
    }
  }, [navigate]);

  const startQrSession = useCallback(async () => {
    // Clear any existing listeners
    clearInterval(qrTimerRef.current);
    clearInterval(pollingIntervalRef.current);
    if (unsubscribeFirestoreRef.current) {
      unsubscribeFirestoreRef.current();
    }

    const token = generateQrToken();
    setQrToken(token);
    setQrPhase(QR_PHASE.WAITING);
    setQrCountdown(QR_TTL);
    setQrGmailUser("");

    try {
      // 1. Register the session in the backend
      await fetch(`${BACKEND_URL}/api/auth/qr-session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: token }),
      });

      // 2. Start Countdown Timer
      qrTimerRef.current = setInterval(() => {
        setQrCountdown((c) => {
          if (c <= 1) {
            clearInterval(qrTimerRef.current);
            clearInterval(pollingIntervalRef.current);
            if (unsubscribeFirestoreRef.current) unsubscribeFirestoreRef.current();
            setQrPhase(QR_PHASE.EXPIRED);
            return 0;
          }
          return c - 1;
        });
      }, 1000);

      // 3. Connect real-time Firebase listener
      if (db) {
        try {
          unsubscribeFirestoreRef.current = onSnapshot(doc(db, "qr_sessions", token), (snapshot) => {
            const data = snapshot.data();
            if (data) {
              if (data.status === "scanned") {
                setQrPhase(QR_PHASE.SCANNED);
              } else if (data.status === "verified") {
                clearInterval(qrTimerRef.current);
                clearInterval(pollingIntervalRef.current);
                setQrGmailUser(data.email);
                setQrPhase(QR_PHASE.VERIFYING);
                handleQrLogin(token);
              }
            }
          });
        } catch (fbErr) {
          console.warn("Firestore listener failed. Resorting to polling fallback.", fbErr);
        }
      }

      // 4. Polling fallback (ensures reliability if Firestore is not yet configured)
      pollingIntervalRef.current = setInterval(async () => {
        try {
          const response = await fetch(`${BACKEND_URL}/api/auth/qr-status?sessionId=${token}`);
          if (response.ok) {
            const data = await response.json();
            if (data.status === "scanned") {
              setQrPhase(QR_PHASE.SCANNED);
            } else if (data.status === "verified") {
              clearInterval(qrTimerRef.current);
              clearInterval(pollingIntervalRef.current);
              if (unsubscribeFirestoreRef.current) unsubscribeFirestoreRef.current();
              setQrGmailUser(data.email);
              setQrPhase(QR_PHASE.VERIFYING);
              handleQrLogin(token);
            }
          }
        } catch (pollErr) {
          console.log("Polling status check failed:", pollErr.message);
        }
      }, 2500);

    } catch (err) {
      console.error("Failed to register QR session:", err);
      showNotificationMsg("Failed to connect to authentication node.", "error");
      setQrPhase(QR_PHASE.EXPIRED);
    }
  }, [generateQrToken, handleQrLogin]);

  /* start QR session when view is "login" */
  useEffect(() => {
    if (view === "login") {
      if (qrPhase === QR_PHASE.IDLE) {
        startQrSession();
      }
    } else {
      clearInterval(qrTimerRef.current);
      clearInterval(pollingIntervalRef.current);
      if (unsubscribeFirestoreRef.current) {
        unsubscribeFirestoreRef.current();
      }
      setQrPhase(QR_PHASE.IDLE);
    }
  }, [view]); // eslint-disable-line react-hooks/exhaustive-deps

  /* cleanup on unmount */
  useEffect(() => () => {
    clearInterval(qrTimerRef.current);
    clearInterval(pollingIntervalRef.current);
    if (unsubscribeFirestoreRef.current) {
      unsubscribeFirestoreRef.current();
    }
  }, []);


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

  /* ─── QR panel sub-component (inline) ──────────── */
  const QrLoginPanel = () => {
    /* The value encoded in the QR is the verification route URL */
    const qrValue = `${window.location.origin}/verify-qr?sessionId=${qrToken}`;

    return (
      <div className="flex flex-col items-center gap-0 w-full">
        {/* ── WAITING: show QR (compact horizontal layout) ── */}
        {qrPhase === QR_PHASE.WAITING && (
          <div className="w-full flex flex-col items-center gap-3">
            <div className="flex flex-row items-center gap-4 w-full bg-slate-50 p-3 rounded-xl border border-slate-100">
              {/* Left side: QR Code */}
              <div className="relative p-2 bg-white border border-slate-200 rounded-lg shadow-sm flex-shrink-0">
                <QRCodeSVG
                  value={qrValue}
                  size={100}
                  level="H"
                  includeMargin={false}
                  fgColor="#0f172a"
                  bgColor="#ffffff"
                  imageSettings={{
                    src: "data:image/svg+xml;base64," + btoa(`
                      <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 48'>
                        <circle cx='24' cy='24' r='24' fill='%23ffffff'/>
                        <path fill='%23EA4335' d='M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z'/>
                        <path fill='%234285F4' d='M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z'/>
                        <path fill='%23FBBC05' d='M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z'/>
                        <path fill='%2334A853' d='M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z'/>
                      </svg>`),
                    x: undefined,
                    y: undefined,
                    height: 20,
                    width: 20,
                    excavate: true,
                  }}
                />
                {/* corner brackets */}
                {["top-0 left-0 border-t-2 border-l-2", "top-0 right-0 border-t-2 border-r-2",
                  "bottom-0 left-0 border-b-2 border-l-2", "bottom-0 right-0 border-b-2 border-r-2"]
                  .map((cls, i) => (
                    <span key={i} className={`absolute ${cls} border-red-700 w-3 h-3 rounded-sm`} />
                  ))}
              </div>

              {/* Right side: Info and Countdown */}
              <div className="flex-1 flex flex-col justify-center min-w-0">
                <div className="flex items-center gap-1.5 mb-1">
                  <GoogleIcon />
                  <span className="text-xs font-bold text-slate-800">Scan & Sign In</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-snug mb-2">
                  Scan with a mobile device using your official Gmail.
                </p>
                
                <div className="flex items-center gap-1.5 text-[10px] text-slate-500 bg-white border border-slate-100 rounded-md py-1 px-2 w-fit">
                  <Clock className="h-3 w-3 text-red-700" />
                  <span>
                    Expires:{" "}
                    <span className={`font-mono font-bold ${qrCountdown <= 15 ? "text-red-700" : "text-slate-700"}`}>
                      {qrCountdown}s
                    </span>
                  </span>
                </div>
              </div>
            </div>

            {/* Demo simulate scan link */}
            <button
              onClick={() => {
                window.open(`/verify-qr?sessionId=${qrToken}`, "_blank");
              }}
              className="text-[10px] text-slate-400 underline underline-offset-2 hover:text-slate-600 transition-colors cursor-pointer bg-transparent border-0 font-medium"
            >
              ▶ Simulate mobile scan (opens in new tab)
            </button>
          </div>
        )}

        {/* ── SCANNED ── */}
        {qrPhase === QR_PHASE.SCANNED && (
          <div className="flex flex-col items-center gap-3 py-6 animate-pulse-once">
            <div className="w-16 h-16 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center">
              <Smartphone className="h-8 w-8 text-blue-500" />
            </div>
            <p className="text-sm font-bold text-slate-800">QR Code Scanned!</p>
            <p className="text-xs text-slate-500 text-center max-w-[280px]">
              Waiting for official account selection on your mobile device…
            </p>
            <Loader2 className="h-5 w-5 text-blue-500 animate-spin mt-1" />
          </div>
        )}

        {/* ── VERIFYING ── */}
        {qrPhase === QR_PHASE.VERIFYING && (
          <div className="flex flex-col items-center gap-3 py-6">
            <div className="w-16 h-16 rounded-full bg-yellow-50 border border-yellow-200 flex items-center justify-center">
              <GoogleIcon />
            </div>
            <div className="text-center">
              <p className="text-sm font-bold text-slate-800">Google Account Detected</p>
              <p className="text-xs text-blue-600 font-mono mt-0.5">{qrGmailUser}</p>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
              <Loader2 className="h-4 w-4 text-red-700 animate-spin" />
              Verifying credentials…
            </div>
          </div>
        )}

        {/* ── DONE ── */}
        {qrPhase === QR_PHASE.DONE && (
          <div className="flex flex-col items-center gap-3 py-6">
            <div className="w-16 h-16 rounded-full bg-green-50 border border-green-200 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
            <p className="text-sm font-bold text-green-700">Authentication Successful</p>
            <p className="text-xs text-slate-500 text-center">
              Signed in as <span className="font-mono text-blue-600">{qrGmailUser}</span>
            </p>
            <p className="text-[10px] text-slate-400">Redirecting to dashboard…</p>
          </div>
        )}

        {/* ── EXPIRED ── */}
        {qrPhase === QR_PHASE.EXPIRED && (
          <div className="flex flex-col items-center gap-2 py-3 w-full bg-slate-50 p-3 rounded-xl border border-slate-100">
            <div className="w-10 h-10 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center">
              <Clock className="h-5 w-5 text-rose-500" />
            </div>
            <p className="text-xs font-bold text-slate-800">QR Code Expired</p>
            <p className="text-[10px] text-slate-500 text-center max-w-[240px]">
              The QR code timed out. Please refresh to scan.
            </p>
            <button
              onClick={startQrSession}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-700 hover:bg-red-800 text-white text-[10px] font-bold rounded-lg transition-colors cursor-pointer border-0 mt-1"
            >
              <RefreshCw className="h-3 w-3" /> Refresh QR Code
            </button>
          </div>
        )}
      </div>
    );
  };


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
              {/* If QR is in active verification phase, only show verification status */}
              {[QR_PHASE.SCANNED, QR_PHASE.VERIFYING, QR_PHASE.DONE].includes(qrPhase) ? (
                <div className="py-4">
                  <QrLoginPanel />
                </div>
              ) : (
                /* Otherwise, show standard login form + QR code at the bottom */
                <div>
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-4">
                  
                  </h2>

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

                  {/* Divider */}
                  <div className="relative flex py-4 items-center">
                    <div className="flex-grow border-t border-slate-200"></div>
                    <span className="flex-shrink mx-4 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                      Or Scan QR Code
                    </span>
                    <div className="flex-grow border-t border-slate-200"></div>
                  </div>

                  {/* QR Code Panel */}
                  <QrLoginPanel />
                </div>
              )}
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

        </div>
      </div>
    </div>
  );
}
