// Client-side auth for internal team tool.
// Users are stored in a shared localStorage registry; session tracks the logged-in user.
// All per-user data is namespaced with the user ID so each person's pipeline is isolated.

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  initials: string;
  created: string;
}

const SESSION_KEY = "stc_session";
const REGISTRY_KEY = "stc_users_registry";

// djb2 hash — good enough for an internal tool password check
function djb2(str: string): string {
  let h = 5381;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) + h) ^ str.charCodeAt(i);
    h = h >>> 0;
  }
  return h.toString(36);
}

function hashPassword(password: string, email: string): string {
  // Salted with email + constant so the same password hashes differently per user
  return djb2(`${email.toLowerCase()}::${password}::stc-dealnexa-2026`);
}

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

type UserRecord = AuthUser & { passwordHash: string };

function loadRegistry(): Record<string, UserRecord> {
  try {
    const r = localStorage.getItem(REGISTRY_KEY);
    return r ? (JSON.parse(r) as Record<string, UserRecord>) : {};
  } catch {
    return {};
  }
}

function saveRegistry(reg: Record<string, UserRecord>): void {
  try {
    localStorage.setItem(REGISTRY_KEY, JSON.stringify(reg));
  } catch {}
}

// ── Public API ───────────────────────────────────────────────────────────────

export function register(
  name: string,
  email: string,
  password: string
): { user: AuthUser } | { error: string } {
  if (!name.trim()) return { error: "Name is required" };
  if (!email.includes("@")) return { error: "Enter a valid email address" };
  if (password.length < 6) return { error: "Password must be at least 6 characters" };

  const reg = loadRegistry();
  const key = email.toLowerCase().trim();
  if (reg[key]) return { error: "An account with this email already exists" };

  const user: AuthUser = {
    id: `u${Date.now().toString(36)}`,
    name: name.trim(),
    email: key,
    initials: initials(name),
    created: new Date().toISOString().slice(0, 10),
  };
  reg[key] = { ...user, passwordHash: hashPassword(password, key) };
  saveRegistry(reg);
  persistSession(user);
  return { user };
}

export function login(
  email: string,
  password: string
): { user: AuthUser } | { error: string } {
  const reg = loadRegistry();
  const key = email.toLowerCase().trim();
  const stored = reg[key];
  if (!stored) return { error: "No account found for this email" };
  if (stored.passwordHash !== hashPassword(password, key))
    return { error: "Incorrect password" };
  const user: AuthUser = {
    id: stored.id,
    name: stored.name,
    email: stored.email,
    initials: stored.initials,
    created: stored.created,
  };
  persistSession(user);
  return { user };
}

export function getSession(): AuthUser | null {
  try {
    const r = localStorage.getItem(SESSION_KEY);
    return r ? (JSON.parse(r) as AuthUser) : null;
  } catch {
    return null;
  }
}

export function clearSession(): void {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {}
}

function persistSession(user: AuthUser): void {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  } catch {}
}

// Returns a user-scoped localStorage key so each user's data is isolated
export function userKey(base: string, userId: string): string {
  return `${base}_${userId}`;
}
