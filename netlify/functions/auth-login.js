const { createSessionToken, getAuthConfig, sendJson, sessionCookie } = require("./_shared/auth");
const { withLegacyHandler } = require("./_shared/shim");

function collectBody(request) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;

    request.on("data", (chunk) => {
      size += chunk.length;

      if (size > 1024 * 1024) {
        reject(new Error("Payload te groot."));
        request.destroy();
        return;
      }

      chunks.push(chunk);
    });

    request.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    request.on("error", reject);
  });
}

async function legacyHandler(request, response) {
  if (request.method !== "POST") {
    sendJson(response, 405, { error: "Methode niet toegestaan." });
    return;
  }

  try {
    const payload = JSON.parse((await collectBody(request)) || "{}");
    const config = getAuthConfig();
    const username = String(payload.username || "").trim();
    const password = String(payload.password || "");

    if (username !== config.username || password !== config.password) {
      sendJson(response, 401, { error: "Ongeldige gebruikersnaam of wachtwoord." });
      return;
    }

    sendJson(response, 200, { ok: true }, { "Set-Cookie": sessionCookie(createSessionToken()) });
  } catch (error) {
    sendJson(response, 400, { error: error.message || "Ongeldige login." });
  }
}

exports.handler = withLegacyHandler("auth-login", legacyHandler);
