import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import sqlite3 from "sqlite3";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import path from "path";
import { fileURLToPath } from "url";
import admin from "firebase-admin";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || "zamboalert_secret_jwt_key_12345";

// Initialize Firebase Admin (optional, falls back gracefully to SQLite database)
let firestoreDb = null;
if (process.env.FIREBASE_PROJECT_ID) {
  try {
    admin.initializeApp({
      credential: process.env.FIREBASE_SERVICE_ACCOUNT_JSON
        ? admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON))
        : admin.credential.applicationDefault(),
      projectId: process.env.FIREBASE_PROJECT_ID
    });
    firestoreDb = admin.firestore();
    console.log("Firebase Admin SDK initialized successfully.");
  } catch (error) {
    console.warn("Firebase Admin SDK failed to initialize. Falling back to Local SQLite mode.", error.message);
  }
}

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Database
const dbPath = path.join(__dirname, "zamboalert.db");
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("Database connection error:", err.message);
  } else {
    console.log("Connected to SQLite database.");
    createTables();
  }
});

function createTables() {
  db.serialize(() => {
    // Users table
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        is_verified INTEGER DEFAULT 0,
        verification_code TEXT,
        verification_expires INTEGER,
        two_fa_code TEXT,
        two_fa_expires INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // QR Sessions table (for fallback/local mode)
    db.run(`
      CREATE TABLE IF NOT EXISTS qr_sessions (
        session_id TEXT PRIMARY KEY,
        status TEXT NOT NULL,
        email TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
  });
}


// Mailer Setup helper
function getTransporter() {
  // If SMTP configs exist, use them. Otherwise, use a fake transporter or log to console.
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return null;
}

async function sendMail(to, subject, text, html) {
  const transporter = getTransporter();
  if (transporter) {
    try {
      await transporter.sendMail({
        from: `"${process.env.SMTP_FROM_NAME || "ZamboAlert Security"}" <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER}>`,
        to,
        subject,
        text,
        html,
      });
      console.log(`Email successfully sent to ${to}`);
      return true;
    } catch (error) {
      console.error("Email sending failed:", error);
      return false;
    }
  } else {
    console.log("\n==================================================");
    console.log(`[SMTP NOT CONFIGURING] Email to: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Content: ${text}`);
    console.log("==================================================\n");
    return false;
  }
}

// Helper to generate 6-digit code
function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/* ─── API Routes ─── */

// 1. REGISTER
app.post("/api/auth/register", async (req, res) => {
  const { email, firstName, lastName } = req.body;

  if (!email || !firstName || !lastName) {
    return res.status(400).json({ message: "All fields are required" });
  }

  const username = `${firstName} ${lastName}`;
  const tempPassword = "ZamboAlert_" + Math.floor(1000 + Math.random() * 9000);

  try {
    // Check if user already exists
    db.get("SELECT id FROM users WHERE email = ? OR username = ?", [email, username], async (err, row) => {
      if (err) return res.status(500).json({ message: "Database query error" });
      if (row) {
        return res.status(400).json({ message: "Email or name already in use" });
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(tempPassword, salt);

      // Generate verification code
      const code = generateCode();
      const expires = Date.now() + 15 * 60 * 1000; // 15 mins

      db.run(
        "INSERT INTO users (email, username, password, verification_code, verification_expires) VALUES (?, ?, ?, ?, ?)",
        [email, username, hashedPassword, code, expires],
        async function (insertErr) {
          if (insertErr) {
            return res.status(500).json({ message: "Failed to create user" });
          }

          // Send verification email
          const subject = "Verify your ZamboAlert Account";
          const text = `Your email verification code is: ${code}. Your temporary login password is: ${tempPassword}. It expires in 15 minutes.`;
          const html = `
            <div style="font-family: sans-serif; padding: 20px; border: 1px solid #f1f1f1; border-radius: 8px; max-width: 500px; margin: auto;">
              <h2 style="color: #b91c1c; text-align: center;">ZamboAlert Security</h2>
              <p>Hello <strong>${username}</strong>,</p>
              <p>Thank you for registering. Here are your temporary login credentials:</p>
              <div style="background-color: #f9fafb; padding: 15px; border-radius: 6px; border: 1px solid #e5e7eb; margin: 15px 0;">
                <p style="margin: 0 0 8px 0;"><strong>Username:</strong> ${username}</p>
                <p style="margin: 0 0 8px 0;"><strong>Email:</strong> ${email}</p>
                <p style="margin: 0;"><strong>Temporary Password:</strong> <code style="background-color: #f3f4f6; padding: 2px 6px; border-radius: 4px; font-weight: bold; color: #b91c1c;">${tempPassword}</code></p>
              </div>
              <p>Please use the following verification code to activate your account:</p>
              <div style="font-size: 24px; font-weight: bold; text-align: center; padding: 15px; background-color: #fef2f2; border: 1px dashed #f87171; color: #b91c1c; margin: 20px 0; border-radius: 4px; letter-spacing: 4px;">
                ${code}
              </div>
              <p style="font-size: 12px; color: #6b7280; text-align: center;">This code will expire in 15 minutes.</p>
            </div>
          `;

          const emailSent = await sendMail(email, subject, text, html);

          res.status(201).json({
            message: "User registered successfully. Verification code and temporary password sent.",
            email,
          });
        }
      );
    });
  } catch (error) {
    res.status(500).json({ message: "Registration error" });
  }
});

// 2. VERIFY EMAIL
app.post("/api/auth/verify-email", (req, res) => {
  const { email, code } = req.body;

  if (!email || !code) {
    return res.status(400).json({ message: "Email and verification code are required" });
  }

  db.get(
    "SELECT id, verification_code, verification_expires FROM users WHERE email = ?",
    [email],
    (err, row) => {
      if (err) return res.status(500).json({ message: "Database query error" });
      if (!row) return res.status(404).json({ message: "User not found" });

      if (row.verification_code !== code) {
        return res.status(400).json({ message: "Invalid verification code" });
      }

      if (Date.now() > row.verification_expires) {
        return res.status(400).json({ message: "Verification code has expired" });
      }

      db.run(
        "UPDATE users SET is_verified = 1, verification_code = NULL, verification_expires = NULL WHERE id = ?",
        [row.id],
        (updateErr) => {
          if (updateErr) return res.status(500).json({ message: "Verification update failed" });
          res.json({ message: "Email verified successfully. You can now log in." });
        }
      );
    }
  );
});

// 3. LOGIN (Requires 2FA)
app.post("/api/auth/login", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Username/email and password are required" });
  }

  db.get(
    "SELECT * FROM users WHERE username = ? OR email = ?",
    [username, username],
    async (err, user) => {
      if (err) return res.status(500).json({ message: "Database query error" });
      if (!user) return res.status(401).json({ message: "Invalid username/email or password" });

      if (!user.is_verified) {
        return res.status(403).json({ message: "Email verification required", email: user.email, unverified: true });
      }

      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ message: "Invalid username/email or password" });
      }

      // Generate 2FA code
      const code = generateCode();
      const expires = Date.now() + 5 * 60 * 1000; // 5 mins

      db.run(
        "UPDATE users SET two_fa_code = ?, two_fa_expires = ? WHERE id = ?",
        [code, expires, user.id],
        async (updateErr) => {
          if (updateErr) return res.status(500).json({ message: "Failed to process 2FA setup" });

          // Send 2FA email
          const subject = "Your ZamboAlert Login 2FA Code";
          const text = `Your login 2FA code is: ${code}. It expires in 5 minutes.`;
          const html = `
            <div style="font-family: sans-serif; padding: 20px; border: 1px solid #f1f1f1; border-radius: 8px; max-width: 500px; margin: auto;">
              <h2 style="color: #b91c1c; text-align: center;">ZamboAlert 2FA Security</h2>
              <p>Hello <strong>${user.username}</strong>,</p>
              <p>You requested login access to your ZamboAlert dashboard. Use this 2-Factor verification code:</p>
              <div style="font-size: 24px; font-weight: bold; text-align: center; padding: 15px; background-color: #fef2f2; border: 1px dashed #f87171; color: #b91c1c; margin: 20px 0; border-radius: 4px; letter-spacing: 4px;">
                ${code}
              </div>
              <p style="font-size: 12px; color: #6b7280; text-align: center;">This code will expire in 5 minutes.</p>
            </div>
          `;

          const emailSent = await sendMail(user.email, subject, text, html);

          res.json({
            message: "Credentials accepted. 2FA verification code sent to your email.",
            username: user.username,
            email: user.email,
          });
        }
      );
    }
  );
});

// 4. VERIFY 2FA & LOGIN COMPLETE
app.post("/api/auth/verify-2fa", (req, res) => {
  const { username, code } = req.body;

  if (!username || !code) {
    return res.status(400).json({ message: "Username and code are required" });
  }

  db.get(
    "SELECT id, username, email, two_fa_code, two_fa_expires FROM users WHERE username = ? OR email = ?",
    [username, username],
    (err, user) => {
      if (err) return res.status(500).json({ message: "Database query error" });
      if (!user) return res.status(404).json({ message: "User not found" });

      if (user.two_fa_code !== code) {
        return res.status(400).json({ message: "Invalid 2FA code" });
      }

      if (Date.now() > user.two_fa_expires) {
        return res.status(400).json({ message: "2FA code has expired" });
      }

      // Clear code & generate JWT token
      db.run(
        "UPDATE users SET two_fa_code = NULL, two_fa_expires = NULL WHERE id = ?",
        [user.id],
        (updateErr) => {
          if (updateErr) return res.status(500).json({ message: "Session completion failed" });

          const token = jwt.sign(
            { sub: user.username, email: user.email, role: "barangay_official" },
            JWT_SECRET,
            { expiresIn: "1h" }
          );

          res.json({
            message: "Login successful",
            token,
            user: user.username,
            expiry: Date.now() + 60 * 60 * 1000, // 1h
          });
        }
      );
    }
  );
});

// 5. RESEND VERIFICATION OR 2FA CODE
app.post("/api/auth/resend-code", (req, res) => {
  const { email, type } = req.body; // type: 'register' | 'mfa'

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  db.get("SELECT id, username, email FROM users WHERE email = ?", [email], async (err, user) => {
    if (err) return res.status(500).json({ message: "Database query error" });
    if (!user) return res.status(404).json({ message: "User not found" });

    const code = generateCode();
    const expires = type === "mfa" ? Date.now() + 5 * 60 * 1000 : Date.now() + 15 * 60 * 1000;

    const sql = type === "mfa"
      ? "UPDATE users SET two_fa_code = ?, two_fa_expires = ? WHERE id = ?"
      : "UPDATE users SET verification_code = ?, verification_expires = ? WHERE id = ?";

    db.run(sql, [code, expires, user.id], async (updateErr) => {
      if (updateErr) return res.status(500).json({ message: "Failed to generate new code" });

      const subject = type === "mfa" ? "Your ZamboAlert Login 2FA Code" : "Verify your ZamboAlert Account";
      const text = `Your new security code is: ${code}.`;
      const html = `
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #f1f1f1; border-radius: 8px; max-width: 500px; margin: auto;">
          <h2 style="color: #b91c1c; text-align: center;">ZamboAlert Security</h2>
          <p>Hello <strong>${user.username}</strong>,</p>
          <p>As requested, here is your security code:</p>
          <div style="font-size: 24px; font-weight: bold; text-align: center; padding: 15px; background-color: #fef2f2; border: 1px dashed #f87171; color: #b91c1c; margin: 20px 0; border-radius: 4px; letter-spacing: 4px;">
            ${code}
          </div>
          <p style="font-size: 12px; color: #6b7280; text-align: center;">Expires in ${type === "mfa" ? "5" : "15"} minutes.</p>
        </div>
      `;

      const emailSent = await sendMail(user.email, subject, text, html);

      res.json({
        message: "New code sent successfully",
      });
    });
  });
});

/* ─── QR Code Firebase & SQLite verification API routes ─── */

// 1. Register a new QR session
app.post("/api/auth/qr-session", async (req, res) => {
  const { sessionId } = req.body;
  if (!sessionId) {
    return res.status(400).json({ message: "Session ID is required" });
  }

  // If Firebase Firestore is enabled, optionally create a placeholder there too
  if (firestoreDb) {
    try {
      await firestoreDb.collection("qr_sessions").doc(sessionId).set({
        status: "waiting",
        createdAt: new Date().toISOString(),
      });
    } catch (e) {
      console.warn("Could not register session in Firestore:", e.message);
    }
  }

  // Register in local SQLite database as fallback
  db.run(
    "INSERT OR REPLACE INTO qr_sessions (session_id, status) VALUES (?, ?)",
    [sessionId, "waiting"],
    (err) => {
      if (err) {
        return res.status(500).json({ message: "Failed to store session in database" });
      }
      res.status(201).json({ message: "QR Session registered" });
    }
  );
});

// 2. Poll QR session status (for fallback mode when Firestore websocket listeners are offline/not set up)
app.get("/api/auth/qr-status", (req, res) => {
  const { sessionId } = req.query;
  if (!sessionId) {
    return res.status(400).json({ message: "Session ID is required" });
  }

  db.get("SELECT status, email FROM qr_sessions WHERE session_id = ?", [sessionId], (err, row) => {
    if (err) return res.status(500).json({ message: "Database query error" });
    if (!row) return res.status(404).json({ message: "Session not found" });

    res.json({
      status: row.status,
      email: row.email,
    });
  });
});

// 3. Simulated/mobile node callback to verify QR (for sandbox/demo purposes)
app.post("/api/auth/qr-simulate-verify", (req, res) => {
  const { sessionId, email } = req.body;
  if (!sessionId || !email) {
    return res.status(400).json({ message: "Session ID and email are required" });
  }

  // If Firebase Firestore is enabled, update it
  if (firestoreDb) {
    try {
      firestoreDb.collection("qr_sessions").doc(sessionId).update({
        status: "verified",
        email: email,
        verifiedAt: new Date().toISOString(),
      });
    } catch (e) {
      console.warn("Could not update session in Firestore:", e.message);
    }
  }

  db.run(
    "UPDATE qr_sessions SET status = 'verified', email = ? WHERE session_id = ?",
    [email, sessionId],
    (err) => {
      if (err) return res.status(500).json({ message: "Failed to verify session locally" });
      res.json({ message: "Session verified successfully" });
    }
  );
});

// 4. Secure QR Login verification & Token issuing
app.post("/api/auth/qr-login", async (req, res) => {
  const { sessionId } = req.body;

  if (!sessionId) {
    return res.status(400).json({ message: "Session ID is required" });
  }

  let verifiedEmail = null;

  // Attempt to check Firebase Firestore first
  if (firestoreDb) {
    try {
      const docSnap = await firestoreDb.collection("qr_sessions").doc(sessionId).get();
      if (docSnap.exists) {
        const data = docSnap.data();
        if (data.status === "verified") {
          verifiedEmail = data.email;
        }
      }
    } catch (e) {
      console.warn("Error reading from Firestore. Checking local database fallback...", e.message);
    }
  }

  // If not found in Firestore or Firestore is disabled, check local database
  if (!verifiedEmail) {
    await new Promise((resolve) => {
      db.get("SELECT status, email FROM qr_sessions WHERE session_id = ?", [sessionId], (err, row) => {
        if (!err && row && row.status === "verified") {
          verifiedEmail = row.email;
        }
        resolve();
      });
    });
  }

  if (!verifiedEmail) {
    return res.status(400).json({ message: "QR Code session has not been verified yet." });
  }

  // Issue the JWT token for the authenticated user
  db.get("SELECT username, email, is_verified FROM users WHERE email = ?", [verifiedEmail], (err, user) => {
    if (err) return res.status(500).json({ message: "Database query error" });
    
    // Auto-create user if they logged in with verified official Google account but don't exist yet
    if (!user) {
      const defaultUsername = verifiedEmail.split("@")[0];
      const placeholderPass = Math.random().toString(36).slice(-8); // placeholder password
      db.run(
        "INSERT INTO users (email, username, password, is_verified) VALUES (?, ?, ?, 1)",
        [verifiedEmail, defaultUsername, placeholderPass],
        function (insertErr) {
          if (insertErr) {
            // Username may clash, generate a random number suffix
            const uniqUsername = `${defaultUsername}_${Math.floor(Math.random() * 1000)}`;
            db.run(
              "INSERT INTO users (email, username, password, is_verified) VALUES (?, ?, ?, 1)",
              [verifiedEmail, uniqUsername, placeholderPass],
              function (retryErr) {
                if (retryErr) return res.status(500).json({ message: "Failed to auto-register node user" });
                
                const token = jwt.sign(
                  { sub: uniqUsername, email: verifiedEmail, role: "barangay_official" },
                  JWT_SECRET,
                  { expiresIn: "1h" }
                );
                return res.json({
                  message: "Logged in via Google QR",
                  token,
                  user: uniqUsername,
                  expiry: Date.now() + 60 * 60 * 1000,
                });
              }
            );
          } else {
            const token = jwt.sign(
              { sub: defaultUsername, email: verifiedEmail, role: "barangay_official" },
              JWT_SECRET,
              { expiresIn: "1h" }
            );
            res.json({
              message: "Logged in via Google QR",
              token,
              user: defaultUsername,
              expiry: Date.now() + 60 * 60 * 1000,
            });
          }
        }
      );
    } else {
      // User exists, issue token
      const token = jwt.sign(
        { sub: user.username, email: user.email, role: "barangay_official" },
        JWT_SECRET,
        { expiresIn: "1h" }
      );
      res.json({
        message: "Logged in via Google QR",
        token,
        user: user.username,
        expiry: Date.now() + 60 * 60 * 1000,
      });
    }
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

