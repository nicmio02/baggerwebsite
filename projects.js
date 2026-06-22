const projectFeedRoot = document.querySelector("[data-project-feed]");
const projectFeaturedRoot = document.querySelector("[data-project-featured]");
const projectGridRoot = document.querySelector("[data-project-grid]");
const projectBoardRoot = document.querySelector("[data-project-board]");
const projectDetailRoot = document.querySelector("[data-project-detail]");
const projectAdminRoot = document.querySelector("[data-project-admin]");
const homeProjectsRoot = document.querySelector("[data-home-projects]");
const adminForm = document.querySelector("[data-admin-form]");
const adminList = document.querySelector("[data-admin-list]");
const adminStatus = document.querySelector("[data-admin-status]");
const adminResetButton = document.querySelector("[data-admin-reset]");
const adminDashboard = document.querySelector("[data-admin-dashboard]");
const adminDashboardOpenButtons = document.querySelectorAll("[data-admin-dashboard-open]");
const builderEditorRegions = document.querySelectorAll("[data-builder-editor]");
const blockBuilder = document.querySelector("[data-block-builder]");
const blockList = document.querySelector("[data-block-list]");
const blockAddSelect = document.querySelector("[data-block-add]");
const blockPalette = document.querySelector("[data-block-palette]");
const blockInspector = document.querySelector("[data-block-inspector]");
const builderPreview = document.querySelector("[data-builder-preview]");
const projectSwitch = document.querySelector("[data-project-switch]");
let adminBlocks = [];
let draggedBlockId = "";
let draggedBlockType = "";
let activeBlockId = "";
let adminProjectsCache = [];

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
      <span class="pill ${dark ? "pill--dark" : ""}">${escapeHtml(projectCategoryLabel(project))}</span>
      <span class="pill ${dark ? "pill--dark" : ""}">${escapeHtml(project.status)}</span>
      <span class="pill ${dark ? "pill--dark" : ""}">${escapeHtml(project.location)}</span>
      <span class="pill ${dark ? "pill--dark" : ""}">${escapeHtml(formatDate(project.date))}</span>
    </div>
  `;
}

const projectBoardSections = [
  {
    key: "samenwerkingen",
    label: "Samenwerkingen",
    match: ["samenwerking", "partner", "consortium", "provincie", "gemeente", "tbi", "deltares", "tu delft"],
    placeholders: [
      { title: "Beton uit Bagger / TBI", mark: "TBI", slug: "beton-uit-bagger-tbi" },
      { title: "Bakstenen uit Bagger / DC-bricks", mark: "DC", slug: "bakstenen-uit-bagger-dc-bricks" },
      { title: "Circulaire Bagger Consortium", mark: "CBC", slug: "circulaire-bagger-consortium" },
    ],
  },
  {
    key: "praktijktesten",
    label: "Praktijktesten",
    match: ["pilot", "praktijk", "test", "case", "locatie", "dry run", "uitvoering", "amsterdam"],
    placeholders: [
      { title: "Amsterdam / Centraal Station", mark: "AMS", slug: "amsterdam-centraal-station" },
      { title: "Provincie Zuid-Holland", mark: "PZH", slug: "provincie-zuid-holland" },
      { title: "Amsterdam / IJburg", mark: "IJ", slug: "amsterdam-ijburg" },
    ],
  },
  {
    key: "rd",
    label: "R&D",
    match: ["r&d", "research", "onderzoek", "verkenning", "ontwikkeling", "extractie", "pfas", "3d", "print"],
    placeholders: [
      { title: "Zware Metalen extractie uit Bagger", mark: "ZM", slug: "zware-metalen-extractie-uit-bagger" },
      { title: "PFAS extractie uit Bagger", mark: "PFAS", slug: "pfas-extractie-uit-bagger" },
      { title: "3D-printen met Bagger", mark: "3D", slug: "3d-printen-met-bagger" },
    ],
  },
];

const defaultProjectCategory = "Praktijktesten";

const staticProjectPages = {
  "beton-uit-bagger-tbi": {
    crumb: "Beton uit Bagger / TBI",
    tag: "Samenwerking",
    titleLines: [
      'Beton uit <em>Bagger</em>',
      "in samenwerking met TBI",
    ],
    subtitle: "Van waterbodem naar betonmengsel",
    body: [
      "In samenwerking met TBI onderzoekt Blauwe Bagger of en hoe bagger direct kan worden ingezet als grondstof voor betonproductie. TBI is een van de grootste bouw- en techniekbedrijven van Nederland en heeft de ambitie om haar bouwprocessen significant te verduurzamen.",
      "Dit project richt zich op de toepassing van BlueSand en BlueFiller - twee secundaire grondstoffen die Blauwe Bagger wint uit gebaggerd sediment - als vervangers voor primaire zand- en vulfracties in betonmengsels.",
    ],
    stats: [
      { number: "BlueSand", label: "Zandfractie uit bagger" },
      { number: "BlueFiller", label: "Kleifractie als vulmiddel" },
      { number: "CO2 &darr;", label: "Lagere voetafdruk per m3 beton" },
    ],
    stepsTitle: "Aanpak",
    steps: [
      {
        title: "Waterbodemonderzoek & datafase",
        desc: "Blauwe Bagger analyseert de waterbodemonderzoeken van de baggerlocaties van TBI. Op basis van korrelgrootte, verontreiniging en organisch gehalte wordt bepaald welke fracties geschikt zijn voor hoogwaardig hergebruik.",
      },
      {
        title: "Scheiding op locatie met de BlueBox",
        desc: "De mobiele BlueBox van Blauwe Bagger wordt ingezet op de baggerlocatie. De installatie ontwatert en scheidt de bagger ter plekke in bruikbare fracties.",
      },
      {
        title: "Labotesten & betonproeven",
        desc: "De gewonnen fracties worden getest op mechanische eigenschappen en vergeleken met primaire grondstoffen. TBI integreert de materialen vervolgens in proefmengsels en kleinschalige bouwapplicaties.",
      },
      {
        title: "Opschaling naar bouwprojecten",
        desc: "Bij positieve resultaten wordt de samenwerking opgeschaald naar concrete TBI-bouwprojecten, waar de secundaire grondstoffen standaard worden ingezet naast of ter vervanging van primaire materialen.",
      },
    ],
    highlightsTitle: "Wat levert dit op?",
    highlights: [
      ["Minder primaire winning", "Zand en vulmiddelen hoeven niet langer uit de grond gewonnen te worden"],
      ["Lagere stortkosten", "Bagger wordt nuttig ingezet in plaats van afgevoerd naar een depot"],
      ["Circulair bouwverhaal", "TBI kan aantoonbaar duurzamer bouwen en scoort sterker bij aanbestedingen"],
      ["Lokale keten", "Grondstoffen gewonnen uit Nederlandse wateren, geen lange aanvoerketens"],
    ],
    cta: "Interesse in samenwerking? Neem contact op om te bekijken hoe Blauwe Bagger jouw baggerproject kan omzetten in waardevolle grondstoffen voor de bouwsector.",
  },
  "bakstenen-uit-bagger-dc-bricks": {
    crumb: "Bakstenen uit Bagger / DC-bricks",
    tag: "Samenwerking",
    titleLines: [
      'Bakstenen uit <em>Bagger</em>',
      "in samenwerking met DC-bricks",
    ],
    subtitle: "Duurzame bouwmaterialen uit waterbodem",
    body: [
      "DC-bricks ontwikkelt duurzame, circulaire bouwmaterialen met een minimale CO2-voetafdruk. In samenwerking met Blauwe Bagger onderzoeken zij of kleifracties gewonnen uit bagger kunnen worden ingezet als grondstof voor de productie van bakstenen en andere keramische bouwmaterialen.",
      "De kleifractie - ook wel BlueFiller of BlueCalc - die Blauwe Bagger wint via de BlueBox heeft eigenschappen die kansrijk zijn voor de keramische industrie. Dit project brengt die kansen in kaart.",
    ],
    stats: [
      { number: "Klei", label: "Primaire grondstof voor keramiek" },
      { number: "BlueCalc", label: "Gecalcineerde kleifractie" },
      { number: "8%", label: "CO2-reductie potentieel bouwsector" },
    ],
    stepsTitle: "Aanpak",
    steps: [
      {
        title: "Karakterisatie van kleifracties",
        desc: "Niet alle klei is gelijk. Blauwe Bagger analyseert de samenstelling van de gewonnen kleifracties op mineralogische eigenschappen, plasticiteitsgrenzen en verontreinigingsgehalte.",
      },
      {
        title: "Calcinering en nabewerking",
        desc: "De kansrijke kleifracties worden gecalcineerd - verhit tot hoge temperatuur - waarna de puzzolane eigenschappen worden geactiveerd. DC-bricks test de gebakken producten op sterkte en duurzaamheid.",
      },
      {
        title: "Productintegratie",
        desc: "Succesvolle fracties worden geintegreerd in het DC-bricks productieproces en getest als vervangers voor primaire klei in de productie van duurzame bakstenen en gevelelementen.",
      },
    ],
    highlightsTitle: "Wat levert dit op?",
    highlights: [
      ["Nieuwe afzetmarkt", "Kleifracties vinden een hoogwaardige toepassing in de keramische industrie"],
      ["Minder primaire kleiwinning", "Vermindert de druk op eindige kleivoorraden in Nederland"],
      ["Circulaire baksteen", "Een aantoonbaar duurzaam bouwproduct dat de markt kan veranderen"],
    ],
    cta: "Meer weten? Neem contact op met Blauwe Bagger om te ontdekken of jouw baggerstroom kansrijke kleifracties bevat voor de keramische industrie.",
  },
  "circulaire-bagger-consortium": {
    crumb: "Circulaire Bagger Consortium",
    tag: "Samenwerking",
    titleLines: ['<em>Circulaire</em> Bagger Consortium'],
    subtitle: "Sectorbreed samenwerken aan de circulaire baggerketen",
    body: [
      "Het Circulaire Bagger Consortium brengt partijen uit de baggersector, bouwsector, kennisinstellingen en overheden samen om gezamenlijk te werken aan de grootschalige verduurzaming van baggerstromen in Nederland.",
      "Blauwe Bagger neemt deel als technologiepartner die de data-infrastructuur en scheidingstechnologie inbrengt. Het consortium heeft als doel om standaarden te ontwikkelen, pilots te financieren en regelgeving te agenderen die de circulaire baggerketen mogelijk maakt.",
    ],
    stats: [
      { number: "Multi", label: "Sectoroverstijgende samenwerking" },
      { number: "Standaard", label: "Ontwikkeling van sectornormen" },
      { number: "NL-breed", label: "Schaal van de ambitie" },
    ],
    stepsTitle: "Rol van Blauwe Bagger",
    steps: [
      {
        title: "Data & analyse",
        desc: "Blauwe Bagger levert de methodiek voor het ontsluiten en analyseren van waterbodemonderzoeken en maakt baggerstromen inzichtelijk voor alle consortiumpartners.",
      },
      {
        title: "Technologie-inbreng",
        desc: "De BlueBox-technologie wordt beschikbaar gesteld voor consortiumprojecten als bewezen scheidingsoplossing op locatie.",
      },
      {
        title: "Regelgevingsagenda",
        desc: "Blauwe Bagger werkt samen met beleidsmakers om de erkenning van secundaire grondstoffen uit bagger te versnellen en juridische barrieres te slechten.",
      },
    ],
    cta: "Wil jij deelnemen aan het consortium? We zijn altijd op zoek naar nieuwe partners uit de bagger-, bouw- en grondstofsector.",
  },
  "amsterdam-centraal-station": {
    crumb: "Amsterdam / Centraal Station",
    tag: "Praktijktest",
    titleLines: ['Amsterdam <em>Centraal Station</em>'],
    subtitle: "Grootschalige scheiding in een stedelijke omgeving",
    body: [
      "Rondom het Amsterdam Centraal Station wordt regelmatig gebaggerd om de vaarwegen rondom het station bevaarbaar te houden. Deze bagger - afkomstig uit drukke havengebieden - is complex van samenstelling en bevat een mix van organisch materiaal, zand en klei.",
      "Blauwe Bagger heeft in dit project de BlueBox ingezet om de bagger direct op locatie te ontwateren en te scheiden. Het doel: aantonen dat ook in stedelijke, complexe omgevingen hoogwaardige fracties gewonnen kunnen worden.",
    ],
    stats: [
      { number: "Stedelijk", label: "Complex baggermilieu" },
      { number: "&gt;50%", label: "Reductie transportvolume" },
      { number: "Pilot", label: "Eerste grootschalige stedelijke test" },
    ],
    stepsTitle: "Uitdagingen & bevindingen",
    steps: [
      {
        title: "Complexe baggersamenstelling",
        desc: "Stedelijke bagger bevat meer verontreinigingen en organisch materiaal dan bagger uit open vaarwegen. De data-analyse vooraf maakte het mogelijk om realistische verwachtingen te stellen over de opbrengst per fractie.",
      },
      {
        title: "Ruimtelijke beperkingen",
        desc: "De BlueBox werd ingezet op een beperkte werkplaats naast het station. De compactheid van de installatie bleek een doorslaggevend voordeel voor stedelijke inzetbaarheid.",
      },
      {
        title: "Resultaten",
        desc: "Een significante hoeveelheid zandfractie kon worden gewonnen en is na nabewerking geleverd als BlueSand. De stortkosten voor de opdrachtgever werden aanzienlijk verlaagd.",
      },
    ],
    cta: "Heeft u een vergelijkbaar project? Wij voeren graag een vrijblijvende analyse uit van uw waterbodemonderzoek.",
  },
  "provincie-zuid-holland": {
    crumb: "Provincie Zuid-Holland",
    tag: "Praktijktest",
    titleLines: ['Provincie <em>Zuid-Holland</em>'],
    subtitle: "Data-gedreven baggerbeheer op provinciale schaal",
    body: [
      "Zuid-Holland beheert honderden kilometers aan watergangen en vaarten. De provincie heeft de ambitie om haar baggerbeheer te verduurzamen en tegelijk de kosten te verlagen. In samenwerking met Blauwe Bagger is een pilot gestart om te onderzoeken hoe de provincie haar baggerstromen structureel anders kan organiseren.",
      "Dit project richt zich niet alleen op het winnen van grondstoffen, maar ook op het opbouwen van een provinciaal databeheer voor waterbodemonderzoeken - zodat op jaarbasis kan worden bepaald welke baggerlocaties het meest kansrijk zijn voor hergebruik.",
    ],
    stats: [
      { number: "Provinciaal", label: "Schaal van het project" },
      { number: "Data", label: "Centraal databeheer waterbodem" },
      { number: "Structureel", label: "Langjarige samenwerking" },
    ],
    stepsTitle: "Aanpak",
    steps: [
      {
        title: "Inventarisatie bestaande onderzoeken",
        desc: "Alle beschikbare waterbodemonderzoeken van de provincie zijn geinventariseerd en geanalyseerd. Blauwe Bagger heeft een ruimtelijk overzicht gemaakt van kansrijke baggerlocaties.",
      },
      {
        title: "Pilotlocaties selecteren",
        desc: "Op basis van de data zijn drie locaties geselecteerd voor een praktijktest met de BlueBox. Criteria: hoeveelheid bagger, toegankelijkheid en verwachte kwaliteit van de zandfractie.",
      },
      {
        title: "Structureel baggerbeheerplan",
        desc: "Op basis van de pilotresultaten wordt een meerjarig baggerbeheerplan opgesteld dat circulair hergebruik als standaard integreert in de provinciale baggerplanning.",
      },
    ],
    cta: "Bent u een waterschap of gemeente? Blauwe Bagger helpt ook uw baggerbeheer data-gedreven en circulair te maken.",
  },
  "amsterdam-ijburg": {
    crumb: "Amsterdam / IJburg",
    tag: "Praktijktest",
    titleLines: ['Amsterdam <em>IJburg</em>'],
    subtitle: "Bagger als bouwgrondstof voor uitbreidingswijken",
    body: [
      "De uitbreiding van IJburg vraagt om grootschalige grondwerkzaamheden en baggeroperaties in het IJmeer. Gemeente Amsterdam en haar aannemers staan voor de vraag hoe de vrijkomende bagger zo duurzaam en kostenefficient mogelijk kan worden verwerkt.",
      "Blauwe Bagger heeft in dit project aangetoond dat een deel van de bagger - na scheiding op locatie - direct inzetbaar is als ophoogmateriaal en als grondstof voor de lokale bouwsector. Hiermee sluit de keten: de bagger van IJburg wordt de grondstof voor de gebouwen van IJburg.",
    ],
    stats: [
      { number: "Lokaal", label: "Gesloten keten op wijkniveau" },
      { number: "Ophoog", label: "Zand als ophoogmateriaal" },
      { number: "Bouw", label: "Grondstoffen voor nieuwbouw" },
    ],
    stepsTitle: "Bevindingen",
    steps: [
      {
        title: "Schone zandfractie gewonnen",
        desc: "Het IJmeerbagger bleek relatief schoon van samenstelling. Een groot deel van de zandfractie voldeed aan de normen voor toepassing als ophoogzand en bouwzand.",
      },
      {
        title: "Aanzienlijke kostenreductie",
        desc: "Door ter plekke te scheiden hoefde er minder volume te worden getransporteerd naar een depot. De besparing op transport- en stortkosten was substantieel.",
      },
      {
        title: "Model voor stedelijke uitbreiding",
        desc: "IJburg toont aan dat circulaire baggerverwerking haalbaar is als vast onderdeel van de planvorming bij stedelijke uitbreidingsprojecten - mits vroegtijdig meegenomen in de aanbestedingsstrategie.",
      },
    ],
    cta: "Werkt u aan een gebiedsontwikkeling? Blauwe Bagger denkt graag mee over de baggerstrategie en het hergebruik van vrijkomende grondstoffen.",
  },
  "zware-metalen-extractie-uit-bagger": {
    crumb: "Zware Metalen extractie uit Bagger",
    tag: "R&D",
    titleLines: [
      'Zware Metalen <em>extractie</em>',
      "uit Bagger",
    ],
    subtitle: "Van verontreiniging naar waardevolle grondstof",
    body: [
      "Bagger bevat niet alleen zand en klei - in sommige watergebieden zijn er ook concentraties van zware metalen zoals koper, zink en nikkel aanwezig. Dit zijn doorgaans de fracties die bagger ongeschikt maken voor hergebruik en zorgen voor hoge verwerkingskosten.",
      "Blauwe Bagger onderzoekt in dit R&D-project of deze zware metalen selectief kunnen worden geextraheerd uit de bagger - zodat de resterende fracties schoner zijn en de metalen zelf als secundaire grondstof kunnen worden aangeboden aan de maakindustrie.",
    ],
    stats: [
      { number: "Cu, Zn", label: "Koper, zink & andere metalen" },
      { number: "R&D", label: "Fase: laboratorium & pilotschaal" },
      { number: "2 stromen", label: "Schone fractie + metalenconcentraat" },
    ],
    stepsTitle: "Onderzoeksvragen",
    steps: [
      {
        title: "Binding van metalen aan baggerfracties",
        desc: "Aan welke korrelgrootten en minerale fases zijn de zware metalen gebonden? Dit bepaalt welk scheidingsproces het meest effectief is.",
      },
      {
        title: "Extractiemethoden",
        desc: "Blauwe Bagger test zowel fysische scheiding (hydrocycloon, dichtheidsscheiding) als chemische extractiemethoden op laboratoriumschaal.",
      },
      {
        title: "Valorisatie van het metalenconcentraat",
        desc: "In overleg met metaalverwerkende industrieen wordt onderzocht welke kwaliteitseisen gelden voor het metalenconcentraat en of afname haalbaar is.",
      },
    ],
    cta: "Bent u actief in de metalensector of waterbodemonderzoek? We werken graag samen met kennispartners en potentiele afnemers van het metalenconcentraat.",
  },
  "pfas-extractie-uit-bagger": {
    crumb: "PFAS extractie uit Bagger",
    tag: "R&D",
    titleLines: [
      'PFAS <em>extractie</em>',
      "uit Bagger",
    ],
    subtitle: "Het eeuwige chemie probleem aanpakken aan de bron",
    body: [
      "PFAS - poly- en perfluoralkylstoffen - vormen een van de grootste uitdagingen voor de baggersector. Door de aanwezigheid van PFAS in waterbodem is een groeiend deel van de bagger in Nederland niet meer vrij toepasbaar, wat leidt tot sterk stijgende verwerkingskosten en capaciteitsproblemen bij depots.",
      "Blauwe Bagger onderzoekt of PFAS via gerichte scheidingstechnieken kan worden geconcentreerd in een kleine, beheersbare fractie - zodat het overgrote deel van de bagger vrijkomt voor hergebruik als grondstof.",
    ],
    stats: [
      { number: "PFAS", label: "Meest urgente baggerprobleem NL" },
      { number: "Scheiding", label: "Concentreren in kleine fractie" },
      { number: "Vrijval", label: "Schone fractie voor hergebruik" },
    ],
    stepsTitle: "Onderzoeksaanpak",
    steps: [
      {
        title: "PFAS-mapping in waterbodem",
        desc: "Op basis van waterbodemonderzoeken brengt Blauwe Bagger in kaart in welke fracties (fijn/grof, organisch/mineraal) PFAS-verbindingen zich het sterkst concentreren.",
      },
      {
        title: "Scheidingstechnieken",
        desc: "Verschillende fysische en oxidatieve scheidingsmethoden worden getest om PFAS te concentreren in een zo klein mogelijke fractie, zodat de rest van de bagger onder de norm blijft.",
      },
      {
        title: "Eindverwerking van de PFAS-fractie",
        desc: "In samenwerking met gespecialiseerde thermische verwerkingsbedrijven wordt onderzocht hoe de PFAS-concentraatfractie veilig en definitief verwerkt kan worden.",
      },
    ],
    cta: "Heeft u te maken met PFAS-problematiek in uw baggerproject? Neem contact op voor een vrijblijvend gesprek over de mogelijkheden.",
  },
  "3d-printen-met-bagger": {
    crumb: "3D-printen met Bagger",
    tag: "R&D",
    titleLines: ['3D-printen met <em>Bagger</em>'],
    subtitle: "In samenwerking met Urban Reef",
    body: [
      "In samenwerking met Urban Reef - een pionier in bioreceptieve architectuur en 3D-print technologie - onderzoekt Blauwe Bagger of baggermateriaal kan worden ingezet als printmedium voor grootschalige 3D-geprinte constructies.",
      "Urban Reef ontwerpt complexe, organische structuren die worden geprint uit betonachtige mengsels. Bagger - mits van de juiste samenstelling en zuiverheid - zou een duurzame vervanging kunnen zijn voor de primaire grondstoffen die nu in hun printmengsels worden gebruikt.",
    ],
    stats: [
      { number: "3D-print", label: "Nieuwe toepassing voor bagger" },
      { number: "Bioreceptief", label: "Structuren voor natuur & architectuur" },
      { number: "Urban Reef", label: "Technologiepartner" },
    ],
    stepsTitle: "Wat wordt onderzocht?",
    steps: [
      {
        title: "Printbaarheid van baggermengsels",
        desc: "Welke korrelgrootteverdeling en consistentie heeft een baggermengsel nodig om printvriendelijk te zijn? Blauwe Bagger en Urban Reef testen verschillende recepturen op vloeibaarheid, stijfheid en hechting.",
      },
      {
        title: "Mechanische eigenschappen",
        desc: "Geprinte testtegels en structuurelementen worden getest op druksterkte, wateropname en duurzaamheid. Dit bepaalt of het materiaal geschikt is voor constructieve of decoratieve toepassingen.",
      },
      {
        title: "Bioreceptiviteit",
        desc: "Een van de unieke eigenschappen van Urban Reef's structuren is dat ze microhabitats vormen voor flora en fauna. Bagger bevat organische stoffen die deze bioreceptiviteit kunnen versterken.",
      },
    ],
    cta: "Bent u actief in 3D-print technologie, architectuur of materiaalontwikkeling? Blauwe Bagger staat open voor nieuwe R&D-samenwerkingen op het snijvlak van bagger en innovatieve bouwmaterialen.",
  },
};

function projectBoardSectionFor(project) {
  const category = String(project.category || "").toLowerCase();

  if (/(samenwerking|partner|consortium)/.test(category)) {
    return "samenwerkingen";
  }

  if (/(r&d|onderzoek|research|verkenning|ontwikkeling)/.test(category)) {
    return "rd";
  }

  if (/(pilot|praktijk|test|case)/.test(category)) {
    return "praktijktesten";
  }

  const haystack = `${project.status || ""} ${project.location || ""} ${project.title || ""} ${
    project.excerpt || ""
  }`.toLowerCase();
  const match = projectBoardSections.find((section) => section.match.some((term) => haystack.includes(term)));

  return match?.key || "praktijktesten";
}

function projectCategoryLabel(project) {
  const sectionKey = projectBoardSectionFor(
    typeof project === "string" ? { category: project } : project || { category: defaultProjectCategory },
  );
  return projectBoardSections.find((section) => section.key === sectionKey)?.label || defaultProjectCategory;
}

function projectCoverFallback(project) {
  const key = projectBoardSectionFor(project);

  if (key === "samenwerkingen") {
    return "/assets/media/installatie.jpeg";
  }

  if (key === "rd") {
    return "/assets/media/bluebox-tablet.png";
  }

  return "/assets/media/truck.png";
}

function renderProjectBoardCard(project) {
  const image = normalizeAssetUrl(project.coverImage || projectCoverFallback(project));
  const date = formatDate(project.date);
  const category = projectCategoryLabel(project);

  return `
    <a class="project-board-card project-board-card--live reveal is-visible" href="/projecten/${encodeURIComponent(project.slug)}">
      <div class="project-board-card__media" aria-hidden="true">
        <img src="${escapeHtml(image)}" alt="${escapeHtml(project.title)}" />
      </div>
      <div class="project-board-card__body">
        <div class="project-board-card__meta">
          <span>${escapeHtml(category)}</span>
          ${date ? `<span>${escapeHtml(date)}</span>` : ""}
        </div>
        <h3>${escapeHtml(project.title)}</h3>
        <span class="project-board-card__cta">
          <span>Bekijk project</span>
          <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M5 12h13m-5-5 5 5-5 5" /></svg>
        </span>
      </div>
    </a>
  `;
}

function renderProjectBoardPlaceholder(item, index) {
  const fallbackImages = [
    "/assets/media/installatie.jpeg",
    "/assets/media/bricks-background.jpg",
    "/assets/media/bluebox-tablet.png",
  ];
  const image = fallbackImages[index % fallbackImages.length];

  return `
    <a class="project-board-card project-board-card--placeholder reveal is-visible" href="/projecten/${encodeURIComponent(item.slug)}" data-placeholder-index="${index + 1}">
      <div class="project-board-card__media project-board-card__media--placeholder" aria-hidden="true">
        <img src="${escapeHtml(image)}" alt="" />
        <span>${escapeHtml(item.mark)}</span>
      </div>
      <div class="project-board-card__body">
        <h3>${escapeHtml(item.title)}</h3>
        <span class="project-board-card__cta">
          <span>Lees meer</span>
          <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M5 12h13m-5-5 5 5-5 5" /></svg>
        </span>
      </div>
    </a>
  `;
}

function splitListLine(line) {
  const parts = String(line || "").split(/\s*[,|]\s*/);
  const first = parts.shift() || "";
  return [first.trim(), parts.join(", ").trim()];
}

function normalizeClientParagraphs(input) {
  if (Array.isArray(input)) {
    return input.map((item) => String(item).trim()).filter(Boolean);
  }

  return String(input || "")
    .split(/\n\s*\n/g)
    .map((item) => item.trim())
    .filter(Boolean);
}

function escapeAttribute(value) {
  return escapeHtml(value).replace(/`/g, "&#96;");
}

