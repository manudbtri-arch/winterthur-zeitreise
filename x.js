
{
const SRC = {
  zeit:  {name:'Landeskarte-Zeitreihe', layer:'ch.swisstopo.zeitreihen', fmt:'png', min:1844, max:1960, ts:y=>y+'1231', nz:16},
  sieg:  {name:'Siegfriedkarte', layer:'ch.swisstopo.hiks-siegfried', fmt:'png', min:1870, max:1949, ts:y=>String(y), nz:16},
  luft:  {name:'Luftbild (Archiv)', layer:'ch.swisstopo.swissimage-product', fmt:'png', min:1926, max:2025, ts:y=>String(y===1928?1927:y), nz:18},
  dufour:{name:'Dufourkarte', layer:'ch.swisstopo.hiks-dufour', fmt:'png', fixed:'current', nz:15},
  karte: {name:'Heute: Landeskarte', layer:'ch.swisstopo.pixelkarte-farbe', fmt:'jpeg', fixed:'current', nz:18},
  foto:  {name:'Heute: Luftbild', layer:'ch.swisstopo.swissimage', fmt:'jpeg', fixed:'current', nz:19}
};
const PLACES = [
  ['Altstadt',[47.4998,8.7290]],['Bahnhof & Sulzer-Areal',[47.4985,8.7215]],
  ['Töss',[47.4880,8.7080]],['Wülflingen',[47.5100,8.6880]],
  ['Veltheim',[47.5150,8.7180]],['Oberwinterthur',[47.5080,8.7590]]
];
const ATTR = '© <a href="https://www.swisstopo.admin.ch">swisstopo</a>';
const $ = id => document.getElementById(id);

const map = L.map('map',{zoomControl:true,minZoom:12,maxZoom:19}).setView(PLACES[0][1],15);
const mk = (key,year,pane) => {
  const s = SRC[key], t = s.fixed || s.ts(year);
  return L.tileLayer(`https://wmts.geo.admin.ch/1.0.0/${s.layer}/default/${t}/3857/{z}/{x}/{y}.${s.fmt}`,
    {maxNativeZoom:s.nz,maxZoom:19,attribution:ATTR,pane:pane||'tilePane'});
};
const fill = (sel,keys,val) => { sel.innerHTML = keys.map(k=>`<option value="${k}">${SRC[k].name}</option>`).join(''); sel.value = val; };
const setRange = (inp,key,keep) => {
  const s = SRC[key];
  inp.disabled = !!s.fixed;
  if (s.fixed) return;
  inp.min = s.min; inp.max = s.max;
  inp.value = Math.min(s.max, Math.max(s.min, +keep || s.min));
};

/* weicher Wechsel: neue Ebene erst einblenden, wenn sie geladen ist */
function swap(holder, layer, onReady){
  const old = holder.cur;
  holder.cur = layer;
  layer.addTo(map);
  layer.once('load', () => { if (old && old !== holder.cur) map.removeLayer(old); onReady && onReady(); });
  if (old) setTimeout(() => { if (old !== holder.cur && map.hasLayer(old)) map.removeLayer(old); }, 4000);
}
const debounce = (fn,ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(()=>fn(...a), ms); }; };

/* ---------- Zeitregler ---------- */
const base = mk('karte').addTo(map);
const hist = {cur:null};
const tKeys = ['zeit','sieg','luft'];
fill($('tSrc'), tKeys, 'zeit');
setRange($('tYear'),'zeit',1900);

function showTime(after){
  const key = $('tSrc').value, y = +$('tYear').value, s = SRC[key];
  $('yBig').textContent = (key==='luft' && y===1928) ? '1927' : y;
  $('yLbl').textContent = s.name;
  const l = mk(key,y); l.setOpacity(1 - $('tOp').value/100);
  swap(hist, l, after);
}
const showTimeD = debounce(()=>showTime(),180);
$('tSrc').addEventListener('change', () => { setRange($('tYear'),$('tSrc').value,$('tYear').value); showTime(); });
$('tYear').addEventListener('input', () => { $('yBig').textContent = $('tYear').value; showTimeD(); });
$('tOp').addEventListener('input', () => { $('opV').textContent = $('tOp').value+' %'; hist.cur && hist.cur.setOpacity(1 - $('tOp').value/100); });
const step = d => { const i = $('tYear'); const v = Math.min(+i.max, Math.max(+i.min, +i.value + d)); if (v === +i.value) return false; i.value = v; return true; };
$('prev').addEventListener('click', () => { if (step(-1)) showTime(); });
$('next').addEventListener('click', () => { if (step(1)) showTime(); });

