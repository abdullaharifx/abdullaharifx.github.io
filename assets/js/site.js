"use strict";

/*
  Hero: a 21-landmark hand skeleton (MediaPipe layout) moving between hand
  shapes, with fingertip paths traced behind it. Coordinates are in a
  100 x 100 box, right hand, palm facing the viewer, wrist at the bottom.

  Landmarks: 0 wrist; 1-4 thumb; 5-8 index; 9-12 middle; 13-16 ring; 17-20 pinky.
*/
(function hand() {
  const canvas = document.querySelector("[data-hand]");
  const toggle = document.querySelector("[data-hand-toggle]");
  if (!canvas || !canvas.getContext) return;
  const ctx = canvas.getContext("2d");

  const EDGES = [
    [0, 1], [1, 2], [2, 3], [3, 4],
    [0, 5], [5, 6], [6, 7], [7, 8],
    [5, 9], [9, 10], [10, 11], [11, 12],
    [9, 13], [13, 14], [14, 15], [15, 16],
    [13, 17], [0, 17], [17, 18], [18, 19], [19, 20],
  ];
  const TIPS = [4, 8, 12, 16, 20];

  // Shared palm landmarks, then finger chains per shape.
  const PALM = { 0: [52, 95], 5: [38, 56], 9: [49, 54], 13: [59, 56], 17: [68, 61] };

  // Curled fingers fold toward the viewer and down into the palm, so their
  // joints sit just below the knuckle line in this palm-facing view.
  const THUMB = {
    open:   [[41, 86], [33, 77], [27, 68], [22, 59]],
    tucked: [[42, 86], [36, 78], [42, 70], [50, 67]],
    out:    [[41, 86], [32, 80], [24, 76], [16, 73]],
    up:     [[41, 86], [32, 78], [25, 71], [18, 64]],
  };
  const INDEX = {
    open:   [[34, 41], [32, 32], [30, 23]],
    up:     [[37, 40], [36, 31], [35, 22]],
    spread: [[32, 41], [29, 32], [26, 23]],
    curled: [[39, 61], [40, 67], [42, 71]],
  };
  const MIDDLE = {
    open:   [[48, 37], [48, 27], [47, 17]],
    spread: [[51, 37], [53, 27], [55, 17]],
    curled: [[49, 60], [49, 66], [49, 71]],
  };
  const RING = {
    open:   [[61, 40], [62, 31], [63, 22]],
    curled: [[59, 62], [58, 68], [56, 72]],
  };
  const PINKY = {
    open:   [[72, 50], [74, 43], [76, 36]],
    out:    [[75, 52], [80, 46], [85, 40]],
    curled: [[67, 66], [65, 71], [63, 74]],
  };

  function shape(thumb, index, middle, ring, pinky) {
    const p = [];
    p[0] = PALM[0];
    THUMB[thumb].forEach((xy, i) => (p[1 + i] = xy));
    p[5] = PALM[5]; INDEX[index].forEach((xy, i) => (p[6 + i] = xy));
    p[9] = PALM[9]; MIDDLE[middle].forEach((xy, i) => (p[10 + i] = xy));
    p[13] = PALM[13]; RING[ring].forEach((xy, i) => (p[14 + i] = xy));
    p[17] = PALM[17]; PINKY[pinky].forEach((xy, i) => (p[18 + i] = xy));
    return p;
  }

  const POSES = [
    shape("open", "open", "open", "open", "open"),
    shape("tucked", "up", "curled", "curled", "curled"),
    shape("tucked", "spread", "spread", "curled", "curled"),
    shape("out", "up", "curled", "curled", "curled"),
    shape("up", "curled", "curled", "curled", "out"),
  ];

  const BOUNDS = POSES.flat().reduce(
    (b, [x, y]) => ({
      minX: Math.min(b.minX, x), maxX: Math.max(b.maxX, x),
      minY: Math.min(b.minY, y), maxY: Math.max(b.maxY, y),
    }),
    { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity }
  );

  const HOLD = 1300;   // ms resting on a shape
  const MOVE = 950;    // ms moving to the next
  const STEP = HOLD + MOVE;
  const TRAIL = 46;    // samples kept per fingertip

  const css = getComputedStyle(document.documentElement);
  const C = {
    ink: css.getPropertyValue("--ink").trim() || "#15221A",
    rule: css.getPropertyValue("--rule").trim() || "#D3DCD5",
    gold: css.getPropertyValue("--marigold").trim() || "#F0AE1F",
    paper: css.getPropertyValue("--paper-raised").trim() || "#FAFBF8",
  };

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  let playing = !reduce.matches;
  let visible = true;
  let raf = 0;
  let clock = 0;          // animation time in ms, advances only while playing
  let last = 0;
  let trails = TIPS.map(() => []);
  let w = 0, h = 0, scale = 1, ox = 0, oy = 0;

  function resize() {
    const r = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = r.width; h = r.height;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    // fit the bounds of every pose (plus room for the sway) into the stage
    const pad = 9;
    const sx = BOUNDS.maxX - BOUNDS.minX + pad * 2;
    const sy = BOUNDS.maxY - BOUNDS.minY + pad * 2;
    scale = Math.min(w / sx, h / sy);
    ox = (w - (BOUNDS.maxX - BOUNDS.minX) * scale) / 2 - BOUNDS.minX * scale;
    oy = (h - (BOUNDS.maxY - BOUNDS.minY) * scale) / 2 - BOUNDS.minY * scale;
    draw(posesAt(clock));
  }

  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

  function posesAt(t) {
    const n = POSES.length;
    const i = Math.floor(t / STEP) % n;
    const local = t % STEP;
    const k = local < HOLD ? 0 : ease((local - HOLD) / MOVE);
    const a = POSES[i], b = POSES[(i + 1) % n];
    // a slight sway around the wrist keeps it from looking like a vector icon
    const sway = Math.sin(t / 2600) * 0.045;
    const cx = PALM[0][0], cy = PALM[0][1];
    const cos = Math.cos(sway), sin = Math.sin(sway);
    return a.map((p, j) => {
      const x = p[0] + (b[j][0] - p[0]) * k;
      const y = p[1] + (b[j][1] - p[1]) * k;
      const dx = x - cx, dy = y - cy;
      return [cx + dx * cos - dy * sin, cy + dx * sin + dy * cos];
    });
  }

  const X = (x) => ox + x * scale;
  const Y = (y) => oy + y * scale;

  function draw(pts) {
    ctx.clearRect(0, 0, w, h);

    // fingertip trails
    ctx.lineCap = "round";
    ctx.strokeStyle = C.gold;
    trails.forEach((tr) => {
      for (let s = 1; s < tr.length; s++) {
        ctx.globalAlpha = 0.15 + (s / tr.length) * 0.85;
        ctx.lineWidth = Math.max(2, scale * 0.75) * (0.35 + 0.65 * (s / tr.length));
        ctx.beginPath();
        ctx.moveTo(X(tr[s - 1][0]), Y(tr[s - 1][1]));
        ctx.lineTo(X(tr[s][0]), Y(tr[s][1]));
        ctx.stroke();
      }
    });
    ctx.globalAlpha = 1;

    // bones
    ctx.strokeStyle = C.ink;
    ctx.lineWidth = Math.max(2, scale * 0.5);
    ctx.lineJoin = "round";
    ctx.beginPath();
    EDGES.forEach(([a, b]) => {
      ctx.moveTo(X(pts[a][0]), Y(pts[a][1]));
      ctx.lineTo(X(pts[b][0]), Y(pts[b][1]));
    });
    ctx.stroke();

    // joints
    const r = Math.max(3, scale * 1.25);
    pts.forEach((p, j) => {
      const tip = TIPS.includes(j);
      ctx.beginPath();
      ctx.arc(X(p[0]), Y(p[1]), tip ? r * 1.25 : r, 0, Math.PI * 2);
      ctx.fillStyle = tip ? C.gold : C.paper;
      ctx.fill();
      ctx.lineWidth = Math.max(1.25, scale * 0.32);
      ctx.strokeStyle = C.ink;
      ctx.stroke();
    });
  }

  function frame(now) {
    const dt = last ? Math.min(now - last, 64) : 16;
    last = now;
    clock += dt;
    const pts = posesAt(clock);
    TIPS.forEach((t, i) => {
      trails[i].push(pts[t]);
      if (trails[i].length > TRAIL) trails[i].shift();
    });
    draw(pts);
    raf = requestAnimationFrame(frame);
  }

  function start() {
    if (raf || !playing || !visible || document.hidden) return;
    last = 0;
    raf = requestAnimationFrame(frame);
  }
  function stop() {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  }

  function setPlaying(on) {
    playing = on;
    toggle.textContent = on ? "Pause motion" : "Play motion";
    toggle.setAttribute("aria-pressed", String(!on));
    if (on) start(); else stop();
  }

  if (toggle) {
    toggle.addEventListener("click", () => setPlaying(!playing));
    setPlaying(playing);
  }

  if ("IntersectionObserver" in window) {
    new IntersectionObserver((entries) => {
      visible = entries[0].isIntersecting;
      if (visible) start(); else stop();
    }).observe(canvas);
  }
  document.addEventListener("visibilitychange", () => (document.hidden ? stop() : start()));

  if ("ResizeObserver" in window) new ResizeObserver(resize).observe(canvas);
  else window.addEventListener("resize", resize);
  resize();
  start();
})();


