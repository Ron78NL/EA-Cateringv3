const zoekveld = document.getElementById("zoekveld");
const aantal = document.getElementById("aantal");
const kop = document.getElementById("kop");
const categorieMenu = document.getElementById("categorieMenu");
const videoGrid = document.getElementById("videoGrid");
const videoModal = document.getElementById("videoModal");
const videoFrame = document.getElementById("videoFrame");
const videoTitel = document.getElementById("videoTitel");
const videoExtern = document.getElementById("videoExtern");
const sluitKnop = document.getElementById("sluit");

let geselecteerd = ""; // "" = alle categorieën
let laatsteFocus = null;
let taal = "nl";

// ===== TEKSTEN PER TAAL =====
const TEKST = {
    nl: {
        titel: "NAC Performance Support | EA Catering – Instructievideo's",
        sub: "Navy Academy Oostende | Instructievideo's keukentechnieken",
        intro: "Zoek een techniek of kies hierboven een categorie. Tik op een video om hem meteen te bekijken.",
        zoek: "Zoek een video, bijvoorbeeld julienne of bouillon",
        alle: "Alle video's",
        alleKop: "Alle instructievideo's",
        resultaten: t => `Zoekresultaten voor "${t}"`,
        aantal: n => n === 1 ? "1 video gevonden" : `${n} video's gevonden`,
        geen: "Geen video's gevonden.",
        geenUitleg: "Geen video gevonden. Probeer een ander woord, bijvoorbeeld een deel van de techniek (\"brunoise\", \"saus\").",
        afspelen: "afspelen",
        sluiten: "Sluiten",
        yt: "Bekijk op YouTube",
        ytLokaal: "Afspelen op YouTube",
        categorieen: "Categorieën",
        footer: "&copy; 2026 Navy Academy Oostende (NAC) - Direct support To Production (DS2P). Alle rechten voorbehouden."
    },
    fr: {
        titel: "NAC Performance Support | EA Catering – Vidéos d'instruction",
        sub: "Navy Academy Oostende | Vidéos d'instruction des techniques culinaires",
        intro: "Recherchez une technique ou choisissez une catégorie ci-dessus. Touchez une vidéo pour la regarder immédiatement. Les vidéos sont en néerlandais.",
        zoek: "Rechercher une vidéo, par exemple julienne ou bouillon",
        alle: "Toutes les vidéos",
        alleKop: "Toutes les vidéos d'instruction",
        resultaten: t => `Résultats pour « ${t} »`,
        aantal: n => n === 1 ? "1 vidéo trouvée" : `${n} vidéos trouvées`,
        geen: "Aucune vidéo trouvée.",
        geenUitleg: "Aucune vidéo trouvée. Essayez un autre mot, par exemple une partie de la technique (« brunoise », « sauce »).",
        afspelen: "lire",
        sluiten: "Fermer",
        yt: "Voir sur YouTube",
        ytLokaal: "Lire sur YouTube",
        categorieen: "Catégories",
        footer: "&copy; 2026 Navy Academy Oostende (NAC) - Direct support To Production (DS2P). Tous droits réservés."
    },
    en: {
        titel: "NAC Performance Support | EA Catering – Instruction videos",
        sub: "Navy Academy Oostende | Instruction videos for kitchen techniques",
        intro: "Search for a technique or choose a category above. Tap a video to watch it straight away. The videos are in Dutch.",
        zoek: "Search for a video, for example julienne or stock",
        alle: "All videos",
        alleKop: "All instruction videos",
        resultaten: t => `Search results for "${t}"`,
        aantal: n => n === 1 ? "1 video found" : `${n} videos found`,
        geen: "No videos found.",
        geenUitleg: "No video found. Try another word, for example part of the technique (\"brunoise\", \"sauce\").",
        afspelen: "play",
        sluiten: "Close",
        yt: "Watch on YouTube",
        ytLokaal: "Play on YouTube",
        categorieen: "Categories",
        footer: "&copy; 2026 Navy Academy Oostende (NAC) - Direct support To Production (DS2P). All rights reserved."
    }
};
const L = () => TEKST[taal];

