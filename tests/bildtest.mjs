// Bildtest für den 3D-Flug: feste Orte öffnen, warten bis geladen, Bild speichern, Tempo messen, Fehler sammeln.
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import fs from 'node:fs';

const OUT = 'bildtest-out';
fs.mkdirSync(OUT, { recursive: true });
const srv = spawn('python3', ['-m', 'http.server', '8080'], { stdio: 'ignore' });
await new Promise(r => setTimeout(r, 1500));

/* Höhe h ist über dem Ellipsoid (Boden + Höhe über Boden + rund 50 m Geoid) */
const ORTE = [
  { name: '1-winterthur-oben-1880', q: 'lon=8.7290&lat=47.4890&h=800&hdg=15&pitch=-22&year=1880' },
  { name: '2-winterthur-gasse-1880', q: 'lon=8.7298&lat=47.4996&h=500&hdg=90&pitch=0&year=1880&mode=walk' },
  { name: '3-winterthur-heute', q: 'lon=8.7290&lat=47.4890&h=800&hdg=15&pitch=-22&mode=now' },
  { name: '4-zuerichsee-rapperswil-1900', q: 'lon=8.8350&lat=47.2050&h=1300&hdg=300&pitch=-25&year=1900' },
  { name: '5-bergdorf-grindelwald-1900', q: 'lon=8.0330&lat=46.6050&h=1700&hdg=10&pitch=-20&year=1900' },
  { name: '6-basel-rheinbruecke-1900', q: 'lon=7.5930&lat=47.5545&h=600&hdg=330&pitch=-30&year=1900' },
  { name: '7-winterthur-themen-isos-ivs', q: 'lon=8.7290&lat=47.4890&h=800&hdg=15&pitch=-22&year=1880&themen=isos,ivs' }
];

const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const report = [];
for (const o of ORTE) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errs = [];
  page.on('pageerror', e => errs.push('Fehler: ' + String(e.message).slice(0, 300)));
  page.on('response', r => { if (r.status() >= 400) errs.push(`HTTP ${r.status()}: ${r.url().slice(0, 160)}`); });
  await page.addInitScript(() => { try { localStorage.setItem('zr-hint-walk', '1'); localStorage.setItem('zr-hint-fly', '1'); } catch (e) {} });
  page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.type() + ': ' + m.text().slice(0, 300)); });
  const t0 = Date.now();
  let hud = '';
  try {
    await page.goto(`http://localhost:8080/flug-3d.html?${o.q}`, { waitUntil: 'load', timeout: 120000 });
    for (let i = 0; i < 150; i++) {
      await page.waitForTimeout(1000);
      hud = await page.textContent('#hud').catch(() => '');
      if (i > 25 && !/lädt|Lädt/.test(hud)) break;
    }
  } catch (e) { errs.push('Laden: ' + e.message.slice(0, 200)); }
  const fps = await page.evaluate(() => new Promise(res => { let n = 0; const t = performance.now();
    const f = () => { n++; if (performance.now() - t < 5000) requestAnimationFrame(f); else res(n / ((performance.now() - t) / 1000)); };
    requestAnimationFrame(f); })).catch(() => 0);
  await page.screenshot({ path: `${OUT}/${o.name}.png` }).catch(() => {});
  report.push({ ort: o.name, link: o.q, sekunden: Math.round((Date.now() - t0) / 1000), bilder_pro_s: Math.round(fps * 10) / 10,
    anzeige: hud, karte: await page.textContent('#yLbl').catch(() => ''), status: await page.textContent('#bStat').catch(() => ''),
    fehler: [...new Set(errs)].slice(0, 40) });
  await page.close();
}
await browser.close();
srv.kill();
fs.writeFileSync(`${OUT}/bericht.json`, JSON.stringify(report, null, 1));
let md = '# Bildtest 3D-Flug\n\nSoftware-Grafik (SwiftShader): Bilder pro Sekunde sind viel tiefer als auf einem echten Gerät, taugen aber zum Vergleich.\n\n';
for (const r of report) md += `## ${r.ort}\n\n![${r.ort}](${r.ort}.png)\n\n- ${r.sekunden} s bis fertig, ${r.bilder_pro_s} Bilder/s\n- Anzeige: ${r.anzeige}\n- Karte: ${r.karte}\n- Status: ${r.status}\n- Meldungen: ${r.fehler.length}\n\n`;
fs.writeFileSync(`${OUT}/README.md`, md);
console.log(JSON.stringify(report, null, 1));
