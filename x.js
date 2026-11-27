
{
const EDITIONS_MARKS = [1880, 1900, 1920, 1940];
const SRC = {
  sieg:  {name:'Siegfriedkarte', layer:'ch.swisstopo.hiks-siegfried', fmt:'png', min:1870, max:1949, ts:y=>String(y), nz:16, def:1880},
  zeit:  {name:'Landeskarte-Zeitreihe', layer:'ch.swisstopo.zeitreihen', fmt:'png', min:1844, max:1960, ts:y=>y+'1231', nz:16, def:1900},
  dufour:{name:'Dufourkarte (1845–65)', layer:'ch.swisstopo.hiks-dufour', fmt:'png', fixed:'current', nz:15},
  luft:  {name:'Luftbild (Archiv)', layer:'ch.swisstopo.swissimage-product', fmt:'png', min:1926, max:2025, ts:y=>String(y===1928?1927:y), nz:18, def:1946},
  foto:  {name:'Heute: Luftbild', layer:'ch.swisstopo.swissimage', fmt:'jpeg', fixed:'current', nz:19},
  karte: {name:'Heute: Landeskarte', layer:'ch.swisstopo.pixelkarte-farbe', fmt:'jpeg', fixed:'current', nz:18}
};
const $ = id => document.getElementById(id);
const C = Cesium;
/* Höhe über Ellipsoid: Winterthur liegt rund 500 m darüber, also 300 m über Boden */
const HOME = {lon:8.7290, lat:47.4890, h:800, heading:15, pitch:-22};
/* «Bewegung reduzieren» im System: Kamerafahrten kurz statt lang */
const REDUCE = matchMedia('(prefers-reduced-motion: reduce)').matches;
const flyDur = d => REDUCE ? Math.min(d, 0.3) : d;
/* Permalink: ?lon=&lat=&h=&hdg=&pitch=&year=&mode=(fly|walk|now)&c=lon,lat (Mitte des gebauten Gebiets) */
const LINK = (() => {
  const q = new URLSearchParams(location.search), num = k => (q.has(k) && q.get(k) !== '' ? Number(q.get(k)) : NaN);
  const lon = num('lon'), lat = num('lat');
  if (!(lon > 5.5 && lon < 11 && lat > 45.5 && lat < 48)) return null;
  const h = num('h'), hdg = num('hdg'), pitch = num('pitch'), year = Math.round(num('year'));
  const cc = String(q.get('c') || '').split(',').map(Number);
  const c = cc.length === 2 && cc[0] > 5.5 && cc[0] < 11 && cc[1] > 45.5 && cc[1] < 48 ? cc : [lon, lat];
  return {lon, lat, c,
    h: Number.isFinite(h) ? Math.min(20000, Math.max(200, h)) : 1000,
    hdg: Number.isFinite(hdg) ? hdg : 0,
    pitch: Number.isFinite(pitch) ? Math.min(90, Math.max(-90, pitch)) : -30,
    year: year >= 1870 && year <= 1949 ? year : null,
    mode: ['fly', 'walk', 'now'].includes(q.get('mode')) ? q.get('mode') : 'fly'};
})();

const viewer = new C.Viewer('scene', {
  baseLayer:false, geocoder:false, baseLayerPicker:false, timeline:false, animation:false,
  homeButton:false, sceneModePicker:false, navigationHelpButton:false, fullscreenButton:false,
  infoBox:false, selectionIndicator:false
});
const scene = viewer.scene, camera = scene.camera, globe = scene.globe;
/* fester Sommervormittag, damit die Hauswände schön schattiert sind */
viewer.clock.currentTime = C.JulianDate.fromIso8601('2026-06-21T13:30:00Z');   /* Sommernachmittag, warmes Licht aus Südwest */
viewer.clock.shouldAnimate = false;
let terrainOk = false;
window.__viewer = viewer;   /* für Fehlersuche in der Konsole */

/* Gelände nachladen; schlägt es fehl, bleibt die Karte flach sichtbar */
if (location.protocol === 'file:') {
  $('hud').textContent = 'Als Datei geöffnet – Gelände braucht eine Webadresse';
}
C.CesiumTerrainProvider.fromUrl('https://3d.geo.admin.ch/ch.swisstopo.terrain.3d/v1/', {requestVertexNormals:true})
  .then(tp => { viewer.terrainProvider = tp; terrainOk = true; globe.enableLighting = false; setTimeout(() => buildHouses(LINK ? LINK.c : [8.7290, 47.4997]), 500); })
  .catch(err => {
    console.error(err);
    $('hud').textContent = 'Gelände nicht erreichbar – flache Ansicht';
    $('terrMsg').hidden = false;
  });
globe.depthTestAgainstTerrain = true;
globe.baseColor = C.Color.fromCssColorString('#cfcabf');
globe.maximumScreenSpaceError = 2;
globe.tileCacheSize = 400;
/* Schatten: macht Gassen und Fassaden plastisch */
viewer.shadows = false;                                /* Schatten zittern beim Bewegen: nur auf Wunsch */
viewer.terrainShadows = C.ShadowMode.RECEIVE_ONLY;
scene.shadowMap.softShadows = true;
scene.shadowMap.size = 2048;
scene.shadowMap.maximumDistance = 150;
scene.shadowMap.darkness = 0.3;
let slowSince = 0;
scene.fog.enabled = true;
scene.postProcessStages.fxaa.enabled = true;          /* Kanten glätten */
if (scene.msaaSupported) scene.msaaSamples = 4;
scene.highDynamicRange = false;
/* Fernsicht (J): mehr Details in der Ferne gegen etwas weniger Bilder pro Sekunde */
let farView = true;
function setFarView(on){
  farView = on;
  globe.maximumScreenSpaceError = on ? 2 : 4;
  scene.fog.density = on ? 1.2e-4 : 6e-4;
  for (const t of [bldTs, specTs]) if (t) t.maximumScreenSpaceError = on ? 16 : 32;
}
let toastT;
function toast(t, ms = 1600){ const el = $('toast'); el.textContent = t; el.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => { el.hidden = true; }, ms); }

/* Unterlage, damit Lücken nicht schwarz bleiben */
const tile = (key, year) => {
  const s = SRC[key], t = s.fixed || s.ts(year);
  return new C.UrlTemplateImageryProvider({
    url:`https://wmts.geo.admin.ch/1.0.0/${s.layer}/default/${t}/3857/{z}/{x}/{y}.${s.fmt}`,
    tilingScheme:new C.WebMercatorTilingScheme(), maximumLevel:s.nz, credit:'© swisstopo'
  });
};
viewer.imageryLayers.addImageryProvider(tile('karte'));
let top = null;

/* Oberfläche & Jahr */
$('src').innerHTML = Object.keys(SRC).map(k=>`<option value="${k}">${SRC[k].name}</option>`).join('');
$('src').value = 'sieg';
function setRange(){
  const s = SRC[$('src').value];
  $('yWrap').hidden = !!s.fixed;
  if (!s.fixed){ $('yr').min = s.min; $('yr').max = s.max; $('yr').value = s.def; }
  /* Markierungen: die Kartenausgaben, aus denen Häuser gebaut werden */
  const marks = s.fixed ? [] : (EDITIONS_MARKS.filter(e => e >= s.min && e <= s.max));
  /* als Knöpfe: Antippen springt direkt zur Kartenausgabe (auf dem Handy gross) */
  const tk = $('ticks'); tk.textContent = '';
  for (const e of marks) {
    const b = document.createElement('button');
    b.type = 'button'; b.textContent = e; b.dataset.y = e;
    b.style.left = ((e - s.min) / (s.max - s.min) * 100).toFixed(2) + '%';
    b.setAttribute('aria-label', `Kartenausgabe ${e}`);
    b.addEventListener('click', () => { $('yr').value = e; $('yBig').textContent = e; applyYear(e); showLayer(); });
    tk.appendChild(b);
  }
  markTicks();
}
function markTicks(){
  const y = +$('yr').value, cur = EDITIONS_MARKS.filter(e => e <= y).pop();
  for (const b of $('ticks').children) b.setAttribute('aria-pressed', +b.dataset.y === cur);
}
function showLayer(){
  const key = $('src').value, s = SRC[key], y = +$('yr').value;
  $('yBig').textContent = s.fixed ? (key==='dufour' ? '1850' : 'heute') : (key==='luft' && y===1928 ? 1927 : y);
  $('yLbl').textContent = s.name;
  const next = viewer.imageryLayers.addImageryProvider(tile(key, y));
  const old = top; top = next;
  if (old) setTimeout(() => { if (old !== top) viewer.imageryLayers.remove(old, true); }, 1500);
}
let deb;
$('src').addEventListener('change', () => { setRange(); showLayer(); });
$('yr').addEventListener('input', () => { $('yBig').textContent = $('yr').value; applyYear(+$('yr').value); clearTimeout(deb); deb = setTimeout(showLayer, 250); });
setRange(); showLayer();
{ const tl = document.querySelector('.timeline'), setTl = () => document.documentElement.style.setProperty('--tl', (tl.offsetHeight + 8) + 'px');
  if (window.ResizeObserver) new ResizeObserver(setTl).observe(tl); setTl(); }

/* Heutige 3D-Objekte (aus, damit 1880 nicht mit Neubauten zugestellt ist) */
const tiles = {};
async function toggleTiles(id, url, on){
  try {
    if (!tiles[id]) { tiles[id] = await C.Cesium3DTileset.fromUrl(url); scene.primitives.add(tiles[id]); }
    tiles[id].show = on;
  } catch(e){ $('hud').textContent = '3D-Daten nicht erreichbar'; }
}
/* swissBUILDINGS3D: echte Häuser, gefiltert nach Baujahr aus dem Gebäuderegister (GWR) */
const BLD_URL = 'https://3d.geo.admin.ch/ch.swisstopo.swissbuildings3d.3d/v1/tileset.json';
const FACADE_FS = `
  float hsh(float n){ return fract(sin(n * 12.9898) * 43758.5453); }
  float h2(vec2 v){ return fract(sin(dot(v, vec2(12.9898, 78.233))) * 43758.5453); }
  void fragmentMain(FragmentInput fsInput, inout czm_modelMaterial material) {
    vec3 nWC = normalize((czm_inverseView * vec4(fsInput.attributes.normalEC, 0.0)).xyz);
    float id = float(fsInput.featureIds.featureId_0);
    float r = hsh(id + 1.0), r2 = hsh(id + 7.0), r3 = hsh(id + 13.0);
    vec3 p = fsInput.attributes.positionMC;
    vec3 upMC = normalize((czm_inverseModel * vec4(u_up, 0.0)).xyz);
    float nu = dot(nWC, u_up);

    /* ---- Dach: Biberschwanz-Ziegel in versetzten Reihen ---- */
    if (nu > 0.35) {
      vec3 alongW = cross(u_up, nWC);
      if (nu > 0.97 || length(alongW) < 0.05) {                 /* Flachdach: Kies */
        float g = h2(floor(vec2(dot(p, vec3(1.0, 0.0, 0.0)), dot(p, vec3(0.0, 1.0, 0.0))) * 4.0));
        material.diffuse = vec3(0.50, 0.48, 0.45) * (0.9 + 0.12 * g);
        return;
      }
      alongW = normalize(alongW);
      vec3 downW = normalize(cross(nWC, alongW));
      float a = dot(p, normalize((czm_inverseModel * vec4(alongW, 0.0)).xyz));
      float d = dot(p, normalize((czm_inverseModel * vec4(downW, 0.0)).xyz));
      if (u_blocky > 0.5) { a = (floor(a * 16.0) + 0.5) / 16.0; d = (floor(d * 16.0) + 0.5) / 16.0; }
      vec3 tile = r3 < 0.5 ? vec3(0.64, 0.29, 0.19) : r3 < 0.78 ? vec3(0.55, 0.25, 0.17) : r3 < 0.92 ? vec3(0.47, 0.33, 0.27) : vec3(0.38, 0.36, 0.35);
      float rowI = floor(d / 0.26);
      float row = fract(d / 0.26);
      float colF = fract(a / 0.17 + 0.5 * mod(rowI, 2.0));
      float tn = h2(vec2(floor(a / 0.17 + 0.5 * mod(rowI, 2.0)), rowI) + id);
      vec3 c = tile * (0.84 + 0.26 * tn);
      c *= 1.0 - 0.30 * smoothstep(0.72, 1.0, row);              /* Schattenkante unter jeder Reihe */
      c *= 1.0 - 0.10 * (step(colF, 0.05) + step(0.95, colF));
      float fwR = max(fwidth(d / 0.26), fwidth(a / 0.17));
      c = mix(c, tile * 0.95, smoothstep(0.15, 0.5, fwR));          /* weit weg: ruhige Dachfarbe */
      material.diffuse = c;
      return;
    }
    if (nu < -0.35) { return; }

    /* ---- Wand: Putz, Fenster mit Sprossen, Sims und Läden ---- */
    vec3 alongMC = normalize((czm_inverseModel * vec4(cross(u_up, nWC), 0.0)).xyz);
    float s = dot(p, alongMC), hgt = dot(p, upMC);
    if (u_blocky > 0.5) { s = (floor(s * 16.0) + 0.5) / 16.0; hgt = (floor(hgt * 16.0) + 0.5) / 16.0; }
    float fy = fract(hgt / 3.2), fx = fract(s / 2.6);
    vec2 cell = floor(vec2(s / 2.6, hgt / 3.2));
    vec3 plaster = r < 0.18 ? vec3(0.93, 0.82, 0.60) : r < 0.36 ? vec3(0.96, 0.94, 0.88) : r < 0.50 ? vec3(0.91, 0.74, 0.64)
                 : r < 0.66 ? vec3(0.94, 0.89, 0.72) : r < 0.80 ? vec3(0.80, 0.82, 0.76) : vec3(0.87, 0.79, 0.69);
    float dirt = u_blocky > 0.5 ? h2(floor(vec2(s, hgt) * 16.0)) : h2(floor(vec2(s, hgt) * 1.5));
    plaster *= 0.95 + 0.06 * dirt;
    float win   = step(0.34, fy) * step(fy, 0.80) * step(0.31, fx) * step(fx, 0.69);
    float frame = step(0.31, fy) * step(fy, 0.83) * step(0.28, fx) * step(fx, 0.72) * (1.0 - win);
    float sill  = step(0.29, fy) * step(fy, 0.33) * step(0.26, fx) * step(fx, 0.74);
    float shut  = step(0.34, fy) * step(fy, 0.80) * (step(0.17, fx) * step(fx, 0.27) + step(0.73, fx) * step(fx, 0.83));
    float bars  = win * max(step(abs(fx - 0.5), 0.014), step(abs(fy - 0.62), 0.012));
    vec3 shutCol = r2 < 0.55 ? vec3(0.22, 0.38, 0.24) : r2 < 0.8 ? vec3(0.55, 0.26, 0.18) : vec3(0.34, 0.33, 0.31);
    shutCol *= 0.92 + 0.12 * step(0.5, fract(fy * 9.0));          /* Lamellen */
    float wr = h2(cell + id);
    vec3 glass = mix(vec3(0.10, 0.14, 0.19), vec3(0.42, 0.52, 0.62), clamp((fy - 0.34) / 0.46, 0.0, 1.0) * (0.35 + 0.5 * wr));
    vec3 c = plaster;
    c = mix(c, vec3(0.97, 0.96, 0.92), frame);
    c = mix(c, vec3(0.80, 0.78, 0.74), sill);
    c = mix(c, shutCol, shut * step(0.35, r2));
    c = mix(c, glass, win);
    c = mix(c, vec3(0.95, 0.94, 0.90), bars);
    c *= 1.0 - 0.18 * step(0.80, fy) * step(fy, 0.83) * step(0.28, fx) * step(fx, 0.72);   /* Schatten unter dem Sturz */
    /* Fensterraster in der Ferne zu einer Mischfarbe auflösen, sonst flimmert es */
    float fwW = max(fwidth(s / 2.6), fwidth(hgt / 3.2));
    vec3 avg = mix(plaster, vec3(0.30, 0.36, 0.44), 0.17);
    c = mix(c, avg, smoothstep(0.08, 0.28, fwW));
    material.diffuse = c;
  }`;
