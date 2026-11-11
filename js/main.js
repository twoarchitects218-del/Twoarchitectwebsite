/* ==========================================================================
   TWO Architects — interactions
   No dependencies. Every feature checks for its markup, so one file serves all pages.
   ========================================================================== */
(function () {
  "use strict";

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const store = {
    get(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { sessionStorage.setItem(k, v); } catch (e) {} }
  };
  const ARROW = '<svg class="arrow" viewBox="0 0 18 10" fill="none" stroke="currentColor"><path d="M0 5h17M12.5 0.5 17 5l-4.5 4.5"/></svg>';

  /* ---------- Line-drawing: measure every stroked path once ---------- */
  function measure(root) {
    $$("path, circle, line, polyline, rect", root).forEach((el) => {
      try { el.style.setProperty("--len", Math.ceil(el.getTotalLength()) + 1); } catch (e) {}
    });
  }
  $$(".draw").forEach(measure);

  /* ---------- Preloader (home, once per session) ---------- */
  const loader = $(".loader");
  if (loader) {
    if (store.get("two-loaded") || reduced) {
      loader.remove();
    } else {
      document.documentElement.classList.add("no-arrive");
      store.set("two-loaded", "1");
      const count = $(".loader-count", loader);
      const start = performance.now();
      const dur = 2000;
      (function tick(now) {
        const p = Math.min(1, (now - start) / dur);
        if (count) count.textContent = String(Math.round(p * 100)).padStart(3, "0");
        if (p < 1) requestAnimationFrame(tick);
        else {
          loader.classList.add("is-done");
          document.body.classList.add("is-loaded");
          setTimeout(() => loader.remove(), 1200);
        }
      })(start);
    }
  }

  /* ---------- Page-transition films ---------- */
  const PAGES = { "": "home", "index.html": "home", "work.html": "work", "studio.html": "studio", "services.html": "services", "gallery.html": "gallery", "contact.html": "contact" };
  const pt = $(".pt");
  const ptVideo = pt && $("video", pt);
  let leaving = false;

  function pageKey(url) {
    const file = url.pathname.split("/").pop();
    return PAGES[file];
  }
  // H.264 everywhere it's supported; VP9 WebM for browsers built without it.
  const probe = document.createElement("video");
  const EXT = probe.canPlayType('video/mp4; codecs="avc1.42E01E"') ? ".mp4" : ".webm";
  function clipFor(key) { return "assets/video/transitions/" + key + EXT; }

  function go(href) { window.location.href = href; }

  function playTransition(href, key) {
    if (!pt || !ptVideo || reduced) return go(href);
    leaving = true;
    document.documentElement.classList.remove("menu-open");
    let done = false;
    const finish = () => { if (done) return; done = true; go(href); };
    ptVideo.src = clipFor(key);
    ptVideo.currentTime = 0;
    pt.classList.add("is-playing");
    ptVideo.onended = finish;
    ptVideo.onerror = () => setTimeout(finish, 250);
    const p = ptVideo.play();
    if (p && p.catch) p.catch(() => setTimeout(finish, 250));
    setTimeout(finish, 2600); // safety net if the film stalls
  }

  document.addEventListener("click", (e) => {
    const a = e.target.closest("a[href]");
    if (!a || leaving) return;
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (a.target && a.target !== "_self") return;
    if (a.hasAttribute("download")) return;
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin) return;
    const key = pageKey(url);
    if (!key) return;
    const samePage = url.pathname === location.pathname;
    if (samePage && url.hash) return; // in-page anchor
    e.preventDefault();
    if (samePage) { window.scrollTo({ top: 0, behavior: "smooth" }); document.documentElement.classList.remove("menu-open"); return; }
    playTransition(url.href, key);
  });

  // Back/forward cache: never come back to a page frozen mid-film.
  window.addEventListener("pageshow", (e) => {
    if (e.persisted && pt) { pt.classList.remove("is-playing"); if (ptVideo) ptVideo.pause(); leaving = false; }
  });

  // Warm the films for other pages once the current page is idle.
  const idle = window.requestIdleCallback || ((fn) => setTimeout(fn, 1500));
  idle(() => {
    const here = pageKey(location);
    Object.values(PAGES).filter((v, i, arr) => arr.indexOf(v) === i && v !== here).forEach((k) => {
      const l = document.createElement("link");
      l.rel = "prefetch"; l.as = "video"; l.href = clipFor(k);
      document.head.appendChild(l);
    });
  });

  /* ---------- Header ---------- */
  const header = $(".header");
  const darkHero = $("[data-dark-hero]");
  let lastY = window.scrollY;
  function onScrollHeader() {
    const y = window.scrollY;
    if (!header) return;
    const heroH = darkHero ? darkHero.offsetHeight - 80 : 0;
    header.classList.toggle("is-dark", !!darkHero && y < heroH);
    header.classList.toggle("is-scrolled", darkHero ? y >= heroH : y > 30);
    const goingDown = y > lastY && y > 400;
    if (!document.documentElement.classList.contains("menu-open")) header.classList.toggle("is-hidden", goingDown);
    lastY = y;
  }

  /* ---------- Menu ---------- */
  const menuBtn = $(".menu-btn");
  if (menuBtn) {
    menuBtn.addEventListener("click", () => {
      const open = document.documentElement.classList.toggle("menu-open");
      menuBtn.setAttribute("aria-expanded", open);
      $(".menu-btn .label").textContent = open ? "Close" : "Menu";
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && document.documentElement.classList.contains("menu-open")) menuBtn.click();
    });
  }

  /* ---------- Custom cursor ---------- */
  if (finePointer && !reduced) {
    const ring = document.createElement("div"); ring.className = "cursor"; ring.innerHTML = "<span>View</span>";
    const dot = document.createElement("div"); dot.className = "cursor-dot";
    document.body.append(ring, dot);
    let mx = -100, my = -100, rx = -100, ry = -100;
    window.addEventListener("mousemove", (e) => { mx = e.clientX; my = e.clientY; dot.style.transform = `translate(${mx}px, ${my}px)`; }, { passive: true });
    (function loop() {
      rx += (mx - rx) * 0.18; ry += (my - ry) * 0.18;
      ring.style.transform = `translate(${rx}px, ${ry}px)`;
      requestAnimationFrame(loop);
    })();
    document.addEventListener("mouseover", (e) => {
      const view = e.target.closest("[data-cursor='view']");
      const link = e.target.closest("a, button, summary, label, input, textarea, select");
      ring.classList.toggle("is-view", !!view);
      ring.classList.toggle("is-link", !view && !!link);
      const label = view && view.getAttribute("data-cursor-label");
      ring.firstChild.textContent = label || "View";
    });
    document.addEventListener("mouseleave", () => { mx = my = -100; });
  }

  /* ---------- Reveal on scroll ---------- */
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); }
    });
  }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
  function observeReveals(root = document) { $$(".reveal, .img-reveal, [data-reveal]", root).forEach((el) => io.observe(el)); }
  observeReveals();

  /* ---------- Scroll-lit statement ---------- */
  const statement = $(".statement");
  let words = [];
  if (statement) {
    statement.innerHTML = statement.textContent.trim().split(/\s+/).map((w) => `<span class="w">${w}</span>`).join(" ");
    words = $$(".w", statement);
  }

  /* ---------- Counters ---------- */
  const cio = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      const el = en.target; cio.unobserve(el);
      const target = +el.dataset.count; const t0 = performance.now(); const d = 1800;
      (function step(now) {
        const p = Math.min(1, (now - t0) / d); const v = Math.round(target * (1 - Math.pow(1 - p, 4)));
        el.textContent = v.toLocaleString("en-IN");
        if (p < 1) requestAnimationFrame(step);
      })(t0);
    });
  }, { threshold: 0.6 });
  $$("[data-count]").forEach((el) => cio.observe(el));

  /* ---------- Scroll-driven effects (single rAF) ---------- */
  const parallax = $$("[data-parallax]");
  const process = $(".process");
  const steps = $$(".process .step");
  let ticking = false;
  function onScroll() {
    if (ticking) return; ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      onScrollHeader();
      const vh = window.innerHeight;
      if (!reduced) parallax.forEach((el) => {
        const r = el.parentElement.getBoundingClientRect();
        if (r.bottom < 0 || r.top > vh) return;
        const p = (r.top + r.height / 2 - vh / 2) / vh;
        el.style.transform = `translate3d(0, ${(p * -(+el.dataset.parallax || 60)).toFixed(1)}px, 0) scale(1.12)`;
      });
      if (words.length) {
        const r = statement.getBoundingClientRect();
        const p = Math.min(1, Math.max(0, (vh * 0.85 - r.top) / (r.height + vh * 0.35)));
        const lit = Math.floor(p * words.length * 1.05);
        words.forEach((w, i) => w.classList.toggle("on", i < lit));
      }
      if (process) {
        const r = process.getBoundingClientRect();
        const p = Math.min(1, Math.max(0, (vh * 0.75 - r.top) / (vh * 0.5)));
        process.style.setProperty("--p", p.toFixed(3));
        steps.forEach((s, i) => s.classList.toggle("is-on", p >= i / steps.length + 0.02));
      }
    });
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  onScroll();

  /* ---------- Hero reel: caption follows the film ---------- */
  const reel = $(".hero video");
  const nowName = $("[data-now-name]");
  const nowType = $("[data-now-type]");
  if (reel && nowName) {
    const shots = JSON.parse(reel.dataset.shots || "[]");
    let last = -1;
    reel.addEventListener("timeupdate", () => {
      const i = Math.min(shots.length - 1, Math.floor((reel.currentTime + 0.4) / 3.2));
      if (i === last || !shots[i]) return; last = i;
      nowName.textContent = shots[i][0]; nowType.textContent = shots[i][1];
    });
    if (reduced) { reel.removeAttribute("autoplay"); reel.pause(); }
  }

  /* ---------- Draggable horizontal track ---------- */
  $$(".track-wrap").forEach((wrap) => {
    const track = $(".track", wrap);
    const bar = $(".track-progress i", wrap);
    const update = () => {
      const max = track.scrollWidth - track.clientWidth;
      const ratio = track.clientWidth / track.scrollWidth;
      if (bar) { bar.style.width = (ratio * 100) + "%"; bar.style.transform = `translateX(${max ? (track.scrollLeft / max) * ((1 - ratio) / ratio) * 100 : 0}%)`; }
    };
    track.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update); update();
    $$("[data-dir]", wrap).forEach((b) => b.addEventListener("click", () => {
      const card = $(".card", track);
      track.scrollBy({ left: (+b.dataset.dir) * (card ? card.offsetWidth + 24 : 400), behavior: "smooth" });
    }));
    if (!finePointer) return;
    let down = false, startX = 0, startL = 0, moved = 0;
    track.addEventListener("pointerdown", (e) => { down = true; moved = 0; startX = e.clientX; startL = track.scrollLeft; });
    window.addEventListener("pointermove", (e) => {
      if (!down) return;
      const dx = e.clientX - startX; moved = Math.abs(dx);
      if (moved > 6) track.classList.add("is-drag");
      track.scrollLeft = startL - dx;
    });
    window.addEventListener("pointerup", () => { if (!down) return; down = false; setTimeout(() => track.classList.remove("is-drag"), 0); });
  });

  /* ---------- Services hover image ---------- */
  const svcFloat = $(".svc-float");
  if (svcFloat && finePointer) {
    const imgs = $$("img", svcFloat);
    let x = 0, y = 0, fx = 0, fy = 0, raf;
    const follow = () => { fx += (x - fx) * 0.14; fy += (y - fy) * 0.14; svcFloat.style.transform = `translate(${fx - 150}px, ${fy - 190}px) ${svcFloat.classList.contains("on") ? "scale(1)" : "scale(.8)"}`; raf = requestAnimationFrame(follow); };
    $$(".svc-item").forEach((item, i) => {
      item.addEventListener("mouseenter", (e) => { x = fx = e.clientX; y = fy = e.clientY; svcFloat.classList.add("on"); imgs.forEach((im, j) => im.classList.toggle("on", j === i)); if (!raf) follow(); });
      item.addEventListener("mousemove", (e) => { x = e.clientX; y = e.clientY; });
      item.addEventListener("mouseleave", () => svcFloat.classList.remove("on"));
    });
  }

  /* ---------- Lightbox (shared by Work + Gallery) ---------- */
  const lb = $(".lb");
  let lbItems = [], lbIndex = 0, lbReturn = null;
  function lbShow(i) {
    if (!lb) return;
    lbIndex = (i + lbItems.length) % lbItems.length;
    const it = lbItems[lbIndex];
    const img = $(".lb-stage img", lb);
    img.classList.add("is-swap");
    const pre = new Image();
    pre.onload = pre.onerror = () => { img.src = it.img; img.alt = it.name || "Project image"; img.classList.remove("is-swap"); };
    pre.src = it.img;
    $(".lb-title", lb).textContent = it.name || "";
    $(".lb-cat", lb).textContent = it.label || "";
    $(".lb-count", lb).textContent = String(lbIndex + 1).padStart(2, "0") + " / " + String(lbItems.length).padStart(2, "0");
  }
  function lbOpen(items, i, from) {
    lbItems = items; lbReturn = from; lbShow(i);
    lb.classList.add("open"); lb.setAttribute("aria-hidden", "false");
    document.documentElement.style.overflow = "hidden";
    $(".lb-close", lb).focus();
  }
  function lbClose() {
    lb.classList.remove("open"); lb.setAttribute("aria-hidden", "true");
    document.documentElement.style.overflow = "";
    if (lbReturn) lbReturn.focus();
  }
  if (lb) {
    $(".lb-close", lb).addEventListener("click", lbClose);
    $(".lb-prev", lb).addEventListener("click", () => lbShow(lbIndex - 1));
    $(".lb-next", lb).addEventListener("click", () => lbShow(lbIndex + 1));
    $(".lb-stage", lb).addEventListener("click", (e) => { if (e.target === e.currentTarget) lbClose(); });
    document.addEventListener("keydown", (e) => {
      if (!lb.classList.contains("open")) return;
      if (e.key === "Escape") lbClose();
      if (e.key === "ArrowRight") lbShow(lbIndex + 1);
      if (e.key === "ArrowLeft") lbShow(lbIndex - 1);
    });
    let sx = null;
    lb.addEventListener("touchstart", (e) => { sx = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener("touchend", (e) => { if (sx === null) return; const dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 50) lbShow(lbIndex + (dx < 0 ? 1 : -1)); sx = null; });
  }

  const DATA = window.TWO_DATA || { projects: [], gallery: [] };
  const CAT = { arch: "Architecture & Landscape", interior: "Interior Design" };

  /* ---------- Work page ---------- */
  const grid = $("#work-grid");
  if (grid) {
    const params = new URLSearchParams(location.search);
    let filter = ["arch", "interior"].includes(params.get("filter")) ? params.get("filter") : "all";
    const items = DATA.projects.map((p) => ({ ...p, label: CAT[p.cat] }));
    grid.innerHTML = items.map((p, i) => `
      <button class="tile reveal" type="button" data-cat="${p.cat}" data-i="${i}" data-cursor="view" aria-label="Open ${p.name}">
        <span class="idx">${String(i + 1).padStart(2, "0")}</span>
        <span class="tile-media"><img src="${p.img}" alt="${p.name} — ${p.label}" loading="lazy" decoding="async"></span>
        <span class="tile-info"><b>${p.name}</b><span>${p.cat === "arch" ? "Architecture" : "Interior"}</span></span>
      </button>`).join("");
    const tiles = $$(".tile", grid);
    observeReveals(grid);
    const counts = { all: items.length, arch: items.filter((p) => p.cat === "arch").length, interior: items.filter((p) => p.cat === "interior").length };
    $$("[data-filter]").forEach((b) => { const s = b.querySelector("sup"); if (s) s.textContent = counts[b.dataset.filter]; });
    const countEl = $("[data-work-count]");
    function visible() { return tiles.filter((t) => !t.hidden); }
    function apply(f, animate) {
      filter = f;
      $$("[data-filter]").forEach((b) => b.setAttribute("aria-pressed", b.dataset.filter === f));
      const show = (t) => f === "all" || t.dataset.cat === f;
      if (!animate || reduced) { tiles.forEach((t) => { t.hidden = !show(t); }); }
      else {
        tiles.forEach((t) => t.classList.add("is-hiding"));
        setTimeout(() => {
          tiles.forEach((t) => { t.hidden = !show(t); });
          let n = 0;
          tiles.forEach((t) => { if (!t.hidden) { t.classList.add("is-in"); setTimeout(() => t.classList.remove("is-hiding"), 30 + Math.min(n++, 12) * 40); } });
        }, 380);
      }
      if (countEl) countEl.textContent = String(f === "all" ? counts.all : counts[f]).padStart(2, "0");
      const u = new URL(location.href); if (f === "all") u.searchParams.delete("filter"); else u.searchParams.set("filter", f);
      history.replaceState(null, "", u);
    }
    $$("[data-filter]").forEach((b) => b.addEventListener("click", () => apply(b.dataset.filter, true)));
    apply(filter, false);

    grid.addEventListener("click", (e) => {
      const t = e.target.closest(".tile"); if (!t) return;
      const vis = visible();
      lbOpen(vis.map((v) => items[+v.dataset.i]), vis.indexOf(t), t);
    });

    // grid / list view
    const preview = $(".list-preview");
    $$("[data-view]").forEach((b) => b.addEventListener("click", () => {
      const list = b.dataset.view === "list";
      grid.classList.toggle("is-list", list);
      $$("[data-view]").forEach((x) => x.setAttribute("aria-pressed", x === b));
    }));
    if (preview && finePointer) {
      const pimg = $("img", preview);
      grid.addEventListener("mousemove", (e) => {
        if (!grid.classList.contains("is-list")) return preview.classList.remove("on");
        const t = e.target.closest(".tile");
        if (!t) return preview.classList.remove("on");
        const src = items[+t.dataset.i].img;
        if (!pimg.src.endsWith(src)) pimg.src = src;
        preview.style.left = (e.clientX + 30) + "px"; preview.style.top = (e.clientY - 120) + "px";
        preview.classList.add("on");
      });
      grid.addEventListener("mouseleave", () => preview.classList.remove("on"));
    }
  }

  /* ---------- Gallery page ---------- */
  const masonry = $("#gallery-grid");
  if (masonry) {
    const items = DATA.gallery.map((src, i) => ({ img: src, name: "Gallery — " + String(i + 1).padStart(2, "0"), label: "TWO Architects" }));
    masonry.innerHTML = items.map((g, i) => `<button type="button" class="reveal" data-i="${i}" data-cursor="view" data-cursor-label="Open" aria-label="Open image ${i + 1}"><img src="${g.img}" alt="Interior and architecture work by TWO Architects, image ${i + 1}" loading="lazy" decoding="async"></button>`).join("");
    observeReveals(masonry);
    masonry.addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) lbOpen(items, +b.dataset.i, b); });
  }

  /* ---------- Click-to-play film ---------- */
  $$(".video-frame").forEach((f) => {
    const v = $("video", f), btn = $(".video-play", f);
    if (!v || !btn) return;
    btn.addEventListener("click", () => { f.classList.add("playing"); v.controls = true; v.play(); });
    v.addEventListener("pause", () => { if (v.ended) { f.classList.remove("playing"); v.controls = false; } });
  });

  /* ---------- Testimonials ---------- */
  const quotes = $$(".quote");
  if (quotes.length) {
    const dots = $(".quote-dots");
    let qi = 0, timer;
    quotes.forEach((_, i) => { const b = document.createElement("button"); b.type = "button"; b.setAttribute("aria-label", "Testimonial " + (i + 1)); b.addEventListener("click", () => { show(i); restart(); }); dots.appendChild(b); });
    const dotBtns = $$("button", dots);
    function show(i) { qi = (i + quotes.length) % quotes.length; quotes.forEach((q, j) => q.classList.toggle("on", j === qi)); dotBtns.forEach((d, j) => d.classList.toggle("on", j === qi)); }
    function restart() { clearInterval(timer); if (!reduced) timer = setInterval(() => show(qi + 1), 6000); }
    show(0); restart();
  }

  /* ---------- Services sticky nav ---------- */
  const svcLinks = $$(".svc-nav a");
  if (svcLinks.length) {
    const sio = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) svcLinks.forEach((a) => a.classList.toggle("on", a.getAttribute("href") === "#" + en.target.id)); });
    }, { rootMargin: "-45% 0px -50% 0px" });
    $$(".svc-block[id]").forEach((s) => sio.observe(s));
  }

  /* ---------- Contact form → email draft ---------- */
  const form = $("#contact-form");
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!form.reportValidity()) return;
      const d = new FormData(form);
      const lines = [
        "Name: " + d.get("first") + " " + d.get("last"),
        "Email: " + d.get("email"),
        "Phone: " + d.get("phone"),
        "Interested in: " + (d.get("type") || "—"),
        "",
        d.get("message") || ""
      ];
      const subject = "Project enquiry — " + (d.get("type") || "General");
      window.location.href = "mailto:hr.twoarchitects@gmail.com?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(lines.join("\n"));
      const note = $(".form-note", form);
      if (note) note.textContent = "Your email app should open with the message ready to send. If it doesn't, write to hr.twoarchitects@gmail.com or call +91 93132 97090.";
    });
  }

  /* ---------- Year ---------- */
  $$("[data-year]").forEach((el) => { el.textContent = new Date().getFullYear(); });

  // expose the arrow for templates that build buttons in JS
  window.TWO_ARROW = ARROW;
})();
