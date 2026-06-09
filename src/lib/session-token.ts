export const AUTH_COOKIE_NAME = "natkhat_ai_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

type SessionPayload = {
  userId: string;
  email: string;
  role: "USER" | "ADMIN";
};

type TokenPayload = SessionPayload & {
  exp: number;
};

const encoder = new TextEncoder();

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET is required for authentication.");
  }

  return secret;
}

function base64UrlEncode(value: ArrayBuffer | string) {
  const bytes = typeof value === "string" ? encoder.encode(value) : new Uint8Array(value);
  let binary = "";

  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlDecode(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), "=");
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

async function getSigningKey() {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(getJwtSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

export async function signSessionToken(payload: SessionPayload) {
  const header = { alg: "HS256", typ: "JWT" };
  const exp = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS;
  const tokenPayload: TokenPayload = { ...payload, exp };
  const unsignedToken = `${base64UrlEncode(JSON.stringify(header))}.${base64UrlEncode(JSON.stringify(tokenPayload))}`;
  const signature = await crypto.subtle.sign("HMAC", await getSigningKey(), encoder.encode(unsignedToken));

  return `${unsignedToken}.${base64UrlEncode(signature)}`;
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  const [encodedHeader, encodedPayload, encodedSignature] = token.split(".");

  if (!encodedHeader || !encodedPayload || !encodedSignature) {
    return null;
  }

  const unsignedToken = `${encodedHeader}.${encodedPayload}`;
  const isValidSignature = await crypto.subtle.verify(
    "HMAC",
    await getSigningKey(),
    base64UrlDecode(encodedSignature),
    encoder.encode(unsignedToken),
  );

  if (!isValidSignature) {
    return null;
  }

  let payload: TokenPayload;

  try {
    payload = JSON.parse(new TextDecoder().decode(base64UrlDecode(encodedPayload))) as TokenPayload;
  } catch {
    return null;
  }

  const hasValidRole = payload.role === "USER" || payload.role === "ADMIN";

  if (!payload.userId || !payload.email || !hasValidRole || payload.exp < Math.floor(Date.now() / 1000)) {
    return null;
  }

  return {
    userId: payload.userId,
    email: payload.email,
    role: payload.role,
  };
}
