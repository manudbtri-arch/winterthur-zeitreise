# Änderungen

## 2026-11-27
- Bekannte Orte als Sprungziele: Knöpfe in der Seitenleiste (aus der Story-Datei) fliegen direkt zum Ort und zeigen die Geschichte.
- Geführter Rundgang: Knopf «Rundgang zu den Geschichten» fliegt die Stationen der Story-Datei nacheinander an, mit Weiter/Zurück und Infokarte je Station.
- Geschichten an Orten: `stories/winterthur.json` mit vier belegten Einträgen (Rathaus, Stadthaus, Bahnhof, Technikum), Marker im 3D-Bild je nach Jahr, Infokarte mit Quelle und Link; abschaltbar.
- Produktseite: Export, Zitieren und Analyse nach Bauepoche als verfügbare Funktionen aufgeführt.
- Knopf «Einbetten»: zeigt den iframe-Code für die eigene Website mit der aktuellen Ansicht (Ort, Jahr, Blick) zum Kopieren.
- Minikarte unten links (auf breiten Bildschirmen): Siegfriedkarte des gewählten Jahres mit Standort und Blickrichtung, Klick öffnet die grosse Karte; abschaltbar in den Einstellungen.
- Analyse-Modus «nach Bauepoche einfärben»: belegte Gebäude farbig nach Baujahr bzw. Bauperiode (GWR), mit Legende und Balkenstatistik der Epochen im Gebiet zum gewählten Jahr.
- Gebäude-Export als CSV (Excel-tauglich, Semikolon) und GeoJSON: belegte Häuser mit EGID, Adresse, Baujahr, rekonstruierte mit Kartenstand, Fläche und geschätzten Geschossen, je mit WGS84- und LV95-Koordinaten und Quelle.
- Bild speichern (Knopf «Bild» oder Taste P): PNG der aktuellen Ansicht mit Leiste für Jahr, Ort, Kartengrund, LV95-Koordinaten und Quellenangabe.
- Permalink: Knopf «Link zu dieser Ansicht kopieren» speichert Ort, Jahr, Blick und Modus in der Adresse; beim Öffnen wird die Ansicht wiederhergestellt, auch «Im Vollbild öffnen» aus der Einbettung übernimmt sie.
- Weniger Fehlklötze: Kartenschrift und Linien werden über Formmerkmale (Breite, Füllgrad, inneres Volumen) verworfen, ausser dort steht ein echtes Haus; Methodik-Seite ergänzt.
- 3D-Flug: Legende «belegt» und «rekonstruiert» in der Seitenleiste, Infokarte mit Status und Quelle (inkl. EGID), Umschalter «Rekonstruierte hervorheben» färbt nachgebaute Häuser bläulich.
- Neue Methodik-Seite `methodik.html` mit Datenquellen, Verfahren für belegte und rekonstruierte Häuser, Genauigkeit, bekannten Grenzen und Zitiervorschlag; verlinkt aus Übersicht und 3D-Flug.

## 2026-11-26
- Neue Produkt-Webseite mit eingebettetem 3D-Flug, Zielgruppen, Funktionen, Datenerklärung und Pilotangebot.
- Einbettungsmodus `flug-3d.html?embed=1`.
- Schweizweite Ortssuche, «Heute»-Ansicht mit Luftbild, allen 3D-Gebäuden und Bäumen.
- Weniger Flackern: Kantenglättung, Muster in der Ferne ausgeblendet, Schatten und Pixel-Look optional.
- Blocks-ähnliche Steuerung: Karte mit Teleport (M), Flugtempo (I/U), Fernsicht (J), Koordinaten (F3), Vollbild.
- Echte Altbauten nach Baujahr (Gebäuderegister), nachgebaute abgerissene Häuser aus der Siegfriedkarte, Zeitsprung 1880–1940.
- Startbildschirm, Zeitleiste, Infokarte per Klick.
