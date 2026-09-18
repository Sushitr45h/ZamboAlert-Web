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
        disaster_type TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, () => {
      // Alter table fallback to add disaster_type to existing installations
      db.run("ALTER TABLE casualty_logs ADD COLUMN disaster_type TEXT", (err) => {
        // Now that the column is guaranteed to exist (either created just now or already present):
        
        // Update existing records with default disaster types if they are null
        db.run("UPDATE casualty_logs SET disaster_type = 'Flood' WHERE disaster_type IS NULL AND (victim_name = 'Maria Santos' OR victim_name = 'Juanito Cruz')");
        db.run("UPDATE casualty_logs SET disaster_type = 'Landslide' WHERE disaster_type IS NULL AND (victim_name = 'Unknown Male' OR victim_name = 'Amara Climaco')");
        db.run("UPDATE casualty_logs SET disaster_type = 'Unknown' WHERE disaster_type IS NULL");

        // Seed data if empty
        db.get("SELECT COUNT(*) as count FROM casualty_logs", (err, row) => {
          if (!err && row && row.count === 0) {
            const seedLogs = [
              ["R-01", "Rescue Team Alpha", "Maria Santos", 34, "Female", "Injured", "Fractured left arm, stable", "Zone 1 - Riverbank", 6.9234, 122.0765, "Flood"],
              ["R-02", "Medic Unit 1", "Unknown Male", 50, "Male", "Deceased", "Drowning victim, recovered near bridge", "Zone 3 - Lowland", 6.9205, 122.0812, "Landslide"],
              ["R-01", "Rescue Team Alpha", "Juanito Cruz", 8, "Male", "Rescued", "Mild hypothermia, reunited with mother", "Zone 4 - Chapel Area", 6.9250, 122.0795, "Flood"],
              ["R-03", "Rescue Team Beta", "Amara Climaco", 72, "Female", "Missing", "Swept away by current, search ongoing", "Zone 1 - Riverbank", 6.9240, 122.0770, "Landslide"]
            ];
            const stmt = db.prepare(`
              INSERT INTO casualty_logs (rescuer_id, rescuer_name, victim_name, age, gender, status, injury_details, location, latitude, longitude, disaster_type)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);
            seedLogs.forEach((log) => {
              stmt.run(log);
            });
            stmt.finalize();
            console.log("Seeded casualty logs table.");
          }
        });
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

    // Alter rescuers table for assigned target, role, zone, and location columns
    db.run("ALTER TABLE rescuers ADD COLUMN assigned_target_type TEXT", () => {});
    db.run("ALTER TABLE rescuers ADD COLUMN assigned_target_id TEXT", () => {});
    db.run("ALTER TABLE rescuers ADD COLUMN assigned_target_name TEXT", () => {});
    db.run("ALTER TABLE rescuers ADD COLUMN role TEXT DEFAULT 'Rescuer'", () => {});
    db.run("ALTER TABLE rescuers ADD COLUMN assigned_zone TEXT DEFAULT 'Unassigned'", () => {});
    db.run("ALTER TABLE rescuers ADD COLUMN latitude REAL", () => {});
    db.run("ALTER TABLE rescuers ADD COLUMN longitude REAL", () => {});
    db.run("ALTER TABLE rescuers ADD COLUMN response_status TEXT DEFAULT 'available'", () => {});

    // Seed default Tanods if missing
    db.get("SELECT COUNT(*) as count FROM rescuers WHERE role = 'Tanod'", (err, row) => {
      if (!err && row && row.count === 0) {
        const seedTanods = [
          ["tanod.perez@zamboalert.gov", "Juan", "Perez", "+639171234567", "Barangay Tanod ID", "BRGY-T01", 1, "available", "Tanod", "Zone 1 - Riverbank", 6.9225, 122.0770],
          ["tanod.climaco@zamboalert.gov", "Rodrigo", "Climaco", "+639287654321", "Barangay Tanod ID", "BRGY-T02", 1, "available", "Tanod", "Zone 3 - Lowland", 6.9200, 122.0810],
          ["tanod.santos@zamboalert.gov", "Maria", "Santos", "+639391112233", "Barangay Tanod ID", "BRGY-T03", 1, "available", "Tanod", "Zone 4 - Chapel Area", 6.9245, 122.0792]
        ];
        const stmt = db.prepare(`
          INSERT INTO rescuers (email, first_name, last_name, phone_number, id_type, id_number, is_verified, status, role, assigned_zone, latitude, longitude)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        seedTanods.forEach((t) => stmt.run(t));
        stmt.finalize();
        console.log("Seeded Barangay Tanods.");
      }
    });

    // Households / Resident Registry table
    db.run(`
      CREATE TABLE IF NOT EXISTS households (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        resident_name TEXT NOT NULL,
        household_head TEXT NOT NULL,
        phone_number TEXT NOT NULL,
        purok_zone TEXT NOT NULL,
        occupants_count INTEGER DEFAULT 1,
        vulnerable_count INTEGER DEFAULT 0,
        status TEXT DEFAULT 'Active', -- 'Active' | 'Opted-Out' | 'Evacuated'
        latitude REAL,
        longitude REAL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, () => {
      db.get("SELECT COUNT(*) as count FROM households", (err, row) => {
        if (!err && row && row.count === 0) {
          const seedHouseholds = [
            ["Elena Ramos", "Roberto Ramos", "+639171112233", "Zone 1 - Riverbank", 5, 2, "Active", 6.9231, 122.0760],
            ["Eduardo Climaco", "Eduardo Climaco", "+639282223344", "Zone 2 - Commercial", 4, 1, "Active", 6.9210, 122.0752],
            ["Teresita Alvarez", "Teresita Alvarez", "+639393334455", "Zone 3 - Lowland", 6, 3, "Evacuated", 6.9195, 122.0805],
            ["Ramon Valderrosa", "Ramon Valderrosa", "+639984445566", "Zone 4 - Chapel Area", 3, 0, "Active", 6.9248, 122.0790],
            ["Maria Clara Santos", "Gabriel Santos", "+639175556677", "Zone 1 - Riverbank", 4, 1, "Active", 6.9228, 122.0768]
          ];
          const stmt = db.prepare(`
            INSERT INTO households (resident_name, household_head, phone_number, purok_zone, occupants_count, vulnerable_count, status, latitude, longitude)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `);
          seedHouseholds.forEach((hh) => stmt.run(hh));
          stmt.finalize();
          console.log("Seeded households table.");
        }
      });
    });

    // Incidents & Analytics table
    db.run(`
      CREATE TABLE IF NOT EXISTS incidents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        disaster_type TEXT DEFAULT 'Flood',
        date_occurred TEXT NOT NULL,
        water_level_m REAL,
        affected_households INTEGER,
        total_rescued INTEGER,
        casualties_count INTEGER,
        avg_response_time_mins INTEGER,
        dispatch_time_mins REAL,
        on_scene_time_mins REAL,
        purok_zone TEXT,
        damage_estimate_php REAL,
        status TEXT DEFAULT 'Closed',
        summary_notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, () => {
      db.get("SELECT COUNT(*) as count FROM incidents", (err, row) => {
        if (!err && row && row.count === 0) {
          const seedIncidents = [
            ["Flash Flood Event - Tumaga River Spill", "Flood", "2026-08-14", 2.85, 142, 86, 1, 12, 3.2, 8.8, "Zone 1 - Riverbank", 1250000.00, "Closed", "Torrential rainfall caused Tumaga River overflow. Rapid deployment of Tanods & Rescue Team Alpha."],
            ["Monsoon Inundation & Lowland Surge", "Flood", "2025-10-22", 1.90, 98, 45, 0, 15, 4.1, 10.9, "Zone 3 - Lowland", 480000.00, "Closed", "Sustained monsoon rain inundating low-lying residential clusters in Zone 3."],
            ["Typhoon Kristine Flood Emergency", "Flood", "2024-11-05", 3.40, 310, 215, 2, 18, 5.5, 12.5, "Barangay Wide", 4500000.00, "Closed", "Category 3 Typhoon event. Major evacuation initiated across all 4 Purok zones."]
          ];
          const stmt = db.prepare(`
            INSERT INTO incidents (title, disaster_type, date_occurred, water_level_m, affected_households, total_rescued, casualties_count, avg_response_time_mins, dispatch_time_mins, on_scene_time_mins, purok_zone, damage_estimate_php, status, summary_notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `);
          seedIncidents.forEach((inc) => stmt.run(inc));
          stmt.finalize();
          console.log("Seeded incidents table.");
        }
      });
    });

    // ── Barangay Manpower & Worst-Case Disaster Resource Tables ──
    db.run(`
      CREATE TABLE IF NOT EXISTS barangays (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        district TEXT NOT NULL,
        population INTEGER NOT NULL,
        households INTEGER NOT NULL,
        risk_level TEXT NOT NULL, -- 'Extreme' | 'High' | 'Moderate'
        active_sar INTEGER DEFAULT 10,
        active_tanods INTEGER DEFAULT 20,
        active_medics INTEGER DEFAULT 6,
        active_logistics INTEGER DEFAULT 8,
        active_boat_crews INTEGER DEFAULT 4,
        rescue_boats INTEGER DEFAULT 2,
        ambulances INTEGER DEFAULT 1,
        contact_person TEXT,
        contact_number TEXT,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, () => {
      db.get("SELECT COUNT(*) as count FROM barangays", (err, row) => {
        if (!err && row && row.count === 0) {
          const seedBarangays = [
            ["Tumaga", "Central Urban", 32500, 6500, "Extreme", 14, 28, 8, 12, 6, 3, 2, "Capt. Roberto Alvarez", "+639171239901", 6.9235, 122.0780],
            ["Tetuan", "Central Urban", 29800, 5960, "High", 12, 24, 6, 10, 4, 2, 1, "Capt. Arnold Climaco", "+639171239902", 6.9180, 122.0880],
            ["Sta. Maria", "Central Urban", 24500, 4900, "Moderate", 10, 20, 6, 8, 2, 1, 1, "Capt. Maria Santos", "+639171239903", 6.9280, 122.0720],
            ["San Roque", "District 1 - West", 27300, 5460, "Extreme", 10, 22, 5, 8, 4, 2, 1, "Capt. Eduardo Perez", "+639171239904", 6.9400, 122.0650],
            ["Calarian", "District 1 - West", 28400, 5680, "High", 12, 26, 7, 10, 6, 3, 2, "Capt. Danilo Lim", "+639171239905", 6.9250, 122.0350],
            ["Pasonanca", "District 1 - West", 26100, 5220, "Extreme", 15, 25, 8, 10, 2, 1, 1, "Capt. Felipe Morales", "+639171239906", 6.9550, 122.0750],
            ["Baliwasan", "District 1 - West", 31200, 6240, "Extreme", 12, 26, 7, 12, 8, 4, 2, "Capt. Fatima Hassan", "+639171239907", 6.9120, 122.0580],
            ["Guiwan", "Central Urban", 16400, 3280, "High", 8, 18, 4, 6, 2, 1, 1, "Capt. Carlos Tan", "+639171239908", 6.9260, 122.0950],
            ["Ayala", "District 1 - West", 22900, 4580, "High", 10, 20, 5, 8, 5, 3, 1, "Capt. Ricardo Gomez", "+639171239909", 6.9600, 121.9600],
            ["Putik", "District 2 - East", 20500, 4100, "High", 9, 18, 5, 7, 3, 2, 1, "Capt. Teresa Ramos", "+639171239910", 6.9380, 122.1150],
            ["Talon-Talon", "District 2 - East", 35600, 7120, "Extreme", 14, 30, 8, 14, 10, 5, 2, "Capt. Jamil Sahid", "+639171239911", 6.8950, 122.1050],
            ["Labuan", "District 1 - West", 14200, 2840, "Extreme", 6, 14, 3, 5, 4, 2, 1, "Capt. Nelson Diaz", "+639171239912", 7.0800, 121.9050],
            ["Vitali", "District 2 - East", 12800, 2560, "High", 6, 12, 3, 5, 3, 2, 0, "Capt. Ernesto Cruz", "+639171239913", 7.3400, 122.2850],
            ["Curuan", "District 2 - East", 11500, 2300, "High", 5, 12, 3, 4, 3, 1, 0, "Capt. Josefa Reyes", "+639171239914", 7.2200, 122.2200],
            ["Campo Islam", "District 1 - West", 18900, 3780, "Extreme", 8, 18, 4, 8, 8, 4, 1, "Capt. Ibrahim Malik", "+639171239915", 6.9080, 122.0450],
            ["Sinunuc", "District 1 - West", 17600, 3520, "High", 7, 16, 4, 6, 4, 2, 1, "Capt. Rodrigo Yap", "+639171239916", 6.9400, 122.0100],
            ["Tugbungan", "District 2 - East", 23400, 4680, "High", 10, 22, 6, 8, 4, 2, 1, "Capt. Gloria Fernandez", "+639171239917", 6.9150, 122.0980],
            ["Santa Barbara", "Central Urban", 15200, 3040, "Moderate", 8, 16, 4, 6, 2, 1, 1, "Capt. Ramon Valderrosa", "+639171239918", 6.9130, 122.0800],
            ["Divisoria", "District 2 - East", 13600, 2720, "High", 6, 14, 3, 5, 2, 1, 1, "Capt. Beatriz Luna", "+639171239919", 6.9550, 122.1350],
            ["Manicahan", "District 2 - East", 10900, 2180, "High", 5, 12, 3, 4, 4, 2, 0, "Capt. Simeon Castro", "+639171239920", 7.0200, 122.1850]
          ];
          const stmt = db.prepare(`
            INSERT INTO barangays (name, district, population, households, risk_level, active_sar, active_tanods, active_medics, active_logistics, active_boat_crews, rescue_boats, ambulances, contact_person, contact_number, latitude, longitude)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `);
          seedBarangays.forEach((b) => stmt.run(b));
          stmt.finalize();
          console.log("Seeded 20 Zamboanga City Barangays.");
        }
      });
    });

    // Manpower Alerts table for Worst-Case Disaster Scenarios
    db.run(`
      CREATE TABLE IF NOT EXISTS manpower_alerts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        barangay_id INTEGER,
        barangay_name TEXT NOT NULL,
        disaster_type TEXT NOT NULL,
        scenario_level TEXT NOT NULL,
        projected_affected_pop INTEGER,
        required_sar INTEGER,
        required_tanods INTEGER,
        required_medics INTEGER,
        required_logistics INTEGER,
        required_total INTEGER,
        available_total INTEGER,
        deficit_count INTEGER,
        deficit_percentage REAL,
        alert_level TEXT NOT NULL, -- 'CRITICAL RED' | 'SEVERE ORANGE' | 'MODERATE YELLOW' | 'SUFFICIENT GREEN'
        status TEXT DEFAULT 'Active',
        mobilization_status TEXT DEFAULT 'Pending Mobilization',
        triggered_by TEXT DEFAULT 'ZCDRRMO AI System',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, () => {
      db.get("SELECT COUNT(*) as count FROM manpower_alerts", (err, row) => {
        if (!err && row && row.count === 0) {
          const seedAlerts = [
            [1, "Tumaga", "Flash Flood", "Level 4 - Worst-Case Catastrophe", 11200, 48, 65, 24, 30, 167, 60, 107, 64.1, "CRITICAL RED", "Active", "Emergency Callout Initiated", "Admin Command"],
            [11, "Talon-Talon", "Flash Flood", "Level 4 - Worst-Case Catastrophe", 14500, 56, 75, 28, 35, 194, 66, 128, 66.0, "CRITICAL RED", "Active", "Mutual Aid Requested", "Admin Command"],
            [7, "Baliwasan", "Flash Flood", "Level 4 - Worst-Case Catastrophe", 12800, 50, 68, 25, 32, 175, 57, 118, 67.4, "CRITICAL RED", "Active", "ZCDRRMO Reinforcement Escalated", "Admin Command"],
            [4, "San Roque", "Flash Flood", "Level 4 - Worst-Case Catastrophe", 9800, 38, 52, 18, 24, 132, 45, 87, 65.9, "CRITICAL RED", "Active", "Tanod Surge Alert Sent", "Admin Command"],
            [2, "Tetuan", "Flash Flood", "Level 4 - Worst-Case Catastrophe", 8900, 34, 48, 16, 22, 120, 52, 68, 56.7, "CRITICAL RED", "Active", "Pending Mobilization", "Admin Command"],
            [6, "Pasonanca", "Flash Flood", "Level 4 - Worst-Case Catastrophe", 7600, 30, 42, 14, 18, 104, 58, 46, 44.2, "SEVERE ORANGE", "Active", "Mutual Aid Standby", "Admin Command"],
            [5, "Calarian", "Flash Flood", "Level 4 - Worst-Case Catastrophe", 6500, 26, 38, 12, 16, 92, 55, 37, 40.2, "SEVERE ORANGE", "Active", "Pending Mobilization", "Admin Command"],
            [17, "Tugbungan", "Flash Flood", "Level 4 - Worst-Case Catastrophe", 5900, 24, 34, 12, 15, 85, 46, 39, 45.9, "SEVERE ORANGE", "Active", "Pending Mobilization", "Admin Command"],
            [3, "Sta. Maria", "Flash Flood", "Level 4 - Worst-Case Catastrophe", 4200, 18, 28, 8, 12, 66, 44, 22, 33.3, "SEVERE ORANGE", "Active", "Surplus Standby Ready", "Admin Command"],
            [18, "Santa Barbara", "Flash Flood", "Level 4 - Worst-Case Catastrophe", 2800, 12, 20, 6, 8, 46, 34, 12, 26.1, "MODERATE YELLOW", "Active", "Surplus Resource Available", "Admin Command"]
          ];
          const stmt = db.prepare(`
            INSERT INTO manpower_alerts (barangay_id, barangay_name, disaster_type, scenario_level, projected_affected_pop, required_sar, required_tanods, required_medics, required_logistics, required_total, available_total, deficit_count, deficit_percentage, alert_level, status, mobilization_status, triggered_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `);
          seedAlerts.forEach((a) => stmt.run(a));
          stmt.finalize();
          console.log("Seeded Worst-Case Manpower Alerts.");
        }
      });
    });

    // Manpower Mutual Aid Transfers table
    db.run(`
      CREATE TABLE IF NOT EXISTS manpower_transfers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        from_barangay TEXT NOT NULL,
        to_barangay TEXT NOT NULL,
        disaster_type TEXT NOT NULL,
        sar_count INTEGER DEFAULT 0,
        tanod_count INTEGER DEFAULT 0,
        medic_count INTEGER DEFAULT 0,
        logistics_count INTEGER DEFAULT 0,
        total_personnel INTEGER NOT NULL,
        status TEXT DEFAULT 'En-Route', -- 'En-Route' | 'On-Scene' | 'Completed'
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, () => {
      db.get("SELECT COUNT(*) as count FROM manpower_transfers", (err, row) => {
        if (!err && row && row.count === 0) {
          const seedTransfers = [
            ["Sta. Maria", "Tumaga", "Flash Flood", 4, 8, 2, 2, 16, "En-Route", "Mutual aid deployment for Tumaga River spill emergency"],
            ["Santa Barbara", "Tetuan", "Flash Flood", 2, 6, 2, 0, 10, "On-Scene", "Crowd & Evacuation perimeter assistance at Tetuan Central School"]
          ];
          const stmt = db.prepare(`
            INSERT INTO manpower_transfers (from_barangay, to_barangay, disaster_type, sar_count, tanod_count, medic_count, logistics_count, total_personnel, status, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `);
          seedTransfers.forEach((t) => stmt.run(t));
          stmt.finalize();
          console.log("Seeded Manpower Transfers.");
        }
      });
    });

    // Manpower External Agency Escalations table
    db.run(`
      CREATE TABLE IF NOT EXISTS manpower_escalations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        reference_no TEXT UNIQUE NOT NULL,
        target_barangays TEXT NOT NULL,
        disaster_type TEXT NOT NULL,
        scenario_level TEXT NOT NULL,
        requested_agency TEXT NOT NULL,
        requested_units TEXT NOT NULL,
        total_reinforcements INTEGER NOT NULL,
        priority TEXT NOT NULL,
        notes TEXT,
        status TEXT DEFAULT 'Acknowledged & Dispatched',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, () => {
      db.get("SELECT COUNT(*) as count FROM manpower_escalations", (err, row) => {
        if (!err && row && row.count === 0) {
          const seedEscalations = [
            ["ESC-ZCD-9901", "Tumaga, Talon-Talon, Baliwasan", "Flash Flood", "Level 4 - Worst-Case Catastrophe", "Philippine Coast Guard (PCG)", "4 Rubber Boats + 16 Water SAR Operatives", 16, "High Priority", "Urgent waterborne rescue required for stranded families on rooftops along riverbank."],
            ["ESC-ZCD-9902", "Tumaga, San Roque", "Flash Flood", "Level 4 - Worst-Case Catastrophe", "AFP Joint Task Force Zamboanga", "3 M35 6x6 Military Rescue Trucks + 24 Personnel", 24, "Critical Priority", "Heavy vehicle evacuation across 4-foot deep flooded access corridors."]
          ];
          const stmt = db.prepare(`
            INSERT INTO manpower_escalations (reference_no, target_barangays, disaster_type, scenario_level, requested_agency, requested_units, total_reinforcements, priority, notes, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `);
          seedEscalations.forEach((e) => stmt.run(e));
          stmt.finalize();
          console.log("Seeded Agency Escalations.");
        }
      });
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
  const { rescuer_id, rescuer_name, victim_name, age, gender, status, injury_details, location, latitude, longitude, disaster_type } = req.body;

  if (!victim_name || !status) {
    return res.status(400).json({ message: "Victim name and status are required fields." });
  }

  db.run(
    `INSERT INTO casualty_logs (rescuer_id, rescuer_name, victim_name, age, gender, status, injury_details, location, latitude, longitude, disaster_type)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
      longitude ? parseFloat(longitude) : null,
      disaster_type || "Unknown"
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

/* ─── Household / Resident Registry API ─── */

// Get all registered households
app.get("/api/households", (req, res) => {
  const { purok } = req.query;
  let sql = "SELECT * FROM households";
  const params = [];
  if (purok && purok !== "ALL") {
    sql += " WHERE purok_zone = ?";
    params.push(purok);
  }
  sql += " ORDER BY created_at DESC";

  db.all(sql, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ message: "Database query error", error: err.message });
    }
    res.json(rows);
  });
});

// Add new household / resident record
app.post("/api/households", (req, res) => {
  const { resident_name, household_head, phone_number, purok_zone, occupants_count, vulnerable_count, status, latitude, longitude } = req.body;

  if (!resident_name || !phone_number || !purok_zone) {
    return res.status(400).json({ message: "Resident Name, Phone Number, and Purok/Zone are required." });
  }

  db.run(
    `INSERT INTO households (resident_name, household_head, phone_number, purok_zone, occupants_count, vulnerable_count, status, latitude, longitude)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      resident_name,
      household_head || resident_name,
      phone_number,
      purok_zone,
      occupants_count ? parseInt(occupants_count) : 1,
      vulnerable_count ? parseInt(vulnerable_count) : 0,
      status || 'Active',
      latitude ? parseFloat(latitude) : null,
      longitude ? parseFloat(longitude) : null
    ],
    function (err) {
      if (err) {
        return res.status(500).json({ message: "Failed to add household record", error: err.message });
      }
      res.status(201).json({
        message: "Household registered successfully",
        householdId: this.lastID
      });
    }
  );
});

// Update household record
app.put("/api/households/:id", (req, res) => {
  const { id } = req.params;
  const { resident_name, household_head, phone_number, purok_zone, occupants_count, vulnerable_count, status, latitude, longitude } = req.body;

  db.run(
    `UPDATE households SET resident_name = ?, household_head = ?, phone_number = ?, purok_zone = ?, occupants_count = ?, vulnerable_count = ?, status = ?, latitude = ?, longitude = ?
     WHERE id = ?`,
    [
      resident_name,
      household_head,
      phone_number,
      purok_zone,
      parseInt(occupants_count || 1),
      parseInt(vulnerable_count || 0),
      status,
      latitude ? parseFloat(latitude) : null,
      longitude ? parseFloat(longitude) : null,
      id
    ],
    function (err) {
      if (err) {
        return res.status(500).json({ message: "Failed to update household", error: err.message });
      }
      res.json({ message: "Household updated successfully." });
    }
  );
});

// Delete household record
app.delete("/api/households/:id", (req, res) => {
  const { id } = req.params;
  db.run("DELETE FROM households WHERE id = ?", [id], function (err) {
    if (err) {
      return res.status(500).json({ message: "Failed to delete household", error: err.message });
    }
    res.json({ message: "Household record deleted." });
  });
});

// SMS Broadcast to Households
app.post("/api/households/broadcast", (req, res) => {
  const { purok_zone, message, priority } = req.body;
  if (!message) {
    return res.status(400).json({ message: "Broadcast message is required." });
  }

  let sql = "SELECT phone_number, resident_name FROM households WHERE status = 'Active'";
  const params = [];
  if (purok_zone && purok_zone !== "ALL") {
    sql += " AND purok_zone = ?";
    params.push(purok_zone);
  }

  db.all(sql, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ message: "Database query error", error: err.message });
    }

    const recipientsCount = rows.length;
    console.log(`[SMS BROADCAST] Transmitted to ${recipientsCount} registered households (${purok_zone || "All Zones"}): "${message}"`);

    res.json({
      message: `SMS alert successfully transmitted to ${recipientsCount} registered household contact(s).`,
      recipientsCount,
      timestamp: new Date().toISOString()
    });
  });
});


