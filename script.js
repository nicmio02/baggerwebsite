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
const heroVideo = document.querySelector(".home-hero-video");
const heroVideoSource = heroVideo?.querySelector("source");
const solutionSequence = document.querySelector("[data-solution-sequence]");
const solutionSteps = solutionSequence?.querySelectorAll("[data-solution-step]") || [];
const blueprintSteps = document.querySelectorAll("[data-blueprint-step]");
const blueprintActiveYear = document.querySelector("[data-blueprint-active-year]");
const blueprintActiveTitle = document.querySelector("[data-blueprint-active-title]");
const blueprintActiveCopy = document.querySelector("[data-blueprint-active-copy]");
const blueHeaderSections = document.querySelectorAll(".home-section--blue, .home-section--blueprint");
const urlParams = new URLSearchParams(window.location.search);
const normalizedPath = window.location.pathname.replace(/\/+$/, "") || "/";
const pageLanguage =
  urlParams.get("lang") === "en" ||
  normalizedPath === "/en" ||
  normalizedPath === "/en.html" ||
  normalizedPath.startsWith("/en/")
    ? "en"
    : "nl";

const heroVideoClips = [
  {
    src: "assets/media/bagger-process-hero.mp4",
    start: 0,
    end: 4.5,
  },
  {
    src: "assets/media/zandwinning.mp4",
    start: 92,
    end: 96,
  },
];

let activeHeroClip = 0;
let heroClipTimer = null;
let activeSolutionStep = 0;
let solutionStepTimer = null;

