const SESSION_TTL_MS = 30 * 60 * 1000;
const HISTORY_LIMIT = 5;

export interface SessionData {
  history: string[];
  team: string[];
  lastEntities: string[];
  expiresAt: number;
}

const sessions = new Map<string, SessionData>();

function now(): number {
  return Date.now();
}

function createSession(): SessionData {
  return {
    history: [],
    team: [],
    lastEntities: [],
    expiresAt: now() + SESSION_TTL_MS,
  };
}

function cleanupExpired(): void {
  const current = now();
  for (const [key, session] of sessions.entries()) {
    if (session.expiresAt <= current) sessions.delete(key);
  }
}

export function getSession(sessionId: string): SessionData {
  cleanupExpired();
  const existing = sessions.get(sessionId);
  if (!existing) {
    const created = createSession();
    sessions.set(sessionId, created);
    return created;
  }
  if (existing.expiresAt <= now()) {
    const created = createSession();
    sessions.set(sessionId, created);
    return created;
  }
  existing.expiresAt = now() + SESSION_TTL_MS;
  return existing;
}

export function addHistory(sessionId: string, role: 'user' | 'assistant', text: string): void {
  const session = getSession(sessionId);
  session.history.push(`${role}: ${text}`);
  if (session.history.length > HISTORY_LIMIT) {
    session.history.splice(0, session.history.length - HISTORY_LIMIT);
  }
}

export function mergeSession(
  sessionId: string,
  update: Partial<Pick<SessionData, 'team' | 'lastEntities'>>
): SessionData {
  const session = getSession(sessionId);
  if (update.team) {
    const merged = new Set([...session.team, ...update.team]);
    session.team = Array.from(merged);
  }
  if (update.lastEntities) {
    const merged = new Set(update.lastEntities);
    session.lastEntities = Array.from(merged);
  }
  return session;
}
