const { clearSessionCookie, sendJson } = require("./_shared/auth");
const { withLegacyHandler } = require("./_shared/shim");

function legacyHandler(request, response) {
  if (request.method !== "POST") {
    sendJson(response, 405, { error: "Methode niet toegestaan." });
    return;
  }

  sendJson(response, 200, { ok: true }, { "Set-Cookie": clearSessionCookie() });
}

exports.handler = withLegacyHandler("auth-logout", legacyHandler);
