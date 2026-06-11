const { isAuthenticated, sendJson } = require("../_auth");

module.exports = function handler(request, response) {
  if (request.method !== "GET") {
    sendJson(response, 405, { error: "Methode niet toegestaan." });
    return;
  }

  sendJson(response, 200, { authenticated: isAuthenticated(request) });
};