/* ─── Rescuer & Tanod Zone Assignment & GPS Location API ─── */

// Assign Tanod or Rescuer to a specific Purok / Zone
app.post("/api/rescuers/assign-zone", (req, res) => {
  const { rescuerId, zone, role } = req.body;
  if (!rescuerId || !zone) {
    return res.status(400).json({ message: "Rescuer ID and Zone are required." });
  }

  let sql = "UPDATE rescuers SET assigned_zone = ?";
  const params = [zone];
  if (role) {
    sql += ", role = ?";
    params.push(role);
  }
  sql += " WHERE id = ? OR id_number = ?";
  params.push(rescuerId, rescuerId);

  db.run(sql, params, function (err) {
    if (err) {
      return res.status(500).json({ message: "Failed to assign zone", error: err.message });
    }
    res.json({ message: `Assigned zone updated to ${zone} successfully.` });
  });
});

// Update Rescuer / Tanod live GPS location & status
app.post("/api/rescuers/location", (req, res) => {
  const { rescuerId, latitude, longitude, status } = req.body;
  if (!rescuerId || latitude === undefined || longitude === undefined) {
    return res.status(400).json({ message: "Rescuer ID, latitude, and longitude are required." });
  }

  let sql = "UPDATE rescuers SET latitude = ?, longitude = ?";
  const params = [parseFloat(latitude), parseFloat(longitude)];
  if (status) {
    sql += ", status = ?";
    params.push(status);
  }
  sql += " WHERE id = ? OR id_number = ?";
  params.push(rescuerId, rescuerId);

  db.run(sql, params, function (err) {
    if (err) {
      return res.status(500).json({ message: "Failed to update location", error: err.message });
    }
    res.json({ message: "Location updated successfully." });
  });
});


