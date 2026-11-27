// GWR-Kacheln: liest die öffentliche Gebäudetabelle des Gebäude- und Wohnungsregisters (BFS)
// und schreibt pro Kachel der Zoomstufe 13 (rund 3,3 km) eine JSON-Datei mit EGID, Baujahr und Lage.
// Aufruf: node tools/gwr-kacheln.mjs <gebaeude.csv> <ausgabeordner>
// Spalten werden über ihre Namen gesucht (EGID, GBAUJ, GBAUP, GSTAT, GKODE, GKODN, STRNAME, DEINR),
// Trennzeichen (Tab, Semikolon, Komma) wird aus der Kopfzeile erkannt.
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';

const [src, out] = process.argv.slice(2);
if (!src || !out) { console.error('Aufruf: node tools/gwr-kacheln.mjs <gebaeude.csv> <ausgabeordner>'); process.exit(2); }
const Z = 13;
/* Bauperiode (GBAUP) → Jahr wie im 3D-Flug (Obergrenze der Periode, 8011 = vor 1919) */
const PERIOD = {8011:1880, 8012:1932, 8013:1953, 8014:1966, 8015:1976, 8016:1983, 8017:1988, 8018:1993, 8019:1998, 8020:2003, 8021:2008, 8022:2013, 8023:2018};
/* LV95 → WGS84 (Näherungsformel von swisstopo) */
function lv95(E, N){
  const y = (E - 2600000) / 1e6, x = (N - 1200000) / 1e6;
  const l = 2.6779094 + 4.728982*y + 0.791484*y*x + 0.1306*y*x*x - 0.0436*y*y*y;
  const p = 16.9023892 + 3.238272*x - 0.270978*y*y - 0.002528*x*x - 0.0447*y*y*x - 0.0140*x*x*x;
  return [l * 100 / 36, p * 100 / 36];
}
const tileOf = (lon, lat) => {
  const n = 2 ** Z, r = lat * Math.PI / 180;
  return [Math.floor((lon + 180) / 360 * n), Math.floor((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2 * n)];
};
const split = (line, d) => {
  if (!line.includes('"')) return line.split(d);
  const f = []; let cur = '', q = false;
  for (let i = 0; i < line.length; i++) { const ch = line[i];
    if (q) { if (ch === '"') { if (line[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += ch; }
    else if (ch === '"') q = true; else if (ch === d) { f.push(cur); cur = ''; } else cur += ch; }
  f.push(cur); return f;
};

const rl = readline.createInterface({input: fs.createReadStream(src, 'utf8'), crlfDelay: Infinity});
let head = null, d = '\t', col = {}, nIn = 0, nOk = 0;
const tiles = new Map();
for await (let line of rl) {
  if (!head) {
    line = line.replace(/^﻿/, '');
    d = ['\t', ';', ','].sort((a, b) => line.split(b).length - line.split(a).length)[0];
    head = split(line, d).map(h => h.trim().toUpperCase());
    for (const k of ['EGID', 'GBAUJ', 'GBAUP', 'GSTAT', 'GKODE', 'GKODN', 'STRNAME', 'DEINR', 'STRNAME_DEINR']) col[k] = head.indexOf(k);
    const miss = ['EGID', 'GBAUJ', 'GBAUP', 'GKODE', 'GKODN'].filter(k => col[k] < 0);
    if (miss.length) { console.error('Spalten fehlen: ' + miss.join(', ') + '\nKopfzeile: ' + head.join(' | ')); process.exit(1); }
    continue;
  }
  if (!line) continue;
  nIn++;
  const f = split(line, d), v = k => col[k] >= 0 ? (f[col[k]] || '').trim() : '';
  const egid = Number(v('EGID')), gstat = Number(v('GSTAT')), E = Number(v('GKODE')), N = Number(v('GKODN'));
  if (!egid || (col.GSTAT >= 0 && gstat && gstat !== 1004) || !(E > 2400000 && E < 2900000 && N > 1000000 && N < 1350000)) continue;
  const gbauj = Number(v('GBAUJ')), y = gbauj > 1000 ? gbauj : PERIOD[Number(v('GBAUP'))];
  if (!y) continue;
  const [lon, lat] = lv95(E, N), [tx, ty] = tileOf(lon, lat), key = tx + '/' + ty;
  const adr = (v('STRNAME_DEINR') || `${v('STRNAME')} ${v('DEINR')}`).trim();
  if (!tiles.has(key)) tiles.set(key, []);
  tiles.get(key).push([egid, y, gbauj > 1000 ? 1 : 0, Math.round(E * 10) / 10, Math.round(N * 10) / 10, adr]);
  nOk++;
}
const stand = new Date().toISOString().slice(0, 10);
const meta = {quelle: 'Bundesamt für Statistik, Eidg. Gebäude- und Wohnungsregister (GWR), https://www.housing-stat.ch/', abgerufen_am: stand, zoom: Z,
  felder: ['egid', 'jahr', 'genau', 'e_lv95', 'n_lv95', 'adresse'], hinweis: 'nur bestehende Gebäude (GSTAT 1004); jahr = Baujahr, sonst Bauperiode wie im 3D-Flug'};
for (const [key, rows] of tiles) {
  const p = path.join(out, String(Z), key + '.json');
  fs.mkdirSync(path.dirname(p), {recursive: true});
  fs.writeFileSync(p, JSON.stringify({...meta, g: rows}));
}
fs.mkdirSync(out, {recursive: true});
fs.writeFileSync(path.join(out, 'index.json'), JSON.stringify({...meta, kacheln: [...tiles.keys()].sort(), gebaeude: nOk}));
console.log(`${nIn} Zeilen gelesen, ${nOk} Gebäude in ${tiles.size} Kacheln geschrieben (Stand ${stand}).`);