function isBuilderEditor() {
  return Boolean(builderPreview);
}

function renderProjectBoard() {
  if (!projectBoardRoot) {
    return false;
  }

  projectBoardRoot.innerHTML = projectBoardSections
    .map((section) => {
      return `
        <section class="project-board-row reveal is-visible" aria-labelledby="project-board-${section.key}">
          <h2 id="project-board-${section.key}" class="project-board-row__label">${section.label}</h2>
          <div class="project-board-carousel" data-project-carousel>
            <button
              class="project-board-arrow project-board-arrow--prev"
              type="button"
              aria-label="Vorige projecten in ${section.label}"
              data-project-carousel-prev
            >
              <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M15 6 9 12l6 6" /></svg>
            </button>
            <div class="project-board-row__grid" data-project-carousel-track>
              ${section.placeholders.map(renderProjectBoardPlaceholder).join("")}
            </div>
            <button
              class="project-board-arrow project-board-arrow--next"
              type="button"
              aria-label="Volgende projecten in ${section.label}"
              data-project-carousel-next
            >
              <svg aria-hidden="true" viewBox="0 0 24 24"><path d="m9 6 6 6-6 6" /></svg>
            </button>
          </div>
        </section>
      `;
    })
    .join("");

  window.requestAnimationFrame(updateProjectBoardCarousels);
  return true;
}