/* ─── Incident Reports & Analytics API ─── */

// Get all incident reports
app.get("/api/incidents", (req, res) => {
  db.all("SELECT * FROM incidents ORDER BY date_occurred DESC", [], (err, rows) => {
    if (err) {
      return res.status(500).json({ message: "Database query error", error: err.message });
    }
    res.json(rows);
  });
});

// Post new incident report
app.post("/api/incidents", (req, res) => {
  const {
    title, disaster_type, date_occurred, water_level_m, affected_households,
    total_rescued, casualties_count, avg_response_time_mins, dispatch_time_mins,
    on_scene_time_mins, purok_zone, damage_estimate_php, status, summary_notes
  } = req.body;

  if (!title || !date_occurred) {
    return res.status(400).json({ message: "Title and Date Occurred are required." });
  }

  db.run(
    `INSERT INTO incidents (title, disaster_type, date_occurred, water_level_m, affected_households, total_rescued, casualties_count, avg_response_time_mins, dispatch_time_mins, on_scene_time_mins, purok_zone, damage_estimate_php, status, summary_notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      title,
      disaster_type || 'Flood',
      date_occurred,
      water_level_m ? parseFloat(water_level_m) : null,
      affected_households ? parseInt(affected_households) : 0,
      total_rescued ? parseInt(total_rescued) : 0,
      casualties_count ? parseInt(casualties_count) : 0,
      avg_response_time_mins ? parseInt(avg_response_time_mins) : 15,
      dispatch_time_mins ? parseFloat(dispatch_time_mins) : 4.0,
      on_scene_time_mins ? parseFloat(on_scene_time_mins) : 11.0,
      purok_zone || 'Barangay Wide',
      damage_estimate_php ? parseFloat(damage_estimate_php) : 0.0,
      status || 'Closed',
      summary_notes || null
    ],
    function (err) {
      if (err) {
        return res.status(500).json({ message: "Failed to insert incident report", error: err.message });
      }
      res.status(201).json({
        message: "Incident report recorded successfully",
        incidentId: this.lastID
      });
    }
  );
});

// Delete incident report
app.delete("/api/incidents/:id", (req, res) => {
  const { id } = req.params;
  db.run("DELETE FROM incidents WHERE id = ?", [id], function (err) {
    if (err) {
      return res.status(500).json({ message: "Failed to delete incident report", error: err.message });
    }
    res.json({ message: "Incident report deleted." });
  });
});

// CSV Export route for ZCDRRMO / Thesis Results
app.get("/api/incidents/export", (req, res) => {
  db.all("SELECT * FROM incidents ORDER BY date_occurred DESC", [], (err, rows) => {
    if (err) {
      return res.status(500).json({ message: "Database query error", error: err.message });
    }

    const headers = ["ID", "Title", "Disaster Type", "Date Occurred", "Peak Water Level (m)", "Affected Households", "Total Rescued", "Casualties", "Avg Response Time (min)", "Dispatch Time (min)", "On Scene Time (min)", "Purok/Zone", "Damage Estimate (PHP)", "Status", "Summary"];
    const csvRows = [headers.join(",")];

    rows.forEach(r => {
      const row = [
        r.id,
        `"${(r.title || "").replace(/"/g, '""')}"`,
        r.disaster_type,
        r.date_occurred,
        r.water_level_m || 0,
        r.affected_households || 0,
        r.total_rescued || 0,
        r.casualties_count || 0,
        r.avg_response_time_mins || 0,
        r.dispatch_time_mins || 0,
        r.on_scene_time_mins || 0,
        `"${(r.purok_zone || "").replace(/"/g, '""')}"`,
        r.damage_estimate_php || 0,
        r.status,
        `"${(r.summary_notes || "").replace(/"/g, '""')}"`
      ];
      csvRows.push(row.join(","));
    });

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", 'attachment; filename="ZamboAlert_ZCDRRMO_Incident_Analytics_Report.csv"');
    res.send(csvRows.join("\n"));
  });
});

