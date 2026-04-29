const projectFeedRoot = document.querySelector("[data-project-feed]");
const projectFeaturedRoot = document.querySelector("[data-project-featured]");
const projectGridRoot = document.querySelector("[data-project-grid]");
const projectDetailRoot = document.querySelector("[data-project-detail]");
const projectAdminRoot = document.querySelector("[data-project-admin]");
const homeProjectsRoot = document.querySelector("[data-home-projects]");
const adminForm = document.querySelector("[data-admin-form]");
const adminList = document.querySelector("[data-admin-list]");
const adminStatus = document.querySelector("[data-admin-status]");
const adminResetButton = document.querySelector("[data-admin-reset]");

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function slugifyProject(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function formatDate(value) {
  if (!value) {
    return "";
  }

  return new Intl.DateTimeFormat("nl-NL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(`${value}T12:00:00`));
}

function normalizeAssetUrl(value) {
  const raw = String(value || "").trim();

  if (!raw) {
    return "";
  }

  if (/^(https?:)?\/\//i.test(raw) || raw.startsWith("/") || raw.startsWith("data:")) {
    return raw;
  }

  return `/${raw.replace(/^\.?\//, "")}`;
}

function coverMarkup(project, className) {
  const image = normalizeAssetUrl(project.coverImage);

  if (image) {
    return `<div class="${className}"><img src="${escapeHtml(image)}" alt="${escapeHtml(project.title)}" /></div>`;
  }

  return `<div class="${className}"></div>`;
}

function projectMeta(project, dark = false) {
  return `
    <div class="${dark ? "detail-meta" : "blog-meta"}">
      <span class="pill ${dark ? "pill--dark" : ""}">${escapeHtml(project.category)}</span>
      <span class="pill ${dark ? "pill--dark" : ""}">${escapeHtml(project.status)}</span>
      <span class="pill ${dark ? "pill--dark" : ""}">${escapeHtml(project.location)}</span>
      <span class="pill ${dark ? "pill--dark" : ""}">${escapeHtml(formatDate(project.date))}</span>
    </div>
  `;
}

async function fetchProjects() {
  const response = await fetch("/api/projects");

  if (!response.ok) {
    throw new Error("Projecten konden niet worden geladen.");
  }

  return response.json();
}

async function fetchProject(slug) {
  const response = await fetch(`/api/projects/${encodeURIComponent(slug)}`);

  if (!response.ok) {
    throw new Error("Project niet gevonden.");
  }

  return response.json();
}

function renderProjectFeed(projects) {
  if (!projectFeedRoot || !projectFeaturedRoot || !projectGridRoot) {
    return;
  }

  if (!projects.length) {
    projectFeaturedRoot.innerHTML = `<div class="empty-state">Er zijn nog geen projecten gepubliceerd. Gebruik <a href="/projecten-beheer">de beheertool</a> om de eerste post toe te voegen.</div>`;
    projectGridRoot.innerHTML = "";
    return;
  }

  const featuredProject = projects.find((project) => project.featured) || projects[0];
  const remainingProjects = projects.filter((project) => project.slug !== featuredProject.slug);

  projectFeaturedRoot.innerHTML = `
    ${coverMarkup(featuredProject, "blog-featured__media")}
    <div class="blog-featured__copy">
      ${projectMeta(featuredProject, true)}
      <h2>${escapeHtml(featuredProject.title)}</h2>
      <p>${escapeHtml(featuredProject.excerpt)}</p>
      <a class="primary-link" href="/projecten/${encodeURIComponent(featuredProject.slug)}">
        <span>Lees project</span>
        <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M5 12h13m-5-5 5 5-5 5" /></svg>
      </a>
    </div>
  `;

  projectGridRoot.innerHTML = remainingProjects
    .map(
      (project) => `
        <a class="blog-card reveal is-visible" href="/projecten/${encodeURIComponent(project.slug)}">
          ${coverMarkup(project, "blog-card__media")}
          <div class="blog-card__body">
            ${projectMeta(project)}
            <h3>${escapeHtml(project.title)}</h3>
            <p>${escapeHtml(project.excerpt)}</p>
            <span class="link-arrow">
              <span>Lees meer</span>
              <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M5 12h13m-5-5 5 5-5 5" /></svg>
            </span>
          </div>
        </a>
      `,
    )
    .join("");
}

function renderHomeProjects(projects) {
  if (!homeProjectsRoot) {
    return;
  }

  if (!projects.length) {
    homeProjectsRoot.innerHTML = `<div class="empty-state">Nog geen projecten gevonden. Gebruik <a href="/projecten-beheer">de beheertool</a> om de homepage te vullen.</div>`;
    return;
  }

  const featuredProject = projects.find((project) => project.featured) || projects[0];
  const remainingProjects = projects.filter((project) => project.slug !== featuredProject.slug);
  const homeProjects = [featuredProject, ...remainingProjects].slice(0, 4);

  homeProjectsRoot.innerHTML = homeProjects
    .map((project, index) => {
      const variant = index === 0 ? "featured" : index === 1 ? "tall" : "small";

      return `
        <a class="home-project-card home-project-card--${variant} reveal is-visible" href="/projecten/${encodeURIComponent(project.slug)}">
          ${coverMarkup(project, "home-project-card__media")}
          <div class="home-project-card__meta">
            <span class="home-project-chip">${escapeHtml(project.category)}</span>
            <span class="home-project-chip">${escapeHtml(formatDate(project.date))}</span>
          </div>
          <h3>${escapeHtml(project.title)}</h3>
          <span class="home-project-card__cta">
            <span>Ontdek Meer</span>
            <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M5 12h13m-5-5 5 5-5 5" /></svg>
          </span>
        </a>
      `;
    })
    .join("");
}

function renderProjectDetail(project) {
  if (!projectDetailRoot) {
    return;
  }

  const paragraphs = (project.body || [])
    .map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`)
    .join("");
  const highlights = (project.highlights || [])
    .map((item) => `<li>${escapeHtml(item)}</li>`)
    .join("");

  document.title = `Blauwe Bagger | ${project.title}`;

  projectDetailRoot.innerHTML = `
    <div class="section-inner detail-shell">
      <div class="page-toolbar">
        <a class="secondary-link" href="/projecten">Terug naar projecten</a>
        <a class="secondary-link" href="/projecten-beheer">Beheer projecten</a>
      </div>

      <article class="detail-header">
        ${coverMarkup(project, "detail-header__media")}
        <div class="detail-header__copy">
          ${projectMeta(project, true)}
          <h1>${escapeHtml(project.title)}</h1>
          <p>${escapeHtml(project.excerpt)}</p>
        </div>
      </article>

      <div class="detail-layout">
        <div class="detail-body">
          ${paragraphs || `<p>${escapeHtml(project.excerpt)}</p>`}
        </div>
        <aside class="detail-sidebar">
          <h2>Belangrijk in dit project</h2>
          <ul>
            ${
              highlights ||
              `<li>Voeg highlights toe via <a href="/projecten-beheer">de beheertool</a> om hier kernpunten te tonen.</li>`
            }
          </ul>
        </aside>
      </div>
    </div>
  `;
}

function setAdminStatus(message, isError = false) {
  if (!adminStatus) {
    return;
  }

  adminStatus.textContent = message;
  adminStatus.classList.toggle("is-error", isError);
}

function projectToFormState(project) {
  return {
    title: project.title || "",
    slug: project.slug || "",
    date: project.date || new Date().toISOString().slice(0, 10),
    category: project.category || "Project",
    location: project.location || "Nederland",
    status: project.status || "Actief",
    coverImage: project.coverImage || "",
    excerpt: project.excerpt || "",
    body: Array.isArray(project.body) ? project.body.join("\n\n") : "",
    highlights: Array.isArray(project.highlights) ? project.highlights.join("\n") : "",
    featured: Boolean(project.featured),
  };
}

function fillAdminForm(project) {
  if (!adminForm) {
    return;
  }

  const values = projectToFormState(project);
  adminForm.dataset.editingSlug = project.slug;
  adminForm.dataset.slugManual = "true";

  Object.entries(values).forEach(([key, value]) => {
    const field = adminForm.elements.namedItem(key);

    if (!field) {
      return;
    }

    if (field.type === "checkbox") {
      field.checked = Boolean(value);
    } else {
      field.value = value;
    }
  });

  setAdminStatus(`Je bewerkt nu "${project.title}".`);
}

function resetAdminForm() {
  if (!adminForm) {
    return;
  }

  adminForm.reset();
  adminForm.dataset.editingSlug = "";
  adminForm.dataset.slugManual = "";

  const dateField = adminForm.elements.namedItem("date");
  const statusField = adminForm.elements.namedItem("status");
  const categoryField = adminForm.elements.namedItem("category");

  if (dateField) {
    dateField.value = new Date().toISOString().slice(0, 10);
  }

  if (statusField) {
    statusField.value = "Actief";
  }

  if (categoryField) {
    categoryField.value = "";
  }

  setAdminStatus("Klaar voor een nieuw project.");
}

function renderAdminList(projects) {
  if (!adminList) {
    return;
  }

  if (!projects.length) {
    adminList.innerHTML = `<div class="empty-state">Nog geen projecten opgeslagen.</div>`;
    return;
  }

  adminList.innerHTML = projects
    .map(
      (project) => `
        <article class="admin-project-item">
          <div class="blog-meta">
            <span class="pill">${escapeHtml(project.category)}</span>
            <span class="pill">${escapeHtml(project.status)}</span>
          </div>
          <h3>${escapeHtml(project.title)}</h3>
          <p>${escapeHtml(project.excerpt)}</p>
          <div class="admin-project-actions">
            <button class="button-ghost" type="button" data-edit-project="${escapeHtml(project.slug)}">Bewerk</button>
            <a class="button-ghost" href="/projecten/${encodeURIComponent(project.slug)}">Bekijk live</a>
            <button class="button-ghost button-danger" type="button" data-delete-project="${escapeHtml(project.slug)}">Verwijder</button>
          </div>
        </article>
      `,
    )
    .join("");
}

async function refreshAdmin() {
  if (!projectAdminRoot) {
    return;
  }

  try {
    const projects = await fetchProjects();
    renderAdminList(projects);
  } catch (error) {
    adminList.innerHTML = `<div class="empty-state">${escapeHtml(error.message)}</div>`;
  }
}

async function submitAdminForm(event) {
  event.preventDefault();

  if (!adminForm) {
    return;
  }

  const formData = new FormData(adminForm);
  const editingSlug = adminForm.dataset.editingSlug;
  const method = editingSlug ? "PUT" : "POST";
  const url = editingSlug ? `/api/projects/${encodeURIComponent(editingSlug)}` : "/api/projects";

  const payload = {
    title: formData.get("title"),
    slug: formData.get("slug"),
    date: formData.get("date"),
    category: formData.get("category"),
    location: formData.get("location"),
    status: formData.get("status"),
    coverImage: formData.get("coverImage"),
    excerpt: formData.get("excerpt"),
    body: formData.get("body"),
    highlights: formData.get("highlights"),
    featured: formData.get("featured") === "on",
  };

  setAdminStatus("Bezig met opslaan...");

  try {
    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Opslaan mislukt.");
    }

    setAdminStatus(editingSlug ? "Project bijgewerkt." : "Project toegevoegd.");
    resetAdminForm();
    await refreshAdmin();
  } catch (error) {
    setAdminStatus(error.message, true);
  }
}

async function handleAdminListClick(event) {
  const editButton = event.target.closest("[data-edit-project]");
  const deleteButton = event.target.closest("[data-delete-project]");

  if (editButton) {
    const slug = editButton.getAttribute("data-edit-project");
    const projects = await fetchProjects();
    const project = projects.find((item) => item.slug === slug);

    if (project) {
      fillAdminForm(project);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }

    return;
  }

  if (deleteButton) {
    const slug = deleteButton.getAttribute("data-delete-project");
    const confirmed = window.confirm("Weet je zeker dat je dit project wilt verwijderen?");

    if (!confirmed) {
      return;
    }

    setAdminStatus("Project wordt verwijderd...");

    try {
      const response = await fetch(`/api/projects/${encodeURIComponent(slug)}`, {
        method: "DELETE",
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Verwijderen mislukt.");
      }

      if (adminForm && adminForm.dataset.editingSlug === slug) {
        resetAdminForm();
      }

      setAdminStatus("Project verwijderd.");
      await refreshAdmin();
    } catch (error) {
      setAdminStatus(error.message, true);
    }
  }
}

async function initProjectFeed() {
  if (!projectFeedRoot) {
    return;
  }

  try {
    const projects = await fetchProjects();
    renderProjectFeed(projects);
  } catch (error) {
    if (projectFeaturedRoot) {
      projectFeaturedRoot.innerHTML = `<div class="empty-state">${escapeHtml(error.message)}</div>`;
    }
  }
}

async function initHomeProjects() {
  if (!homeProjectsRoot) {
    return;
  }

  try {
    const projects = await fetchProjects();
    renderHomeProjects(projects);
  } catch (error) {
    homeProjectsRoot.innerHTML = `<div class="empty-state">${escapeHtml(error.message)}</div>`;
  }
}

async function initProjectDetail() {
  if (!projectDetailRoot) {
    return;
  }

  const slug = decodeURIComponent(window.location.pathname.replace(/^\/projecten\//, "").replace(/\/$/, ""));

  if (!slug) {
    projectDetailRoot.innerHTML = `<div class="section-inner"><div class="empty-state">Geen projectslug gevonden.</div></div>`;
    return;
  }

  try {
    const project = await fetchProject(slug);
    renderProjectDetail(project);
  } catch (error) {
    projectDetailRoot.innerHTML = `
      <div class="section-inner">
        <div class="empty-state">
          ${escapeHtml(error.message)}<br />
          <a class="link-arrow" href="/projecten">
            <span>Terug naar projecten</span>
            <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M5 12h13m-5-5 5 5-5 5" /></svg>
          </a>
        </div>
      </div>
    `;
  }
}

function initProjectAdmin() {
  if (!projectAdminRoot || !adminForm || !adminList) {
    return;
  }

  const titleField = adminForm.elements.namedItem("title");
  const slugField = adminForm.elements.namedItem("slug");

  resetAdminForm();
  refreshAdmin();

  titleField?.addEventListener("input", () => {
    if (adminForm.dataset.slugManual === "true") {
      return;
    }

    slugField.value = slugifyProject(titleField.value);
  });

  slugField?.addEventListener("input", () => {
    adminForm.dataset.slugManual = slugField.value.trim() ? "true" : "";
  });

  adminForm.addEventListener("submit", submitAdminForm);
  adminList.addEventListener("click", async (event) => {
    try {
      await handleAdminListClick(event);
    } catch (error) {
      setAdminStatus(error.message || "Er ging iets mis in projectbeheer.", true);
    }
  });

  adminResetButton?.addEventListener("click", () => {
    resetAdminForm();
  });
}

initProjectFeed();
initHomeProjects();
initProjectDetail();
initProjectAdmin();
