# EA Catering

Instructievideo's keukentechnieken voor de Navy Academy Oostende (NAC), in de navy & goud huisstijl.

- Live: https://ron78nl.github.io/EA-Cateringv3/
- Oud ontwerp (blijft ongewijzigd bewaard): https://ron78nl.github.io/EA-Cateringv2/

## Video's toevoegen of wijzigen

De videolijst komt uit de Google Sheet "EA Catering – videolijst" (tabbladen Video's en Categorieën).
Wat daar staat, verschijnt automatisch op de site.

Is de Sheet even niet bereikbaar, dan gebruikt de app de laatst geladen lijst op het toestel,
en anders `videos.js` in deze map als reserve.

## QR-codes voor de werkplek (voor instructeurs)

Open `https://ron78nl.github.io/EA-Cateringv3/qr.html` en kies categorie, formaat (stickers 12 per A4 of poster) en taal, en print.
Een scan opent in de app meteen die video (`?v=YouTube-id`) of de hele categorie (`?cat=categorie-id`).
De pagina staat niet in het menu van de site; leerlingen zien hem niet. Nieuwe video's uit de Sheet staan er vanzelf op.

Let op: een sticker blijft werken als je titel of categorie wijzigt, maar niet als je de YouTube-link van een video vervangt (print dan een nieuwe).

## Bestanden

- `index.html`, `styles.css`: de pagina en het ontwerp
- `data.js`: haalt de videolijst uit de Google Sheet en start de app
- `app.js`: tekent de videokaarten, zoeken, categorieën, taalkeuze en het afspeelscherm
- `favorieten.js`: favorieten en bekeken-vinkjes
- `videos.js`: reservelijst als de Sheet niet bereikbaar is
- `sw.js`, `manifest.json`: installeren als app op de telefoon
- `qr.html`, `qrcode.js`: printbare QR-codes per video en categorie (qrcode.js: MIT-licentie, Kazuhiko Arase)
