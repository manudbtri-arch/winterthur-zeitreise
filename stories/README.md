# Geschichten an Orten – Anleitung für Partner

Gemeinden, Museen, Archive und Schulen können Zeitreise Schweiz mit eigenen Geschichten ergänzen.
Jede Geschichte erscheint als Marker im 3D-Bild, als Sprungziel in der Seitenleiste und als Station im Rundgang.

## Dateiformat

Eine Datei pro Ort, z. B. `stories/winterthur.json`, in UTF-8:

```json
{
  "ort": "Winterthur",
  "geschichten": [
    {
      "id": "stadthaus",
      "titel": "Stadthaus von Gottfried Semper",
      "text": "Erbaut 1865–69 von Gottfried Semper …",
      "von": 1869,
      "bis": null,
      "adresse": "Stadthausstrasse 4a, 8400 Winterthur",
      "quelle": "Schweizerisches Inventar der Kulturgüter (KGS 7768)",
      "url": "https://…"
    }
  ]
}
```

| Feld | Pflicht | Bedeutung |
|---|---|---|
| `id` | ja | kurzer, eindeutiger Name ohne Leerzeichen |
| `titel` | ja | wird als Beschriftung am Marker gezeigt, möglichst kurz |
| `text` | ja | zwei bis drei Sätze, nur reiner Text (kein HTML) |
| `von` / `bis` | nein | Jahre, in denen der Marker sichtbar ist; `null` = offen |
| `adresse` | eines von beiden | Strasse, Nummer, PLZ, Ort – die Lage wird über die Adresssuche von geo.admin.ch bestimmt |
| `lon` / `lat` | eines von beiden | Koordinaten in WGS84 (Dezimalgrad), wenn es keine Adresse gibt |
| `quelle` | ja | überprüfbare Quelle in Worten |
| `url` | empfohlen | Link zur Quelle, nur `https://` |

## Ohne Programmierkenntnisse: Story-Werkstatt

Die [Story-Werkstatt](https://manudbtri-arch.github.io/winterthur-zeitreise/stories/werkstatt.html) erfasst Geschichten im Formular, setzt die Lage per Adresse, Klick in die Karte oder vor Ort mit dem Handy («Lage = mein Standort»), prüft die Pflichtfelder und speichert die Datei in genau diesem Format. Eine bestehende Datei lässt sich dort zum Bearbeiten öffnen; eine Tabelle (CSV, z. B. aus Excel) mit den Spalten `titel`, `text`, `von`, `bis`, `adresse`, `lon`, `lat`, `quelle`, `url` (statt `lon`/`lat` auch `e_lv95`/`n_lv95` in Landeskoordinaten) wird übernommen und lässt sich dort ergänzen. Die Angaben bleiben im eigenen Browser, bis Sie die Datei weitergeben.

## Regeln für den Inhalt

- **Nur Belegtes.** Jede Aussage muss in der genannten Quelle stehen. Keine Vermutungen, keine Anekdoten ohne Beleg.
- **Abweichungen offenlegen.** Nennen zwei Quellen verschiedene Jahre, steht beides im Text, z. B. «(Kunstführer: 1932–34; Glossar: 1930)».
- **Gute Quellen:** Inventare (KGS, kantonale Denkmalpflege), Kunstführer der GSK, Historisches Lexikon der Schweiz, Stadtarchive, Ortsgeschichten.
- **Keine Personendaten** lebender Personen, keine Fotos ohne geklärte Rechte.
- **Kurz.** Der Text soll in die Infokarte passen; Details gehören in die verlinkte Quelle.

## Datei testen

Liegt die Datei im Ordner `stories/`, zeigt dieser Link sie im 3D-Flug an (Name ohne `.json`, nur Kleinbuchstaben, Ziffern und Bindestrich):

`flug-3d.html?stories=meinort`

In der 2D-Karte geht es gleich: `karte-2d.html?stories=meinort`. Im Zeitraffer von oben (`zeitraffer.html?stories=meinort`) erscheinen die Geschichten als Ausschnitte zum Anklicken; der Zeitraffer zeigt dann die Entwicklung rund um jede Geschichte in Luftbildern und Karten. Eine kurze Meldung nennt die Zahl der geladenen Geschichten. Übersprungene Einträge (fehlendes Feld, Adresse nicht gefunden) stehen mit Grund in der Browser-Konsole (F12).

## Direktlink zu einer Geschichte

`flug-3d.html?story=<id>` fliegt direkt zur Geschichte mit dieser `id` und öffnet ihre Infokarte, z. B. `flug-3d.html?story=rathaus`. Für eine eigene Datei kommt `&stories=meinort` dazu. Den Link liefert auch der Knopf «Link zu dieser Geschichte kopieren» in der Infokarte. Der Knopf «QR-Code zu dieser Geschichte» daneben speichert denselben Link als QR-Code (PNG), etwa für eine Tafel am Ort. In der Story-Werkstatt druckt «QR-Codes drucken» ein Blatt mit einem QR-Code je vollständiger Geschichte (Titel, Code, Link); die Codes funktionieren, sobald die Datei freigeschaltet ist.

## Kiosk mit Rundgang

`flug-3d.html?kiosk=1&stories=meinort` zeigt auf einem Touchscreen im Leerlauf einen Rundgang statt des Rundflugs: alle 24 Sekunden fliegt die Kamera zur nächsten Geschichte und öffnet ihre Infokarte. Das Jahr ist jeweils die erste Kartenausgabe (1880, 1900, 1920, 1940), in der die Geschichte gilt (`von`/`bis`); Geschichten ausserhalb dieser Jahre werden im Rundgang übersprungen. Oben steht die Leiste mit Station und Titel. Eine Berührung hält den Rundgang an; Besucherinnen und Besucher blättern dann mit ‹ und › selbst weiter. Nach zwei Minuten ohne Eingabe beginnt er von vorn.

## Ablauf

1. Datei nach diesem Muster erstellen (oder eine Tabelle mit den gleichen Spalten schicken).
2. Wir prüfen Quellen und Lage und schalten die Datei frei.
3. Die Geschichten erscheinen sofort für alle Besucherinnen und Besucher.

Mehr zum Verfahren: [Methodik](../methodik.html).
