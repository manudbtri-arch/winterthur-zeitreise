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
- [ ] (Manuel) Testseite `flug-3d-welt.html` prüfen und freigeben; danach wird sie als `flug-3d.html` übernommen. Bei der Übernahme mitnehmen, was seither in `flug-3d.html` dazukam: Link «Im Gebäuderegister prüfen», System-Teilen auf dem Handy, Spalte `gwr_link`. (Die Übernahme ist erfolgt; diese Teile fehlten danach und sind am 27.11. wiederhergestellt.)

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
- [x] Offene Fragen anhand der Testbilder klären (Stand 5557c5a): Kartenstand pro Blatt erscheint («Blatt Winterthur, Stand 1880», «Blatt Lachen, Stand 1900»); Seen und Rhein sind blau, endeten aber mit harter Kante, und in der Altstadt fehlte Boden – behoben (Boden auch in mittleren Kacheln).
  - [x] Jeder Ort meldete Abrufe mit HTTP 400: Kartenkacheln ausserhalb der Schweiz; Abfragen jetzt auf die Schweiz begrenzt.
  - [x] Testbilder 6, 8, 9 (Stand 96fcf88): Rhein in Basel durchgehend blau, Arealstatistik und Gewässer erscheinen als Thema; Aufnahmeorte der Luftbilder im Überblick nicht erkennbar (erst näher dran prüfen).
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
- [ ] Türme für abgerissene Kirchen. – zurückgestellt: Kirchensymbole der Siegfriedkarte lassen sich nicht zuverlässig erkennen; braucht eine belegte Liste (z. B. Feld in der Story-Datei mit Quelle).
- [ ] Nur Brücken, die auf der Karte des Jahres vorkommen. – zurückgestellt: swissTLM3D hat kein Baujahr; Abgleich mit der Karte (Strasse über Gewässer) zuerst an den Testbildern prüfen.
- [x] Hinweis beim ersten Start, wie man sich bewegt.
- [x] Sanftes Überblenden beim Zeitsprung.
- [x] Menü in Reitern (Ort, Zeit, Themen, Export).
- [ ] 3D-Flug in mehrere Dateien aufteilen.
  - [x] Shader (Fassade, Wand und Fenster, Boden) in `flug-3d-shader.js`.
  - [x] Kartenauswertung (Web Worker) in `flug-3d-worker.js`.
  - [x] CSS in `flug-3d.css`.
  - [ ] Themen aus Bundesdaten in `flug-3d-themen.js`. – zurückgestellt: nutzt viele Variablen des Hauptscripts; erst sinnvoll nach Umstellung auf Module.

## 10. Zitierbar, schöner, vergleichbar
- [x] Forschung: Blatt und Kartenstand der Siegfriedkarte in Gebäudeliste (CSV, GeoJSON) und Statistik-CSV mitschreiben.
- [x] Darstellung: Ziegelmuster auf den Satteldächern der nachgebauten Häuser, passend zu den echten Altbauten.
- [x] Gemeinden und Museen: Vorher-Nachher-Bild – gleicher Blick im gewählten Jahr und heute nebeneinander als PNG, mit Jahr, Ort und Quellen.

## 11. Für andere Orte und Klassen
- [x] Museen und Gemeinden: Kiosk-Rundflug um jeden Ort – `?kiosk=1` mit Ort aus dem Link (`lon`, `lat` bzw. `c`), Höhe aus dem Gelände; auf der Produktseite erklärt.
- [x] Schulen: Unterrichtsseite um einen Auftrag mit dem Vorher-Nachher-Bild ergänzen (Veränderung beschreiben und belegen).
- [x] Handy: im Querformat Zeitregler und Menü schmaler, damit mehr vom Bild sichtbar bleibt.

