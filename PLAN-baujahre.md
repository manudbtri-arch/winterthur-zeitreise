# Baujahre vorberechnet mitliefern – Machbarkeit

Stand: 27.11.2026

## Heute
Der 3D-Flug fragt für jede Kachel (rund 400 m) das Gebäuderegister über
`api3.geo.admin.ch/.../identify` ab, in Seiten zu 200 Einträgen. In dichten Altstädten
braucht eine Kachel mehrere Abfragen; das ist der langsamste Teil beim ersten Besuch.
Ergebnisse werden 30 Tage im Browser zwischengespeichert (IndexedDB).

## Idee
Die Baujahre einmal pro Monat für die ganze Schweiz vorberechnen und als kleine
statische Dateien auf GitHub Pages mitliefern. Der 3D-Flug lädt dann pro Gebiet eine
Datei statt vieler Abfragen.

## Quelle
Das BFS stellt die öffentlichen Daten des Gebäude- und Wohnungsregisters als
Download bereit (MADD, auf opendata.swiss verzeichnet):
- https://www.bfs.admin.ch/de/administrative-daten-gwr
- https://opendata.swiss/de/dataset/gebaude-gebaude-und-wohnungsregister-gwr

Vor der Umsetzung prüfen: Nutzungsbedingungen (Quellenangabe), Dateiformat und
Feldnamen (EGID, Baujahr, Bauperiode, Gebäudestatus, Koordinaten LV95, Adresse).

## Format (Vorschlag)
- Kacheln der Zoomstufe 13 (rund 3,3 km), Datei `gwr/13/<x>/<y>.json` oder binär.
- Pro Gebäude: EGID, Baujahr bzw. Bauperiode, genau ja/nein, Koordinaten auf 0,1 m,
  Adresse. Nur bestehende Gebäude (Status 1004), wie heute.
- Kopf je Datei: Abrufdatum und Quelle, damit Exporte weiter zitierbar bleiben.

## Grösse (Schätzung, noch zu messen)
Einige Millionen Gebäude; ohne Adresse rund 10–15 Byte pro Gebäude komprimiert,
mit Adresse etwa das Doppelte. Für die ganze Schweiz eher Dutzende als Hunderte MB:
für GitHub Pages machbar, aber grenzwertig, wenn die Dateien bei jeder Aktualisierung
neu ins Repository kommen (Verlauf wächst). Darum besser in einem eigenen Zweig ohne
Verlauf (wie «bildtest») ablegen.

## Ablauf (Vorschlag)
1. GitHub Action (monatlich): Download beim BFS, Kacheln schreiben, in Zweig `gwr-daten` legen.
2. 3D-Flug: zuerst die vorberechnete Kachel laden; fehlt sie oder ist sie älter als
   60 Tage, wie bisher über geo.admin.ch abfragen.
3. Methodik: Stand der Daten nennen.

## Umgesetzt
- `tools/gwr-kacheln.mjs`: liest die Gebäudetabelle (Spalten über ihre Namen, Trennzeichen automatisch) und schreibt `13/<x>/<y>.json` mit Quelle und Abrufdatum sowie `index.json`.
- `.github/workflows/gwr-daten.yml`: monatlich und von Hand; Download von https://data.geo.admin.ch/ch.bfs.gebaeude_wohnungs_register/data.zip (Inhalt beim ersten Lauf prüfen), Ergebnis im Zweig `gwr-daten`.

## Offen
- Erreicht der GitHub-Runner den Download des BFS? (beim ersten Lauf prüfen)
- GitHub Pages veröffentlicht nur einen Zweig: entweder die Daten in `main` unter
  `gwr/` oder Pages auf einen Ordner umstellen – Entscheid bei Manuel.

Ergebnis: machbar. Nächste Schritte stehen als Unterpunkte in `ROADMAP.md`.
