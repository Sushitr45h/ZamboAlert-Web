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
        phone_number TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Alter table fallback to add phone_number to existing installations
    db.run("ALTER TABLE users ADD COLUMN phone_number TEXT", (err) => {
      // Ignore errors (e.g. if the column already exists)
    });

    // Rescuers table
    db.run(`
      CREATE TABLE IF NOT EXISTS rescuers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        phone_number TEXT,
        id_type TEXT NOT NULL,
        id_number TEXT NOT NULL,
        is_verified INTEGER DEFAULT 0, -- 0 = pending, 1 = verified
        status TEXT DEFAULT 'available', -- 'available' | 'en-route' | 'offline'
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, () => {
      // Seed data if empty
      db.get("SELECT COUNT(*) as count FROM rescuers", (err, row) => {
        if (!err && row && row.count === 0) {
          const seedRescuers = [
            ["rescuer1@zamboalert.gov", "Rescue Team", "Alpha", "+639987654321", "Barangay ID", "BRGY-R01", 1, "en-route"],
            ["medic1@zamboalert.gov", "Medic", "Unit 1", "+639123456789", "Government ID", "GOV-R02", 1, "available"],
            ["rescuer2@zamboalert.gov", "Rescue Team", "Beta", "+639876543210", "Barangay ID", "BRGY-R03", 1, "available"],
            ["pending_rescuer@test.com", "Mark", "Rescuer", "+639012345678", "Barangay ID", "BRGY-PENDING", 0, "offline"]
          ];
          const stmt = db.prepare(`
            INSERT INTO rescuers (email, first_name, last_name, phone_number, id_type, id_number, is_verified, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `);
          seedRescuers.forEach((rescuer) => {
            stmt.run(rescuer);
          });
          stmt.finalize();
          console.log("Seeded rescuers table.");
        }
      });
    });

    // Casualty/Victim logs table
    db.run(`
      CREATE TABLE IF NOT EXISTS casualty_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        rescuer_id TEXT,
        rescuer_name TEXT,
        victim_name TEXT NOT NULL,
        age INTEGER,
        gender TEXT,
        status TEXT NOT NULL, -- 'Injured' | 'Deceased' | 'Missing' | 'Rescued'
        injury_details TEXT,
        location TEXT,
        latitude REAL,
        longitude REAL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, () => {
      // Seed data if empty
      db.get("SELECT COUNT(*) as count FROM casualty_logs", (err, row) => {
        if (!err && row && row.count === 0) {
          const seedLogs = [
            ["R-01", "Rescue Team Alpha", "Maria Santos", 34, "Female", "Injured", "Fractured left arm, stable", "Zone 1 - Riverbank", 6.9234, 122.0765],
            ["R-02", "Medic Unit 1", "Unknown Male", 50, "Male", "Deceased", "Drowning victim, recovered near bridge", "Zone 3 - Lowland", 6.9205, 122.0812],
            ["R-01", "Rescue Team Alpha", "Juanito Cruz", 8, "Male", "Rescued", "Mild hypothermia, reunited with mother", "Zone 4 - Chapel Area", 6.9250, 122.0795],
            ["R-03", "Rescue Team Beta", "Amara Climaco", 72, "Female", "Missing", "Swept away by current, search ongoing", "Zone 1 - Riverbank", 6.9240, 122.0770]
          ];
          const stmt = db.prepare(`
            INSERT INTO casualty_logs (rescuer_id, rescuer_name, victim_name, age, gender, status, injury_details, location, latitude, longitude)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `);
          seedLogs.forEach((log) => {
            stmt.run(log);
          });
          stmt.finalize();
          console.log("Seeded casualty logs table.");
        }
      });
    });

    // Settings table
    db.run(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT
      )
    `, () => {
      // Seed default settings if empty
      db.get("SELECT COUNT(*) as count FROM settings", (err, row) => {
        if (!err && row && row.count === 0) {
          db.run("INSERT INTO settings (key, value) VALUES ('require_rescuer_approval', '1')");
          console.log("Seeded default settings.");
        }
      });
    });

    // Alter table to add assigned target columns if they don't exist
    db.run("ALTER TABLE rescuers ADD COLUMN assigned_target_type TEXT", (err) => {
      // Ignore error if column already exists
    });
    db.run("ALTER TABLE rescuers ADD COLUMN assigned_target_id TEXT", (err) => {
      // Ignore error if column already exists
    });
    db.run("ALTER TABLE rescuers ADD COLUMN assigned_target_name TEXT", (err) => {
      // Ignore error if column already exists
    });
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
  const { email, firstName, lastName, phoneNumber, password } = req.body;

  if (!email || !firstName || !lastName) {
    return res.status(400).json({ message: "All fields are required" });
  }

  const username = `${firstName} ${lastName}`;
  const tempPassword = password ? null : ("ZamboAlert_" + Math.floor(1000 + Math.random() * 9000));
  const finalPassword = password || tempPassword;

  try {
    // Check if user already exists
    db.get("SELECT id FROM users WHERE email = ? OR username = ?", [email, username], async (err, row) => {
      if (err) return res.status(500).json({ message: "Database query error" });
      if (row) {
        return res.status(400).json({ message: "Email or name already in use" });
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(finalPassword, salt);

      // Generate verification code
      const code = generateCode();
      const expires = Date.now() + 15 * 60 * 1000; // 15 mins

      db.run(
        "INSERT INTO users (email, username, password, verification_code, verification_expires, phone_number) VALUES (?, ?, ?, ?, ?, ?)",
        [email, username, hashedPassword, code, expires, phoneNumber || null],
        async function (insertErr) {
          if (insertErr) {
            return res.status(500).json({ message: "Failed to create user" });
          }

          // Send verification email
          const subject = "Verify your ZamboAlert Account";
          const text = password
            ? `Your email verification code is: ${code}. It expires in 15 minutes.`
            : `Your email verification code is: ${code}. Your temporary login password is: ${tempPassword}. It expires in 15 minutes.`;
          const html = `
            <div style="font-family: sans-serif; padding: 20px; border: 1px solid #f1f1f1; border-radius: 8px; max-width: 500px; margin: auto;">
              <h2 style="color: #b91c1c; text-align: center;">ZamboAlert Security</h2>
              <p>Hello <strong>${username}</strong>,</p>
              <p>Thank you for registering. Here are your account details:</p>
              <div style="background-color: #f9fafb; padding: 15px; border-radius: 6px; border: 1px solid #e5e7eb; margin: 15px 0;">
                <p style="margin: 0 0 8px 0;"><strong>Username:</strong> ${username}</p>
                <p style="margin: 0 0 8px 0;"><strong>Email:</strong> ${email}</p>
                ${password ? "" : `<p style="margin: 0;"><strong>Temporary Password:</strong> <code style="background-color: #f3f4f6; padding: 2px 6px; border-radius: 4px; font-weight: bold; color: #b91c1c;">${tempPassword}</code></p>`}
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
            message: password
              ? "User registered successfully. Verification code sent."
              : "User registered successfully. Verification code and temporary password sent.",
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

/* QR Code verification API routes removed */

// 6. FORGOT PASSWORD
app.post("/api/auth/forgot-password", (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  db.get("SELECT id, username, email FROM users WHERE email = ?", [email], async (err, user) => {
    if (err) return res.status(500).json({ message: "Database query error" });
    if (!user) return res.status(404).json({ message: "No official account registered with this email." });

    const code = generateCode();
    const expires = Date.now() + 15 * 60 * 1000; // 15 mins

    db.run(
      "UPDATE users SET verification_code = ?, verification_expires = ? WHERE id = ?",
      [code, expires, user.id],
      async (updateErr) => {
        if (updateErr) return res.status(500).json({ message: "Failed to generate reset code" });

        const subject = "Reset your ZamboAlert Password";
        const text = `Your password reset code is: ${code}. It expires in 15 minutes.`;
        const html = `
          <div style="font-family: sans-serif; padding: 20px; border: 1px solid #f1f1f1; border-radius: 8px; max-width: 500px; margin: auto;">
            <h2 style="color: #b91c1c; text-align: center;">ZamboAlert Security</h2>
            <p>Hello <strong>${user.username}</strong>,</p>
            <p>We received a request to reset your password. Use the following code to complete the reset:</p>
            <div style="font-size: 24px; font-weight: bold; text-align: center; padding: 15px; background-color: #fef2f2; border: 1px dashed #f87171; color: #b91c1c; margin: 20px 0; border-radius: 4px; letter-spacing: 4px;">
              ${code}
            </div>
            <p style="font-size: 12px; color: #6b7280; text-align: center;">This code will expire in 15 minutes. If you did not request this, you can ignore this email.</p>
          </div>
        `;

        await sendMail(user.email, subject, text, html);

        res.json({
          message: "Password reset code has been sent to your email.",
          email: user.email
        });
      }
    );
  });
});

// 7. RESET PASSWORD
app.post("/api/auth/reset-password", async (req, res) => {
  const { email, code, newPassword } = req.body;

  if (!email || !code || !newPassword) {
    return res.status(400).json({ message: "All fields are required" });
  }

  db.get(
    "SELECT id, verification_code, verification_expires FROM users WHERE email = ?",
    [email],
    async (err, user) => {
      if (err) return res.status(500).json({ message: "Database query error" });
      if (!user) return res.status(404).json({ message: "User not found" });

      if (user.verification_code !== code) {
        return res.status(400).json({ message: "Invalid reset code" });
      }

      if (Date.now() > user.verification_expires) {
        return res.status(400).json({ message: "Reset code has expired" });
      }

      try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        db.run(
          "UPDATE users SET password = ?, verification_code = NULL, verification_expires = NULL, is_verified = 1 WHERE id = ?",
          [hashedPassword, user.id],
          (updateErr) => {
            if (updateErr) return res.status(500).json({ message: "Failed to reset password" });
            res.json({ message: "Password has been reset successfully. You can now log in." });
          }
        );
      } catch (hashErr) {
        res.status(500).json({ message: "Error hashing new password" });
      }
    }
  );
});

