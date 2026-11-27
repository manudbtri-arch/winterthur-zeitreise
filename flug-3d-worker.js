/* Kartenauswertung für den 3D-Flug (flug-3d.html). Läuft als Web Worker; im Hauptfaden als Ersatz geladen,
   falls der Worker nicht startet (dann ist analyseMap eine globale Funktion). */
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
if (typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope) {
  self.onmessage = e => { const d = e.data, r = analyseMap(d.px, d.W, d.H, d.cw, d.ch, d.CELL);
    self.postMessage({id: d.id, r}, [r.occ.buffer, r.wat.buffer, r.comp.buffer]); };
}
