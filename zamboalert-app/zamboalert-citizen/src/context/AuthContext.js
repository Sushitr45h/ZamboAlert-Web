// src/context/AuthContext.js
//
// Role-based auth context. Currently uses a simple in-memory mock so the
// full UI flow works without a backend. When you're ready to go live:
//   1. Replace `MOCK_USERS` with real API calls (your backend / Firebase / Supabase)
//   2. Store the returned token in expo-secure-store for persistence across restarts
//   3. On app launch, read the stored token and call setSession() to restore state
//
// Roles: 'citizen' | 'rescuer'
// The rescuer role is fully wired here — RootNavigator shows a placeholder
// screen for rescuers until the real rescuer app is integrated.

import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

// ---------------------------------------------------------------------------
// Mock user store — swap this out for a real API
// ---------------------------------------------------------------------------
const MOCK_USERS = [
  { id: '1', name: 'Test Citizen', email: 'citizen@test.com', password: 'test1234', role: 'citizen' },
  { id: '2', name: 'Test Rescuer', email: 'rescuer@test.com', password: 'test1234', role: 'rescuer' },
];

// Simulates the in-memory "database" of registered users during this session
let SESSION_USERS = [...MOCK_USERS];

// ---------------------------------------------------------------------------

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // null = not logged in
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function clearError() {
    setError('');
  }

  // ------------------------------------------------------------------
  // LOGIN
  // ------------------------------------------------------------------
  async function login(email, password, role) {
    setLoading(true);
    setError('');
    try {
      await delay(800); // simulate network

      const found = SESSION_USERS.find(
        (u) =>
          u.email.toLowerCase() === email.trim().toLowerCase() &&
          u.password === password &&
          u.role === role
      );

      if (!found) {
        // Give a slightly more helpful hint
        const emailMatch = SESSION_USERS.find(
          (u) => u.email.toLowerCase() === email.trim().toLowerCase()
        );
        if (emailMatch && emailMatch.role !== role) {
          setError(`This account is registered as a ${emailMatch.role}, not a ${role}.`);
        } else {
          setError('Incorrect email or password. Please try again.');
        }
        return false;
      }

      setUser({ id: found.id, name: found.name, email: found.email, role: found.role });
      return true;
    } catch (e) {
      setError('Something went wrong. Please try again.');
      return false;
    } finally {
      setLoading(false);
    }
  }

  // ------------------------------------------------------------------
  // SIGN UP
  // ------------------------------------------------------------------
  async function signUp(name, email, password, role) {
    setLoading(true);
    setError('');
    try {
      await delay(1000);

      const exists = SESSION_USERS.find(
        (u) => u.email.toLowerCase() === email.trim().toLowerCase()
      );
      if (exists) {
        setError('An account with this email already exists. Try logging in.');
        return false;
      }

      if (password.length < 8) {
        setError('Password must be at least 8 characters.');
        return false;
      }

      const newUser = {
        id: String(Date.now()),
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        role,
      };
      SESSION_USERS.push(newUser);
      setUser({ id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role });
      return true;
    } catch (e) {
      setError('Something went wrong. Please try again.');
      return false;
    } finally {
      setLoading(false);
    }
  }

  // ------------------------------------------------------------------
  // LOGOUT
  // ------------------------------------------------------------------
  function logout() {
    setUser(null);
    setError('');
  }

  return (
    <AuthContext.Provider value={{ user, loading, error, clearError, login, signUp, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