## 12. Nächste Runde
- [x] Bildtest prüfen: im Bild «3-winterthur-heute» (Stand 5557c5a) sind keine 3D-Gebäude zu sehen – Ladezeit im Test oder Fehler im Heute-Modus? Ursache finden und beheben. – Ursache: nach dem Laden des Geländes schaltete «Häuser bauen» die heutigen Gebäude wieder aus; behoben.
- [x] Museen: Kiosk mit eigener Story-Datei und Rundgang statt Rundflug (`?kiosk=1&stories=<name>`), Stationen wechseln im Leerlauf.
- [x] Forschung: Gebäudeliste um das Alter im gewählten Jahr ergänzen (nur bei genauem Baujahr), in der Methodik erklärt.

## 13. Geschichten im richtigen Jahr, Kartenstand in 2D, Rundgang auf dem Handy
- [x] Gemeinden und Museen: Sprung zu einer Geschichte (Rundgang, bekannte Orte, Direktlink), die im gewählten Jahr noch nicht oder nicht mehr gilt, wechselt zur ersten passenden Kartenausgabe und meldet das; die Knöpfe der bekannten Orte nennen den Zeitraum.
- [x] Forschung: 2D-Karte zeigt wie der 3D-Flug das Blatt der Siegfriedkarte am Kartenmittelpunkt mit seinem tatsächlichen Kartenstand (ch.swisstopo.hiks-siegfried.metadata).
- [x] Handy: Rundgang-Leiste auf schmalen Bildschirmen einzeilig mit gekürztem Titel und grossen Tasten, damit sie das Bild nicht verdeckt.

## 14. Partner, Museen, Handy
- [x] Museen: Produktseite mit Beispiel-Link «Kiosk-Rundgang ansehen» (`flug-3d.html?kiosk=1&stories=winterthur`).
- [x] Gemeinden: Story-Werkstatt warnt, wenn der Zeitraum (von/bis) keine Kartenausgabe (1880, 1900, 1920, 1940) trifft – solche Geschichten erscheinen nur heute und im Kiosk-Rundgang nicht.
- [x] Handy: Seitenleiste der 2D-Karte einklappbar (Knopf), damit die Karte ganz sichtbar wird.

## 15. Rundgang zum Mitmachen, Partner-Dateien in 2D, Quellenkritik
- [x] Museen: Kiosk-Rundgang zeigt die Rundgang-Leiste (Station x von n); eine Berührung hält den Rundgang an, Besucher blättern selbst weiter.
- [x] Gemeinden: 2D-Karte lädt mit `?stories=<name>` eine eigene Story-Datei wie der 3D-Flug; «Im 3D-Flug ansehen» in der Geschichte nimmt den Namen mit.
- [x] Schulen: Unterrichtsseite um einen Auftrag zum Kartenstand ergänzen (Blatt und Stand unter dem Zeitregler lesen, mit dem gewählten Jahr vergleichen, Abweichung erklären).

## 16. Eigene Orte durchgängig
- [x] Gemeinden: 2D-Karte nimmt bei eigener Story-Datei die Sprungziele aus der Datei (wie der 3D-Flug) statt der festen Winterthurer Liste, mit dem Ortsnamen aus der Datei.
- [x] Gemeinden: Story-Werkstatt nennt neben dem Testlink für den 3D-Flug auch die Testlinks für 2D-Karte und Kiosk-Rundgang.
- [x] Museen: Im Kiosk-Rundgang bleibt die Infokarte stehen, bis die nächste Station angeflogen wird (keine leere Pause).

## 17. Aushängen, Tasten, Tafeln vor Ort
- [x] Museen und Schulen: Knopf «QR-Code» im Reiter «Export» zeigt den Link zum aktuellen Blick als QR-Code mit Ort und Jahr, als PNG speicherbar (zum Aushängen in der Ausstellung oder auf dem Arbeitsblatt).
- [x] Bedienung: Taste «H» bzw. Knopf «Tasten und Gesten» öffnet eine Übersicht aller Tasten (Computer) bzw. Gesten (Handy); Esc schliesst sie.
- [x] Gemeinden: Infokarte einer Geschichte mit Knopf «QR-Code» (Direktlink `?story=<id>`), z. B. für eine Tafel am Ort.

