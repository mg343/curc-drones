'use strict';

/*
 * The flight path. A small drone flies a dashed route through the page's empty lanes as
 * you scroll: it takes off under FIG. 01, lands on a pad before the aircraft is taken
 * apart, takes off again after it, and lands at home next to the email address.
 * Scroll position picks a point on the route; the drone eases toward it along the path,
 * so it banks through the turns instead of jumping. Scrolling itself is never touched.
 */
(() => {
  const main = document.getElementById('main');
  const svg = document.querySelector('.flightpath');
  const drone = document.querySelector('.pathdrone');
  const RM = window.matchMedia('(prefers-reduced-motion: reduce)');
  const NS = 'http://www.w3.org/2000/svg';

  /* the flight profile's flown line draws itself once, when it comes into view */
  const profile = document.querySelector('.profile');
  if (profile) {
    const pio = new IntersectionObserver(([en]) => {
      if (en.isIntersecting) { profile.classList.add('is-in'); pio.disconnect(); }
    }, { threshold: 0.4 });
    pio.observe(profile);
  }

  if (!main || !svg || !drone) return;

  let segs = [], cur = -1, s = 0, raf = 0, last = 0, built = false;

  const catmull = (p) => {
    let d = `M${p[0].x},${p[0].y}`;
    for (let i = 0; i < p.length - 1; i++) {
      const a = p[i - 1] || p[i], b = p[i], c = p[i + 1], e = p[i + 2] || c;
      d += `C${b.x + (c.x - a.x) / 6},${b.y + (c.y - a.y) / 6} ${c.x - (e.x - b.x) / 6},${c.y - (e.y - b.y) / 6} ${c.x},${c.y}`;
    }
    return d;
  };
  const make = (tag, attrs) => {
    const el = document.createElementNS(NS, tag);
    for (const k in attrs) el.setAttribute(k, attrs[k]);
    return el;
  };

  const build = () => {
    built = false;
    svg.replaceChildren();
    if (getComputedStyle(svg).display === 'none') { drone.classList.remove('is-on'); return; }
    const box = main.getBoundingClientRect();
    const W = main.clientWidth, H = main.scrollHeight;
    svg.setAttribute('width', W);
    svg.setAttribute('height', H);
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    const groups = {};
    document.querySelectorAll('.wp').forEach((el) => {
      const r = el.getBoundingClientRect();
      (groups[el.dataset.seg] ||= []).push({ i: +el.dataset.i, x: r.left - box.left, y: r.top - box.top });
    });
    segs = Object.keys(groups).sort().map((k) => {
      const pts = groups[k].sort((a, b) => a.i - b.i);
      const d = catmull(pts);
      const base = make('path', { d, class: 'base' });
      const flown = make('path', { d, class: 'flown' });
      svg.append(base, flown);
      const len = base.getTotalLength();
      const xs = [], ys = [];
      for (let l = 0; l <= len; l += 4) {
        const p = base.getPointAtLength(l);
        xs.push(p.x);
        ys.push(p.y);
      }
      return { flown, len, xs, ys, y0: pts[0].y };
    });
    built = segs.length > 0;
    cur = -1;
    kick();
  };

  const at = (seg, l) => {
    const f = clampN(l, 0, seg.len) / 4, i = Math.min(seg.xs.length - 2, Math.floor(f)), t = f - i;
    return [seg.xs[i] + (seg.xs[i + 1] - seg.xs[i]) * t, seg.ys[i] + (seg.ys[i + 1] - seg.ys[i]) * t];
  };
  const clampN = (v, a, b) => Math.max(a, Math.min(b, v));
  const lengthAtY = (seg, y) => {
    const ys = seg.ys;
    if (y <= ys[0]) return 0;
    for (let i = 1; i < ys.length; i++) {
      if (ys[i] >= y) {
        const t = ys[i] === ys[i - 1] ? 0 : (y - ys[i - 1]) / (ys[i] - ys[i - 1]);
        return (i - 1 + t) * 4;
      }
    }
    return seg.len;
  };

  const frame = (now) => {
    raf = 0;
    if (!built) return;
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
    last = now;
    const y = window.innerHeight * 0.62 - main.getBoundingClientRect().top;
    let k = 0;
    segs.forEach((sg, i) => { if (y >= sg.y0) k = i; });
    const seg = segs[k];
    const goal = lengthAtY(seg, y);
    if (k !== cur || RM.matches) { cur = k; s = goal; } else s += (goal - s) * (1 - Math.exp(-dt * 4));

    const p = at(seg, s), a = at(seg, s - 8), b = at(seg, s + 8);
    const heading = (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI + 90;
    const speed = Math.abs(goal - s);
    drone.style.transform = `translate(${p[0]}px,${p[1]}px) rotate(${heading}deg) scale(${1 + Math.min(0.12, speed / 1500)})`;
    drone.classList.add('is-on');
    drone.classList.toggle('landed', s < 4 || s > seg.len - 4);
    segs.forEach((sg, i) => {
      const done = i < k ? sg.len : i > k ? 0 : s;
      sg.flown.style.strokeDasharray = `${done} ${sg.len + 20}`;
    });
    if (speed > 0.4 && !RM.matches) raf = requestAnimationFrame(frame);
    else last = 0;
  };
  const kick = () => { if (!raf) raf = requestAnimationFrame(frame); };

  window.addEventListener('scroll', kick, { passive: true });
  window.addEventListener('resize', kick);
  let t = 0;
  new ResizeObserver(() => { clearTimeout(t); t = setTimeout(build, 120); }).observe(main);
  window.addEventListener('load', build);
  build();
})();
