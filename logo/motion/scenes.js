// Socius Finance logo animations. Each scene is one 1920x1080 SVG driven by render(t), so playback and video export share one timeline.
var SCENES = (function(){
  const D = 7; // seconds per loop
  const clamp = v => Math.max(0, Math.min(1, v));
  const p = (t, a, b) => clamp((t - a) / (b - a));
  const ioCubic = x => x < .5 ? 4*x*x*x : 1 - Math.pow(-2*x + 2, 3) / 2;
  const oExpo = x => x === 1 ? 1 : 1 - Math.pow(2, -10 * x);
  const oQuint = x => 1 - Math.pow(1 - x, 5);
  const THEMES = {
    midnight: { bg: '<linearGradient id="%bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#070d1d"/><stop offset="1" stop-color="#0b1733"/></linearGradient><radialGradient id="%glow" cx=".5" cy=".5" r=".55"><stop offset="0" stop-color="#16306a" stop-opacity=".35"/><stop offset="1" stop-color="#16306a" stop-opacity="0"/></radialGradient>',
                bgFill: 'url(#%bg)', glow: true, stops: ['#163a9c', '#4b8ef0', '#cfeaff'], word: 'url(#%wg)', sheen: '#ffffff', sheenA: .9 },
    ivory:    { bg: '', bgFill: '#f6f5f1', glow: false, stops: ['#0a2466', '#2f6fdc', '#9fd3ff'], word: null, sheen: '#ffffff', sheenA: .75 }
  };
  const WM = { light: null, dark: null };
  const S_REV = "M18 80 H52 A15 15 0 0 0 52 50 H38 A15 15 0 0 1 38 20 H100";
  const SPLIT_S = "M100 24 H43 A13 13 0 0 0 43 50 H57 A13 13 0 0 1 57 76 H0";

  function grad(id, th, x1, y1, x2, y2){
    const [a,b,c] = th.stops;
    return `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" spreadMethod="reflect"><stop offset="0" stop-color="${a}"/><stop offset=".55" stop-color="${b}"/><stop offset="1" stop-color="${c}"/></linearGradient>`;
  }
  function sheen(id, th, x1, x2){
    return `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${x1}" y1="0" x2="${x2}" y2="0"><stop offset="0" stop-color="${th.sheen}" stop-opacity="0"/><stop offset=".42" stop-color="${th.sheen}" stop-opacity="0"/><stop offset=".5" stop-color="${th.sheen}" stop-opacity="${th.sheenA}"/><stop offset=".58" stop-color="${th.sheen}" stop-opacity="0"/><stop offset="1" stop-color="${th.sheen}" stop-opacity="0"/></linearGradient>`;
  }

  // layout: mark box + 760px wordmark, centred on the stage
  function layout(markW){ const gap = 52, ww = 760, wh = 82; const x0 = (1920 - (markW + gap + ww)) / 2; return { mx: x0, wx: x0 + markW + gap, wy: 540 - wh/2, ww, wh }; }

  function frame(id, th, markSvg, L, extraDefs){
    const wmDark = WM.dark, wmLight = WM.light;
    const wordLayer = th.word
      ? `<mask id="${id}wm" maskUnits="userSpaceOnUse" x="0" y="0" width="1920" height="1080"><image href="${wmDark}" x="${L.wx}" y="${L.wy}" width="${L.ww}" height="${L.wh}"/></mask>`
      : `<mask id="${id}wm" maskUnits="userSpaceOnUse" x="0" y="0" width="1920" height="1080"><image href="${wmDark}" x="${L.wx}" y="${L.wy}" width="${L.ww}" height="${L.wh}"/></mask>`;
    const wordFill = th.word
      ? `<rect x="${L.wx}" y="${L.wy}" width="${L.ww}" height="${L.wh}" fill="${th.word.replace(/%/g, id)}" mask="url(#${id}wm)"/>`
      : `<image href="${wmLight}" x="${L.wx}" y="${L.wy}" width="${L.ww}" height="${L.wh}"/>`;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Socius Finance">
      <defs>${th.bg.replace(/%/g, id)}${extraDefs}${wordLayer}
        ${sheen(id+"shW", th, 0, 420)}
        <linearGradient id="${id}wg" gradientUnits="userSpaceOnUse" x1="${L.wx}" y1="0" x2="${L.wx + L.ww}" y2="0"><stop offset="0" stop-color="#b9dcff"/><stop offset=".6" stop-color="#f3f8ff"/><stop offset="1" stop-color="#ffffff"/></linearGradient>
        <clipPath id="${id}wclip"><rect id="${id}wrect" x="${L.wx - 10}" y="${L.wy - 20}" width="0" height="${L.wh + 40}"/></clipPath>
      </defs>
      <rect width="1920" height="1080" fill="${th.bgFill.replace(/%/g, id)}"/>
      ${th.glow ? `<rect width="1920" height="1080" fill="url(#${id}glow)"/>` : ""}
      <g id="${id}all">
        <g id="${id}mk">${markSvg}</g>
        <g clip-path="url(#${id}wclip)"><g id="${id}word" style="opacity:0"><g id="${id}wtr">${wordFill}
          <rect id="${id}wsheen" x="${L.wx}" y="${L.wy}" width="${L.ww}" height="${L.wh}" fill="url(#${id}shW)" mask="url(#${id}wm)"/></g></g></g>
      </g>
    </svg>`;
  }

  function common(root, id, L){
    const $ = s => root.querySelector("#" + id + s);
    return {
      $,
      word(t, a, b){ const k = oQuint(p(t, a, b)); $("word").style.opacity = k; $("wtr").setAttribute("transform", `translate(${(1 - k) * -18} 0)`); },
      wordSheen(t, a, b){ const k = ioCubic(p(t, a, b)); $("shW").setAttribute("gradientTransform", `translate(${L.wx - 420 + k * (L.ww + 420)} 0)`); },
      glide(t, a, b, markW){ const k = ioCubic(p(t, a, b)); const dx = (960 - (L.mx + markW / 2)) * (1 - k); $("mk").setAttribute("transform", `translate(${dx} 0)`);
        const edge = L.mx + markW + dx + 18; $("wrect").setAttribute("x", edge); $("wrect").setAttribute("width", Math.max(0, 1920 - edge)); },
      fade(t){ const k = p(t, D - .7, D); $("all").style.opacity = 1 - ioCubic(k); },
      dash(el, k){ const len = el._len || (el._len = el.getTotalLength()); el.style.strokeDasharray = len; el.style.strokeDashoffset = len * (1 - k); }
    };
  }

  const defs = {
    // A: one continuous line draws the S and runs on into the F
    ligature(id, th){
      const h = 140, w = h * 98 / 82, L = layout(w);
      const g = grad(id+"g", th, 10, 0, 110, 90), sh = sheen(id+"sh", th, 0, 60);
      const paths = (stroke, cls) => `<g fill="none" stroke="${stroke}" stroke-width="9" stroke-linecap="butt" stroke-linejoin="miter">
          <path class="${cls}a" d="${S_REV}"/><path class="${cls}b" d="M84 24.5 V84.5"/><path class="${cls}c" d="M88.5 50 H100"/></g>`;
      const mark = `<svg x="${L.mx}" y="${540 - h/2}" width="${w}" height="${h}" viewBox="12 10 98 82" overflow="visible">
          ${paths(`url(#${id}g)`, id+"p")}${paths(`url(#${id}sh)`, id+"s")}</svg>`;
      return { svg: frame(id, th, mark, L, g + sh), L,
        bind(root){ const c = common(root, id, L), q = s => [...root.querySelectorAll("." + s)];
          const P = ["pa","pb","pc"].map(s => q(id+s)), Sh = ["sa","sb","sc"].map(s => q(id+s));
          return t => {
            const ks = [ioCubic(p(t, .3, 2.1)), ioCubic(p(t, 1.75, 2.45)), ioCubic(p(t, 2.15, 2.6))];
            P.forEach((els, i) => els.forEach(e => c.dash(e, ks[i]))); Sh.forEach((els, i) => els.forEach(e => c.dash(e, ks[i])));
            c.$("g").setAttribute("gradientTransform", `translate(${Math.sin(t / D * Math.PI * 2) * 30} 0)`);
            c.$("sh").setAttribute("gradientTransform", `translate(${-80 + ioCubic(p(t, 3.9, 5.0)) * 180} 0)`);
            c.glide(t, 2.3, 3.8, w); c.word(t, 2.4, 3.9); c.wordSheen(t, 4.2, 5.4); c.fade(t);
          }; } };
    },
    // B: a fine ring draws, then the F and S of the monogram, like a signet
    seal(id, th){
      const h = 150, L = layout(h);
      const g = grad(id+"g", th, 0, 0, 100, 100), sh = sheen(id+"sh", th, 0, 70);
      const inner = (stroke, cls) => `<circle class="${cls}r" cx="50" cy="50" r="46" fill="none" stroke="${stroke}" stroke-width="2.4" transform="rotate(-90 50 50)"/>
          <g transform="translate(50 50) scale(.6) translate(-50 -50)" fill="none" stroke="${stroke}" stroke-width="10.5" stroke-linejoin="round">
          <path class="${cls}f" d="M78 20 H42 A15 15 0 0 0 27 35 V85"/><path class="${cls}s" d="M32 50 H57 A15 15 0 0 1 57 80 H40"/></g>`;
      const mark = `<svg x="${L.mx}" y="${540 - h/2}" width="${h}" height="${h}" viewBox="0 0 100 100" overflow="visible">${inner(`url(#${id}g)`, id+"p")}${inner(`url(#${id}sh)`, id+"x")}</svg>`;
      return { svg: frame(id, th, mark, L, g + sh), L,
        bind(root){ const c = common(root, id, L), q = s => [...root.querySelectorAll("." + s)];
          const sets = [["pr","xr", .2, 2.0], ["pf","xf", 1.0, 2.3], ["ps","xs", 1.6, 2.8]].map(([a,b,s,e]) => ({ els: q(id+a).concat(q(id+b)), s, e }));
          return t => {
            sets.forEach(o => o.els.forEach(el => c.dash(el, ioCubic(p(t, o.s, o.e)))));
            c.$("g").setAttribute("gradientTransform", `rotate(${t / D * 360} 50 50)`);
            c.$("sh").setAttribute("gradientTransform", `translate(${-90 + ioCubic(p(t, 4.0, 5.2)) * 200} 0)`);
            c.glide(t, 2.6, 4.1, h); c.word(t, 2.7, 4.2); c.wordSheen(t, 4.4, 5.6); c.fade(t);
          }; } };
    },
    // C: the two halves of the Split glide in and lock together into one disc
    partners(id, th){
      const h = 140, L = layout(h);
      const g = grad(id+"g", th, 10, 10, 90, 90), sh = sheen(id+"sh", th, 0, 70);
      const TOP = SPLIT_S + " V0 H100 Z", BOT = SPLIT_S + " V100 H100 Z";
      const piece = (d, cls) => `<g class="${cls}"><path d="${d}" fill="url(#${id}g)" clip-path="url(#${id}disc)" mask="url(#${id}gap)"/><path d="${d}" fill="url(#${id}sh)" clip-path="url(#${id}disc)" mask="url(#${id}gap)"/></g>`;
      const extra = g + sh + `<clipPath id="${id}disc" clipPathUnits="userSpaceOnUse"><circle cx="50" cy="50" r="46"/></clipPath>
        <mask id="${id}gap" maskUnits="userSpaceOnUse" x="-10" y="-10" width="120" height="120"><rect x="-10" y="-10" width="120" height="120" fill="#fff"/><path d="${SPLIT_S}" fill="none" stroke="#000" stroke-width="6"/></mask>`;
      const mark = `<svg x="${L.mx}" y="${540 - h/2}" width="${h}" height="${h}" viewBox="0 0 100 100" overflow="visible"><g id="${id}disc2">${piece(TOP, id+"top")}${piece(BOT, id+"bot")}</g></svg>`;
      return { svg: frame(id, th, mark, L, extra), L,
        bind(root){ const c = common(root, id, L); const top = root.querySelector("." + id + "top"), bot = root.querySelector("." + id + "bot"), disc = c.$("disc2");
          return t => {
            const k = oExpo(p(t, .2, 2.0)), d = (1 - k) * 70;
            top.setAttribute("transform", `translate(${-d} ${-d * .35})`); bot.setAttribute("transform", `translate(${d} ${d * .35})`);
            top.style.opacity = bot.style.opacity = clamp(p(t, .2, 1.0));
            disc.setAttribute("transform", `rotate(${(1 - oExpo(p(t, .2, 2.4))) * -35} 50 50)`);
            c.$("g").setAttribute("gradientTransform", `rotate(${Math.sin(t / D * Math.PI * 2) * 25} 50 50)`);
            c.$("sh").setAttribute("gradientTransform", `translate(${-90 + ioCubic(p(t, 3.6, 4.8)) * 200} 0)`);
            c.glide(t, 2.1, 3.6, h); c.word(t, 2.2, 3.7); c.wordSheen(t, 4.0, 5.2); c.fade(t);
          }; } };
    }
  };
  let n = 0;
  return {
    D, WM, names: Object.keys(defs),
    mount(el, kind, theme){ const id = "z" + (++n) + "_"; const s = defs[kind](id, THEMES[theme]); el.innerHTML = s.svg; const r = s.bind(el); r(0); return r; }
  };
})();
if (typeof module !== "undefined") module.exports = SCENES;
