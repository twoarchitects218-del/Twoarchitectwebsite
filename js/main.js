/* TWO Architects — Gallery */
(function () {
  "use strict";
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const DATA = window.TWO_DATA || { projects: [], gallery: [] };
  const CAT = { arch: "Architecture", interior: "Interior", detail: "Details" };

  const items = DATA.projects.map((p) => ({ name: p.name, cat: p.cat, img: p.img }))
    .concat(DATA.gallery.map((src) => ({ name: "", cat: "detail", img: src })));

  /* Header turns solid once past the film */
  const header = $(".header"), hero = $(".hero");
  const onScroll = () => header.classList.toggle("is-solid", window.scrollY > hero.offsetHeight - 70);
  window.addEventListener("scroll", onScroll, { passive: true }); onScroll();
  if (reduced) { const v = $(".hero video"); v.removeAttribute("autoplay"); v.pause(); }

  /* Wall */
  const wall = $("#wall");
  const io = new IntersectionObserver((es) => es.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); }
  }), { rootMargin: "0px 0px -5% 0px" });

  let shown = [];
  function render(filter) {
    shown = items.filter((it) => filter === "all" || it.cat === filter);
    wall.innerHTML = shown.map((it, i) => {
      const label = it.name || "TWO Architects — " + CAT[it.cat];
      return `<button class="item" type="button" data-i="${i}" aria-label="Open ${label}">` +
        `<img src="${it.img}" alt="${label}" loading="lazy" decoding="async">` +
        `<figcaption>${it.name ? `<b>${it.name}</b>` : "<b></b>"}<span>${CAT[it.cat]}</span></figcaption></button>`;
    }).join("");
    $$(".item", wall).forEach((el) => io.observe(el));
  }

  const counts = { all: items.length };
  items.forEach((it) => { counts[it.cat] = (counts[it.cat] || 0) + 1; });
  $$("[data-filter]").forEach((b) => { b.querySelector("sup").textContent = counts[b.dataset.filter] || 0; });

  let current = new URLSearchParams(location.search).get("filter");
  if (!CAT[current]) current = "all";
  function setFilter(f, animate) {
    current = f;
    $$("[data-filter]").forEach((b) => b.setAttribute("aria-pressed", b.dataset.filter === f));
    const u = new URL(location.href);
    if (f === "all") u.searchParams.delete("filter"); else u.searchParams.set("filter", f);
    history.replaceState(null, "", u);
    if (!animate || reduced) return render(f);
    wall.classList.add("is-fading");
    setTimeout(() => { render(f); wall.classList.remove("is-fading"); }, 300);
  }
  $$("[data-filter]").forEach((b) => b.addEventListener("click", () => {
    setFilter(b.dataset.filter, true);
    const top = $("#gallery").offsetTop - 63;
    if (window.scrollY > top) window.scrollTo({ top, behavior: reduced ? "auto" : "smooth" });
  }));
  setFilter(current, false);

  $$("[data-cols]").forEach((b) => {
    if (b === wall) return;
    b.addEventListener("click", () => {
      wall.dataset.cols = b.dataset.cols;
      $$(".density [data-cols]").forEach((x) => x.setAttribute("aria-pressed", x === b));
    });
  });

  /* Lightbox */
  const lb = $(".lb"), lbImg = $(".lb-stage img", lb);
  let idx = 0, opener = null;
  function show(i) {
    idx = (i + shown.length) % shown.length;
    const it = shown[idx];
    lbImg.classList.add("is-swap");
    const pre = new Image();
    pre.onload = pre.onerror = () => { lbImg.src = it.img; lbImg.alt = it.name || CAT[it.cat]; lbImg.classList.remove("is-swap"); };
    pre.src = it.img;
    $(".lb-title", lb).textContent = it.name || "TWO Architects";
    $(".lb-cat", lb).textContent = CAT[it.cat];
    $(".lb-count", lb).textContent = String(idx + 1).padStart(2, "0") + " / " + String(shown.length).padStart(2, "0");
  }
  function open(i, from) {
    opener = from; show(i);
    lb.classList.add("open"); lb.setAttribute("aria-hidden", "false");
    document.documentElement.style.overflow = "hidden";
    $(".lb-close", lb).focus();
  }
  function close() {
    lb.classList.remove("open"); lb.setAttribute("aria-hidden", "true");
    document.documentElement.style.overflow = "";
    if (opener) opener.focus();
  }
  wall.addEventListener("click", (e) => { const b = e.target.closest(".item"); if (b) open(+b.dataset.i, b); });
  $(".lb-close", lb).addEventListener("click", close);
  $(".lb-prev", lb).addEventListener("click", () => show(idx - 1));
  $(".lb-next", lb).addEventListener("click", () => show(idx + 1));
  $(".lb-stage", lb).addEventListener("click", (e) => { if (e.target === e.currentTarget) close(); });
  document.addEventListener("keydown", (e) => {
    if (!lb.classList.contains("open")) return;
    if (e.key === "Escape") close();
    else if (e.key === "ArrowRight") show(idx + 1);
    else if (e.key === "ArrowLeft") show(idx - 1);
  });
  let sx = null;
  lb.addEventListener("touchstart", (e) => { sx = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener("touchend", (e) => {
    if (sx === null) return;
    const dx = e.changedTouches[0].clientX - sx;
    if (Math.abs(dx) > 50) show(idx + (dx < 0 ? 1 : -1));
    sx = null;
  });

  $$("[data-year]").forEach((el) => { el.textContent = new Date().getFullYear(); });
})();
