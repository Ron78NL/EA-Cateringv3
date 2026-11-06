// =============================================================
// Videolijst laden uit de Google Sheet "EA Catering – videolijst"
// -------------------------------------------------------------
// LEERMODUS - wat gebeurt hier?
// 1. De Sheet is "gepubliceerd op internet" als CSV: een simpel
//    tekstbestand met komma's tussen de kolommen. Iedereen kan het
//    lezen, niemand kan via dit adres iets wijzigen.
// 2. We halen twee tabbladen op (Video's en Categorieën), zetten
//    ze om naar dezelfde lijsten die videos.js vroeger had, en
//    starten daarna pas app.js en favorieten.js.
// 3. Veiligheden:
//    - foute regels (geen titel, geen geldige YouTube-link,
//      onbekende categorie, Tonen = Nee) worden overgeslagen;
//    - de laatst goed geladen lijst wordt bewaard op het toestel
//      en gebruikt als Google even niet bereikbaar is;
//    - lukt ook dat niet, dan valt de app terug op videos.js.
// =============================================================

(function () {
    // Adressen van de gepubliceerde tabbladen (Bestand > Delen > Publiceren op internet, als CSV).
    // Leeg = nog niet gepubliceerd: de app gebruikt dan videos.js.
    const BRON = {
        videos: "",
        categorieen: ""
    };
    const CACHE_SLEUTEL = "eac-v3-videolijst";
    const TERUGVAL = "/EA-Cateringv2/videos.js";
    const SCRIPTS = ["/EA-Cateringv2/app.js?v=4", "favorieten.js?v=1"];

    // ---------- CSV omzetten naar rijen (houdt rekening met komma's binnen "aanhalingstekens") ----------
    function leesCsv(tekst) {
        const rijen = []; let rij = []; let veld = ""; let inQuote = false;
        for (let i = 0; i < tekst.length; i++) {
            const t = tekst[i];
            if (inQuote) {
                if (t === '"' && tekst[i + 1] === '"') { veld += '"'; i++; }
                else if (t === '"') inQuote = false;
                else veld += t;
            } else if (t === '"') inQuote = true;
            else if (t === ",") { rij.push(veld); veld = ""; }
            else if (t === "\n") { rij.push(veld); rijen.push(rij); rij = []; veld = ""; }
            else if (t !== "\r") veld += t;
        }
        if (veld !== "" || rij.length) { rij.push(veld); rijen.push(rij); }
        return rijen;
    }

    const slug = s => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
        .replace(/&/g, " ").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

    const youtubeId = link => {
        const m = String(link).match(/(?:v=|youtu\.be\/|shorts\/|embed\/)([\w-]{11})/);
        return m ? m[1] : null;
    };

    // ---------- Rijen omzetten naar de lijsten die app.js verwacht ----------
    function bouwLijsten(catRijen, vidRijen) {
        const categorieen = catRijen.slice(1)
            .filter(r => (r[0] || "").trim())
            .map(r => ({ id: slug(r[0]), naam: r[0].trim(), fr: (r[1] || "").trim() || undefined, en: (r[2] || "").trim() || undefined }));
        const perNaam = Object.fromEntries(categorieen.map(c => [c.naam.toLowerCase(), c.id]));

        const videos = []; const overgeslagen = [];
        vidRijen.slice(1).forEach((r, i) => {
            const [titel = "", fr = "", en = "", link = "", cat = "", tonen = "Ja"] = r.map(x => (x || "").trim());
            if (!titel && !link) return;                                   // lege regel
            if (tonen.toLowerCase() === "nee") return;                     // bewust verborgen
            const id = youtubeId(link);
            const categorie = perNaam[cat.toLowerCase()];
            if (!titel || !id || !categorie) { overgeslagen.push(`rij ${i + 2}`); return; }
            videos.push({ id, titel, fr: fr || undefined, en: en || undefined, categorie });
        });
        if (overgeslagen.length) console.warn("Videolijst: overgeslagen (controleer de Sheet):", overgeslagen.join(", "));
        if (!categorieen.length || !videos.length) throw new Error("Videolijst leeg");
        return { categorieen, videos };
    }

    async function haal(url) {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 8000);
        try {
            const r = await fetch(url, { signal: ctrl.signal, cache: "no-store" });
            if (!r.ok) throw new Error("HTTP " + r.status);
            return await r.text();
        } finally { clearTimeout(timer); }
    }

    function laadScript(src) {
        return new Promise((ok, fout) => {
            const s = document.createElement("script");
            s.src = src; s.onload = ok; s.onerror = fout;
            document.body.appendChild(s);
        });
    }

    async function start() {
        let lijst = null;
        if (BRON.videos && BRON.categorieen) {
            try {
                const [cat, vid] = await Promise.all([haal(BRON.categorieen), haal(BRON.videos)]);
                lijst = bouwLijsten(leesCsv(cat), leesCsv(vid));
                try { localStorage.setItem(CACHE_SLEUTEL, JSON.stringify(lijst)); } catch (e) {}
            } catch (e) {
                console.warn("Google Sheet niet bereikbaar, laatst bewaarde lijst wordt gebruikt.", e);
                try { lijst = JSON.parse(localStorage.getItem(CACHE_SLEUTEL)); } catch (e2) { lijst = null; }
            }
        }
        if (lijst) {
            window.categorieen = lijst.categorieen;
            window.videos = lijst.videos;
        } else {
            await laadScript(TERUGVAL);       // zet zelf 'videos' en 'categorieen' klaar
        }
        for (const src of SCRIPTS) await laadScript(src);
    }

    start();
})();
