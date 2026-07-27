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
const heroVideos = Array.from(document.querySelectorAll(".home-hero-video"));
const aboutStatementSection = document.querySelector(".about-statement-section");
const aboutStatementText = aboutStatementSection?.querySelector("[data-about-statement-text]");
const teamStory = document.querySelector("[data-team-story]");
const teamCards = Array.from(teamStory?.querySelectorAll("[data-team-card]") || []);
const solutionSequence = document.querySelector("[data-solution-sequence]");
const solutionSteps = solutionSequence?.querySelectorAll("[data-solution-step]") || [];
const solutionCards = Array.from(document.querySelectorAll("[data-solution-card]"));
const blueprintSteps = document.querySelectorAll("[data-blueprint-step]");
const blueprintActiveYear = document.querySelector("[data-blueprint-active-year]");
const blueprintActiveTitle = document.querySelector("[data-blueprint-active-title]");
const blueprintActiveCopy = document.querySelector("[data-blueprint-active-copy]");
const planTimelineStory = document.querySelector("[data-plan-timeline-story]");
const planTimelineAxis = document.querySelector(".plan-timeline-axis");
const planTimelineSteps = document.querySelectorAll("[data-plan-timeline-step]");
const planTimelineFeature = document.querySelector("[data-plan-timeline-feature]");
const planActiveYear = document.querySelector("[data-plan-active-year]");
const planActivePeriod = document.querySelector("[data-plan-active-period]");
const planActiveTitle = document.querySelector("[data-plan-active-title]");
const planActiveCopy = document.querySelector("[data-plan-active-copy]");
const carousels = document.querySelectorAll("[data-carousel]");
const baggerWidget = document.querySelector("#bagger-widget");
const blueHeaderSections = document.querySelectorAll(".home-section--blue, .home-section--blueprint");
const siteFooters = Array.from(document.querySelectorAll(".site-footer--brand, .site-footer--home"));
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
    videoIndex: 0,
    start: 0,
    end: 4.5,
  },
  {
    videoIndex: 1,
    start: 94,
    end: 97.2,
  },
  {
    videoIndex: 2,
    start: 41.5,
    end: 44,
  },
  {
    videoIndex: 3,
    start: 13,
    end: 17,
  },
];

let activeHeroClip = 0;
let heroClipTimer = null;
let activeSolutionStep = 0;
let solutionStepTimer = null;
let activeSolutionCard = null;
let solutionDialogIsOpening = false;
let solutionDialogIsClosing = false;
let lastScrollY = window.scrollY;
let headerIdleTimer = null;
let aboutStatementAccent = null;
let aboutStatementWords = [];
let aboutStatementAccentWords = [];
let planTimelineFeatureAnimation = null;

const headerAutoHideDelay = 700;
const headerAutoHideOffset = 120;
const heroVideoFadeDuration = 680;
const heroVideoCrossfadeOverlap = heroVideoFadeDuration / 1000;
const solutionCardMorphDuration = 460;
const solutionDetailFadeDuration = 170;
const solutionCardMorphEasing = "cubic-bezier(0.22, 1, 0.36, 1)";

const aboutJumpTargets = new Set(["het-plan", "het-team", "werken-bij"]);

function isAboutJumpNavigationActive() {
  return Boolean(
    document.body?.dataset.page === "over-ons" &&
      document.body.classList.contains("is-about-jump-navigation"),
  );
}

function syncAboutJumpNavigationState() {
  const isJump =
    document.body?.dataset.page === "over-ons" &&
    aboutJumpTargets.has(window.location.hash.slice(1));

  document.body?.classList.toggle("is-about-jump-navigation", isJump);
  return isJump;
}

function alignAboutHashTarget() {
  const targetId = window.location.hash.slice(1);
  if (!["het-plan", "het-team", "werken-bij"].includes(targetId)) {
    return;
  }

  const target = document.getElementById(targetId);
  if (!target) {
    return;
  }

  const headerHeight = document.querySelector("[data-header]")?.getBoundingClientRect().height || 0;
  const offset = Math.max(headerHeight, 112);
  const targetTop = target.getBoundingClientRect().top + window.scrollY - offset;

  window.scrollTo({ top: Math.max(0, targetTop), behavior: "auto" });
}

function applyAboutPageOrder() {
  syncAboutJumpNavigationState();

  const aboutMain = document.querySelector("main");
  const planSection = aboutMain?.querySelector("#het-plan");
  const planTimelineSection = aboutMain?.querySelector("[data-plan-timeline-story]");
  const teamSection = aboutMain?.querySelector("#het-team");

  if (planSection && planTimelineSection && teamSection) {
    teamSection.before(planSection, planTimelineSection);
  }

  const aboutLinkOrder = ["het-plan", "het-team", "werken-bij"];
  document.querySelectorAll(".nav-dropdown__menu, .mobile-menu").forEach((menu) => {
    const links = aboutLinkOrder
      .map((anchor) => menu.querySelector(`a[href=\"/over-ons#${anchor}\"]`))
      .filter(Boolean);

    if (links.length === aboutLinkOrder.length) {
      links[0].before(...links);
    }
  });

  if (["het-plan", "het-team", "werken-bij"].includes(window.location.hash.slice(1))) {
    window.requestAnimationFrame(alignAboutHashTarget);
    window.setTimeout(alignAboutHashTarget, 0);
    window.setTimeout(alignAboutHashTarget, 250);
    window.addEventListener("load", alignAboutHashTarget, { once: true });
  }
}

applyAboutPageOrder();
window.addEventListener("hashchange", () => {
  syncAboutJumpNavigationState();
  updateScrollProgress();
  window.setTimeout(alignAboutHashTarget, 0);
  window.setTimeout(alignAboutHashTarget, 120);
});