function updateProjectCarouselButtons(carousel) {
  const track = carousel?.querySelector("[data-project-carousel-track]");
  const prevButton = carousel?.querySelector("[data-project-carousel-prev]");
  const nextButton = carousel?.querySelector("[data-project-carousel-next]");

  if (!track || !prevButton || !nextButton) {
    return;
  }

  const canScroll = track.scrollWidth - track.clientWidth > 2;
  prevButton.disabled = !canScroll;
  nextButton.disabled = !canScroll;
  carousel.classList.toggle("has-overflow", canScroll);
}

function updateProjectBoardCarousels() {
  if (!projectBoardRoot) {
    return;
  }

  projectBoardRoot.querySelectorAll("[data-project-carousel]").forEach(updateProjectCarouselButtons);
}

function moveProjectCarousel(button) {
  const carousel = button.closest("[data-project-carousel]");
  const track = carousel?.querySelector("[data-project-carousel-track]");

  if (!track || button.disabled) {
    return;
  }

  const direction = button.matches("[data-project-carousel-next]") ? 1 : -1;
  const card = track.querySelector(".project-board-card");
  const cardWidth = card?.getBoundingClientRect().width || track.clientWidth;
  const maxScroll = Math.max(0, track.scrollWidth - track.clientWidth);
  const isAtStart = track.scrollLeft <= 2;
  const isAtEnd = track.scrollLeft >= maxScroll - 2;
  let target = track.scrollLeft + direction * cardWidth;

  if (direction > 0 && isAtEnd) {
    target = 0;
  } else if (direction < 0 && isAtStart) {
    target = maxScroll;
  }

  track.scrollTo({
    left: Math.max(0, Math.min(maxScroll, target)),
    behavior: "smooth",
  });
}

