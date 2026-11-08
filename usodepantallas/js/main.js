(function () {
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var nav = document.querySelector(".nav");
  var burger = document.querySelector(".burger");
  var menu = document.querySelector(".menu");
  var bar = document.querySelector(".progress");

  // Menú móvil
  if (burger) {
    burger.addEventListener("click", function () {
      var open = menu.classList.toggle("open");
      burger.setAttribute("aria-expanded", open ? "true" : "false");
    });
    menu.addEventListener("click", function (e) {
      if (e.target.closest("a")) { menu.classList.remove("open"); burger.setAttribute("aria-expanded", "false"); }
    });
  }

  // Sombra de la barra y barra de progreso de lectura
  function onScroll() {
    var y = window.scrollY;
    if (nav) nav.classList.toggle("scrolled", y > 8);
    if (bar) {
      var h = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.transform = "scaleX(" + (h > 0 ? Math.min(1, y / h) : 0) + ")";
    }
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // Contadores animados: el valor final ya está escrito en el HTML
  function countUp(el) {
    var to = parseFloat(el.dataset.to), dec = parseInt(el.dataset.dec || "0", 10);
    var pre = el.dataset.pre || "", suf = el.dataset.suf || "";
    var fmt = function (v) { return pre + v.toFixed(dec).replace(".", ",") + suf; };
    if (reduce || isNaN(to)) return;
    var t0 = null, dur = 1600;
    function step(t) {
      if (!t0) t0 = t;
      var p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt(to * e);
      if (p < 1) requestAnimationFrame(step); else el.textContent = fmt(to);
    }
    requestAnimationFrame(step);
  }

  function play(el) {
    el.classList.remove("reveal-wait"); el.classList.add("reveal-in");
    el.classList.remove("pending");
    el.querySelectorAll("[data-to]").forEach(countUp);
    if (el.matches("[data-to]")) countUp(el);
    el.querySelectorAll(".donut .val").forEach(function (c) { c.style.strokeDashoffset = c.dataset.off; });
  }

  var io = "IntersectionObserver" in window ? new IntersectionObserver(function (entries) {
    entries.forEach(function (en) { if (en.isIntersecting) { play(en.target); io.unobserve(en.target); } });
  }, { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }) : null;

  // Prepara solo lo que está fuera de la primera pantalla: lo visible al cargar queda completo.
  function arm(root, all) {
    if (reduce || !io) return;
    root.querySelectorAll("[data-reveal]").forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (!all && r.top < window.innerHeight) return;
      el.classList.add("reveal-wait");
      if (el.querySelector(".bar")) el.classList.add("pending");
      el.querySelectorAll(".donut .val").forEach(function (c) { c.style.strokeDashoffset = 289; });
      io.observe(el);
    });
  }

  // Autoevaluación
  document.querySelectorAll("[data-check]").forEach(function (box) {
    var out = box.querySelector(".verdict");
    function upd() {
      var n = box.querySelectorAll("input:checked").length;
      out.classList.remove("ok", "warn");
      if (n === 0) { out.textContent = "Marcá las situaciones que te pasan seguido."; }
      else if (n === 1) { out.classList.add("ok"); out.textContent = "1 de 4: hay algo para mirar, pero el equilibrio está cerca."; }
      else { out.classList.add("warn"); out.textContent = n + " de 4: las pantallas están ocupando lugar de cosas importantes. Revisá los consejos."; }
    }
    box.addEventListener("change", upd); upd();
  });

  // Modo de una sola página (versión publicada): muestra la sección del #hash
  var views = document.querySelectorAll("[data-view]");
  if (views.length) {
    var names = Array.prototype.map.call(views, function (v) { return v.dataset.view; });
    function show() {
      var h = location.hash.replace("#", "");
      if (names.indexOf(h) < 0) h = names[0];
      views.forEach(function (v) {
        var on = v.dataset.view === h;
        v.hidden = !on;
        if (on) { v.classList.remove("page-enter"); void v.offsetWidth; v.classList.add("page-enter"); }
      });
      document.querySelectorAll(".menu a, footer nav a").forEach(function (a) {
        a.classList.toggle("active", a.getAttribute("href") === "#" + h);
      });
      window.scrollTo(0, 0);
      var cur = document.querySelector('[data-view="' + h + '"]');
      requestAnimationFrame(function () { arm(cur, false); onScroll(); });
    }
    window.addEventListener("hashchange", show);
    show();
  } else {
    arm(document, false);
  }
})();