/* ─── Manpower & Worst-Case Disaster Scenario REST APIs ─── */

// 1. Get all barangays with baseline manpower and equipment
app.get("/api/manpower/barangays", (req, res) => {
  db.all("SELECT * FROM barangays ORDER BY risk_level = 'Extreme' DESC, risk_level = 'High' DESC, name ASC", [], (err, rows) => {
    if (err) {
      return res.status(500).json({ message: "Database query error", error: err.message });
    }
    res.json(rows);
  });
});

// 2. Update a barangay's manpower and equipment
app.put("/api/manpower/barangays/:id", (req, res) => {
  const { id } = req.params;
  const {
    active_sar, active_tanods, active_medics, active_logistics,
    active_boat_crews, rescue_boats, ambulances, contact_person, contact_number
  } = req.body;

  db.run(
    `UPDATE barangays SET
      active_sar = ?,
      active_tanods = ?,
      active_medics = ?,
      active_logistics = ?,
      active_boat_crews = ?,
      rescue_boats = ?,
      ambulances = ?,
      contact_person = ?,
      contact_number = ?
     WHERE id = ?`,
    [
      parseInt(active_sar || 0),
      parseInt(active_tanods || 0),
      parseInt(active_medics || 0),
      parseInt(active_logistics || 0),
      parseInt(active_boat_crews || 0),
      parseInt(rescue_boats || 0),
      parseInt(ambulances || 0),
      contact_person,
      contact_number,
      id
    ],
    function (err) {
      if (err) {
        return res.status(500).json({ message: "Failed to update barangay manpower", error: err.message });
      }
      res.json({ message: "Barangay manpower inventory updated successfully." });
    }
  );
});