function initProjectBoardCarouselControls() {
  if (!projectBoardRoot) {
    return;
  }

  projectBoardRoot.addEventListener("click", (event) => {
    const button = event.target.closest("[data-project-carousel-prev], [data-project-carousel-next]");

    if (button) {
      moveProjectCarousel(button);
    }
  });

  projectBoardRoot.addEventListener(
    "scroll",
    (event) => {
      if (event.target.matches("[data-project-carousel-track]")) {
        updateProjectCarouselButtons(event.target.closest("[data-project-carousel]"));
      }
    },
    true,
  );

  window.addEventListener("resize", updateProjectBoardCarousels);
}

async function fetchProjects() {
  const response = await fetch("/api/projects");

  if (response.ok) {
    return response.json();
  }

  const fallbackResponse = await fetch("/data/projects.json");

  if (!fallbackResponse.ok) {
    throw new Error("Projecten konden niet worden geladen.");
  }

  return fallbackResponse.json();
}

async function fetchProject(slug) {
  const response = await fetch(`/api/projects/${encodeURIComponent(slug)}`);

  if (response.ok) {
    return response.json();
  }

  const projects = await fetchProjects();
  const project = projects.find((item) => item.slug === slug);

  if (!project) {
    throw new Error("Project niet gevonden.");
  }

  return project;
}

function renderProjectFeed(projects) {
  if (renderProjectBoard(projects)) {
    return;
  }

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
            <span class="home-project-chip">${escapeHtml(projectCategoryLabel(project))}</span>
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

function renderStaticProjectCta(value) {
  const text = String(value || "");
  const questionIndex = text.indexOf("?");

  if (questionIndex === -1) {
    return escapeHtml(text);
  }

  return `<strong>${escapeHtml(text.slice(0, questionIndex + 1))}</strong>${escapeHtml(text.slice(questionIndex + 1))}`;
}

function renderStaticProjectDetail(project) {
  if (!projectDetailRoot) {
    return;
  }

  document.body.classList.add("has-project-static-detail");
  document.title = `Blauwe Bagger | ${project.crumb}`;

  const titleLines = project.titleLines
    .map((line, index) => {
      const style = index > 0 ? ` style="font-size:24px; margin-top:4px;"` : "";
      return `<div class="detail-title"${style}>${line}</div>`;
    })
    .join("");

  const body = project.body
    .map((paragraph) => `<p class="body-text">${escapeHtml(paragraph)}</p>`)
    .join("");

  const stats = project.stats
    .map(
      (stat) => `
        <div class="stat-block">
          <span class="stat-number">${stat.number}</span>
          <div class="stat-label">${escapeHtml(stat.label)}</div>
        </div>
      `,
    )
    .join("");

  const steps = (project.steps || [])
    .map(
      (step, index) => `
        <div class="step">
          <div class="step-num">${index + 1}</div>
          <div class="step-content">
            <div class="step-title">${escapeHtml(step.title)}</div>
            <div class="step-desc">${escapeHtml(step.desc)}</div>
          </div>
        </div>
      `,
    )
    .join("");

  const highlights = (project.highlights || [])
    .map(
      ([label, value]) => `
        <div class="highlight-item">
          <span class="highlight-label">${escapeHtml(label)}</span>
          <span class="highlight-dash">-</span>
          <span>${escapeHtml(value)}</span>
        </div>
      `,
    )
    .join("");

  projectDetailRoot.innerHTML = `
    <div class="project-static-page">
      <div class="breadcrumb">
        <span><a href="/projecten">Projecten</a></span>
        <span>&rsaquo;</span>
        <span>${escapeHtml(project.crumb)}</span>
      </div>

      <div class="detail-hero">
        <div class="tag-pill">${escapeHtml(project.tag)}</div>
        ${titleLines}
        <div class="detail-subtitle">${escapeHtml(project.subtitle)}</div>
      </div>

      <div class="detail-section">
        ${body}
      </div>

      <div class="stats-row">
        ${stats}
      </div>

      <div class="detail-section alt">
        <div class="section-title">${escapeHtml(project.stepsTitle)}</div>
        <div class="step-list">
          ${steps}
        </div>
      </div>

      ${
        highlights
          ? `
            <div class="detail-section">
              <div class="section-title">${escapeHtml(project.highlightsTitle)}</div>
              <div class="highlight-list">
                ${highlights}
              </div>
            </div>
          `
          : ""
      }

      <div class="detail-cta">
        <p class="cta-text">${renderStaticProjectCta(project.cta)}</p>
        <a class="outline-btn" href="/contact">Neem contact op &rarr;</a>
      </div>

      <footer>
        <div class="brand">Blauwe Bagger - Van Bagger tot Grondstof</div>
        <div class="footer-links">
          <a href="/projecten">&larr; Alle projecten</a>
          <a href="/contact">Contact</a>
        </div>
      </footer>
    </div>
  `;
}

const projectBlockTypes = {
  hero: {
    label: "Hero met beeld",
    fields: [
      ["overline", "Bovenregel", "input"],
      ["title", "Titel", "input"],
      ["emphasis", "Blauw/cursief woord", "input"],
      ["subtitle", "Intro tekst", "textarea"],
      ["image", "Achtergrondbeeld", "image"],
      ["align", "Uitlijning", "select", ["Links", "Midden"]],
    ],
  },
  meta: {
    label: "Projectgegevens",
    fields: [
      ["location", "Locatie", "input"],
      ["period", "Periode", "input"],
      ["volume", "Volume", "input"],
      ["client", "Opdrachtgever", "input"],
      ["status", "Status", "input"],
    ],
  },
  facts: {
    label: "Intro en kernpunten",
    fields: [
      ["eyebrow", "Label", "input"],
      ["body", "Tekst", "textarea"],
      ["facts", "Kernpunten, een per regel: label, waarde", "textarea"],
    ],
  },
  metrics: {
    label: "Resultatenrij",
    fields: [["items", "Resultaten, een per regel: getal, label", "textarea"]],
  },
  text: {
    label: "Tekstblok",
    fields: [
      ["eyebrow", "Label", "input"],
      ["title", "Titel", "input"],
      ["body", "Tekst", "textarea"],
      ["variant", "Stijl", "select", ["Wit", "Blauw vlak"]],
    ],
  },
  process: {
    label: "Stappenplan",
    fields: [
      ["title", "Titel", "input"],
      ["steps", "Stappen, een per regel: titel, tekst", "textarea"],
    ],
  },
  gallery: {
    label: "Fotogalerij",
    fields: [
      ["title", "Titel", "input"],
      ["images", "Afbeeldingen", "gallery"],
    ],
  },
  cta: {
    label: "Contactblok",
    fields: [
      ["text", "Tekst", "textarea"],
      ["buttonLabel", "Knoptekst", "input"],
      ["buttonHref", "Link", "input"],
    ],
  },
};

function createProjectBlock(type, project = {}) {
  const id = `block_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const body = Array.isArray(project.body) ? project.body.join("\n\n") : String(project.body || "");
  const highlights = Array.isArray(project.highlights)
    ? project.highlights.join("\n")
    : String(project.highlights || "");
  const title = project.title || "Nieuw project";
  const heroImage = project.coverImage || "assets/media/installatie.jpeg";

  const defaults = {
    hero: {
      overline: `${projectCategoryLabel(project)}${project.date ? `, ${formatDate(project.date)}` : ""}`.trim(),
      title,
      emphasis: "",
      subtitle: project.excerpt || "",
      image: heroImage,
      align: "Links",
    },
    meta: {
      location: project.location || "Kildepot, Dordrecht",
      period: project.date ? formatDate(project.date).replace(" ", "\n") : "Mei\n2026",
      volume: "10 m3",
      client: "Provincie Zuid-Holland",
      status: project.status || "Afgerond",
    },
    facts: {
      eyebrow: "Over dit project",
      body: body || project.excerpt || "",
      facts: [
        `Locatie, ${project.location || "Nederland"}`,
        `Periode, ${project.date ? formatDate(project.date) : "Nog te bepalen"}`,
        `Status, ${project.status || "Actief"}`,
      ].join("\n"),
    },
    metrics: {
      items: highlights
        ? highlights
            .split(/\r?\n/)
            .filter(Boolean)
            .slice(0, 3)
            .map((item) => `${item}, Kernpunt`)
            .join("\n")
        : "BlueSand, Secundaire zandfractie\nBlueFiller, Fijne kleifractie\nCO2 omlaag, Minder primaire winning",
    },
    text: {
      eyebrow: "Verdieping",
      title: "Wat hebben we gedaan?",
      body: body || project.excerpt || "",
      variant: "Wit",
    },
    process: {
      title: "Aanpak",
      steps:
        "Analyse, We brengen de baggerstroom en randvoorwaarden in kaart.\nScheiding, De BlueBox scheidt materiaalstromen op locatie.\nToepassing, Bruikbare fracties worden voorbereid voor hergebruik.",
    },
    gallery: {
      title: "Foto's van het project",
      images: [project.coverImage || "assets/media/bluebox-tablet.png", "assets/media/installatie.jpeg", "assets/media/baggeren.jpeg"]
        .filter(Boolean)
        .map((image) => `${image}, ${title}`)
        .join("\n"),
    },
    cta: {
      text: "Ben je een waterschap, gemeente of partner? Blauwe Bagger denkt mee over de circulaire route voor jouw baggerstroom.",
      buttonLabel: "Neem contact op",
      buttonHref: "/contact",
    },
  };

  return {
    id,
    type,
    fields: defaults[type] || {},
  };
}

function defaultProjectBlocks(project = {}) {
  return ["hero", "meta", "facts", "metrics", "gallery", "cta"].map((type) => createProjectBlock(type, project));
}

function normalizeAdminBlocks(blocks, project = {}) {
  if (Array.isArray(blocks) && blocks.length) {
    return blocks
      .filter((block) => projectBlockTypes[block.type])
      .map((block) => ({
        id: block.id || `block_${Math.random().toString(36).slice(2, 9)}`,
        type: block.type,
        fields: { ...(block.fields || {}) },
      }));
  }

  return defaultProjectBlocks(project);
}

function linesToPairs(value) {
  return String(value || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map(splitListLine)
    .filter(([label, body]) => label || body);
}

function blockTitle(block) {
  return projectBlockTypes[block.type]?.label || "Blok";
}

function renderBlockField(block, field) {
  const [name, label, kind, options = []] = field;
  const value = block.fields?.[name] || "";
  const fieldId = `${block.id}-${name}`;

  if (kind === "image") {
    const image = normalizeAssetUrl(value);

    return `
      <div class="builder-upload-field">
        <span class="builder-upload-label">${escapeHtml(label)}</span>
        <input id="${escapeAttribute(fieldId)}" type="hidden" data-block-field="${escapeAttribute(name)}" value="${escapeAttribute(value)}" />
        <label class="builder-upload-control">
          <span>${image ? "Afbeelding vervangen" : "Afbeelding uploaden"}</span>
          <small>${image ? "Afbeelding staat klaar" : "Sleep of kies een bestand"}</small>
          <input type="file" accept="image/*" data-image-upload data-target-field="${escapeAttribute(name)}" />
        </label>
        ${image ? `<img class="builder-upload-preview" src="${escapeAttribute(image)}" alt="" />` : ""}
      </div>
    `;
  }

  if (kind === "gallery") {
    return `
      <label for="${escapeAttribute(fieldId)}">
        ${escapeHtml(label)}
        <textarea id="${escapeAttribute(fieldId)}" data-block-field="${escapeAttribute(name)}" rows="5">${escapeHtml(value)}</textarea>
      </label>
      <label class="builder-upload-control">
        <span>Afbeeldingen uploaden</span>
        <input type="file" accept="image/*" multiple data-gallery-upload data-target-field="${escapeAttribute(name)}" />
      </label>
    `;
  }

  if (kind === "textarea") {
    return `
      <label for="${escapeAttribute(fieldId)}">
        ${escapeHtml(label)}
        <textarea id="${escapeAttribute(fieldId)}" data-block-field="${escapeAttribute(name)}" rows="4">${escapeHtml(value)}</textarea>
      </label>
    `;
  }

  if (kind === "select") {
    return `
      <label for="${escapeAttribute(fieldId)}">
        ${escapeHtml(label)}
        <select id="${escapeAttribute(fieldId)}" data-block-field="${escapeAttribute(name)}">
          ${options
            .map(
              (option) =>
                `<option value="${escapeAttribute(option)}" ${option === value ? "selected" : ""}>${escapeHtml(option)}</option>`,
            )
            .join("")}
        </select>
      </label>
    `;
  }

  return `
    <label for="${escapeAttribute(fieldId)}">
      ${escapeHtml(label)}
      <input id="${escapeAttribute(fieldId)}" data-block-field="${escapeAttribute(name)}" value="${escapeAttribute(value)}" />
    </label>
  `;
}

function renderBlockEditor() {
  if (!blockList) {
    return;
  }

  if (!adminBlocks.length) {
    blockList.innerHTML = "";
    if (blockInspector) {
      blockInspector.innerHTML = "";
    }
    renderBuilderPreview();
    return;
  }

  if (!activeBlockId || !adminBlocks.some((block) => block.id === activeBlockId)) {
    activeBlockId = adminBlocks[0].id;
  }

  blockList.innerHTML = adminBlocks
    .map((block, index) => {
      return `
        <button class="admin-block-item ${block.id === activeBlockId ? "is-active" : ""}" type="button" data-block-id="${escapeAttribute(
          block.id,
        )}" draggable="true">
          <span class="admin-block-item__index">${String(index + 1).padStart(2, "0")}</span>
          <strong>${escapeHtml(blockTitle(block))}</strong>
          <span class="admin-block-item__drag" aria-hidden="true">::</span>
        </button>
      `;
    })
    .join("");

  renderBlockInspector();
  renderBuilderPreview();
}

function previewEditable(value, field, tagName = "span", className = "") {
  if (!isBuilderEditor()) {
    return `<${tagName}${className ? ` class="${className}"` : ""}>${escapeHtml(value)}</${tagName}>`;
  }

  return `<${tagName}${className ? ` class="${className}"` : ""} contenteditable="true" spellcheck="false" data-preview-field="${escapeAttribute(
    field,
  )}">${escapeHtml(value)}</${tagName}>`;
}

