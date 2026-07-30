const { isAuthenticated, sendJson } = require("./_shared/auth");
const { withLegacyHandler } = require("./_shared/shim");

function legacyHandler(request, response) {
  if (request.method !== "GET") {
    sendJson(response, 405, { error: "Methode niet toegestaan." });
    return;
  }

  sendJson(response, 200, { authenticated: isAuthenticated(request) });
}

exports.handler = withLegacyHandler("auth-session", legacyHandler);
