const header = document.querySelector("[data-header]");
const menuToggle = document.querySelector(".menu-toggle");
const mobileMenu = document.querySelector("#mobile-menu");
const revealItems = document.querySelectorAll(".reveal");
const counters = document.querySelectorAll("[data-count]");
const parallaxItems = document.querySelectorAll("[data-parallax]");
const stepButtons = document.querySelectorAll("[data-step]");
const processFill = document.querySelector("[data-process-fill]");
const processDots = document.querySelectorAll(".process-dot");
const processImage = document.querySelector("[data-process-image]");
const processLabel = document.querySelector("[data-process-label]");
const processTitle = document.querySelector("[data-process-title]");
const processCopy = document.querySelector("[data-process-copy]");
const productCards = document.querySelectorAll("[data-product]");
const productDetail = document.querySelector("[data-product-detail]");
const contactForm = document.querySelector("[data-contact-form]");
const formNote = document.querySelector("[data-form-note]");

const processSteps = [
  {
    label: "Stap 01",
    title: "Indikken op locatie",
    copy: "Waterige bagger wordt ingedikt voordat transport of verdere scheiding nodig is.",
    image: "assets/media/zandstort.png",
    transform: "translate(0, 0) scale(1)",
  },
  {
    label: "Stap 02",
    title: "Zeven en voorreinigen",
    copy: "Grove delen worden apart gehouden, zodat zand, klei en organica zuiverder verder gaan.",
    image: "assets/media/zandstort.png",
    transform: "translate(-8%, -2%) scale(1.08)",
  },
  {
    label: "Stap 03",
    title: "Scheiden per fractie",
    copy: "De installatie splitst baggerspecie in herkenbare stromen met een duidelijke vervolgrichting.",
    image: "assets/media/truck.png",
    transform: "translate(-16%, 4%) scale(1.15)",
  },
  {
    label: "Stap 04",
    title: "Toepassen als grondstof",
    copy: "Zand, leem, klei en organisch materiaal keren terug in projecten in plaats van verloren te gaan.",
    image: "assets/media/truck.png",
    transform: "translate(-22%, 2%) scale(1.18)",
  },
];

const productContent = {
  zand: {
    title: "Zand voor circulaire bouwprojecten",
    copy:
      "Zand kan opnieuw worden ingezet in ophogingen, terreininrichting en civiele werken wanneer de kwaliteit past bij de toepassing.",
  },
  leem: {
    title: "Leem met landschappelijke waarde",
    copy:
      "Leem vormt een fijne, stabiele stroom voor bodemopbouw, profilering en projecten waar structuur belangrijk is.",
  },
  klei: {
    title: "Klei voor stevige toepassingen",
    copy:
      "Klei uit bagger kan bijdragen aan dijkversterking, afsluitlagen en andere toepassingen waar cohesie telt.",
  },
  organisch: {
    title: "Organisch materiaal apart gehouden",
    copy:
      "Organische resten worden gescheiden gehouden, zodat verdere verwerking en toepassing gericht kunnen plaatsvinden.",
  },
};

function syncHeaderOffset() {
  if (!header) {
    return;
  }

  document.documentElement.style.scrollPaddingTop = `${header.offsetHeight + 20}px`;
}

function updateHeaderState() {
  if (!header) {
    return;
  }

  header.classList.toggle("is-condensed", window.scrollY > 18);
  syncHeaderOffset();
}

function updateScrollProgress() {
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  const progress = scrollable > 0 ? window.scrollY / scrollable : 0;
  document.body.style.setProperty("--scroll", progress.toFixed(4));
  updateHeaderState();

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return;
  }

  parallaxItems.forEach((item) => {
    const factor = Number(item.dataset.parallax || 0);
    const offset = window.scrollY * factor;
    item.style.transform = `translate3d(0, ${offset}px, 0)`;
  });
}

function setMobileMenu(open) {
  if (!menuToggle || !mobileMenu) {
    return;
  }

  menuToggle.setAttribute("aria-expanded", String(open));
  mobileMenu.hidden = !open;
  syncHeaderOffset();
}