function previewListEditable(value, field, index, part, tagName = "span", className = "") {
  if (!isBuilderEditor()) {
    return `<${tagName}${className ? ` class="${className}"` : ""}>${escapeHtml(value)}</${tagName}>`;
  }

  return `<${tagName}${className ? ` class="${className}"` : ""} contenteditable="true" spellcheck="false" data-preview-list-field="${escapeAttribute(
    field,
  )}" data-preview-list-index="${escapeAttribute(index)}" data-preview-list-part="${escapeAttribute(part)}">${escapeHtml(
    value,
  )}</${tagName}>`;
}

function wrapPreviewBlock(block, markup) {
  if (!isBuilderEditor()) {
    return markup;
  }

  const active = block.id === activeBlockId ? " is-selected" : "";

  return `
    <div class="builder-preview-block${active}" data-preview-block-id="${escapeAttribute(block.id)}" draggable="true">
      <div class="builder-preview-toolbar" contenteditable="false">
        <button type="button" data-preview-move="-1">Omhoog</button>
        <button type="button" data-preview-move="1">Omlaag</button>
        <button type="button" data-preview-remove>Verwijder</button>
      </div>
      ${markup}
    </div>
  `;
}

function setAdminBlocks(blocks) {
  adminBlocks = normalizeAdminBlocks(blocks);
  activeBlockId = adminBlocks[0]?.id || "";
  renderBlockEditor();
}

function collectAdminBlocks() {
  if (!blockList) {
    return [];
  }

  [blockList, blockInspector].filter(Boolean).forEach((root) => {
    const blockElement = root.closest?.("[data-block-id]");
    const scopedBlockId = blockElement?.getAttribute("data-block-id") || activeBlockId;
    const block = adminBlocks.find((item) => item.id === scopedBlockId);

    if (!block) {
      return;
    }

    root.querySelectorAll("[data-block-field]").forEach((field) => {
      block.fields[field.getAttribute("data-block-field")] = field.value;
    });
  });

  return adminBlocks.map((block) => ({
    id: block.id,
    type: block.type,
    fields: { ...block.fields },
  }));
}

function currentAdminProjectFromForm() {
  if (!adminForm) {
    return {};
  }

  const formData = new FormData(adminForm);

  return {
    title: formData.get("title") || "Nieuw project",
    slug: formData.get("slug") || "",
    date: formData.get("date") || new Date().toISOString().slice(0, 10),
    category: projectCategoryLabel(formData.get("category")),
    location: formData.get("location") || "Nederland",
    status: formData.get("status") || "Actief",
    coverImage: formData.get("coverImage") || "",
    excerpt: formData.get("excerpt") || "",
    body: normalizeClientParagraphs(formData.get("body")),
    highlights: String(formData.get("highlights") || "")
      .split(/\r?\n/)
      .map((item) => item.trim())
      .filter(Boolean),
    featured: formData.get("featured") === "on",
    blocks: collectAdminBlocks(),
  };
}

function renderBuilderPreview() {
  if (!builderPreview) {
    return;
  }

  const project = currentAdminProjectFromForm();

  builderPreview.innerHTML = `
    <div class="project-builder-page">
      <nav class="project-builder-breadcrumb" aria-label="Project breadcrumb">
        <a href="/projecten">Alle projecten</a>
        <span>${escapeHtml(project.title || "Nieuw project")}</span>
      </nav>
      ${renderProjectBlocks(project)}
    </div>
  `;
}

function renderBlockInspector() {
  if (!blockInspector) {
    return;
  }

  const block = adminBlocks.find((item) => item.id === activeBlockId);

  if (!block) {
    blockInspector.innerHTML = "";
    return;
  }

  const definition = projectBlockTypes[block.type];
  blockInspector.innerHTML = `
    <div class="builder-inspector__head">
      <strong>${escapeHtml(blockTitle(block))}</strong>
      <button class="button-ghost button-danger" type="button" data-block-remove-active>Verwijder</button>
    </div>
    <div class="admin-block-fields">
      ${definition.fields.map((field) => renderBlockField(block, field)).join("")}
    </div>
  `;
}

function renderProjectSwitch(projects) {
  if (!projectSwitch) {
    return;
  }

  const currentSlug = adminForm?.dataset.editingSlug || "";
  projectSwitch.innerHTML = `
    <option value="">Nieuw project</option>
    ${projects
      .map(
        (project) =>
          `<option value="${escapeAttribute(project.slug)}" ${project.slug === currentSlug ? "selected" : ""}>${escapeHtml(
            project.title,
          )}</option>`,
      )
      .join("")}
  `;
}

function updateInspectorField(fieldName, value) {
  if (!blockInspector) {
    return;
  }

  const field = blockInspector.querySelector(`[data-block-field="${CSS.escape(fieldName)}"]`);

  if (field && field.value !== value) {
    field.value = value;
  }
}

