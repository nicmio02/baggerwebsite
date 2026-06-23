const fs = require("fs");
const path = require("path");
const { requireAdmin, sendJson } = require("./_auth");

const root = path.resolve(__dirname, "..");
const blobPrefix = "cms";

const stores = {
  projects: {
    file: path.join(root, "data", "projects.json"),
    blobPath: `${blobPrefix}/projects.json`,
    label: "Project",
    type: "project",
  },
  jobs: {
    file: path.join(root, "data", "jobs.json"),
    blobPath: `${blobPrefix}/jobs.json`,
    label: "Vacature",
    type: "job",
  },
  news: {
    file: path.join(root, "data", "news.json"),
    blobPath: `${blobPrefix}/news.json`,
    label: "Nieuwsbericht",
    type: "news",
  },
};

let blobModulePromise = null;

async function getBlobModule() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return null;
  }

  if (!blobModulePromise) {
    blobModulePromise = import("@vercel/blob").catch(() => null);
  }

  return blobModulePromise;
}

function readLocalStore(config) {
  try {
    const parsed = JSON.parse(fs.readFileSync(config.file, "utf8"));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function readBlobStore(config) {
  const blob = await getBlobModule();

  if (!blob) {
    return null;
  }

  try {
    const result = await blob.get(config.blobPath, { access: "private" });

    if (result?.statusCode !== 200 || !result.stream) {
      return null;
    }

    const parsed = JSON.parse(await readStreamAsText(result.stream));
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    if (isBlobNotFoundError(error)) {
      return null;
    }

    throw error;
  }
}

async function readStreamAsText(stream) {
  if (typeof stream.getReader === "function") {
    const reader = stream.getReader();
    const chunks = [];

    while (true) {
      const { value, done } = await reader.read();

      if (done) {
        break;
      }

      chunks.push(Buffer.from(value));
    }

    return Buffer.concat(chunks).toString("utf8");
  }

  if (typeof stream[Symbol.asyncIterator] === "function") {
    const chunks = [];

    for await (const chunk of stream) {
      chunks.push(Buffer.from(chunk));
    }

    return Buffer.concat(chunks).toString("utf8");
  }

  if (typeof stream.text === "function") {
    return stream.text();
  }

  return "";
}

function isBlobNotFoundError(error) {
  const name = String(error?.name || "");
  const message = String(error?.message || "");
  return /not.*found/i.test(name) || /not.*found/i.test(message);
}

async function readStore(type) {
  const config = stores[type];

  if (!config) {
    return [];
  }

  const blobItems = await readBlobStore(config);
  return Array.isArray(blobItems) ? blobItems : readLocalStore(config);
}

async function writeStore(type, items) {
  const config = stores[type];
  const blob = await getBlobModule();

  if (!config || !blob) {
    throw new Error("Opslaan op Vercel heeft BLOB_READ_WRITE_TOKEN en @vercel/blob nodig.");
  }

  await blob.put(config.blobPath, `${JSON.stringify(items, null, 2)}\n`, {
    access: "private",
    allowOverwrite: true,
    contentType: "application/json; charset=utf-8",
  });
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

function uniqueSlug(baseSlug, items, currentId) {
  const safeBase = baseSlug || `item-${Date.now()}`;
  let candidate = safeBase;
  let suffix = 2;

  while (items.some((item) => item.slug === candidate && item.id !== currentId)) {
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

const allowedProjectBlocks = new Set([
  "hero",
  "meta",
  "facts",
  "metrics",
  "resultCards",
  "text",
  "simpleText",
  "columns",
  "imageText",
  "featureGrid",
  "process",
  "testList",
  "gallery",
  "photoCollage",
  "cta",
]);

function normalizeBlockFieldValue(value) {
  if (value && typeof value === "object") {
    return JSON.stringify(value).slice(0, 5000);
  }

  return String(value || "").slice(0, 5000);
}

function normalizeProjectBlocks(input, currentItem = null) {
  const source = Array.isArray(input) ? input : Array.isArray(currentItem?.blocks) ? currentItem.blocks : [];

  return source
    .filter((block) => allowedProjectBlocks.has(block?.type))
    .slice(0, 24)
    .map((block, index) => {
      const fields = block.fields && typeof block.fields === "object" ? block.fields : {};

      return {
        id: String(block.id || `block_${index + 1}`).slice(0, 80),
        type: block.type,
        fields: Object.fromEntries(
          Object.entries(fields)
            .slice(0, 16)
            .map(([key, value]) => [String(key).slice(0, 40), normalizeBlockFieldValue(value)]),
        ),
      };
    });
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

function sortItems(items) {
  return [...items].sort((a, b) => {
    const dateCompare = String(b.date || "").localeCompare(String(a.date || ""));

    if (dateCompare !== 0) {
      return dateCompare;
    }

    return String(b.updatedAt || "").localeCompare(String(a.updatedAt || ""));
  });
}

function normalizeProjectInput(input, items, currentItem = null) {
  const title = String(input.title || "").trim();

  if (!title) {
    throw new Error("Titel is verplicht.");
  }

  const now = new Date().toISOString();
  const slugBase = slugify(String(input.slug || title));
  const body = normalizeParagraphs(input.body);
  const excerpt =
    String(input.excerpt || "").trim() ||
    (body[0] ? body[0].slice(0, 220) : "Projectupdate van Blauwe Bagger.");

  return {
    id: currentItem?.id || `project_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    slug: uniqueSlug(slugBase, items, currentItem?.id),
    title,
    excerpt,
    date: String(input.date || currentItem?.date || new Date().toISOString().slice(0, 10)).slice(0, 10),
    category: normalizeProjectCategory(input.category || currentItem?.category),
    location: String(input.location || currentItem?.location || "Nederland").trim() || "Nederland",
    status: String(input.status || currentItem?.status || "Actief").trim() || "Actief",
    coverImage: String(input.coverImage || currentItem?.coverImage || "").trim(),
    featured: Boolean(input.featured),
    body,
    highlights: normalizeLines(input.highlights).slice(0, 6),
    blocks: normalizeProjectBlocks(input.blocks, currentItem),
    createdAt: currentItem?.createdAt || now,
    updatedAt: now,
  };
}

function normalizeAdminPostInput(input, items, currentItem = null, fallbackType = "item") {
  const title = String(input.title || "").trim();

  if (!title) {
    throw new Error("Titel is verplicht.");
  }

  const now = new Date().toISOString();
  const slugBase = slugify(String(input.slug || title));
  const body = normalizeParagraphs(input.body);

  return {
    id: currentItem?.id || `${fallbackType}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    slug: uniqueSlug(slugBase, items, currentItem?.id),
    title,
    excerpt: String(input.excerpt || "").trim() || (body[0] ? body[0].slice(0, 220) : ""),
    date: String(input.date || currentItem?.date || new Date().toISOString().slice(0, 10)).slice(0, 10),
    category: String(input.category || currentItem?.category || "").trim(),
    status: String(input.status || currentItem?.status || "Concept").trim() || "Concept",
    body,
    createdAt: currentItem?.createdAt || now,
    updatedAt: now,
  };
}

function normalizeInput(type, input, items, currentItem = null) {
  if (type === "projects") {
    return normalizeProjectInput(input, items, currentItem);
  }

  return normalizeAdminPostInput(input, items, currentItem, stores[type]?.type || type);
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

async function parseJsonBody(request) {
  const rawBody = await collectRequestBody(request);
  return JSON.parse(rawBody || "{}");
}

function sendMutationError(response, error) {
  const message = error instanceof SyntaxError ? "Ongeldige JSON." : error.message || "Opslaan mislukt.";
  const statusCode =
    /BLOB_READ_WRITE_TOKEN|@vercel\/blob|permanente opslag/i.test(message) ? 501 : 400;

  sendJson(response, statusCode, { error: message });
}

async function handleCollection(request, response, type) {
  const config = stores[type];

  if (!config) {
    sendJson(response, 404, { error: "Collectie niet gevonden." });
    return;
  }

  if (request.method === "GET") {
    sendJson(response, 200, sortItems(await readStore(type)));
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
    const items = await readStore(type);
    const payload = await parseJsonBody(request);
    const nextItem = normalizeInput(type, payload, items);
    const nextItems = sortItems(
      [nextItem, ...items].map((item) =>
        type === "projects" && nextItem.featured && item.id !== nextItem.id
          ? { ...item, featured: false, updatedAt: item.updatedAt || new Date().toISOString() }
          : item,
      ),
    );

    await writeStore(type, nextItems);
    sendJson(response, 201, nextItem);
  } catch (error) {
    sendMutationError(response, error);
  }
}

async function handleItem(request, response, type, slug) {
  const config = stores[type];

  if (!config) {
    sendJson(response, 404, { error: "Collectie niet gevonden." });
    return;
  }

  const items = await readStore(type);
  const item = items.find((entry) => entry.slug === slug);

  if (!item) {
    sendJson(response, 404, { error: `${config.label} niet gevonden.` });
    return;
  }

  if (request.method === "GET") {
    sendJson(response, 200, item);
    return;
  }

  if (!requireAdmin(request, response)) {
    return;
  }

  try {
    if (request.method === "PUT") {
      const payload = await parseJsonBody(request);
      const updatedItem = normalizeInput(type, payload, items, item);
      const nextItems = sortItems(
        items.map((entry) => {
          if (entry.id === item.id) {
            return updatedItem;
          }

          if (type === "projects" && updatedItem.featured) {
            return { ...entry, featured: false };
          }

          return entry;
        }),
      );

      await writeStore(type, nextItems);
      sendJson(response, 200, updatedItem);
      return;
    }

    if (request.method === "DELETE") {
      await writeStore(
        type,
        items.filter((entry) => entry.id !== item.id),
      );
      sendJson(response, 200, { ok: true });
      return;
    }

    sendJson(response, 405, { error: "Methode niet toegestaan." });
  } catch (error) {
    sendMutationError(response, error);
  }
}

module.exports = {
  handleCollection,
  handleItem,
};