## 18. QR-Codes überall
- [x] 2D-Karte: Knopf «QR-Code» zur aktuellen Ansicht (Ort, Zoom, Jahr), als PNG speicherbar, wie im 3D-Flug.
- [x] Schulen: Unterrichtsseite nennt den QR-Code (Startansicht für die Klasse aufs Arbeitsblatt); `README.md` auf sieben Aufträge und die neuen Knöpfe nachführen.
- [x] Gemeinden: Story-Werkstatt druckt ein Blatt mit den QR-Codes aller erfassten Geschichten (Titel, QR, Link) für Tafeln am Ort.

## 19. Zeigen, wann, zugänglich
- [x] Produktseite: QR-Codes im Abschnitt «So setzen Sie es ein» (Museum: QR-Code am Exponat; Gemeinde: Druckblatt für Tafeln aus der Story-Werkstatt).
- [x] Gemeinden und Schulen: Infokarte einer Geschichte nennt den Zeitraum aus der Story-Datei («1869–1900», «ab 1869»).
- [x] Barrierefreiheit: Fenster (Einbetten, QR-Code, Tasten) halten den Tastaturfokus beim Tabben im Fenster und geben ihn beim Schliessen an den auslösenden Knopf zurück.

## 20. Zeitraffer verbinden und erklären
- [x] 3D-Flug: Link «Zeitraffer von oben» (neben «2D-Karte») öffnet `zeitraffer.html` am aktuellen Standort (wie in der 2D-Karte).
- [x] Methodik: Abschnitt «Zeitraffer von oben» – welche Luftbild-Jahre und Kartenstände gezeigt werden (Quellen, Abfrage), bekannte Grenzen (nicht jedes Jahr beflogen, Kartenstand am 31. Dezember).
- [x] Schulen: Unterrichtsseite um einen Auftrag mit dem Zeitraffer ergänzen (Luftbilder eines Ortes über Jahrzehnte vergleichen, Veränderung beschreiben und mit Jahr belegen).

## 21. Zeitraffer im Alltag
- [x] Zeitraffer: «Im 3D-Flug» öffnet im Jahr der gerade gezeigten Epoche (Stand 1870–1949 → dieses Jahr, später → «Heute», bei Vorher/Jetzt das linke Bild) statt immer 1900.
- [x] Zeitraffer: Link und QR-Code merken sich die gezeigte Epoche (`&e=<jahr>`); auf dem Handy öffnet «Link kopieren» das System-Teilen wie im 3D-Flug.
- [x] Produktseite: «So setzen Sie es ein» nennt den Zeitraffer (Gemeinde: Entwicklung eines Areals als Video oder Bildstreifen für Website und Mitteilungsblatt).

## 22. Zeitraffer für Forschung und Partner
- [x] Forschung: Zeitraffer speichert die Liste der gezeigten Stände als CSV (Jahr, Quelle, Ebene, Zeitstand, Farbe/Schwarzweiss, Bodenauflösung, Mitte in LV95, Ausschnittbreite, Abrufdatum), damit Bildreihen zitierbar sind.
- [x] Forschung: Bildstreifen (PNG) nennt unten Abrufdatum und Mitte des Ausschnitts in LV95.
- [x] Gemeinden: Zeitraffer lädt mit `?stories=<name>` die Geschichten einer Story-Datei als Sprungziele (wie 3D-Flug und 2D-Karte).

## 23. Zeitraffer überall erreichbar
- [x] Gemeinden und Museen: Infokarte einer Geschichte im 3D-Flug mit Link «Zeitraffer von oben» (Ausschnitt um die Geschichte).
- [x] 2D-Karte: «Ausschnitt als Zeitraffer von oben» nimmt die eigene Story-Datei und das gezeigte Jahr (`e=`) mit.
- [x] Barrierefreiheit: QR-Fenster im Zeitraffer hält den Tastaturfokus und gibt ihn beim Schliessen (auch mit Esc) an den Knopf zurück.

