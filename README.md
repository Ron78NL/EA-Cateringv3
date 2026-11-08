# EA Catering

Instructievideo's keukentechnieken voor de Navy Academy Oostende (NAC), in de navy & goud huisstijl.

- Live: https://ron78nl.github.io/EA-Cateringv3/
- Oud ontwerp (blijft ongewijzigd bewaard): https://ron78nl.github.io/EA-Cateringv2/

## Video's toevoegen of wijzigen

De videolijst komt uit de Google Sheet "EA Catering – videolijst" (tabbladen Video's en Categorieën).
Wat daar staat, verschijnt automatisch op de site.

Is de Sheet even niet bereikbaar, dan gebruikt de app de laatst geladen lijst op het toestel,
en anders `videos.js` in deze map als reserve.

## Bestanden

- `index.html`, `styles.css`: de pagina en het ontwerp
- `data.js`: haalt de videolijst uit de Google Sheet en start de app
- `app.js`: tekent de videokaarten, zoeken, categorieën, taalkeuze en het afspeelscherm
- `favorieten.js`: favorieten en bekeken-vinkjes
- `videos.js`: reservelijst als de Sheet niet bereikbaar is
- `sw.js`, `manifest.json`: installeren als app op de telefoon