/*
  Project index: animate rows opening and closing. Without JS (or with
  reduced motion) the native <details> toggle still works, just instantly.
*/
(function projectRows() {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  const EASE = "cubic-bezier(0.2, 0.7, 0.2, 1)";

  document.querySelectorAll(".index details").forEach((details) => {
    const summary = details.querySelector("summary");
    const body = details.querySelector(".index-body");
    if (!summary || !body || !body.animate) return;
    let anim = null;

    summary.addEventListener("click", (e) => {
      if (reduce.matches) return;
      e.preventDefault();

      const closing = details.open && !details.classList.contains("is-closing");
      // measure where we are now, including partway through a running animation
      const now = details.open ? body.getBoundingClientRect().height : 0;
      if (anim) anim.cancel();
      body.style.overflow = "hidden";

      if (closing) {
        const full = body.scrollHeight || 1;
        details.classList.add("is-closing");
        anim = body.animate(
          [
            { height: now + "px", opacity: Math.min(1, now / full), transform: "translateY(0)" },
            { height: "0px", opacity: 0, transform: "translateY(-6px)" },
          ],
          { duration: 220, easing: EASE, fill: "forwards" }
        );
        anim.onfinish = () => {
          details.open = false;
          details.classList.remove("is-closing");
          body.style.overflow = "";
          anim.cancel();
          anim = null;
        };
      } else {
        details.classList.remove("is-closing");
        details.open = true;
        const full = body.scrollHeight || 1;
        anim = body.animate(
          [
            { height: now + "px", opacity: now / full, transform: `translateY(${now ? 0 : -6}px)` },
            { height: full + "px", opacity: 1, transform: "translateY(0)" },
          ],
          { duration: 300, easing: EASE }
        );
        anim.onfinish = () => {
          body.style.overflow = "";
          anim = null;
        };
      }
    });
  });
})();


/* Mark the nav link for the section currently on screen. */
(function navState() {
  const links = [...document.querySelectorAll(".nav a")];
  const map = new Map(links.map((a) => [a.getAttribute("href").slice(1), a]));
  const sections = [...map.keys()].map((id) => document.getElementById(id)).filter(Boolean);
  if (!sections.length || !("IntersectionObserver" in window)) return;

  const seen = new Map();
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((e) => seen.set(e.target.id, e.isIntersecting));
    const current = sections.find((s) => seen.get(s.id));
    links.forEach((a) => a.removeAttribute("aria-current"));
    if (current) map.get(current.id).setAttribute("aria-current", "true");
  }, { rootMargin: "-35% 0px -60% 0px" });
  sections.forEach((s) => observer.observe(s));
})();