/* ─── Casualty / Victim Logs API ─── */
app.get("/api/logs/casualties", (req, res) => {
  db.all("SELECT * FROM casualty_logs ORDER BY created_at DESC", [], (err, rows) => {
    if (err) {
      return res.status(500).json({ message: "Database query error", error: err.message });
    }
    res.json(rows);
  });
});

app.post("/api/logs/casualties", (req, res) => {
  const { rescuer_id, rescuer_name, victim_name, age, gender, status, injury_details, location, latitude, longitude } = req.body;

  if (!victim_name || !status) {
    return res.status(400).json({ message: "Victim name and status are required fields." });
  }

  db.run(
    `INSERT INTO casualty_logs (rescuer_id, rescuer_name, victim_name, age, gender, status, injury_details, location, latitude, longitude)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      rescuer_id || null,
      rescuer_name || null,
      victim_name,
      age ? parseInt(age) : null,
      gender || "Unknown",
      status,
      injury_details || null,
      location || null,
      latitude ? parseFloat(latitude) : null,
      longitude ? parseFloat(longitude) : null
    ],
    function (err) {
      if (err) {
        return res.status(500).json({ message: "Failed to insert log", error: err.message });
      }
      res.status(201).json({
        message: "Casualty/Victim log recorded successfully",
        logId: this.lastID
      });
    }
  );
});

app.post("/api/logs/casualties/clear", (req, res) => {
  db.run("DELETE FROM casualty_logs", [], (err) => {
    if (err) {
      return res.status(500).json({ message: "Failed to clear casualty logs", error: err.message });
    }
    res.json({ message: "All casualty logs cleared." });
  });
});

// Get all rescuers
app.get("/api/rescuers", (req, res) => {
  db.all("SELECT * FROM rescuers ORDER BY created_at DESC", [], (err, rows) => {
    if (err) {
      return res.status(500).json({ message: "Database query error", error: err.message });
    }
    res.json(rows);
  });
});

// Register a new rescuer (from the mobile app, if connected)
app.post("/api/rescuers/register", (req, res) => {
  const { email, first_name, last_name, phone_number, id_type, id_number } = req.body;

  if (!email || !first_name || !last_name || !id_type || !id_number) {
    return res.status(400).json({ message: "Required fields are missing." });
  }

  // Check the settings to determine default is_verified
  db.get("SELECT value FROM settings WHERE key = 'require_rescuer_approval'", [], (err, row) => {
    let defaultVerified = 0;
    if (!err && row) {
      defaultVerified = row.value === "0" ? 1 : 0;
    }
    const defaultStatus = defaultVerified === 1 ? 'available' : 'offline';

    db.run(
      `INSERT INTO rescuers (email, first_name, last_name, phone_number, id_type, id_number, is_verified, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [email, first_name, last_name, phone_number || null, id_type, id_number, defaultVerified, defaultStatus],
      function (insertErr) {
        if (insertErr) {
          if (insertErr.message.includes("UNIQUE")) {
            return res.status(400).json({ message: "Email is already registered." });
          }
          return res.status(500).json({ message: "Failed to register rescuer", error: insertErr.message });
        }
        res.status(201).json({
          message: defaultVerified === 1 
            ? "Rescuer registered and auto-approved successfully." 
            : "Rescuer registered successfully. Pending admin approval.",
          rescuerId: this.lastID,
          isVerified: defaultVerified === 1
        });
      }
    );
  });
});

