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
  var products = window.SOLAR_PRODUCTS || [];

  function money(value) {
    return "$" + value.toLocaleString("en-US");
  }

  function initials(name) {
    return name
      .split(/\s+/)
      .slice(0, 2)
      .map(function (w) { return w[0]; })
      .join("")
      .toUpperCase();
  }

  function cardFor(product) {
    var card = document.createElement("article");
    card.className = "card";

    var art = document.createElement("div");
    art.className = "card-art";
    art.style.background =
      "linear-gradient(135deg, " + product.accent + ", rgba(11,16,24,0.9))";
    art.textContent = initials(product.name);
    card.appendChild(art);

    var body = document.createElement("div");
    body.className = "card-body";

    var h3 = document.createElement("h3");
    h3.textContent = product.name;
    body.appendChild(h3);

    var meta = document.createElement("div");
    meta.className = "card-meta";
    meta.appendChild(document.createTextNode(product.category + " · " + product.brand));
    var price = document.createElement("span");
    price.className = "price";
    price.textContent = money(product.price);
    meta.appendChild(price);
    body.appendChild(meta);

    var p = document.createElement("p");
    p.textContent = product.blurb;
    body.appendChild(p);

    var specs = document.createElement("dl");
    specs.className = "spec-list";
    Object.keys(product.specs).forEach(function (label) {
      var dt = document.createElement("dt");
      dt.textContent = label;
      var dd = document.createElement("dd");
      dd.textContent = product.specs[label];
      specs.appendChild(dt);
      specs.appendChild(dd);
    });
    var warrantyDt = document.createElement("dt");
    warrantyDt.textContent = "Warranty";
    var warrantyDd = document.createElement("dd");
    warrantyDd.textContent = product.warranty + " years";
    specs.appendChild(warrantyDt);
    specs.appendChild(warrantyDd);
    body.appendChild(specs);

    var chips = document.createElement("div");
    chips.className = "chips";
    product.tags.forEach(function (label) {
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
      empty.textContent = "Nothing matches those filters. Try a broader search.";
      target.appendChild(empty);
      return;
    }
    list.forEach(function (product) { target.appendChild(cardFor(product)); });
  }

  /* ---------- home: a representative starter system ---------- */
  var featured = document.getElementById("featured-grid");
  if (featured) {
    var picks = ["helion-h440", "meridian-hybrid-6", "voltbank-13"];
    render(featured, picks.map(function (id) {
      return products.filter(function (p) { return p.id === id; })[0];
    }).filter(Boolean));
  }

  /* ---------- catalog page ---------- */
  var catalogGrid = document.getElementById("catalog-grid");
  if (catalogGrid) {
    var search = document.getElementById("f-search");
    var category = document.getElementById("f-category");
    var brand = document.getElementById("f-brand");
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

    fill(category, Array.from(new Set(products.map(function (p) { return p.category; }))));
    fill(brand, Array.from(new Set(products.map(function (p) { return p.brand; }))));

    function apply() {
      var q = search.value.trim().toLowerCase();
      var list = products.filter(function (p) {
        if (category.value && p.category !== category.value) return false;
        if (brand.value && p.brand !== brand.value) return false;
        if (!q) return true;
        var haystack = [p.name, p.blurb, p.tags.join(" "), p.brand, p.category]
          .concat(Object.keys(p.specs).map(function (k) { return p.specs[k]; }))
          .join(" ")
          .toLowerCase();
        return haystack.indexOf(q) !== -1;
      });

      list.sort(function (a, b) {
        if (sort.value === "price-desc") return b.price - a.price;
        if (sort.value === "warranty") return b.warranty - a.warranty;
        if (sort.value === "name") return a.name.localeCompare(b.name);
        return a.price - b.price;
      });

      count.textContent = list.length + (list.length === 1 ? " product" : " products");
      render(catalogGrid, list);
    }

    [search, category, brand, sort].forEach(function (el) {
      el.addEventListener("input", apply);
    });
    apply();
  }

  /* ---------- footer year ---------- */
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();