## 24. Zeitraffer zitieren und einsetzen
- [x] Forschung: Methodik mit Zitiervorschlag für eine Bildreihe aus dem Zeitraffer (Ort, Stände, Ebene, Abrufdatum).
- [x] Produktseite: Karte «In der Forschung» nennt die Liste der Stände (CSV) aus dem Zeitraffer.
- [x] Schulen: Hinweise für Lehrpersonen nennen den Zeitraffer als Einstieg auf langsamen Geräten (ohne 3D).

## 25. Vor Ort mit dem Handy
- [x] Handy: Knopf «Mein Standort» im 3D-Flug (Reiter «Ort») – fragt den Standort nur auf Knopfdruck ab, nur innerhalb der Schweiz, nichts wird gespeichert; setzt einen dorthin und baut die Häuser.
- [x] Handy: «Mein Standort» auch in der 2D-Karte und im Zeitraffer von oben.
- [x] Forschung: Infokarte eines Gebäudes nennt die Lage in LV95 (E/N, gerundet auf 1 m) mit Knopf «Koordinaten kopieren».

## 26. Standort und Lage weiterführen
- [x] Produktseite: «Mein Standort» und «Koordinaten kopieren» in der Funktionsliste; Einbettungscode erlaubt den Standort (`allow="fullscreen; geolocation"`), damit «Mein Standort» auch auf Partner-Websites funktioniert.
- [x] Schulen: Unterrichtsseite nennt «Mein Standort» für Exkursionen (vor Ort nachsehen, was hier im gewählten Jahr stand).
- [x] Forschung: Infokarte eines rekonstruierten Hauses nennt ebenfalls die Lage in LV95 (Klickpunkt) mit «Koordinaten kopieren».

## 27. Vor Ort erfassen und nachschlagen
- [x] Handy: Knopf «Mein Standort» auch auf dem Startbildschirm des 3D-Flugs, damit man vor Ort ohne Menü direkt hinkommt.
- [x] Gemeinden: Story-Werkstatt setzt die Lage einer Geschichte auf Wunsch an den eigenen Standort (Erfassen vor Ort mit dem Handy).
- [x] Forschung: 2D-Karte zeigt nach Rechtsklick, Klick mit gedrückter Alt-Taste bzw. langem Drücken die Lage in LV95 mit «Koordinaten kopieren».

## 28. Landeskoordinaten für Gemeinden
- [x] Gemeinden: Story-Werkstatt nimmt die Lage auch als LV95-Koordinaten an (Feld «E, N», z. B. aus dem GIS der Gemeinde) und zeigt die gesetzte Lage zusätzlich in LV95.
- [x] Gemeinden: Story-Werkstatt übernimmt beim CSV-Import auch die Spalten `e_lv95` und `n_lv95`, wenn `lon`/`lat` fehlen; in der Partner-Anleitung erklärt.
- [x] Bedienung: Übersicht «Tasten und Gesten» im 3D-Flug nennt «Mein Standort» und «Koordinaten kopieren».

## 29. Punkte teilen und erklären
- [x] Produktseite: «So setzen Sie es ein» nennt für Gemeinden das Erfassen vor Ort («Lage = mein Standort») und die Übernahme von Koordinaten aus dem GIS (LV95, CSV).
- [x] Forschung: 2D-Karte – im Lage-Fenster Knopf «Link zu diesem Punkt» (`pin=<lat>,<lon>` im Link setzt beim Öffnen eine Markierung).
- [x] Methodik: Genauigkeit der Koordinaten an allen Stellen erklären (Infokarte, 2D-Karte, Story-Werkstatt; Näherungsformel, LV03-Erkennung).