let playing = false;
function tick(){
  if (!playing) return;
  if (!step(1)) { stop(); return; }
  showTime(() => setTimeout(tick, 500));
}
function stop(){ playing = false; $('play').textContent = '▶ Abspielen'; }
$('play').addEventListener('click', () => {
  if (playing) return stop();
  const i = $('tYear'); if (+i.value >= +i.max) i.value = i.min;
  playing = true; $('play').textContent = '❚❚ Pause';
  showTime(() => setTimeout(tick, 500));
});

/* ---------- Vergleich (Wischen) ---------- */
map.createPane('left').style.zIndex = 250;
map.createPane('right').style.zIndex = 251;
const L_ = {cur:null}, R_ = {cur:null};
const cKeys = ['zeit','sieg','dufour','luft','karte','foto'];
fill($('lSrc'), cKeys, 'sieg'); setRange($('lYear'),'sieg',1880);
fill($('rSrc'), cKeys, 'foto'); setRange($('rYear'),'foto');
let frac = 0.5;

function label(side){
  const key = $(side+'Src').value, s = SRC[key];
  const y = s.fixed ? (key==='dufour' ? '1845–65' : 'heute') : $(side+'Year').value;
  $(side+'Yv').textContent = s.fixed ? '–' : y;
  $(side==='l'?'tagL':'tagR').textContent = s.name.replace('Heute: ','') + ' · ' + y;
}
function showSide(side){
  label(side);
  swap(side==='l'?L_:R_, mk($(side+'Src').value, +$(side+'Year').value, side==='l'?'left':'right'));
}
function clip(){
  if ($('pCmp').hidden) return;
  const size = map.getSize(), nw = map.containerPointToLayerPoint([0,0]), se = map.containerPointToLayerPoint(size);
  const x = nw.x + size.x*frac;
  map.getPane('left').style.clip  = `rect(${nw.y}px, ${x}px, ${se.y}px, ${nw.x}px)`;
  map.getPane('right').style.clip = `rect(${nw.y}px, ${se.x}px, ${se.y}px, ${x}px)`;
  $('divider').style.left = (size.x*frac)+'px';
  const tl = $('tagL'), tr = $('tagR');
  tl.style.left = Math.max(8, size.x*frac - tl.offsetWidth - 12)+'px';
  tr.style.left = Math.min(size.x - tr.offsetWidth - 8, size.x*frac + 12)+'px';
}
map.on('move zoom resize zoomend', clip);
['l','r'].forEach(s => {
  $(s+'Src').addEventListener('change', () => { setRange($(s+'Year'),$(s+'Src').value,$(s+'Year').value); showSide(s); clip(); });
  const d = debounce(()=>{ showSide(s); clip(); },180);
  $(s+'Year').addEventListener('input', () => { label(s); clip(); d(); });
});
const dv = $('divider');
dv.addEventListener('pointerdown', e => {
  dv.setPointerCapture(e.pointerId); map.dragging.disable();
  const mv = ev => { const r = map.getContainer().getBoundingClientRect(); frac = Math.min(.98, Math.max(.02, (ev.clientX - r.left)/r.width)); clip(); };
  const up = () => { dv.removeEventListener('pointermove', mv); map.dragging.enable(); };
  dv.addEventListener('pointermove', mv);
  dv.addEventListener('pointerup', up, {once:true});
});

/* ---------- Modus ---------- */
function mode(cmp){
  stop();
  $('mTime').setAttribute('aria-pressed', !cmp); $('mCmp').setAttribute('aria-pressed', cmp);
  $('pTime').hidden = cmp; $('pCmp').hidden = !cmp;
  [dv,$('tagL'),$('tagR')].forEach(el => el.hidden = !cmp);
  if (cmp){
    map.removeLayer(base); if (hist.cur) { map.removeLayer(hist.cur); hist.cur = null; }
    showSide('l'); showSide('r'); clip();
  } else {
    [L_,R_].forEach(h => { if (h.cur) { map.removeLayer(h.cur); h.cur = null; } });
    base.addTo(map); showTime();
  }
}
$('mTime').addEventListener('click', () => mode(false));
$('mCmp').addEventListener('click', () => mode(true));

$('places').innerHTML = PLACES.map((p,i)=>`<button class="btn" data-i="${i}">${p[0]}</button>`).join('');
$('places').addEventListener('click', e => { const b = e.target.closest('button'); if (b) map.setView(PLACES[+b.dataset.i][1], 16); });