const gwr = {years:new Map(), year:1880};
let bldTs = null;
const PLAIN = new Set(['Gebaeude Einzelhaus', 'Hochhaus', 'Im Bau']);   /* nur diese bekommen Wohnhaus-Fenster */
const isSpecial = f => !PLAIN.has(f.getProperty('OBJEKTART'));
const yearOk = f => {
  if ($('bld').checked) return true;
  if (!$('oldOn').checked) return false;
  const y = gwr.years.get(Number(f.getProperty('EGID')));
  return y !== undefined && y <= gwr.year;
};
let specTs = null, specColor = null, bldShader = null;
async function buildingLayer(){
  if (!bldTs) {
    bldTs = await C.Cesium3DTileset.fromUrl(BLD_URL);
    scene.primitives.add(bldTs);
    /* Fassaden: Putzfarbe je Haus, Fenster mit Rahmen und Läden pro Geschoss (im Shader, keine Zusatzgeometrie) */
    bldTs.customShader = new C.CustomShader({
      uniforms: { u_up: { type: C.UniformType.VEC3, value: C.Ellipsoid.WGS84.geodeticSurfaceNormal(C.Cartesian3.fromDegrees(8.729, 47.4997), new C.Cartesian3()) },
                  u_blocky: { type: C.UniformType.FLOAT, value: blocky ? 1 : 0 } },
      fragmentShaderText: FACADE_FS
    });
    bldTs.style = new C.Cesium3DTileStyle();
    bldTs.style.show = { evaluate: f => !isSpecial(f) && yearOk(f) };

    /* Kirchen, Türme, Kamine, Mauern: gleiche Daten, aber Stein statt Fensterraster */
    specTs = await C.Cesium3DTileset.fromUrl(BLD_URL);
    scene.primitives.add(specTs);
    specTs.colorBlendMode = C.Cesium3DTileColorBlendMode.MIX;
    specTs.colorBlendAmount = 0.6;
    specTs.style = new C.Cesium3DTileStyle();
    specTs.style.show = { evaluate: f => isSpecial(f) && yearOk(f) };
    const stone = C.Color.fromCssColorString('#d9d2c2'), brick = C.Color.fromCssColorString('#9a5a42');
    specColor = { evaluateColor: (f, res) => C.Color.clone(f.getProperty('OBJEKTART') === 'Hochkamin' ? brick : stone, res) };
    specTs.style.color = specColor;
    bldShader = bldTs.customShader;
    if (analysis) setAnalysis(analysis);
  }
  bldTs.show = specTs.show = $('bld').checked || $('oldOn').checked;
  bldTs.makeStyleDirty();
  specTs.makeStyleDirty();
}
$('bld').addEventListener('change', () => buildingLayer().catch(() => { $('hud').textContent = '3D-Gebäude nicht erreichbar'; }));
$('oldOn').addEventListener('change', () => buildingLayer().catch(() => {}));
$('genOn').addEventListener('change', () => applyYear(+$('yr').value || gwr.year));
$('blockOn').addEventListener('change', e => setBlocky(e.target.checked));
$('shadowOn').addEventListener('change', e => { viewer.shadows = e.target.checked; });
$('groundOn').addEventListener('change', () => { if (city && city.edition) makeGround(city.eds.get(city.edition)); });

/* LV95 → WGS84 (Näherungsformel von swisstopo) */
function lv95(E, N){
  const y = (E - 2600000) / 1e6, x = (N - 1200000) / 1e6;
  const l = 2.6779094 + 4.728982*y + 0.791484*y*x + 0.1306*y*x*x - 0.0436*y*y*y;
  const p = 16.9023892 + 3.238272*x - 0.270978*y*y - 0.002528*x*x - 0.0447*y*y*x - 0.0140*x*x*x;
  return [l * 100 / 36, p * 100 / 36];
}
/* Gebäuderegister im Gebiet abfragen: EGID → Baujahr und Lage */
const PERIOD = {8011:1880, 8012:1932, 8013:1953, 8014:1966, 8015:1976, 8016:1983, 8017:1988, 8018:1993, 8019:1998, 8020:2003, 8021:2008, 8022:2013, 8023:2018};
async function loadGwr(w, s, e, n, onProgress){
  const boxes = [], N = 4;
  for (let i = 0; i < N; i++) for (let j = 0; j < N; j++)
    boxes.push([w + (e-w)*i/N, s + (n-s)*j/N, w + (e-w)*(i+1)/N, s + (n-s)*(j+1)/N]);
  const out = new Map(); let done = 0;
  const one = async b => {
    const env = b.join(',');
    for (let off = 0; off < 6000; off += 200) {
      const u = `https://api3.geo.admin.ch/rest/services/ech/MapServer/identify?layers=all:ch.bfs.gebaeude_wohnungs_register&geometryType=esriGeometryEnvelope&geometry=${env}&sr=4326&tolerance=0&returnGeometry=false&limit=200&offset=${off}&mapExtent=${env}&imageDisplay=100,100,96`;
      let res = [];
      try { res = (await (await fetch(u)).json()).results || []; } catch (err) { break; }
      for (const r of res) {
        const a = r.attributes, id = Number(a.egid);
        if (!id || out.has(id) || (a.gstat && a.gstat !== 1004)) continue;
        const y = a.gbauj || PERIOD[a.gbaup];
        if (!y || !a.gkode) continue;
        const [lo, la] = lv95(a.gkode, a.gkodn);
        out.set(id, {y, lon:lo, lat:la, exact: !!a.gbauj, adr: (a.strname_deinr || `${a.strname || ''} ${a.deinr || ''}`).trim()});
      }
      if (res.length < 200) break;
    }
    onProgress(++done, boxes.length);
  };
  const queue = boxes.slice();
  await Promise.all(Array.from({length:6}, async () => { while (queue.length) await one(queue.shift()); }));
  return out;
}
$('veg').addEventListener('change', e => toggleTiles('v','https://3d.geo.admin.ch/ch.swisstopo.vegetation.3d/v1/tileset.json', e.target.checked));

/* ---------- Häuser aus der Siegfriedkarte bauen ---------- */
const Z = 16, TS = 256, WORLD = TS * 2 ** Z, CELL = 2;          /* 2 Pixel ≈ 3 m pro Block */
const lon2x = lon => (lon + 180) / 360 * WORLD;
const lat2y = lat => { const r = lat * Math.PI / 180; return (1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2 * WORLD; };
const x2lon = x => x / WORLD * 360 - 180;
const y2lat = y => 180 / Math.PI * Math.atan(Math.sinh(Math.PI * (1 - 2 * y / WORLD)));
const WALL = ['#d9ccb2','#cdbd9f','#e4d9c3','#c4b393','#d2c8b8','#bfa98a'];
const ROOF = ['#8e4a35','#7c3f2e','#9a5a3f','#6e4636'];
let city = null;   /* Raster für Wände: px0, py0, cw, ch, roof (Float32, NaN = frei) */

function roofAt(lon, lat){
  if (!city) return null;
  const cx = Math.floor((lon2x(lon) - city.px0) / CELL), cy = Math.floor((lat2y(lat) - city.py0) / CELL);
  if (cx < 0 || cy < 0 || cx >= city.cw || cy >= city.ch) return null;
  const r = city.roof[cy * city.cw + cx];
  return Number.isNaN(r) ? null : r;
}
const loadImg = url => new Promise(res => { const i = new Image(); i.crossOrigin = 'anonymous'; i.onload = () => res(i); i.onerror = () => res(null); i.src = url; });
const say = t => { $('bStat').textContent = t; if (!$('intro').classList.contains('off')) $('introSt').textContent = t; };
const setProg = f => { const w = Math.round(Math.max(0, Math.min(1, f)) * 100) + '%'; $('progBar').style.width = w; $('introBar').style.width = w; };
const hash = n => ((n * 2654435761) >>> 0) / 4294967296;

function centerLonLat(){
  const ray = camera.getPickRay(new C.Cartesian2(canvas.clientWidth / 2, canvas.clientHeight / 2));
  const p = ray && globe.pick(ray, scene);
  const c = C.Cartographic.fromCartesian(p || camera.position);
  return [C.Math.toDegrees(c.longitude), C.Math.toDegrees(c.latitude)];
}

/* Siegfried-Ausgaben, zwischen denen der Jahr-Regler sofort umschaltet */
const EDITIONS = [1880, 1900, 1920, 1940];
let buildToken = 0;

/* ---------- Zwischenspeicher im Browser (IndexedDB): zweiter Besuch baut sofort ---------- */
let idbP = null;
function idb(){
  return idbP || (idbP = new Promise(res => {
    try {
      const rq = indexedDB.open('zeitreise-schweiz', 1);
      rq.onupgradeneeded = () => rq.result.createObjectStore('cache');
      rq.onsuccess = () => res(rq.result);
      rq.onerror = () => res(null);
    } catch (e) { res(null); }
  }));
}
async function idbGet(k){
  const db = await idb(); if (!db) return null;
  return new Promise(res => { try { const rq = db.transaction('cache').objectStore('cache').get(k); rq.onsuccess = () => res(rq.result || null); rq.onerror = () => res(null); } catch (e) { res(null); } });
}
async function idbPut(k, v){
  const db = await idb(); if (!db) return;
  try { db.transaction('cache', 'readwrite').objectStore('cache').put(v, k); } catch (e) {}
}

/* Kartenbild auswerten (läuft im Web Worker, sonst im Hauptfaden): Hausflächen, Wasser, zusammenhängende Häuser */
function analyseMap(px, W, H, cw, ch, CELL){
  const dark = new Uint8Array(W * H);
  for (let i = 0; i < W * H; i++) {
    const r = px[i*4], gg = px[i*4+1], b = px[i*4+2];
    dark[i] = (Math.max(r, gg, b) < 100 && b < r + 30) ? 1 : 0;
  }
  const morph = (src, all) => {
    const out = new Uint8Array(W * H);
    for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
      let s = 0;
      for (let k = -1; k <= 1; k++) for (let j = -1; j <= 1; j++) s += src[(y + k) * W + x + j];
      out[y * W + x] = all ? (s === 9 ? 1 : 0) : (s > 0 ? 1 : 0);
    }
    return out;
  };
  const solid = morph(morph(dark, true), false);

  /* Blockraster und zusammenhängende Häuser */
  const occ = new Uint8Array(cw * ch), wat = new Uint8Array(cw * ch);
  for (let cy = 0; cy < ch; cy++) for (let cx = 0; cx < cw; cx++) {
    let s = 0, bl = 0;
    for (let k = 0; k < CELL; k++) for (let j = 0; j < CELL; j++) {
      const q = (cy * CELL + k) * W + cx * CELL + j;
      s += solid[q];
      if (px[q*4+2] > px[q*4] + 35 && px[q*4+2] > 110) bl++;
    }
    occ[cy * cw + cx] = s >= 3 ? 1 : 0;
    wat[cy * cw + cx] = bl >= 2 ? 1 : 0;
  }
  const comp = new Int32Array(cw * ch).fill(-1), comps = [];
  for (let i = 0; i < cw * ch; i++) {
    if (!occ[i] || comp[i] >= 0) continue;
    const id = comps.length, stack = [i]; comp[i] = id;
    let n = 0, sx = 0, sy = 0, x0 = 1e9, x1 = -1, y0 = 1e9, y1 = -1, inner = 0;
    while (stack.length) {
      const c = stack.pop(), x = c % cw, y = (c - x) / cw;
      n++; sx += x; sy += y;
      if (x > 0 && y > 0 && x < cw - 1 && y < ch - 1 && occ[c - 1] && occ[c + 1] && occ[c - cw] && occ[c + cw]) inner++; x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
      for (const [nx, ny] of [[x+1,y],[x-1,y],[x,y+1],[x,y-1]])
        if (nx >= 0 && ny >= 0 && nx < cw && ny < ch) { const q = ny * cw + nx; if (occ[q] && comp[q] < 0) { comp[q] = id; stack.push(q); } }
    }
    /* Formmerkmale gegen Fehlklötze: Schrift und Linien sind dünn, lang oder schräg und locker gefüllt */
    const bw = x1 - x0 + 1, bh = y1 - y0 + 1, lng = Math.max(bw, bh), shrt = Math.min(bw, bh), fill = n / (bw * bh);
    const bad = (shrt <= 1 && lng >= 5)                 /* gerade Linie, ein Block breit */
             || (n < 200 && fill < 0.22 && lng >= 8)    /* schräge Linie oder Schriftzug */
             || (inner === 0 && lng >= 12);             /* langer, dünner Strich ohne Inneres */
    comps.push({n, cx: sx / n, cy: sy / n, x0, x1, y0, y1, bad});
  }
  /* Häuser sind kompakt; Gleisfelder und Strassennetze sind dünn gefüllte Gitter */
  const keep = comps.map(c => c.n >= 6 && !(c.n > 200 && c.n / ((c.x1 - c.x0 + 1) * (c.y1 - c.y0 + 1)) < 0.3));
  return {occ, wat, comp, comps, keep};
}
let mapWorker;
try {
  mapWorker = new Worker(URL.createObjectURL(new Blob([`const analyseMap = ${analyseMap.toString()};
self.onmessage = e => { const d = e.data, r = analyseMap(d.px, d.W, d.H, d.cw, d.ch, d.CELL);
  self.postMessage({id: d.id, r}, [r.occ.buffer, r.wat.buffer, r.comp.buffer]); };`], {type: 'text/javascript'})));
} catch (e) { mapWorker = null; }
let mapJob = 0;
const mapWait = new Map();
if (mapWorker) {
  mapWorker.onmessage = e => { const f = mapWait.get(e.data.id); mapWait.delete(e.data.id); if (f) f(e.data.r); };
  mapWorker.onerror = () => { mapWorker = null; for (const f of mapWait.values()) f(null); mapWait.clear(); };
}
async function analyseAsync(px, W, H, cw, ch){
  if (mapWorker) {
    const copy = new Uint8ClampedArray(px);   /* Kopie verschicken, das Original bleibt für den Ersatzweg */
    const r = await new Promise(res => { const id = ++mapJob; mapWait.set(id, res); mapWorker.postMessage({id, px: copy, W, H, cw, ch, CELL}, [copy.buffer]); });
    if (r) return r;
  }
  return analyseMap(px, W, H, cw, ch, CELL);
}

