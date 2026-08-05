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

  var editableElements = document.querySelectorAll("[data-edit-key]");

  if (!editableElements.length) {
    return;
  }

  function reveal() {
    editableElements.forEach(function (element) {
      element.style.visibility = "";
    });
  }

  // Independent of script.js on purpose: an unrelated runtime error anywhere
  // in that (large, page-specific) file must never be able to leave this
  // page's text stuck invisible. The [data-edit-key] CSS rule also carries
  // its own pure-CSS reveal timer as a last-resort backstop.
  var revealTimeout = setTimeout(reveal, 1000);

  var applyOverrides = isEnglishPage()
    ? Promise.resolve()
    : fetch("/api/site-text", { credentials: "same-origin" })
        .then(function (response) {
          return response.ok ? response.json() : null;
        })
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
        });

  applyOverrides.finally(function () {
    clearTimeout(revealTimeout);
    reveal();
  });
})();