/* ---------- Geschichten an Orten: gleiche Datei wie im 3D-Flug, Inhalte nur als Text ---------- */
const storyLayer = L.layerGroup().addTo(map);
async function loadStories(file){
  let data;
  try { data = await (await fetch(file)).json(); } catch (e) { return; }
  for (const st of (data.geschichten || [])) {
    if (typeof st.titel !== 'string' || typeof st.text !== 'string' || typeof st.quelle !== 'string') continue;
    let ll = Number.isFinite(st.lon) && Number.isFinite(st.lat) ? [st.lat, st.lon] : null;
    if (!ll && typeof st.adresse === 'string') {
      try {
        const u = `https://api3.geo.admin.ch/rest/services/api/SearchServer?searchText=${encodeURIComponent(st.adresse)}&type=locations&origins=address&sr=4326&limit=1`;
        const r = ((await (await fetch(u)).json()).results || [])[0];
        if (r && Number.isFinite(+r.attrs.lat)) ll = [+r.attrs.lat, +r.attrs.lon];
      } catch (e) {}
    }
    if (!ll) continue;
    const box = document.createElement('div'); box.className = 'story';
    const t = document.createElement('b'); t.textContent = st.titel;
    const p = document.createElement('p'); p.textContent = st.text;
    const q = document.createElement('small'); q.textContent = 'Quelle: ' + st.quelle;
    box.append(t, p, q);
    if (/^https:\/\//.test(st.url || '')) {
      const a = document.createElement('a'); a.href = st.url; a.target = '_blank'; a.rel = 'noopener'; a.textContent = 'Quelle öffnen';
      box.appendChild(a);
    }
    /* Direktlink in den 3D-Flug: fliegt zur Geschichte und öffnet ihre Infokarte */
    if (/^[A-Za-z0-9_-]{1,60}$/.test(String(st.id || ''))) {
      const a3 = document.createElement('a'); a3.href = 'flug-3d.html?story=' + encodeURIComponent(st.id); a3.textContent = 'Im 3D-Flug ansehen';
      box.appendChild(a3);
    }
    L.circleMarker(ll, {radius: 8, color: '#fff', weight: 2, fillColor: '#c8803f', fillOpacity: 1})
      .bindTooltip(document.createTextNode(st.titel)).bindPopup(box, {maxWidth: 300}).addTo(storyLayer);
  }
}
loadStories('stories/winterthur.json');
$('storyOn').addEventListener('change', e => { if (e.target.checked) storyLayer.addTo(map); else map.removeLayer(storyLayer); });

/* ---------- Ortssuche ganze Schweiz (geo.admin.ch); Ergebnisse nur als Text ---------- */
{
  const inp = $('q'), list = $('qres');
  const KIND = {gg25: 'Gemeinde', address: 'Adresse', zipcode: 'Postleitzahl', sn25: 'Ort/Flurname', kantone: 'Kanton', district: 'Bezirk', parcel: 'Parzelle', gazetteer: 'Ort'};
  const plain = t => String(t || '').replace(/<[^>]+>/g, '').trim();
  let timer, items = [], sel = -1;
  const render = () => {
    list.textContent = '';
    items.forEach((it, i) => {
      const li = document.createElement('li');
      li.setAttribute('role', 'option'); li.setAttribute('aria-selected', i === sel);
      li.textContent = it.name;
      const sm = document.createElement('small'); sm.textContent = it.kind; li.appendChild(sm);
      li.addEventListener('mousedown', e => { e.preventDefault(); pick(i); });
      list.appendChild(li);
    });
    list.hidden = !items.length; inp.setAttribute('aria-expanded', !list.hidden);
  };
  const pick = i => {
    const it = items[i]; if (!it) return;
    list.hidden = true; inp.value = it.name; inp.blur();
    map.setView([it.lat, it.lon], it.kind === 'Adresse' ? 18 : it.kind === 'Kanton' ? 12 : 16);
  };
  inp.addEventListener('input', () => {
    clearTimeout(timer);
    const q = inp.value.trim();
    if (q.length < 2) { items = []; render(); return; }
    timer = setTimeout(async () => {
      try {
        const j = await (await fetch(`https://api3.geo.admin.ch/rest/services/api/SearchServer?searchText=${encodeURIComponent(q)}&type=locations&sr=4326&limit=8`)).json();
        items = (j.results || []).map(r => ({name: plain(r.attrs.label), kind: KIND[r.attrs.origin] || 'Ort', lon: +r.attrs.lon, lat: +r.attrs.lat}))
          .filter(it => Number.isFinite(it.lon) && Number.isFinite(it.lat));
      } catch (e) { items = []; }
      sel = -1; render();
    }, 220);
  });
  inp.addEventListener('keydown', e => {
    if (e.key === 'ArrowDown') { sel = Math.min(items.length - 1, sel + 1); render(); e.preventDefault(); }
    if (e.key === 'ArrowUp') { sel = Math.max(0, sel - 1); render(); e.preventDefault(); }
    if (e.key === 'Enter') { pick(sel < 0 ? 0 : sel); e.preventDefault(); }
    if (e.key === 'Escape') { list.hidden = true; }
  });
  inp.addEventListener('blur', () => setTimeout(() => { list.hidden = true; }, 150));
}