const i18n = {
  en: {
    title: "Blauwe Bagger | Home",
    description:
      "Blauwe Bagger processes dredged sediment into new raw materials. Discover our circular approach, projects, products, team and contact options.",
    text: {
      "Ga naar inhoud": "Skip to content",
      "Het Plan": "The Plan",
      Services: "Services",
      Projecten: "Projects",
      "Over ons": "About us",
      Taalkeuze: "Language",
      "Neem contact op": "Contact",
      Contact: "Contact",
      Menu: "Menu",
      "Van Bagger": "From Sediment",
      tot: "to",
      Grondstof: "Raw Material",
      Bagger: "Sediment",
      Scheiden: "Separating",
      "Ontdek het plan": "Explore the plan",
      "Onze services": "Our services",
      "Onze Missie": "Our Mission",
      "Blauwe Bagger werkt aan een wereld waarin grondstoffen nooit verloren gaan. Wij zetten bagger om tot bruikbare grondstoffen die bijdragen aan een circulaire toekomst.":
        "Blauwe Bagger works toward a world where raw materials are never lost. We turn dredged sediment into usable raw materials that contribute to a circular future.",
      "Het Probleem": "The Problem",
      "Bagger industrie": "Dredging industry",
      "Beton industrie": "Concrete industry",
      "xxx miljoen m3": "xxx million m3",
      Procesaanpak: "Process approach",
      "Onze Oplossing": "Our Solution",
      "Een praktische route van baggerstroom naar herbruikbare grondstof.":
        "A practical route from dredged sediment stream to reusable raw material.",
      "Input scan": "Input scan",
      "BlueBox module": "BlueBox module",
      "Output routes": "Output routes",
      Analyse: "Analysis",
      Verwerking: "Processing",
      "BlueBox verwerking": "BlueBox processing",
      Hergebruik: "Reuse",
      "Waterbodemdata bepaalt welke fracties geschikt zijn voor hergebruik.":
        "Sediment data determines which fractions are suitable for reuse.",
      "De BlueBox ontwatert, scheidt en schoont bagger op locatie.":
        "The BlueBox dewaters, separates and cleans dredged sediment on site.",
      "Materialen worden toegepast in bouw- en betonproducten.":
        "Materials are used in construction and concrete products.",
      "Met data uit waterbodemonderzoek bepalen we welke fracties in bagger geschikt zijn voor hoogwaardige hergebruikroutes.":
        "Using data from sediment surveys, we determine which fractions in dredged material are suitable for high-value reuse routes.",
      "Vervolgens wordt de BlueBox op locatie ingezet om bagger te ontwateren, te scheiden en op te schonen tot inzetbare materialen.":
        "The BlueBox is then deployed on site to dewater, separate and clean dredged sediment into usable materials.",
      "Om de keten te sluiten worden de gescheiden materialen nabewerkt en toegepast in bouw- en betonproducten.":
        "To close the chain, the separated materials are post-processed and used in construction and concrete products.",
      tijdlijn: "timeline",
      "Oprichting Blauwe Bagger": "Founding of Blauwe Bagger",
      "Research & Development": "Research & Development",
      "Pilot BlueBox op locatie": "On-site BlueBox pilot",
      Marktbetreding: "Market entry",
      Opschaling: "Scaling up",
      "Verbreding buiten bagger": "Expansion beyond dredged sediment",
      "Circulariteit in gehele Nederlandse industrie": "Circularity across Dutch industry",
      "Het startpunt van Blauwe Bagger: bouwen aan een circulaire route voor baggerstromen.":
        "The starting point for Blauwe Bagger: building a circular route for dredged sediment streams.",
      "De BluePrint-aanpak wordt beschikbaar voor de markt.": "The BluePrint approach becomes available to the market.",
      "Het doel: grondstoffen blijven in gebruik binnen een circulaire Nederlandse industrie.":
        "The goal: keeping raw materials in use within a circular Dutch industry.",
      "De oplossing": "The solution",
      "De circulaire keten begint in een": "The circular chain starts in a",
      container: "container",
      "Waar anderen afval zien, zien wij grondstof. Onze mobiele verwerkingsunit zuivert, scheidt en verwerkt baggerspecie direct op locatie - zonder dat er eerst vele kilometers gereden hoeft te worden.":
        "Where others see waste, we see raw material. Our mobile processing unit purifies, separates and processes dredged sediment directly on site, without first driving many kilometres.",
      "Indikken op locatie": "Dewatering on site",
      "Kies je route binnen Blauwe Bagger": "Choose your route within Blauwe Bagger",
      "Een route voor baggerprojecten en een route voor secundaire grondstoffen.":
        "One route for dredging projects and one route for secondary raw materials.",
      "Voor baggeraars": "For dredging contractors",
      "Werken met de BlueBox": "Work with the BlueBox",
      "Minder stortkosten, minder transport en sterker in aanbestedingen.":
        "Lower disposal costs, less transport and a stronger position in tenders.",
      "Voor grondstoffen": "For raw materials",
      "Secundaire grondstoffen, primaire kwaliteit": "Secondary raw materials, primary quality",
      "BlueSand, BlueFiller en BlueCalc als duurzame input voor betonproductie.":
        "BlueSand, BlueFiller and BlueCalc as sustainable inputs for concrete production.",
      "Bekijk grondstoffen": "View raw materials",
      "De toepassingen": "Applications",
      Producten: "Products",
      Zand: "Sand",
      Leem: "Loam",
      Klei: "Clay",
      "Organisch materiaal": "Organic material",
      "Ontdek Producten": "Explore Products",
      "Ontdek Het Team": "Meet the Team",
      "Zet vandaag nog de eerste stap en neem contact op!": "Take the first step today and get in touch.",
      "Verstuur bericht": "Send message",
      "Het formulier opent je mailprogramma met alle ingevulde gegevens.":
        "The form opens your email app with all entered details.",
      "Word een partner!": "Become a partner",
      "All rights reserved.": "All rights reserved.",
      "Privacy Policy": "Privacy Policy",
      "Neem contact op!": "Contact us",
      "Terug naar boven": "Back to top",
      "Deze pagina wordt gebouwd.": "This page is being built.",
    },
    html: {
      "mission-copy":
        'Blauwe Bagger works toward a world where raw materials are never lost. We turn dredged sediment into usable raw materials that contribute to a <span class="home-mission-accent wave-underline">circular future.</span>',
      "problem-dredging":
        'With a total volume of tens of millions of m<sup>3</sup> per year, dredged sediment is <strong>the largest waste stream</strong> in the Netherlands. Because of contamination and changing composition, there are few solutions that use its value. As a result, sediment is often dumped in depots, <em>an expensive and unsustainable solution.</em>',
      "problem-concrete":
        'At the same time, the construction sector extracts hundreds of millions of tonnes of <strong>primary raw materials</strong> every year to produce concrete. That makes it one of the <em>most polluting industries in the world</em>; globally, <strong>8% of CO<sub>2</sub> emissions</strong> come from construction and concrete. The pressure to become more sustainable is growing fast.',
      "problem-meter-dredging":
        '<span class="home-problem-meter__label"><span data-count="40">0</span> million m<sup>3</sup></span>',
      "problem-meter-concrete":
        '<span class="home-problem-meter__label"><span data-count="30">0</span> billion tons</span>',
    },
  },
};

