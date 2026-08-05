async function initTextEdit() {
  const fieldContainers = document.querySelectorAll("[data-textedit-fields]");

  if (!fieldContainers.length) {
    return;
  }

  let registry = [];
  let overrides = {};

  try {
    [registry, overrides] = await Promise.all([
      fetch("/data/site-text-registry.json").then((response) => response.json()),
      fetchJson("/api/site-text"),
    ]);
  } catch {
    fieldContainers.forEach((container) => {
      container.innerHTML = '<p class="admin-status is-error">Kon teksten niet laden.</p>';
    });
    return;
  }

  const byPage = new Map();
  registry.forEach((entry) => {
    if (!byPage.has(entry.page)) {
      byPage.set(entry.page, []);
    }
    byPage.get(entry.page).push(entry);
  });

  fieldContainers.forEach((container) => {
    const page = container.getAttribute("data-textedit-fields");
    renderPageFields(container, byPage.get(page) || [], overrides);
  });

  document.querySelectorAll("[data-textedit-form]").forEach((form) => {
    form.addEventListener("submit", (event) => handleTextEditSubmit(event, form));
  });
}

function renderPageFields(container, entries, overrides) {
  if (!entries.length) {
    container.innerHTML = '<p class="admin-status">Nog geen bewerkbare teksten op deze pagina.</p>';
    return;
  }

  const sections = [];
  entries.forEach((entry) => {
    let section = sections.find((item) => item.name === entry.section);

    if (!section) {
      section = { name: entry.section, entries: [] };
      sections.push(section);
    }

    section.entries.push(entry);
  });

  container.innerHTML = sections
    .map(
      (section) => `
        <h3 class="admin-textedit-section">${escapeAdminHtml(section.name)}</h3>
        <div class="admin-form-grid">
          ${section.entries.map((entry) => renderTextEditField(entry, overrides)).join("")}
        </div>
      `,
    )
    .join("");
}

function renderTextEditField(entry, overrides) {
  const value = typeof overrides[entry.key] === "string" ? overrides[entry.key] : entry.default || "";
  const input =
    entry.type === "textarea"
      ? `<textarea data-textedit-input data-key="${escapeAdminHtml(entry.key)}" rows="4">${escapeAdminHtml(value)}</textarea>`
      : `<input type="text" data-textedit-input data-key="${escapeAdminHtml(entry.key)}" value="${escapeAdminHtml(value)}" />`;

  return `<label><span>${escapeAdminHtml(entry.label)}</span>${input}</label>`;
}

async function handleTextEditSubmit(event, form) {
  event.preventDefault();

  const page = form.getAttribute("data-textedit-form");
  const status = document.querySelector(`[data-textedit-status="${page}"]`);
  const submitButton = form.querySelector("button[type='submit']");
  const overrides = {};

  form.querySelectorAll("[data-textedit-input]").forEach((input) => {
    overrides[input.getAttribute("data-key")] = input.value;
  });

  setStatus(status, "Opslaan...");

  if (submitButton) {
    submitButton.disabled = true;
  }

  try {
    await fetchJson("/api/site-text", {
      method: "PUT",
      body: JSON.stringify({ overrides }),
    });
    setStatus(status, "Wijzigingen opgeslagen.");
  } catch (error) {
    setStatus(status, error.message, true);
  } finally {
    if (submitButton) {
      submitButton.disabled = false;
    }
  }
}

initTextEdit();
