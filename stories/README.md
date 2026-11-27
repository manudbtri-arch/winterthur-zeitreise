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

## Regeln für den Inhalt

- **Nur Belegtes.** Jede Aussage muss in der genannten Quelle stehen. Keine Vermutungen, keine Anekdoten ohne Beleg.
- **Abweichungen offenlegen.** Nennen zwei Quellen verschiedene Jahre, steht beides im Text, z. B. «(Kunstführer: 1932–34; Glossar: 1930)».
- **Gute Quellen:** Inventare (KGS, kantonale Denkmalpflege), Kunstführer der GSK, Historisches Lexikon der Schweiz, Stadtarchive, Ortsgeschichten.
- **Keine Personendaten** lebender Personen, keine Fotos ohne geklärte Rechte.
- **Kurz.** Der Text soll in die Infokarte passen; Details gehören in die verlinkte Quelle.

## Ablauf

1. Datei nach diesem Muster erstellen (oder eine Tabelle mit den gleichen Spalten schicken).
2. Wir prüfen Quellen und Lage und schalten die Datei frei.
3. Die Geschichten erscheinen sofort für alle Besucherinnen und Besucher.

Mehr zum Verfahren: [Methodik](../methodik.html).
