/* Green Home Systems — nav, catalogue rendering, filtering and the quote form. */
(function () {
  'use strict';

  var PRODUCTS = window.PRODUCTS || [];
  var CATEGORY_ICON = {
    'Inverters': '⚡',
    'Lithium Batteries': '🔋',
    'Solar Panels': '🌞',
    'Accessories': '🔌'
  };

  function rands(value) {
    return 'R' + Math.round(value).toLocaleString('en-ZA');
  }

  function el(html) {
    var t = document.createElement('template');
    t.innerHTML = html.trim();
    return t.content.firstElementChild;
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  /* ---------- navigation ---------- */
  function initNav() {
    var toggle = document.querySelector('.nav-toggle');
    var links = document.querySelector('.nav-links');
    if (!toggle || !links) return;
    toggle.addEventListener('click', function () {
      var open = links.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(open));
    });
  }

  /* ---------- product card ---------- */
  function card(p) {
    var icon = CATEGORY_ICON[p.category] || '🔆';
    var node = el(
      '<article class="product">' +
        '<div class="product-media">' +
          (p.inStock
            ? (p.spec ? '<span class="badge">' + escapeHtml(p.spec) + '</span>' : '')
            : '<span class="badge out">On order</span>') +
          (p.image
            ? '<img loading="lazy" alt="' + escapeHtml(p.name) + '" src="' + escapeHtml(p.image) + '">'
            : '<div class="fallback">' + icon + '</div>') +
        '</div>' +
        '<div class="product-body">' +
          '<span class="product-brand">' + escapeHtml(p.brand === 'Other' ? p.category : p.brand) + '</span>' +
          '<h3>' + escapeHtml(p.name) + '</h3>' +
          '<p class="blurb">' + escapeHtml(p.blurb ? p.blurb.slice(0, 120) + (p.blurb.length > 120 ? '…' : '') : p.category) + '</p>' +
          '<div class="product-foot">' +
            '<span class="price">' + rands(p.price) + '<small>excl. VAT</small></span>' +
            '<a class="link-more" href="' + escapeHtml(p.link) + '" target="_blank" rel="noopener">Details →</a>' +
          '</div>' +
        '</div>' +
      '</article>'
    );
    var img = node.querySelector('img');
    if (img) {
      img.addEventListener('error', function () {
        img.replaceWith(el('<div class="fallback">' + icon + '</div>'));
      });
    }
    return node;
  }

  function renderInto(target, list) {
    target.textContent = '';
    list.forEach(function (p) { target.appendChild(card(p)); });
  }

  /* ---------- home page ---------- */
  function initHome() {
    var featured = document.getElementById('featured-grid');
    if (featured) {
      // Residential sizes we fit most often, not simply the priciest units.
      var wanted = [
        'deye-8kw-hybrid-48v-inverter',
        'deye-10-6kwh-lithium-battery',
        '550w-ja-bifacial-solar-panel',
        '10kva-sunsynk-single-phase-hybrid-inverter'
      ];
      var picks = wanted.map(function (slug) {
        return PRODUCTS.filter(function (p) { return p.slug === slug; })[0];
      }).filter(Boolean);
      while (picks.length < 4 && picks.length < PRODUCTS.length) {
        PRODUCTS.some(function (p) {
          if (picks.indexOf(p) !== -1) return false;
          picks.push(p);
          return true;
        });
      }
      renderInto(featured, picks);
    }

    var tiles = document.getElementById('category-tiles');
    if (tiles) {
      Object.keys(CATEGORY_ICON).forEach(function (name) {
        var list = PRODUCTS.filter(function (p) { return p.category === name; });
        if (!list.length) return;
        var from = Math.min.apply(null, list.map(function (p) { return p.price; }));
        tiles.appendChild(el(
          '<a class="cat-tile" href="products.html?category=' + encodeURIComponent(name) + '">' +
            '<div class="icon">' + CATEGORY_ICON[name] + '</div>' +
            '<h3>' + name + '</h3>' +
            '<p class="count">' + list.length + ' products listed</p>' +
            '<p class="from">From ' + rands(from) + '</p>' +
          '</a>'
        ));
      });
    }

    var count = document.getElementById('product-count');
    if (count) count.textContent = PRODUCTS.length;
  }

  /* ---------- products page ---------- */
  function initProducts() {
    var grid = document.getElementById('product-grid');
    if (!grid) return;

    var search = document.getElementById('f-search');
    var category = document.getElementById('f-category');
    var brand = document.getElementById('f-brand');
    var sort = document.getElementById('f-sort');
    var result = document.getElementById('result-line');
    var chips = document.getElementById('quick-chips');

    function fill(select, values, allLabel) {
      select.appendChild(el('<option value="">' + allLabel + '</option>'));
      values.forEach(function (v) {
        select.appendChild(el('<option value="' + escapeHtml(v) + '">' + escapeHtml(v) + '</option>'));
      });
    }

    var categories = [];
    var brands = [];
    PRODUCTS.forEach(function (p) {
      if (categories.indexOf(p.category) === -1) categories.push(p.category);
      if (p.brand !== 'Other' && brands.indexOf(p.brand) === -1) brands.push(p.brand);
    });
    categories.sort();
    brands.sort();
    fill(category, categories, 'All categories');
    fill(brand, brands, 'All brands');

    var params = new URLSearchParams(window.location.search);
    if (params.get('category')) category.value = params.get('category');
    if (params.get('q')) search.value = params.get('q');

    function apply() {
      var q = search.value.trim().toLowerCase();
      var list = PRODUCTS.filter(function (p) {
        if (category.value && p.category !== category.value) return false;
        if (brand.value && p.brand !== brand.value) return false;
        if (!q) return true;
        return (p.name + ' ' + p.brand + ' ' + p.category + ' ' + p.blurb).toLowerCase().indexOf(q) !== -1;
      });

      if (sort.value === 'price-asc') list.sort(function (a, b) { return a.price - b.price; });
      else if (sort.value === 'price-desc') list.sort(function (a, b) { return b.price - a.price; });
      else if (sort.value === 'name') list.sort(function (a, b) { return a.name.localeCompare(b.name); });

      renderInto(grid, list);
      if (!list.length) {
        grid.appendChild(el('<p class="empty">No products match that search. Try a brand name such as “Deye” or clear the filters.</p>'));
      }
      result.textContent = list.length + ' of ' + PRODUCTS.length + ' products';

      Array.prototype.forEach.call(chips ? chips.children : [], function (chip) {
        chip.setAttribute('aria-pressed', String(chip.dataset.category === category.value));
      });
    }

    if (chips) {
      categories.forEach(function (name) {
        var chip = el('<button class="chip" type="button" aria-pressed="false">' + name + '</button>');
        chip.dataset.category = name;
        chip.addEventListener('click', function () {
          category.value = category.value === name ? '' : name;
          apply();
        });
        chips.appendChild(chip);
      });
    }

    [search, category, brand, sort].forEach(function (control) {
      control.addEventListener(control === search ? 'input' : 'change', apply);
    });

    document.getElementById('f-reset').addEventListener('click', function () {
      search.value = '';
      category.value = '';
      brand.value = '';
      sort.value = 'featured';
      apply();
    });

    apply();
  }

  /* ---------- quote form ---------- */
  function initForm() {
    var form = document.getElementById('quote-form');
    if (!form) return;
    var status = document.getElementById('form-status');
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      var data = new FormData(form);
      var lines = [
        'Name: ' + data.get('name'),
        'Phone: ' + data.get('phone'),
        'Email: ' + data.get('email'),
        'Property: ' + data.get('property'),
        'Interested in: ' + data.get('interest'),
        'Monthly bill: ' + (data.get('bill') || 'not given'),
        '',
        data.get('message') || ''
      ];
      status.classList.add('show');
      status.textContent = 'Thanks ' + data.get('name') + ' — opening your email client with the enquiry. If nothing opens, call 071 395 9721.';
      window.location.href =
        'mailto:info@greenihomesystems.co.za?subject=' +
        encodeURIComponent('Solar quote request — ' + data.get('name')) +
        '&body=' + encodeURIComponent(lines.join('\n'));
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    initNav();
    initHome();
    initProducts();
    initForm();
    var year = document.getElementById('year');
    if (year) year.textContent = new Date().getFullYear();
  });
}());