function updateBlockListField(block, fieldName, index, part, value) {
  const pairs = linesToPairs(block.fields?.[fieldName]);
  const lineIndex = Number(index);

  if (!Number.isFinite(lineIndex) || lineIndex < 0) {
    return;
  }

  while (pairs.length <= lineIndex) {
    pairs.push(["", ""]);
  }

  pairs[lineIndex][part === "label" ? 0 : 1] = value;
  block.fields[fieldName] = pairs.map(([label, body]) => `${label}, ${body}`.trim()).join("\n");
  updateInspectorField(fieldName, block.fields[fieldName]);
}

function moveAdminBlock(id, direction) {
  collectAdminBlocks();
  const index = adminBlocks.findIndex((block) => block.id === id);
  const nextIndex = index + direction;

  if (index < 0 || nextIndex < 0 || nextIndex >= adminBlocks.length) {
    return;
  }

  const [block] = adminBlocks.splice(index, 1);
  adminBlocks.splice(nextIndex, 0, block);
  renderBlockEditor();
}

function moveAdminBlockTo(id, targetIndex) {
  collectAdminBlocks();
  const fromIndex = adminBlocks.findIndex((block) => block.id === id);

  if (fromIndex < 0) {
    return;
  }

  const [block] = adminBlocks.splice(fromIndex, 1);
  const nextIndex = Math.max(0, Math.min(targetIndex > fromIndex ? targetIndex - 1 : targetIndex, adminBlocks.length));
  adminBlocks.splice(nextIndex, 0, block);
  activeBlockId = block.id;
  renderBlockEditor();
}

function insertAdminBlock(type, targetIndex = adminBlocks.length) {
  if (!type || !projectBlockTypes[type]) {
    return;
  }

  collectAdminBlocks();
  const block = createProjectBlock(type, currentAdminProjectFromForm());
  const nextIndex = Math.max(0, Math.min(targetIndex, adminBlocks.length));
  adminBlocks.splice(nextIndex, 0, block);
  activeBlockId = block.id;
  renderBlockEditor();
}

function addAdminBlock(type) {
  insertAdminBlock(type);
}

function clearBuilderDropState() {
  draggedBlockId = "";
  draggedBlockType = "";
  [blockList, builderPreview, blockPalette].filter(Boolean).forEach((root) => {
    root.querySelectorAll(".is-dragging, .is-drop-target, .is-drop-before, .is-drop-after").forEach((element) => {
      element.classList.remove("is-dragging", "is-drop-target", "is-drop-before", "is-drop-after");
    });
  });
}

function previewDropIndex(event) {
  const blockElement = event.target.closest("[data-preview-block-id]");

  if (!blockElement) {
    return adminBlocks.length;
  }

  const blockId = blockElement.getAttribute("data-preview-block-id");
  const index = adminBlocks.findIndex((block) => block.id === blockId);
  const rect = blockElement.getBoundingClientRect();
  const isAfter = event.clientY > rect.top + rect.height / 2;

  return Math.max(0, index + (isAfter ? 1 : 0));
}

function markPreviewDropTarget(event) {
  builderPreview?.querySelectorAll(".is-drop-target, .is-drop-before, .is-drop-after").forEach((element) => {
    element.classList.remove("is-drop-target", "is-drop-before", "is-drop-after");
  });

  const blockElement = event.target.closest("[data-preview-block-id]");

  if (!blockElement) {
    builderPreview?.classList.add("is-drop-after");
    return;
  }

  const rect = blockElement.getBoundingClientRect();
  blockElement.classList.add("is-drop-target", event.clientY > rect.top + rect.height / 2 ? "is-drop-after" : "is-drop-before");
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Afbeelding kon niet worden gelezen."));
    reader.readAsDataURL(file);
  });
}

async function uploadImageFile(file) {
  const data = await fileToDataUrl(file);
  const response = await fetch("/api/uploads", {
    method: "POST",
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      filename: file.name,
      type: file.type,
      data,
    }),
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.error || "Upload mislukt.");
  }

  return payload.url;
}

function setUploadingStatus(message, isError = false) {
  setAdminStatus(message, isError);
}

function renderProjectBlockHero(block, project) {
  const fields = block.fields || {};
  const image = normalizeAssetUrl(fields.image || project.coverImage || "assets/media/installatie.jpeg");
  const title = fields.title || project.title;
  const emphasis = fields.emphasis ? ` <em>${escapeHtml(fields.emphasis)}</em>` : "";
  const centered = fields.align === "Midden" ? " project-builder-hero--center" : "";

  const markup = `
    <section class="project-builder-hero${centered}" ${image ? `style="--project-hero-image: url('${escapeAttribute(image)}')"` : ""}>
      <div class="project-builder-hero__copy">
        ${previewEditable(fields.overline || projectCategoryLabel(project), "overline", "p")}
        <h1>${previewEditable(title, "title", "span", "project-builder-hero__title-text")}${emphasis}</h1>
        ${previewEditable(fields.subtitle || project.excerpt || "", "subtitle", "span", "project-builder-hero__subtitle")}
      </div>
    </section>
  `;

  return wrapPreviewBlock(block, markup);
}

function renderProjectBlockFacts(block) {
  const fields = block.fields || {};
  const facts = linesToPairs(fields.facts)
    .map(
      ([label, value], index) => `
        <div>
          <dt>${previewListEditable(label, "facts", index, "label")}</dt>
          <dd>${previewListEditable(value, "facts", index, "value")}</dd>
        </div>
      `,
    )
    .join("");
  const paragraphs = String(fields.body || "")
    .split(/\n\s*\n/)
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => `<p>${escapeHtml(item)}</p>`)
    .join("");

  const markup = `
    <section class="project-builder-section project-builder-facts">
      <div>
        ${previewEditable(fields.eyebrow || "Over dit project", "eyebrow", "p", "project-builder-kicker")}
        <div class="project-builder-richtext" ${
          isBuilderEditor() ? 'contenteditable="true" spellcheck="false" data-preview-field="body"' : ""
        }>${paragraphs}</div>
      </div>
      <dl>${facts}</dl>
    </section>
  `;

  return wrapPreviewBlock(block, markup);
}

function renderProjectBlockMeta(block) {
  const fields = block.fields || {};
  const items = [
    ["Locatie", "location", fields.location || ""],
    ["Periode", "period", fields.period || ""],
    ["Volume", "volume", fields.volume || ""],
    ["Opdrachtgever", "client", fields.client || ""],
    ["Status", "status", fields.status || ""],
  ];

  const markup = `
    <section class="project-builder-meta">
      ${items
        .map(([label, field, value]) => {
          const isStatus = label === "Status";

          return `
            <div class="${isStatus ? "project-builder-meta__status" : ""}">
              <span>${escapeHtml(label)}</span>
              ${previewEditable(value, field, isStatus ? "strong" : "p")}
            </div>
          `;
        })
        .join("")}
    </section>
  `;

  return wrapPreviewBlock(block, markup);
}

function renderProjectBlockMetrics(block) {
  const items = linesToPairs(block.fields?.items)
    .slice(0, 4)
    .map(
      ([number, label], index) => `
        <div class="project-builder-metric">
          ${previewListEditable(number, "items", index, "label", "strong")}
          ${previewListEditable(label, "items", index, "value", "span")}
        </div>
      `,
    )
    .join("");

  return wrapPreviewBlock(block, `<section class="project-builder-metrics">${items}</section>`);
}

function renderProjectBlockText(block) {
  const fields = block.fields || {};
  const dark = fields.variant === "Blauw vlak" ? " project-builder-section--dark" : "";
  const paragraphs = String(fields.body || "")
    .split(/\n\s*\n/)
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => `<p>${escapeHtml(item)}</p>`)
    .join("");

  const markup = `
    <section class="project-builder-section project-builder-text${dark}">
      ${previewEditable(fields.eyebrow || "Verdieping", "eyebrow", "p", "project-builder-kicker")}
      ${previewEditable(fields.title || "", "title", "h2")}
      <div class="project-builder-richtext" ${
        isBuilderEditor() ? 'contenteditable="true" spellcheck="false" data-preview-field="body"' : ""
      }>${paragraphs}</div>
    </section>
  `;

  return wrapPreviewBlock(block, markup);
}

function renderProjectBlockProcess(block) {
  const steps = linesToPairs(block.fields?.steps)
    .map(
      ([title, text], index) => `
        <li>
          <span>${String(index + 1).padStart(2, "0")}</span>
          <div>
            ${previewListEditable(title, "steps", index, "label", "strong")}
            ${previewListEditable(text, "steps", index, "value", "p")}
          </div>
        </li>
      `,
    )
    .join("");

  const markup = `
    <section class="project-builder-section project-builder-process">
      ${previewEditable(block.fields?.title || "Aanpak", "title", "h2")}
      <ol>${steps}</ol>
    </section>
  `;

  return wrapPreviewBlock(block, markup);
}

function renderProjectBlockGallery(block) {
  const images = linesToPairs(block.fields?.images)
    .map(([image, alt]) => {
      const src = normalizeAssetUrl(image);
      return src
        ? `<figure><img src="${escapeAttribute(src)}" alt="${escapeAttribute(alt || "Projectbeeld")}" /></figure>`
        : "";
    })
    .join("");

  const markup = `
    <section class="project-builder-section project-builder-gallery">
      ${previewEditable(block.fields?.title || "Foto's", "title", "p", "project-builder-kicker")}
      <div>${images}</div>
    </section>
  `;

  return wrapPreviewBlock(block, markup);
}

function renderProjectBlockCta(block) {
  const fields = block.fields || {};
  const markup = `
    <section class="project-builder-cta">
      ${previewEditable(fields.text || "", "text", "p")}
      <a class="outline-btn" href="${escapeAttribute(fields.buttonHref || "/contact")}">${previewEditable(
        fields.buttonLabel || "Neem contact op",
        "buttonLabel",
      )} &rarr;</a>
    </section>
  `;

  return wrapPreviewBlock(block, markup);
}