const localizedProcessSteps = {
  nl: [
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
  ],
  en: [
    {
      label: "Step 01",
      title: "Dewatering on site",
      copy: "Watery dredged sediment is thickened before transport or further separation is needed.",
      image: "assets/media/zandstort.png",
      transform: "translate(0, 0) scale(1)",
    },
    {
      label: "Step 02",
      title: "Screening and pre-cleaning",
      copy: "Coarse parts are kept separate so sand, clay and organic fractions can move forward more cleanly.",
      image: "assets/media/zandstort.png",
      transform: "translate(-8%, -2%) scale(1.08)",
    },
    {
      label: "Step 03",
      title: "Separating by fraction",
      copy: "The installation splits dredged sediment into recognisable streams with a clear next use.",
      image: "assets/media/truck.png",
      transform: "translate(-16%, 4%) scale(1.15)",
    },
    {
      label: "Step 04",
      title: "Applying as raw material",
      copy: "Sand, loam, clay and organic material return to projects instead of being lost.",
      image: "assets/media/truck.png",
      transform: "translate(-22%, 2%) scale(1.18)",
    },
  ],
};

const localizedProductContent = {
  nl: {
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
  },
  en: {
    zand: {
      title: "Sand for circular construction projects",
      copy:
        "Sand can be reused in embankments, site preparation and civil works when the quality matches the application.",
    },
    leem: {
      title: "Loam with landscape value",
      copy:
        "Loam forms a fine, stable stream for soil construction, profiling and projects where structure matters.",
    },
    klei: {
      title: "Clay for robust applications",
      copy:
        "Clay from dredged sediment can contribute to dike reinforcement, sealing layers and other cohesive applications.",
    },
    organisch: {
      title: "Organic material kept separate",
      copy:
        "Organic residues are kept separate so further processing and application can happen in a targeted way.",
    },
  },
};

const processSteps = localizedProcessSteps[pageLanguage] || localizedProcessSteps.nl;
const productContent = localizedProductContent[pageLanguage] || localizedProductContent.nl;

function syncHeaderOffset() {
  if (!header) {
    return;
  }

  document.documentElement.style.scrollPaddingTop = `${header.offsetHeight + 20}px`;
}

