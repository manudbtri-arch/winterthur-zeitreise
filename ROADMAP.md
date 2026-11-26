# Roadmap – Zeitreise Schweiz

Ziel: Aus der Technik-Demo ein Produkt machen, für das Gemeinden, Museen, Schulen und Forschende bezahlen.
Was zählt: **Vertrauen in die Daten**, **Inhalte** und **Funktionen, die Arbeit sparen**.

Die tägliche automatische Runde nimmt den obersten offenen Punkt ohne «(Manuel)», setzt ihn um,
hakt ihn ab und trägt die Änderung in `CHANGELOG.md` ein. Ist ein Punkt zu gross für eine Runde,
wird er aufgeteilt und nur der erste Teil umgesetzt.

## 1. Vertrauen in die Daten
- [ ] Methodik-Seite `methodik.html`: Datenquellen, wie echte Altbauten und nachgebaute Häuser entstehen, Genauigkeit, bekannte Grenzen, Zitiervorschlag. Verlinkt aus Übersicht und 3D-Flug.
- [ ] Kennzeichnung «belegt» vs. «rekonstruiert»: Legende in der Seitenleiste, Infokarte zeigt Status und Quelle, optionaler Umschalter, der rekonstruierte Häuser leicht anders einfärbt.
- [ ] Fehlklötze reduzieren: Kartenschrift und Linien über Formmerkmale (Seitenverhältnis, Füllgrad, Grösse) herausfiltern.

## 2. Funktionen für die Arbeit
- [ ] Permalink: Ort, Jahr, Blickrichtung und Modus in der URL (`?lon=&lat=&h=&hdg=&pitch=&year=&mode=`); beim Laden anwenden; Knopf «Link kopieren».
- [ ] Screenshot-Export als PNG mit eingeblendetem Jahr, Ort und Quellenangabe.
- [ ] Gebäude-Export des gebauten Gebiets als CSV und GeoJSON (EGID, Adresse, Baujahr, Status belegt/rekonstruiert, Koordinaten).
- [ ] Analyse-Modus: Gebäude nach Bauepoche einfärben (Legende), Statistik der Bauepochen im Gebiet.
- [ ] Minikarte unten links mit Standort und Blickrichtung.
- [x] Einbettung: `?embed=1` ohne Startbildschirm, Menü eingeklappt, Knopf «Im Vollbild öffnen».
- [ ] Knopf «Einbetten» im Menü liefert den iframe-Code zum Kopieren.

## 3. Inhalte
- [ ] Geschichten an Orten: `stories/winterthur.json` (Titel, Text, Jahr von–bis, Koordinaten, Quelle); Marker im 3D-Bild, Infokarte beim Anklicken. Nur gesicherte, mit Quelle belegte Fakten.
- [ ] Geführte Tour: Kamera fliegt Stationen einer Story-Datei nacheinander an (Weiter/Zurück).
- [ ] Bekannte Orte als Sprungziele je Stadt (aus der Story-Datei).

## 4. Einsatz bei Kunden
- [ ] Kiosk-Modus `?kiosk=1`: automatischer Rundflug, Neustart nach 2 Minuten ohne Eingabe, grosse Touch-Knöpfe.
- [ ] Handy-Steuerung: virtueller Joystick zum Gehen, Wischen zum Umschauen.
- [x] Übersichtsseite als Produktseite mit eingebettetem 3D-Flug, Zielgruppen, Funktionen, Daten, Pilotangebot.
- [ ] (Manuel) Kontaktadresse für Pilotanfragen in `index.html` (Konstante CONTACT) eintragen.
- [ ] (Manuel) Impressum und Datenschutzerklärung mit echten Angaben.
- [ ] (Manuel) Eigene Domain.

## 5. Technik
- [ ] Kartenausgaben in einem Web Worker berechnen, damit die Seite beim Bauen nicht stockt.
- [ ] Ladezeit: Kartenausgaben zwischenspeichern (IndexedDB), zweiter Besuch startet sofort.