function animateCounter(counter) {
  if (!counter || counter.dataset.done === "true") {
    return;
  }

  counter.dataset.done = "true";
  const end = Number(counter.dataset.count);
  const duration = 1050;
  const start = performance.now();

  function tick(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    counter.textContent = Math.round(end * eased);

    if (progress < 1) {
      requestAnimationFrame(tick);
    }
  }

  requestAnimationFrame(tick);
}

function selectStep(index) {
  const step = processSteps[index];

  if (!step || !processLabel || !processTitle || !processCopy) {
    return;
  }

  stepButtons.forEach((button, buttonIndex) => {
    const active = buttonIndex === index;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-selected", String(active));
  });

  processDots.forEach((dot, dotIndex) => {
    dot.classList.toggle("is-active", dotIndex <= index);
  });

  if (processFill) {
    processFill.style.height = `${(index / (processSteps.length - 1)) * 100}%`;
  }

  if (processImage && processImage.getAttribute("src") !== step.image) {
    processImage.style.opacity = "0";
    window.setTimeout(() => {
      processImage.setAttribute("src", step.image);
      processImage.style.transform = step.transform;
      processImage.style.opacity = "1";
    }, 180);
  } else if (processImage) {
    processImage.style.transform = step.transform;
  }

  processLabel.textContent = step.label;
  processTitle.textContent = step.title;
  processCopy.textContent = step.copy;
}

function selectProduct(productKey) {
  const content = productContent[productKey];

  productCards.forEach((card) => {
    card.classList.toggle("is-selected", card.dataset.product === productKey);
  });

  if (!content || !productDetail) {
    return;
  }

  const title = productDetail.querySelector("h3");
  const copy = productDetail.querySelector("span");

  if (title) {
    title.textContent = content.title;
  }

  if (copy) {
    copy.textContent = content.copy;
  }
}

if (menuToggle && mobileMenu) {
  menuToggle.addEventListener("click", () => {
    const open = menuToggle.getAttribute("aria-expanded") !== "true";
    setMobileMenu(open);
  });

  mobileMenu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => setMobileMenu(false));
  });
}

if (revealItems.length || counters.length) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        entry.target.classList.add("is-visible");
        entry.target.querySelectorAll("[data-count]").forEach(animateCounter);

        if (entry.target.matches("[data-count]")) {
          animateCounter(entry.target);
        }
      });
    },
    { threshold: 0.18, rootMargin: "0px 0px -8% 0px" },
  );

  revealItems.forEach((item) => observer.observe(item));
  counters.forEach((counter) => observer.observe(counter));
}

stepButtons.forEach((button) => {
  button.addEventListener("click", () => {
    selectStep(Number(button.dataset.step));
  });
});

productCards.forEach((card) => {
  card.tabIndex = 0;
  card.addEventListener("click", () => selectProduct(card.dataset.product));
  card.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      selectProduct(card.dataset.product);
    }
  });
});

if (contactForm) {
  contactForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(contactForm);
    const name =
      data.get("name") ||
      [data.get("firstName"), data.get("lastName")].filter(Boolean).join(" ").trim() ||
      "";
    const email = data.get("email") || "";
    const phone = data.get("phone") || "";
    const company = data.get("company") || "";
    const message = data.get("message") || "";
    const subject = encodeURIComponent("Projectvraag via Blauwe Bagger website");
    const body = encodeURIComponent(
      `Naam: ${name}\nE-mail: ${email}\nTelefoon: ${phone}\nBedrijf: ${company}\n\nProjectvraag:\n${message}`,
    );

    window.location.href = `mailto:info@blauwebagger.nl?subject=${subject}&body=${body}`;

    if (formNote) {
      formNote.textContent = "Je mailprogramma wordt geopend met de ingevulde aanvraag.";
    }
  });
}

window.addEventListener("scroll", updateScrollProgress, { passive: true });
window.addEventListener("resize", updateScrollProgress);
updateScrollProgress();

if (stepButtons.length && processLabel && processTitle && processCopy) {
  selectStep(0);
}

if (productCards.length && productDetail) {
  selectProduct("zand");
}

if (header) {
  syncHeaderOffset();
}