// 3. Get all active worst-case disaster manpower alerts
app.get("/api/manpower/alerts", (req, res) => {
  db.all("SELECT * FROM manpower_alerts ORDER BY deficit_percentage DESC, deficit_count DESC", [], (err, rows) => {
    if (err) {
      return res.status(500).json({ message: "Database query error", error: err.message });
    }
    res.json(rows);
  });
});



// 5. Trigger an official Emergency Red Alert & Mobilization Broadcast for a specific Barangay
app.post("/api/manpower/trigger-alert", (req, res) => {
  const { barangay_name, custom_message, priority = "CRITICAL_DEFICIT" } = req.body;

  if (!barangay_name) {
    return res.status(400).json({ message: "Barangay Name is required." });
  }

  db.run(
    "UPDATE manpower_alerts SET alert_level = 'CRITICAL RED', mobilization_status = 'Emergency Mobilization Broadcast Sent' WHERE barangay_name = ?",
    [barangay_name],
    function (err) {
      if (err) {
        return res.status(500).json({ message: "Failed to update alert state", error: err.message });
      }

      console.log(`[MANPOWER RED ALERT BROADCAST] Issued for Barangay ${barangay_name}. Message: "${custom_message || 'ALL OFF-DUTY TANODS, SAR OPERATIVES, AND MEDICAL RESERVISTS REPORT TO BARANGAY COMMAND HQ IMMEDIATELY.'}"`);

      res.json({
        message: `Emergency Worst-Case Manpower Red Alert triggered for Barangay ${barangay_name}. LoRa & SMS mobilization signals broadcasted.`,
        barangay_name,
        timestamp: new Date().toISOString()
      });
    }
  );
});

