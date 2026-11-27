(function () {
  // Theme toggle (remembers choice when storage is available)
  var root = document.documentElement;
  var toggle = document.getElementById("theme-toggle");
  if (toggle) {
    toggle.addEventListener("click", function () {
      var current = root.getAttribute("data-theme") ||
        (window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");
      var next = current === "light" ? "dark" : "light";
      root.setAttribute("data-theme", next);
      try { localStorage.setItem("theme", next); } catch (e) {}
    });
  }

  // Footer year
  var year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();

  // Reveal on scroll
  var reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
      });
    }, { threshold: 0.12 });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("in"); });
  }

  // Lazy-load the large NeRF GIF only when it scrolls near view
  var gifs = document.querySelectorAll("img.lazy-gif");
  if ("IntersectionObserver" in window) {
    var gio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.src = e.target.dataset.src; gio.unobserve(e.target); }
      });
    }, { rootMargin: "300px" });
    gifs.forEach(function (g) { gio.observe(g); });
  } else {
    gifs.forEach(function (g) { g.src = g.dataset.src; });
  }

  // Project filters
  var chips = document.querySelectorAll(".chip[data-filter]");
  var cards = document.querySelectorAll("#project-grid .card");
  chips.forEach(function (chip) {
    chip.addEventListener("click", function () {
      chips.forEach(function (c) { c.classList.remove("active"); });
      chip.classList.add("active");
      var f = chip.dataset.filter;
      cards.forEach(function (card) {
        var cats = (card.dataset.cat || "").split(" ");
        card.classList.toggle("hidden", f !== "all" && cats.indexOf(f) === -1);
        if (f === "all" || cats.indexOf(f) !== -1) card.classList.add("in");
      });
    });
  });

  // Email link assembled at runtime to keep the address away from scrapers
  var emailBtn = document.getElementById("email-btn");
  if (emailBtn) {
    var addr = emailBtn.dataset.u + "@" + emailBtn.dataset.d;
    emailBtn.href = "mailto:" + addr;
    emailBtn.title = addr;
  }

  // Typing effect in the hero
  var typed = document.getElementById("typed");
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (typed && !reduce) {
    var words = [
      "in-cabin occupant monitoring",
      "LiDAR 3D object detection",
      "pruning & quantization for the edge",
      "real-time inference on Jetson & embedded",
      "explainable AI with Grad-CAM"
    ];
    var w = 0, i = words[0].length, deleting = false;
    (function tick() {
      var word = words[w];
      typed.textContent = word.slice(0, i);
      var delay = deleting ? 35 : 70;
      if (!deleting && i === word.length) { deleting = true; delay = 1800; }
      else if (deleting && i === 0) { deleting = false; w = (w + 1) % words.length; word = words[w]; delay = 300; }
      i += deleting ? -1 : 1;
      if (i > words[w].length) i = words[w].length;
      if (i < 0) i = 0;
      setTimeout(tick, delay);
    })();
  }
})();
