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

## 7. Weitere Schritte
- [x] Forschung: Statistik der Bauepochen im Analyse-Modus als CSV herunterladen (Epoche, Anzahl, Anteil, Jahr, Ort, Quelle).
- [x] Handy: Kompass-Knopf im 3D-Flug zeigt die Blickrichtung; Antippen dreht den Blick nach Norden.
- [x] Gemeinden und Museen: «Story-Werkstatt» `stories/werkstatt.html` – Geschichten im Formular erfassen, Lage per Klick in der Karte, Pflichtfelder prüfen, JSON im richtigen Format herunterladen; verlinkt aus der Partner-Anleitung.
- [x] Produktseite und Methodik: Statistik-CSV, Kompass und Story-Werkstatt aufführen; Methodik erklärt die Spalten der Statistik.
- [x] Gemeinden: Direktlink zu einer Geschichte `flug-3d.html?story=<id>` fliegt hin und öffnet die Infokarte; Knopf «Link zu dieser Geschichte» in der Infokarte.
- [x] Schulen: Unterrichtsseite um einen Auftrag mit der Statistik-CSV ergänzen (Diagramm der Bauepochen in der Tabellenkalkulation, zwei Orte vergleichen).
- [x] 2D-Karte: Infofenster einer Geschichte mit Link «Im 3D-Flug ansehen» (Direktlink `?story=<id>`).
- [x] Story-Werkstatt: Tabelle (CSV mit den Spalten der Anleitung, Semikolon oder Komma) importieren, damit Gemeinden bestehende Listen übernehmen können.
- [x] Story-Werkstatt: Knopf «Lage im 3D-Flug ansehen» öffnet den 3D-Flug mit Blick auf den gesetzten Punkt und baut dort die Häuser.
- [x] Flüssiger und grösser: automatisch nachbauen beim Verlassen des Gebiets, echte Altbauten aller besuchten Gebiete behalten, Gebiet 1,5 km, weniger Rechenarbeit pro Bild, Qualität automatisch senken bei Ruckeln.
- [x] Welt in Kacheln wie in Minecraft: Testseite `flug-3d-welt.html` (Kacheln von rund 400 m laden rund um den Standort, die nächsten zuerst, ferne werden entladen).
- [ ] (Manuel) Testseite `flug-3d-welt.html` prüfen und freigeben; danach wird sie als `flug-3d.html` übernommen. Bei der Übernahme mitnehmen, was seither in `flug-3d.html` dazukam: Link «Im Gebäuderegister prüfen», System-Teilen auf dem Handy, Spalte `gwr_link`.

## 8. Prüfen, teilen, drucken
- [x] Forschung und Gemeinden: Infokarte eines belegten Gebäudes mit Link «Im Gebäuderegister prüfen» (map.geo.admin.ch mit GWR-Ebene an der Lage des Gebäudes), damit Baujahr und Adresse selbst nachgeprüft werden können.
- [x] Handy: «Link kopieren» und «Link zu dieser Geschichte» öffnen auf Geräten mit Teilen-Funktion das System-Teilen (Nachricht, Mail), sonst wie bisher kopieren.
- [x] Schulen: Unterrichtsseite druckbar als Arbeitsblatt (Druckansicht ohne Navigation, Platz für Antworten, Knopf «Arbeitsblatt drucken»).
- [x] Produktseite: Funktionsliste um «Im Gebäuderegister prüfen», Teilen auf dem Handy und das druckbare Arbeitsblatt ergänzen.
- [x] 2D-Karte (Handy): «Link kopieren» öffnet auf Touch-Geräten das System-Teilen, sonst wie bisher kopieren.
- [x] Forschung: Gebäudeliste (CSV und GeoJSON) mit Spalte `gwr_link`, damit jede belegte Zeile im Gebäuderegister nachgeprüft werden kann; Methodik erklärt die Spalte.
- [x] Schulen: Auftrag 2 der Unterrichtsseite um das Nachprüfen im Gebäuderegister ergänzen (Quellenkritik: stimmt das Baujahr in der Quelle?).
- [x] Infokarte eines belegten Gebäudes nennt das Alter im gewählten Jahr («1880 war es 34 Jahre alt»), nur bei genauem Baujahr.
- [x] Forschung: Statistik-CSV und Gebäudeliste (CSV, GeoJSON) mit Abrufdatum `abgerufen_am`, damit Exporte zitierbar sind.

## 8. Bundesdaten nutzen (Auftrag Manuel)
- [x] Kartenstand pro Blatt der Siegfriedkarte unter dem Zeitregler (ch.swisstopo.hiks-siegfried.metadata).
- [x] Historische Verkehrswege IVS (ASTRA) als Thema mit Infokarte.
- [x] ISOS, schützenswerte Ortsbilder (BAK) als Thema mit Infokarte.
- [x] Kulturgüterschutz-Inventar KGS (BABS) als Thema mit Infokarte.
- [x] Luftbilder swisstopo (LUBIS): Aufnahmeorte als Thema mit Infokarte.
- [x] Ortsnamen swissNAMES3D als Thema.
- [x] Heutige Gewässer swissTLM3D als Thema (Vergleich mit der Karte).
- [x] Arealstatistik BFS als Thema mit Infokarte.

## 9. Absichern, Tempo, Optik, Bedienung (Auftrag Manuel)
- [x] Automatischer Bildtest bei GitHub (Bilder, Tempo, Fehler an festen Orten; Zweig «bildtest»); Themen per Link `?themen=`.
- [ ] Offene Fragen anhand der Testbilder klären (Kartenstand, Luftbild-Orte, Arealstatistik, Brücken, Seen). – zurückgestellt: der erste Bildtest lief am 27.11. noch, Zweig «bildtest» gab es noch nicht.
- [x] Fenster der nachgebauten Häuser als Wandmuster statt Klötze.
- [x] Heutige 3D-Gebäude nur einmal laden.
- [x] Handy: kleinere Sichtweite.
- [x] Baujahre vorberechnet mitliefern (prüfen, ob machbar): machbar, siehe `PLAN-baujahre.md`.
  - [ ] (Manuel) Entscheiden, wo die Daten liegen (`gwr/` in main oder eigener Zweig) und wie GitHub Pages sie ausliefert.
  - [x] GitHub Action (monatlich): GWR-Download des BFS in Kacheln der Zoomstufe 13 umrechnen, mit Abrufdatum und Quelle.
  - [ ] (Manuel) Action «GWR-Daten» einmal von Hand starten (Actions → GWR-Daten → Run workflow) und prüfen, ob der Zweig «gwr-daten» entsteht.
  - [ ] 3D-Flug: vorberechnete Kachel zuerst laden, sonst wie bisher über geo.admin.ch abfragen. – wartet auf den ersten Lauf der Action und den Entscheid zur Ablage.
- [x] Satteldächer für nachgebaute Häuser (Minecraft-Look als Schalter).
- [x] Dunst auf fernen Häusern.
- [ ] Türme für abgerissene Kirchen.
- [ ] Nur Brücken, die auf der Karte des Jahres vorkommen.
- [ ] Hinweis beim ersten Start, wie man sich bewegt.
- [ ] Sanftes Überblenden beim Zeitsprung.
- [ ] Menü in Reitern (Ort, Zeit, Themen, Export).
- [ ] 3D-Flug in mehrere Dateien aufteilen.
