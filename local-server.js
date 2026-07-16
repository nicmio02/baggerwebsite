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
  const fileSize = fs.statSync(filePath).size;
  const baseHeaders = {
    "Accept-Ranges": "bytes",
    "Cache-Control": "no-store",
    "Content-Type": mimeTypes[extension] || "application/octet-stream",
  };
  const rangeHeader = request.headers.range;

  if (rangeHeader) {
    const match = /^bytes=(\d*)-(\d*)$/.exec(rangeHeader);
    const requestedStart = match?.[1] ? Number(match[1]) : null;
    const requestedEnd = match?.[2] ? Number(match[2]) : null;
    const start = requestedStart === null
      ? Math.max(fileSize - (requestedEnd ?? fileSize), 0)
      : requestedStart;
    const end = requestedStart === null
      ? fileSize - 1
      : Math.min(requestedEnd ?? fileSize - 1, fileSize - 1);

    if (
      Number.isInteger(start) &&
      Number.isInteger(end) &&
      start >= 0 &&
      start <= end &&
      start < fileSize
    ) {
      response.writeHead(206, {
        ...baseHeaders,
        "Content-Length": end - start + 1,
        "Content-Range": `bytes ${start}-${end}/${fileSize}`,
      });

      if (request.method === "HEAD") {
        response.end();
        return;
      }

      fs.createReadStream(filePath, { start, end }).pipe(response);
      return;
    }

    response.writeHead(416, {
      ...baseHeaders,
      "Content-Range": `bytes */${fileSize}`,
    });
    response.end();
    return;
  }

  response.writeHead(200, {
    ...baseHeaders,
    "Content-Length": fileSize,
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
