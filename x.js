
{
const $ = id => document.getElementById(id);
const KEY = 'zeitreise-werkstatt-v1';
let doc = {ort: '', geschichten: []}, edit = -1, pos = null, marker = null;
const markers = [];

/* Entwurf im Browser merken (nur dieser Browser; die Datei selbst ist das Ergebnis) */
function saveDraft(){ try { localStorage.setItem(KEY, JSON.stringify({doc, fname: $('fname').value})); } catch (e) {} }
function loadDraft(){
  try { const d = JSON.parse(localStorage.getItem(KEY) || 'null'); if (d && d.doc && Array.isArray(d.doc.geschichten)) { doc = d.doc; $('fname').value = d.fname || ''; } } catch (e) {}
  $('ort').value = doc.ort || '';
}

const slug = t => String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);
const yearOrNull = v => { const t = String(v).trim(); if (!t) return null; const n = Number(t); return Number.isInteger(n) ? n : NaN; };

/* gleiche Regeln wie beim Laden im 3D-Flug, dazu die Quellenregeln der Anleitung */
function problems(st){
  const p = [];
  if (!st.titel) p.push('Titel fehlt');
  if (!st.text) p.push('Text fehlt');
  if (!st.quelle) p.push('Quelle fehlt');
  if (!(Number.isFinite(st.lon) && Number.isFinite(st.lat)) && !st.adresse) p.push('Lage fehlt (Adresse oder Punkt in der Karte)');
  if (Number.isFinite(st.lon) && !(st.lon > 5.9 && st.lon < 10.6 && st.lat > 45.8 && st.lat < 47.9)) p.push('Lage liegt nicht in der Schweiz');
  if (Number.isNaN(st.von) || Number.isNaN(st.bis)) p.push('Jahr muss eine ganze Zahl sein');
  if (st.von != null && st.bis != null && st.bis < st.von) p.push('«bis» liegt vor «ab»');
  if (st.url && !/^https:\/\/[^\s]+$/.test(st.url)) p.push('Link muss mit https:// beginnen');
  if (/<[a-z\/][^>]*>/i.test(st.text || '')) p.push('Text enthält HTML – bitte nur reinen Text');
  return p;
}
function readForm(){
  const st = {
    id: '', titel: $('titel').value.trim(), text: $('text').value.trim(),
    von: yearOrNull($('von').value), bis: yearOrNull($('bis').value),
    quelle: $('quelle').value.trim()
  };
  const adr = $('adresse').value.trim(); if (adr) st.adresse = adr;
  if (pos) { st.lon = +pos[0].toFixed(6); st.lat = +pos[1].toFixed(6); }
  const u = $('url').value.trim(); if (u) st.url = u;
  return st;
}
function fillForm(st){
  $('titel').value = st ? st.titel || '' : ''; $('text').value = st ? st.text || '' : '';
  $('von').value = st && st.von != null ? st.von : ''; $('bis').value = st && st.bis != null ? st.bis : '';
  $('adresse').value = st ? st.adresse || '' : ''; $('quelle').value = st ? st.quelle || '' : ''; $('url').value = st ? st.url || '' : '';
  setPos(st && Number.isFinite(st.lon) && Number.isFinite(st.lat) ? [st.lon, st.lat] : null, !!st);
  $('textCount').textContent = $('text').value.length;
  $('formErr').textContent = ''; $('formOk').textContent = '';
  $('editLbl').textContent = edit >= 0 ? `– bearbeiten (${edit + 1})` : '– neu';
}
function setPos(ll, pan){
  pos = ll;
  $('coordLbl').textContent = ll ? `Lage: ${ll[1].toFixed(5)} N, ${ll[0].toFixed(5)} O (WGS84)` : 'Noch keine Lage gesetzt.';
  if (!map) return;
  if (marker) { map.removeLayer(marker); marker = null; }
  if (ll) { marker = L.circleMarker([ll[1], ll[0]], {radius: 9, color: '#fff', weight: 2, fillColor: '#c8803f', fillOpacity: 1}).addTo(map); if (pan) map.setView([ll[1], ll[0]], Math.max(map.getZoom(), 16)); }
}