/* Eine Kartenausgabe auswerten: Hausflächen → Blöcke mit Stufendach und Fenstern */
async function buildEdition(area, year, reg, token){
  const {px0, py0, W, H, cw, ch, lat} = area;
  /* Zwischenspeicher: ausgewertete Kartenausgabe (v1 = Stand des Formfilters; bei Änderung hochzählen) */
  const ckey = `ed:v1:${year}:${px0}:${py0}:${W}:${H}`;
  let res = await idbGet(ckey);
  if (!res || !res.occ || res.occ.length !== cw * ch) {
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    const g = cv.getContext('2d', {willReadFrequently:true});
    g.fillStyle = '#fff'; g.fillRect(0, 0, W, H);
    const jobs = []; let miss = 0;
    for (let ty = Math.floor(py0 / TS); ty <= Math.floor((py0 + H - 1) / TS); ty++)
      for (let tx = Math.floor(px0 / TS); tx <= Math.floor((px0 + W - 1) / TS); tx++)
        jobs.push(loadImg(`https://wmts.geo.admin.ch/1.0.0/ch.swisstopo.hiks-siegfried/default/${year}/3857/${Z}/${tx}/${ty}.png`)
          .then(img => { if (img) g.drawImage(img, tx * TS - px0, ty * TS - py0); else miss++; }));
    await Promise.all(jobs);
    if (token !== buildToken) return null;
    /* schwarze Flächen, dünne Linien und Schrift wegfiltern */
    const px = g.getImageData(0, 0, W, H).data;
    res = await analyseAsync(px, W, H, cw, ch);
    if (!miss) idbPut(ckey, res);          /* nur vollständige Auswertungen merken */
  }
  if (token !== buildToken) return null;
  /* Kopien: Häuser und Auswahl werden unten verändert, der Zwischenspeicher bleibt unberührt */
  const {occ, wat, comp} = res, comps = res.comps.map(c => ({...c})), keep = res.keep.slice();
  if (token !== buildToken) return null;

  /* heute noch stehende Häuser übernimmt das echte 3D-Modell */
  const real = new Uint8Array(comps.length);
  let nOld = 0;
  for (const r of reg.values()) {
    if (r.y > year) continue;
    nOld++;
    const cx = Math.floor((lon2x(r.lon) - px0) / CELL), cy = Math.floor((lat2y(r.lat) - py0) / CELL);
    for (let k = -2; k <= 2; k++) for (let j = -2; j <= 2; j++) {
      const xx = cx + j, yy = cy + k;
      if (xx >= 0 && yy >= 0 && xx < cw && yy < ch) { const id = comp[yy * cw + xx]; if (id >= 0) real[id] = 1; }
    }
  }
  /* auffällige Formen nur verwerfen, wenn dort kein echtes Haus steht (sonst fehlt dessen Wand) */
  let nDrop = 0;
  comps.forEach((c, i) => { if (keep[i] && c.bad && !real[i]) { keep[i] = false; nDrop++; } });

  /* Bodenhöhe, Geschosse, Farben, Dachrichtung */
  const pts = comps.map(c => C.Cartographic.fromDegrees(x2lon(px0 + (c.cx + .5) * CELL), y2lat(py0 + (c.cy + .5) * CELL)));
  if (terrainOk) await C.sampleTerrainMostDetailed(viewer.terrainProvider, pts);
  if (token !== buildToken) return null;
  const mpp = 156543.03392 * Math.cos(lat * Math.PI / 180) / 2 ** Z, cm = CELL * mpp;
  comps.forEach((c, id) => {
    const r = hash(id + 1 + year);
    c.floors = c.n > 700 ? 3 : c.n > 150 ? 3 + Math.round(r) : c.n > 35 ? 2 + Math.round(r * 2) : 2;
    c.base = (pts[id].height || 0) - 1.5;
    c.h = c.floors * 3.3 + 1.5;
    c.wall = C.Color.fromCssColorString(WALL[Math.floor(r * WALL.length)]);
    c.roof = C.Color.fromCssColorString(c.n > 700 ? '#5c5a56' : ROOF[Math.floor(hash(id + 77) * ROOF.length)]);
    c.ew = (c.x1 - c.x0) >= (c.y1 - c.y0);          /* First in Längsrichtung */
    c.half = c.ew ? (c.y1 - c.y0 + 1) / 2 : (c.x1 - c.x0 + 1) / 2;
    c.mid = c.ew ? (c.y0 + c.y1) / 2 : (c.x0 + c.x1) / 2;
    c.hall = c.n > 700;
  });
  /* Minecraft-Stufendach: je Block-Reihe näher am First eine Stufe höher */
  const roofH = (c, line) => {
    if (c.hall) return 1.0;
    const steps = Math.max(0, Math.floor(c.half - Math.abs(line - c.mid) - 0.01));
    return Math.min(7, 0.9 + steps * cm * 0.65);
  };

  const roof = new Float32Array(cw * ch).fill(NaN);
  const inst = [], parts = [];   /* parts: [id, Farbe, Dach?] für das Hervorheben */
  const box = (lonC, latC, w, d, z0, hgt, col, meta) => {
    inst.push(new C.GeometryInstance({
      id: meta,
      geometry: C.BoxGeometry.fromDimensions({dimensions:new C.Cartesian3(w, d, hgt), vertexFormat:C.PerInstanceColorAppearance.VERTEX_FORMAT}),
      modelMatrix: C.Transforms.eastNorthUpToFixedFrame(C.Cartesian3.fromDegrees(lonC, latC, z0 + hgt / 2)),
      attributes: {color: C.ColorGeometryInstanceAttribute.fromColor(col)}
    }));
  };
  const tint = (col, f) => new C.Color(Math.min(1, col.red * f), Math.min(1, col.green * f), Math.min(1, col.blue * f), 1);
  const cellLon = x => x2lon(px0 + (x + .5) * CELL), cellLat = y => y2lat(py0 + (y + .5) * CELL);
  const mLat = 1 / 111320, mLon = 1 / (111320 * Math.cos(lat * Math.PI / 180));

  /* Wände und Dach: Ost-West-Häuser zeilenweise, Nord-Süd-Häuser spaltenweise */
  const pass = (alongX) => {
    const outer = alongX ? ch : cw, inner = alongX ? cw : ch;
    for (let a = 0; a < outer; a++) {
      let b = 0;
      while (b < inner) {
        const at = k => alongX ? comp[a * cw + k] : comp[k * cw + a];
        const id = at(b);
        if (id < 0 || !keep[id] || comps[id].ew !== alongX) { b++; continue; }
        let n = 1; while (b + n < inner && at(b + n) === id) n++;
        const c = comps[id], rh = roofH(c, a), top = c.base + c.h + rh;
        for (let k = 0; k < n; k++) roof[alongX ? a * cw + b + k : (b + k) * cw + a] = top;
        if (!real[id]) {
          const lonC = alongX ? x2lon(px0 + (b + n / 2) * CELL) : cellLon(a);
          const latC = alongX ? cellLat(a) : y2lat(py0 + (b + n / 2) * CELL);
          const w = alongX ? n * cm : cm, d = alongX ? cm : n * cm;
          const shade = 0.94 + hash(a * 7919 + b + year) * 0.1;
          const wc = tint(c.wall, shade), rc = tint(c.roof, shade * (1 - 0.06 * ((Math.abs(a - c.mid) | 0) % 2)));
          const mw = {gen: year, floors: c.floors, hall: c.hall}, mr = {gen: year, floors: c.floors, hall: c.hall};
          box(lonC, latC, w, d, c.base, c.h, wc, mw);
          box(lonC, latC, w, d, c.base + c.h, rh, rc, mr);
          parts.push([mw, wc, 0], [mr, rc, 1]);
        }
        b += n;
      }
    }
  };
  pass(true); pass(false);

  /* Fenster: auf jeder Aussenwand ein Fenster pro Block und Geschoss, im Erdgeschoss eine Tür */
  const glass = C.Color.fromCssColorString('#2a3038'), door = C.Color.fromCssColorString('#4a3326');
  let nGen = 0;
  const doorDone = new Uint8Array(comps.length);
  for (let cy = 0; cy < ch; cy++) for (let cx = 0; cx < cw; cx++) {
    const id = comp[cy * cw + cx];
    if (id < 0 || !keep[id] || real[id]) continue;
    const c = comps[id];
    for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
      const nx = cx + dx, ny = cy + dy;
      if (nx >= 0 && ny >= 0 && nx < cw && ny < ch && comp[ny * cw + nx] === id) continue;
      const off = cm / 2 + 0.12;
      const lonW = cellLon(cx) + dx * off * mLon, latW = cellLat(cy) - dy * off * mLat;   /* y wächst nach Süden */
      const w = dx ? 0.2 : 1.1, d = dx ? 1.1 : 0.2;
      for (let f = 0; f < c.floors; f++) {
        if (c.hall && f > 0) break;
        const z = c.base + 1.5 + f * 3.3;
        if (f === 0 && !doorDone[id] && dy === 1 && !c.hall) { box(lonW, latW, w, d, z, 2.2, door); doorDone[id] = 1; continue; }
        box(lonW, latW, c.hall ? (dx ? 0.14 : 2.4) : w, c.hall ? (dx ? 2.4 : 0.14) : d, z + (c.hall ? 0.8 : 1.0), c.hall ? 2.6 : 1.4, glass);
      }
    }
  }
  comps.forEach((c, i) => { if (keep[i] && !real[i]) nGen++; });
  /* für den Export: Mittelpunkt, Fläche und geschätzte Geschosse der rekonstruierten Häuser */
  const recs = [];
  comps.forEach((c, i) => { if (keep[i] && !real[i]) recs.push({lon: x2lon(px0 + (c.cx + .5) * CELL), lat: y2lat(py0 + (c.cy + .5) * CELL), m2: Math.round(c.n * cm * cm), floors: c.hall ? 1 : c.floors}); });

  const prim = inst.length ? scene.primitives.add(new C.Primitive({
    geometryInstances: inst,
    appearance: new C.PerInstanceColorAppearance({flat:false, translucent:false}),
    asynchronous: true,
    shadows: C.ShadowMode.ENABLED
  })) : null;
  if (prim) prim.show = false;
  return {year, prim, roof, nGen, nOld, occ, wat, parts, hl: false, nDrop, recs};
}

/* ---------- Boden: Pflaster in Gassen und auf Plätzen, sonst Wiese, Bäche blau ---------- */
const ground = {prim:null};
let blocky = false;
function setBlocky(on){
  blocky = on; $('blockOn').checked = on;
  if (bldTs && bldTs.customShader) bldTs.customShader.setUniform('u_blocky', on ? 1 : 0);
  if (city && city.edition) makeGround(city.eds.get(city.edition));
}
const GROUND_FS = `
czm_material czm_getMaterial(czm_materialInput mi) {
  czm_material m = czm_getDefaultMaterial(mi);
  vec2 st = mi.st;
  vec4 cls = texture(image, st);
  vec2 g = st * repeat;
  g.x += 0.5 * step(1.0, mod(floor(g.y), 2.0));
  vec2 f = fract(g);
  float edge = min(min(f.x, 1.0 - f.x), min(f.y, 1.0 - f.y));
  float n = fract(sin(dot(floor(g), vec2(12.9898, 78.233))) * 43758.5453);
  vec3 cob = mix(vec3(0.30, 0.29, 0.27), vec3(0.60, 0.57, 0.52) * (0.82 + 0.3 * n), smoothstep(0.04, 0.14, edge));
  vec2 gq = floor(st * repeat * 0.5);
  float gn = fract(sin(dot(gq, vec2(4.1, 7.7))) * 10000.0);
  float gn2 = fract(sin(dot(floor(st * repeat * 0.05), vec2(2.3, 5.9))) * 10000.0);
  vec3 grass = vec3(0.34, 0.50, 0.24) * (0.82 + 0.22 * gn) * (0.9 + 0.15 * gn2);
  float wv = 0.5 + 0.5 * sin(dot(st * repeat, vec2(0.9, 0.4)));
  vec3 water = mix(vec3(0.20, 0.36, 0.48), vec3(0.30, 0.48, 0.60), wv);
  /* in der Ferne Muster ausblenden, sonst flimmert es */
  /* Minecraft-Look: 1-m-Blöcke mit 16 x 16 Pixeln, jedes Pixel leicht anders getönt */
  if (blocky > 0.5) {
    vec2 mtr = st * repeat * 0.22;                     /* Meter */
    vec2 pxc = floor(mtr * 16.0);
    float pn = fract(sin(dot(pxc, vec2(12.9898, 78.233))) * 43758.5453);
    float pn2 = fract(sin(dot(floor(pxc / 4.0), vec2(7.13, 3.71))) * 9631.17);
    vec2 inb = fract(mtr);
    float seam = 1.0 - 0.18 * (step(inb.x, 1.0/16.0) + step(inb.y, 1.0/16.0));
    /* Steine à 4 x 4 Pixel mit dunkler Fuge, wie Minecraft-Pflasterstein */
    vec2 sp = fract(pxc / 4.0);
    float fuge = step(sp.x, 0.2) + step(sp.y, 0.2);
    float sn = fract(sin(dot(floor(pxc / 4.0), vec2(3.7, 9.1))) * 7351.3);
    cob = mix(vec3(0.52, 0.50, 0.47), vec3(0.66, 0.64, 0.60), sn) * (0.95 + 0.07 * pn) * (fuge > 0.5 ? 0.78 : 1.0) * seam;
    grass = vec3(0.40, 0.56, 0.27) * (0.86 + 0.2 * pn) * (pn2 < 0.12 ? 0.9 : 1.0);
    water = vec3(0.20, 0.34, 0.75) * (0.85 + 0.2 * pn);
  }
  float far = max(smoothstep(25.0, 120.0, length(mi.positionToEyeEC)), smoothstep(0.2, 0.6, max(fwidth(g.x), fwidth(g.y))));
  cob = mix(cob, vec3(0.50, 0.48, 0.44), far);
  grass = mix(grass, vec3(0.36, 0.50, 0.26), far * 0.8);
  vec3 col = mix(grass, cob, cls.r);
  col = mix(col, water, cls.g);
  m.diffuse = col;
  m.alpha = 1.0;
  return m;
}`;
function makeGround(ed){
  if (ground.prim) { scene.primitives.remove(ground.prim); ground.prim = null; }
  city.groundFor = ed.year;
  if (!$('groundOn').checked) return;
  const {cw, ch, px0, py0} = city;
  /* Abstand zum nächsten Haus: bis rund 19 m ist es Gasse oder Platz */
  const dist = new Int16Array(cw * ch).fill(99), q = [];
  for (let i = 0; i < cw * ch; i++) if (ed.occ[i]) { dist[i] = 0; q.push(i); }
  for (let h = 0; h < q.length; h++) {
    const i = q[h], x = i % cw, y = (i - x) / cw, dd = dist[i] + 1;
    if (dd > 6) continue;
    for (const [nx, ny] of [[x+1,y],[x-1,y],[x,y+1],[x,y-1]])
      if (nx >= 0 && ny >= 0 && nx < cw && ny < ch && dist[ny * cw + nx] > dd) { dist[ny * cw + nx] = dd; q.push(ny * cw + nx); }
  }
  const cv = document.createElement('canvas'); cv.width = cw; cv.height = ch;
  const g = cv.getContext('2d'), img = g.createImageData(cw, ch);
  for (let i = 0; i < cw * ch; i++) {
    img.data[i*4]   = dist[i] <= 6 ? 255 : 0;
    img.data[i*4+1] = ed.wat[i] ? 255 : 0;
    img.data[i*4+3] = 255;
  }
  g.putImageData(img, 0, 0);
  const west = x2lon(px0), east = x2lon(px0 + cw * CELL), north = y2lat(py0), south = y2lat(py0 + ch * CELL);
  const mpp = 156543.03392 * Math.cos(city.center[1] * Math.PI / 180) / 2 ** Z;
  const stone = 0.22;                                         /* Pflasterstein in Metern */
  const material = new C.Material({ fabric: { uniforms: { blocky: blocky ? 1 : 0, image: cv, repeat: new C.Cartesian2(cw * CELL * mpp / stone, ch * CELL * mpp / stone) }, source: GROUND_FS } });
  ground.prim = scene.primitives.add(new C.GroundPrimitive({
    geometryInstances: new C.GeometryInstance({ geometry: new C.RectangleGeometry({ rectangle: C.Rectangle.fromDegrees(west, south, east, north), vertexFormat: C.MaterialAppearance.MaterialSupport.TEXTURED.vertexFormat }) }),
    appearance: new C.MaterialAppearance({ material, materialSupport: C.MaterialAppearance.MaterialSupport.TEXTURED }),
    classificationType: C.ClassificationType.TERRAIN
  }));
}

