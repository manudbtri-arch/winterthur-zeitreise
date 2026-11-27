# Zeitreise Schweiz

Die Schweiz zwischen 1844 und heute: historische Karten und Luftbilder von swisstopo, in 2D und als begehbare 3D-Welt.

- `index.html` – Produkt- und Übersichtsseite mit echtem 3D-Vorschaubild (`assets/`), Beispielorten, Open-Graph-Vorschau und eingebettetem 3D-Flug
- `flug-3d.html` (mit `flug-3d.css`, `flug-3d-shader.js`, `flug-3d-worker.js`) – Siegfriedkarte auf dem 3D-Gelände von swisstopo in Kacheln rund um den Standort bis zum Horizont, Ego-Steuerung mit WASD/Maus bzw. Touch-Joystick (CesiumJS), WebGL-Fallback zur 2D-Karte und Qualitätsstufen (Niedrig/Mittel/Hoch). Heute noch stehende Gebäude erscheinen als echte swissBUILDINGS3D-Modelle, gefiltert nach Baujahr aus dem Gebäuderegister (GWR, über `api3.geo.admin.ch`, Verknüpfung über EGID). Abgerissene Häuser werden im Browser aus den schwarzen Hausflächen der Siegfriedkarte rekonstruiert (Web Worker, Zwischenspeicher in IndexedDB) und mit Satteldächern (oder Stufendächern im Minecraft-Look) auf das Gelände gesetzt. Enthält Analyse nach Bauepoche, Themen aus Bundesdaten (IVS, ISOS, KGS, LUBIS, swissNAMES3D, Gewässer, Arealstatistik), Messwerkzeug, Bild-, Vorher-Nachher-, CSV- und GeoJSON-Export, QR-Codes (Ansicht und Geschichte), Übersicht der Tasten (H) sowie Kiosk- und Einbettungsmodus.
- `karte-2d.html` – Zeitregler, Zeitraffer, Wischvergleich, Ortssuche, Geschichten-Marker, Link und QR-Code zur Ansicht (Leaflet)
- `zeitraffer.html` – Zeitraffer von oben für bestimmte Bereiche: 8 kuratierte Schweizer Entwicklungs-Orte (u. a. Sulzer-Areal Winterthur, Flughafen Zürich-Kloten, Zürich-West, Basel Rheinhafen, Grande Dixence, Grindelwald- und Aletschgletscher, Bern Wankdorf) sowie jeder beliebige Ausschnitt der Schweiz per Suche/Verschieben; echte Luftbild- und Karten-Epochen bis heute (automatisch über swisstopo-Releases/Flugjahre ohne leere Stände), Vorher/Jetzt-Wischvergleich, Epochen-Streifen, PNG- und WebM-Video-Export, Permalink und QR-Code
- `methodik.html` – Datenquellen, Verfahren, Genauigkeit, bekannte Grenzen, Export-Spalten und Zitiervorschlag
- `unterricht.html` – Unterrichtsvorschlag mit acht Aufträgen für Schulen, druckbar als Arbeitsblatt
- `stories/` – Belegte Geschichten an Orten (`winterthur.json`, `basel.json`, `grindelwald.json`), Partner-Anleitung (`README.md`) und Browser-Editor (`werkstatt.html`)
- `fonts/` – Selbst gehostete Schriftart Archivo (WOFF2, SIL OFL 1.1), ohne Abruf bei Google Fonts
- `tests/bildtest.mjs` – Automatischer Bildtest über GitHub Actions (`.github/workflows/bildtest.yml`)

Läuft über GitHub Pages. Lokal geöffnet (Doppelklick auf die Datei) lädt das 3D-Gelände nicht, weil der Browser von einer lokalen Datei aus keine Daten fremder Server nachladen darf.

## Datenquellen

Alle Daten: © swisstopo, BFS, ASTRA, BAK, BABS (offene Behördendaten, OGD), direkt über `wmts.geo.admin.ch`, `3d.geo.admin.ch` und `api3.geo.admin.ch`.

| Ebene | Layer | Zeitraum |
|---|---|---|
| Landeskarte-Zeitreihe | `ch.swisstopo.zeitreihen` | 1844–2021 |
| Siegfriedkarte (+ Blatteinteilung) | `ch.swisstopo.hiks-siegfried`, `…metadata` | 1870–1949 |
| Dufourkarte | `ch.swisstopo.hiks-dufour` | 1845–1865 |
| Luftbilder (heute / Archiv / LUBIS) | `ch.swisstopo.swissimage`, `…-product`, `…lubis-*` | 1926–heute |
| Gelände | `ch.swisstopo.terrain.3d` | aktuell |
| Baujahre | `ch.bfs.gebaeude_wohnungs_register` (GWR) | aktuell |
| Gebäude / Brücken / Bäume | `ch.swisstopo.swissbuildings3d.3d`, `…swisstlm3d.3d`, `…vegetation.3d` | aktuell |
| Bundesdaten-Themen | IVS (ASTRA), ISOS (BAK), KGS (BABS), swissNAMES3D, Gewässer, Arealstatistik (BFS) | aktuell |