function renderProjectBlocks(project) {
  const blocks = normalizeAdminBlocks(project.blocks, project);
  return blocks
    .map((block) => {
      if (block.type === "hero") return renderProjectBlockHero(block, project);
      if (block.type === "meta") return renderProjectBlockMeta(block);
      if (block.type === "facts") return renderProjectBlockFacts(block);
      if (block.type === "metrics") return renderProjectBlockMetrics(block);
      if (block.type === "text") return renderProjectBlockText(block);
      if (block.type === "process") return renderProjectBlockProcess(block);
      if (block.type === "gallery") return renderProjectBlockGallery(block);
      if (block.type === "cta") return renderProjectBlockCta(block);
      return "";
    })
    .join("");
}

function renderProjectDetail(project) {
  if (!projectDetailRoot) {
    return;
  }

  document.body.classList.remove("has-project-static-detail");
  const hasBlocks = Array.isArray(project.blocks) && project.blocks.length;

  const paragraphs = (project.body || [])
    .map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`)
    .join("");
  const highlights = (project.highlights || [])
    .map((item) => `<li>${escapeHtml(item)}</li>`)
    .join("");

  document.title = `Blauwe Bagger | ${project.title}`;

  if (hasBlocks) {
    projectDetailRoot.innerHTML = `
      <div class="project-builder-page">
        <nav class="project-builder-breadcrumb" aria-label="Project breadcrumb">
          <a href="/projecten">Alle projecten</a>
          <span>${escapeHtml(project.title)}</span>
        </nav>
        ${renderProjectBlocks(project)}
      </div>
    `;
    return;
  }

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
    category: projectCategoryLabel(project),
    location: project.location || "Nederland",
    status: project.status || "Actief",
    coverImage: project.coverImage || "",
    excerpt: project.excerpt || "",
    body: Array.isArray(project.body) ? project.body.join("\n\n") : "",
    highlights: Array.isArray(project.highlights) ? project.highlights.join("\n") : "",
    featured: Boolean(project.featured),
    blocks: normalizeAdminBlocks(project.blocks, project),
  };
}

function fillAdminForm(project, updateUrl = true) {
  if (!adminForm) {
    return;
  }

  const values = projectToFormState(project);
  adminForm.dataset.editingSlug = project.slug;
  adminForm.dataset.slugManual = "true";

  Object.entries(values).forEach(([key, value]) => {
    if (key === "blocks") {
      return;
    }

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

  setAdminBlocks(values.blocks);
  renderBuilderPreview();

  setAdminStatus(`Je bewerkt nu "${project.title}".`);
  showProjectEditor(updateUrl);
}

function showProjectDashboard(updateUrl = true) {
  adminDashboard?.removeAttribute("hidden");
  builderEditorRegions.forEach((region) => {
    region.setAttribute("hidden", "");
  });

  if (updateUrl) {
    window.history.pushState({}, "", "/projecten-beheer");
  }
}

function showProjectEditor(updateUrl = true) {
  adminDashboard?.setAttribute("hidden", "");
  builderEditorRegions.forEach((region) => {
    region.removeAttribute("hidden");
  });

  if (updateUrl) {
    const slug = adminForm?.dataset.editingSlug || "";
    window.history.pushState({}, "", slug ? `/projecten-beheer?edit=${encodeURIComponent(slug)}` : "/projecten-beheer?new=1");
  }
}

function resetAdminForm(openEditor = false, updateUrl = true) {
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
    categoryField.value = defaultProjectCategory;
  }

  setAdminBlocks(defaultProjectBlocks({}));
  if (projectSwitch) {
    projectSwitch.value = "";
  }
  renderBuilderPreview();

  setAdminStatus("Klaar voor een nieuw project.");

  if (openEditor) {
    showProjectEditor(updateUrl);
  }
}

function renderAdminList(projects) {
  adminProjectsCache = projects;
  renderProjectSwitch(projects);

  if (!adminList) {
    return;
  }

  const newProjectCard = `
    <button class="admin-project-card admin-project-card--new admin-project-card--board" type="button" data-new-project-card>
      <span class="admin-project-card__plus" aria-hidden="true">+</span>
      <strong>New project</strong>
    </button>
  `;

  const renderAdminProjectCard = (project) => {
    const image = normalizeAssetUrl(project.coverImage || projectCoverFallback(project));

    return `
      <article class="admin-project-card admin-project-card--board">
        <div class="admin-project-card__media">
          ${image ? `<img src="${escapeAttribute(image)}" alt="" />` : ""}
        </div>
        <div class="admin-project-card__body">
          <div class="blog-meta">
            <span class="pill">${escapeHtml(projectCategoryLabel(project))}</span>
            <span class="pill">${escapeHtml(project.status)}</span>
          </div>
          <h3>${escapeHtml(project.title)}</h3>
          <p>${escapeHtml(project.excerpt)}</p>
        </div>
        <div class="admin-project-card__actions">
          <button class="admin-project-card__icon" type="button" data-edit-project="${escapeAttribute(project.slug)}" aria-label="${escapeAttribute(
            `${project.title} bewerken`,
          )}" title="Bewerk">
            <svg aria-hidden="true" viewBox="0 0 24 24"><path d="m5 16-.8 3.8L8 19l10.5-10.5-3-3L5 16Z" /><path d="m14.5 6.5 3 3" /></svg>
          </button>
          <a class="admin-project-card__icon" href="/projecten/${encodeURIComponent(project.slug)}" target="_blank" rel="noreferrer" aria-label="${escapeAttribute(
            `${project.title} live bekijken`,
          )}" title="Bekijk live">
            <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M7 17 17 7" /><path d="M9 7h8v8" /></svg>
          </a>
          <button class="admin-project-card__icon admin-project-card__icon--danger" type="button" data-delete-project="${escapeAttribute(
            project.slug,
          )}" aria-label="${escapeAttribute(`${project.title} verwijderen`)}" title="Verwijder">
            <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M5 7h14" /><path d="M10 11v6M14 11v6" /><path d="m9 7 .5-2h5l.5 2" /><path d="M7 7l1 12h8l1-12" /></svg>
          </button>
        </div>
      </article>
    `;
  };

  const rows = projectBoardSections
    .map((section) => {
      const cards = projects.filter((project) => projectBoardSectionFor(project) === section.key);

      return `
        <section class="admin-project-row" aria-labelledby="admin-project-row-${section.key}">
          <h2 id="admin-project-row-${section.key}">${escapeHtml(section.label)}</h2>
          <div class="admin-project-row__grid">
            ${cards.length ? cards.map(renderAdminProjectCard).join("") : `<div class="admin-project-empty">Nog geen projecten in ${escapeHtml(section.label)}.</div>`}
          </div>
        </section>
      `;
    })
    .join("");

  adminList.innerHTML = `
    <section class="admin-project-row admin-project-row--new" aria-label="Nieuw project">
      <div class="admin-project-row__grid admin-project-row__grid--new">${newProjectCard}</div>
    </section>
    ${rows}
  `;
}

async function refreshAdmin() {
  if (!projectAdminRoot) {
    return [];
  }

  try {
    const projects = await fetchProjects();
    renderAdminList(projects);
    return projects;
  } catch (error) {
    adminList.innerHTML = `<div class="empty-state">${escapeHtml(error.message)}</div>`;
    return [];
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
    category: projectCategoryLabel(formData.get("category")),
    location: formData.get("location"),
    status: formData.get("status"),
    coverImage: formData.get("coverImage"),
    excerpt: formData.get("excerpt"),
    body: formData.get("body"),
    highlights: formData.get("highlights"),
    featured: formData.get("featured") === "on",
    blocks: collectAdminBlocks(),
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
    await refreshAdmin();
    fillAdminForm(result);
  } catch (error) {
    setAdminStatus(error.message, true);
  }
}

async function handleAdminListClick(event) {
  const editButton = event.target.closest("[data-edit-project]");
  const deleteButton = event.target.closest("[data-delete-project]");
  const newProjectButton = event.target.closest("[data-new-project-card]");

  if (newProjectButton) {
    resetAdminForm(true);
    return;
  }

  if (editButton) {
    const slug = editButton.getAttribute("data-edit-project");
    const projects = await fetchProjects();
    const project = projects.find((item) => item.slug === slug);

    if (project) {
      fillAdminForm(project);
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

  if (staticProjectPages[slug]) {
    renderStaticProjectDetail(staticProjectPages[slug]);
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

async function initProjectAdmin() {
  if (!projectAdminRoot || !adminForm) {
    return;
  }

  const titleField = adminForm.elements.namedItem("title");
  const slugField = adminForm.elements.namedItem("slug");

  resetAdminForm();
  showProjectDashboard(false);
  const initialProjects = await refreshAdmin();
  const params = new URLSearchParams(window.location.search);
  const editSlug = params.get("edit");

  if (params.has("new")) {
    resetAdminForm(true, false);
  } else if (editSlug) {
    const project = initialProjects.find((item) => item.slug === editSlug);

    if (project) {
      fillAdminForm(project, false);
    }
  }

  adminDashboardOpenButtons.forEach((button) => {
    button.addEventListener("click", () => {
      showProjectDashboard();
    });
  });

  window.addEventListener("popstate", async () => {
    const nextParams = new URLSearchParams(window.location.search);
    const nextEditSlug = nextParams.get("edit");

    if (nextParams.has("new")) {
      resetAdminForm(false, false);
      showProjectEditor(false);
      return;
    }

    if (nextEditSlug) {
      const projects = adminProjectsCache.length ? adminProjectsCache : await refreshAdmin();
      const project = projects.find((item) => item.slug === nextEditSlug);

      if (project) {
        fillAdminForm(project, false);
      }
      return;
    }

    showProjectDashboard(false);
  });

  titleField?.addEventListener("input", () => {
    if (adminForm.dataset.slugManual === "true") {
      renderBuilderPreview();
      return;
    }

    slugField.value = slugifyProject(titleField.value);
    renderBuilderPreview();
  });

  slugField?.addEventListener("input", () => {
    adminForm.dataset.slugManual = slugField.value.trim() ? "true" : "";
    renderBuilderPreview();
  });

  adminForm.addEventListener("input", (event) => {
    if (!event.target.closest("[data-block-inspector]")) {
      renderBuilderPreview();
    }
  });

  adminForm.addEventListener("change", (event) => {
    if (!event.target.closest("[data-block-inspector]")) {
      renderBuilderPreview();
    }
  });

  adminForm.querySelector("[data-project-cover-upload]")?.addEventListener("change", async (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      setUploadingStatus("Afbeelding uploaden...");
      const url = await uploadImageFile(file);
      const coverField = adminForm.elements.namedItem("coverImage");

      if (coverField) {
        coverField.value = url;
      }

      setUploadingStatus("Afbeelding geupload.");
      renderBuilderPreview();
    } catch (error) {
      setUploadingStatus(error.message, true);
    } finally {
      event.target.value = "";
    }
  });

  adminForm.addEventListener("submit", submitAdminForm);
  adminList?.addEventListener("click", async (event) => {
    try {
      await handleAdminListClick(event);
    } catch (error) {
      setAdminStatus(error.message || "Er ging iets mis in projectbeheer.", true);
    }
  });

  adminResetButton?.addEventListener("click", () => {
    resetAdminForm(true);
  });

  projectSwitch?.addEventListener("change", () => {
    const slug = projectSwitch.value;

    if (!slug) {
      resetAdminForm(true);
      return;
    }

    const project = adminProjectsCache.find((item) => item.slug === slug);

    if (project) {
      fillAdminForm(project);
    }
  });

  blockAddSelect?.addEventListener("change", () => {
    addAdminBlock(blockAddSelect.value);
    blockAddSelect.value = "";
  });

  blockPalette?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-add-block]");

    if (button) {
      addAdminBlock(button.getAttribute("data-add-block"));
    }
  });

  blockPalette?.querySelectorAll("[data-add-block]").forEach((button) => {
    button.setAttribute("draggable", "true");
  });

  blockPalette?.addEventListener("dragstart", (event) => {
    const button = event.target.closest("[data-add-block]");

    if (!button) {
      return;
    }

    draggedBlockId = "";
    draggedBlockType = button.getAttribute("data-add-block");
    button.classList.add("is-dragging");
    event.dataTransfer.effectAllowed = "copy";
    event.dataTransfer.setData("text/plain", `block-type:${draggedBlockType}`);
  });

  blockPalette?.addEventListener("dragend", clearBuilderDropState);

  blockInspector?.addEventListener("input", (event) => {
    const field = event.target.closest("[data-block-field]");

    if (!field) {
      return;
    }

    const block = adminBlocks.find((item) => item.id === activeBlockId);

    if (block) {
      block.fields[field.getAttribute("data-block-field")] = field.value;
      renderBuilderPreview();
    }
  });

  blockInspector?.addEventListener("change", async (event) => {
    const imageUpload = event.target.closest("[data-image-upload]");
    const galleryUpload = event.target.closest("[data-gallery-upload]");

    if (!imageUpload && !galleryUpload) {
      return;
    }

    const files = Array.from(event.target.files || []);

    if (!files.length) {
      return;
    }

    const block = adminBlocks.find((item) => item.id === activeBlockId);
    const fieldName = event.target.getAttribute("data-target-field");

    if (!block || !fieldName) {
      return;
    }

    try {
      setUploadingStatus(files.length === 1 ? "Afbeelding uploaden..." : "Afbeeldingen uploaden...");
      const urls = [];

      for (const file of files) {
        urls.push(await uploadImageFile(file));
      }

      if (imageUpload) {
        block.fields[fieldName] = urls[0];
      }

      if (galleryUpload) {
        const currentValue = String(block.fields[fieldName] || "").trim();
        const additions = urls.map((url, index) => `${url}, ${files[index]?.name || "Afbeelding"}`).join("\n");
        block.fields[fieldName] = [currentValue, additions].filter(Boolean).join("\n");
      }

      setUploadingStatus(files.length === 1 ? "Afbeelding geupload." : "Afbeeldingen geupload.");
      renderBlockInspector();
      renderBuilderPreview();
    } catch (error) {
      setUploadingStatus(error.message, true);
    } finally {
      event.target.value = "";
    }
  });

  blockList?.addEventListener("click", (event) => {
    const blockElement = event.target.closest("[data-block-id]");

    if (!blockElement) {
      return;
    }

    const blockId = blockElement.getAttribute("data-block-id");
    activeBlockId = blockId;
    renderBlockEditor();
  });

  blockInspector?.addEventListener("click", (event) => {
    if (!event.target.closest("[data-block-remove-active]")) {
      return;
    }

    collectAdminBlocks();
    adminBlocks = adminBlocks.filter((block) => block.id !== activeBlockId);
    activeBlockId = adminBlocks[0]?.id || "";
    renderBlockEditor();
  });

  builderPreview?.addEventListener("click", (event) => {
    if (event.target.closest("a")) {
      event.preventDefault();
    }

    const toolbarButton = event.target.closest("[data-preview-move], [data-preview-remove]");
    const blockElement = event.target.closest("[data-preview-block-id]");

    if (!blockElement) {
      return;
    }

    const blockId = blockElement.getAttribute("data-preview-block-id");

    if (toolbarButton) {
      event.preventDefault();
      event.stopPropagation();
      collectAdminBlocks();

      if (toolbarButton.matches("[data-preview-remove]")) {
        adminBlocks = adminBlocks.filter((block) => block.id !== blockId);
        activeBlockId = adminBlocks[0]?.id || "";
        renderBlockEditor();
        return;
      }

      moveAdminBlock(blockId, Number(toolbarButton.getAttribute("data-preview-move")));
      activeBlockId = blockId;
      renderBlockEditor();
      return;
    }

    if (activeBlockId !== blockId) {
      activeBlockId = blockId;
      renderBlockEditor();
    }
  });

  builderPreview?.addEventListener("input", (event) => {
    const field = event.target.closest("[data-preview-field]");
    const listField = event.target.closest("[data-preview-list-field]");
    const blockElement = event.target.closest("[data-preview-block-id]");

    if ((!field && !listField) || !blockElement) {
      return;
    }

    const block = adminBlocks.find((item) => item.id === blockElement.getAttribute("data-preview-block-id"));

    if (!block) {
      return;
    }

    const value = (field || listField).textContent.trim();
    activeBlockId = block.id;

    if (field) {
      const fieldName = field.getAttribute("data-preview-field");
      block.fields[fieldName] = value;
      updateInspectorField(fieldName, value);
      return;
    }

    const fieldName = listField.getAttribute("data-preview-list-field");
    updateBlockListField(
      block,
      fieldName,
      listField.getAttribute("data-preview-list-index"),
      listField.getAttribute("data-preview-list-part"),
      value,
    );
  });

  builderPreview?.addEventListener(
    "keydown",
    (event) => {
      if (
        (event.target.closest("[data-preview-field]") || event.target.closest("[data-preview-list-field]")) &&
        event.key === "Enter" &&
        !event.shiftKey
      ) {
        event.preventDefault();
        event.target.blur();
      }
    },
    true,
  );

  builderPreview?.addEventListener("dragstart", (event) => {
    const blockElement = event.target.closest("[data-preview-block-id]");

    if (!blockElement || event.target.closest("[data-preview-field], [data-preview-list-field]")) {
      event.preventDefault();
      return;
    }

    draggedBlockType = "";
    draggedBlockId = blockElement.getAttribute("data-preview-block-id");
    blockElement.classList.add("is-dragging");
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", `block-id:${draggedBlockId}`);
  });

  builderPreview?.addEventListener("dragover", (event) => {
    if (!draggedBlockId && !draggedBlockType) {
      return;
    }

    event.preventDefault();
    event.dataTransfer.dropEffect = draggedBlockType ? "copy" : "move";
    markPreviewDropTarget(event);
  });

  builderPreview?.addEventListener("dragleave", (event) => {
    if (builderPreview.contains(event.relatedTarget)) {
      return;
    }

    builderPreview.querySelectorAll(".is-drop-target, .is-drop-before, .is-drop-after").forEach((element) => {
      element.classList.remove("is-drop-target", "is-drop-before", "is-drop-after");
    });
  });

  builderPreview?.addEventListener("drop", (event) => {
    if (!draggedBlockId && !draggedBlockType) {
      return;
    }

    event.preventDefault();
    const targetIndex = previewDropIndex(event);

    if (draggedBlockType) {
      insertAdminBlock(draggedBlockType, targetIndex);
      clearBuilderDropState();
      return;
    }

    if (draggedBlockId) {
      moveAdminBlockTo(draggedBlockId, targetIndex);
      clearBuilderDropState();
    }
  });

  builderPreview?.addEventListener("dragend", clearBuilderDropState);

  blockList?.addEventListener("dragstart", (event) => {
    const blockElement = event.target.closest("[data-block-id]");

    if (!blockElement) {
      return;
    }

    draggedBlockId = blockElement.getAttribute("data-block-id");
    draggedBlockType = "";
    blockElement.classList.add("is-dragging");
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", `block-id:${draggedBlockId}`);
  });

  blockList?.addEventListener("dragend", clearBuilderDropState);

  blockList?.addEventListener("dragover", (event) => {
    const blockElement = event.target.closest("[data-block-id]");

    if (!blockElement || !draggedBlockId || blockElement.getAttribute("data-block-id") === draggedBlockId) {
      return;
    }

    event.preventDefault();
    blockList.querySelectorAll(".is-drop-target").forEach((element) => element.classList.remove("is-drop-target"));
    blockElement.classList.add("is-drop-target");
  });

  blockList?.addEventListener("drop", (event) => {
    const blockElement = event.target.closest("[data-block-id]");
    const targetId = blockElement?.getAttribute("data-block-id");

    if (!targetId || !draggedBlockId || targetId === draggedBlockId) {
      return;
    }

    event.preventDefault();
    moveAdminBlockTo(draggedBlockId, adminBlocks.findIndex((block) => block.id === targetId));
  });
}

initProjectFeed();
initHomeProjects();
initProjectDetail();
initProjectAdmin();
initProjectBoardCarouselControls();
