/**
 * auth-store.ts
 *
 * Lightweight client-side authentication state.
 *
 * ⚠️  SECURITY NOTE
 * This is a frontend-only access gate.  The password is checked in the login
 * component and only a boolean flag is persisted here.  Anyone who can inspect
 * the compiled JavaScript bundle or bypass localStorage can access the UI.
 * If the data served by the API must be genuinely protected, a server-side
 * session / token mechanism is required in addition to this gate.
 */

import { create } from 'zustand';

const LS_AUTH_KEY = 'athena_auth';

function readAuthFlag(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(LS_AUTH_KEY) === 'true';
  } catch {
    return false;
  }
}

function writeAuthFlag(value: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    if (value) {
      window.localStorage.setItem(LS_AUTH_KEY, 'true');
    } else {
      window.localStorage.removeItem(LS_AUTH_KEY);
    }
  } catch {
    // ignore
  }
}

interface AuthState {
  isAuthenticated: boolean;
  /** Call only after verifying the password externally. */
  login: () => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: readAuthFlag(),

  login: () => {
    writeAuthFlag(true);
    set({ isAuthenticated: true });
  },

  logout: () => {
    writeAuthFlag(false);
    set({ isAuthenticated: false });
  },
}));
