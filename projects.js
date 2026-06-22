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
const blockBuilder = document.querySelector("[data-block-builder]");
const blockList = document.querySelector("[data-block-list]");
const blockAddSelect = document.querySelector("[data-block-add]");
let adminBlocks = [];
let draggedBlockId = "";

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

function renderProjectBoardCard(project) {
  const image = normalizeAssetUrl(project.coverImage);
  const date = formatDate(project.date);
  const category = projectCategoryLabel(project);

  return `
    <a class="project-board-card project-board-card--live reveal is-visible" href="/projecten/${encodeURIComponent(project.slug)}">
      <div class="project-board-card__media ${image ? "" : "project-board-card__media--empty"}" aria-hidden="true">
        ${image ? `<img src="${escapeHtml(image)}" alt="${escapeHtml(project.title)}" />` : ""}
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
  return `
    <a class="project-board-card project-board-card--placeholder reveal is-visible" href="/projecten/${encodeURIComponent(item.slug)}" data-placeholder-index="${index + 1}">
      <div class="project-board-card__media project-board-card__media--placeholder" aria-hidden="true">
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

function escapeAttribute(value) {
  return escapeHtml(value).replace(/`/g, "&#96;");
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
      ["image", "Achtergrondbeeld", "input"],
      ["align", "Uitlijning", "select", ["Links", "Midden"]],
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
      ["images", "Afbeeldingen, een per regel: pad of URL, alt tekst", "textarea"],
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

  const defaults = {
    hero: {
      overline: `${projectCategoryLabel(project)} ${project.date ? `, ${formatDate(project.date)}` : ""}`.trim(),
      title,
      emphasis: "",
      subtitle: project.excerpt || "",
      image: project.coverImage || "",
      align: "Links",
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
  return ["hero", "facts", "metrics", "gallery", "cta"].map((type) => createProjectBlock(type, project));
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
    blockList.innerHTML = `<div class="empty-state">Nog geen blokken. Voeg een standaardblok toe om de projectpagina op te bouwen.</div>`;
    return;
  }

  blockList.innerHTML = adminBlocks
    .map((block, index) => {
      const definition = projectBlockTypes[block.type];

      return `
        <article class="admin-block-item" data-block-id="${escapeAttribute(block.id)}" draggable="true">
          <div class="admin-block-item__bar">
            <div>
              <span class="admin-block-item__index">${String(index + 1).padStart(2, "0")}</span>
              <strong>${escapeHtml(blockTitle(block))}</strong>
            </div>
            <div class="admin-block-item__actions">
              <button class="button-ghost" type="button" data-block-move="-1" ${index === 0 ? "disabled" : ""}>Omhoog</button>
              <button class="button-ghost" type="button" data-block-move="1" ${
                index === adminBlocks.length - 1 ? "disabled" : ""
              }>Omlaag</button>
              <button class="button-ghost button-danger" type="button" data-block-remove>Verwijder</button>
            </div>
          </div>
          <div class="admin-block-fields">
            ${definition.fields.map((field) => renderBlockField(block, field)).join("")}
          </div>
        </article>
      `;
    })
    .join("");
}

function setAdminBlocks(blocks) {
  adminBlocks = normalizeAdminBlocks(blocks);
  renderBlockEditor();
}

function collectAdminBlocks() {
  if (!blockList) {
    return [];
  }

  blockList.querySelectorAll("[data-block-id]").forEach((blockElement) => {
    const block = adminBlocks.find((item) => item.id === blockElement.getAttribute("data-block-id"));

    if (!block) {
      return;
    }

    blockElement.querySelectorAll("[data-block-field]").forEach((field) => {
      block.fields[field.getAttribute("data-block-field")] = field.value;
    });
  });

  return adminBlocks.map((block) => ({
    id: block.id,
    type: block.type,
    fields: { ...block.fields },
  }));
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

function renderProjectBlockHero(block, project) {
  const fields = block.fields || {};
  const image = normalizeAssetUrl(fields.image || project.coverImage);
  const title = fields.title || project.title;
  const emphasis = fields.emphasis ? ` <em>${escapeHtml(fields.emphasis)}</em>` : "";
  const centered = fields.align === "Midden" ? " project-builder-hero--center" : "";

  return `
    <section class="project-builder-hero${centered}" ${image ? `style="--project-hero-image: url('${escapeAttribute(image)}')"` : ""}>
      <div class="project-builder-hero__copy">
        <p>${escapeHtml(fields.overline || projectCategoryLabel(project))}</p>
        <h1>${escapeHtml(title)}${emphasis}</h1>
        <span>${escapeHtml(fields.subtitle || project.excerpt || "")}</span>
      </div>
    </section>
  `;
}

function renderProjectBlockFacts(block) {
  const fields = block.fields || {};
  const facts = linesToPairs(fields.facts)
    .map(
      ([label, value]) => `
        <div>
          <dt>${escapeHtml(label)}</dt>
          <dd>${escapeHtml(value)}</dd>
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

  return `
    <section class="project-builder-section project-builder-facts">
      <div>
        <p class="project-builder-kicker">${escapeHtml(fields.eyebrow || "Over dit project")}</p>
        <div class="project-builder-richtext">${paragraphs}</div>
      </div>
      <dl>${facts}</dl>
    </section>
  `;
}

function renderProjectBlockMetrics(block) {
  const items = linesToPairs(block.fields?.items)
    .slice(0, 4)
    .map(
      ([number, label]) => `
        <div class="project-builder-metric">
          <strong>${escapeHtml(number)}</strong>
          <span>${escapeHtml(label)}</span>
        </div>
      `,
    )
    .join("");

  return `<section class="project-builder-metrics">${items}</section>`;
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

  return `
    <section class="project-builder-section project-builder-text${dark}">
      <p class="project-builder-kicker">${escapeHtml(fields.eyebrow || "Verdieping")}</p>
      <h2>${escapeHtml(fields.title || "")}</h2>
      <div class="project-builder-richtext">${paragraphs}</div>
    </section>
  `;
}

function renderProjectBlockProcess(block) {
  const steps = linesToPairs(block.fields?.steps)
    .map(
      ([title, text], index) => `
        <li>
          <span>${String(index + 1).padStart(2, "0")}</span>
          <div>
            <strong>${escapeHtml(title)}</strong>
            <p>${escapeHtml(text)}</p>
          </div>
        </li>
      `,
    )
    .join("");

  return `
    <section class="project-builder-section project-builder-process">
      <h2>${escapeHtml(block.fields?.title || "Aanpak")}</h2>
      <ol>${steps}</ol>
    </section>
  `;
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

  return `
    <section class="project-builder-section project-builder-gallery">
      <p class="project-builder-kicker">${escapeHtml(block.fields?.title || "Foto's")}</p>
      <div>${images}</div>
    </section>
  `;
}

function renderProjectBlockCta(block) {
  const fields = block.fields || {};
  return `
    <section class="project-builder-cta">
      <p>${escapeHtml(fields.text || "")}</p>
      <a class="outline-btn" href="${escapeAttribute(fields.buttonHref || "/contact")}">${escapeHtml(
        fields.buttonLabel || "Neem contact op",
      )} &rarr;</a>
    </section>
  `;
}

function renderProjectBlocks(project) {
  const blocks = normalizeAdminBlocks(project.blocks, project);
  return blocks
    .map((block) => {
      if (block.type === "hero") return renderProjectBlockHero(block, project);
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

function fillAdminForm(project) {
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
    categoryField.value = defaultProjectCategory;
  }

  setAdminBlocks(defaultProjectBlocks({}));

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
            <span class="pill">${escapeHtml(projectCategoryLabel(project))}</span>
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

  blockAddSelect?.addEventListener("change", () => {
    const type = blockAddSelect.value;

    if (!type || !projectBlockTypes[type]) {
      return;
    }

    const formData = new FormData(adminForm);
    collectAdminBlocks();
    adminBlocks.push(
      createProjectBlock(type, {
        title: formData.get("title"),
        date: formData.get("date"),
        category: formData.get("category"),
        location: formData.get("location"),
        status: formData.get("status"),
        coverImage: formData.get("coverImage"),
        excerpt: formData.get("excerpt"),
        body: formData.get("body"),
        highlights: formData.get("highlights"),
      }),
    );
    blockAddSelect.value = "";
    renderBlockEditor();
  });

  blockList?.addEventListener("input", (event) => {
    const field = event.target.closest("[data-block-field]");
    const blockElement = event.target.closest("[data-block-id]");

    if (!field || !blockElement) {
      return;
    }

    const block = adminBlocks.find((item) => item.id === blockElement.getAttribute("data-block-id"));

    if (block) {
      block.fields[field.getAttribute("data-block-field")] = field.value;
    }
  });

  blockList?.addEventListener("click", (event) => {
    const blockElement = event.target.closest("[data-block-id]");

    if (!blockElement) {
      return;
    }

    const blockId = blockElement.getAttribute("data-block-id");
    const moveButton = event.target.closest("[data-block-move]");
    const removeButton = event.target.closest("[data-block-remove]");

    if (moveButton) {
      moveAdminBlock(blockId, Number(moveButton.getAttribute("data-block-move")));
    }

    if (removeButton) {
      collectAdminBlocks();
      adminBlocks = adminBlocks.filter((block) => block.id !== blockId);
      renderBlockEditor();
    }
  });

  blockList?.addEventListener("dragstart", (event) => {
    const blockElement = event.target.closest("[data-block-id]");

    if (!blockElement) {
      return;
    }

    draggedBlockId = blockElement.getAttribute("data-block-id");
    blockElement.classList.add("is-dragging");
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", draggedBlockId);
  });

  blockList?.addEventListener("dragend", () => {
    draggedBlockId = "";
    blockList.querySelectorAll(".is-dragging, .is-drop-target").forEach((element) => {
      element.classList.remove("is-dragging", "is-drop-target");
    });
  });

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
    collectAdminBlocks();
    const fromIndex = adminBlocks.findIndex((block) => block.id === draggedBlockId);
    const toIndex = adminBlocks.findIndex((block) => block.id === targetId);

    if (fromIndex < 0 || toIndex < 0) {
      return;
    }

    const [block] = adminBlocks.splice(fromIndex, 1);
    adminBlocks.splice(toIndex, 0, block);
    renderBlockEditor();
  });
}

initProjectFeed();
initHomeProjects();
initProjectDetail();
initProjectAdmin();
initProjectBoardCarouselControls();