/* JSON im Format von stories/README.md */
function output(){
  const used = new Set();
  const g = doc.geschichten.map(st => {
    let id = slug(st.id || st.titel) || 'geschichte', k = id, i = 2;
    while (used.has(k)) k = `${id}-${i++}`;
    used.add(k);
    const o = {id: k, titel: st.titel, text: st.text, von: st.von ?? null, bis: st.bis ?? null};
    if (st.adresse) o.adresse = st.adresse;
    if (Number.isFinite(st.lon) && Number.isFinite(st.lat)) { o.lon = st.lon; o.lat = st.lat; }
    o.quelle = st.quelle;
    if (st.url) o.url = st.url;
    return o;
  });
  return {ort: doc.ort || '', geschichten: g};
}
function render(){
  const list = $('list'); list.textContent = '';
  for (const m of markers) map && map.removeLayer(m); markers.length = 0;
  let nBad = 0;
  doc.geschichten.forEach((st, i) => {
    const li = document.createElement('li'), d = document.createElement('div'), b = document.createElement('b'), sm = document.createElement('small');
    const pr = problems(st); if (pr.length) { li.classList.add('bad'); nBad++; }
    b.textContent = st.titel || '(ohne Titel)';
    sm.textContent = pr.length ? 'Fehlt: ' + pr.join(', ') : [st.von != null ? `ab ${st.von}` : '', st.adresse || (Number.isFinite(st.lon) ? 'Punkt in der Karte' : ''), st.quelle].filter(Boolean).join(' · ');
    d.append(b, sm);
    const eb = document.createElement('button'); eb.className = 'btn'; eb.type = 'button'; eb.textContent = 'Bearbeiten';
    eb.addEventListener('click', () => { edit = i; fillForm(st); $('titel').focus(); });
    const db = document.createElement('button'); db.className = 'btn'; db.type = 'button'; db.textContent = 'Löschen';
    db.setAttribute('aria-label', `«${st.titel || 'ohne Titel'}» löschen`);
    db.addEventListener('click', () => { if (!confirm(`«${st.titel || 'ohne Titel'}» löschen?`)) return; doc.geschichten.splice(i, 1); if (edit === i) { edit = -1; fillForm(null); } else if (edit > i) edit--; render(); });
    li.append(d, eb, db); list.appendChild(li);
    if (map && Number.isFinite(st.lon) && Number.isFinite(st.lat)) {
      const m = L.circleMarker([st.lat, st.lon], {radius: 7, color: '#fff', weight: 2, fillColor: '#1f5fa8', fillOpacity: .9}).addTo(map);
      m.bindTooltip(document.createTextNode(st.titel || ''));   /* Titel als Text, nicht als HTML */
      m.on('click', () => { edit = i; fillForm(st); });
      markers.push(m);
    }
  });
  const n = doc.geschichten.length;
  $('nStories').textContent = n; $('emptyHint').hidden = n > 0;
  $('dlBtn').disabled = $('copyBtn').disabled = !n;
  $('preview').textContent = JSON.stringify(output(), null, 2);
  const fn = $('fname').value.trim();
  $('testHint').textContent = (nBad ? `${nBad} Geschichte(n) noch unvollständig – sie würden beim Laden übersprungen. ` : '') +
    (fn && /^[a-z0-9-]{1,40}$/.test(fn) ? `Nach der Freischaltung testen mit: flug-3d.html?stories=${fn}` : 'Dateiname eintragen, um den Testlink zu sehen.');
  saveDraft();
}