/* Rekonstruierte Häuser hervorheben: Wände und Dächer bläulich, damit sie sich von belegten abheben */
const HL_WALL = C.Color.fromCssColorString('#9fbfe0'), HL_ROOF = C.Color.fromCssColorString('#4a74a6');
function recolor(ed, on){
  ed.hl = on;
  const tmp = new C.Color();
  for (const [id, col, isRoof] of ed.parts) {
    const at = ed.prim.getGeometryInstanceAttributes(id);
    if (!at) continue;
    const c = on ? C.Color.lerp(col, isRoof ? HL_ROOF : HL_WALL, 0.7, tmp) : col;
    at.color = C.ColorGeometryInstanceAttribute.toValue(c, at.color);
  }
}
$('recHl').addEventListener('change', e => { $('lgRec').style.background = e.target.checked ? '#9fbfe0' : '#bfa98a'; });

/* ---------- Analyse-Modus: Gebäude nach Bauepoche (Baujahr bzw. Bauperiode im GWR) ---------- */
const EPOCHS = [
  {max: 1849, label: 'vor 1850', col: '#5b2a1a'}, {max: 1879, label: '1850–1879', col: '#93401f'},
  {max: 1899, label: '1880–1899', col: '#c8662c'}, {max: 1918, label: '1900–1918', col: '#e3a23f'},
  {max: 1945, label: '1919–1945', col: '#cdbf3e'}, {max: 1980, label: '1946–1980', col: '#79ad62'},
  {max: 2000, label: '1981–2000', col: '#348a86'}, {max: Infinity, label: 'ab 2001', col: '#2f5c9c'}];