// 6. Mutual Aid Transfer (Cross-Barangay Reinforcement)
app.post("/api/manpower/mutual-aid-transfer", (req, res) => {
  const { from_barangay, to_barangay, disaster_type, sar_count = 0, tanod_count = 0, medic_count = 0, logistics_count = 0, notes } = req.body;

  if (!from_barangay || !to_barangay) {
    return res.status(400).json({ message: "Source (From) and Destination (To) Barangay are required." });
  }

  const total = parseInt(sar_count || 0) + parseInt(tanod_count || 0) + parseInt(medic_count || 0) + parseInt(logistics_count || 0);

  if (total <= 0) {
    return res.status(400).json({ message: "At least 1 personnel must be selected for transfer." });
  }

  db.run(
    `INSERT INTO manpower_transfers (from_barangay, to_barangay, disaster_type, sar_count, tanod_count, medic_count, logistics_count, total_personnel, status, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'En-Route', ?)`,
    [
      from_barangay,
      to_barangay,
      disaster_type || "Flash Flood",
      parseInt(sar_count || 0),
      parseInt(tanod_count || 0),
      parseInt(medic_count || 0),
      parseInt(logistics_count || 0),
      total,
      notes || `Mutual Aid Reinforcement from ${from_barangay} to ${to_barangay}`
    ],
    function (err) {
      if (err) {
        return res.status(500).json({ message: "Failed to record mutual aid transfer", error: err.message });
      }

      // Update destination alert mobilization status
      db.run(
        "UPDATE manpower_alerts SET mobilization_status = 'Mutual Aid Reinforcements En-Route' WHERE barangay_name = ?",
        [to_barangay]
      );

      res.status(201).json({
        message: `Mutual aid deployment of ${total} personnel dispatched from ${from_barangay} to ${to_barangay}.`,
        transferId: this.lastID,
        total_personnel: total
      });
    }
  );
});

