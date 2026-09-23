import "server-only";
import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { promisify } from "node:util";
import Database from "better-sqlite3";

const scrypt = promisify(scryptCallback);
const databasePath = join(process.cwd(), "data", "ai-sana.db");
mkdirSync(join(process.cwd(), "data"), { recursive: true });
const db = new Database(databasePath);
db.pragma("journal_mode = WAL");
db.exec(`CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, email TEXT UNIQUE, phone TEXT UNIQUE, password_hash TEXT NOT NULL, verified_at TEXT, created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS verification_codes (token TEXT PRIMARY KEY, user_id TEXT NOT NULL, code_hash TEXT NOT NULL, expires_at INTEGER NOT NULL, attempts INTEGER NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS sessions (token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL, expires_at INTEGER NOT NULL);`);

type User = { id: string; email: string | null; phone: string | null; password_hash: string; verified_at: string | null };
export type AuthMethod = "email" | "phone";

export function validIdentifier(method: AuthMethod, value: string) {
  return method === "email" ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) : /^\+?[0-9 ()-]{10,}$/.test(value);
}
async function hashPassword(password: string, salt = randomBytes(16).toString("hex")) {
  const hash = (await scrypt(password, salt, 64)) as Buffer;
  return `${salt}:${hash.toString("hex")}`;
}
async function passwordMatches(password: string, stored: string) {
  const [salt, hash] = stored.split(":");
  const candidate = (await scrypt(password, salt, 64)) as Buffer;
  return timingSafeEqual(candidate, Buffer.from(hash, "hex"));
}
function findUser(method: AuthMethod, identifier: string) {
  return db.prepare(`SELECT * FROM users WHERE ${method} = ?`).get(identifier) as User | undefined;
}
export async function startAuth(mode: "login" | "register", method: AuthMethod, identifier: string, password: string) {
  const user = findUser(method, identifier);
  if (mode === "register") {
    if (user) throw new Error("Аккаунт с этими данными уже существует.");
    const id = randomBytes(16).toString("hex");
    db.prepare(`INSERT INTO users (id, ${method}, password_hash, created_at) VALUES (?, ?, ?, ?)`)
      .run(id, identifier, await hashPassword(password), new Date().toISOString());
    return issueCode(id);
  }
  if (!user || !(await passwordMatches(password, user.password_hash))) throw new Error("Неверные данные для входа.");
  if (user.verified_at) return { userId: user.id, verified: true } as const;
  return issueCode(user.id);
}
function issueCode(userId: string) {
  const token = randomBytes(20).toString("hex");
  const code = String(Math.floor(100000 + Math.random() * 900000));
  db.prepare("DELETE FROM verification_codes WHERE user_id = ?").run(userId);
  db.prepare("INSERT INTO verification_codes (token, user_id, code_hash, expires_at) VALUES (?, ?, ?, ?)")
    .run(token, userId, createHash("sha256").update(code).digest("hex"), Date.now() + 10 * 60_000);
  return { token, verified: false, devCode: process.env.NODE_ENV === "production" ? undefined : code } as const;
}
export function confirmCode(token: string, code: string) {
  const row = db.prepare("SELECT * FROM verification_codes WHERE token = ?").get(token) as { user_id: string; code_hash: string; expires_at: number; attempts: number } | undefined;
  if (!row || row.expires_at < Date.now() || row.attempts >= 5) throw new Error("Код недействителен. Запросите новый.");
  if (createHash("sha256").update(code).digest("hex") !== row.code_hash) {
    db.prepare("UPDATE verification_codes SET attempts = attempts + 1 WHERE token = ?").run(token);
    throw new Error("Неверный код.");
  }
  db.prepare("UPDATE users SET verified_at = ? WHERE id = ?").run(new Date().toISOString(), row.user_id);
  db.prepare("DELETE FROM verification_codes WHERE token = ?").run(token);
  return row.user_id;
}
export function createSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  db.prepare("INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)")
    .run(createHash("sha256").update(token).digest("hex"), userId, Date.now() + 7 * 24 * 60 * 60_000);
  return token;
}
