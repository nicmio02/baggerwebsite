const http = require("http");
const fs = require("fs");
const path = require("path");

const root = __dirname;
const port = Number(process.env.PORT || 8080);

const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".gif": "image/gif",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".mp4": "video/mp4",
  ".otf": "font/otf",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".ttf": "font/ttf",
  ".webm": "video/webm",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

function isFile(filePath) {
  try {
    return fs.statSync(filePath).isFile();
  } catch {
    return false;
  }
}

function resolveRequest(requestPath) {
  const decodedPath = decodeURIComponent(requestPath).replace(/\\/g, "/");
  const relativePath = decodedPath.replace(/^\/+/, "");
  const directPath = path.resolve(root, relativePath || "index.html");

  if (!directPath.toLowerCase().startsWith(root.toLowerCase() + path.sep)) {
    return null;
  }

  const candidates = [directPath];

  if (!path.extname(directPath)) {
    candidates.push(`${directPath}.html`);
    candidates.push(path.join(directPath, "index.html"));
  }

  return candidates.find(isFile) || null;
}

const server = http.createServer((request, response) => {
  let pathname;

  try {
    pathname = new URL(request.url, `http://${request.headers.host || "localhost"}`).pathname;
  } catch {
    response.writeHead(400, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Bad request");
    return;
  }

  const filePath = resolveRequest(pathname);

  if (!filePath) {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Page not found");
    return;
  }

  const extension = path.extname(filePath).toLowerCase();
  response.writeHead(200, {
    "Cache-Control": "no-store",
    "Content-Type": mimeTypes[extension] || "application/octet-stream",
  });

  if (request.method === "HEAD") {
    response.end();
    return;
  }

  fs.createReadStream(filePath).pipe(response);
});

server.listen(port, () => {
  console.log(`Blaue Bagger localhost: http://localhost:${port}`);
});
