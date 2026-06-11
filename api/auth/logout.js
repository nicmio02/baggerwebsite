const { clearSessionCookie, sendJson } = require("../_auth");

module.exports = function handler(request, response) {
  if (request.method !== "POST") {
    sendJson(response, 405, { error: "Methode niet toegestaan." });
    return;
  }

  sendJson(response, 200, { ok: true }, { "Set-Cookie": clearSessionCookie() });
};
