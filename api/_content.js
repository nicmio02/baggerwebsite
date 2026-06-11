const fs = require("fs");
const path = require("path");
const { requireAdmin, sendJson } = require("./_auth");

const root = path.resolve(__dirname, "..");

const stores = {
  projects: {
    file: path.join(root, "data", "projects.json"),
    label: "Project",
  },
  jobs: {
    file: path.join(root, "data", "jobs.json"),
    label: "Vacature",
  },
  news: {
    file: path.join(root, "data", "news.json"),
    label: "Nieuwsbericht",
  },
};

function readStore(type) {
  const config = stores[type];

  if (!config) {
    return [];
  }

  try {
    const parsed = JSON.parse(fs.readFileSync(config.file, "utf8"));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
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

function readonlyMutationResponse(response) {
  sendJson(response, 501, {
    error:
      "Opslaan is op Vercel nog niet gekoppeld aan permanente opslag. Koppel hiervoor Vercel Blob, KV of een database.",
  });
}

function handleCollection(request, response, type) {
  if (request.method === "GET") {
    sendJson(response, 200, sortItems(readStore(type)));
    return;
  }

  if (!requireAdmin(request, response)) {
    return;
  }

  readonlyMutationResponse(response);
}

function handleItem(request, response, type, slug) {
  const config = stores[type];
  const items = readStore(type);
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

  readonlyMutationResponse(response);
}

module.exports = {
  handleCollection,
  handleItem,
};
