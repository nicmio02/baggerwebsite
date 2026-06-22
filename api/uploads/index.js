const path = require("path");
const { put } = require("@vercel/blob");
const { requireAdmin, sendJson } = require("../_auth");

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

      if (size > 8 * 1024 * 1024) {
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

module.exports = async function handler(request, response) {
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
    const blob = await put(`uploads/${filename}`, buffer, {
      access: "public",
      contentType: match[1],
      allowOverwrite: false,
    });

    sendJson(response, 201, { url: blob.url });
  } catch (error) {
    sendJson(response, 400, { error: error.message || "Upload mislukt." });
  }
};