// 7. Get Mutual Aid Transfers history
app.get("/api/manpower/transfers", (req, res) => {
  db.all("SELECT * FROM manpower_transfers ORDER BY created_at DESC", [], (err, rows) => {
    if (err) {
      return res.status(500).json({ message: "Database query error", error: err.message });
    }
    res.json(rows);
  });
});

// 8. Escalate Reinforcement Request to External Agency (ZCDRRMO, PCG, BFP, AFP, Red Cross)
app.post("/api/manpower/escalate-agency", (req, res) => {
  const { target_barangays, disaster_type, scenario_level, requested_agency, requested_units, total_reinforcements, priority = "Critical Priority", notes } = req.body;

  if (!target_barangays || !requested_agency || !requested_units) {
    return res.status(400).json({ message: "Target Barangays, Requested Agency, and Requested Units are required." });
  }

  const refNo = `ESC-ZCD-${Math.floor(1000 + Math.random() * 9000)}`;

  db.run(
    `INSERT INTO manpower_escalations (reference_no, target_barangays, disaster_type, scenario_level, requested_agency, requested_units, total_reinforcements, priority, notes, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Acknowledged & Dispatched')`,
    [
      refNo,
      Array.isArray(target_barangays) ? target_barangays.join(", ") : target_barangays,
      disaster_type || "Flash Flood",
      scenario_level || "Level 4 - Worst-Case Catastrophe",
      requested_agency,
      requested_units,
      parseInt(total_reinforcements || 10),
      priority,
      notes || "Emergency Disaster Augmentation Requisition"
    ],
    function (err) {
      if (err) {
        return res.status(500).json({ message: "Failed to record agency escalation", error: err.message });
      }

      res.status(201).json({
        message: `High-priority escalation transmitted to ${requested_agency}. Reference Code: ${refNo}`,
        reference_no: refNo,
        escalationId: this.lastID
      });
    }
  );
});

