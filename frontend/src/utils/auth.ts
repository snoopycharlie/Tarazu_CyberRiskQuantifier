/**
 * utils/auth.ts — Demo authentication helpers for Tarazu.
 * 
 * NOTE: This is a demo authentication flow designed to be replaced
 * with real authentication (OAuth2 / JWT) when deployed in production.
 * It uses localStorage for session persistence which is intentional
 * for the demo context.
 */

const SESSION_KEY = 'tarazu_demo_session';

export interface DemoUser {
  name: string;
  email: string;
  role: string;
  org?: string;
  orgId?: string;
  avatarUrl?: string;
  loginTime: string;
}

// Demo credentials
const DEMO_CREDENTIALS: Record<string, { password: string; user: DemoUser }> = {
  'admin@tarazu.demo': {
    password: 'tarazu2026',
    user: {
      name: 'Demo User',
      email: 'admin@tarazu.demo',
      role: 'Risk Analyst',
      org: 'Suraksha Finance Ltd',
      loginTime: new Date().toISOString(),
    },
  },
};

export const authLogin = (
  email: string,
  password: string,
): { success: boolean; user?: DemoUser; error?: string } => {
  const entry = DEMO_CREDENTIALS[email.toLowerCase().trim()];
  if (!entry) {
    return { success: false, error: 'Account not found. Use demo credentials below.' };
  }
  if (entry.password !== password) {
    return { success: false, error: 'Incorrect password. Please try again.' };
  }
  const user: DemoUser = { ...entry.user, loginTime: new Date().toISOString() };
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  return { success: true, user };
};

export const authLogout = (): void => {
  localStorage.removeItem(SESSION_KEY);
};

export const getSession = (): DemoUser | null => {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as DemoUser;
  } catch {
    return null;
  }
};

export const isAuthenticated = (): boolean => getSession() !== null;