// Verify/Approve a rescuer
app.post("/api/rescuers/verify/:id", (req, res) => {
  const { id } = req.params;

  db.run(
    "UPDATE rescuers SET is_verified = 1, status = 'available' WHERE id = ?",
    [id],
    function (err) {
      if (err) {
        return res.status(500).json({ message: "Failed to verify rescuer", error: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ message: "Rescuer not found." });
      }
      res.json({ message: "Rescuer verified and approved successfully." });
    }
  );
});

// Reject / Delete a rescuer account
app.delete("/api/rescuers/:id", (req, res) => {
  const { id } = req.params;

  db.run(
    "DELETE FROM rescuers WHERE id = ?",
    [id],
    function (err) {
      if (err) {
        return res.status(500).json({ message: "Failed to delete rescuer", error: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ message: "Rescuer not found." });
      }
      res.json({ message: "Rescuer account rejected and deleted successfully." });
    }
  );
});


// Get all settings
app.get("/api/settings", (req, res) => {
  db.all("SELECT * FROM settings", [], (err, rows) => {
    if (err) {
      return res.status(500).json({ message: "Failed to fetch settings", error: err.message });
    }
    const settingsObj = {};
    rows.forEach((row) => {
      if (row.key === "require_rescuer_approval") {
        settingsObj.requireRescuerApproval = row.value === "1";
      } else {
        settingsObj[row.key] = row.value;
      }
    });
    if (settingsObj.requireRescuerApproval === undefined) {
      settingsObj.requireRescuerApproval = true;
    }
    res.json(settingsObj);
  });
});

