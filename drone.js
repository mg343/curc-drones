'use strict';

/*
 * Airframe 01, drawn live as a technical drawing.
 *
 * The aircraft is modelled in millimetres from the team's actual parts list: 5-inch props on
 * Velox V2207 motors at a 220 mm motor-to-motor diagonal, a 30.5 mm stack with the motor
 * controller and the ESP32-S3 flight controller, the nRF24 radio with its antenna, and a
 * strapped 6S pack. Faces are filled with paper and edged in ink, painter-sorted, so hidden
 * lines disappear the way they would on a drawing.
 *
 * Three scenes use it: FIG. 01 (hovering, following the cursor), the exploded aircraft
 * (scroll-driven, one subsystem at a time), and the footer sky (small drones crossing).
 */
(() => {
  const RM = window.matchMedia('(prefers-reduced-motion: reduce)');
  const TAU = Math.PI * 2;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const INK = [16, 37, 66];
  const PAPER = [247, 251, 255];
  const SHADE = [205, 219, 233];
  const BLUE = [185, 217, 235];
  const BLUE_D = [128, 172, 202];
  const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  const css = (c, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
  const MONO = '"Courier New", Courier, monospace';
  const L = (() => { const v = [-0.35, 0.85, -0.4]; const l = Math.hypot(...v); return v.map((x) => x / l); })();

  /* ------------------------------------------------------------ geometry (mm, y up, nose +z) */
  function box(x0, y0, z0, x1, y1, z1) {
    return {
      kind: 'box',
      v: [[x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0], [x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]],
      f: [[0, 1, 2, 3], [4, 5, 6, 7], [0, 1, 5, 4], [3, 2, 6, 7], [1, 2, 6, 5], [0, 3, 7, 4]],
      c: [(x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2],
    };
  }
  function cyl(cx, cz, y0, y1, r, n = 24) {
    const v = [];
    for (let k = 0; k < 2; k++) {
      for (let i = 0; i < n; i++) {
        const a = (i / n) * TAU;
        v.push([cx + Math.cos(a) * r, k ? y1 : y0, cz + Math.sin(a) * r]);
      }
    }
    const bottom = [], top = [];
    for (let i = 0; i < n; i++) { bottom.push(i); top.push(n + i); }
    return { kind: 'cyl', n, v, f: [bottom, top], c: [cx, (y0 + y1) / 2, cz] };
  }
  function rotY(m, a) {
    const c = Math.cos(a), s = Math.sin(a);
    const r = (p) => { const x = p[0] * c + p[2] * s, z = -p[0] * s + p[2] * c; p[0] = x; p[2] = z; };
    m.v.forEach(r);
    r(m.c);
    return m;
  }

  const D = 77.8; // motor centre on each axis: 220 mm diagonal
  const MOTORS = [[D, D], [-D, D], [-D, -D], [D, -D]];
  const PROP_R = 63.5; // 5 in
  const PROP_Y = 32.2;
  const BLADE = [[5, -3.5], [22, -7], [44, -6.5], [59, -3.5], [63.5, -0.5], [61, 2.5], [42, 4.5], [20, 4.5], [5, 3.5]];

  function airframe() {
    const frame = [box(-22, 0, -40, 22, 4, 40), box(-20, 32, -38, 20, 34.5, 38)];
    for (const k of [1, 3, 5, 7]) frame.push(rotY(box(10, 0, -7, 120, 4, 7), (k * Math.PI) / 4));
    for (const [x, z] of [[1, 1], [-1, 1], [-1, -1], [1, -1]]) frame.push(cyl(x * 15.25, z * 15.25, 4, 32, 2.6, 10));

    const motors = [];
    for (const [x, z] of MOTORS) motors.push(cyl(x, z, 4, 8, 11.5, 20), cyl(x, z, 8, 22, 14, 28), cyl(x, z, 22, 27, 2.5, 10));

    const esc = [box(-18, 8, -18, 18, 9.6, 18), box(-4, 9.6, -4, 4, 10.6, 4), cyl(0, -13, 9.6, 16, 3.6, 14)];
    for (const sx of [-1, 1]) for (const k of [-1, 0, 1]) esc.push(box(sx * 13 - 2.5, 9.6, k * 9 - 3, sx * 13 + 2.5, 11, k * 9 + 3));

    const fc = [
      box(-12.5, 17, -31.5, 12.5, 18.6, 31.5), // ESP32-S3 dev board
      box(-9, 18.6, 8, 9, 21.6, 28), // module can
      box(-8, 18.6, -14, 8, 19.8, 2), // IMU breakout
      box(-2.5, 19.8, -8.5, 2.5, 20.8, -3.5), // ICM-42688-P
      box(-4, 18.6, -31.5, 4, 21.5, -26), // USB
    ];
    const radio = [box(-8, 34.5, -52, 8, 36.1, -26), cyl(0, -46, 36.1, 41, 3.6, 12), cyl(0, -46, 41, 86, 2.8, 12)];
    const battery = [box(-17, 34.5, -22, 17, 72, 52)];
    const hubs = MOTORS.map(([x, z]) => cyl(x, z, 27, 32, 5.5, 16));

    return [
      { id: 'frame', meshes: frame, off: [0, 0, 0], anchors: [[1, 1], [-1, 1], [-1, -1], [1, -1]].map(([x, z]) => [x * 52, 2, z * 52]) },
      { id: 'motors', meshes: motors, off: [0, -52, 0], anchors: MOTORS.map(([x, z]) => [x * 1.12, 15, z * 1.12]) },
      { id: 'props', meshes: hubs, off: [0, 84, 0], props: true, anchors: MOTORS.map(([x, z]) => [x * 1.5, PROP_Y, z * 1.5]) },
      { id: 'esc', meshes: esc, off: [0, 58, 0], anchors: [[18, 9, 0], [-18, 9, 0], [0, 9, 18], [0, 9, -18]] },
      { id: 'fc', meshes: fc, off: [0, 112, 0], anchors: [[12.5, 18, 0], [-12.5, 18, 0], [0, 18, 31], [0, 18, -31]] },
      { id: 'radio', meshes: radio, off: [0, 162, -16], anchors: [[0, 72, -46], [8, 35, -40], [-8, 35, -40]] },
      { id: 'battery', meshes: battery, off: [0, 220, 0], anchors: [[17, 53, 15], [-17, 53, 15], [0, 53, 52], [0, 53, -22]] },
    ];
  }

  /* ------------------------------------------------------------ renderer */
  const DIST = 700;
  class Drawing {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.parts = airframe();
      this.w = this.h = 1;
      this.dpr = 1;
    }

    resize(w, h) {
      this.dpr = Math.min(window.devicePixelRatio || 1, 2);
      this.w = Math.max(1, w);
      this.h = Math.max(1, h);
      this.canvas.width = Math.round(this.w * this.dpr);
      this.canvas.height = Math.round(this.h * this.dpr);
    }

    clear() {
      const ctx = this.ctx;
      ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      ctx.clearRect(0, 0, this.w, this.h);
    }

    /** s: {ox, oy, F, yaw, roll, pitch, cam, center, lift, explode, active, phase, spin, callouts, labelX, labelAlpha, shadow} */
    draw(s) {
      const ctx = this.ctx;
      const cyw = Math.cos(s.yaw), syw = Math.sin(s.yaw);
      const cr = Math.cos(s.roll || 0), sr = Math.sin(s.roll || 0);
      const cp = Math.cos(s.pitch || 0), sp = Math.sin(s.pitch || 0);
      const cc = Math.cos(s.cam), sc = Math.sin(s.cam);
      const yc = s.center - (s.lift || 0);
      const T = (x, y, z) => {
        const X = x * cyw + z * syw, Z = -x * syw + z * cyw, Y = y - yc;
        const X2 = X * cr - Y * sr, Y2 = X * sr + Y * cr;
        const Y3 = Y2 * cp - Z * sp, Z3 = Y2 * sp + Z * cp;
        return [X2, Y3 * cc - Z3 * sc, Y3 * sc + Z3 * cc + DIST];
      };
      const P = (p) => [s.ox + (s.F * p[0]) / p[2], s.oy - (s.F * p[1]) / p[2]];

      if (s.shadow) {
        const g = ctx.createRadialGradient(s.shadow.x, s.shadow.y, 0, s.shadow.x, s.shadow.y, s.shadow.rx);
        g.addColorStop(0, css(INK, s.shadow.a));
        g.addColorStop(1, css(INK, 0));
        ctx.save();
        ctx.translate(s.shadow.x, s.shadow.y);
        ctx.scale(1, s.shadow.ry / s.shadow.rx);
        ctx.translate(-s.shadow.x, -s.shadow.y);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(s.shadow.x, s.shadow.y, s.shadow.rx, 0, TAU);
        ctx.fill();
        ctx.restore();
      }

      const items = [];
      const e = s.explode || 0;
      for (const part of this.parts) {
        const o = [part.off[0] * e, part.off[1] * e, part.off[2] * e];
        const look = !s.active ? 'base' : s.active === part.id ? 'hot' : 'dim';
        for (const m of part.meshes) this.mesh(items, m, o, look, T, P);
        if (part.props) this.props(items, o, look, s, T, P);
      }
      items.sort((a, b) => b.key - a.key);

      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      for (const it of items) {
        const ink = it.look === 'hot' ? css(INK, 1) : it.look === 'dim' ? css(INK, 0.34) : css(INK, 0.9);
        for (const p of it.polys) {
          ctx.beginPath();
          ctx.moveTo(p.pts[0][0], p.pts[0][1]);
          for (let i = 1; i < p.pts.length; i++) ctx.lineTo(p.pts[i][0], p.pts[i][1]);
          ctx.closePath();
          if (p.fill) {
            ctx.fillStyle = p.fill;
            ctx.fill();
            if (p.segs) { // hide the hairline seams between cylinder facets
              ctx.strokeStyle = p.fill;
              ctx.lineWidth = 0.9;
              ctx.stroke();
            }
          }
          ctx.strokeStyle = p.ink || ink;
          ctx.lineWidth = p.lw || 1;
          ctx.setLineDash(p.dash || []);
          if (p.segs) {
            ctx.beginPath();
            for (const [a, b] of p.segs) { ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); }
            ctx.stroke();
          } else if (!p.noStroke) {
            ctx.stroke();
          }
        }
      }
      ctx.setLineDash([]);
      if (s.callouts && s.labelAlpha > 0.01) this.callouts(s, T, P);
    }

    mesh(items, m, o, look, T, P) {
      const tv = m.v.map((p) => T(p[0] + o[0], p[1] + o[1], p[2] + o[2]));
      const tc = T(m.c[0] + o[0], m.c[1] + o[1], m.c[2] + o[2]);
      const pv = tv.map(P);
      const fill = (lam) => css(look === 'hot' ? mix(BLUE_D, BLUE, lam) : mix(SHADE, PAPER, lam));
      const face = (idx) => {
        let fx = 0, fy = 0, fz = 0;
        for (const i of idx) { fx += tv[i][0]; fy += tv[i][1]; fz += tv[i][2]; }
        fx /= idx.length; fy /= idx.length; fz /= idx.length;
        let nx = fx - tc[0], ny = fy - tc[1], nz = fz - tc[2];
        const l = Math.hypot(nx, ny, nz) || 1;
        nx /= l; ny /= l; nz /= l;
        return { vis: nx * fx + ny * fy + nz * fz < 0, lam: Math.max(0, nx * L[0] + ny * L[1] + nz * L[2]) };
      };
      const polys = [];
      if (m.kind === 'cyl') {
        const n = m.n, vis = [], lam = [];
        for (let k = 0; k < n; k++) {
          const k1 = (k + 1) % n;
          const r = face([k, k1, n + k1, n + k]);
          vis.push(r.vis);
          lam.push(r.lam);
        }
        for (let k = 0; k < n; k++) {
          if (!vis[k]) continue;
          const k1 = (k + 1) % n;
          const segs = [[pv[k], pv[k1]], [pv[n + k], pv[n + k1]]];
          if (!vis[(k - 1 + n) % n]) segs.push([pv[k], pv[n + k]]);
          if (!vis[k1]) segs.push([pv[k1], pv[n + k1]]);
          polys.push({ pts: [pv[k], pv[k1], pv[n + k1], pv[n + k]], fill: fill(lam[k]), segs });
        }
      }
      for (const idx of m.f) {
        const r = face(idx);
        if (r.vis) polys.push({ pts: idx.map((i) => pv[i]), fill: fill(r.lam) });
      }
      // painter's key: depth, with height weighted hard because we always look down on it
      items.push({ key: tc[2] - 8 * (m.c[1] + o[1]), polys, look });
    }

    props(items, o, look, s, T, P) {
      MOTORS.forEach(([mx, mz], i) => {
        const cx = mx + o[0], cy = PROP_Y + o[1], cz = mz + o[2];
        const dir = i % 2 ? -1 : 1;
        const ring = [];
        for (let k = 0; k < 56; k++) {
          const a = (k / 56) * TAU;
          ring.push(P(T(cx + Math.cos(a) * PROP_R, cy, cz + Math.sin(a) * PROP_R)));
        }
        const polys = [{
          pts: ring,
          fill: look === 'hot' ? css(BLUE, 0.4) : s.spin ? css(BLUE, 0.16) : null,
          dash: [2, 4],
          ink: css(INK, look === 'dim' ? 0.14 : 0.45),
          lw: 0.8,
        }];
        const ghosts = s.spin ? [[0.4, 0.1], [0.2, 0.26], [0, 1]] : [[0, 1]];
        for (const [lag, a] of ghosts) {
          for (let b = 0; b < 3; b++) {
            const ang = dir * (s.phase - lag) + (b * TAU) / 3 + i;
            const c = Math.cos(ang), sn = Math.sin(ang);
            const pts = BLADE.map(([r, w]) => P(T(cx + r * c - w * sn, cy, cz + r * sn + w * c)));
            const solid = a === 1;
            polys.push({
              pts,
              fill: solid ? css(look === 'hot' ? BLUE : PAPER) : null,
              ink: css(INK, (look === 'dim' ? 0.22 : 0.9) * a),
              lw: solid ? 1 : 0.8,
            });
          }
        }
        const tc = T(cx, cy, cz);
        items.push({ key: tc[2] - 8 * (cy + 0.6), polys, look });
      });
    }

    /** leader-line labels in a column to the right of the aircraft */
    callouts(s, T, P) {
      const ctx = this.ctx;
      const e = s.explode || 0;
      const rows = [];
      for (const c of s.callouts) {
        const part = this.parts.find((p) => p.id === c.part);
        const o = [part.off[0] * e, part.off[1] * e, part.off[2] * e];
        let best = null;
        for (const a of part.anchors) {
          const p = P(T(a[0] + o[0], a[1] + o[1], a[2] + o[2]));
          if (!best || p[0] > best[0]) best = p;
        }
        rows.push({ c, ax: best[0], ay: best[1], y: best[1], hot: s.active === c.part });
      }
      rows.sort((a, b) => a.ay - b.ay);
      const gap = 34;
      for (let i = 1; i < rows.length; i++) rows[i].y = Math.max(rows[i].y, rows[i - 1].y + gap);
      const over = rows.length ? rows[rows.length - 1].y - (this.h - 40) : 0;
      if (over > 0) rows.forEach((r) => (r.y -= over));
      for (let i = rows.length - 2; i >= 0; i--) rows[i].y = Math.min(rows[i].y, rows[i + 1].y - gap);

      ctx.save();
      ctx.globalAlpha = s.labelAlpha;
      ctx.textBaseline = 'middle';
      for (const r of rows) {
        const x = s.labelX;
        const dim = s.active && !r.hot;
        ctx.strokeStyle = css(INK, dim ? 0.25 : 0.8);
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(r.ax, r.ay);
        ctx.lineTo(x - 22, r.y);
        ctx.lineTo(x - 6, r.y);
        ctx.stroke();
        ctx.fillStyle = css(INK, dim ? 0.3 : 1);
        ctx.beginPath();
        ctx.arc(r.ax, r.ay, 2.4, 0, TAU);
        ctx.fill();
        ctx.font = `700 11px ${MONO}`;
        const tw = ctx.measureText(r.c.title).width;
        if (r.hot) {
          ctx.fillStyle = css(BLUE);
          ctx.fillRect(x - 3, r.y - 15, tw + 6, 15);
        }
        ctx.fillStyle = css(INK, dim ? 0.35 : 1);
        ctx.fillText(r.c.title, x, r.y - 7);
        ctx.font = `400 10px ${MONO}`;
        ctx.fillStyle = css(INK, dim ? 0.3 : 0.62);
        ctx.fillText(r.c.sub, x, r.y + 7);
      }
      ctx.restore();
    }
  }

  /* ------------------------------------------------------------ loop helper */
  function animate(el, onFrame, onStill) {
    let raf = 0, last = 0, inView = false, running = false;
    const frame = (now) => {
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
      last = now;
      onFrame(dt);
      raf = requestAnimationFrame(frame);
    };
    const sync = () => {
      const want = inView && !document.hidden && !RM.matches;
      if (want && !running) { last = 0; raf = requestAnimationFrame(frame); }
      if (!want && running) cancelAnimationFrame(raf);
      running = want;
      if (RM.matches) onStill();
    };
    new IntersectionObserver(([en]) => { inView = en.isIntersecting; sync(); }, { rootMargin: '100px 0px' }).observe(el);
    document.addEventListener('visibilitychange', sync);
    RM.addEventListener('change', sync);
    return { still: () => RM.matches && onStill() };
  }

  /* ------------------------------------------------------------ FIG. 01 */
  const HERO_CALLOUTS = [
    { part: 'props', title: 'PROPELLER', sub: '5 IN · SLS PRINTED' },
    { part: 'motors', title: 'MOTOR', sub: 'VELOX V2207 · 1750KV' },
    { part: 'battery', title: 'BATTERY', sub: '6S · 1100 MAH' },
    { part: 'radio', title: 'RADIO', sub: 'NRF24L01+ · 2.4 GHZ' },
    { part: 'frame', title: 'FRAME', sub: 'CARBON FIBRE · 5-INCH CLASS' },
  ];

  const deck = document.querySelector('.deck');
  if (deck) {
    const canvas = deck.querySelector('canvas');
    const copy = deck.querySelector('.deck-copy');
    const d = new Drawing(canvas);
    let w = 1, h = 1, Rs = 100, home = { x: 0, y: 0 }, labels = false, narrow = false;
    const pos = { x: 0, y: 0 }, vel = { x: 0, y: 0 };
    let ptr = null, t = 0, phase = 0;

    const layout = () => {
      w = deck.clientWidth;
      h = deck.clientHeight;
      d.resize(w, h);
      narrow = w < 900;
      if (narrow) {
        Rs = Math.min(w * 0.4, 180);
        home = { x: w * 0.5, y: h - 210 };
        labels = false;
      } else {
        Rs = Math.min(w * 0.19, h * 0.36, 290);
        const right = copy.offsetLeft + copy.offsetWidth;
        home = { x: Math.max(w * 0.58, right + Rs * 1.25), y: h * 0.48 };
        labels = home.x + Rs * 1.3 + 170 < w;
      }
    };
    const render = () => {
      d.clear();
      d.draw({
        ox: home.x + pos.x, oy: home.y + pos.y, F: (Rs * DIST) / 175,
        yaw: 0.72 + Math.sin(t * 0.21) * 0.32,
        roll: clamp(-vel.x * 0.0016, -0.4, 0.4), pitch: clamp(vel.y * 0.0012, -0.3, 0.3),
        cam: -0.52, center: 30, lift: Math.sin(t * 1.7) * 2.5,
        explode: 0, active: null, phase, spin: !RM.matches,
        callouts: HERO_CALLOUTS, labelX: home.x + Rs * 1.3, labelAlpha: labels ? 1 : 0,
        shadow: { x: home.x + pos.x * 0.7, y: home.y + Rs * (narrow ? 0.95 : 1.05), rx: Rs * 0.85, ry: Rs * 0.13, a: 0.1 - clamp(pos.y / Rs, -0.5, 0.5) * 0.04 },
      });
    };
    const step = (dt) => {
      t += dt;
      phase += dt * 15;
      let tx = Math.sin(t * 0.43) * Rs * 0.14, ty = Math.sin(t * 0.86) * Rs * 0.07;
      if (ptr && !narrow) {
        tx += clamp((ptr.x - home.x) * 0.4, -Rs * 1.1, Rs * 0.6);
        ty += clamp((ptr.y - home.y) * 0.32, -Rs * 0.5, Rs * 0.4);
      }
      vel.x += ((tx - pos.x) * 5 - vel.x * 3.1) * dt;
      vel.y += ((ty - pos.y) * 5 - vel.y * 3.1) * dt;
      pos.x += vel.x * dt;
      pos.y += vel.y * dt;
      render();
    };
    deck.addEventListener('pointermove', (ev) => {
      if (ev.pointerType !== 'mouse') return;
      const r = deck.getBoundingClientRect();
      ptr = { x: ev.clientX - r.left, y: ev.clientY - r.top };
    });
    deck.addEventListener('pointerleave', () => (ptr = null));
    layout();
    render();
    const loop = animate(deck, step, () => { phase = 0.5; render(); });
    new ResizeObserver(() => { layout(); render(); loop.still(); }).observe(deck);
  }

  /* ------------------------------------------------------------ the exploded aircraft */
  const AIR_CALLOUTS = [
    { part: 'battery', title: 'BATTERY', sub: 'BOUGHT · 6S 1100 MAH' },
    { part: 'radio', title: 'RADIO', sub: 'IN-HOUSE · NRF24L01+' },
    { part: 'fc', title: 'FLIGHT CONTROLLER', sub: 'IN-HOUSE · ESP32-S3' },
    { part: 'props', title: 'PROPELLERS', sub: 'IN-HOUSE · 5 IN SLS' },
    { part: 'esc', title: 'MOTOR CONTROLLERS', sub: 'IN-HOUSE · EFM8 + FD6288Q' },
    { part: 'frame', title: 'FRAME', sub: 'IN-HOUSE · CARBON CAST' },
    { part: 'motors', title: 'MOTORS', sub: 'BOUGHT · V2207 1750KV' },
  ];

  const air = document.querySelector('.aircraft');
  if (air) {
    const stage = air.querySelector('.stage');
    const canvas = stage.querySelector('canvas');
    const steps = Array.from(air.querySelectorAll('.step'));
    const d = new Drawing(canvas);
    let w = 1, h = 1, Rs = 100, ox = 0, oy = 0, labels = false, narrow = false;
    let t = 0, phase = 0, explode = 0, target = 0, active = null;

    const layout = () => {
      w = stage.clientWidth;
      h = stage.clientHeight;
      d.resize(w, h);
      narrow = w < 900;
      if (narrow) {
        Rs = Math.min(w * 0.44, h * 0.24);
        ox = w * 0.5;
        oy = h * 0.29;
        labels = false;
      } else {
        Rs = Math.min(w * 0.21, h * 0.38);
        ox = w * 0.58;
        oy = h * 0.52;
        labels = ox + Rs * 1.3 + 190 < w;
      }
    };
    const render = () => {
      d.clear();
      d.draw({
        ox, oy, F: (Rs * DIST) / (175 + 38 * explode),
        yaw: 0.78 + Math.sin(t * 0.23) * 0.42, cam: -0.5,
        center: 30 + 92 * explode, lift: Math.sin(t * 1.3) * 2 * (1 - explode),
        explode, active, phase, spin: !RM.matches && explode < 0.5,
        callouts: AIR_CALLOUTS, labelX: Math.min(ox + Rs * 1.3, w - 200), labelAlpha: labels ? clamp((explode - 0.3) / 0.5, 0, 1) : 0,
      });
    };
    const step = (dt) => {
      t += dt;
      explode += (target - explode) * (1 - Math.exp(-dt * 3));
      phase += dt * (15 - 11 * explode);
      render();
    };
    const choose = (el) => {
      steps.forEach((s) => s.classList.toggle('is-active', s === el));
      active = el.dataset.part || null;
      target = active ? 1 : 0;
      if (RM.matches) { explode = target; render(); }
    };
    const io = new IntersectionObserver((entries) => {
      for (const en of entries) if (en.isIntersecting) choose(en.target);
    }, { rootMargin: '-45% 0px -45% 0px' });
    steps.forEach((s) => io.observe(s));

    layout();
    render();
    const loop = animate(stage, step, () => { phase = 0.5; render(); });
    new ResizeObserver(() => { layout(); render(); loop.still(); }).observe(stage);
  }

  /* ------------------------------------------------------------ footer sky: small drones crossing */
  const sky = document.querySelector('.foot-sky');
  if (sky) {
    const canvas = sky.querySelector('canvas');
    const ctx = canvas.getContext('2d');
    let w = 1, h = 1, dpr = 1, wait = 0.3;
    const list = [];
    const rand = (a, b) => a + Math.random() * (b - a);
    const layout = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = sky.clientWidth;
      h = sky.clientHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    };
    const spawn = () => {
      const ltr = Math.random() < 0.5;
      const y0 = rand(-0.2, 1.2) * h, y1 = rand(-0.2, 1.2) * h;
      list.push({
        p0: [ltr ? -60 : w + 60, y0], p2: [ltr ? w + 60 : -60, y1], p1: [rand(0.3, 0.7) * w, rand(0, 1) * h],
        t: 0, dur: rand(6, 11) * (w / 1200 + 0.4), s: rand(16, 42), phase: rand(0, 6),
      });
    };
    const quad = (x, y, ang, s, phase) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(ang);
      ctx.strokeStyle = css(INK, 0.85);
      ctx.fillStyle = css(PAPER);
      ctx.lineWidth = 1;
      const d = s * 0.5, r = s * 0.36;
      ctx.lineWidth = Math.max(1.2, s * 0.07);
      ctx.beginPath();
      ctx.moveTo(-d, -d); ctx.lineTo(d, d); ctx.moveTo(d, -d); ctx.lineTo(-d, d);
      ctx.stroke();
      ctx.lineWidth = 0.8;
      [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([mx, my], i) => {
        ctx.setLineDash([2, 3]);
        ctx.fillStyle = css(BLUE, 0.35);
        ctx.beginPath();
        ctx.arc(mx * d, my * d, r, 0, TAU);
        ctx.fill();
        ctx.stroke();
        ctx.setLineDash([]);
        const a = phase * (i % 3 ? -1 : 1);
        ctx.beginPath();
        ctx.moveTo(mx * d - Math.cos(a) * r * 0.9, my * d - Math.sin(a) * r * 0.9);
        ctx.lineTo(mx * d + Math.cos(a) * r * 0.9, my * d + Math.sin(a) * r * 0.9);
        ctx.lineWidth = 1.4;
        ctx.stroke();
        ctx.lineWidth = 0.8;
      });
      ctx.fillStyle = css(PAPER);
      ctx.fillRect(-s * 0.13, -s * 0.18, s * 0.26, s * 0.36);
      ctx.strokeRect(-s * 0.13, -s * 0.18, s * 0.26, s * 0.36);
      ctx.restore();
    };
    const render = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      for (const q of list) {
        const t = q.t, u = 1 - t;
        const x = u * u * q.p0[0] + 2 * u * t * q.p1[0] + t * t * q.p2[0];
        const y = u * u * q.p0[1] + 2 * u * t * q.p1[1] + t * t * q.p2[1];
        const dx = 2 * u * (q.p1[0] - q.p0[0]) + 2 * t * (q.p2[0] - q.p1[0]);
        const dy = 2 * u * (q.p1[1] - q.p0[1]) + 2 * t * (q.p2[1] - q.p1[1]);
        // the dotted track it has flown
        ctx.fillStyle = css(INK, 0.35);
        for (let k = Math.max(0, t - 0.25); k < t - 0.01; k += 0.012) {
          const v = 1 - k;
          ctx.fillRect(v * v * q.p0[0] + 2 * v * k * q.p1[0] + k * k * q.p2[0] - 0.75, v * v * q.p0[1] + 2 * v * k * q.p1[1] + k * k * q.p2[1] - 0.75, 1.5, 1.5);
        }
        quad(x, y, Math.atan2(dy, dx) + Math.PI / 2, q.s, q.phase);
      }
    };
    const step = (dt) => {
      wait -= dt;
      if (wait <= 0 && list.length < 4) { spawn(); wait = rand(1.4, 3.2); }
      for (const q of list) { q.t += dt / q.dur; q.phase += dt * 30; }
      for (let i = list.length - 1; i >= 0; i--) if (list[i].t >= 1) list.splice(i, 1);
      render();
    };
    layout();
    const loop = animate(sky, step, () => {
      list.length = 0;
      list.push({ p0: [0, h * 0.7], p1: [w * 0.5, h * 0.3], p2: [w, h * 0.4], t: 0.62, dur: 1, s: 36, phase: 0.6 });
      render();
    });
    new ResizeObserver(() => { layout(); render(); loop.still(); }).observe(sky);
  }
})();
