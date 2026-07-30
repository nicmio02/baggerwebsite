const path = require("path");
const { getStore } = require("@netlify/blobs");
const { requireAdmin, sendJson } = require("./_shared/auth");
const { withLegacyHandler } = require("./_shared/shim");

// Netlify's synchronous functions cap request payloads at 6MB (same underlying
// AWS Lambda limit). Base64 adds ~30% overhead, so ~4.5MB is the real ceiling for
// binary image data — cap well under that so the app's own error fires first
// instead of a hard platform-level 413.
const maxUploadBytes = 4 * 1024 * 1024;

function getUploadsStore() {
  return getStore({ name: "uploads", consistency: "strong" });
}

function safeUploadName(value) {
  const extension = path.extname(String(value || "")).toLowerCase() || ".jpg";
  const base = path
    .basename(String(value || "upload"), extension)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70);

  return `${base || "upload"}-${Date.now()}${extension}`;
}

function collectRequestBody(request) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;

    request.on("data", (chunk) => {
      size += chunk.length;

      if (size > maxUploadBytes) {
        reject(new Error("Afbeelding is te groot."));
        request.destroy();
        return;
      }

      chunks.push(chunk);
    });

    request.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    request.on("error", reject);
  });
}

function safeUploadPath(value) {
  const raw = String(value || "").trim();
  const decoded = raw.includes("%") ? decodeURIComponent(raw) : raw;
  const clean = decoded.replace(/^\/+/, "");

  if (!/^uploads\/[a-z0-9][a-z0-9._-]*$/i.test(clean)) {
    return "";
  }

  return clean;
}

function keyFromUploadPath(uploadPath) {
  return uploadPath.slice("uploads/".length);
}

async function legacyHandler(request, response) {
  if (request.method === "GET") {
    try {
      const requestUrl = new URL(request.url, "http://localhost");
      const uploadPath = safeUploadPath(requestUrl.searchParams.get("path"));

      if (!uploadPath) {
        sendJson(response, 400, { error: "Ongeldig afbeeldingspad." });
        return;
      }

      const result = await getUploadsStore().getWithMetadata(keyFromUploadPath(uploadPath), {
        type: "arrayBuffer",
      });

      if (!result) {
        sendJson(response, 404, { error: "Afbeelding niet gevonden." });
        return;
      }

      response.statusCode = 200;
      response.setHeader("Content-Type", result.metadata?.contentType || "application/octet-stream");
      response.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      response.end(Buffer.from(result.data));
    } catch (error) {
      sendJson(response, 404, { error: error.message || "Afbeelding niet gevonden." });
    }

    return;
  }

  if (request.method !== "POST") {
    sendJson(response, 405, { error: "Methode niet toegestaan." });
    return;
  }

  if (!requireAdmin(request, response)) {
    return;
  }

  try {
    const payload = JSON.parse(await collectRequestBody(request));
    const match = String(payload.data || "").match(/^data:([^;]+);base64,(.+)$/);

    if (!match || !/^image\//.test(match[1])) {
      sendJson(response, 400, { error: "Upload een geldige afbeelding." });
      return;
    }

    const filename = safeUploadName(payload.filename);
    const buffer = Buffer.from(match[2], "base64");
    const uploadPath = `uploads/${filename}`;

    await getUploadsStore().set(keyFromUploadPath(uploadPath), buffer, {
      metadata: { contentType: match[1] },
    });

    sendJson(response, 201, { path: uploadPath, url: `/api/uploads?path=${encodeURIComponent(uploadPath)}` });
  } catch (error) {
    sendJson(response, 400, { error: error.message || "Upload mislukt." });
  }
}

exports.handler = withLegacyHandler("uploads", legacyHandler);
