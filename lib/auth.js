import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";

const secretStr = process.env.AUTH_SECRET || "dev-only-insecure-secret-change-me";
const secret = new TextEncoder().encode(secretStr);

export const SESSION_COOKIE = "skj_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

export async function signSession(payload) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + MAX_AGE_SECONDS)
    .sign(secret);
}

export async function verifySession(token) {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload; // { sub, name, role }
  } catch {
    return null;
  }
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SECONDS
  };
}

export async function hashPassword(plain) {
  return await bcrypt.hash(plain, 10);
}
export async function checkPassword(plain, hash) {
  return await bcrypt.compare(plain, hash);
}