$('text').addEventListener('input', () => { $('textCount').textContent = $('text').value.length; });
$('ort').addEventListener('input', () => { doc.ort = $('ort').value.trim(); if (!$('fname').dataset.touched) $('fname').value = slug(doc.ort); render(); });
$('fname').addEventListener('input', () => { $('fname').dataset.touched = '1'; render(); });
$('saveBtn').addEventListener('click', () => {
  const st = readForm(), pr = problems(st);
  if (edit >= 0 && doc.geschichten[edit]) st.id = doc.geschichten[edit].id || '';
  if (pr.length) { $('formErr').textContent = pr.join('\n'); $('formOk').textContent = ''; return; }
  if (edit >= 0) doc.geschichten[edit] = st; else doc.geschichten.push(st);
  edit = -1; fillForm(null); render();
  $('formOk').textContent = 'Übernommen. Nächste Geschichte erfassen oder die Datei herunterladen.';
});
$('newBtn').addEventListener('click', () => { edit = -1; fillForm(null); $('titel').focus(); });
$('clearAll').addEventListener('click', () => {
  if (doc.geschichten.length && !confirm('Alle erfassten Geschichten löschen?')) return;
  doc = {ort: '', geschichten: []}; edit = -1; $('ort').value = ''; $('fname').value = ''; delete $('fname').dataset.touched; fillForm(null); render();
});
$('importFile').addEventListener('change', async e => {
  const f = e.target.files[0]; e.target.value = ''; $('fileErr').textContent = '';
  if (!f) return;
  try {
    const raw = await f.text();
    if (/\.(csv|txt)$/i.test(f.name) || !/^\s*[\[{]/.test(raw)) { importCsv(raw); return; }
    const d = JSON.parse(raw);
    if (!d || !Array.isArray(d.geschichten)) throw new Error('kein Feld «geschichten»');
    const num = v => typeof v === 'number' && Number.isFinite(v) ? v : undefined, str = v => typeof v === 'string' ? v : '';
    doc = {ort: str(d.ort), geschichten: d.geschichten.filter(x => x && typeof x === 'object').map(x => ({
      id: str(x.id), titel: str(x.titel), text: str(x.text), von: Number.isInteger(x.von) ? x.von : null, bis: Number.isInteger(x.bis) ? x.bis : null,
      ...(str(x.adresse) ? {adresse: str(x.adresse)} : {}), ...(num(x.lon) !== undefined && num(x.lat) !== undefined ? {lon: x.lon, lat: x.lat} : {}),
      quelle: str(x.quelle), ...(str(x.url) ? {url: str(x.url)} : {})}))};
    $('ort').value = doc.ort; $('fname').value = f.name.replace(/\.json$/i, '').toLowerCase().replace(/[^a-z0-9-]/g, '-').slice(0, 40); $('fname').dataset.touched = '1';
    edit = -1; fillForm(null); render();
    const pts = doc.geschichten.filter(s => Number.isFinite(s.lon)).map(s => [s.lat, s.lon]);
    if (map && pts.length) map.fitBounds(pts, {padding: [30, 30], maxZoom: 16});
  } catch (err) { $('fileErr').textContent = 'Datei konnte nicht gelesen werden: ' + (err && err.message ? err.message : 'kein gültiges JSON'); }
});
/* Tabelle (CSV) einlesen: Trennzeichen ; , oder Tab, Felder in Anführungszeichen erlaubt; Zeilen werden angehängt */
function parseCsv(t){
  t = t.replace(/^\ufeff/, '');
  const first = t.split(/\r?\n/)[0], delim = [';', '\t', ','].sort((a, b) => first.split(b).length - first.split(a).length)[0];
  const rows = []; let row = [], cur = '', q = false;
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (q) { if (c === '"') { if (t[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += c; }
    else if (c === '"') q = true;
    else if (c === delim) { row.push(cur); cur = ''; }
    else if (c === '\n' || c === '\r') { if (c === '\r' && t[i + 1] === '\n') i++; row.push(cur); rows.push(row); row = []; cur = ''; }
    else cur += c;
  }
  if (cur || row.length) { row.push(cur); rows.push(row); }
  return rows.filter(r => r.some(v => v.trim()));
}
function importCsv(raw){
  const rows = parseCsv(raw);
  if (rows.length < 2) throw new Error('Tabelle ohne Datenzeilen');
  const head = rows[0].map(h => h.trim().toLowerCase().replace(/^"|"$/g, ''));
  const col = k => head.indexOf(k);
  if (col('titel') < 0 || col('text') < 0) throw new Error('Spalten «titel» und «text» fehlen in der ersten Zeile');
  const get = (r, k) => col(k) >= 0 ? String(r[col(k)] ?? '').trim() : '';
  const yr = v => { if (!v) return null; const n = Number(v); return Number.isInteger(n) ? n : NaN; };
  const dec = v => { const n = Number(String(v).replace(',', '.')); return v && Number.isFinite(n) ? n : undefined; };
  let n = 0;
  for (const r of rows.slice(1)) {
    const st = {id: get(r, 'id'), titel: get(r, 'titel'), text: get(r, 'text'), von: yr(get(r, 'von')), bis: yr(get(r, 'bis')), quelle: get(r, 'quelle')};
    if (get(r, 'adresse')) st.adresse = get(r, 'adresse');
    const lon = dec(get(r, 'lon')), lat = dec(get(r, 'lat'));
    if (lon !== undefined && lat !== undefined) { st.lon = lon; st.lat = lat; }
    if (get(r, 'url')) st.url = get(r, 'url');
    doc.geschichten.push(st); n++;
  }
  edit = -1; fillForm(null); render();
  const bad = doc.geschichten.slice(-n).filter(st => problems(st).length).length;
  $('formOk').textContent = `${n} Zeilen aus der Tabelle angehängt` + (bad ? `, ${bad} davon unvollständig (rot markiert, zum Ergänzen auf «Bearbeiten»).` : '.');
  const pts = doc.geschichten.filter(s => Number.isFinite(s.lon)).map(s => [s.lat, s.lon]);
  if (map && pts.length) map.fitBounds(pts, {padding: [30, 30], maxZoom: 16});
}
$('dlBtn').addEventListener('click', () => {
  const name = (/^[a-z0-9-]{1,40}$/.test($('fname').value.trim()) ? $('fname').value.trim() : slug(doc.ort) || 'geschichten') + '.json';
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(output(), null, 2) + '\n'], {type: 'application/json'}));
  a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
});
$('copyBtn').addEventListener('click', async () => {
  const t = JSON.stringify(output(), null, 2);
  try { await navigator.clipboard.writeText(t); $('testHint').textContent = 'JSON kopiert.'; }
  catch (e) { $('preview').parentElement.open = true; getSelection().selectAllChildren($('preview')); }
});

/* Suche über geo.admin.ch: Ergebnisse als Text einfügen */
const plain = t => String(t || '').replace(/<[^>]+>/g, '').trim();
function attachSearch(inp, ul, origins, onPick){
  let timer, items = [], sel = -1;
  const draw = () => {
    ul.textContent = '';
    items.forEach((it, i) => {
      const li = document.createElement('li'); li.setAttribute('role', 'option'); li.setAttribute('aria-selected', i === sel);
      li.textContent = it.name; const sm = document.createElement('small'); sm.textContent = it.kind; li.appendChild(sm);
      li.addEventListener('mousedown', e => { e.preventDefault(); pick(i); });
      ul.appendChild(li);
    });
    ul.hidden = !items.length;
  };
  const pick = i => { const it = items[i]; if (!it) return; ul.hidden = true; onPick(it); };
  inp.addEventListener('input', () => {
    clearTimeout(timer); const q = inp.value.trim();
    if (q.length < 3) { items = []; draw(); return; }
    timer = setTimeout(async () => {
      try {
        const u = `https://api3.geo.admin.ch/rest/services/api/SearchServer?searchText=${encodeURIComponent(q)}&type=locations&sr=4326&limit=6${origins ? '&origins=' + origins : ''}`;
        const j = await (await fetch(u)).json();
        const KIND = {gg25: 'Gemeinde', address: 'Adresse', zipcode: 'Postleitzahl', sn25: 'Ort/Flurname', gazetteer: 'Ort'};
        items = (j.results || []).map(r => ({name: plain(r.attrs.label), kind: KIND[r.attrs.origin] || 'Ort', lon: +r.attrs.lon, lat: +r.attrs.lat})).filter(it => Number.isFinite(it.lon) && Number.isFinite(it.lat));
        sel = -1; draw();
      } catch (e) { items = []; draw(); }
    }, 250);
  });
  inp.addEventListener('keydown', e => {
    if (e.key === 'ArrowDown') { sel = Math.min(items.length - 1, sel + 1); draw(); e.preventDefault(); }
    if (e.key === 'ArrowUp') { sel = Math.max(0, sel - 1); draw(); e.preventDefault(); }
    if (e.key === 'Enter' && items.length) { pick(sel < 0 ? 0 : sel); e.preventDefault(); }
    if (e.key === 'Escape') ul.hidden = true;
  });
  inp.addEventListener('blur', () => setTimeout(() => { ul.hidden = true; }, 150));
}
attachSearch($('adresse'), $('adrRes'), 'address', it => { $('adresse').value = it.name; setPos([it.lon, it.lat], true); });
attachSearch($('mapQ'), $('mapRes'), '', it => { $('mapQ').value = it.name; if (map) map.setView([it.lat, it.lon], it.kind === 'Adresse' ? 17 : 15); });

/* Karte: Landeskarte von swisstopo, Klick setzt die Lage */
let map = null;
if (window.L) {
  map = L.map('map', {minZoom: 8, maxZoom: 19}).setView([47.4997, 8.7290], 15);
  L.tileLayer('https://wmts.geo.admin.ch/1.0.0/ch.swisstopo.pixelkarte-farbe/default/current/3857/{z}/{x}/{y}.jpeg', {maxNativeZoom: 18, maxZoom: 19, attribution: '© swisstopo'}).addTo(map);
  map.on('click', e => setPos([e.latlng.lng, e.latlng.lat], false));
} else {
  $('map').textContent = 'Die Karte konnte nicht geladen werden. Die Lage lässt sich über die Adresse setzen.';
}
loadDraft(); fillForm(null); render();
const pts0 = doc.geschichten.filter(s => Number.isFinite(s.lon)).map(s => [s.lat, s.lon]);
if (map && pts0.length) map.fitBounds(pts0, {padding: [30, 30], maxZoom: 16});
}