// Titel en categorienaam in de gekozen taal (valt terug op Nederlands)
const titelVan = v => (taal !== "nl" && v[taal]) || v.titel;
const naamVan = id => {
    const c = categorieen.find(c => c.id === id);
    return c ? ((taal !== "nl" && c[taal]) || c.naam) : "";
};

// Zoeken negeert hoofdletters en accenten: "lieren" vindt "Liëren"
const normaliseer = tekst =>
    tekst.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

function bouwMenu() {
    const items = [{ id: "" }, ...categorieen];

    categorieMenu.replaceChildren(...items.map(c => {
        const knop = document.createElement("button");
        knop.type = "button";
        knop.className = "tab-btn";
        knop.dataset.id = c.id;
        const n = c.id === "" ? videos.length : videos.filter(v => v.categorie === c.id).length;
        knop.innerHTML = `${c.id === "" ? L().alle : naamVan(c.id)}<span class="teller">${n}</span>`;
        knop.addEventListener("click", () => kiesCategorie(c.id, knop));
        return knop;
    }));

    updateMenu();
}

function kiesCategorie(id, knop) {
    geselecteerd = id;
    zoekveld.value = "";
    updateMenu();
    toonVideos();
    if (knop) knop.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
}

function updateMenu() {
    categorieMenu.querySelectorAll(".tab-btn").forEach(knop => {
        const actief = knop.dataset.id === geselecteerd;
        knop.classList.toggle("active", actief);
        knop.setAttribute("aria-pressed", actief);
    });
}

function toonVideos() {
    const zoekterm = normaliseer(zoekveld.value.trim());

    // Bij zoeken wordt altijd in alle categorieën gezocht
    if (zoekterm && geselecteerd !== "") {
        geselecteerd = "";
        updateMenu();
    }

    // Zoeken werkt in de gekozen taal en altijd ook in het Nederlands
    const gevonden = videos.filter(v =>
        zoekterm
            ? normaliseer(titelVan(v)).includes(zoekterm) || normaliseer(v.titel).includes(zoekterm)
            : geselecteerd === "" || v.categorie === geselecteerd
    );

    kop.textContent = zoekterm
        ? L().resultaten(zoekveld.value.trim())
        : geselecteerd === "" ? L().alleKop : naamVan(geselecteerd);

    if (gevonden.length === 0) {
        aantal.textContent = L().geen;
        const leeg = document.createElement("p");
        leeg.className = "leeg";
        leeg.textContent = L().geenUitleg;
        videoGrid.replaceChildren(leeg);
        return;
    }

    aantal.textContent = L().aantal(gevonden.length);
    videoGrid.replaceChildren(...gevonden.map(maakKaart));
}

function maakKaart(video) {
    const kaart = document.createElement("article");
    kaart.className = "video-card";

    const knop = document.createElement("button");
    knop.type = "button";
    knop.className = "video-link";
    knop.setAttribute("aria-label", titelVan(video) + " " + L().afspelen);
    knop.addEventListener("click", () => openVideo(video));

    const thumb = document.createElement("div");
    thumb.className = "video-thumb";
    const afbeelding = document.createElement("img");
    afbeelding.src = `https://img.youtube.com/vi/${video.id}/mqdefault.jpg`;
    afbeelding.alt = "";
    afbeelding.loading = "lazy";
    afbeelding.onerror = function () {
        this.onerror = null;
        this.src = `https://img.youtube.com/vi/${video.id}/hqdefault.jpg`;
    };
    thumb.appendChild(afbeelding);

    const info = document.createElement("div");
    info.className = "video-info";
    const titel = document.createElement("h3");
    titel.textContent = titelVan(video);
    const cat = document.createElement("span");
    cat.className = "video-cat";
    cat.textContent = naamVan(video.categorie);
    info.append(titel, cat);

    knop.append(thumb, info);
    kaart.appendChild(knop);
    return kaart;
}

