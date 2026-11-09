/* =========================================================================
   Portfolio v5 — interactions
   mode jour/nuit (ah5-mode) · langue FR/EN (ah5-lang) · sommaire · visionneuse
   ========================================================================= */
(function () {
  "use strict";

  var root = document.documentElement;
  var K_MODE = "ah5-mode";
  var K_LANG = "ah5-lang";

  /* ---------- 1. Mode ---------- */
  function setMode(m, persist) {
    if (m !== "night" && m !== "day") m = "day";
    root.setAttribute("data-mode", m);
    if (persist) { try { localStorage.setItem(K_MODE, m); } catch (e) {} }
    var btn = document.querySelector("[data-mode-toggle]");
    if (btn) btn.setAttribute("aria-pressed", m === "night" ? "true" : "false");
  }
  function initMode() {
    var saved = null;
    try { saved = localStorage.getItem(K_MODE); } catch (e) {}
    if (!saved) {
      var h = new Date().getHours();
      saved = (h >= 20 || h < 7) ? "night" : "day";
    }
    setMode(saved, false);
  }

  /* ---------- 2. Langue ---------- */
  function setLang(l, persist) {
    if (l !== "en" && l !== "fr") l = "fr";
    root.setAttribute("lang", l);
    if (persist) { try { localStorage.setItem(K_LANG, l); } catch (e) {} }
    var btn = document.querySelector("[data-lang-toggle]");
    if (btn) btn.setAttribute("lang", l === "fr" ? "en" : "fr");
    var t = document.querySelector("title");
    if (t) {
      t.textContent = l === "fr"
        ? "HAMDI Ahmed — Portfolio ingénierie mécanique"
        : "HAMDI Ahmed — Mechanical engineering portfolio";
    }
    var mt = document.querySelector('meta[name="description"]');
    if (mt) {
      mt.setAttribute("content", l === "fr"
        ? "Portfolio de HAMDI Ahmed, élève ingénieur Arts et Métiers / ENIB : conception mécanique, industrialisation, simulation, stages et dossier technique."
        : "Portfolio of HAMDI Ahmed, Arts et Métiers / ENIB engineering student: mechanical design, industrialisation, simulation, internships and technical file.");
    }
  }
  function initLang() {
    var saved = null;
    try { saved = localStorage.getItem(K_LANG); } catch (e) {}
    if (!saved) {
      var nav = (navigator.language || "fr").toLowerCase();
      saved = nav.indexOf("fr") === 0 ? "fr" : "en";
    }
    setLang(saved, false);
  }

  /* ---------- 3. Bascules ---------- */
  function wireToggles() {
    var m = document.querySelector("[data-mode-toggle]");
    if (m) m.addEventListener("click", function () {
      setMode(root.getAttribute("data-mode") === "night" ? "day" : "night", true);
    });
    var l = document.querySelector("[data-lang-toggle]");
    if (l) l.addEventListener("click", function () {
      setLang(root.getAttribute("lang") === "fr" ? "en" : "fr", true);
    });
  }

  /* ---------- 4. Menu mobile ---------- */
  function wireDrawer() {
    var b = document.querySelector("[data-burger]");
    var d = document.getElementById("drawer");
    if (!b || !d) return;
    function toggle(force) {
      var on = typeof force === "boolean" ? force : !d.classList.contains("on");
      d.classList.toggle("on", on);
      b.setAttribute("aria-expanded", on ? "true" : "false");
      document.body.classList.toggle("locked", on);
    }
    b.addEventListener("click", function () { toggle(); });
    d.addEventListener("click", function (e) {
      if (e.target.closest("a")) toggle(false);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") toggle(false);
    });
    window.addEventListener("resize", function () {
      if (window.innerWidth > 1060) toggle(false);
    });
  }

  /* ---------- 5. Sommaire actif + jauge de lecture ---------- */
  function wireScroll() {
    var bar = document.getElementById("progress");
    function onScroll() {
      var h = document.documentElement;
      var max = h.scrollHeight - h.clientHeight;
      var p = max > 0 ? (h.scrollTop || document.body.scrollTop) / max : 0;
      if (bar) bar.style.width = (p * 100).toFixed(2) + "%";
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    var links = Array.prototype.slice.call(document.querySelectorAll("[data-nav]"));
    var secs = Array.prototype.slice.call(document.querySelectorAll("main section[id]"));
    if (!links.length || !secs.length || !("IntersectionObserver" in window)) return;

    function mark(id) {
      links.forEach(function (a) {
        var on = a.getAttribute("data-nav") === id;
        a.classList.toggle("is-active", on);
        if (on) a.setAttribute("aria-current", "true"); else a.removeAttribute("aria-current");
      });
    }
    var io = new IntersectionObserver(function (entries) {
      var best = null;
      entries.forEach(function (en) {
        if (en.isIntersecting && (!best || en.intersectionRatio > best.intersectionRatio)) best = en;
      });
      if (best) mark(best.target.id);
    }, { rootMargin: "-45% 0px -45% 0px", threshold: [0, 0.01, 0.15] });
    secs.forEach(function (s) { io.observe(s); });
  }

  /* ---------- 6. Révélations + jauges ---------- */
  function wireReveal() {
    var items = document.querySelectorAll(".reveal");
    if (!("IntersectionObserver" in window)) {
      items.forEach(function (el) { el.classList.add("in"); });
      document.querySelectorAll("[data-val]").forEach(function (g) {
        g.style.width = g.getAttribute("data-val") + "%";
      });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add("in");
        en.target.querySelectorAll("[data-val]").forEach(function (g) {
          g.style.width = g.getAttribute("data-val") + "%";
        });
        io.unobserve(en.target);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    items.forEach(function (el) { io.observe(el); });
  }

  /* ---------- 7. Visionneuse ---------- */
  function wireLightbox() {
    var lb = document.getElementById("lb");
    if (!lb) return;
    var img = lb.querySelector("img");
    var cap = lb.querySelector("[data-lb-cap]");
    var dl = lb.querySelector("[data-lb-dl]");
    var lastFocus = null;

    function open(src, title, pdf) {
      lastFocus = document.activeElement;
      img.setAttribute("src", src);
      img.setAttribute("alt", title || "");
      if (cap) cap.textContent = title || "";
      if (dl) {
        if (pdf) { dl.setAttribute("href", pdf); dl.style.display = ""; }
        else { dl.style.display = "none"; }
      }
      lb.classList.add("on");
      document.body.classList.add("locked");
      var c = lb.querySelector("[data-lb-close]");
      if (c) c.focus();
    }
    function close() {
      lb.classList.remove("on");
      document.body.classList.remove("locked");
      img.removeAttribute("src");
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }
    lb.addEventListener("click", function (e) {
      if (e.target === lb || e.target.closest("[data-lb-close]")) close();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && lb.classList.contains("on")) close();
    });
    document.addEventListener("click", function (e) {
      var t = e.target.closest("[data-zoom]");
      if (!t) return;
      e.preventDefault();
      open(t.getAttribute("data-zoom"), t.getAttribute("data-cap") || "", t.getAttribute("data-pdf") || "");
    });
  }

  /* ---------- 8. Vidéos ---------- */
  function wireVideos() {
    document.querySelectorAll("[data-video]").forEach(function (box) {
      var v = box.querySelector("video");
      if (!v) return;
      function sync() { box.classList.toggle("is-playing", !v.paused); }
      var btn = box.querySelector("[data-play]");
      if (btn) btn.addEventListener("click", function () {
        if (v.paused) { v.play(); } else { v.pause(); }
        sync();
      });
      v.addEventListener("click", function () {
        if (v.paused) { v.play(); } else { v.pause(); }
        sync();
      });
      v.addEventListener("play", sync);
      v.addEventListener("pause", sync);
      v.addEventListener("ended", sync);
      v.addEventListener("play", function () {
        document.querySelectorAll("video").forEach(function (o) { if (o !== v) o.pause(); });
      });
    });
  }

  /* ---------- 9. Démarrage ---------- */
  function boot() {
    initMode();
    initLang();
    wireToggles();
    wireDrawer();
    wireScroll();
    wireReveal();
    wireLightbox();
    wireVideos();
    document.querySelectorAll("[data-year]").forEach(function (el) {
      el.textContent = String(new Date().getFullYear());
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
