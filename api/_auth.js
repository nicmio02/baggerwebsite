const crypto = require("crypto");

const authCookieName = "bb_admin_session";
const sessionMaxAgeMs = 12 * 60 * 60 * 1000;

function getAuthConfig() {
  return {
    username: process.env.ADMIN_USER || "owner",
    password: process.env.ADMIN_PASSWORD || "blauwebagger",
    secret: process.env.ADMIN_SECRET || "blauwe-bagger-local-admin-secret",
  };
}

function parseCookies(request) {
  return Object.fromEntries(
    String(request.headers.cookie || "")
      .split(";")
      .map((cookie) => cookie.trim())
      .filter(Boolean)
      .map((cookie) => {
        const index = cookie.indexOf("=");
        return index === -1
          ? [cookie, ""]
          : [decodeURIComponent(cookie.slice(0, index)), decodeURIComponent(cookie.slice(index + 1))];
      }),
  );
}

function signSession(value) {
  return crypto.createHmac("sha256", getAuthConfig().secret).update(value).digest("hex");
}

function createSessionToken() {
  const issuedAt = Date.now().toString();
  return `${issuedAt}.${signSession(issuedAt)}`;
}

function isAuthenticated(request) {
  const token = parseCookies(request)[authCookieName];

  if (!token) {
    return false;
  }

  const [issuedAt, signature] = token.split(".");
  const age = Date.now() - Number(issuedAt);

  if (!issuedAt || !signature || !Number.isFinite(age) || age < 0 || age > sessionMaxAgeMs) {
    return false;
  }

  return signature === signSession(issuedAt);
}

function sessionCookie(token) {
  return `${authCookieName}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=${
    sessionMaxAgeMs / 1000
  }`;
}

function clearSessionCookie() {
  return `${authCookieName}=; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=0`;
}

function sendJson(response, statusCode, payload, headers = {}) {
  response.statusCode = statusCode;
  Object.entries({
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    ...headers,
  }).forEach(([key, value]) => response.setHeader(key, value));
  response.end(JSON.stringify(payload));
}

function requireAdmin(request, response) {
  if (isAuthenticated(request)) {
    return true;
  }

  sendJson(response, 401, { error: "Niet ingelogd." });
  return false;
}

module.exports = {
  authCookieName,
  clearSessionCookie,
  createSessionToken,
  getAuthConfig,
  isAuthenticated,
  requireAdmin,
  sendJson,
  sessionCookie,
};
