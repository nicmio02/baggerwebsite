const loginForm = document.querySelector("[data-login-form]");
const loginStatus = document.querySelector("[data-login-status]");
const privateAdminPage = document.querySelector("[data-admin-private]");
const logoutButtons = document.querySelectorAll("[data-admin-logout]");
const tabButtons = document.querySelectorAll("[data-admin-tab]");
const tabPanels = document.querySelectorAll("[data-admin-panel]");
const contentForms = document.querySelectorAll("[data-content-form]");

function adminSlugify(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function setStatus(element, message, isError = false) {
  if (!element) {
    return;
  }

  element.textContent = message;
  element.classList.toggle("is-error", isError);
}

function escapeAdminHtml(value) {
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

async function fetchJson(url, options = {}) {
  const response = await fetch(url, {
    credentials: "same-origin",
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.error || "Verzoek mislukt.");
  }

  return payload;
}

async function requireAdminSession() {
  if (!privateAdminPage) {
    return;
  }

  try {
    const session = await fetchJson("/api/auth/session");

    if (!session.authenticated) {
      window.location.href = `/login?next=${encodeURIComponent(window.location.pathname)}`;
    }
  } catch {
    window.location.href = `/login?next=${encodeURIComponent(window.location.pathname)}`;
  }
}

function initLogin() {
  if (!loginForm) {
    return;
  }

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(loginForm);
    setStatus(loginStatus, "Inloggen...");

    try {
      await fetchJson("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({
          username: formData.get("username"),
          password: formData.get("password"),
        }),
      });
      const next = new URLSearchParams(window.location.search).get("next") || "/projecten-beheer";
      window.location.href = next;
    } catch (error) {
      setStatus(loginStatus, error.message, true);
    }
  });
}

function initLogout() {
  logoutButtons.forEach((button) => button.addEventListener("click", async () => {
    await fetchJson("/api/auth/logout", { method: "POST", body: "{}" }).catch(() => null);
    window.location.href = "/login";
  }));
}

function initTabs() {
  tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const target = button.getAttribute("data-admin-tab");

      tabButtons.forEach((item) => item.classList.toggle("is-active", item === button));
      tabPanels.forEach((panel) => {
        const isActive = panel.getAttribute("data-admin-panel") === target;
        panel.hidden = !isActive;
        panel.classList.toggle("is-active", isActive);
      });
    });
  });
}

function itemToForm(form, item) {
  form.dataset.editingSlug = item.slug || "";
  form.dataset.slugManual = "true";

  ["title", "slug", "date", "category", "workload", "status", "excerpt"].forEach((key) => {
    const field = form.elements.namedItem(key);

    if (field) {
      field.value = item[key] || "";
    }
  });

  const bodyField = form.elements.namedItem("body");

  if (bodyField) {
    bodyField.value = Array.isArray(item.body) ? item.body.join("\n\n") : "";
  }
}

function resetContentForm(form) {
  form.reset();
  form.dataset.editingSlug = "";
  form.dataset.slugManual = "";

  const dateField = form.elements.namedItem("date");

  if (dateField) {
    dateField.value = new Date().toISOString().slice(0, 10);
  }
}

function renderContentList(type, label, items, form) {
  const list = document.querySelector(`[data-content-list="${type}"]`);

  if (!list) {
    return;
  }

  if (!items.length) {
    list.innerHTML = `<div class="empty-state">Nog geen ${label.toLowerCase()} opgeslagen.</div>`;
    return;
  }

  list.innerHTML = items
    .map(
      (item) => `
        <article class="admin-project-item">
          <div class="blog-meta">
            <span class="pill">${escapeAdminHtml(item.category || label)}</span>
            <span class="pill">${escapeAdminHtml(item.status || "Concept")}</span>
          </div>
          <h3>${escapeAdminHtml(item.title)}</h3>
          <p>${escapeAdminHtml(item.excerpt || "Geen omschrijving.")}</p>
          <div class="admin-project-actions">
            <button class="button-ghost" type="button" data-content-edit="${escapeAdminHtml(item.slug)}">Bewerk</button>
            <button class="button-ghost button-danger" type="button" data-content-delete="${escapeAdminHtml(item.slug)}">Verwijder</button>
          </div>
        </article>
      `,
    )
    .join("");

  list.onclick = async (event) => {
    const editButton = event.target.closest("[data-content-edit]");
    const deleteButton = event.target.closest("[data-content-delete]");

    if (editButton) {
      const item = items.find((entry) => entry.slug === editButton.getAttribute("data-content-edit"));

      if (item) {
        itemToForm(form, item);
        setStatus(form.querySelector("[data-content-status]"), `Je bewerkt nu "${item.title}".`);
        window.scrollTo({ top: form.getBoundingClientRect().top + window.scrollY - 140, behavior: "smooth" });
      }
    }

    if (deleteButton) {
      const slug = deleteButton.getAttribute("data-content-delete");
      const confirmed = window.confirm(`Weet je zeker dat je deze ${label.toLowerCase()} wilt verwijderen?`);

      if (!confirmed) {
        return;
      }

      await fetchJson(`/api/${type}/${encodeURIComponent(slug)}`, { method: "DELETE" });
      await refreshContent(type, label, form);
    }
  };
}

async function refreshContent(type, label, form) {
  const items = await fetchJson(`/api/${type}`);
  renderContentList(type, label, items, form);
}

function initContentForms() {
  contentForms.forEach((form) => {
    const type = form.getAttribute("data-content-type");
    const label = form.getAttribute("data-content-label") || "Item";
    const status = form.querySelector("[data-content-status]");
    const titleField = form.elements.namedItem("title");
    const slugField = form.elements.namedItem("slug");

    resetContentForm(form);
    refreshContent(type, label, form).catch((error) => setStatus(status, error.message, true));

    titleField?.addEventListener("input", () => {
      if (form.dataset.slugManual === "true") {
        return;
      }

      slugField.value = adminSlugify(titleField.value);
    });

    slugField?.addEventListener("input", () => {
      form.dataset.slugManual = slugField.value.trim() ? "true" : "";
    });

    form.querySelector("[data-content-reset]")?.addEventListener("click", () => {
      resetContentForm(form);
      setStatus(status, `Klaar voor een nieuw ${label.toLowerCase()}.`);
    });

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const formData = new FormData(form);
      const editingSlug = form.dataset.editingSlug;
      const method = editingSlug ? "PUT" : "POST";
      const url = editingSlug ? `/api/${type}/${encodeURIComponent(editingSlug)}` : `/api/${type}`;

      setStatus(status, "Bezig met opslaan...");

      try {
        await fetchJson(url, {
          method,
          body: JSON.stringify({
            title: formData.get("title"),
            slug: formData.get("slug"),
            date: formData.get("date"),
            category: formData.get("category"),
            workload: formData.get("workload"),
            status: formData.get("status"),
            excerpt: formData.get("excerpt"),
            body: formData.get("body"),
          }),
        });

        resetContentForm(form);
        setStatus(status, editingSlug ? `${label} bijgewerkt.` : `${label} toegevoegd.`);
        await refreshContent(type, label, form);
      } catch (error) {
        setStatus(status, error.message, true);
      }
    });
  });
}

requireAdminSession();
initLogin();
initLogout();
initTabs();
initContentForms();
