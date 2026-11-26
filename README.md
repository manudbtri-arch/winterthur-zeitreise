# Winterthur Zeitreise

Winterthur zwischen 1844 und heute: historische Karten und Luftbilder von swisstopo, in 2D und als 3D-Flug.

- `index.html` – Übersicht
- `karte-2d.html` – Zeitregler, Zeitraffer und Vergleich mit Trennstrich (Leaflet)
- `flug-3d.html` – Siegfriedkarte auf dem swisstopo-Gelände, Ego-Steuerung mit WASD und Maus (CesiumJS)

Läuft über GitHub Pages. Lokal geöffnet (Doppelklick auf die Datei) lädt das 3D-Gelände nicht, weil der Browser von einer lokalen Datei aus keine Daten fremder Server nachladen darf.

## Datenquellen

Alle Daten: © swisstopo, offene Geodaten (OGD), über `wmts.geo.admin.ch` und `3d.geo.admin.ch`.

| Ebene | Layer | Zeitraum |
|---|---|---|
| Landeskarte-Zeitreihe | `ch.swisstopo.zeitreihen` | 1844–1960 |
| Siegfriedkarte | `ch.swisstopo.hiks-siegfried` | 1870–1949 |
| Dufourkarte | `ch.swisstopo.hiks-dufour` | 1845–1865 |
| Luftbilder (Archiv) | `ch.swisstopo.swissimage-product` | 1926–2025 |
| Gelände | `ch.swisstopo.terrain.3d` | aktuell |
| Gebäude / Bäume | `ch.swisstopo.swissbuildings3d.3d`, `ch.swisstopo.vegetation.3d` | aktuell |