const EP_OLD = {label: 'vor 1919, Jahr unbekannt', col: '#b67f95'}, EP_NONE = {label: 'ohne Baujahr', col: '#9b9b9b'};
EPOCHS.forEach(e => { e.c = C.Color.fromCssColorString(e.col); }); EP_OLD.c = C.Color.fromCssColorString(EP_OLD.col); EP_NONE.c = C.Color.fromCssColorString(EP_NONE.col);
const epochOf = r => !r ? EP_NONE : (!r.exact && r.y === PERIOD[8011]) ? EP_OLD : EPOCHS.find(e => r.y <= e.max);
const epochColor = { evaluateColor: (f, res) => C.Color.clone(epochOf(gwr.info && gwr.info.get(Number(f.getProperty('EGID')))).c, res) };
/* «Neu seit der letzten Kartenausgabe»: belegte Häuser mit genauem Baujahr zwischen vorheriger Ausgabe und gewähltem Jahr */
let newFrom = null;
const NEW_C = C.Color.fromCssColorString('#22a35a'), OLD_C = C.Color.fromCssColorString('#d6d1c6');
const newColor = { evaluateColor: (f, res) => {
  const r = gwr.info && gwr.info.get(Number(f.getProperty('EGID')));
  return C.Color.clone(newFrom !== null && r && r.exact && r.y > newFrom && r.y <= gwr.year ? NEW_C : OLD_C, res);
} };
let analysis = false;   /* false, 'epoch' oder 'new' */
function setAnalysis(mode){
  analysis = mode;
  const on = !!mode, col = mode === 'new' ? newColor : epochColor;
  $('epochOn').checked = mode === 'epoch'; $('newOn').checked = mode === 'new';
  $('epochBox').hidden = !on;
  if (bldTs && specTs) {
    bldTs.customShader = on ? undefined : bldShader;
    for (const t of [bldTs, specTs]) {
      t.colorBlendMode = C.Cesium3DTileColorBlendMode.MIX;
      t.colorBlendAmount = on ? 0.85 : 0.6;
    }
    if (!on) bldTs.colorBlendMode = C.Cesium3DTileColorBlendMode.HIGHLIGHT;
    bldTs.style.color = on ? col : undefined;
    specTs.style.color = on ? col : specColor;
    bldTs.makeStyleDirty(); specTs.makeStyleDirty();
  }
  updateStats();
}
let stats = null;   /* letzte Zählung für den CSV-Export */
function updateStats(){
  if (!analysis) return;
  stats = null;
  const list = $('epochList'); list.textContent = '';
  if (analysis === 'new') {
    const cur = present ? Infinity : gwr.year;
    newFrom = present ? EDITIONS[EDITIONS.length - 1] : (EDITIONS.filter(e => e < (EDITIONS.filter(x => x <= cur).pop() ?? EDITIONS[0])).pop() ?? null);
    if (newFrom === null) { $('epochSum').textContent = `Für ${gwr.year} gibt es keine frühere Kartenausgabe zum Vergleich. Zieh den Regler auf 1900 oder später.`; return; }
    let k = 0; if (gwr.info) for (const r of gwr.info.values()) if (r.exact && r.y > newFrom && r.y <= gwr.year) k++;
    const row = document.createElement('div'), sw = document.createElement('i'), lab = document.createElement('span'), num = document.createElement('b');
    sw.style.background = '#22a35a'; lab.textContent = `neu ${newFrom + 1}–${present ? 'heute' : gwr.year}`; num.textContent = k;
    row.append(sw, lab, num); list.appendChild(row);
    let all = 0; if (gwr.info) for (const r of gwr.info.values()) if (r.y <= gwr.year) all++;
    stats = {kind: 'neu', rows: [{label: lab.textContent, n: k}, {label: `bis ${newFrom} oder ohne genaues Baujahr`, n: all - k}], total: all};
    $('epochSum').textContent = `Grün: belegte Gebäude mit genauem Baujahr nach der Kartenausgabe ${newFrom}, die heute noch stehen. Abgerissene Neubauten dieser Zeit fehlen. Quelle: GWR (BFS).`;
    return;
  }
  const all = [...EPOCHS, EP_OLD], n = new Map(all.map(e => [e, 0]));
  let total = 0;
  if (gwr.info) for (const r of gwr.info.values()) if (r.y <= gwr.year) { n.set(epochOf(r), n.get(epochOf(r)) + 1); total++; }
  const mx = Math.max(1, ...n.values());
  for (const e of all) {
    if (!n.get(e)) continue;
    const row = document.createElement('div'), sw = document.createElement('i'), lab = document.createElement('span'), num = document.createElement('b');
    const bar = document.createElement('s'), fill = document.createElement('u');
    sw.style.background = e.col; lab.textContent = e.label; num.textContent = n.get(e);
    fill.style.width = (n.get(e) / mx * 100).toFixed(1) + '%'; fill.style.background = e.col; bar.appendChild(fill);
    row.append(sw, lab, num, document.createElement('span'), bar);
    list.appendChild(row);
  }
  stats = {kind: 'epoche', rows: all.map(e => ({label: e.label, n: n.get(e)})), total};
  const ed = city && city.edition ? city.eds.get(city.edition) : null;
  $('epochSum').textContent = `${total} belegte Gebäude bis ${present ? 'heute' : gwr.year}` + (ed && !present ? ` · dazu ${ed.nGen} rekonstruierte (Karte ${ed.year}), nicht eingefärbt` : '') + '. Quelle: GWR (BFS).';
}
$('epochOn').addEventListener('change', e => setAnalysis(e.target.checked ? 'epoch' : false));
$('newOn').addEventListener('change', e => setAnalysis(e.target.checked ? 'new' : false));
/* Statistik als CSV: Epoche, Anzahl, Anteil, Jahr, Ort, Lage und Quelle (für Forschung und Unterricht) */
$('epochCsv').addEventListener('click', () => {
  if (!stats || !gwr.info || !city) { toast('Zuerst ein Gebiet bauen'); return; }
  const yr = present ? 'heute' : gwr.year, [E, N] = toLV95(city.center[0], city.center[1]);
  const esc = v => { const t = String(v ?? ''); return /[;"\n]/.test(t) ? '"' + t.replace(/"/g, '""') + '"' : t; };
  const pct = v => stats.total ? (v / stats.total * 100).toFixed(1) : '0.0';
  const lines = [['auswertung', 'kategorie', 'anzahl', 'anteil_prozent', 'stand_jahr', 'ort', 'mitte_e_lv95', 'mitte_n_lv95', 'gebiet', 'quelle'].join(';'),
    ...stats.rows.map(r => [stats.kind, r.label, r.n, pct(r.n), yr, placeName, Math.round(E), Math.round(N), 'rund 1,3 x 1,3 km um die Mitte',
      'Gebäuderegister GWR (BFS), nur heute noch stehende Gebäude; Bauperiode «vor 1919» ohne genaues Jahr'].map(esc).join(';')),
    ['summe', 'alle belegten Gebäude', stats.total, '100.0', yr, placeName, Math.round(E), Math.round(N), '', ''].map(esc).join(';')];
  download(`bauepochen-${fileSlug()}-${yr}.csv`, '\ufeff' + lines.join('\r\n'), 'text/csv;charset=utf-8');
  toast('Statistik gespeichert');
});

/* Jahr anwenden: echte Häuser nach Baujahr, nachgebaute aus der passenden Kartenausgabe */
function applyYear(y){
  gwr.year = y;
  markTicks();
  if (bldTs) { bldTs.makeStyleDirty(); specTs.makeStyleDirty(); }
  if (!city) return;
  const avail = [...city.eds.keys()].sort((a, b) => a - b);
  if (!avail.length) return;
  const pick = avail.filter(e => e <= y).pop() ?? avail[0];
  for (const [e, ed] of city.eds) if (ed.prim) ed.prim.show = (e === pick) && $('genOn').checked && !present;
  city.roof = city.eds.get(pick).roof;
  city.edition = pick;
  if (city.groundFor !== pick) makeGround(city.eds.get(pick));
  const ed = city.eds.get(pick);
  updateStories();
  if (present) { say('Heute: Luftbild, alle 3D-Gebäude und Bäume von swisstopo.'); updateStats(); return; }
  const nOldNow = [...gwr.years.values()].filter(v => v <= y).length;
  say(`${y}: ${nOldNow} echte Altbauten und ${ed.nGen} nachgebaute Häuser (Karte ${pick}).` + (avail.length < EDITIONS.length ? ' Weitere Jahrgänge werden noch gebaut …' : ' Zieh am Jahr-Regler für den Zeitsprung.'));
  updateStats();
}

async function buildHouses(center){
  const btn = $('build'); btn.disabled = true;
  const token = ++buildToken;
  try {
    const [lon, lat] = center || centerLonLat();
    if (bldTs && bldTs.customShader) bldTs.customShader.setUniform('u_up', C.Ellipsoid.WGS84.geodeticSurfaceNormal(C.Cartesian3.fromDegrees(lon, lat), new C.Cartesian3()));
    const dLat = 650 / 111320, dLon = 650 / (111320 * Math.cos(lat * Math.PI / 180));
    const px0 = Math.floor(lon2x(lon - dLon)), px1 = Math.ceil(lon2x(lon + dLon));
    const py0 = Math.floor(lat2y(lat + dLat)), py1 = Math.ceil(lat2y(lat - dLat));
    const W = px1 - px0, H = py1 - py0;
    const area = {px0, py0, W, H, cw: Math.floor(W / CELL), ch: Math.floor(H / CELL), lat};

    if (city) for (const ed of city.eds.values()) if (ed.prim) scene.primitives.remove(ed.prim);
    city = {px0, py0, cw: area.cw, ch: area.ch, roof: new Float32Array(area.cw * area.ch).fill(NaN), eds: new Map(), center:[lon, lat]};

    say('Frage das Gebäuderegister nach Baujahren ab …');
    const gkey = `gwr:v1:${lon.toFixed(4)}:${lat.toFixed(4)}`, gc = await idbGet(gkey);
    let reg;
    if (gc && gc.reg instanceof Map && Date.now() - gc.t < 30 * 864e5) { reg = gc.reg; say('Gebäuderegister aus dem Zwischenspeicher …'); setProg(0.3); }
    else {
      reg = await loadGwr(lon - dLon, lat - dLat, lon + dLon, lat + dLat, (d, t) => { say(`Gebäuderegister: ${d} von ${t} Teilgebieten …`); setProg(0.3 * d / t); });
      if (reg.size) idbPut(gkey, {t: Date.now(), reg});
    }
    if (token !== buildToken) return;
    gwr.years = new Map([...reg].map(([id, r]) => [id, r.y]));
    gwr.info = reg;
    $('bld').checked = false;
    await buildingLayer().catch(() => {});

    /* zuerst die Ausgabe zum aktuellen Jahr, dann die übrigen */
    const y = +$('yr').value || 1880;
    const first = EDITIONS.filter(e => e <= y).pop() ?? EDITIONS[0];
    const order = [first, ...EDITIONS.filter(e => e !== first)];
    for (const e of order) {
      say(`Baue Winterthur nach der Siegfriedkarte ${e} …`);
      const ed = await buildEdition(area, e, reg, token);
      if (!ed || token !== buildToken) return;
      city.eds.set(e, ed);
      setProg(0.3 + 0.7 * city.eds.size / EDITIONS.length);
      applyYear(+$('yr').value || 1880);
      if (city.eds.size === 1) { $('introWalk').disabled = false; }
      await new Promise(r => setTimeout(r, 50));
    }
  } catch (e) {
    console.error(e);
    say('Bauen fehlgeschlagen: ' + (e && e.message ? e.message : e));
  } finally { if (token === buildToken) btn.disabled = false; }
}
$('build').addEventListener('click', () => buildHouses());

/* ---------- Ortssuche ganze Schweiz (geo.admin.ch) ---------- */
const plain = t => String(t || '').replace(/<[^>]+>/g, '').replace(/^[a-z_]+_\s*/, '').trim();
function attachSearch(inp, list, onPick){
  let timer, items = [], sel = -1;
  const render = () => {
    list.innerHTML = '';
    items.forEach((it, i) => {
      const li = document.createElement('li');
      li.setAttribute('role', 'option'); li.setAttribute('aria-selected', i === sel);
      li.textContent = it.name;
      const sm = document.createElement('small'); sm.textContent = it.kind; li.appendChild(sm);
      li.addEventListener('mousedown', e => { e.preventDefault(); pick(i); });
      list.appendChild(li);
    });
    list.hidden = !items.length;
  };
  const pick = i => { const it = items[i]; if (!it) return; list.hidden = true; inp.value = it.name; inp.blur(); onPick(it); };
  inp.addEventListener('input', () => {
    clearTimeout(timer);
    const q = inp.value.trim();
    if (q.length < 2) { items = []; render(); return; }
    timer = setTimeout(async () => {
      try {
        const u = `https://api3.geo.admin.ch/rest/services/api/SearchServer?searchText=${encodeURIComponent(q)}&type=locations&sr=4326&limit=8`;
        const j = await (await fetch(u)).json();
        const KIND = {gg25: 'Gemeinde', address: 'Adresse', zipcode: 'Postleitzahl', sn25: 'Ort/Flurname', kantone: 'Kanton', district: 'Bezirk', parcel: 'Parzelle', gazetteer: 'Ort'};
        items = (j.results || []).map(r => ({name: plain(r.attrs.label), kind: KIND[r.attrs.origin] || 'Ort', lon: +r.attrs.lon, lat: +r.attrs.lat}))
          .filter(it => Number.isFinite(it.lon) && Number.isFinite(it.lat));
        sel = -1; render();
      } catch (e) { items = []; render(); }
    }, 220);
  });
  inp.addEventListener('keydown', e => {
    e.stopPropagation();                        /* WASD beim Tippen nicht als Steuerung werten */
    if (e.key === 'ArrowDown') { sel = Math.min(items.length - 1, sel + 1); render(); e.preventDefault(); }
    if (e.key === 'ArrowUp') { sel = Math.max(0, sel - 1); render(); e.preventDefault(); }
    if (e.key === 'Enter') { pick(sel < 0 ? 0 : sel); e.preventDefault(); }
    if (e.key === 'Escape') { list.hidden = true; }
  });
  inp.addEventListener('blur', () => setTimeout(() => { list.hidden = true; }, 150));
}
let placeName = 'Winterthur';
function goPlace(it){
  closeIntro && closeIntro();
  setMode(false);
  const dest = C.Cartesian3.fromDegrees(it.lon, it.lat - 0.0055, 1050);
  camera.flyTo({destination: dest, orientation: {heading: 0, pitch: C.Math.toRadians(-38), roll: 0}, duration: flyDur(2.5),
    complete: () => { if (!present) buildHouses([it.lon, it.lat]); }});
  toast(it.name);
  placeName = it.name;
}
attachSearch($('q'), $('qres'), goPlace);
attachSearch($('q2'), $('qres2'), goPlace);

/* ---------- «Heute»: saubere Gegenwart mit Luftbild, allen Gebäuden und Bäumen ---------- */
let present = false;
function setPresent(on){
  present = on;
  $('nowBtn').setAttribute('aria-pressed', on);
  $('nowBtn').textContent = on ? 'Zurück in die Zeit' : 'Heute';
  $('src').value = on ? 'foto' : 'sieg';
  setRange(); showLayer();
  $('yWrap').hidden = on;
  $('bld').checked = on;
  $('genOn').checked = !on;
  $('groundOn').checked = !on;
  $('veg').checked = on;
  buildingLayer().catch(() => {});
  toggleTiles('v', 'https://3d.geo.admin.ch/ch.swisstopo.vegetation.3d/v1/tileset.json', on);
  if (city && city.edition) makeGround(city.eds.get(city.edition));
  applyYear(on ? 2100 : +$('yr').value);
  $('yBig').textContent = on ? 'Heute' : $('yr').value;
  $('yLbl').textContent = on ? 'Luftbild und 3D-Gebäude von swisstopo' : 'Siegfriedkarte';
}
$('nowBtn').addEventListener('click', () => setPresent(!present));

/* ---------- Übersichtskarte mit Teleport (wie bei «Blocks») ---------- */
let omap = null, photoLayer = null, siegLayer = null, meMark = null, areaRect = null;
const loadCss = href => new Promise(res => { const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = href; l.onload = res; l.onerror = res; document.head.appendChild(l); });
const loadJs = src => new Promise((res, rej) => { const t = document.createElement('script'); t.src = src; t.onload = res; t.onerror = rej; document.head.appendChild(t); });
let leafP = null;
const needLeaflet = () => leafP || (leafP = window.L ? Promise.resolve()
  : loadCss('https://unpkg.com/leaflet@1.9.4/dist/leaflet.css').then(() => loadJs('https://unpkg.com/leaflet@1.9.4/dist/leaflet.js')));
async function openMap(){
  if (document.pointerLockElement) document.exitPointerLock();
  $('mapov').hidden = false;
  await needLeaflet();
  const here = C.Cartographic.fromCartesian(camera.position);
  const lat = C.Math.toDegrees(here.latitude), lon = C.Math.toDegrees(here.longitude);
  const year = Math.min(1949, Math.max(1870, +$('yr').value || 1880));
  const wm = (layer, t, fmt) => `https://wmts.geo.admin.ch/1.0.0/${layer}/default/${t}/3857/{z}/{x}/{y}.${fmt}`;
  if (!omap) {
    omap = L.map('omap', {minZoom: 11, maxZoom: 19, zoomControl: true}).setView([lat, lon], 16);
    photoLayer = L.tileLayer(wm('ch.swisstopo.swissimage', 'current', 'jpeg'), {maxNativeZoom: 19, maxZoom: 19, opacity: 0, attribution: '© swisstopo'});
    omap.on('mousemove', e => {
      const [E, N] = toLV95(e.latlng.lng, e.latlng.lat);
      $('mapCoord').textContent = `E ${fmt(E)}  N ${fmt(N)}  · Klick = hierhin teleportieren`;
    });
    omap.on('click', e => { closeMap(); teleport(e.latlng.lng, e.latlng.lat); });
    $('mapPhoto').addEventListener('input', () => {
      const v = +$('mapPhoto').value / 100;
      if (v > 0 && !omap.hasLayer(photoLayer)) photoLayer.addTo(omap);   /* Luftbild erst laden, wenn gewünscht */
      photoLayer.setOpacity(v);
    });
  } else {
    omap.setView([lat, lon], omap.getZoom());
  }
  if (siegLayer) omap.removeLayer(siegLayer);
  siegLayer = L.tileLayer(wm('ch.swisstopo.hiks-siegfried', String(year), 'png'), {maxNativeZoom: 16, maxZoom: 19, attribution: '© swisstopo'}).addTo(omap);
  siegLayer.bringToBack();
  if (meMark) omap.removeLayer(meMark);
  const hdg = (C.Math.toDegrees(camera.heading) + 360) % 360;
  meMark = L.marker([lat, lon], {icon: L.divIcon({className: '', iconSize: [28, 28], iconAnchor: [14, 14],
    html: `<svg width="28" height="28" viewBox="0 0 28 28" style="transform:rotate(${hdg}deg)"><circle cx="14" cy="14" r="7" fill="#c8803f" stroke="#fff" stroke-width="2"/><path d="M14 1 L19 10 L9 10Z" fill="#c8803f" stroke="#fff" stroke-width="1.5"/></svg>`})}).addTo(omap);
  if (areaRect) omap.removeLayer(areaRect);
  if (city) {
    areaRect = L.rectangle([[y2lat(city.py0 + city.ch * CELL), x2lon(city.px0)], [y2lat(city.py0), x2lon(city.px0 + city.cw * CELL)]],
      {color: '#8a5a2b', weight: 2, dashArray: '8 6', fill: false, interactive: false}).addTo(omap);
  }
  setTimeout(() => omap.invalidateSize(), 50);
}
function closeMap(){ $('mapov').hidden = true; }
$('mapClose').addEventListener('click', closeMap);
$('mapBtn').addEventListener('click', openMap);
const goFull = () => { try { document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen(); } catch (e) {} };
$('fullBtn').addEventListener('click', goFull);
$('mapFull').addEventListener('click', goFull);

/* Teleport: im gebauten Gebiet auf eine freie Strassenstelle, sonst einfach auf den Boden */
async function teleport(lon, lat){
  if (city) {
    const x = (lon2x(lon) - city.px0) / CELL, y = (lat2y(lat) - city.py0) / CELL;
    if (x >= 0 && y >= 0 && x < city.cw && y < city.ch) { await spawn([lon, lat]); return; }
  }
  const p = C.Cartographic.fromDegrees(lon, lat);
  if (terrainOk) await C.sampleTerrainMostDetailed(viewer.terrainProvider, [p]);
  p.height = (p.height || 0) + 1.7;
  camera.setView({destination: C.Cartographic.toCartesian(p), orientation: {heading: camera.heading, pitch: 0, roll: 0}});
  setMode(true); setPanel(false);
  say('Ausserhalb des gebauten Gebiets. «Hier neu bauen» baut die Häuser um diese Stelle.');
}

/* Die engste, dichteste Gasse in der Nähe suchen: freie Stelle mit möglichst vielen Häusern rundherum */
function densestStreet(lon, lat){
  if (!city) return [lon, lat];
  const R = city.roof, cw = city.cw, ch = city.ch;
  const cx0 = Math.floor((lon2x(lon) - city.px0) / CELL), cy0 = Math.floor((lat2y(lat) - city.py0) / CELL);
  const occ = (x, y) => x < 0 || y < 0 || x >= cw || y >= ch ? 0 : (Number.isNaN(R[y * cw + x]) ? 0 : 1);
  /* echte Altbauten des gewählten Jahres je Rasterzelle: dort ist die Altstadt */
  const old = new Map();
  if (gwr.info) for (const r of gwr.info.values()) if (r.y <= gwr.year) {
    const i = Math.floor((lat2y(r.lat) - city.py0) / CELL) * cw + Math.floor((lon2x(r.lon) - city.px0) / CELL);
    old.set(i, (old.get(i) || 0) + 1);
  }
  let best = null, bestS = -1;
  for (let y = cy0 - 60; y <= cy0 + 60; y++) for (let x = cx0 - 60; x <= cx0 + 60; x++) {
    /* frei, mit Durchgang in einer Richtung (Gassen sind auf der Karte schmal) */
    if (occ(x, y) || !((!occ(x - 1, y) && !occ(x + 1, y)) || (!occ(x, y - 1) && !occ(x, y + 1)))) continue;
    let sc = 0;
    for (let k = -5; k <= 5; k++) for (let j = -5; j <= 5; j++) sc += old.get((y + k) * cw + x + j) || 0;
    sc -= Math.hypot(x - cx0, y - cy0) * 0.15;                 /* nahe der Mitte bevorzugen */
    if (sc > bestS) { bestS = sc; best = [x, y]; }
  }
  return best ? [x2lon(city.px0 + (best[0] + .5) * CELL), y2lat(city.py0 + (best[1] + .5) * CELL)] : [lon, lat];
}

/* Auf eine freie Strassenstelle setzen, Blick nach Osten */
async function spawn(at){
  if (!city) { say('Zuerst «Häuser hier bauen».'); return; }
  let [lon, lat] = at || centerLonLat();
  const inside = (a, b) => { const x = (lon2x(a) - city.px0) / CELL, y = (lat2y(b) - city.py0) / CELL; return x >= 0 && y >= 0 && x < city.cw && y < city.ch; };
  if (!inside(lon, lat)) [lon, lat] = city.center;
  const sx = Math.floor((lon2x(lon) - city.px0) / CELL), sy = Math.floor((lat2y(lat) - city.py0) / CELL);
  const isOcc = (x, y) => x < 0 || y < 0 || x >= city.cw || y >= city.ch || !Number.isNaN(city.roof[y * city.cw + x]);
  const free = (x, y) => !isOcc(x, y) && ((!isOcc(x - 1, y) && !isOcc(x + 1, y)) || (!isOcc(x, y - 1) && !isOcc(x, y + 1)));
  let best = null;
  for (let r = 0; r < 80 && !best; r++)
    for (let dy = -r; dy <= r && !best; dy++) for (let dx = -r; dx <= r; dx++)
      if ((Math.abs(dx) === r || Math.abs(dy) === r) && free(sx + dx, sy + dy)) { best = [sx + dx, sy + dy]; break; }
  if (!best) { say('Keine freie Stelle gefunden.'); return; }
  const p = C.Cartographic.fromDegrees(x2lon(city.px0 + (best[0] + .5) * CELL), y2lat(city.py0 + (best[1] + .5) * CELL));
  if (terrainOk) await C.sampleTerrainMostDetailed(viewer.terrainProvider, [p]);
  p.height = (p.height || 0) + 1.7;
  camera.setView({destination:C.Cartographic.toCartesian(p), orientation:{heading:C.Math.toRadians(90), pitch:0, roll:0}});
  setMode(true);
  /* in die Richtung schauen, in der die Gasse am längsten frei ist */
  let bestH = 90, bestD = -1;
  for (let h = 0; h < 360; h += 20) {
    camera.setView({orientation:{heading:C.Math.toRadians(h), pitch:0, roll:0}});
    try {
      const hit = scene.pickFromRay(new C.Ray(C.Cartesian3.clone(camera.position), C.Cartesian3.clone(camera.direction)), ground.prim ? [ground.prim] : []);
      const d = hit && hit.object && hit.position ? C.Cartesian3.distance(hit.position, camera.position) : 300;
      if (d > bestD && d <= 300) { bestD = d; bestH = h; }
    } catch (e) {}
  }
  camera.setView({orientation:{heading:C.Math.toRadians(bestH), pitch:C.Math.toRadians(2), roll:0}});
  setPanel(false);
  say('Du stehst in der Gasse. WASD zum Gehen, ins Bild klicken zum Umschauen, Tab für das Menü.');
}
$('spawn').addEventListener('click', () => spawn());
const closeIntro = () => { $('intro').classList.add('off'); document.body.classList.remove('intro-on'); };

/* Einbettungsmodus (?embed=1): ohne Startbildschirm, Menü eingeklappt, Knopf für das Vollbild */
if (new URLSearchParams(location.search).get('embed') === '1') {
  closeIntro();
  setPanel(false);
  $('openFull').hidden = false;
  goHome(0);
}
$('introWalk').addEventListener('click', async () => { closeIntro(); await spawn(densestStreet(8.7300, 47.4995)); });
$('introFly').addEventListener('click', () => { closeIntro(); goHome(1.5); });

/* Kamera */
function goHome(dur){
  camera.flyTo({destination:C.Cartesian3.fromDegrees(HOME.lon,HOME.lat,HOME.h),
    orientation:{heading:C.Math.toRadians(HOME.heading),pitch:C.Math.toRadians(HOME.pitch),roll:0}, duration:flyDur(dur)});
}
goHome(0);
$('home').addEventListener('click', () => goHome(2));

/* Ego-Steuerung wie in Minecraft */
let walk = false, locked = false;
const keys = {};
const canvas = viewer.canvas;
function setMode(w){
  walk = w;
  $('mFly').setAttribute('aria-pressed', !w); $('mWalk').setAttribute('aria-pressed', w);
}
$('mFly').addEventListener('click', () => setMode(false));
$('mWalk').addEventListener('click', () => setMode(true));
$('go').addEventListener('click', () => { try { canvas.requestPointerLock(); } catch(e){} });
/* Klick auf ein Haus: Infokarte. Mit übernommener Maus zählt das Fadenkreuz. */
let infoTimer, infoStory = null;
function showInfo(p){
  let title = '', text = '', badge = '', src = '', rec = false, link = '', hold = 7000, story = null;
  if (p && p.id instanceof C.Entity && p.id.story) {
    const st = p.id.story;
    title = st.titel; text = st.text; badge = 'Geschichte'; hold = 20000;
    src = 'Quelle: ' + st.quelle;
    link = /^https:\/\//.test(st.url || '') ? st.url : '';
    story = STORY_ID_RE.test(String(st.id || '')) ? String(st.id) : null;
  } else if (p instanceof C.Cesium3DTileFeature) {
    const egid = Number(p.getProperty('EGID')), r = gwr.info && gwr.info.get(egid);
    const art = p.getProperty('OBJEKTART'), hgt = Math.round(p.getProperty('GESAMTHOEHE') || 0);
    const kind = art === 'Sakrales Gebaeude' ? 'Kirche' : art === 'Hochkamin' ? 'Hochkamin' : art === 'Gebaeude Einzelhaus' ? 'Gebäude' : art;
    title = (r && r.adr) ? r.adr : kind;
    const bj = r ? (r.exact ? `Baujahr ${r.y}` : 'Baujahr vor 1919') : 'Baujahr unbekannt';
    text = `${kind} · ${bj} · steht heute noch${hgt ? ` · ${hgt} m hoch` : ''}`;
    badge = 'Belegt';
    src = `Quelle: swissBUILDINGS3D (swisstopo), Gebäuderegister GWR (BFS)${egid ? ` · EGID ${egid}` : ''}`;
  } else if (p && p.id && p.id.gen) {
    title = p.id.hall ? 'Abgerissene Fabrikhalle' : 'Abgerissenes Haus';
    text = `Nachgebaut nach der Siegfriedkarte ${p.id.gen}` + (p.id.hall ? '' : ` · ${p.id.floors} Geschosse geschätzt`) + ' · steht heute nicht mehr';
    badge = 'Rekonstruiert'; rec = true;
    src = `Quelle: Siegfriedkarte, Kartenstand ${p.id.gen} (swisstopo) · Grundriss aus der Karte, Höhe geschätzt`;
  } else return false;
  $('iTitle').textContent = title; $('iText').textContent = text; $('iSrc').textContent = src;
  $('iBadge').textContent = badge; $('iBadge').classList.toggle('rec', rec);
  $('iLink').hidden = !link; if (link) $('iLink').href = link;
  infoStory = story; $('iShare').hidden = !story;
  $('info').hidden = false;
  clearTimeout(infoTimer); infoTimer = setTimeout(() => { $('info').hidden = true; }, hold);
  return true;
}
canvas.addEventListener('click', e => {
  const pos = locked ? new C.Cartesian2(canvas.clientWidth / 2, canvas.clientHeight / 2) : new C.Cartesian2(e.offsetX, e.offsetY);
  if (meas.on) { measureAt(pos); return; }
  let hit = null; try { hit = scene.pick(pos); } catch (err) {}
  if (hit && showInfo(hit)) return;
  if (!locked) try { canvas.requestPointerLock(); } catch (err) {}
});

/* ---------- Messen: zwei Punkte im 3D-Bild, Distanz und Höhenunterschied ---------- */
const meas = {on: false, pts: [], ents: []};
const MEAS_C = C.Color.fromCssColorString('#c8803f');
function measClear(){ for (const e of meas.ents) viewer.entities.remove(e); meas.ents = []; meas.pts = []; }
function setMeasure(on){
  meas.on = on; measClear();
  $('measBtn').setAttribute('aria-pressed', on);
  $('measBtn').textContent = on ? 'Messen beenden (L)' : 'Messen (L)';
  if (on) { if (!locked) setPanel(false); toast('Messen: zwei Punkte im Bild anklicken'); }
  else $('info').hidden = true;
}
function measureAt(pos){
  let p = null;
  try { if (scene.pickPositionSupported) p = scene.pickPosition(pos); } catch (e) {}
  if (!p) { const ray = camera.getPickRay(pos); p = ray && globe.pick(ray, scene); }
  if (!p) { toast('Dort ist kein Boden – nochmals versuchen'); return; }
  if (meas.pts.length >= 2) measClear();
  meas.pts.push(p);
  meas.ents.push(viewer.entities.add({position: p, point: {pixelSize: 11, color: MEAS_C, outlineColor: C.Color.WHITE, outlineWidth: 2, disableDepthTestDistance: Number.POSITIVE_INFINITY}}));
  if (meas.pts.length < 2) { toast('Erster Punkt gesetzt – jetzt den zweiten'); return; }
  const [a, b] = meas.pts;
  meas.ents.push(viewer.entities.add({polyline: {positions: [a, b], width: 3, arcType: C.ArcType.NONE,
    material: MEAS_C, depthFailMaterial: new C.PolylineDashMaterialProperty({color: MEAS_C})}}));
  const ca = C.Cartographic.fromCartesian(a), cb = C.Cartographic.fromCartesian(b);
  const flat = new C.EllipsoidGeodesic(ca, cb).surfaceDistance || 0, dz = cb.height - ca.height;
  const d3 = C.Cartesian3.distance(a, b), m = v => v >= 1000 ? (v / 1000).toFixed(2).replace('.', ',') + ' km' : Math.round(v) + ' m';
  const slope = flat > 1 ? ` · Steigung ${Math.round(dz / flat * 100)} %` : '';
  $('iTitle').textContent = m(d3);
  $('iText').textContent = `waagrecht ${m(flat)} · Höhenunterschied ${dz >= 0 ? '+' : '−'}${Math.round(Math.abs(dz))} m${slope}`;
  $('iSrc').textContent = 'Gemessen im 3D-Bild (Gelände und Gebäude von swisstopo). Richtwert, keine amtliche Vermessung.';
  $('iBadge').textContent = 'Messung'; $('iBadge').classList.remove('rec');
  $('iLink').hidden = true; $('iShare').hidden = true; infoStory = null; $('info').hidden = false;
  clearTimeout(infoTimer); infoTimer = setTimeout(() => { $('info').hidden = true; }, 30000);
}
$('measBtn').addEventListener('click', () => setMeasure(!meas.on));
$('iClose').addEventListener('click', () => { clearTimeout(infoTimer); $('info').hidden = true; });

function setPanel(show){
  $('panel').classList.toggle('off', !show);
  $('keys').classList.toggle('off', !show);
  $('pill').hidden = show;
}
$('pill').addEventListener('click', () => setPanel(true));
/* Handy: Seitenleiste als unteres Blatt, halb oder ganz offen */
$('sheetSize').addEventListener('click', () => {
  const full = $('panel').classList.toggle('full');
  $('sheetSize').textContent = full ? '▾ Weniger' : '▴ Mehr';
  $('sheetSize').setAttribute('aria-expanded', full);
});
$('sheetClose').addEventListener('click', () => setPanel(false));
const ctl = scene.screenSpaceCameraController;
document.addEventListener('pointerlockchange', () => {
  locked = document.pointerLockElement === canvas;
  ctl.enableInputs = !locked;
  $('cross').hidden = !locked;
  if (locked) setPanel(false);
});
/* Blickziel: die Maus setzt das Ziel, die Kamera folgt weich */
const look = {h: 0, p: 0, active: false};
document.addEventListener('mousemove', e => {
  if (!locked) return;
  if (!look.active) { look.h = camera.heading; look.p = camera.pitch; look.active = true; }
  look.h += e.movementX * 0.0022;
  look.p = C.Math.clamp(look.p - e.movementY * 0.0022, -1.55, 1.55);
});
document.addEventListener('keydown', e => {
  if (e.target.tagName === 'SELECT' || e.target.tagName === 'INPUT') return;
  if (e.key === 'Escape' && !$('info').hidden) { $('info').hidden = true; }
  if (e.code === 'Tab') { e.preventDefault(); setPanel($('panel').classList.contains('off')); return; }
  keys[e.code] = true;
  if (e.code === 'KeyF') setMode(!walk);
  if (e.code === 'KeyI') { speedIdx = Math.min(SPEEDS.length - 1, speedIdx + 1); toast(`Fluggeschwindigkeit ${SPEEDS[speedIdx]}×`); }
  if (e.code === 'KeyU') { speedIdx = Math.max(0, speedIdx - 1); toast(`Fluggeschwindigkeit ${SPEEDS[speedIdx]}×`); }
  if (e.code === 'KeyJ') { setFarView(!farView); toast(`Fernsicht ${farView ? 'an' : 'aus'}`); }
  if (e.code === 'F3') { e.preventDefault(); $('f3').hidden = !$('f3').hidden; }
  if (e.code === 'KeyM') { e.preventDefault(); $('mapov').hidden ? openMap() : closeMap(); }
  if (e.code === 'KeyP') { saveShot(); }
  if (e.code === 'KeyL') { setMeasure(!meas.on); }
  if (e.code === 'KeyN') { faceNorth(); }
  if (e.key === 'Escape' && meas.on) { setMeasure(false); }
  if (e.code === 'KeyB') { setBlocky(!blocky); toast(`Minecraft-Look ${blocky ? 'an' : 'aus'}`); }
  if (locked && e.code === 'Space') e.preventDefault();
});
document.addEventListener('keyup', e => { keys[e.code] = false; });
window.addEventListener('blur', () => { for (const k in keys) keys[k] = false; });

/* ---------- Handy-Steuerung: Joystick zum Gehen, Wischen zum Umschauen ---------- */
const COARSE = matchMedia('(pointer:coarse)').matches;
const joy = {on: false, x: 0, y: 0, id: null};
{
  const pad = $('joy'), knob = $('joyKnob');
  const move = e => {
    const r = pad.getBoundingClientRect(), R = r.width * 0.38;
    let dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
    const d = Math.hypot(dx, dy); if (d > R) { dx *= R / d; dy *= R / d; }
    joy.x = dx / R; joy.y = -dy / R;
    knob.style.transform = `translate(${dx}px,${dy}px)`;
  };
  pad.addEventListener('pointerdown', e => {
    e.preventDefault(); joy.on = true; joy.id = e.pointerId; pad.setPointerCapture(e.pointerId);
    if (!walk && city) spawn(centerLonLat()); else if (!walk) setMode(true);
    move(e);
  });
  pad.addEventListener('pointermove', e => { if (joy.on && e.pointerId === joy.id) move(e); });
  const end = e => { if (e.pointerId !== joy.id) return; joy.on = false; joy.x = joy.y = 0; knob.style.transform = ''; };
  pad.addEventListener('pointerup', end); pad.addEventListener('pointercancel', end);
  /* ein Finger auf dem Bild: Blick drehen (nur beim Gehen) */
  const sw = {id: null, x: 0, y: 0};
  canvas.addEventListener('pointerdown', e => { if (e.pointerType === 'touch' && walk && sw.id === null) { sw.id = e.pointerId; sw.x = e.clientX; sw.y = e.clientY; } });
  canvas.addEventListener('pointermove', e => {
    if (e.pointerId !== sw.id || !walk) return;
    const dx = e.clientX - sw.x, dy = e.clientY - sw.y; sw.x = e.clientX; sw.y = e.clientY;
    camera.setView({orientation: {heading: camera.heading + dx * 0.006, pitch: C.Math.clamp(camera.pitch - dy * 0.004, -1.4, 1.4), roll: 0}});
  });
  const swEnd = e => { if (e.pointerId === sw.id) sw.id = null; };
  canvas.addEventListener('pointerup', swEnd); canvas.addEventListener('pointercancel', swEnd);
}
const up = new C.Cartesian3(), fwd = new C.Cartesian3(), prevPos = new C.Cartesian3();
const vel = new C.Cartesian3();            /* x = rechts, y = vorwärts, z = hoch (m/s) */
const SPEEDS = [1, 2, 5, 10, 20, 50, 100];
let speedIdx = 2, smoothH = null, bob = 0, fps = 60;
let last = performance.now();
const gridFree = pos => {
  const c = C.Cartographic.fromCartesian(pos);
  const r = roofAt(C.Math.toDegrees(c.longitude), C.Math.toDegrees(c.latitude));
  return r === null || c.height >= r + 0.5;
};
/* Minecraft-artig: Ost- und Nordanteil getrennt prüfen, dann gleitet man an Wänden entlang */
function collide(from, disp){
  const to = C.Cartesian3.add(from, disp, new C.Cartesian3());
  if (gridFree(to)) return to;
  const enu = C.Transforms.eastNorthUpToFixedFrame(from);
  const e = new C.Cartesian3(enu[0], enu[1], enu[2]), n = new C.Cartesian3(enu[4], enu[5], enu[6]);
  const de = C.Cartesian3.multiplyByScalar(e, C.Cartesian3.dot(disp, e), new C.Cartesian3());
  const dn = C.Cartesian3.multiplyByScalar(n, C.Cartesian3.dot(disp, n), new C.Cartesian3());
  const rest = C.Cartesian3.subtract(C.Cartesian3.subtract(disp, de, new C.Cartesian3()), dn, new C.Cartesian3());
  let pos = C.Cartesian3.add(from, rest, new C.Cartesian3());
  for (const part of [de, dn]) {
    const t = C.Cartesian3.add(pos, part, new C.Cartesian3());
    if (gridFree(t)) pos = t;
  }
  return pos;
}
/* WGS84 → LV95 (Näherungsformel swisstopo) */
function toLV95(lon, lat){
  const p = (lat * 3600 - 169028.66) / 10000, l = (lon * 3600 - 26782.5) / 10000;
  const E = 2600072.37 + 211455.93*l - 10938.51*l*p - 0.36*l*p*p - 44.54*l*l*l;
  const N = 1200147.07 + 308807.95*p + 3745.25*l*l + 76.63*p*p - 194.56*l*l*p + 119.79*p*p*p;
  return [E, N];
}
const fmt = n => Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, "'");
const DIRS = ['N','NO','O','SO','S','SW','W','NW'];
scene.preRender.addEventListener(() => {
  const now = performance.now(), dt = Math.min(0.1, (now - last) / 1000); last = now;
  fps = fps * 0.95 + (dt > 0 ? 1 / dt : 60) * 0.05;
  /* ruckelt es länger als 3 s, Schatten automatisch abschalten */
  if (viewer.shadows && !document.hidden && fps < 28) {
    if (!slowSince) slowSince = now;
    else if (now - slowSince > 3000) { viewer.shadows = false; $('shadowOn').checked = false; toast('Schatten aus, damit es flüssig bleibt'); slowSince = 0; }
  } else slowSince = 0;
  if (city && city.edition) {
    const ed = city.eds.get(city.edition), want = $('recHl').checked;
    if (ed && ed.prim && ed.prim.ready && ed.hl !== want) recolor(ed, want);
  }
  const carto = C.Cartographic.fromCartesian(camera.position);
  const gnd = globe.getHeight(carto);
  const agl = gnd === undefined ? carto.height : carto.height - gnd;

  /* weiches Umschauen */
  if (locked && look.active) {
    const k = 1 - Math.exp(-dt * 30);
    let dh = look.h - camera.heading;
    dh = Math.atan2(Math.sin(dh), Math.cos(dh));
    camera.setView({orientation:{heading: camera.heading + dh * k, pitch: camera.pitch + (look.p - camera.pitch) * k, roll:0}});
  } else look.active = false;

  /* Tempo mit Trägheit: beschleunigen und ausrollen statt ruckartig */
  const sprint = keys.ShiftLeft || keys.ShiftRight;
  const top = walk ? (sprint ? 9 : 4.5) : 10 * SPEEDS[speedIdx] * (sprint ? 3 : 1);
  const want = new C.Cartesian3(
    (keys.KeyD ? 1 : 0) - (keys.KeyA ? 1 : 0),
    (keys.KeyW ? 1 : 0) - (keys.KeyS ? 1 : 0),
    walk ? 0 : (keys.Space ? 1 : 0) - (keys.KeyC ? 1 : 0));
  if (C.Cartesian3.magnitude(want) > 0) C.Cartesian3.multiplyByScalar(C.Cartesian3.normalize(want, want), top, want);
  else if (joy.on) { want.x = joy.x * top; want.y = joy.y * top; }   /* Handy: Joystick, stufenlos */
  /* Handy: beim Gehen dreht Wischen den Blick, Cesium-Gesten nur beim Fliegen */
  if (COARSE && !locked) ctl.enableInputs = !walk;
  const k = 1 - Math.exp(-dt * (C.Cartesian3.magnitude(want) > 0 ? 9 : 7));
  C.Cartesian3.lerp(vel, want, k, vel);
  const speed = C.Cartesian3.magnitude(vel);

  if (speed > 0.02) {
    C.Ellipsoid.WGS84.geodeticSurfaceNormal(camera.position, up);
    const fw = walk ? (() => {          /* beim Gehen nur waagrecht */
      const f = C.Cartesian3.subtract(camera.direction, C.Cartesian3.multiplyByScalar(up, C.Cartesian3.dot(camera.direction, up), new C.Cartesian3()), new C.Cartesian3());
      return C.Cartesian3.normalize(f, f); })() : camera.direction;
    const disp = new C.Cartesian3();
    C.Cartesian3.add(disp, C.Cartesian3.multiplyByScalar(fw, vel.y * dt, new C.Cartesian3()), disp);
    C.Cartesian3.add(disp, C.Cartesian3.multiplyByScalar(camera.right, vel.x * dt, new C.Cartesian3()), disp);
    C.Cartesian3.add(disp, C.Cartesian3.multiplyByScalar(up, vel.z * dt, new C.Cartesian3()), disp);
    camera.position = collide(camera.position, disp);
  }

  /* Boden halten: Gehen weich auf Augenhöhe mit leichtem Wippen, Fliegen nie unter 3 m */
  const c2 = C.Cartographic.fromCartesian(camera.position);
  const g2 = globe.getHeight(c2);
  if (g2 !== undefined) {
    if (walk) {
      bob += speed * dt * 1.9;
      const target = g2 + 1.7;
      smoothH = smoothH === null || Math.abs(smoothH - target) > 8 ? target : smoothH + (target - smoothH) * (1 - Math.exp(-dt * 14));
      c2.height = Math.max(smoothH, g2 + 1.2);
      camera.position = C.Cartographic.toCartesian(c2);
    } else {
      smoothH = null;
      if (c2.height < g2 + 3) { c2.height = g2 + 3; camera.position = C.Cartographic.toCartesian(c2); }
    }
  }

  /* Anzeige */
  if (terrainOk || !$('terrMsg').hidden) {
    $('hud').textContent = walk ? `Gehen${sprint ? ' · rennen' : ''}` : `Fliegen ${SPEEDS[speedIdx]}× · ${Math.round(agl)} m über Boden`;
  }
  if (!$('f3').hidden) {
    const lon = C.Math.toDegrees(c2.longitude), lat = C.Math.toDegrees(c2.latitude);
    const [E, N] = toLV95(lon, lat);
    const hdg = (C.Math.toDegrees(camera.heading) + 360) % 360;
    $('f3').textContent = `E ${fmt(E)}   N ${fmt(N)}\nHöhe ${Math.round(c2.height)} m ü. M. · ${Math.round(agl)} m über Boden\nBlick ${DIRS[Math.round(hdg / 45) % 8]} (${Math.round(hdg)}°) · Tempo ${speed.toFixed(1)} m/s\n${Math.round(fps)} Bilder/s · Fernsicht ${farView ? 'an' : 'aus'}`;
  }
});

/* ---------- Kompass: zeigt die Blickrichtung, Antippen dreht nach Norden ---------- */
let compassDeg = null;
scene.postRender.addEventListener(() => {
  const d = Math.round(C.Math.toDegrees(camera.heading));
  if (d === compassDeg) return;
  compassDeg = d;
  $('compassRose').setAttribute('transform', `rotate(${-d} 20 20)`);
  $('compass').title = `Blick ${DIRS[Math.round(((d % 360) + 360) % 360 / 45) % 8]} – Antippen dreht nach Norden (N)`;
});
function faceNorth(){
  look.active = false;
  const pitch = camera.pitch, dur = flyDur(0.8);
  /* von oben: um den Punkt in der Bildmitte drehen, damit der Ort im Bild bleibt; beim Gehen am Platz drehen */
  let target = null;
  if (!walk && pitch < C.Math.toRadians(-10)) {
    const ray = camera.getPickRay(new C.Cartesian2(canvas.clientWidth / 2, canvas.clientHeight / 2));
    target = ray && globe.pick(ray, scene);
  }
  if (target) {
    const range = C.Cartesian3.distance(camera.position, target);
    camera.flyToBoundingSphere(new C.BoundingSphere(target, 1), {offset: new C.HeadingPitchRange(0, pitch, range), duration: dur});
  } else {
    camera.flyTo({destination: C.Cartesian3.clone(camera.position), orientation: {heading: 0, pitch, roll: 0}, duration: dur});
  }
}
$('compass').addEventListener('click', faceNorth);

/* ---------- Permalink: Ort, Jahr, Blick und Modus als Link ---------- */
function permalink(){
  const c = C.Cartographic.fromCartesian(camera.position), r = (v, d) => Number(v.toFixed(d));
  const q = new URLSearchParams({
    lon: r(C.Math.toDegrees(c.longitude), 6), lat: r(C.Math.toDegrees(c.latitude), 6), h: r(c.height, 1),
    hdg: r((C.Math.toDegrees(camera.heading) + 360) % 360, 1), pitch: r(C.Math.toDegrees(camera.pitch), 1),
    year: +$('yr').value || 1880, mode: present ? 'now' : walk ? 'walk' : 'fly'});
  if (city) q.set('c', city.center.map(v => v.toFixed(5)).join(','));
  if (STORY_NAME) q.set('stories', STORY_NAME);
  return location.origin + location.pathname + '?' + q.toString();
}
$('linkBtn').addEventListener('click', async () => {
  const url = permalink();
  try { await navigator.clipboard.writeText(url); toast('Link kopiert'); }
  catch (e) { window.prompt('Link zu dieser Ansicht:', url); }
});
/* ---------- Geschichten an Orten: stories/<ort>.json, Marker im 3D-Bild ---------- */
const stories = [];
async function geocodeAddr(adr){
  const u = `https://api3.geo.admin.ch/rest/services/api/SearchServer?searchText=${encodeURIComponent(adr)}&type=locations&origins=address&sr=4326&limit=1`;
  const r = ((await (await fetch(u)).json()).results || [])[0];
  return r && Number.isFinite(+r.attrs.lon) ? [+r.attrs.lon, +r.attrs.lat] : null;
}
async function loadStories(file, check){
  let data;
  try { const r = await fetch(file); if (!r.ok) throw new Error(r.status); data = await r.json(); }
  catch (e) { if (check) toast(`Story-Datei ${file} nicht gefunden oder kein gültiges JSON`, 8000); return; }
  const skipped = [];
  for (const st of (data.geschichten || [])) {
    const nm = String(st.id || st.titel || '?');
    if (typeof st.titel !== 'string' || typeof st.text !== 'string' || typeof st.quelle !== 'string') { skipped.push(`${nm}: titel, text oder quelle fehlt`); continue; }
    let ll = Number.isFinite(st.lon) && Number.isFinite(st.lat) ? [st.lon, st.lat] : null;
    if (!ll && typeof st.adresse === 'string') { try { ll = await geocodeAddr(st.adresse); } catch (e) {} }
    if (!ll) { skipped.push(`${nm}: Lage nicht gefunden (adresse oder lon/lat prüfen)`); continue; }
    st.lon = ll[0]; st.lat = ll[1];
    const ent = viewer.entities.add({
      position: C.Cartesian3.fromDegrees(ll[0], ll[1]),
      point: {pixelSize: 14, color: C.Color.fromCssColorString('#c8803f'), outlineColor: C.Color.WHITE, outlineWidth: 2,
        heightReference: C.HeightReference.CLAMP_TO_GROUND, disableDepthTestDistance: Number.POSITIVE_INFINITY},
      label: {text: st.titel, font: '600 15px Archivo, sans-serif', fillColor: C.Color.WHITE, outlineColor: C.Color.BLACK, outlineWidth: 3,
        style: C.LabelStyle.FILL_AND_OUTLINE, pixelOffset: new C.Cartesian2(0, -18), verticalOrigin: C.VerticalOrigin.BOTTOM,
        heightReference: C.HeightReference.CLAMP_TO_GROUND, disableDepthTestDistance: Number.POSITIVE_INFINITY,
        distanceDisplayCondition: new C.DistanceDisplayCondition(0, 2500)}
    });
    ent.story = st;
    stories.push(ent);
  }
  updateStories();
  /* ?story=<id>: direkt zur Geschichte fliegen und die Infokarte öffnen */
  if (STORY_ID) {
    const i = stories.findIndex(e => String(e.story.id) === STORY_ID);
    if (i >= 0) { closeIntro(); tourGo(i, false); }
    else toast(`Geschichte «${STORY_ID}» nicht gefunden`, 6000);
  }
  if (check) {
    /* Prüfmodus für Partner: Ergebnis kurz melden, Details in der Browser-Konsole */
    toast(`${stories.length} Geschichten geladen` + (skipped.length ? `, ${skipped.length} übersprungen (Details: Konsole)` : ''), 8000);
    if (skipped.length) console.warn('Übersprungene Geschichten in ' + file + ':\n' + skipped.join('\n'));
  }
  $('tourBtn').disabled = !stories.length;
  /* bekannte Orte als Sprungziele */
  const pl = $('places'); pl.textContent = '';
  stories.forEach((ent, i) => {
    const b = document.createElement('button');
    b.textContent = ent.story.titel; b.title = 'Hinfliegen';
    b.addEventListener('click', () => { closeIntro(); tourGo(i, false); });
    pl.appendChild(b);
  });
}
/* Geführte Tour: Kamera fliegt die Geschichten der Reihe nach an */
let tourIdx = -1;
function tourGo(i, bar = true){
  if (!stories.length) return;
  tourIdx = (i + stories.length) % stories.length;
  const ent = stories[tourIdx], st = ent.story;
  if (document.pointerLockElement) document.exitPointerLock();
  setMode(false); setPanel(false);
  if (!$('storyOn').checked) { $('storyOn').checked = true; updateStories(); }
  const c = C.Cartographic.fromDegrees(st.lon, st.lat);
  const gh = globe.getHeight(c) ?? 450;
  camera.flyToBoundingSphere(new C.BoundingSphere(C.Cartesian3.fromDegrees(st.lon, st.lat, gh + 10), 30),
    {offset: new C.HeadingPitchRange(C.Math.toRadians(20), C.Math.toRadians(-32), 320), duration: flyDur(2.5),
     complete: () => { if (tourIdx >= 0 && stories[tourIdx] === ent) showInfo({id: ent}); }});
  $('tourLbl').textContent = `${tourIdx + 1}/${stories.length} · ${st.titel}`;
  $('tour').hidden = !bar;
}
function tourEnd(){ tourIdx = -1; $('tour').hidden = true; }
$('tourBtn').addEventListener('click', () => { closeIntro(); tourGo(0); });
$('tourNext').addEventListener('click', () => tourGo(tourIdx + 1));
$('tourPrev').addEventListener('click', () => tourGo(tourIdx - 1));
$('tourEnd').addEventListener('click', tourEnd);
function updateStories(){
  const y = present ? 9999 : gwr.year, on = $('storyOn').checked;
  for (const e of stories) e.show = on && (e.story.von == null || e.story.von <= y) && (e.story.bis == null || e.story.bis >= y);
}
$('storyOn').addEventListener('change', updateStories);
/* ?stories=<name> lädt stories/<name>.json (zum Prüfen einer Partner-Datei), sonst Winterthur */
const STORY_Q = new URLSearchParams(location.search).get('stories');
const STORY_NAME = /^[a-z0-9-]{1,40}$/.test(STORY_Q || '') ? STORY_Q : null;
const STORY_ID_RE = /^[A-Za-z0-9_-]{1,60}$/;
const STORY_ID = STORY_ID_RE.test(new URLSearchParams(location.search).get('story') || '') ? new URLSearchParams(location.search).get('story') : null;
/* Link zu einer Geschichte: öffnet den 3D-Flug direkt dort, mit Infokarte */
$('iShare').addEventListener('click', async () => {
  if (!infoStory) return;
  const q = new URLSearchParams({story: infoStory}); if (STORY_NAME) q.set('stories', STORY_NAME);
  const url = location.origin + location.pathname + '?' + q.toString();
  clearTimeout(infoTimer);
  try { await navigator.clipboard.writeText(url); toast('Link zur Geschichte kopiert'); }
  catch (e) { window.prompt('Link zu dieser Geschichte:', url); }
});
loadStories(`stories/${STORY_NAME || 'winterthur'}.json`, !!STORY_NAME);

/* ---------- Minikarte unten links: Standort und Blickrichtung ---------- */
const mini = {map: null, layer: null, key: '', last: 0, busy: false};
const miniVisible = () => $('miniOn').checked && matchMedia('(min-width:1200px)').matches && $('intro').classList.contains('off');
async function miniTick(){
  if (!miniVisible() || mini.busy) return;
  if (!mini.map) {
    mini.busy = true;
    try { await needLeaflet(); } catch (e) { mini.busy = false; return; }
    mini.map = L.map('miniMap', {zoomControl: false, attributionControl: false, dragging: false, scrollWheelZoom: false,
      doubleClickZoom: false, boxZoom: false, keyboard: false, touchZoom: false, zoomSnap: 0});
    mini.busy = false;
  }
  const yr = Math.min(1949, Math.max(1870, +$('yr').value || 1880));
  const key = present ? 'now' : String(yr);
  if (key !== mini.key) {
    mini.key = key;
    const url = present ? 'https://wmts.geo.admin.ch/1.0.0/ch.swisstopo.pixelkarte-farbe/default/current/3857/{z}/{x}/{y}.jpeg'
                        : `https://wmts.geo.admin.ch/1.0.0/ch.swisstopo.hiks-siegfried/default/${yr}/3857/{z}/{x}/{y}.png`;
    if (mini.layer) mini.layer.setUrl(url); else mini.layer = L.tileLayer(url, {maxNativeZoom: present ? 18 : 16, maxZoom: 19}).addTo(mini.map);
  }
  const c = C.Cartographic.fromCartesian(camera.position);
  const agl = c.height - (globe.getHeight(c) ?? c.height - 300);
  const z = agl < 60 ? 16 : agl < 600 ? 15 : agl < 2500 ? 14 : 12;
  mini.map.invalidateSize({pan: false});
  mini.map.setView([C.Math.toDegrees(c.latitude), C.Math.toDegrees(c.longitude)], z, {animate: false});
  $('miniArrow').style.transform = `rotate(${(C.Math.toDegrees(camera.heading) + 360) % 360}deg)`;
}
setInterval(miniTick, 300);
$('miniOn').addEventListener('change', e => { $('mini').classList.toggle('on', e.target.checked); });
$('mini').addEventListener('click', () => openMap());

/* ---------- Bild speichern: PNG mit Jahr, Ort und Quellenangabe ---------- */
function saveShot(){
  let src;
  try { viewer.render(); src = viewer.canvas.toDataURL('image/png'); } catch (e) { toast('Bild konnte nicht erstellt werden'); return; }
  const img = new Image();
  img.onload = () => {
    const W = img.width, H = img.height, u = Math.max(1, W / 1400);
    const band = Math.round(78 * u);
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H + band;
    const g = cv.getContext('2d');
    g.drawImage(img, 0, 0);
    g.fillStyle = '#fbfaf7'; g.fillRect(0, H, W, band);
    g.fillStyle = '#e2e0da'; g.fillRect(0, H, W, Math.max(1, u));
    const yearTxt = present ? 'Heute' : $('yBig').textContent;
    const c = C.Cartographic.fromCartesian(camera.position);
    const [E, N] = toLV95(C.Math.toDegrees(c.longitude), C.Math.toDegrees(c.latitude));
    const pad = Math.round(22 * u);
    g.textBaseline = 'alphabetic';
    g.fillStyle = '#8a5a2b'; g.font = `800 ${Math.round(38 * u)}px Archivo, system-ui, sans-serif`;
    g.fillText(yearTxt, pad, H + Math.round(50 * u));
    const yw = g.measureText(yearTxt).width + pad;
    g.fillStyle = '#16161a'; g.font = `600 ${Math.round(19 * u)}px Archivo, system-ui, sans-serif`;
    g.fillText(`${placeName} · ${$('yLbl').textContent} · LV95 ${fmt(E)} / ${fmt(N)}`, pad + yw, H + Math.round(34 * u), W - yw - 2 * pad);
    g.fillStyle = '#5a5a5f'; g.font = `400 ${Math.round(15 * u)}px Archivo, system-ui, sans-serif`;
    const note = present ? '' : ($('genOn').checked ? ' · Abgerissene Häuser aus der Karte rekonstruiert, Höhe geschätzt' : '');
    g.fillText(`Daten: © swisstopo (Karten, swissBUILDINGS3D, Gelände), BFS Gebäuderegister${note} · Zeitreise Schweiz`, pad + yw, H + Math.round(60 * u), W - yw - 2 * pad);
    cv.toBlob(b => {
      if (!b) { toast('Bild konnte nicht erstellt werden'); return; }
      const a = document.createElement('a'), slug = placeName.toLowerCase().replace(/[^a-z0-9äöü]+/g, '-').replace(/^-|-$/g, '');
      a.href = URL.createObjectURL(b); a.download = `zeitreise-${slug || 'ort'}-${String(yearTxt).toLowerCase()}.png`;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 5000);
      toast('Bild gespeichert');
    }, 'image/png');
  };
  img.src = src;
}
$('shotBtn').addEventListener('click', saveShot);