// 9. Get Agency Escalation history
app.get("/api/manpower/escalations", (req, res) => {
  db.all("SELECT * FROM manpower_escalations ORDER BY created_at DESC", [], (err, rows) => {
    if (err) {
      return res.status(500).json({ message: "Database query error", error: err.message });
    }
    res.json(rows);
  });
});

// 10. Export Worst-Case Manpower Disaster Matrix CSV Report
app.get("/api/manpower/export", (req, res) => {
  db.all(
    `SELECT a.*, b.population, b.district, b.risk_level, b.rescue_boats, b.ambulances, b.contact_person, b.contact_number
     FROM manpower_alerts a
     LEFT JOIN barangays b ON a.barangay_name = b.name
     ORDER BY a.deficit_percentage DESC`,
    [],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ message: "Database query error", error: err.message });
      }

      const headers = [
        "Alert ID", "Barangay", "District", "Population", "Vulnerability Risk",
        "Disaster Scenario", "Scenario Level", "Projected Affected Pop",
        "Required SAR", "Required Tanods", "Required Medics", "Required Logistics",
        "Total Required Manpower", "Available Manpower", "Deficit Count (Shortage)",
        "Deficit %", "Alert Level", "Mobilization Status", "Rescue Boats", "Ambulances", "Contact Person", "Contact Number"
      ];

      const csvRows = [headers.join(",")];

      rows.forEach((r) => {
        const row = [
          r.id,
          `"${(r.barangay_name || "").replace(/"/g, '""')}"`,
          `"${(r.district || "").replace(/"/g, '""')}"`,
          r.population || 0,
          r.risk_level || "High",
          `"${(r.disaster_type || "").replace(/"/g, '""')}"`,
          `"${(r.scenario_level || "").replace(/"/g, '""')}"`,
          r.projected_affected_pop || 0,
          r.required_sar || 0,
          r.required_tanods || 0,
          r.required_medics || 0,
          r.required_logistics || 0,
          r.required_total || 0,
          r.available_total || 0,
          r.deficit_count || 0,
          `${r.deficit_percentage || 0}%`,
          r.alert_level || "CRITICAL RED",
          `"${(r.mobilization_status || "").replace(/"/g, '""')}"`,
          r.rescue_boats || 0,
          r.ambulances || 0,
          `"${(r.contact_person || "").replace(/"/g, '""')}"`,
          `"${(r.contact_number || "").replace(/"/g, '""')}"`
        ];
        csvRows.push(row.join(","));
      });

      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", 'attachment; filename="ZCDRRMO_Worst_Case_Disaster_Manpower_Alert_Report.csv"');
      res.send(csvRows.join("\n"));
    }
  );
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});