// Update a setting
app.post("/api/settings", (req, res) => {
  const { key, value } = req.body;

  if (!key) {
    return res.status(400).json({ message: "Setting key is required." });
  }

  const valStr = typeof value === "boolean" ? (value ? "1" : "0") : String(value);

  db.run(
    "INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)",
    [key, valStr],
    function (err) {
      if (err) {
        return res.status(500).json({ message: "Failed to save setting", error: err.message });
      }
      res.json({ message: "Setting saved successfully.", key, value });
    }
  );
});

// Dispatch a rescuer to a target (victim, alert, other rescuer/respondent, or mesh node)
app.post("/api/rescuers/dispatch", (req, res) => {
  const { rescuerId, targetType, targetId, targetName } = req.body;
  if (!rescuerId || !targetType) {
    return res.status(400).json({ message: "Rescuer ID and Target Type are required." });
  }

  db.run(
    "UPDATE rescuers SET status = 'en-route', assigned_target_type = ?, assigned_target_id = ?, assigned_target_name = ? WHERE id = ? OR id_number = ?",
    [targetType, String(targetId), targetName, rescuerId, rescuerId],
    function (err) {
      if (err) {
        return res.status(500).json({ message: "Failed to dispatch rescuer", error: err.message });
      }
      res.json({ message: "Rescuer dispatched successfully." });
    }
  );
});

// Resolve a rescuer's dispatch (mark them available again)
app.post("/api/rescuers/resolve/:id", (req, res) => {
  const { id } = req.params;

  db.run(
    "UPDATE rescuers SET status = 'available', assigned_target_type = NULL, assigned_target_id = NULL, assigned_target_name = NULL WHERE id = ? OR id_number = ?",
    [id, id],
    function (err) {
      if (err) {
        return res.status(500).json({ message: "Failed to resolve rescuer dispatch", error: err.message });
      }
      res.json({ message: "Rescuer dispatch resolved successfully." });
    }
  );
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

