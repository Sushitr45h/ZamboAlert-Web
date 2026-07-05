import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import {
  Lock,
  Mail,
  MailOpen,
  User,
  Shield,
  ShieldAlert,
  Check,
  X,
  Clock,
  Fingerprint,
  QrCode,
  Smartphone,
  RefreshCw,
  CheckCircle2,
  Loader2,
  LogIn,
  ChevronDown,
  Eye,
  EyeOff,
  Wand2,
  KeyRound,
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

  /* ── top-level tab: "credentials" | "qr" ── */
  const [tab, setTab] = useState("credentials");

  /* ── credential-login states ── */
  const [view, setView] = useState("login"); // login | register | verify | mfa | locked
  const [email, setEmail] = useState("");
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
  const [suggestedPassword, setSuggestedPassword] = useState("");
  const [showSuggestion, setShowSuggestion] = useState(false);
  const suggestionRef = useRef(null);
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
  const [qrGmailUser, setQrGmailUser] = useState("");     // simulated scanned account
  const qrTimerRef = useRef(null);
  const qrAutoRef  = useRef(null);

  /* ─── Helpers ─────────────────────────────────────── */
  const generateQrToken = useCallback(() => {
    const rand = () => Math.random().toString(36).slice(2);
    return `zamboalert-qr-${rand()}-${rand()}-${Date.now()}`;
  }, []);

  const startQrSession = useCallback(() => {
    clearInterval(qrTimerRef.current);
    clearTimeout(qrAutoRef.current);

    const token = generateQrToken();
    setQrToken(token);
    setQrPhase(QR_PHASE.WAITING);
    setQrCountdown(QR_TTL);
    setQrGmailUser("");

    /* countdown */
    qrTimerRef.current = setInterval(() => {
      setQrCountdown((c) => {
        if (c <= 1) {
          clearInterval(qrTimerRef.current);
          setQrPhase(QR_PHASE.EXPIRED);
          return 0;
        }
        return c - 1;
      });
    }, 1000);

    /* Simulate phone scan after ~6 s */
    qrAutoRef.current = setTimeout(() => {
      clearInterval(qrTimerRef.current);
      setQrPhase(QR_PHASE.SCANNED);

      /* Simulate Gmail account selection after 1.5 s */
      setTimeout(() => {
        const mockAccount = "brgy.official@gmail.com";
        setQrGmailUser(mockAccount);
        setQrPhase(QR_PHASE.VERIFYING);

        /* Simulate token validation after 2 s */
        setTimeout(() => {
          setQrPhase(QR_PHASE.DONE);

          /* auto-navigate after brief success flash */
          setTimeout(() => {
            const header  = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
            const payload = btoa(JSON.stringify({
              sub: mockAccount,
              role: "barangay_official",
              provider: "google",
              iat: Math.floor(Date.now() / 1000),
              exp: Math.floor(Date.now() / 1000) + 300,
            }));
            const sig = btoa("hmac_sha256_signed_signature");
            localStorage.setItem("zamboalert_auth", JSON.stringify({
              token: `${header}.${payload}.${sig}`,
              user: mockAccount,
              expiry: Date.now() + 300 * 1000,
            }));
            navigate("/dashboard");
          }, 1800);
        }, 2000);
      }, 1500);
    }, 6000);
  }, [generateQrToken, navigate]);

  /* start QR session when tab switches to "qr" */
  useEffect(() => {
    if (tab === "qr" && qrPhase === QR_PHASE.IDLE) startQrSession();
    if (tab !== "qr") {
      clearInterval(qrTimerRef.current);
      clearTimeout(qrAutoRef.current);
      setQrPhase(QR_PHASE.IDLE);
    }
  }, [tab]); // eslint-disable-line react-hooks/exhaustive-deps

  /* cleanup on unmount */
  useEffect(() => () => {
    clearInterval(qrTimerRef.current);
    clearTimeout(qrAutoRef.current);
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

  /* ─── handlers ──────────────────────────────────── */
  const handleLogin = (e) => {
    e.preventDefault();
    if (failedAttempts >= 2) { setView("locked"); setLockoutTime(30); return; }
    const isMockAdmin = username === "admin" && password === "admin123";
    if (isMockAdmin || (password && password.length >= 8)) {
      setView("mfa");
      setResendTimer(60);
      setEmailOpened(false);
    } else {
      const a = failedAttempts + 1;
      setFailedAttempts(a);
      showNotificationMsg(`Invalid username or password! Attempt ${a}/3.`, "error");
    }
  };

  const handleRegister = (e) => {
    e.preventDefault();
    if (password !== confirmPassword) { showNotificationMsg("Passwords do not match!", "error"); return; }
    if (!Object.values(strength.checks).every(Boolean)) {
      showNotificationMsg("Please ensure your password meets all strength requirements.", "error"); return;
    }
    setView("verify");
  };

  const handleVerifyEmail = (e) => {
    e.preventDefault();
    if (verificationCode === "123456") {
      showNotificationMsg("Email verified successfully! You can now log in.", "success");
      setView("login"); setEmail(""); setUsername(""); setPassword(""); setConfirmPassword("");
    } else {
      showNotificationMsg("Invalid verification code! Use the simulated code '123456'.", "error");
    }
  };

  const handleMfa = (e) => {
    e.preventDefault();
    if (otp === mfaCode || otp === "123456") {
      const header  = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
      const payload = btoa(JSON.stringify({
        sub: username || "admin", role: "barangay_official",
        iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 300,
      }));
      const sig = btoa("hmac_sha256_signed_signature");
      localStorage.setItem("zamboalert_auth", JSON.stringify({
        token: `${header}.${payload}.${sig}`,
        user: username || "admin",
        expiry: Date.now() + 300 * 1000,
      }));
      navigate("/dashboard");
    } else {
      showNotificationMsg("Invalid MFA Code! Enter the rotating code shown below the input.", "error");
    }
  };

  /* ─── QR panel sub-component (inline) ──────────── */
  const QrLoginPanel = () => {
    /* The value encoded in the QR is a deep-link that a real mobile app would handle */
    const qrValue = `zamboalert://qr-auth?token=${qrToken}&provider=google&ts=${Date.now()}`;

    return (
      <div className="flex flex-col items-center gap-0">
        {/* Google badge */}
        <div className="flex items-center gap-2 mb-5">
          <GoogleIcon />
          <span className="text-sm font-semibold text-slate-700">Continue with Google</span>
        </div>

        {/* ── WAITING: show QR ── */}
        {(qrPhase === QR_PHASE.WAITING) && (
          <>
            <div className="relative p-3 bg-white border-2 border-slate-200 rounded-xl shadow-md mb-3">
              <QRCodeSVG
                value={qrValue}
                size={160}
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
                  height: 32,
                  width: 32,
                  excavate: true,
                }}
              />
              {/* corner brackets */}
              {["top-0 left-0 border-t-2 border-l-2","top-0 right-0 border-t-2 border-r-2",
                "bottom-0 left-0 border-b-2 border-l-2","bottom-0 right-0 border-b-2 border-r-2"]
                .map((cls, i) => (
                <span key={i} className={`absolute ${cls} border-red-700 w-4 h-4 rounded-sm`} />
              ))}
            </div>

            {/* countdown ring */}
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-3">
              <Clock className="h-3.5 w-3.5 text-red-700" />
              <span>
                QR expires in{" "}
                <span className={`font-mono font-bold ${qrCountdown <= 15 ? "text-red-700" : "text-slate-700"}`}>
                  {qrCountdown}s
                </span>
              </span>
            </div>

            <ol className="text-[11px] text-slate-500 space-y-1 text-left list-none mb-3 w-full px-2">
              {[
                ["1", "Open Gmail app on your phone"],
                ["2", "Tap your profile picture → \"Use another account\""],
                ["3", "Scan this QR code to authenticate"],
              ].map(([n, t]) => (
                <li key={n} className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-4 h-4 rounded-full bg-rose-100 text-red-700 font-bold text-[10px] flex items-center justify-center mt-0.5">{n}</span>
                  <span>{t}</span>
                </li>
              ))}
            </ol>
          </>
        )}

        {/* ── SCANNED ── */}
        {qrPhase === QR_PHASE.SCANNED && (
          <div className="flex flex-col items-center gap-3 py-4 animate-pulse-once">
            <div className="w-20 h-20 rounded-full bg-blue-50 border-2 border-blue-200 flex items-center justify-center">
              <Smartphone className="h-9 w-9 text-blue-500" />
            </div>
            <p className="text-sm font-semibold text-slate-700">QR Scanned!</p>
            <p className="text-xs text-slate-500 text-center">Waiting for Google account selection on your phone…</p>
            <Loader2 className="h-5 w-5 text-blue-500 animate-spin mt-1" />
          </div>
        )}

        {/* ── VERIFYING ── */}
        {qrPhase === QR_PHASE.VERIFYING && (
          <div className="flex flex-col items-center gap-3 py-4">
            <div className="w-20 h-20 rounded-full bg-yellow-50 border-2 border-yellow-200 flex items-center justify-center">
              <GoogleIcon />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-slate-700">Google Account Detected</p>
              <p className="text-xs text-blue-600 font-mono mt-0.5">{qrGmailUser}</p>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Loader2 className="h-4 w-4 text-red-700 animate-spin" />
              Verifying credentials…
            </div>
          </div>
        )}

        {/* ── DONE ── */}
        {qrPhase === QR_PHASE.DONE && (
          <div className="flex flex-col items-center gap-3 py-4">
            <div className="w-20 h-20 rounded-full bg-green-50 border-2 border-green-300 flex items-center justify-center">
              <CheckCircle2 className="h-10 w-10 text-green-500" />
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
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="w-20 h-20 rounded-full bg-rose-50 border-2 border-rose-200 flex items-center justify-center">
              <Clock className="h-9 w-9 text-rose-400" />
            </div>
            <p className="text-sm font-semibold text-slate-700">QR Code Expired</p>
            <p className="text-xs text-slate-500 text-center">The QR code timed out. Please generate a new one.</p>
            <button
              onClick={startQrSession}
              className="flex items-center gap-2 px-4 py-2 bg-red-700 hover:bg-red-800 text-white text-xs font-semibold rounded-lg transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Refresh QR Code
            </button>
          </div>
        )}

        {/* demo shortcut — only while waiting */}
        {qrPhase === QR_PHASE.WAITING && (
          <button
            onClick={() => {
              clearInterval(qrTimerRef.current);
              clearTimeout(qrAutoRef.current);
              setQrPhase(QR_PHASE.SCANNED);
              setTimeout(() => {
                const mockAccount = "brgy.official@gmail.com";
                setQrGmailUser(mockAccount);
                setQrPhase(QR_PHASE.VERIFYING);
                setTimeout(() => {
                  setQrPhase(QR_PHASE.DONE);
                  setTimeout(() => {
                    const header  = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
                    const payload = btoa(JSON.stringify({
                      sub: mockAccount, role: "barangay_official", provider: "google",
                      iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 300,
                    }));
                    const sig = btoa("hmac_sha256_signed_signature");
                    localStorage.setItem("zamboalert_auth", JSON.stringify({
                      token: `${header}.${payload}.${sig}`,
                      user: mockAccount, expiry: Date.now() + 300 * 1000,
                    }));
                    navigate("/dashboard");
                  }, 1800);
                }, 2000);
              }, 1500);
            }}
            className="mt-2 text-[10px] text-slate-400 underline underline-offset-2 hover:text-slate-600 transition-colors cursor-pointer bg-transparent border-0"
          >
            ▶ Simulate phone scan (demo)
          </button>
        )}
      </div>
    );
  };

  /* ════════════════════════════════════════════════════
     RENDER
  ════════════════════════════════════════════════════ */
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Header */}
      <header className="px-6 py-4 border-b border-rose-100 bg-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="text-red-700 h-6 w-6" />
          <div>
            <span className="font-bold text-lg text-slate-900 leading-none block mt-1">ZamboAlert</span>
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs font-mono text-slate-500">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-red-700 animate-pulse" />
            LOCAL AP ACTIVE
          </span>
        </div>
      </header>

      {/* Main */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-white border border-slate-200 rounded-lg p-6 shadow-xl relative overflow-hidden">

          {/* top accent */}
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-red-700 via-red-700 to-red-700" />

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

          {/* ─── TAB BAR (only on main login view) ─── */}
          {view === "login" && (
            <div className="flex rounded-lg border border-slate-200 overflow-hidden mb-6 text-xs font-semibold">
              <button
                onClick={() => setTab("credentials")}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 transition-colors cursor-pointer ${
                  tab === "credentials"
                    ? "bg-red-700 text-white"
                    : "bg-white text-slate-500 hover:bg-slate-50"
                }`}
              >
                <LogIn className="h-3.5 w-3.5" /> Password Login
              </button>
              <button
                onClick={() => { setTab("qr"); if (qrPhase === QR_PHASE.IDLE || qrPhase === QR_PHASE.EXPIRED) startQrSession(); }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 transition-colors cursor-pointer ${
                  tab === "qr"
                    ? "bg-red-700 text-white"
                    : "bg-white text-slate-500 hover:bg-slate-50"
                }`}
              >
                <QrCode className="h-3.5 w-3.5" /> QR / Gmail Login
              </button>
            </div>
          )}

          {/* ─── QR TAB ─── */}
          {view === "login" && tab === "qr" && <QrLoginPanel />}

          {/* ─── CREDENTIAL VIEWS ─── */}
          {(view !== "login" || tab === "credentials") && (

            <>
              {/* LOGIN */}
              {view === "login" && (
                <div>
                  <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2 mb-1">
                    <Lock className="text-red-700 h-5 w-5" /> Secure Authentication
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
                          type="text" required value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          placeholder="e.g. admin"
                          className="w-full bg-white border border-slate-200 focus:border-red-700 rounded px-3 py-2 pl-10 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-colors"
                        />
                      </div>
                    </div>

                    <div className="relative">
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
                          onFocus={() => {
                            if (!password) {
                              const up="ABCDEFGHJKLMNPQRSTUVWXYZ",lo="abcdefghjkmnpqrstuvwxyz",di="23456789",sy="!@#$%&*";
                              const all=up+lo+di+sy;
                              let p=[up,lo,di,sy].map(s=>s[Math.floor(Math.random()*s.length)]);
                              for(let i=0;i<10;i++) p.push(all[Math.floor(Math.random()*all.length)]);
                              setSuggestedPassword(p.sort(()=>Math.random()-0.5).join(""));
                              setShowSuggestion(true);
                            }
                          }}
                          onBlur={() => { suggestionRef.current = setTimeout(() => setShowSuggestion(false), 200); }}
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

                      {/* ── Google Suggest Strong Password Dropdown ── */}
                      {showSuggestion && (
                        <div
                          className="absolute z-50 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden"
                          onMouseDown={(e) => e.preventDefault()}
                        >
                          <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-100 bg-slate-50">
                            <svg width="13" height="13" viewBox="0 0 48 48" aria-hidden="true" className="flex-shrink-0">
                              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                            </svg>
                            <span className="text-[10px] font-semibold text-slate-600 flex-1">Suggested by Google</span>
                            <button type="button" onClick={() => setShowSuggestion(false)} className="text-slate-400 hover:text-slate-600 bg-transparent border-0 cursor-pointer p-0 text-[12px] leading-none">×</button>
                          </div>
                          <div className="px-3 py-3">
                            <button
                              type="button"
                              onClick={() => {
                                clearTimeout(suggestionRef.current);
                                setPassword(suggestedPassword);
                                setShowLoginPassword(true);
                                setShowSuggestion(false);
                              }}
                              className="w-full flex items-start gap-2 mb-2 text-left bg-slate-50 hover:bg-blue-50 border border-slate-200 rounded-lg p-2 transition-colors cursor-pointer"
                            >
                              <KeyRound className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
                              <div className="flex-1 min-w-0">
                                <p className="text-[10px] text-slate-500 mb-0.5">Click to auto-fill strong password:</p>
                                <p className="font-mono text-sm font-bold text-blue-600 tracking-wider break-all">
                                  {suggestedPassword}
                                </p>
                              </div>
                            </button>
                            <p className="text-[9px] text-slate-400 mb-2.5 leading-relaxed">
                              Google will remember this password and fill it in automatically next time.
                            </p>
                            <div className="flex justify-end">
                              <button
                                type="button"
                                title="Generate another"
                                onClick={() => {
                                  const up="ABCDEFGHJKLMNPQRSTUVWXYZ",lo="abcdefghjkmnpqrstuvwxyz",di="23456789",sy="!@#$%&*";
                                  const all=up+lo+di+sy;
                                  let p=[up,lo,di,sy].map(s=>s[Math.floor(Math.random()*s.length)]);
                                  for(let i=0;i<10;i++) p.push(all[Math.floor(Math.random()*all.length)]);
                                  setSuggestedPassword(p.sort(()=>Math.random()-0.5).join(""));
                                }}
                                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-bold rounded-lg transition-colors cursor-pointer border-0"
                              >↺ Regenerate</button>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="text-[10px] text-slate-400 mt-1 flex justify-between">
                        <span>Mock Admin: admin / admin123</span>
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 px-4 bg-red-700 hover:bg-red-800 text-white font-semibold text-sm rounded transition-colors shadow-md shadow-red-700/10 cursor-pointer"
                    >
                      SIGN IN
                    </button>
                  </form>

                  <div className="mt-6 pt-4 border-t border-slate-100 text-center text-xs text-slate-500">
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
                  <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2 mb-1">
                    <User className="text-red-700 h-5 w-5" /> Account Registration
                  </h2>
                  <p className="text-xs text-slate-500 mb-6">Set up your official security credentials.</p>

                  <form onSubmit={handleRegister} className="space-y-4">
                    <div>
                      <label className="block text-xs font-mono uppercase tracking-wider text-slate-500 mb-1">Official Email</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                          placeholder="official@barangay.gov.ph"
                          className="w-full bg-white border border-slate-200 focus:border-red-700 rounded px-3 py-2 pl-10 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-colors" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-mono uppercase tracking-wider text-slate-500 mb-1">Username</label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                        <input type="text" required value={username} onChange={(e) => setUsername(e.target.value)}
                          placeholder="username"
                          className="w-full bg-white border border-slate-200 focus:border-red-700 rounded px-3 py-2 pl-10 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-colors" />
                      </div>
                    </div>

                    <div className="relative">
                      <label className="block text-xs font-mono uppercase tracking-wider text-slate-500 mb-1">
                        Password
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
                          onFocus={() => {
                            if (!password) {
                              const up="ABCDEFGHJKLMNPQRSTUVWXYZ",lo="abcdefghjkmnpqrstuvwxyz",di="23456789",sy="!@#$%&*";
                              const all=up+lo+di+sy;
                              let p=[up,lo,di,sy].map(s=>s[Math.floor(Math.random()*s.length)]);
                              for(let i=0;i<10;i++) p.push(all[Math.floor(Math.random()*all.length)]);
                              setSuggestedPassword(p.sort(()=>Math.random()-0.5).join(""));
                              setShowSuggestion(true);
                            }
                          }}
                          onBlur={() => { suggestionRef.current = setTimeout(() => setShowSuggestion(false), 200); }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((v) => !v)}
                          className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer bg-transparent border-0 p-0"
                          aria-label={showPassword ? "Hide password" : "Show password"}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>

                      {/* ── Google Suggest Strong Password Dropdown ── */}
                      {showSuggestion && (
                        <div
                          className="absolute z-50 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden"
                          onMouseDown={(e) => e.preventDefault()}
                        >
                          <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-100 bg-slate-50">
                            <svg width="13" height="13" viewBox="0 0 48 48" aria-hidden="true" className="flex-shrink-0">
                              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                            </svg>
                            <span className="text-[10px] font-semibold text-slate-600 flex-1">Suggested by Google</span>
                            <button type="button" onClick={() => setShowSuggestion(false)} className="text-slate-400 hover:text-slate-600 bg-transparent border-0 cursor-pointer p-0 text-[12px] leading-none">×</button>
                          </div>
                          <div className="px-3 py-3">
                            <button
                              type="button"
                              onClick={() => {
                                clearTimeout(suggestionRef.current);
                                setPassword(suggestedPassword);
                                setConfirmPassword(suggestedPassword);
                                setShowPassword(true);
                                setShowConfirmPassword(true);
                                setShowSuggestion(false);
                              }}
                              className="w-full flex items-start gap-2 mb-2 text-left bg-slate-50 hover:bg-blue-50 border border-slate-200 rounded-lg p-2 transition-colors cursor-pointer"
                            >
                              <KeyRound className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
                              <div className="flex-1 min-w-0">
                                <p className="text-[10px] text-slate-500 mb-0.5">Click to auto-fill strong password:</p>
                                <p className="font-mono text-sm font-bold text-blue-600 tracking-wider break-all">
                                  {suggestedPassword}
                                </p>
                              </div>
                            </button>
                            <p className="text-[9px] text-slate-400 mb-2.5 leading-relaxed">
                              Google will remember this password and fill it in automatically next time.
                            </p>
                            <div className="flex justify-end">
                              <button
                                type="button"
                                title="Generate another"
                                onClick={() => {
                                  const up="ABCDEFGHJKLMNPQRSTUVWXYZ",lo="abcdefghjkmnpqrstuvwxyz",di="23456789",sy="!@#$%&*";
                                  const all=up+lo+di+sy;
                                  let p=[up,lo,di,sy].map(s=>s[Math.floor(Math.random()*s.length)]);
                                  for(let i=0;i<10;i++) p.push(all[Math.floor(Math.random()*all.length)]);
                                  setSuggestedPassword(p.sort(()=>Math.random()-0.5).join(""));
                                }}
                                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-bold rounded-lg transition-colors cursor-pointer border-0"
                              >↺ Regenerate</button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* ── Google-style Password Recommendation Panel ── */}
                      {password.length > 0 && (
                        <div className="mt-3 rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                          {/* Panel header — Google branding */}
                          <div className="flex items-center gap-2 px-3 py-2 bg-white border-b border-slate-100">
                            <svg width="13" height="13" viewBox="0 0 48 48" aria-hidden="true" className="flex-shrink-0">
                              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                            </svg>
                            <span className="text-[10px] font-semibold text-slate-500 flex-1">Password strength check</span>
                            <span className={`text-[10px] font-bold ${
                              strength.score <= 2 ? "text-red-700" :
                              strength.score <= 4 ? "text-amber-500" : "text-green-600"
                            }`}>
                              {strength.score <= 2 ? "Weak" : strength.score <= 4 ? "Fair" : "Strong"}
                            </span>
                          </div>

                          {/* Segmented strength bar (5 segments like Google) */}
                          <div className="flex gap-1 px-3 pt-2.5 pb-1 bg-white">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <div
                                key={i}
                                className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                                  i < strength.score
                                    ? strength.score <= 2 ? "bg-red-700"
                                    : strength.score <= 4 ? "bg-amber-400"
                                    : "bg-green-500"
                                    : "bg-slate-100"
                                }`}
                              />
                            ))}
                          </div>

                          {/* Requirements list */}
                          <div className="px-3 pt-2 pb-3 bg-white space-y-1.5">
                            {[
                              { key: "length",  label: "At least 8 characters" },
                              { key: "upper",   label: "Uppercase letter (A–Z)" },
                              { key: "lower",   label: "Lowercase letter (a–z)" },
                              { key: "number",  label: "Number (0–9)" },
                              { key: "special", label: "Symbol (!@#$%^&*…)" },
                            ].map(({ key, label }) => (
                              <div key={key} className="flex items-center gap-2">
                                <span className={`flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center transition-colors ${
                                  strength.checks[key] ? "bg-green-100" : "bg-slate-100"
                                }`}>
                                  {strength.checks[key]
                                    ? <Check size={9} className="text-green-600" strokeWidth={3} />
                                    : <X size={9} className="text-slate-400" strokeWidth={3} />
                                  }
                                </span>
                                <span className={`text-[11px] transition-colors ${
                                  strength.checks[key] ? "text-green-700 line-through decoration-green-400" : "text-slate-500"
                                }`}>{label}</span>
                              </div>
                            ))}
                          </div>

                          {/* Google tip footer */}
                          <div className="flex items-start gap-2 px-3 py-2 bg-blue-50 border-t border-blue-100">
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" className="flex-shrink-0 mt-0.5 text-blue-500" stroke="currentColor" strokeWidth="2.5">
                              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                            </svg>
                            <p className="text-[10px] text-blue-700 leading-relaxed">
                              <strong>Google recommends</strong> using a password you don't use on any other site, combining letters, numbers, and symbols, and avoiding personal info.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-mono uppercase tracking-wider text-slate-500 mb-1">Confirm Password</label>
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
                          aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
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
                  <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2 mb-1">
                    <Mail className="text-red-700 h-5 w-5" /> Email Verification
                  </h2>
                  <p className="text-xs text-slate-500 mb-6">Please verify your identity. Enter the code sent to {email}.</p>

                  <form onSubmit={handleVerifyEmail} className="space-y-4">
                    <div className="bg-rose-50 border border-rose-100 rounded p-3 text-center mb-4">
                      <span className="text-[10px] font-mono text-red-700 block uppercase tracking-wider mb-1">Simulator Notification</span>
                      <span className="text-xs text-slate-600">
                        Simulated Verification Code: <strong className="text-slate-900 bg-slate-100 px-2 py-0.5 rounded font-mono text-sm">123456</strong>
                      </span>
                    </div>

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
                  <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2 mb-1">
                    <Fingerprint className="text-red-700 h-5 w-5" /> Two-Factor Verification
                  </h2>
                  <p className="text-xs text-slate-500 mb-5">MFA is mandatory for Barangay command nodes.</p>



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
                          onClick={() => {
                            const newCode = Math.floor(100000 + Math.random() * 900000).toString();
                            setMfaCode(newCode);
                            setResendTimer(60);
                            setEmailOpened(false);
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
                      <div className="text-[10px] text-slate-400 mt-2 text-center">
                        <span>Mock Code: <strong className="font-mono text-red-700">{mfaCode}</strong> (or enter <strong className="font-mono text-red-700">123456</strong>)</span>
                      </div>
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
                <div className="text-center py-6">
                  <ShieldAlert className="mx-auto text-red-700 h-12 w-12 animate-bounce mb-3" />
                  <h2 className="text-xl font-bold text-slate-900 mb-2">Account Temporarily Locked</h2>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto mb-6">
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
            </>
          )}

        </div>
      </div>
    </div>
  );
}