/* ---------- Gebäude-Export: belegte und rekonstruierte Häuser des gebauten Gebiets zum gewählten Jahr ---------- */
const SRC_OLD = 'swissBUILDINGS3D (swisstopo), Gebäuderegister GWR (BFS)';
function exportRows(){
  if (!city || !city.edition || !gwr.info) return null;
  const year = +$('yr').value || 1880, ed = city.eds.get(city.edition), rows = [];
  for (const [egid, r] of gwr.info) if (r.y <= year) {
    const [E, N] = toLV95(r.lon, r.lat);
    rows.push({status: 'belegt', egid, adresse: r.adr, baujahr: r.exact ? r.y : '', bauperiode: r.exact ? '' : 'vor 1919',
      kartenstand: '', geschosse_geschaetzt: '', flaeche_m2: '', lon: +r.lon.toFixed(6), lat: +r.lat.toFixed(6), e_lv95: Math.round(E), n_lv95: Math.round(N), quelle: SRC_OLD});
  }
  for (const h of ed.recs) {
    const [E, N] = toLV95(h.lon, h.lat);
    rows.push({status: 'rekonstruiert', egid: '', adresse: '', baujahr: '', bauperiode: '', kartenstand: ed.year,
      geschosse_geschaetzt: h.floors, flaeche_m2: h.m2, lon: +h.lon.toFixed(6), lat: +h.lat.toFixed(6), e_lv95: Math.round(E), n_lv95: Math.round(N),
      quelle: `Siegfriedkarte ${ed.year} (swisstopo), Grundriss aus der Karte, Höhe geschätzt`});
  }
  return {year, rows};
}
function download(name, text, type){
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], {type}));
  a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}