function openVideo(video) {
    laatsteFocus = document.activeElement;
    videoFrame.replaceChildren();
    videoTitel.textContent = titelVan(video);
    const ytLink = `https://www.youtube.com/watch?v=${video.id}`;
    videoExtern.href = ytLink;

    if (location.protocol === "file:") {
        // Lokaal geopend bestand: YouTube staat afspelen in de pagina dan niet toe.
        const poster = document.createElement("a");
        poster.className = "video-poster";
        poster.href = ytLink;
        poster.target = "_blank";
        poster.rel = "noopener noreferrer";
        poster.style.backgroundImage = `url(https://img.youtube.com/vi/${video.id}/hqdefault.jpg)`;
        poster.innerHTML = `<span class="video-play">▶</span><span class="video-poster-tekst">${L().ytLokaal}</span>`;
        videoFrame.appendChild(poster);
        videoExtern.hidden = true;
    } else {
        const iframe = document.createElement("iframe");
        iframe.src = `https://www.youtube-nocookie.com/embed/${video.id}?autoplay=1&rel=0&modestbranding=1&playsinline=1`;
        iframe.title = titelVan(video);
        iframe.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
        iframe.allowFullscreen = true;
        videoFrame.appendChild(iframe);
        videoExtern.hidden = false;
    }

    videoModal.classList.add("open");
    document.body.style.overflow = "hidden";
    sluitKnop.focus();
}

function sluitVideo() {
    videoModal.classList.remove("open");
    videoFrame.replaceChildren(); // stopt het afspelen
    document.body.style.overflow = "";
    if (laatsteFocus) laatsteFocus.focus();
}

zoekveld.addEventListener("input", toonVideos);
sluitKnop.addEventListener("click", sluitVideo);
videoModal.addEventListener("click", e => {
    if (e.target === videoModal) sluitVideo();
});
document.addEventListener("keydown", e => {
    if (e.key === "Escape" && videoModal.classList.contains("open")) sluitVideo();
});

// ===== TAAL WISSELEN (zelfde keuze als de andere NAC-pagina's) =====
function zetTaal(nieuw) {
    if (!TEKST[nieuw]) return;
    taal = nieuw;
    document.documentElement.lang = taal;
    document.title = L().titel;
    document.querySelectorAll("[data-i18n]").forEach(el => {
        const sleutel = el.getAttribute("data-i18n");
        if (L()[sleutel] !== undefined) el.innerHTML = L()[sleutel];
    });
    zoekveld.placeholder = L().zoek;
    zoekveld.setAttribute("aria-label", L().zoek);
    sluitKnop.setAttribute("aria-label", L().sluiten);
    categorieMenu.setAttribute("aria-label", L().categorieen);
    document.querySelectorAll(".lang-btn").forEach(b =>
        b.classList.toggle("active", b.dataset.lang === taal));
    try { localStorage.setItem("nac-lang", taal); } catch (e) {}
    bouwMenu();
    toonVideos();
}

document.querySelectorAll(".lang-btn").forEach(b =>
    b.addEventListener("click", () => zetTaal(b.dataset.lang)));

let startTaal = "nl";
try { startTaal = localStorage.getItem("nac-lang") || "nl"; } catch (e) {}
zetTaal(TEKST[startTaal] ? startTaal : "nl");

// ===== DIRECTE LINK (QR-code aan de werkplek) =====
// LEERMODUS: een adres als  .../EA-Cateringv3/?v=stCqu0-vqB4  opent meteen
// die video, en  ?cat=sauzen  opent meteen die categorie. Zo brengt één scan
// met de telefoon de leerling direct bij de juiste techniek. De QR-codes
// zelf maak en print je via qr.html.
(function directeLink() {
    const p = new URLSearchParams(location.search);
    const cat = p.get("cat");
    if (cat && categorieen.some(c => c.id === cat)) {
        kiesCategorie(cat, categorieMenu.querySelector(`[data-id="${cat}"]`));
    }
    const video = videos.find(v => v.id === p.get("v"));
    if (video) {
        if (!cat) kiesCategorie(video.categorie, categorieMenu.querySelector(`[data-id="${video.categorie}"]`));
        openVideo(video);
    }
})();
