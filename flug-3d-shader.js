/* Shader für den 3D-Flug (flug-3d.html): Fassaden der echten Altbauten, Wände und Fenster der nachgebauten Häuser, Boden.
   Wird vor dem Hauptscript geladen; die Konstanten sind global. */
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
    #ifdef HAS_SELECTED_FEATURE_ID
    /* Stilfarbe nicht weiss: Kirche, Turm, Kamin oder Mauer – Steinfarbe aus dem Stil behalten, keine Fenster */
    SelectedFeature sf;
    selectedFeatureIdStage(sf, fsInput.featureIds);
    if (any(lessThan(sf.color.rgb, vec3(0.99)))) return;
    #endif

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

const WALL_VS = `
in vec3 position3DHigh;
in vec3 position3DLow;
in vec3 normal;
in vec2 st;
in vec4 color;
in float batchId;
out vec3 v_positionEC;
out vec3 v_normalEC;
out vec4 v_color;
out vec2 v_st;
void main() {
  vec4 p = czm_computePosition();
  v_positionEC = (czm_modelViewRelativeToEye * p).xyz;
  v_normalEC = czm_normal * normal;
  v_color = color;
  v_st = st;
  gl_Position = czm_modelViewProjectionRelativeToEye * p;
}`;

const WALL_FS = `
in vec3 v_positionEC;
in vec3 v_normalEC;
in vec4 v_color;
in vec2 v_st;
void main() {
  vec3 toEye = -v_positionEC;
  vec3 nEC = normalize(v_normalEC);
  nEC = faceforward(nEC, vec3(0.0, 0.0, 1.0), -nEC);
  vec3 base = czm_gammaCorrect(v_color).rgb;
  vec3 c = base;
  if (v_st.y < -50.0) {
    /* Satteldach: Biberschwanz-Ziegel in versetzten Reihen (st.x = Meter längs, -100 - st.y = Meter quer zum First) */
    float d = -100.0 - v_st.y, a = v_st.x;
    float rowI = floor(d / 0.26), row = fract(d / 0.26);
    float colI = floor(a / 0.17 + 0.5 * mod(rowI, 2.0)), colF = fract(a / 0.17 + 0.5 * mod(rowI, 2.0));
    float tn = fract(sin(dot(vec2(colI, rowI), vec2(12.9898, 78.233))) * 43758.5453);
    vec3 t = base * (0.86 + 0.22 * tn);
    t *= 1.0 - 0.28 * smoothstep(0.72, 1.0, row);
    t *= 1.0 - 0.10 * (step(colF, 0.05) + step(0.95, colF));
    float fwR = max(fwidth(d / 0.26), fwidth(a / 0.17));
    c = mix(t, base * 0.95, smoothstep(0.15, 0.5, fwR));
  } else if (v_st.y > -5.0) {
    bool hall = v_st.y > 40.0;
    float fl = hall ? v_st.y - 50.0 : v_st.y;
    float fx = fract(v_st.x), fy = fract(fl);
    float on = step(0.0, fl) * (hall ? step(fl, 1.0) : 1.0);
    float x0 = hall ? 0.13 : 0.33, x1 = 1.0 - x0, y0 = hall ? 0.24 : 0.30, y1 = hall ? 0.97 : 0.73;
    float win   = on * step(y0, fy) * step(fy, y1) * step(x0, fx) * step(fx, x1);
    float frame = on * step(y0 - 0.03, fy) * step(fy, y1 + 0.03) * step(x0 - 0.03, fx) * step(fx, x1 + 0.03) * (1.0 - win);
    float sill  = on * step(y0 - 0.06, fy) * step(fy, y0 - 0.02) * step(x0 - 0.05, fx) * step(fx, x1 + 0.05) * (1.0 - frame);
    float bars  = win * max(step(abs(fx - 0.5), 0.015), step(abs(fy - (y0 + (y1 - y0) * 0.62)), 0.012));
    float wr = fract(sin(dot(floor(vec2(v_st.x, fl)), vec2(12.9898, 78.233))) * 43758.5453);
    vec3 glass = mix(vec3(0.10, 0.13, 0.17), vec3(0.36, 0.44, 0.53), clamp((fy - y0) / (y1 - y0), 0.0, 1.0) * (0.3 + 0.5 * wr));
    vec3 w = base;
    w = mix(w, vec3(0.93, 0.92, 0.88), frame);
    w = mix(w, base * 0.82, sill);
    w = mix(w, glass, win);
    w = mix(w, vec3(0.90, 0.89, 0.85), bars);
    /* in der Ferne zur Mischfarbe auflösen, sonst flimmert das Raster */
    float fw = max(fwidth(v_st.x), fwidth(fl));
    vec3 avg = mix(base, vec3(0.22, 0.27, 0.33), on * (hall ? 0.5 : 0.15));
    c = mix(w, avg, smoothstep(0.12, 0.35, fw));
  }
  czm_materialInput mi;
  mi.normalEC = nEC;
  mi.positionToEyeEC = toEye;
  czm_material m = czm_getDefaultMaterial(mi);
  m.diffuse = c;
  m.alpha = 1.0;
  vec4 lit = czm_phong(normalize(toEye), m, czm_lightDirectionEC);
  /* Dunst wie bei Gelände und echten Häusern: ferne Häuser verblassen ins Himmelsgrau (Dichte aus scene.fog) */
  lit.rgb = czm_fog(length(v_positionEC), lit.rgb, vec3(0.80, 0.84, 0.88));
  out_FragColor = lit;
}`;

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
  /* r = Gasse/Platz, g = Wasser, b = Garten bei Häusern; überall sonst bleibt die Karte sichtbar (Wald, Fels, Seen, Felder) */
  vec3 col = mix(grass, cob, cls.r);
  col = mix(col, water, cls.g);
  float cover = max(max(cls.r, cls.g * 0.92), cls.b * 0.65);
  m.diffuse = col;
  /* ab rund 300 m weich in die Karte übergehen: keine eckigen Kachelränder, dahinter liegt die Siegfriedkarte */
  m.alpha = cover * (1.0 - smoothstep(300.0, 800.0, length(mi.positionToEyeEC)));
  return m;
}`;