function normalizeTranslationKey(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function applyPageLanguage() {
  document.documentElement.lang = pageLanguage;

  const languageLinks = document.querySelectorAll(".language-toggle a");
  languageLinks.forEach((link) => {
    const isCurrent = link.lang === pageLanguage;
    link.setAttribute("aria-current", String(isCurrent));

    if (link.lang === "en") {
      link.setAttribute("href", "/?lang=en");
    }

    if (link.lang === "nl") {
      link.setAttribute("href", "/");
    }
  });

  if (pageLanguage !== "en") {
    return;
  }

  const dictionary = i18n.en;
  document.title = dictionary.title;

  const description = document.querySelector('meta[name="description"]');
  if (description) {
    description.setAttribute("content", dictionary.description);
  }

  document.querySelectorAll("[data-i18n-html]").forEach((element) => {
    const translation = dictionary.html[element.dataset.i18nHtml];
    if (translation) {
      element.innerHTML = translation;
    }
  });

  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (!normalizeTranslationKey(node.nodeValue)) {
        return NodeFilter.FILTER_REJECT;
      }

      const parent = node.parentElement;
      if (!parent || ["SCRIPT", "STYLE", "NOSCRIPT"].includes(parent.tagName)) {
        return NodeFilter.FILTER_REJECT;
      }

      return NodeFilter.FILTER_ACCEPT;
    },
  });

  const textNodes = [];
  while (walker.nextNode()) {
    textNodes.push(walker.currentNode);
  }

  textNodes.forEach((node) => {
    const key = normalizeTranslationKey(node.nodeValue);
    const translation = dictionary.text[key];
    if (!translation) {
      return;
    }

    const leading = node.nodeValue.match(/^\s*/)?.[0] || "";
    const trailing = node.nodeValue.match(/\s*$/)?.[0] || "";
    node.nodeValue = `${leading}${translation}${trailing}`;
  });

  document.querySelectorAll("[aria-label]").forEach((element) => {
    const key = normalizeTranslationKey(element.getAttribute("aria-label"));
    if (dictionary.text[key]) {
      element.setAttribute("aria-label", dictionary.text[key]);
    }
  });

  blueprintSteps.forEach((step) => {
    ["blueprintTitle", "blueprintCopy"].forEach((key) => {
      const value = step.dataset[key];
      const translation = dictionary.text[normalizeTranslationKey(value)];

      if (translation) {
        step.dataset[key] = translation;
      }
    });

    const button = step.querySelector(".home-blueprint-dot");
    if (button) {
      button.setAttribute("aria-label", `Show ${step.dataset.blueprintYear}: ${step.dataset.blueprintTitle}`);
    }
  });

  const contactButton = document.querySelector("[data-contact-form] .primary-link span");
  if (contactButton) {
    contactButton.textContent = dictionary.text["Verstuur bericht"];
  }
}

function updateHeaderState() {
  if (!header) {
    return;
  }

  header.classList.toggle("is-condensed", window.scrollY > 18);

  const headerBottom = header.getBoundingClientRect().bottom;
  const sampleY = headerBottom + 8;
  const isOverBlue = Array.from(blueHeaderSections).some((section) => {
    const rect = section.getBoundingClientRect();
    return rect.top <= sampleY && rect.bottom >= sampleY;
  });

  header.classList.toggle("is-over-blue", isOverBlue);
  syncHeaderOffset();
}

function updateHeroState() {
  const hero = document.querySelector(".home-hero");
  if (!hero) {
    return;
  }

  document.body.classList.toggle("is-past-hero", window.scrollY > hero.offsetHeight - 120);
}

function updateScrollProgress() {
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  const progress = scrollable > 0 ? window.scrollY / scrollable : 0;
  document.body.style.setProperty("--scroll", progress.toFixed(4));
  updateHeaderState();
  updateHeroState();

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return;
  }

  parallaxItems.forEach((item) => {
    const factor = Number(item.dataset.parallax || 0);
    const offset = window.scrollY * factor;
    item.style.transform = `translate3d(0, ${offset}px, 0)`;
  });
}

function playHeroClip(index = 0) {
  if (!heroVideo || !heroVideoSource || !heroVideoClips.length) {
    return;
  }

  const clip = heroVideoClips[index % heroVideoClips.length];
  activeHeroClip = index % heroVideoClips.length;
  window.clearTimeout(heroClipTimer);

  const startClip = () => {
    heroVideo.currentTime = clip.start;
    heroVideo.play().catch(() => {});
    heroClipTimer = window.setTimeout(() => {
      playHeroClip(activeHeroClip + 1);
    }, Math.max(1000, (clip.end - clip.start) * 1000));
  };

  if (heroVideoSource.getAttribute("src") !== clip.src) {
    heroVideoSource.setAttribute("src", clip.src);
    heroVideo.addEventListener("loadedmetadata", startClip, { once: true });
    heroVideo.load();
    return;
  }

  if (heroVideo.readyState >= 1) {
    startClip();
    return;
  }

  heroVideo.addEventListener("loadedmetadata", startClip, { once: true });
}