## 30. Koordinaten im Unterricht und auf dem Handy
- [x] Schulen: Auftrag 4 der Unterrichtsseite um Landeskoordinaten ergänzen (Lage zweier Orte aus der Infokarte notieren, Distanz mit dem Satz des Pythagoras nachrechnen, mit der Messung vergleichen).
- [x] Handy: Koordinatenanzeige (sonst F3) auch ohne Tastatur – Häkchen «Koordinaten anzeigen» in den Einstellungen.
- [x] Forschung: Zeitraffer nennt die Mitte des Ausschnitts in LV95 bei der Beschreibung, mit «Koordinaten kopieren».

## 31. Messen und belegen
- [x] Forschung und Schulen: Messung im 3D-Flug nennt die Lage beider Punkte in LV95; Knopf «Messung kopieren» gibt Distanz, Höhenunterschied, Punkte, Ort, Jahr, Quelle und Datum als Text für Bericht oder Arbeitsblatt.
- [x] Schulen (langsame Geräte): 2D-Karte mit Messwerkzeug – zwei Punkte anklicken, Linie und waagrechte Distanz in der Karte, mit Lage in LV95.
- [x] Schulen: Auftrag 4 der Unterrichtsseite nennt das Messwerkzeug der 2D-Karte als Weg ohne 3D und «Messung kopieren» zum Festhalten der Werte.

## 32. Messen erklären, auf dem Handy, teilen
- [x] Produktseite und Methodik: Messen in der 2D-Karte und «Messung kopieren» aufführen; Methodik erklärt, wie gemessen wird (3D-Bild bzw. Karte, waagrecht und schräg) und wie genau das ist.
- [x] Handy: Während des Messens im 3D-Flug eine Leiste «Messen · Punkt x von 2» mit Knopf «Beenden», da es auf Touch-Geräten keine Taste L oder Esc gibt.
- [x] Schulen und Forschung: 2D-Karte – Knopf «Link zu dieser Messung» (`mess=<lat>,<lon>;<lat>,<lon>` im Link zeigt die Messung beim Öffnen wieder an).

## 33. Messen im Feld und im Unterricht
- [x] Handy: 2D-Karte klappt beim Start des Messens auf schmalen Bildschirmen die Seitenleiste ein, damit die Karte frei ist; der Knopf zum Aufklappen nennt «Messen läuft».
- [x] Schulen: Unterrichtsseite – Lehrperson bereitet eine Messung in der 2D-Karte als Link oder QR-Code vor, die Klasse prüft sie im 3D-Flug nach (Hinweise für Lehrpersonen).
- [x] Forschung: Messung im 3D-Flug nennt die Geländehöhe über Meer beider Punkte (Höhendienst geo.admin.ch, swissALTI3D), auch in «Messung kopieren».

## 34. Tabellen, Höhen, Übersicht
- [x] Gemeinden: Story-Werkstatt speichert die Geschichten auch als Tabelle (CSV mit den Spalten der Anleitung), damit sie in Excel weiterbearbeitet und wieder importiert werden können.
- [x] Forschung: Lage-Fenster der 2D-Karte (Rechtsklick/langes Drücken) nennt die Geländehöhe über Meer (Höhendienst geo.admin.ch, swissALTI3D).
- [x] README und Produktseite nachführen: Messen in der 2D-Karte, Link zu einer Messung, Geländehöhe, Story-Tabelle.

## 35. Richtige Höhen, Vorschau, Unterricht
- [x] Vertrauen in die Daten: Koordinatenanzeige (F3) nennt die Höhe über Meer aus dem Höhendienst von swisstopo (Gelände am Standort plus Höhe über Boden) statt der Höhe über dem Ellipsoid des 3D-Geländes (in der Schweiz rund 50 m mehr).
- [x] Gemeinden: Story-Werkstatt zeigt beim Bearbeiten eine Vorschau «So erscheint die Infokarte» (Zeitraum, Titel, Text, Quelle).
- [x] Schulen: Auftrag 4 der Unterrichtsseite – Geländehöhen beider Punkte mit dem gemessenen Höhenunterschied vergleichen (Dach oder Boden?).