const i18n = {
  en: {
    title: "Blauwe Bagger | Home",
    description:
      "Blauwe Bagger processes dredged sediment into new raw materials. Discover our circular approach, projects, products, team and contact options.",
    text: {
      "Ga naar inhoud": "Skip to content",
      "Het plan": "The Plan",
      "Het team": "The team",
      "Werken bij": "Careers",
      Services: "Services",
      Projecten: "Projects",
      "Over ons": "About us",
      Taalkeuze: "Language",
      "Neem contact op": "Contact",
      Contact: "Contact",
      Menu: "Menu",
      Sluiten: "Close",
      "Toon details: Analyse": "Show details: Analysis",
      "Toon details: BlueBox verwerking": "Show details: BlueBox processing",
      "Toon details: Verwerking": "Show details: Processing",
      "Toon details: Hergebruik": "Show details: Reuse",
      "Bagger als": "Sediment as",
      als: "as",
      Grondstof: "Raw Material",
      Explore: "Explore",
      Bagger: "Sediment",
      Scheiden: "Separating",
      "Ontdek het plan": "Explore the plan",
      "Onze services": "Our services",
      "Onze Missie": "Our Mission",
      "Route van bagger naar grondstof": "Route from sediment to raw material",
      "Blauwe Bagger werkt aan een wereld waarin grondstoffen nooit verloren gaan. Wij zetten bagger om tot bruikbare grondstoffen die bijdragen aan een circulaire toekomst.":
        "Blauwe Bagger works toward a world where raw materials are never lost. We turn dredged sediment into usable raw materials that contribute to a circular future.",
      "Het Probleem": "The Problem",
      "Baggerindustrie": "Dredging industry",
      Bouwindustrie: "Construction industry",
      "xxx miljoen m3": "xxx million m3",
      Procesaanpak: "Process approach",
      "Onze Oplossing": "Our Solution",
      "Een praktische route van baggerstroom naar herbruikbare grondstof.":
        "A practical route from dredged sediment stream to reusable raw material.",
      "Input scan": "Input scan",
      "BlueBox module": "BlueBox module",
      "Output routes": "Output routes",
      Afvalstroom: "Waste stream",
      "Data & verwerking": "Data & processing",
      "Nieuwe toepassing": "New application",
      Analyse: "Analysis",
      "Data Analyse": "Data Analysis",
      Verwerking: "Processing",
      "BlueBox verwerking": "BlueBox processing",
      Hergebruik: "Reuse",
      "Waterbodemdata bepaalt welke fracties geschikt zijn voor hergebruik.":
        "Sediment data determines which fractions are suitable for reuse.",
      "De BlueBox ontwatert, scheidt en schoont bagger op locatie.":
        "The BlueBox dewaters, separates and cleans dredged sediment on site.",
      "Materialen worden toegepast in bouw- en betonproducten.":
        "Materials are used in construction and concrete products.",
      "De oplossing van het probleem begint in het erkennen van de variabiliteit van bagger. Bagger is extreem variabel, terwijl afnemers juist een constante, voorspelbare kwaliteit eisen.":
        "Solving the problem starts with recognizing the variability of dredged sediment. Dredged sediment is extremely variable, while buyers require consistent, predictable quality.",
      "Door middel van data-analyse overbruggen we dit gat. We zetten software in om omvangrijke bestanden met complexe data uit waterbodemonderzoeken om te zetten naar een concreet plan van aanpak.":
        "We bridge this gap through data analysis. Our software turns extensive, complex sediment survey data into a concrete plan of action.",
      "Hoe het werkt": "How it works",
      "De tool draait de traditionele keten om en neemt de klanteis als vertrekpunt. Vervolgens berekent het systeem of de specie uit een specifieke waterbodem de potentie heeft om aan die markteisen te voldoen.":
        "The tool reverses the traditional chain and starts with the customer's requirements. It then calculates whether sediment from a specific waterbed has the potential to meet those market requirements.",
      "Met een efficiënte poorttoets bepaalt de tool direct de exacte stappen voor scheiding via onze BlueBox en nabewerking, zoals verhitting of calcinatie. Bij een positieve match rolt er direct een recept uit om de bagger optimaal op te waarderen. Is de kwaliteit onvoldoende en niet te corrigeren? Dan filtert de tool de plot direct uit.":
        "Using an efficient gate test, the tool immediately determines the exact separation steps via our BlueBox and the required post-processing, such as heating or calcination. A positive match produces a recipe for optimally upgrading the sediment. If the quality is insufficient and cannot be corrected, the tool filters out the plot immediately.",
      "Zo transformeren we onbenutte data in een gegarandeerde, hoogwaardige circulaire grondstof.":
        "This is how we transform unused data into a guaranteed, high-quality circular raw material.",
      Ontwatering: "Dewatering",
      "Onze mobiele unit maakt het mogelijk om baggerspecie direct op locatie in te dikken. Vooral op afgelegen of moeilijk bereikbare plekken voorkomt dit onnodig transport van grote volumes waterige bagger. Dat betekent: lagere kosten, minder CO₂-uitstoot en een veel efficiënter proces.":
        "Our mobile unit makes it possible to dewater dredged sediment directly on site. Especially in remote or difficult-to-reach locations, this prevents unnecessary transport of large volumes of watery sediment. The result: lower costs, fewer CO₂ emissions and a much more efficient process.",
      Scheiding: "Separation",
      "Baggerspecie zit vaak vol met herbruikbare materialen zoals zand, klei, leem en organisch materiaal. Met onze installatie scheiden we deze stromen ter plekke, klaar voor circulair hergebruik. Zo voegen we directe waarde toe aan wat eerst als afval werd gezien, én creëren we kansen voor opbrengsten binnen het project.":
        "Dredged sediment often contains reusable materials such as sand, clay, loam and organic matter. Our installation separates these streams on site, ready for circular reuse. This adds immediate value to what was previously seen as waste and creates revenue opportunities within the project.",
      Opschoning: "Cleaning",
      "Ook vervuilde bagger verdient een tweede leven. Onze technologie verwijdert schadelijke stoffen uit de specie, waardoor materialen geschikt worden voor veilig en verantwoord hergebruik. Daarmee herstellen we niet alleen schade uit het verleden, maar bouwen we actief aan een schonere toekomst.":
        "Contaminated dredged sediment also deserves a second life. Our technology removes harmful substances, making the materials suitable for safe and responsible reuse. This allows us to repair damage from the past while actively building a cleaner future.",
      Nabewerking: "Post-processing",
      "Voordat de gescheiden materialen de markt op gaan, kunnen ze worden opgewaardeerd. Door gerichte nabewerkingstechnieken, zoals verhitting, vermaling of calcinatie, brengen we de fysische en chemische eigenschappen van de grondstof exact in lijn met de strenge klanteisen vanuit de bouw- en betonindustrie. De marktvraag is hierin altijd sturend.":
        "Before the separated materials enter the market, they can be upgraded. Targeted post-processing techniques, such as heating, grinding or calcination, align the material's physical and chemical properties with the strict requirements of the construction and concrete industries. Market demand always leads this process.",
      "Circulaire toepassingen": "Circular applications",
      "De opgeschoonde en bewerkte grondstoffen krijgen een hoogwaardig tweede leven. In plaats van te eindigen in een depot, worden ze direct ingezet als betrouwbare secundaire bouwstoffen. Denk hierbij aan aggregaten voor de betonindustrie, of hoogwaardige klei voor de keramische industrie.":
        "The cleaned and processed raw materials receive a high-quality second life. Instead of ending up in a depot, they are used directly as reliable secondary construction materials, such as aggregates for the concrete industry or high-quality clay for the ceramics industry.",
      "Door onze circulaire aanpak verminderen we de behoefte aan de winning van primaire grondstoffen, zoals nieuw zand en grind, aanzienlijk. Zo verlagen we de milieu-impact en bouwen we letterlijk aan een duurzamere toekomst.":
        "Our circular approach significantly reduces the need to extract primary raw materials such as new sand and gravel. This lowers environmental impact and quite literally builds a more sustainable future.",
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
      "Eerste installatie": "First installation",
      "Eerste scheidingsinstallatie ontwikkeld": "First separation installation developed",
      "Commerciële schaal": "Commercial scale",
      "Commerciële projecten": "Commercial projects",
      "Eerste project op commerciële schaal": "First project at commercial scale",
      "Commerciële projecten op operationele schaal": "Commercial projects at operational scale",
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
      "Voor bagger industrie": "For dredging industry",
      "Voor de baggerindustrie": "For dredging industry",
      "Werken met de BlueBox": "Work with the BlueBox",
      "Mobiele baggerverwerking": "Mobile dredged sediment processing",
      "Minder stortkosten, minder transport en sterker in aanbestedingen.":
        "Lower disposal costs, less transport and a stronger position in tenders.",
      "Minder stortkosten, minder transport en sterker in aanbestedingen. De BlueBox scheidt bagger direct op locatie.":
        "Lower disposal costs, less transport and a stronger position in tenders. The BlueBox separates dredged sediment directly on site.",
      "Voor de bouw": "For construction",
      "Secundaire grondstoffen, primaire kwaliteit": "Secondary raw materials, primary quality",
      "Secundaire grondstoffen voor de bouw": "Secondary raw materials for construction",
      "BlueSand, BlueFiller en BlueCalc als duurzame input voor de bouw.":
        "BlueSand, BlueFiller and BlueCalc as sustainable inputs for construction.",
      "BlueSand, BlueFiller en BlueCalc als duurzame input voor betonproductie en wegfunderingen.":
        "BlueSand, BlueFiller and BlueCalc as sustainable inputs for concrete production and road foundations.",
      BlueClay: "BlueClay",
      "Geactiveerde kleifractie met een uitzonderlijk fijne deeltjesgrootte. Gewonnen uit gescheiden baggerspecie en nabewerkt tot een consistent, hoogwaardig product.":
        "Activated clay fraction with an exceptionally fine particle size. Recovered from separated dredged sediment and post-processed into a consistent, high-quality product.",
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
      "All rights reserved.": "All rights reserved.",
      "Privacy Policy": "Privacy Policy",
      "Neem contact op!": "Contact us",
      "Deze pagina wordt gebouwd.": "This page is being built.",
    },
    html: {
      "hero-subtitle":
        'Every stream is a new chapter in <em>circular</em> raw material use.',
      "mission-copy":
        'Blauwe Bagger works toward a world where raw materials are never lost. We turn dredged sediment into usable raw materials that contribute to a <span class="home-mission-accent wave-underline">circular future.</span>',
      "problem-dredging":
        'With a total volume of tens of millions of m<sup>3</sup> per year, dredged sediment is <strong>the largest waste stream</strong> in the Netherlands. Because of contamination and changing composition, there are few solutions that use its value. As a result, sediment is often dumped in depots, <em>an expensive and unsustainable solution.</em>',
      "problem-concrete":
        'At the same time, the construction sector extracts hundreds of millions of tonnes of <strong>primary raw materials</strong> every year to produce concrete. That makes it one of the <em>most polluting industries in the world</em>; globally, <strong>8% of CO<sub>2</sub> emissions</strong> come from construction and concrete. The pressure to become more sustainable is growing fast.',
      "problem-meter-dredging":
        '<span class="home-problem-meter__label"><span data-count="40">0</span> million m<sup>3</sup></span><span class="home-problem-meter__context">dredged sediment per year</span>',
      "problem-meter-concrete":
        '<span class="home-problem-meter__label"><span data-count="30">0</span> billion tons</span><span class="home-problem-meter__context">primary raw materials</span>',
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

function translateSubtree(root) {
  if (pageLanguage !== "en" || !root) {
    return;
  }

  const dictionary = i18n.en;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
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

  root.querySelectorAll?.("[aria-label]").forEach((element) => {
    const key = normalizeTranslationKey(element.getAttribute("aria-label"));
    if (dictionary.text[key]) {
      element.setAttribute("aria-label", dictionary.text[key]);
    }
  });
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

  translateSubtree(document.body);

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

function prepareAboutStatementScrollText() {
  if (!aboutStatementText || aboutStatementText.dataset.scrollPrepared === "true") {
    return;
  }

  const walker = document.createTreeWalker(aboutStatementText, NodeFilter.SHOW_TEXT);
  const textNodes = [];

  while (walker.nextNode()) {
    if (walker.currentNode.nodeValue.trim()) {
      textNodes.push(walker.currentNode);
    }
  }

  textNodes.forEach((node) => {
    const fragment = document.createDocumentFragment();
    const parts = node.nodeValue.split(/(\s+)/);

    parts.forEach((part) => {
      if (!part) {
        return;
      }

      if (/^\s+$/.test(part)) {
        fragment.append(document.createTextNode(part));
        return;
      }

      const word = document.createElement("span");
      word.className = "about-statement-word";
      word.textContent = part;
      fragment.append(word);
    });

    node.replaceWith(fragment);
  });

  aboutStatementAccent = aboutStatementText.querySelector(".about-statement-accent");
  aboutStatementWords = Array.from(aboutStatementText.querySelectorAll(".about-statement-word"));
  aboutStatementAccentWords = Array.from(
    aboutStatementAccent?.querySelectorAll(".about-statement-word") || [],
  );
  aboutStatementText.dataset.scrollPrepared = "true";
}

function updateAboutStatementScrollSequence() {
  if (!aboutStatementSection || !aboutStatementText || !aboutStatementWords.length) {
    return;
  }

  const sequenceEnabled =
    window.innerWidth > 1000 && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (isAboutJumpNavigationActive()) {
    aboutStatementText.style.removeProperty("--about-statement-y");
    aboutStatementText.style.removeProperty("--about-statement-scale");
    aboutStatementWords.forEach((word) => {
      ["--about-word-opacity", "--about-word-y", "--about-word-blur"].forEach((property) =>
        word.style.removeProperty(property),
      );
    });
    aboutStatementAccent?.style.removeProperty("--about-wave-progress");
    return;
  }

  if (!sequenceEnabled) {
    aboutStatementText.style.removeProperty("--about-statement-y");
    aboutStatementText.style.removeProperty("--about-statement-scale");
    aboutStatementWords.forEach((word) => {
      ["--about-word-opacity", "--about-word-y", "--about-word-blur"].forEach((property) =>
        word.style.removeProperty(property),
      );
    });
    aboutStatementAccent?.style.removeProperty("--about-wave-progress");
    return;
  }

  const clamp = (value) => Math.min(Math.max(value, 0), 1);
  const smoothstep = (value) => {
    const normalized = clamp(value);
    return normalized * normalized * (3 - 2 * normalized);
  };
  const sectionRect = aboutStatementSection.getBoundingClientRect();
  const scrollRange = Math.max(aboutStatementSection.offsetHeight - window.innerHeight, 1);
  const sectionProgress = clamp(-sectionRect.top / scrollRange);
  const copyProgress = smoothstep(sectionProgress / 0.2);

  aboutStatementText.style.setProperty(
    "--about-statement-y",
    `${(18 * (1 - copyProgress)).toFixed(2)}px`,
  );
  aboutStatementText.style.setProperty(
    "--about-statement-scale",
    (0.985 + 0.015 * copyProgress).toFixed(4),
  );

  aboutStatementWords.forEach((word, index) => {
    const wordPosition = aboutStatementWords.length > 1 ? index / (aboutStatementWords.length - 1) : 0;
    const wordStart = 0.04 + wordPosition * 0.62;
    const wordProgress = smoothstep((sectionProgress - wordStart) / 0.16);

    word.style.setProperty("--about-word-opacity", (0.18 + 0.82 * wordProgress).toFixed(4));
    word.style.setProperty("--about-word-y", `${(10 * (1 - wordProgress)).toFixed(2)}px`);
    word.style.setProperty("--about-word-blur", `${(2.5 * (1 - wordProgress)).toFixed(2)}px`);
  });

  if (aboutStatementAccent && aboutStatementAccentWords.length) {
    const firstAccentWordIndex = aboutStatementWords.indexOf(aboutStatementAccentWords[0]);
    const lastAccentWordIndex = aboutStatementWords.indexOf(
      aboutStatementAccentWords[aboutStatementAccentWords.length - 1],
    );

    if (firstAccentWordIndex >= 0 && lastAccentWordIndex >= 0) {
      const wordDivisor = Math.max(aboutStatementWords.length - 1, 1);
      const waveStart = 0.04 + (firstAccentWordIndex / wordDivisor) * 0.62;
      const waveEnd = 0.04 + (lastAccentWordIndex / wordDivisor) * 0.62 + 0.16;
      const waveProgress = smoothstep(
        (sectionProgress - waveStart) / Math.max(waveEnd - waveStart, 0.16),
      );

      aboutStatementAccent.style.setProperty("--about-wave-progress", waveProgress.toFixed(4));
    }
  }
}

function updateTeamScrollSequence() {
  if (!teamStory || !teamCards.length) {
    return;
  }

  const sequenceEnabled =
    window.innerWidth > 1000 &&
    window.innerHeight >= 680 &&
    !isAboutJumpNavigationActive() &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (!sequenceEnabled) {
    teamStory.classList.remove("is-scroll-enabled");
    teamCards.forEach((card) => {
      [
        "--team-card-opacity",
        "--team-card-y",
        "--team-card-scale",
        "--team-card-blur",
      ].forEach((property) => card.style.removeProperty(property));
    });
    return;
  }

  teamStory.classList.add("is-scroll-enabled");

  const clamp = (value) => Math.min(Math.max(value, 0), 1);
  const smoothstep = (value) => {
    const normalized = clamp(value);
    return normalized * normalized * (3 - 2 * normalized);
  };
  const storyRect = teamStory.getBoundingClientRect();
  const scrollRange = Math.max(teamStory.offsetHeight - window.innerHeight, 1);
  const storyProgress = clamp(-storyRect.top / scrollRange);

  teamCards.forEach((card, index) => {
    const cardStart = 0.04 + index * 0.22;
    const cardProgress = smoothstep((storyProgress - cardStart) / 0.16);

    card.style.setProperty("--team-card-opacity", cardProgress.toFixed(4));
    card.style.setProperty("--team-card-y", `${(32 * (1 - cardProgress)).toFixed(2)}px`);
    card.style.setProperty("--team-card-scale", (0.965 + 0.035 * cardProgress).toFixed(4));
    card.style.setProperty("--team-card-blur", `${(12 * (1 - cardProgress)).toFixed(2)}px`);
  });
}

function planTimelineScrollIsEnabled() {
  return Boolean(
    planTimelineStory &&
      !planTimelineStory.hasAttribute("data-plan-timeline-static") &&
      planTimelineAxis &&
      planTimelineSteps.length > 1 &&
      window.innerWidth > 1000 &&
      window.innerHeight >= 680 &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
}

function updatePlanTimelineScrollSequence() {
  if (!planTimelineStory || !planTimelineAxis || !planTimelineSteps.length) {
    return;
  }

  const steps = Array.from(planTimelineSteps);

  if (!planTimelineScrollIsEnabled()) {
    planTimelineStory.classList.remove("is-scroll-enabled");
    const activeStep = steps.find((step) => step.classList.contains("plan-timeline-point--active")) || steps[0];
    planTimelineAxis.style.setProperty(
      "--timeline-scroll-position",
      activeStep?.dataset.planProgress || "12%",
    );
    return;
  }

  planTimelineStory.classList.add("is-scroll-enabled");

  const clamp = (value) => Math.min(Math.max(value, 0), 1);
  const storyRect = planTimelineStory.getBoundingClientRect();
  const scrollRange = Math.max(planTimelineStory.offsetHeight - window.innerHeight, 1);
  const storyProgress = clamp(-storyRect.top / scrollRange);
  const segmentProgress = storyProgress * (steps.length - 1);
  const segmentIndex = Math.min(Math.floor(segmentProgress), steps.length - 2);
  const segmentFraction = clamp(segmentProgress - segmentIndex);
  const startPosition = Number.parseFloat(steps[segmentIndex].dataset.planProgress || "12");
  const endPosition = Number.parseFloat(steps[segmentIndex + 1].dataset.planProgress || "95");
  const timelinePosition = startPosition + (endPosition - startPosition) * segmentFraction;
  const activeIndex = Math.min(Math.round(segmentProgress), steps.length - 1);

  planTimelineAxis.style.setProperty("--timeline-scroll-position", `${timelinePosition.toFixed(3)}%`);
  planTimelineStory.style.setProperty("--plan-timeline-progress", storyProgress.toFixed(4));

  const activeStep = steps[activeIndex];
  if (activeStep && !activeStep.classList.contains("plan-timeline-point--active")) {
    selectPlanTimelineStep(activeStep);
  }
}

function updateScrollProgress() {
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  const progress = scrollable > 0 ? window.scrollY / scrollable : 0;
  document.body.style.setProperty("--scroll", progress.toFixed(4));
  updateHeaderState();
  updateHeroState();
  updatePlanTimelineScrollSequence();

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return;
  }

  parallaxItems.forEach((item) => {
    const factor = Number(item.dataset.parallax || 0);
    const offset = window.scrollY * factor;
    item.style.transform = `translate3d(0, ${offset}px, 0)`;
  });
}

function elementIsVisible(element) {
  if (!element || element.hidden) {
    return false;
  }

  const style = window.getComputedStyle(element);
  if (style.display === "none" || style.visibility === "hidden") {
    return false;
  }

  const rect = element.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
}

function parseRgbColor(value) {
  const match = value.match(/rgba?\(([^)]+)\)/i);
  if (!match) {
    return null;
  }

  const parts = match[1].split(",").map((part) => Number.parseFloat(part.trim()));
  if (parts.length < 3 || parts.some((part, index) => index < 3 && Number.isNaN(part))) {
    return null;
  }

  return {
    r: parts[0],
    g: parts[1],
    b: parts[2],
    a: parts.length > 3 && !Number.isNaN(parts[3]) ? parts[3] : 1,
  };
}

function colorIsDark(color) {
  if (!color || color.a < 0.35) {
    return false;
  }

  const luminance = (0.2126 * color.r + 0.7152 * color.g + 0.0722 * color.b) / 255;
  return luminance < 0.48;
}

function getFooterSurfaceSource(footer) {
  const main = footer?.previousElementSibling?.matches("main")
    ? footer.previousElementSibling
    : document.querySelector("main");

  if (!main) {
    return null;
  }

  const candidates = Array.from(
    main.querySelectorAll(
      [
        ":scope > section",
        ":scope > div",
        ".project-builder-section",
        ".project-static-page > .detail-section",
        ".project-static-page > .detail-cta",
        ".detail-cta",
      ].join(", "),
    ),
  ).filter(elementIsVisible);

  return candidates[candidates.length - 1] || main;
}

function surfaceSourceIsDark(source) {
  if (!source) {
    return false;
  }

  const darkSelector = [
    ".home-section--blue",
    ".home-section--blueprint",
    ".home-tower--dark",
    ".home-stat-box--dark",
    ".service-route-section--bluebox",
    ".contact-form-section",
    ".plan-blueprint-page",
    ".project-builder-section--dark",
    ".detail-cta",
  ].join(", ");

  if (source.matches(darkSelector) || source.closest(darkSelector)) {
    return true;
  }

  let current = source;
  while (current && current !== document.body) {
    const backgroundColor = parseRgbColor(window.getComputedStyle(current).backgroundColor);
    if (backgroundColor && backgroundColor.a >= 0.35) {
      return colorIsDark(backgroundColor);
    }

    current = current.parentElement;
  }

  return false;
}

function syncFooterSurface() {
  siteFooters.forEach((footer) => {
    const followsDarkSurface = surfaceSourceIsDark(getFooterSurfaceSource(footer));
    footer.classList.toggle("site-footer--surface-light", followsDarkSurface);
    footer.classList.toggle("site-footer--surface-blue", !followsDarkSurface);
  });
}

let footerSurfaceFrame = null;

function queueFooterSurfaceSync() {
  if (!siteFooters.length) {
    return;
  }

  window.cancelAnimationFrame(footerSurfaceFrame);
  footerSurfaceFrame = window.requestAnimationFrame(syncFooterSurface);
}

function canAutoHideHeader() {
  return (
    header &&
    window.scrollY > headerAutoHideOffset &&
    !header.classList.contains("is-menu-open") &&
    !header.matches(":hover") &&
    !header.contains(document.activeElement)
  );
}

function showHeader() {
  header?.classList.remove("is-auto-hidden");
}

function scheduleHeaderAutoHide() {
  window.clearTimeout(headerIdleTimer);

  if (!header) {
    return;
  }

  headerIdleTimer = window.setTimeout(() => {
    if (canAutoHideHeader()) {
      header.classList.add("is-auto-hidden");
    }
  }, headerAutoHideDelay);
}

function handleScrollActivity() {
  const currentScrollY = window.scrollY;
  const scrollingUp = currentScrollY < lastScrollY - 4;
  const nearTop = currentScrollY <= 18;

  if (scrollingUp || nearTop || Math.abs(currentScrollY - lastScrollY) > 2) {
    showHeader();
  }

  lastScrollY = Math.max(currentScrollY, 0);
  updateScrollProgress();
  scheduleHeaderAutoHide();
}

function handlePageActivity() {
  showHeader();
  scheduleHeaderAutoHide();
}

function waitForHeroVideo(video) {
  if (video.readyState >= 2) {
    video.classList.add("is-loaded");
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    video.addEventListener(
      "loadeddata",
      () => {
        video.classList.add("is-loaded");
        resolve();
      },
      { once: true },
    );
    video.load();
  });
}

function seekHeroVideo(video, time) {
  return new Promise((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) {
        return;
      }

      settled = true;
      window.clearTimeout(timeoutId);
      video.removeEventListener("seeked", finish);
      resolve();
    };
    const timeoutId = window.setTimeout(finish, 900);

    video.addEventListener("seeked", finish, { once: true });

    try {
      video.currentTime = time;
    } catch (error) {
      finish();
    }
  });
}

