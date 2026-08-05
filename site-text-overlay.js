(function () {
  function isEnglishPage() {
    var params = new URLSearchParams(window.location.search);
    var path = window.location.pathname.replace(/\/+$/, "") || "/";
    var requested = params.get("lang");
    var stored = "";

    try {
      stored = window.localStorage.getItem("siteLanguage") || "";
    } catch (error) {
      stored = "";
    }

    return (
      requested === "en" ||
      path === "/en" ||
      path === "/en.html" ||
      path.indexOf("/en/") === 0 ||
      (requested !== "nl" && stored === "en")
    );
  }

  var overridesPromise = null;

  // Cached so content inserted later (e.g. cloned <template> panels) can
  // reuse the same fetch instead of hitting the API again.
  function getOverridesPromise() {
    if (!overridesPromise) {
      overridesPromise = isEnglishPage()
        ? Promise.resolve(null)
        : fetch("/api/site-text", { credentials: "same-origin" })
            .then(function (response) {
              return response.ok ? response.json() : null;
            })
            .catch(function () {
              return null;
            });
    }

    return overridesPromise;
  }

  function applyToSubtree(root) {
    var scope = root || document;
    var editableElements = scope.querySelectorAll("[data-edit-key]");

    if (!editableElements.length) {
      return;
    }

    function reveal() {
      editableElements.forEach(function (element) {
        element.style.visibility = "";
      });
    }

    // These elements start hidden (see the [data-edit-key] CSS rule) so a
    // slow/unavailable backend never leaves them stuck invisible.
    var revealTimeout = setTimeout(reveal, 1000);

    getOverridesPromise()
      .then(function (overrides) {
        if (!overrides) {
          return;
        }

        editableElements.forEach(function (element) {
          var value = overrides[element.getAttribute("data-edit-key")];

          if (typeof value === "string" && value.trim()) {
            element.textContent = value;
          }
        });
      })
      .catch(function () {
        // Backend unavailable: keep the static Dutch copy already in the HTML.
      })
      .finally(function () {
        clearTimeout(revealTimeout);
        reveal();
      });
  }

  // Exposed so script.js can re-apply overrides to content inserted after
  // page load (e.g. the solution-card <template> panels), the same way it
  // already re-runs translateSubtree() on that content for English mode.
  window.applySiteTextOverridesToSubtree = applyToSubtree;

  applyToSubtree(document);
})();