/* ---------- Im 3D-Flug ansehen: Blick von Süden auf den Kartenmittelpunkt, Häuser werden dort gebaut ---------- */
function toLV95(lon, lat){
  const p = (lat * 3600 - 169028.66) / 10000, l = (lon * 3600 - 26782.5) / 10000;
  return [2600072.37 + 211455.93*l - 10938.51*l*p - 0.36*l*p*p - 44.54*l*l*l,
          1200147.07 + 308807.95*p + 3745.25*l*l + 76.63*p*p - 194.56*l*l*p + 119.79*p*p*p];
}
$('to3d').addEventListener('click', async () => {
  const c = map.getCenter(), [E, N] = toLV95(c.lng, c.lat);
  let ground = 450;   /* Ersatzwert, falls die Höhenabfrage scheitert */
  $('to3d').disabled = true;
  try {
    const ac = new AbortController(), t = setTimeout(() => ac.abort(), 3000);
    const j = await (await fetch(`https://api3.geo.admin.ch/rest/services/height?easting=${E.toFixed(1)}&northing=${N.toFixed(1)}&sr=2056`, {signal: ac.signal})).json();
    clearTimeout(t);
    if (Number.isFinite(+j.height)) ground = +j.height;
  } catch (e) {}
  const cmp = !$('pCmp').hidden, key = cmp ? $('lSrc').value : $('tSrc').value, y = +(cmp ? $('lYear').value : $('tYear').value);
  const q = new URLSearchParams({lon: c.lng.toFixed(6), lat: (c.lat - 0.0055).toFixed(6), h: Math.round(ground + 600), hdg: 0, pitch: -38,
    c: c.lng.toFixed(5) + ',' + c.lat.toFixed(5), mode: 'fly'});
  if ((key === 'sieg' || key === 'zeit') && y >= 1870 && y <= 1949) q.set('year', y);
  location.href = 'flug-3d.html?' + q.toString();
});
window.addEventListener('pageshow', () => { $('to3d').disabled = false; });   /* nach «Zurück» wieder bereit */

/* ---------- Permalink: ?lat=&lon=&z=&mode=(time|cmp)&t=&y=&op=&l=&ly=&r=&ry= ---------- */
function permalink(){
  const c = map.getCenter(), cmp = !$('pCmp').hidden;
  const q = new URLSearchParams({lat: c.lat.toFixed(5), lon: c.lng.toFixed(5), z: map.getZoom(), mode: cmp ? 'cmp' : 'time'});
  if (cmp) { q.set('l', $('lSrc').value); q.set('ly', $('lYear').value); q.set('r', $('rSrc').value); q.set('ry', $('rYear').value); }
  else { q.set('t', $('tSrc').value); q.set('y', $('tYear').value); q.set('op', $('tOp').value); }
  return location.origin + location.pathname + '?' + q.toString();
}
$('linkBtn').addEventListener('click', async () => {
  const url = permalink();
  try { await navigator.clipboard.writeText(url); $('linkMsg').textContent = 'Link kopiert.'; }
  catch (e) { window.prompt('Link zu dieser Ansicht:', url); }
});
const Q = new URLSearchParams(location.search), qn = k => (Q.get(k) !== null && Q.get(k) !== '' ? Number(Q.get(k)) : NaN);
{
  const lat = qn('lat'), lon = qn('lon'), z = qn('z');
  if (lat > 45.5 && lat < 48 && lon > 5.5 && lon < 11) map.setView([lat, lon], Number.isFinite(z) ? Math.min(19, Math.max(12, Math.round(z))) : 15);
  if (tKeys.includes(Q.get('t'))) { $('tSrc').value = Q.get('t'); setRange($('tYear'), Q.get('t'), qn('y')); }
  else if (Number.isFinite(qn('y'))) setRange($('tYear'), $('tSrc').value, qn('y'));
  if (qn('op') >= 0 && qn('op') <= 100) { $('tOp').value = Math.round(qn('op')); $('opV').textContent = $('tOp').value + ' %'; }
  for (const sd of ['l', 'r']) {
    if (cKeys.includes(Q.get(sd))) $(sd + 'Src').value = Q.get(sd);
    setRange($(sd + 'Year'), $(sd + 'Src').value, Number.isFinite(qn(sd + 'y')) ? qn(sd + 'y') : $(sd + 'Year').value);
  }
}
if (Q.get('mode') === 'cmp') mode(true); else showTime();
}