async function playHeroClip(index = 0) {
  if (!heroVideos.length || !heroVideoClips.length) {
    return;
  }

  const clipIndex = index % heroVideoClips.length;
  const clip = heroVideoClips[clipIndex];
  const video = heroVideos[clip.videoIndex ?? clipIndex % heroVideos.length];

  if (!video) {
    return;
  }

  activeHeroClip = clipIndex;
  window.clearTimeout(heroClipTimer);

  await waitForHeroVideo(video);
  await seekHeroVideo(video, clip.start);

  video.playbackRate = 1;
  await video.play().catch(() => {});
  video.classList.add("is-active");

  window.setTimeout(() => {
    heroVideos.forEach((candidate) => {
      if (candidate !== video) {
        candidate.classList.remove("is-active");
        candidate.pause();
      }
    });
  }, heroVideoFadeDuration);

  heroClipTimer = window.setTimeout(() => {
    playHeroClip(activeHeroClip + 1);
  }, Math.max(1000, (clip.end - clip.start) * 1000 - heroVideoCrossfadeOverlap * 1000));
}

function setMobileMenu(open) {
  if (!menuToggle || !mobileMenu) {
    return;
  }

  menuToggle.setAttribute("aria-expanded", String(open));
  mobileMenu.hidden = !open;
  header?.classList.toggle("is-menu-open", open);
  showHeader();

  if (open) {
    window.clearTimeout(headerIdleTimer);
  } else {
    scheduleHeaderAutoHide();
  }

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

function getSolutionMorphTransform(originRect, targetRect) {
  const scaleX = originRect.width / targetRect.width;
  const scaleY = originRect.height / targetRect.height;
  const translateX = originRect.left - targetRect.left;
  const translateY = originRect.top - targetRect.top;

  return `translate(${translateX}px, ${translateY}px) scale(${scaleX}, ${scaleY})`;
}

function populateSolutionDialog(card) {
  const detail = card.querySelector("[data-solution-inline-detail]");
  const detailTemplate = card.querySelector("template[data-solution-detail]");

  if (!detail || !detailTemplate) {
    return detail;
  }

  if (!detail.childElementCount) {
    detail.append(detailTemplate.content.cloneNode(true));
    translateSubtree(detail);
  }

  return detail;
}

function animateSolutionCardMorph(card, originRect, duration = solutionCardMorphDuration) {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (reduceMotion || typeof card.animate !== "function") {
    return Promise.resolve();
  }

  const targetRect = card.getBoundingClientRect();
  const startTransform = getSolutionMorphTransform(originRect, targetRect);
  const animation = card.animate(
    [
      { transform: startTransform, transformOrigin: "top left", borderRadius: "16px" },
      { transform: "translate(0, 0) scale(1, 1)", transformOrigin: "top left", borderRadius: "20px" },
    ],
    {
      duration,
      easing: solutionCardMorphEasing,
      fill: "both",
    },
  );

  return animation.finished
    .catch(() => {})
    .then(() => animation.cancel());
}

async function openSolutionDialog(card) {
  if (
    !card ||
    !solutionSequence ||
    solutionDialogIsOpening ||
    solutionDialogIsClosing ||
    activeSolutionCard === card
  ) {
    return;
  }

  solutionDialogIsOpening = true;
  const originRect = card.getBoundingClientRect();
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const detail = populateSolutionDialog(card);
  const closeButton = card.querySelector("[data-solution-card-close]");
  const cardTitle = card.querySelector(":scope > h3");

  solutionSequence.style.minHeight = `${solutionSequence.getBoundingClientRect().height}px`;

  if (cardTitle && card.dataset.solutionExpandedTitle) {
    card.dataset.solutionCollapsedTitle = cardTitle.textContent.trim();
    const expandedTitle = card.dataset.solutionExpandedTitle;
    cardTitle.textContent =
      pageLanguage === "en" ? i18n.en.text[normalizeTranslationKey(expandedTitle)] || expandedTitle : expandedTitle;
  }

  stopSolutionSequence();
  activeSolutionCard = card;
  document.body.classList.add("has-solution-dialog");
  solutionSequence.classList.add("has-expanded-card");

  const selectedIndex = solutionCards.indexOf(card);
  solutionCards.forEach((item, itemIndex) => {
    const isSelected = item === card;
    item.classList.toggle("is-selected", isSelected);
    item.classList.toggle("is-expanded", isSelected);
    item.setAttribute("aria-expanded", isSelected ? "true" : "false");
    item.toggleAttribute("aria-hidden", !isSelected);

    if (isSelected) {
      item.style.removeProperty("--solution-dismiss-x");
      item.style.removeProperty("--solution-dismiss-y");
    } else {
      const direction = itemIndex < selectedIndex ? -1 : 1;
      item.style.setProperty("--solution-dismiss-x", `${direction * 56}px`);
      item.style.setProperty("--solution-dismiss-y", "-18px");
    }
  });

  card.dataset.collapsedLabel ||= card.getAttribute("aria-label") || "";
  card.setAttribute("role", "dialog");
  card.setAttribute("aria-modal", "true");
  card.setAttribute("aria-label", card.dataset.solutionTitle || card.dataset.collapsedLabel);
  card.setAttribute("tabindex", "-1");

  if (detail) {
    detail.hidden = false;
    detail.style.visibility = reduceMotion ? "" : "hidden";
  }

  if (closeButton) {
    closeButton.hidden = false;
  }

  await animateSolutionCardMorph(card, originRect);

  if (!reduceMotion && detail && typeof detail.animate === "function") {
    detail.style.visibility = "";
    const detailAnimation = detail.animate(
      [
        { opacity: 0, transform: "translateY(14px)" },
        { opacity: 1, transform: "translateY(0)" },
      ],
      { duration: solutionDetailFadeDuration, easing: "ease-out", fill: "both" },
    );
    await detailAnimation.finished.catch(() => {});
    detailAnimation.cancel();
  }

  solutionDialogIsOpening = false;
  closeButton?.focus({ preventScroll: true });
}

async function closeSolutionDialog() {
  if (!activeSolutionCard || !solutionSequence || solutionDialogIsOpening || solutionDialogIsClosing) {
    return;
  }

  solutionDialogIsClosing = true;
  const card = activeSolutionCard;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const detail = card.querySelector("[data-solution-inline-detail]");
  const closeButton = card.querySelector("[data-solution-card-close]");
  const cardTitle = card.querySelector(":scope > h3");
  const originRect = card.getBoundingClientRect();

  if (!reduceMotion && detail && typeof detail.animate === "function") {
    const detailAnimation = detail.animate(
      [
        { opacity: 1, transform: "translateY(0)" },
        { opacity: 0, transform: "translateY(14px)" },
      ],
      { duration: solutionDetailFadeDuration, easing: "ease-in", fill: "both" },
    );
    await detailAnimation.finished.catch(() => {});
    detailAnimation.cancel();
  }

  if (detail) {
    detail.hidden = true;
  }

  if (closeButton) {
    closeButton.hidden = true;
  }

  if (cardTitle && card.dataset.solutionCollapsedTitle) {
    cardTitle.textContent = card.dataset.solutionCollapsedTitle;
  }

  solutionSequence.classList.remove("has-expanded-card");
  solutionCards.forEach((item) => {
    item.classList.remove("is-selected", "is-expanded");
    item.setAttribute("aria-expanded", "false");
    item.removeAttribute("aria-hidden");
    item.style.removeProperty("--solution-dismiss-x");
    item.style.removeProperty("--solution-dismiss-y");
  });

  card.setAttribute("role", "button");
  card.removeAttribute("aria-modal");
  card.setAttribute("tabindex", "0");
  if (card.dataset.collapsedLabel) {
    card.setAttribute("aria-label", card.dataset.collapsedLabel);
  }

  await animateSolutionCardMorph(card, originRect);
  solutionSequence.style.minHeight = "";
  document.body.classList.remove("has-solution-dialog");
  solutionDialogIsClosing = false;
  activeSolutionCard = null;
  card?.focus({ preventScroll: true });
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

function selectPlanTimelineStep(step) {
  if (!step || !planTimelineSteps.length) {
    return;
  }

  const selectionChanged = !step.classList.contains("plan-timeline-point--active");

  planTimelineSteps.forEach((item) => {
    const isActive = item === step;
    item.classList.toggle("plan-timeline-point--active", isActive);

    if (isActive) {
      item.setAttribute("aria-current", "true");
    } else {
      item.removeAttribute("aria-current");
    }
  });

  if (planTimelineAxis) {
    planTimelineAxis.style.setProperty("--timeline-progress", step.dataset.planProgress || "12%");
    if (!planTimelineStory?.classList.contains("is-scroll-enabled")) {
      planTimelineAxis.style.setProperty("--timeline-scroll-position", step.dataset.planProgress || "12%");
    }
    planTimelineAxis.classList.toggle("plan-timeline-axis--period-visible", step.dataset.planShowPeriod === "true");
  }

  if (planActiveYear) {
    planActiveYear.textContent = step.dataset.planYear || "";
  }

  if (planActivePeriod) {
    const activeYear = step.dataset.planYear || "";
    const activePeriod = step.dataset.planPeriod || "";
    planActivePeriod.textContent = activePeriod;
    planActivePeriod.hidden = !activePeriod || activePeriod === activeYear;
  }

  if (planActiveTitle) {
    planActiveTitle.textContent = step.dataset.planTitle || "";
  }

  if (planActiveCopy) {
    planActiveCopy.textContent = step.dataset.planCopy || "";
  }

  if (selectionChanged && planTimelineFeature?.animate) {
    planTimelineFeatureAnimation?.cancel();
    planTimelineFeatureAnimation = planTimelineFeature.animate(
      [
        { opacity: 0.3, transform: "translate3d(0, 18px, 0) scale(0.985)" },
        { opacity: 1, transform: "translate3d(0, 0, 0) scale(1)" },
      ],
      {
        duration: 420,
        easing: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
    );
  }
}

function navigateToPlanTimelineStep(step) {
  if (!step || !planTimelineSteps.length) {
    return;
  }

  if (!planTimelineScrollIsEnabled()) {
    selectPlanTimelineStep(step);
    return;
  }

  const steps = Array.from(planTimelineSteps);
  const stepIndex = steps.indexOf(step);
  const scrollRange = Math.max(planTimelineStory.offsetHeight - window.innerHeight, 1);
  const stepProgress = stepIndex / Math.max(steps.length - 1, 1);

  window.scrollTo({
    top: planTimelineStory.offsetTop + scrollRange * stepProgress,
    behavior: "smooth",
  });
}

function getCarouselStep(track) {
  const firstItem = track?.children?.[0];
  const style = track ? window.getComputedStyle(track) : null;
  const gap = style ? Number.parseFloat(style.columnGap || style.gap || "0") || 0 : 0;
  return firstItem ? firstItem.getBoundingClientRect().width + gap : track.clientWidth * 0.85;
}

function updateCarouselControls(carousel) {
  const track = carousel.querySelector("[data-carousel-track]");
  const previousButton = carousel.querySelector("[data-carousel-prev]");
  const nextButton = carousel.querySelector("[data-carousel-next]");

  if (!track || !previousButton || !nextButton) {
    return;
  }

  const maxScroll = Math.max(0, track.scrollWidth - track.clientWidth);
  const hasOverflow = maxScroll > 2;

  previousButton.disabled = !hasOverflow;
  nextButton.disabled = !hasOverflow;
}

function scrollCarousel(carousel, direction) {
  const track = carousel.querySelector("[data-carousel-track]");

  if (!track) {
    return;
  }

  const maxScroll = Math.max(0, track.scrollWidth - track.clientWidth);
  const step = getCarouselStep(track);
  let nextLeft = track.scrollLeft + direction * step;

  if (direction > 0 && track.scrollLeft >= maxScroll - 2) {
    nextLeft = 0;
  } else if (direction < 0 && track.scrollLeft <= 2) {
    nextLeft = maxScroll;
  } else {
    nextLeft = Math.min(Math.max(nextLeft, 0), maxScroll);
  }

  track.scrollTo({
    left: nextLeft,
    behavior: "smooth",
  });
}

function resizeBaggerWidget(event) {
  const allowedOrigins = new Set(["https://bbtool.nl", "https://www.bbtool.nl"]);

  if (!baggerWidget || !allowedOrigins.has(event.origin) || event.data?.type !== "bagger-widget:resize") {
    return;
  }

  const height = Number(event.data.height);

  if (!Number.isFinite(height) || height <= 0) {
    return;
  }

  const nextHeight = `${Math.min(Math.max(Math.ceil(height), 360), 2200)}px`;
  const frame = baggerWidget.closest(".service-widget-frame");

  baggerWidget.style.height = nextHeight;
  baggerWidget.style.minHeight = nextHeight;

  if (frame) {
    frame.style.height = nextHeight;
    frame.style.minHeight = nextHeight;

    const ladder = frame.parentElement?.querySelector(".service-widget-ladder");
    if (ladder && window.matchMedia("(min-width: 1121px)").matches) {
      ladder.style.height = nextHeight;
      ladder.style.minHeight = nextHeight;
    }
  } else {
    baggerWidget.parentElement?.style.setProperty("min-height", nextHeight);
  }
}

applyPageLanguage();

playHeroClip();

if (baggerWidget) {
  window.addEventListener("message", resizeBaggerWidget);
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
  const revealEntry = (entries) => {
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
  };

  const observer = new IntersectionObserver(revealEntry, {
    threshold: 0.18,
    rootMargin: "0px 0px -8% 0px",
  });
  const serviceObserver = new IntersectionObserver(revealEntry, {
    threshold: 0.06,
    rootMargin: "0px 0px 14% 0px",
  });

  // The About page is intentionally static outside the BluePrint timeline.
  // Its timeline has its own scroll controller below, so don't attach the
  // generic reveal observer to the other About elements.
  if (document.body.dataset.page !== "over-ons") {
    revealItems.forEach((item) => {
      const targetObserver = item.closest(".home-section--service-routes") ? serviceObserver : observer;
      targetObserver.observe(item);
    });
  }
  if (document.body.dataset.page !== "over-ons") {
    counters.forEach((counter) => observer.observe(counter));
  }
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

carousels.forEach((carousel) => {
  const track = carousel.querySelector("[data-carousel-track]");
  const previousButton = carousel.querySelector("[data-carousel-prev]");
  const nextButton = carousel.querySelector("[data-carousel-next]");

  if (!track || !previousButton || !nextButton) {
    return;
  }

  previousButton.addEventListener("click", () => scrollCarousel(carousel, -1));
  nextButton.addEventListener("click", () => scrollCarousel(carousel, 1));

  track.addEventListener("scroll", () => {
    window.requestAnimationFrame(() => updateCarouselControls(carousel));
  });

  track.addEventListener("keydown", (event) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") {
      return;
    }

    event.preventDefault();
    scrollCarousel(carousel, event.key === "ArrowLeft" ? -1 : 1);
  });

  window.addEventListener("resize", () => updateCarouselControls(carousel));
  updateCarouselControls(carousel);
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
    const topic = data.get("topic") || "";
    const message = data.get("message") || "";
    const subject = encodeURIComponent(
      pageLanguage === "en" ? "Project inquiry via Blauwe Bagger website" : "Projectvraag via Blauwe Bagger website",
    );
    const body =
      pageLanguage === "en"
        ? encodeURIComponent(
            `Name: ${name}\nEmail: ${email}\nPhone: ${phone}\nCompany: ${company}\nInquiry type: ${topic}\n\nProject inquiry:\n${message}`,
          )
        : encodeURIComponent(
            `Naam: ${name}\nE-mail: ${email}\nTelefoon: ${phone}\nBedrijf: ${company}\nType vraag: ${topic}\n\nProjectvraag:\n${message}`,
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

window.addEventListener("scroll", handleScrollActivity, { passive: true });
window.addEventListener("resize", () => {
  updateScrollProgress();
  queueFooterSurfaceSync();
});
window.addEventListener("touchstart", handlePageActivity, { passive: true });
window.addEventListener("keydown", handlePageActivity);
updateScrollProgress();
syncFooterSurface();
scheduleHeaderAutoHide();

if (siteFooters.length) {
  window.addEventListener("load", queueFooterSurfaceSync);

  const mainContent = document.querySelector("main");
  if (mainContent) {
    const footerObserver = new MutationObserver(queueFooterSurfaceSync);
    footerObserver.observe(mainContent, {
      attributes: true,
      childList: true,
      subtree: true,
      attributeFilter: ["class", "hidden", "style"],
    });
  }
}

if (stepButtons.length && processLabel && processTitle && processCopy) {
  selectStep(0);
}

if (productCards.length && productDetail) {
  selectProduct("zand");
}

if (solutionSequence && solutionSteps.length) {
  stopSolutionSequence();
  solutionSteps.forEach((step) => {
    step.classList.remove("is-active");
  });
}

solutionCards.forEach((card) => {
  const closeButton = card.querySelector("[data-solution-card-close]");

  card.addEventListener("click", (event) => {
    if (event.target.closest("[data-solution-card-close]") || card.classList.contains("is-expanded")) {
      return;
    }

    openSolutionDialog(card);
  });
  card.addEventListener("keydown", (event) => {
    if (event.target.closest("[data-solution-card-close]") || card.classList.contains("is-expanded")) {
      return;
    }

    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    event.preventDefault();
    openSolutionDialog(card);
  });

  closeButton?.addEventListener("click", (event) => {
    event.stopPropagation();
    closeSolutionDialog();
  });
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && activeSolutionCard) {
    closeSolutionDialog();
  }
});

blueprintSteps.forEach((step) => {
  const button = step.querySelector(".home-blueprint-dot");

  if (!button) {
    return;
  }

  button.addEventListener("click", () => selectBlueprintStep(step));
});

planTimelineSteps.forEach((step) => {
  step.addEventListener("click", () => navigateToPlanTimelineStep(step));
});

if (header) {
  syncHeaderOffset();
}

function escapePublicContent(value) {
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

function jobDetailUrl(slug) {
  return `/vacature-detail?slug=${encodeURIComponent(slug || "open-sollicitatie")}`;
}

async function hydratePublicContentBoard(board) {
  const type = board.getAttribute("data-public-content");

  if (!type) {
    return;
  }

  try {
    const response = await fetch(`/api/${type}`, { credentials: "same-origin" });

    if (!response.ok) {
      return;
    }

    if (type === "jobs") {
      const items = await response.json();
      let settings = { showOpenApplication: false };

      try {
        const settingsResponse = await fetch("/api/jobs-settings", { credentials: "same-origin" });

        if (settingsResponse.ok) {
          settings = await settingsResponse.json();
        }
      } catch {
        // Keep the open application hidden when the setting cannot be read.
      }

      const visibleItems = Array.isArray(items)
        ? items.filter((item) => !/concept|gesloten|archief/i.test(item.status || ""))
        : [];

      renderPublicVacancies(board, visibleItems, settings);
      return;
    }

    const items = await response.json();
    const visibleItems = Array.isArray(items)
      ? items.filter((item) => !/concept|gesloten|archief/i.test(item.status || ""))
      : [];

    if (!visibleItems.length) {
      return;
    }

    board.innerHTML = visibleItems
      .slice(0, 3)
      .map(
        (item, index) => `
          <article class="about-board-card reveal is-visible">
            <span>${String(index + 1).padStart(2, "0")}</span>
            <h3>${escapePublicContent(item.title)}</h3>
            <p>${escapePublicContent(item.excerpt)}</p>
            <a href="/contact">${type === "jobs" ? "Neem contact op" : "Lees meer"} <span class="link-arrow__icon" aria-hidden="true"></span></a>
          </article>
        `,
      )
      .join("");
  } catch {
    // Keep the static fallback cards when the backend is not available.
  }
}

function renderPublicVacancies(board, items, settings = {}) {
  const openApplicationItem = {
    slug: "open-sollicitatie",
    title: "Open sollicitatie",
    excerpt: "Zie jij een rol in circulaire baggerketens? Stuur ons je achtergrond en waar je aan wilt bouwen.",
    category: "Algemeen",
    workload: "Open",
    status: "Open",
  };
  const showOpenApplication = Boolean(settings.showOpenApplication);
  const renderedItems = showOpenApplication && !items.some((item) => item?.slug === openApplicationItem.slug)
    ? [openApplicationItem, ...items]
    : items;
  const summary = document.querySelector("[data-vacancy-summary]");
  const latestDate = renderedItems
    .map((item) => new Date(item.updatedAt || item.date || ""))
    .filter((date) => Number.isFinite(date.getTime()))
    .sort((a, b) => b - a)[0];
  const updatedLabel = latestDate
    ? new Intl.DateTimeFormat("nl-NL", { month: "long", year: "numeric" }).format(latestDate)
    : new Intl.DateTimeFormat("nl-NL", { month: "long", year: "numeric" }).format(new Date());

  if (summary) {
    summary.textContent = `${renderedItems.length} ${renderedItems.length === 1 ? "vacature" : "vacatures"} · bijgewerkt ${updatedLabel}`;
  }

  document.querySelector("[data-open-application-note]")?.toggleAttribute("hidden", !showOpenApplication);

  board.innerHTML = renderedItems
    .map(
      (item) => `
        <article class="about-vacancy-row reveal is-visible">
          <div class="about-vacancy-row__main">
            <h3>${escapePublicContent(item.title)}</h3>
            <p>${escapePublicContent(item.excerpt || "Bekijk de vacature voor meer informatie.")}</p>
          </div>
          <span>${escapePublicContent(item.category || "Vacature")}</span>
          <span>${escapePublicContent(item.workload || item.status || "In overleg")}</span>
          <a href="${jobDetailUrl(item.slug)}">Bekijk <span class="link-arrow__icon" aria-hidden="true"></span></a>
        </article>
      `,
    )
    .join("");
}

async function hydratePublicTeam(grid) {
  try {
    const response = await fetch("/api/team", { credentials: "same-origin" });

    if (!response.ok) {
      return;
    }

    const items = await response.json();

    if (!Array.isArray(items) || !items.length) {
      return;
    }

    grid.innerHTML = items
      .map(
        (item) => `
          <article class="about-team-card" data-team-card>
            <img src="${escapePublicContent(item.image)}" alt="${escapePublicContent(item.name)}" loading="lazy" decoding="async" />
            <h3>${escapePublicContent(item.name)}</h3>
            <p>${escapePublicContent(item.role)}</p>
          </article>
        `,
      )
      .join("");
  } catch {
    // Keep the static fallback team cards when the backend is not available.
  }
}

document.querySelectorAll("[data-public-content]").forEach(hydratePublicContentBoard);
document.querySelectorAll("[data-team-grid]").forEach(hydratePublicTeam);
