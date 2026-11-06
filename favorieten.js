// =============================================================
// Favorieten en "bekeken" voor EA Catering V3
// -------------------------------------------------------------
// LEERMODUS - wat gebeurt hier?
// 1. Opslag: localStorage is een klein kladblok IN de browser van
//    dit toestel. Wat je erin zet, blijft bewaard na afsluiten,
//    maar het wordt niet gedeeld met andere telefoons.
//    localStorage bewaart alleen tekst, daarom zetten we lijsten
//    om naar tekst (JSON.stringify) en terug (JSON.parse).
// 2. app.js (gedeeld met V2) tekent de videokaarten. Dit bestand
//    "kijkt mee" met een MutationObserver: telkens als app.js
//    nieuwe kaarten tekent, voegen wij er een ster aan toe.
//    Zo hoeven we app.js niet te veranderen.
// =============================================================

(function () {
    // Eigen namen in de opslag, met voorvoegsel zodat andere apps
    // op ron78nl.github.io er niet aan komen.
    const SLEUTEL_FAV = "eac-v3-favorieten";
    const SLEUTEL_BEKEKEN = "eac-v3-bekeken";

    const TEKST = {
        nl: { fav: "Mijn favorieten", zet: "Bewaar als favoriet", haal: "Verwijder uit favorieten",
              bekeken: "Bekeken", leegFav: "Nog geen favorieten. Tik op de ster bij een video om hem hier te bewaren.",
              aantal: n => n === 1 ? "1 favoriet" : `${n} favorieten` },
        fr: { fav: "Mes favoris", zet: "Ajouter aux favoris", haal: "Retirer des favoris",
              bekeken: "Vu", leegFav: "Pas encore de favoris. Touchez l'étoile d'une vidéo pour l'enregistrer ici.",
              aantal: n => n === 1 ? "1 favori" : `${n} favoris` },
        en: { fav: "My favourites", zet: "Save as favourite", haal: "Remove from favourites",
              bekeken: "Watched", leegFav: "No favourites yet. Tap the star on a video to keep it here.",
              aantal: n => n === 1 ? "1 favourite" : `${n} favourites` }
    };
    const T = () => {
        let t = "nl";
        try { t = localStorage.getItem("nac-lang") || "nl"; } catch (e) {}
        return TEKST[t] || TEKST.nl;
    };

    // ---------- Opslag lezen en schrijven ----------
    function lees(sleutel) {
        try { return new Set(JSON.parse(localStorage.getItem(sleutel) || "[]")); }
        catch (e) { return new Set(); }   // opslag geblokkeerd of beschadigd: begin leeg
    }
    function schrijf(sleutel, set) {
        try { localStorage.setItem(sleutel, JSON.stringify([...set])); } catch (e) {}
    }
    const favorieten = lees(SLEUTEL_FAV);
    const bekeken = lees(SLEUTEL_BEKEKEN);

    let alleenFavorieten = false;

    const grid = document.getElementById("videoGrid");
    const menu = document.getElementById("categorieMenu");
    const kop = document.getElementById("kop");
    const aantal = document.getElementById("aantal");

    // De YouTube-id van een kaart halen we uit het adres van de miniatuur.
    const idVan = kaart => {
        const img = kaart.querySelector(".video-thumb img");
        const m = img && img.src.match(/\/vi\/([^/]+)\//);
        return m ? m[1] : null;
    };

    const STER = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.2l2.7 5.5 6 .9-4.35 4.25 1.03 6L12 17l-5.38 2.85 1.03-6L3.3 9.6l6-.9z"/></svg>';

    // ---------- Kaarten aanvullen ----------
    function versierKaart(kaart) {
        if (kaart.dataset.fav !== undefined) return;    // al gedaan
        const id = idVan(kaart);
        if (!id) return;
        kaart.dataset.fav = favorieten.has(id) ? "1" : "0";
        kaart.dataset.id = id;

        // De ster is een eigen knop NAAST de afspeelknop (een knop in een knop mag niet).
        const ster = document.createElement("button");
        ster.type = "button";
        ster.className = "fav-ster";
        ster.innerHTML = STER;
        zetSterTekst(ster, favorieten.has(id));
        ster.addEventListener("click", () => wisselFavoriet(kaart, ster, id));
        kaart.appendChild(ster);

        if (bekeken.has(id)) markeerBekeken(kaart);

        // Afspelen = bekeken
        kaart.querySelector(".video-link").addEventListener("click", () => {
            bekeken.add(id); schrijf(SLEUTEL_BEKEKEN, bekeken); markeerBekeken(kaart);
        });
    }

    function zetSterTekst(ster, aan) {
        ster.setAttribute("aria-pressed", aan);
        ster.setAttribute("aria-label", aan ? T().haal : T().zet);
        ster.title = aan ? T().haal : T().zet;
    }

    function markeerBekeken(kaart) {
        if (kaart.querySelector(".bekeken-label")) return;
        const label = document.createElement("span");
        label.className = "bekeken-label";
        label.textContent = T().bekeken;
        kaart.querySelector(".video-thumb").appendChild(label);
    }

    function wisselFavoriet(kaart, ster, id) {
        if (favorieten.has(id)) favorieten.delete(id); else favorieten.add(id);
        schrijf(SLEUTEL_FAV, favorieten);
        kaart.dataset.fav = favorieten.has(id) ? "1" : "0";
        zetSterTekst(ster, favorieten.has(id));
        werkMenuBij();
        if (alleenFavorieten) pasFilterToe();
    }

    // ---------- Knop "Mijn favorieten" in het categoriemenu ----------
    function werkMenuBij() {
        let knop = menu.querySelector(".fav-tab");
        if (!knop) {
            knop = document.createElement("button");
            knop.type = "button";
            knop.className = "tab-btn fav-tab";
            knop.addEventListener("click", kiesFavorieten);
            menu.insertBefore(knop, menu.children[1] || null);   // direct na "Alle"
        }
        knop.innerHTML = `${STER}${T().fav}<span class="teller">${favorieten.size}</span>`;
        knop.classList.toggle("active", alleenFavorieten);
        knop.setAttribute("aria-pressed", alleenFavorieten);
    }

    function kiesFavorieten() {
        alleenFavorieten = true;
        // Eerst alle video's laten tekenen via app.js, daarna filteren wij.
        kiesCategorie("");
        menu.querySelectorAll(".tab-btn:not(.fav-tab)").forEach(k => {
            k.classList.remove("active"); k.setAttribute("aria-pressed", false);
        });
        werkMenuBij();
        pasFilterToe();
    }

    function pasFilterToe() {
        grid.classList.add("alleen-fav");
        const n = grid.querySelectorAll('.video-card[data-fav="1"]').length;
        kop.textContent = T().fav;
        aantal.textContent = T().aantal(n);
        let leeg = grid.querySelector(".fav-leeg");
        if (n === 0 && !leeg) {
            leeg = document.createElement("p");
            leeg.className = "leeg fav-leeg";
            leeg.textContent = T().leegFav;
            grid.appendChild(leeg);
        } else if (n > 0 && leeg) leeg.remove();
    }

    // Kiest de gebruiker een andere categorie of zoekt hij, dan stopt de favorietenweergave.
    menu.addEventListener("click", e => {
        if (!e.target.closest(".fav-tab")) { alleenFavorieten = false; grid.classList.remove("alleen-fav"); werkMenuBij(); }
    }, true);
    document.getElementById("zoekveld").addEventListener("input", () => {
        alleenFavorieten = false; grid.classList.remove("alleen-fav"); werkMenuBij();
    }, true);

    // ---------- Meekijken met app.js ----------
    new MutationObserver(() => {
        grid.querySelectorAll(".video-card").forEach(versierKaart);
        if (alleenFavorieten) pasFilterToe();
    }).observe(grid, { childList: true });

    new MutationObserver(() => {
        if (!menu.querySelector(".fav-tab")) werkMenuBij();   // app.js bouwt het menu opnieuw bij taalwissel
    }).observe(menu, { childList: true });

    // Eerste keer: wat app.js al getekend heeft
    grid.querySelectorAll(".video-card").forEach(versierKaart);
    werkMenuBij();
})();
