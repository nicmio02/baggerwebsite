const http = require("http");
const fs = require("fs");
const path = require("path");

const root = __dirname;
const port = Number(process.env.PORT || 8080);
const dataDir = path.join(root, "data");
const projectsFile = path.join(dataDir, "projects.json");

const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".mp4": "video/mp4",
  ".ico": "image/x-icon",
};

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  response.end(JSON.stringify(payload, null, 2));
}

function sendText(response, statusCode, message) {
  response.writeHead(statusCode, {
    "Content-Type": "text/plain; charset=utf-8",
    "Cache-Control": "no-store",
  });
  response.end(message);
}

async function ensureProjectsStore() {
  await fs.promises.mkdir(dataDir, { recursive: true });

  if (!fs.existsSync(projectsFile)) {
    await fs.promises.writeFile(projectsFile, "[]\n", "utf8");
  }
}

async function readProjects() {
  await ensureProjectsStore();
  const raw = await fs.promises.readFile(projectsFile, "utf8");

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeProjects(projects) {
  await ensureProjectsStore();
  await fs.promises.writeFile(projectsFile, `${JSON.stringify(projects, null, 2)}\n`, "utf8");
}

function slugify(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function uniqueSlug(baseSlug, projects, currentId) {
  const safeBase = baseSlug || `project-${Date.now()}`;
  let candidate = safeBase;
  let suffix = 2;

  while (projects.some((project) => project.slug === candidate && project.id !== currentId)) {
    candidate = `${safeBase}-${suffix}`;
    suffix += 1;
  }

  return candidate;
}

function normalizeParagraphs(input) {
  if (Array.isArray(input)) {
    return input.map((item) => String(item).trim()).filter(Boolean);
  }

  return String(input || "")
    .split(/\n\s*\n/g)
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeLines(input) {
  if (Array.isArray(input)) {
    return input.map((item) => String(item).trim()).filter(Boolean);
  }

  return String(input || "")
    .split(/\r?\n/g)
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeProjectCategory(value) {
  const category = String(value || "").trim().toLowerCase();

  if (/(samenwerking|samenwerkingen|partner|consortium|tbi|dc-bricks)/.test(category)) {
    return "Samenwerkingen";
  }

  if (/(r&d|onderzoek|research|verkenning|ontwikkeling|extractie|pfas|3d|print)/.test(category)) {
    return "R&D";
  }

  if (/(praktijktest|praktijktesten|praktijk|pilot|test|case|locatie|dry run|amsterdam)/.test(category)) {
    return "Praktijktesten";
  }

  return "Praktijktesten";
}

function sortProjects(projects) {
  return [...projects].sort((a, b) => {
    const dateCompare = String(b.date || "").localeCompare(String(a.date || ""));

    if (dateCompare !== 0) {
      return dateCompare;
    }

    return String(b.updatedAt || "").localeCompare(String(a.updatedAt || ""));
  });
}

function normalizeProjectInput(input, projects, currentProject = null) {
  const title = String(input.title || "").trim();

  if (!title) {
    throw new Error("Titel is verplicht.");
  }

  const slugBase = slugify(String(input.slug || title));
  const body = normalizeParagraphs(input.body);
  const excerpt =
    String(input.excerpt || "").trim() ||
    (body[0] ? body[0].slice(0, 220) : "Projectupdate van Blauwe Bagger.");
  const highlights = normalizeLines(input.highlights).slice(0, 6);
  const now = new Date().toISOString();

  return {
    id: currentProject?.id || `project_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    slug: uniqueSlug(slugBase, projects, currentProject?.id),
    title,
    excerpt,
    date: String(input.date || currentProject?.date || new Date().toISOString().slice(0, 10)).slice(0, 10),
    category: normalizeProjectCategory(input.category || currentProject?.category),
    location: String(input.location || currentProject?.location || "Nederland").trim() || "Nederland",
    status: String(input.status || currentProject?.status || "Actief").trim() || "Actief",
    coverImage: String(input.coverImage || currentProject?.coverImage || "").trim(),
    featured: Boolean(input.featured),
    body,
    highlights,
    createdAt: currentProject?.createdAt || now,
    updatedAt: now,
  };
}

function collectRequestBody(request) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;

    request.on("data", (chunk) => {
      size += chunk.length;

      if (size > 2 * 1024 * 1024) {
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

async function handleProjectsApi(request, response, url) {
  const slug = decodeURIComponent(url.pathname.replace(/^\/api\/projects\/?/, "")).trim();
  const projects = await readProjects();

  if (request.method === "GET" && url.pathname === "/api/projects") {
    sendJson(response, 200, sortProjects(projects));
    return true;
  }

  if (request.method === "POST" && url.pathname === "/api/projects") {
    const rawBody = await collectRequestBody(request);
    const payload = JSON.parse(rawBody || "{}");
    const nextProject = normalizeProjectInput(payload, projects);
    const nextProjects = sortProjects(
      [nextProject, ...projects].map((project) =>
        nextProject.featured && project.id !== nextProject.id
          ? { ...project, featured: false, updatedAt: project.updatedAt || new Date().toISOString() }
          : project,
      ),
    );
    await writeProjects(nextProjects);
    sendJson(response, 201, nextProject);
    return true;
  }

  if (!slug) {
    sendJson(response, 404, { error: "Project niet gevonden." });
    return true;
  }

  const existingProject = projects.find((project) => project.slug === slug);

  if (!existingProject) {
    sendJson(response, 404, { error: "Project niet gevonden." });
    return true;
  }

  if (request.method === "GET") {
    sendJson(response, 200, existingProject);
    return true;
  }

  if (request.method === "PUT") {
    const rawBody = await collectRequestBody(request);
    const payload = JSON.parse(rawBody || "{}");
    const updatedProject = normalizeProjectInput(payload, projects, existingProject);
    const nextProjects = sortProjects(
      projects.map((project) => {
        if (project.id === existingProject.id) {
          return updatedProject;
        }

        if (updatedProject.featured) {
          return { ...project, featured: false };
        }

        return project;
      }),
    );
    await writeProjects(nextProjects);
    sendJson(response, 200, updatedProject);
    return true;
  }

  if (request.method === "DELETE") {
    const nextProjects = projects.filter((project) => project.id !== existingProject.id);
    await writeProjects(nextProjects);
    sendJson(response, 200, { ok: true });
    return true;
  }

  sendJson(response, 405, { error: "Methode niet toegestaan." });
  return true;
}

function resolveFilePath(urlPath) {
  if (urlPath === "/en" || urlPath === "/en/") {
    return path.resolve(root, "./index.html");
  }

  if (urlPath !== "/projecten" && urlPath.startsWith("/projecten/") && !path.extname(urlPath)) {
    return path.resolve(root, "./project-detail.html");
  }

  let requestedPath = decodeURIComponent(urlPath);

  if (requestedPath === "/") {
    requestedPath = "/index.html";
  } else if (requestedPath.endsWith("/")) {
    requestedPath = `${requestedPath}index.html`;
  } else if (!path.extname(requestedPath)) {
    requestedPath = `${requestedPath}.html`;
  }

  return path.resolve(root, `.${requestedPath}`);
}

async function sendStaticFile(request, response, filePath) {
  const extension = path.extname(filePath).toLowerCase();
  const contentType = types[extension] || "application/octet-stream";
  const stat = await fs.promises.stat(filePath);
  const range = request.headers.range;

  if (range && extension === ".mp4") {
    const match = range.match(/bytes=(\d*)-(\d*)/);

    if (match) {
      const start = match[1] ? Number(match[1]) : 0;
      const end = match[2] ? Number(match[2]) : stat.size - 1;

      if (start <= end && end < stat.size) {
        response.writeHead(206, {
          "Content-Type": contentType,
          "Cache-Control": "no-store",
          "Accept-Ranges": "bytes",
          "Content-Range": `bytes ${start}-${end}/${stat.size}`,
          "Content-Length": end - start + 1,
        });
        fs.createReadStream(filePath, { start, end }).pipe(response);
        return;
      }
    }
  }

  response.writeHead(200, {
    "Content-Type": contentType,
    "Cache-Control": "no-store",
    "Accept-Ranges": extension === ".mp4" ? "bytes" : "none",
    "Content-Length": stat.size,
  });
  fs.createReadStream(filePath).pipe(response);
}

const server = http.createServer(async (request, response) => {
  try {
    const url = new URL(request.url, `http://${request.headers.host}`);

    if (url.pathname.startsWith("/api/projects")) {
      await handleProjectsApi(request, response, url);
      return;
    }

    const filePath = resolveFilePath(url.pathname);

    if (!filePath.startsWith(root)) {
      sendText(response, 403, "Forbidden");
      return;
    }

    await sendStaticFile(request, response, filePath);
  } catch (error) {
    if (error && error.code === "ENOENT") {
      sendText(response, 404, "Not found");
      return;
    }

    if (error instanceof SyntaxError) {
      sendJson(response, 400, { error: "Ongeldige JSON." });
      return;
    }

    sendJson(response, 500, { error: error.message || "Interne serverfout." });
  }
});

server.listen(port, "0.0.0.0", () => {
  console.log(`Blauwe Bagger site running at http://127.0.0.1:${port}`);
});