function setMobileMenu(open) {
  if (!menuToggle || !mobileMenu) {
    return;
  }

  menuToggle.setAttribute("aria-expanded", String(open));
  mobileMenu.hidden = !open;
  header?.classList.toggle("is-menu-open", open);
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

function setSolutionStep(index) {
  if (!solutionSteps.length) {
    return;
  }

  activeSolutionStep = index % solutionSteps.length;
  solutionSteps.forEach((step, stepIndex) => {
    step.classList.toggle("is-active", stepIndex === activeSolutionStep);
  });
}

function startSolutionSequence() {
  if (!solutionSequence || !solutionSteps.length || solutionStepTimer) {
    return;
  }

  solutionSequence.classList.add("is-running");
  setSolutionStep(activeSolutionStep);

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return;
  }

  solutionStepTimer = window.setInterval(() => {
    setSolutionStep(activeSolutionStep + 1);
  }, 4000);
}

function stopSolutionSequence() {
  if (!solutionSequence) {
    return;
  }

  solutionSequence.classList.remove("is-running");
  window.clearInterval(solutionStepTimer);
  solutionStepTimer = null;
}

function selectBlueprintStep(step) {
  if (!step || !blueprintSteps.length) {
    return;
  }

  blueprintSteps.forEach((item) => {
    const isActive = item === step;
    const button = item.querySelector(".home-blueprint-dot");

    item.classList.toggle("is-active", isActive);

    if (button) {
      if (isActive) {
        button.setAttribute("aria-current", "true");
      } else {
        button.removeAttribute("aria-current");
      }
    }
  });

  if (blueprintActiveYear) {
    blueprintActiveYear.textContent = step.dataset.blueprintYear || "";
  }

  if (blueprintActiveTitle) {
    blueprintActiveTitle.textContent = step.dataset.blueprintTitle || "";
  }

  if (blueprintActiveCopy) {
    blueprintActiveCopy.textContent = step.dataset.blueprintCopy || "";
  }
}

applyPageLanguage();

playHeroClip();

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
    const subject = encodeURIComponent(
      pageLanguage === "en" ? "Project inquiry via Blauwe Bagger website" : "Projectvraag via Blauwe Bagger website",
    );
    const body =
      pageLanguage === "en"
        ? encodeURIComponent(
            `Name: ${name}\nEmail: ${email}\nPhone: ${phone}\nCompany: ${company}\n\nProject inquiry:\n${message}`,
          )
        : encodeURIComponent(
            `Naam: ${name}\nE-mail: ${email}\nTelefoon: ${phone}\nBedrijf: ${company}\n\nProjectvraag:\n${message}`,
          );

    window.location.href = `mailto:info@blauwebagger.nl?subject=${subject}&body=${body}`;

    if (formNote) {
      formNote.textContent =
        pageLanguage === "en"
          ? "Your email app is opening with the completed inquiry."
          : "Je mailprogramma wordt geopend met de ingevulde aanvraag.";
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

if (solutionSequence && solutionSteps.length) {
  setSolutionStep(0);

  const solutionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          startSolutionSequence();
          return;
        }

        stopSolutionSequence();
      });
    },
    { threshold: 0.36 },
  );

  solutionObserver.observe(solutionSequence);
}

blueprintSteps.forEach((step) => {
  const button = step.querySelector(".home-blueprint-dot");

  if (!button) {
    return;
  }

  button.addEventListener("click", () => selectBlueprintStep(step));
});

if (header) {
  syncHeaderOffset();
}