## 36. Punkte weitergeben, Methodik drucken
- [x] Forschung: Methodik-Seite – Inhaltsverzeichnis vollständig (Themen aus Bundesdaten und Statistik fehlen, Nummern stimmen nicht) und Druckansicht, damit die Seite sauber als PDF einer Arbeit beiliegt.
- [x] Gemeinden und Schulen: Lage-Fenster der 2D-Karte mit Knopf «Diesen Punkt im 3D-Flug ansehen» (Blick von Süden auf den Punkt statt auf die Kartenmitte; auch auf dem Handy nach langem Drücken).
- [x] Forschung: 3D-Flug zeigt einen Punkt aus dem Link (`pin=<lat>,<lon>`, z. B. aus der 2D-Karte) als Markierung mit Lage in LV95.

## 37. Markierte Punkte im Alltag
- [x] Gemeinden: 3D-Flug – ein Link nur mit `pin=<lat>,<lon>` (ohne Blickangaben, z. B. von Hand aus dem GIS) blickt von Süden auf den Punkt, Höhe aus dem Gelände, und baut dort die Häuser.
- [x] Schulen: Hinweise für Lehrpersonen – einen Punkt in der 2D-Karte markieren und als Link oder QR-Code verteilen; die Klasse sieht ihn im 3D-Flug als Markierung.
- [x] README und Produktseite nachführen: markierter Punkt (2D-Karte → 3D-Flug), Druckansicht der Methodik.

## 38. Punkte übernehmen und weiterverfolgen
- [x] Gemeinden: Story-Werkstatt übernimmt die Lage aus einem eingefügten Link der 2D-Karte oder des 3D-Flugs (markierter Punkt `pin=`, sonst Mitte `c=`, sonst `lat`/`lon`).
- [x] Gemeinden und Forschung: Infokarte des markierten Punkts im 3D-Flug mit «Zeitraffer von oben» (Ausschnitt um den Punkt), wie bei Geschichten.
- [x] Methodik: Abschnitt Genauigkeit nennt den markierten Punkt (Link mit 6 Nachkommastellen, LV95 über die Näherungsformel) und die Übernahme aus einem Link in der Story-Werkstatt.

## 39. Zugänglich und teilbar
- [x] Barrierefreiheit: 2D-Karte – Knopf «Lage der Kartenmitte (LV95)» öffnet das Lage-Fenster ohne Rechtsklick (Tastatur, Bildschirmleser); auf dem Handy wird dabei die Karte frei.
- [x] Handy: Infokarte des markierten Punkts im 3D-Flug mit «Link zu diesem Punkt» (auf dem Handy über das System-Teilen).
- [x] Bedienung: Übersicht «Tasten und Gesten» im 3D-Flug nennt die blaue Markierung (Punkt aus dem Link); die Unterrichtsseite nennt den Knopf «Lage der Kartenmitte».

## 40. Zitieren, andere Orte, Unterricht
- [x] Forschung und Gemeinden: Infokarte eines belegten Gebäudes mit Knopf «Angaben kopieren» (Adresse, EGID, Baujahr, Lage LV95, Link zum Gebäuderegister, Quelle und Abrufdatum) als Text für Bericht oder Inventar.
- [ ] Gemeinden und Museen: Reiter «Ort» im 3D-Flug mit Auswahl «Orte mit Geschichten» (Winterthur, Basel, Grindelwald), die den Ort samt Story-Datei öffnet.
- [ ] Schulen: Unterrichtsseite nennt die drei Orte mit Geschichten als Wahl für Gruppenarbeit (Links mit `stories=`), damit Gruppen verschiedene Orte vergleichen.
