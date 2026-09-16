(function () {
  "use strict";

  /* ---------- mobile nav ---------- */
  var toggle = document.querySelector(".nav-toggle");
  var links = document.querySelector(".nav-links");
  if (toggle && links) {
    toggle.addEventListener("click", function () {
      var open = links.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(open));
    });
  }

  /* ---------- card rendering ---------- */
  var games = window.GAMES || [];

  function initials(title) {
    return title
      .split(/\s+/)
      .slice(0, 2)
      .map(function (w) { return w[0]; })
      .join("")
      .toUpperCase();
  }

  function cardFor(game) {
    var card = document.createElement("article");
    card.className = "card";

    var art = document.createElement("div");
    art.className = "card-art";
    art.style.background =
      "linear-gradient(135deg, " + game.accent + ", rgba(10,11,18,0.9))";
    art.textContent = initials(game.title);
    card.appendChild(art);

    var body = document.createElement("div");
    body.className = "card-body";

    var h3 = document.createElement("h3");
    h3.textContent = game.title;
    body.appendChild(h3);

    var meta = document.createElement("div");
    meta.className = "card-meta";
    meta.appendChild(document.createTextNode(game.genre + " · " + game.year));
    var score = document.createElement("span");
    score.className = "score";
    score.textContent = game.rating.toFixed(1);
    meta.appendChild(score);
    body.appendChild(meta);

    var p = document.createElement("p");
    p.textContent = game.blurb;
    body.appendChild(p);

    var chips = document.createElement("div");
    chips.className = "chips";
    game.platforms.concat(game.tags.slice(0, 2)).forEach(function (label) {
      var chip = document.createElement("span");
      chip.className = "chip";
      chip.textContent = label;
      chips.appendChild(chip);
    });
    body.appendChild(chips);

    card.appendChild(body);
    return card;
  }

  function render(target, list) {
    target.innerHTML = "";
    if (!list.length) {
      var empty = document.createElement("div");
      empty.className = "empty";
      empty.textContent = "No games match those filters. Try a broader search.";
      target.appendChild(empty);
      return;
    }
    list.forEach(function (game) { target.appendChild(cardFor(game)); });
  }

  /* ---------- home: featured ---------- */
  var featured = document.getElementById("featured-grid");
  if (featured) {
    var top = games.slice().sort(function (a, b) { return b.rating - a.rating; });
    render(featured, top.slice(0, 4));
  }

  /* ---------- library page ---------- */
  var libraryGrid = document.getElementById("library-grid");
  if (libraryGrid) {
    var search = document.getElementById("f-search");
    var genre = document.getElementById("f-genre");
    var platform = document.getElementById("f-platform");
    var sort = document.getElementById("f-sort");
    var count = document.getElementById("result-count");

    function fill(select, values) {
      values.sort().forEach(function (value) {
        var option = document.createElement("option");
        option.value = value;
        option.textContent = value;
        select.appendChild(option);
      });
    }

    fill(genre, Array.from(new Set(games.map(function (g) { return g.genre; }))));
    fill(platform, Array.from(new Set(games.reduce(function (acc, g) {
      return acc.concat(g.platforms);
    }, []))));

    function apply() {
      var q = search.value.trim().toLowerCase();
      var list = games.filter(function (g) {
        if (genre.value && g.genre !== genre.value) return false;
        if (platform.value && g.platforms.indexOf(platform.value) === -1) return false;
        if (!q) return true;
        return (g.title + " " + g.blurb + " " + g.tags.join(" ")).toLowerCase().indexOf(q) !== -1;
      });

      list.sort(function (a, b) {
        if (sort.value === "title") return a.title.localeCompare(b.title);
        if (sort.value === "year") return b.year - a.year;
        return b.rating - a.rating;
      });

      count.textContent = list.length + (list.length === 1 ? " title" : " titles");
      render(libraryGrid, list);
    }

    [search, genre, platform, sort].forEach(function (el) {
      el.addEventListener("input", apply);
    });
    apply();
  }

  /* ---------- footer year ---------- */
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();
