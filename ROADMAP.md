# Roadmap – Zeitreise Schweiz

Ziel: Aus der Technik-Demo ein Produkt machen, für das Gemeinden, Museen, Schulen und Forschende bezahlen.
Was zählt: **Vertrauen in die Daten**, **Inhalte** und **Funktionen, die Arbeit sparen**.

Die tägliche automatische Runde nimmt den obersten offenen Punkt ohne «(Manuel)», setzt ihn um,
hakt ihn ab und trägt die Änderung in `CHANGELOG.md` ein. Ist ein Punkt zu gross für eine Runde,
wird er aufgeteilt und nur der erste Teil umgesetzt.

## 1. Vertrauen in die Daten
- [x] Methodik-Seite `methodik.html`: Datenquellen, wie echte Altbauten und nachgebaute Häuser entstehen, Genauigkeit, bekannte Grenzen, Zitiervorschlag. Verlinkt aus Übersicht und 3D-Flug.
- [x] Kennzeichnung «belegt» vs. «rekonstruiert»: Legende in der Seitenleiste, Infokarte zeigt Status und Quelle, optionaler Umschalter, der rekonstruierte Häuser leicht anders einfärbt.
- [x] Fehlklötze reduzieren: Kartenschrift und Linien über Formmerkmale (Seitenverhältnis, Füllgrad, Grösse) herausfiltern.

## 2. Funktionen für die Arbeit
- [x] Permalink: Ort, Jahr, Blickrichtung und Modus in der URL (`?lon=&lat=&h=&hdg=&pitch=&year=&mode=`); beim Laden anwenden; Knopf «Link kopieren».
- [x] Screenshot-Export als PNG mit eingeblendetem Jahr, Ort und Quellenangabe.
- [x] Gebäude-Export des gebauten Gebiets als CSV und GeoJSON (EGID, Adresse, Baujahr, Status belegt/rekonstruiert, Koordinaten).
- [x] Analyse-Modus: Gebäude nach Bauepoche einfärben (Legende), Statistik der Bauepochen im Gebiet.
- [x] Minikarte unten links mit Standort und Blickrichtung.
- [x] Einbettung: `?embed=1` ohne Startbildschirm, Menü eingeklappt, Knopf «Im Vollbild öffnen».
- [x] Knopf «Einbetten» im Menü liefert den iframe-Code zum Kopieren.

## 3. Inhalte
- [x] Geschichten an Orten: `stories/winterthur.json` (Titel, Text, Jahr von–bis, Koordinaten, Quelle); Marker im 3D-Bild, Infokarte beim Anklicken. Nur gesicherte, mit Quelle belegte Fakten.
- [x] Geführte Tour: Kamera fliegt Stationen einer Story-Datei nacheinander an (Weiter/Zurück).
- [x] Bekannte Orte als Sprungziele je Stadt (aus der Story-Datei).

## 4. Einsatz bei Kunden
- [x] Anleitung für Partner `stories/README.md`: Format der Story-Dateien, Quellenregeln, Beispiel; verlinkt aus Pilotabschnitt der Produktseite.
- [x] Produktseite: Abschnitt «So setzen Sie es ein» mit Links zu Kiosk-Modus, Einbettung und Unterrichtsseite.
- [x] Barrierefreiheit: Kamerafahrten bei «Bewegung reduzieren» verkürzen, Infokarte mit Esc schliessen, Statusmeldungen für Screenreader.
- [x] Unterrichtsseite `unterricht.html` für Schulen: Lernziele, drei Aufträge mit dem 3D-Flug (Zeitregler, Analyse nach Bauepoche, Export), Hinweise für Lehrpersonen; verlinkt aus Übersicht.
- [x] Veränderungen sichtbar machen: Umschalter «Neu seit der letzten Kartenausgabe» hebt belegte Gebäude hervor, die seit dem vorherigen Kartenstand gebaut wurden, mit Zählung.
- [x] Handy: Seitenleiste als unteres Blatt mit Griff (halb/ganz/zu), damit das 3D-Bild sichtbar bleibt.
- [x] Kiosk-Modus `?kiosk=1`: automatischer Rundflug, Neustart nach 2 Minuten ohne Eingabe, grosse Touch-Knöpfe.
- [x] Handy-Steuerung: virtueller Joystick zum Gehen, Wischen zum Umschauen.
- [x] Übersichtsseite als Produktseite mit eingebettetem 3D-Flug, Zielgruppen, Funktionen, Daten, Pilotangebot.
- [ ] (Manuel) Kontaktadresse für Pilotanfragen in `index.html` (Konstante CONTACT) eintragen.
- [ ] (Manuel) Impressum und Datenschutzerklärung mit echten Angaben.
- [ ] (Manuel) Eigene Domain.

## 5. Technik
- [x] Kartenausgaben in einem Web Worker berechnen, damit die Seite beim Bauen nicht stockt.
- [x] Ladezeit: Kartenausgaben zwischenspeichern (IndexedDB), zweiter Besuch startet sofort.

## 6. Nächste Schritte
- [x] Handy: Jahreszahlen der Kartenausgaben am Zeitregler als grosse Knöpfe zum Antippen (1880/1900/1920/1940).
- [x] Messwerkzeug für Schulen und Forschung: zwei Punkte im 3D-Bild anklicken, Distanz und Höhenunterschied anzeigen.
- [x] Eigene Story-Datei per Link testen: `?stories=<name>` lädt `stories/<name>.json` (nur Buchstaben, Ziffern, Bindestrich), damit Partner ihre Datei vor der Freischaltung prüfen können.
- [x] Handy: Infokarte mit Knopf «Schliessen» (✕), da es auf Touch-Geräten kein Esc gibt.
- [x] Unterrichtsseite: vierter Auftrag mit dem Messwerkzeug (Gassenbreite, Höhenunterschied Altstadt–Bahnhof).
- [x] 2D-Karte: Geschichten aus `stories/winterthur.json` als Marker mit Titel, Text und Quelle.
- [x] Produktseite: Funktionsliste um Messwerkzeug, Story-Test per Link und Geschichten in der 2D-Karte ergänzen.
- [x] 2D-Karte: Permalink (Ort, Zoom, Modus, Quellen und Jahre in der URL) mit Knopf «Link kopieren».
- [x] 2D-Karte: Ortssuche für die ganze Schweiz (geo.admin.ch), wie im 3D-Flug.
- [x] 3D-Flug: Link «2D-Karte» öffnet die 2D-Karte am aktuellen Ort und im gewählten Jahr.
- [x] 2D-Karte: Knopf «Im 3D-Flug ansehen» öffnet den 3D-Flug am Kartenmittelpunkt und baut dort die Häuser.
- [x] Unterrichtsseite: in Auftrag 1 den Vergleich mit Wischregler in der 2D-Karte als Alternative für langsame Geräte nennen.
