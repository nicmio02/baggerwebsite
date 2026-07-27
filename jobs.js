const jobDetailRoot = document.querySelector("[data-job-detail]");

const fallbackOpenJob = {
  slug: "open-sollicitatie",
  title: "Open sollicitatie",
  excerpt: "Zie jij een rol in circulaire baggerketens? Stuur ons je achtergrond en waar je aan wilt bouwen.",
  category: "Algemeen",
  workload: "Open",
  status: "Open",
  body: [
    "Zie jij een rol in circulaire baggerketens? Stuur ons je achtergrond en vertel waar je aan wilt bouwen.",
    "We bekijken graag welke ervaring en ambitie passen bij de volgende stap van Blauwe Bagger.",
  ],
};

function escapeJobHtml(value) {
  return String(value || "").replace(/[&<>"']/g, (character) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };

    return entities[character];
  });
}

function normalizeJobBody(value, fallback) {
  const paragraphs = Array.isArray(value)
    ? value.map((paragraph) => String(paragraph).trim()).filter(Boolean)
    : String(value || "")
        .split(/\n\s*\n/g)
        .map((paragraph) => paragraph.trim())
        .filter(Boolean);

  return paragraphs.length ? paragraphs : [fallback];
}

async function fetchJobDetail(slug) {
  if (slug === fallbackOpenJob.slug) {
    try {
      const settingsResponse = await fetch("/api/jobs-settings", { credentials: "same-origin" });

      if (settingsResponse.ok && (await settingsResponse.json()).showOpenApplication) {
        return fallbackOpenJob;
      }
    } catch {
      // Treat the fallback vacancy as disabled when its setting cannot be read.
    }

    throw new Error("Vacature niet gevonden.");
  }

  try {
    const response = await fetch(`/api/jobs/${encodeURIComponent(slug)}`, { credentials: "same-origin" });

    if (response.ok) {
      return response.json();
    }
  } catch {
    // Use the collection or static fallback below when the detail endpoint is unavailable.
  }

  const collectionUrls = ["/api/jobs", "/data/jobs.json"];

  for (const url of collectionUrls) {
    try {
      const response = await fetch(url, { credentials: "same-origin" });

      if (!response.ok) {
        continue;
      }

      const items = await response.json();
      const job = Array.isArray(items) ? items.find((item) => item?.slug === slug) : null;

      if (job) {
        return job;
      }
    } catch {
      // Try the next source.
    }
  }

  throw new Error("Vacature niet gevonden.");
}

function renderJobDetail(job) {
  const title = String(job.title || "Vacature").trim() || "Vacature";
  const excerpt = String(job.excerpt || "").trim();
  const body = normalizeJobBody(job.body, excerpt || "Neem contact op voor meer informatie over deze vacature.");
  const metadata = [job.category || "Vacature", job.workload || "In overleg", job.status || "Open"]
    .map((value) => `<span>${escapeJobHtml(value)}</span>`)
    .join("");

  document.title = `Blauwe Bagger | ${title}`;
  jobDetailRoot.innerHTML = `
    <section class="job-detail-hero">
      <div class="job-detail-frame">
        <a class="job-detail-back" href="/vacatures">
          <span aria-hidden="true">&larr;</span>
          <span>Terug naar vacatures</span>
        </a>
        <p class="job-detail-kicker">Vacature</p>
        <h1>${escapeJobHtml(title)}</h1>
        ${excerpt ? `<p class="job-detail-excerpt">${escapeJobHtml(excerpt)}</p>` : ""}
        <div class="job-detail-meta">${metadata}</div>
      </div>
    </section>

    <section class="job-detail-content">
      <div class="job-detail-frame job-detail-layout">
        <article class="job-detail-copy">
          ${body.map((paragraph) => `<p>${escapeJobHtml(paragraph)}</p>`).join("")}
        </article>
        <aside class="job-detail-cta">
          <p class="job-detail-cta__kicker">Interesse?</p>
          <h2>Bouw mee aan de circulaire baggerketen.</h2>
          <p>Neem contact op en vertel ons waar jij waarde kunt toevoegen.</p>
          <a class="primary-link" href="/contact">
            <span>Neem contact op</span>
            <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M5 12h13m-5-5 5 5-5 5" /></svg>
          </a>
        </aside>
      </div>
    </section>
  `;
}

async function initJobDetail() {
  if (!jobDetailRoot) {
    return;
  }

  const slug = new URLSearchParams(window.location.search).get("slug")?.trim();

  if (!slug) {
    jobDetailRoot.innerHTML = `<div class="job-detail-empty"><p>Geen vacature geselecteerd.</p><a href="/vacatures">Terug naar vacatures</a></div>`;
    return;
  }

  try {
    const job = await fetchJobDetail(slug);
    renderJobDetail(job);
  } catch (error) {
    jobDetailRoot.innerHTML = `
      <div class="job-detail-empty">
        <p>${escapeJobHtml(error.message)}</p>
        <a href="/vacatures">Terug naar vacatures</a>
      </div>
    `;
  }
}

initJobDetail();