const fileSlug = () => placeName.toLowerCase().replace(/[^a-z0-9äöü]+/g, '-').replace(/^-|-$/g, '') || 'ort';
$('csvBtn').addEventListener('click', () => {
  const x = exportRows(); if (!x) { toast('Zuerst ein Gebiet bauen'); return; }
  const cols = Object.keys(x.rows[0] || {status: ''});
  const esc = v => { const t = String(v ?? ''); return /[;"\n]/.test(t) ? '"' + t.replace(/"/g, '""') + '"' : t; };
  const csv = '\ufeff' + [cols.join(';'), ...x.rows.map(r => cols.map(k => esc(r[k])).join(';'))].join('\r\n');
  download(`gebaeude-${fileSlug()}-${x.year}.csv`, csv, 'text/csv;charset=utf-8');
  toast(`${x.rows.length} Gebäude exportiert`);
});
$('geoBtn').addEventListener('click', () => {
  const x = exportRows(); if (!x) { toast('Zuerst ein Gebiet bauen'); return; }
  const gj = {type: 'FeatureCollection', name: `Zeitreise Schweiz – ${placeName} ${x.year}`,
    quelle: 'Daten: © swisstopo (Siegfriedkarte, swissBUILDINGS3D), BFS Gebäuderegister GWR; Methodik: methodik.html',
    features: x.rows.map(r => { const {lon, lat, ...props} = r; return {type: 'Feature', geometry: {type: 'Point', coordinates: [lon, lat]}, properties: props}; })};
  download(`gebaeude-${fileSlug()}-${x.year}.geojson`, JSON.stringify(gj, null, 1), 'application/geo+json');
  toast(`${x.rows.length} Gebäude exportiert`);
});
/* ---------- Einbetten: iframe-Code mit der aktuellen Ansicht ---------- */
$('embedBtn').addEventListener('click', () => {
  if (document.pointerLockElement) document.exitPointerLock();
  const url = permalink().replace('?', '?embed=1&').replace(/&/g, '&amp;');
  $('embedCode').value = `<iframe src="${url}" width="100%" height="560" style="border:0;border-radius:8px" allow="fullscreen" allowfullscreen loading="lazy" title="Zeitreise Schweiz – 3D-Ansicht"></iframe>`;
  $('embedDlg').hidden = false;
  $('embedCode').focus(); $('embedCode').select();
});
$('embedCopy').addEventListener('click', async () => {
  try { await navigator.clipboard.writeText($('embedCode').value); toast('Code kopiert'); }
  catch (e) { $('embedCode').select(); toast('Markiert – mit Strg+C kopieren'); }
});
$('embedClose').addEventListener('click', () => { $('embedDlg').hidden = true; });
$('embedDlg').addEventListener('click', e => { if (e.target === $('embedDlg')) $('embedDlg').hidden = true; });
$('embedDlg').addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Escape') $('embedDlg').hidden = true; });
$('openFull').addEventListener('click', () => { $('openFull').href = permalink(); });
/* 2D-Karte am aktuellen Ort und im gewählten Jahr öffnen */
$('to2d').addEventListener('click', () => {
  const [lon, lat] = centerLonLat(), q = new URLSearchParams({lat: lat.toFixed(5), lon: lon.toFixed(5), z: 16, mode: 'time'});
  if (!present) { q.set('t', 'sieg'); q.set('y', +$('yr').value || 1880); }
  $('to2d').href = 'karte-2d.html?' + q.toString();
});
/* ---------- Kiosk-Modus (?kiosk=1): Rundflug im Leerlauf, Neustart nach 2 Minuten ohne Eingabe ---------- */
const KIOSK = new URLSearchParams(location.search).get('kiosk') === '1';
const kiosk = {auto: false, last: performance.now(), hdg: 0, yearT: 0, ei: 0};
const KIOSK_CENTER = C.Cartesian3.fromDegrees(8.7290, 47.4997, 450), KIOSK_ENU = C.Transforms.eastNorthUpToFixedFrame(KIOSK_CENTER);
/* Kamera im Kreis um die Altstadt: Blickrichtung aus Kurs und Neigung, Abstand r */
function kioskView(h, pDeg, r){
  const p = C.Math.toRadians(pDeg);
  const local = new C.Cartesian3(-Math.sin(h) * Math.cos(p) * r, -Math.cos(h) * Math.cos(p) * r, -Math.sin(p) * r);
  const pos = C.Matrix4.multiplyByPoint(KIOSK_ENU, local, new C.Cartesian3());
  camera.setView({destination: pos, orientation: {heading: h, pitch: p, roll: 0}});
}
function kioskStart(){
  kiosk.auto = true; kiosk.hdg = 0; kiosk.yearT = performance.now(); kiosk.ei = 0;
  if (document.pointerLockElement) document.exitPointerLock();
  tourEnd(); closeMap(); $('embedDlg').hidden = true; $('info').hidden = true;
  if (meas.on) setMeasure(false);
  if (present) setPresent(false);
  setMode(false); setPanel(false);
  $('yr').value = EDITIONS[0]; $('yBig').textContent = EDITIONS[0]; applyYear(EDITIONS[0]); showLayer();
  $('attract').hidden = false;
}
function kioskStop(){
  if (!kiosk.auto) return;
  kiosk.auto = false;
  $('attract').hidden = true;
}
if (KIOSK) {
  document.body.classList.add('kiosk');
  closeIntro();
  for (const ev of ['pointerdown', 'keydown', 'wheel', 'touchstart'])
    window.addEventListener(ev, () => { kiosk.last = performance.now(); kioskStop(); }, {capture: true, passive: true});
  setInterval(() => { if (!kiosk.auto && performance.now() - kiosk.last > 120000) kioskStart(); }, 2000);
  scene.preRender.addEventListener((sc, time) => {
    if (!kiosk.auto) return;
    kiosk.hdg += REDUCE ? 0.0004 : 0.0012;
    kioskView(kiosk.hdg, -28, 1100);
    /* alle 20 Sekunden die nächste Kartenausgabe zeigen */
    if (performance.now() - kiosk.yearT > 20000) {
      kiosk.yearT = performance.now(); kiosk.ei = (kiosk.ei + 1) % EDITIONS.length;
      const y = EDITIONS[kiosk.ei];
      $('yr').value = y; $('yBig').textContent = y; applyYear(y); showLayer();
    }
  });
  kioskStart();
}
if (LINK) {
  closeIntro();
  camera.setView({destination: C.Cartesian3.fromDegrees(LINK.lon, LINK.lat, LINK.h),
    orientation: {heading: C.Math.toRadians(LINK.hdg), pitch: C.Math.toRadians(LINK.pitch), roll: 0}});
  if (LINK.year) { $('yr').value = LINK.year; $('yBig').textContent = LINK.year; applyYear(LINK.year); showLayer(); }
  if (LINK.mode === 'now') setPresent(true);
  if (LINK.mode === 'walk') { setMode(true); setPanel(false); }
}
}
