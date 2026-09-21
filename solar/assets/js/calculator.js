/* Savings estimator: sizes a system from a power bill, then projects 25 years of
   cumulative spend with and without it. Every assumption is listed on the page —
   see the "How this is calculated" panel in calculator.html. */
(function () {
  "use strict";

  var form = document.getElementById("calc-form");
  if (!form) return;

  /* ---------- model constants ---------- */
  var COST_PER_WATT = 2.8;   // installed, before incentives
  var TAX_CREDIT = 0.3;      // federal residential clean energy credit
  var BASE_PERF_RATIO = 0.8; // inverter, temperature, soiling and wiring losses
  var RATE_ESCALATION = 0.035;
  var DEGRADATION = 0.005;   // panel output lost per year
  var PANEL_KW = 0.44;       // one Helion H440
  var HORIZON = 25;

  /* ---------- formatting ---------- */
  function money(value) {
    return "$" + Math.round(value).toLocaleString("en-US");
  }

  function moneyCompact(value) {
    if (Math.abs(value) >= 1000) return "$" + Math.round(value / 1000) + "k";
    return "$" + Math.round(value);
  }

  /* ---------- the model ---------- */
  function project(input) {
    var annualBill = input.monthlyBill * 12;
    var usage = annualBill / input.rate;                 // kWh per year
    var perfRatio = BASE_PERF_RATIO * input.exposure;
    var yieldPerKw = 365 * input.sunHours * perfRatio;   // kWh per kW per year

    // Size to the bill, but never past what the roof holds.
    var sizeForBill = usage / yieldPerKw;
    var sizeForRoof = input.maxPanels * PANEL_KW;
    var systemKw = Math.max(2, Math.min(sizeForBill, sizeForRoof));
    systemKw = Math.round(systemKw * 10) / 10;
    var panels = Math.ceil(systemKw / PANEL_KW);
    var roofLimited = sizeForBill > sizeForRoof + 0.05;

    var grossCost = systemKw * 1000 * COST_PER_WATT;
    var credit = grossCost * TAX_CREDIT;
    var netCost = grossCost - credit;
    var firstYearProduction = systemKw * yieldPerKw;
    var offset = Math.min(1, firstYearProduction / usage);

    // Year 0 is the day of install: nothing spent on the grid yet, the system
    // already paid for.
    var years = [{ year: 0, gridOnly: 0, withSolar: netCost }];
    var cumGridOnly = 0;
    var cumWithSolar = netCost;

    for (var y = 1; y <= HORIZON; y++) {
      var rate = input.rate * Math.pow(1 + RATE_ESCALATION, y - 1);
      var production = firstYearProduction * Math.pow(1 - DEGRADATION, y - 1);
      cumGridOnly += usage * rate;
      cumWithSolar += Math.max(0, usage - production) * rate;
      years.push({ year: y, gridOnly: cumGridOnly, withSolar: cumWithSolar });
    }

    // Payback: where the two cumulative curves cross, interpolated inside the year.
    var payback = null;
    for (var i = 1; i < years.length; i++) {
      if (years[i].withSolar <= years[i].gridOnly) {
        var prev = years[i - 1];
        var curr = years[i];
        var gapBefore = prev.withSolar - prev.gridOnly;
        var gapAfter = curr.withSolar - curr.gridOnly;
        var t = gapBefore === gapAfter ? 0 : gapBefore / (gapBefore - gapAfter);
        payback = prev.year + t;
        break;
      }
    }

    var last = years[years.length - 1];
    return {
      usage: usage,
      systemKw: systemKw,
      panels: panels,
      roofLimited: roofLimited,
      grossCost: grossCost,
      netCost: netCost,
      credit: credit,
      firstYearProduction: firstYearProduction,
      offset: offset,
      payback: payback,
      lifetimeSavings: last.gridOnly - last.withSolar,
      years: years
    };
  }

  /* ---------- svg helpers ---------- */
  var NS = "http://www.w3.org/2000/svg";

  function svgEl(name, attrs, text) {
    var node = document.createElementNS(NS, name);
    Object.keys(attrs || {}).forEach(function (key) {
      node.setAttribute(key, attrs[key]);
    });
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function niceStep(rough) {
    var power = Math.pow(10, Math.floor(Math.log(rough) / Math.LN10));
    var scaled = rough / power;
    var step = scaled <= 1 ? 1 : scaled <= 2 ? 2 : scaled <= 2.5 ? 2.5 : scaled <= 5 ? 5 : 10;
    return step * power;
  }

  /* ---------- chart ---------- */
  /* The viewBox is chosen per breakpoint rather than scaled down: shrinking the
     wide chart into a phone renders 11px type at about 4px. The narrow board
     trades the right-hand margin (and with it the direct end labels, which the
     legend and tooltip still carry) for legible text. */
  var W, H, M, plotW, plotH;

  function pickDims() {
    var narrow = window.innerWidth < 640;
    W = narrow ? 340 : 760;
    H = narrow ? 300 : 330;
    M = narrow
      ? { top: 16, right: 16, bottom: 36, left: 48 }
      : { top: 18, right: 104, bottom: 38, left: 62 };
    plotW = W - M.left - M.right;
    plotH = H - M.top - M.bottom;
    return narrow;
  }

  var figure = document.getElementById("chart-figure");
  var tip = document.getElementById("chart-tip");
  var announcer = document.getElementById("chart-announce");
  var chart = null; // live scales + nodes, rebuilt on each draw

  function drawChart(model) {
    var narrow = pickDims();
    var years = model.years;
    var max = years[years.length - 1].gridOnly;
    var step = niceStep(max / 4);
    var top = Math.ceil(max / step) * step;

    function x(year) { return M.left + (year / HORIZON) * plotW; }
    function y(value) { return M.top + plotH - (value / top) * plotH; }

    var svg = svgEl("svg", {
      viewBox: "0 0 " + W + " " + H,
      role: "img",
      tabindex: "0",
      "aria-label":
        "Cumulative energy spend over " + HORIZON + " years. Staying on the grid reaches " +
        money(years[HORIZON].gridOnly) + "; the solar system totals " +
        money(years[HORIZON].withSolar) + " including its up-front cost." +
        (model.payback ? " The two cross at year " + model.payback.toFixed(1) + "." : ""),
      "aria-describedby": "chart-announce"
    });

    /* gridlines + y ticks */
    for (var v = 0; v <= top + 1; v += step) {
      svg.appendChild(svgEl("line", {
        class: "grid-line", x1: M.left, x2: M.left + plotW, y1: y(v), y2: y(v)
      }));
      svg.appendChild(svgEl("text", {
        class: "tick-text", x: M.left - 10, y: y(v) + 4, "text-anchor": "end"
      }, moneyCompact(v)));
    }

    /* x ticks */
    [0, 5, 10, 15, 20, 25].forEach(function (year) {
      svg.appendChild(svgEl("text", {
        class: "tick-text", x: x(year), y: M.top + plotH + 20, "text-anchor": "middle"
      }, String(year)));
    });
    svg.appendChild(svgEl("text", {
      class: "axis-title", x: M.left + plotW / 2, y: H - 4, "text-anchor": "middle"
    }, "Years after install"));

    /* series */
    function path(key) {
      return years.map(function (point, i) {
        return (i ? "L" : "M") + x(point.year).toFixed(2) + " " + y(point[key]).toFixed(2);
      }).join(" ");
    }

    svg.appendChild(svgEl("path", { class: "series-line grid-only", d: path("gridOnly") }));
    svg.appendChild(svgEl("path", { class: "series-line with-solar", d: path("withSolar") }));

    /* break-even annotation */
    if (model.payback) {
      var bx = x(model.payback);
      var lo = Math.floor(model.payback);
      var hi = Math.min(HORIZON, lo + 1);
      var t = model.payback - lo;
      var by = y(years[lo].gridOnly + (years[hi].gridOnly - years[lo].gridOnly) * t);
      svg.appendChild(svgEl("line", {
        class: "breakeven-line", x1: bx, x2: bx, y1: M.top, y2: M.top + plotH
      }));
      svg.appendChild(svgEl("circle", { class: "breakeven-dot", cx: bx, cy: by, r: 4.5 }));
      var anchor = model.payback > HORIZON * 0.7 ? "end" : "start";
      svg.appendChild(svgEl("text", {
        class: "breakeven-label",
        x: bx + (anchor === "end" ? -8 : 8),
        y: M.top + 12,
        "text-anchor": anchor
      }, "Breaks even · yr " + model.payback.toFixed(1)));
    }

    /* end markers + direct labels (text in text tokens, identity from the dot) */
    var endYear = years[HORIZON];
    [
      { key: "gridOnly", cls: "grid-only", label: "Grid only" },
      { key: "withSolar", cls: "with-solar", label: "With solar" }
    ].forEach(function (series) {
      var ey = y(endYear[series.key]);
      svg.appendChild(svgEl("circle", {
        class: "end-dot " + series.cls, cx: x(HORIZON), cy: ey, r: 4.5
      }));
      if (narrow) return;
      svg.appendChild(svgEl("text", {
        class: "end-label", x: x(HORIZON) + 12, y: ey - 2
      }, series.label));
      svg.appendChild(svgEl("text", {
        class: "end-sub", x: x(HORIZON) + 12, y: ey + 13
      }, money(endYear[series.key])));
    });

    /* hover layer */
    var crosshair = svgEl("line", {
      class: "crosshair", y1: M.top, y2: M.top + plotH, x1: M.left, x2: M.left
    });
    svg.appendChild(crosshair);

    var focusDots = ["gridOnly", "withSolar"].map(function (key) {
      var cls = key === "gridOnly" ? "grid-only" : "with-solar";
      var dot = svgEl("circle", { class: "focus-dot end-dot " + cls, r: 4.5, cx: M.left, cy: M.top });
      svg.appendChild(dot);
      return { key: key, node: dot };
    });

    svg.appendChild(svgEl("rect", {
      class: "hit-layer", x: M.left, y: M.top, width: plotW, height: plotH,
      fill: "transparent", "pointer-events": "all"
    }));

    figure.insertBefore(svg, tip);
    chart = { svg: svg, x: x, y: y, crosshair: crosshair, focusDots: focusDots, years: years };
    return chart;
  }

  /* ---------- crosshair + tooltip ---------- */
  var SERIES_META = {
    gridOnly: { name: "Grid only", varName: "--series-grid" },
    withSolar: { name: "With solar", varName: "--series-solar" }
  };

  var activeYear = null;

  function showAt(year) {
    if (!chart) return;
    year = Math.max(0, Math.min(HORIZON, Math.round(year)));
    activeYear = year;
    var point = chart.years[year];

    chart.crosshair.setAttribute("x1", chart.x(year));
    chart.crosshair.setAttribute("x2", chart.x(year));
    chart.crosshair.setAttribute("data-open", "true");
    chart.focusDots.forEach(function (dot) {
      dot.node.setAttribute("cx", chart.x(year));
      dot.node.setAttribute("cy", chart.y(point[dot.key]));
      dot.node.setAttribute("data-open", "true");
    });

    /* tooltip body — labels via textContent, never innerHTML */
    tip.innerHTML = "";
    var head = document.createElement("div");
    head.className = "tip-head";
    head.textContent = year === 0 ? "Day one" : "Year " + year;
    tip.appendChild(head);

    ["gridOnly", "withSolar"].forEach(function (key) {
      var row = document.createElement("div");
      row.className = "tip-row";
      var swatch = document.createElement("span");
      swatch.className = "legend-key";
      swatch.style.background = "var(" + SERIES_META[key].varName + ")";
      var name = document.createElement("span");
      name.className = "tip-name";
      name.textContent = SERIES_META[key].name;
      var value = document.createElement("b");
      value.textContent = money(point[key]);
      row.appendChild(swatch);
      row.appendChild(name);
      row.appendChild(value);
      tip.appendChild(row);
    });

    tip.setAttribute("data-open", "true");

    var svgRect = chart.svg.getBoundingClientRect();
    var figRect = figure.getBoundingClientRect();
    var scale = svgRect.width / W;
    var left = (svgRect.left - figRect.left) + chart.x(year) * scale + 14;
    if (left + tip.offsetWidth > figRect.width) {
      left = (svgRect.left - figRect.left) + chart.x(year) * scale - tip.offsetWidth - 14;
    }

    // Track the lower line, but never spill past the plot onto the axis labels.
    var svgTop = svgRect.top - figRect.top;
    var plotTop = svgTop + M.top * scale;
    var plotBottom = svgTop + (M.top + plotH) * scale;
    var topPx = svgTop + chart.y(point.withSolar) * scale - 10;
    topPx = Math.min(Math.max(topPx, plotTop), plotBottom - tip.offsetHeight);

    tip.style.left = Math.max(0, left) + "px";
    tip.style.top = Math.max(0, topPx) + "px";

    announcer.textContent =
      (year === 0 ? "Day one" : "Year " + year) +
      ": grid only " + money(point.gridOnly) +
      ", with solar " + money(point.withSolar) + ".";
  }

  function hide() {
    activeYear = null;
    if (!chart) return;
    chart.crosshair.removeAttribute("data-open");
    chart.focusDots.forEach(function (dot) { dot.node.removeAttribute("data-open"); });
    tip.removeAttribute("data-open");
  }

  figure.addEventListener("pointermove", function (event) {
    if (!chart) return;
    var rect = chart.svg.getBoundingClientRect();
    var localX = ((event.clientX - rect.left) / rect.width) * W;
    if (localX < M.left - 12 || localX > M.left + plotW + 12) return hide();
    showAt(((localX - M.left) / plotW) * HORIZON);
  });

  figure.addEventListener("pointerleave", hide);

  figure.addEventListener("focusout", function (event) {
    if (!figure.contains(event.relatedTarget)) hide();
  });

  figure.addEventListener("keydown", function (event) {
    var delta = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
    if (!delta) return;
    event.preventDefault();
    showAt(activeYear === null ? (delta > 0 ? 0 : HORIZON) : activeYear + delta);
  });

  /* ---------- table view ---------- */
  function drawTable(model) {
    var body = document.getElementById("data-body");
    body.innerHTML = "";
    model.years.forEach(function (point) {
      var row = document.createElement("tr");
      [
        point.year === 0 ? "Day one" : "Year " + point.year,
        money(point.gridOnly),
        money(point.withSolar),
        money(point.gridOnly - point.withSolar)
      ].forEach(function (cellText, i) {
        var cell = document.createElement(i === 0 ? "th" : "td");
        if (i === 0) cell.setAttribute("scope", "row");
        cell.textContent = cellText;
        row.appendChild(cell);
      });
      body.appendChild(row);
    });
  }

  /* ---------- tiles ---------- */
  function setTile(id, value, sub) {
    document.querySelector('[data-tile="' + id + '"] .tile-value').textContent = value;
    document.querySelector('[data-tile="' + id + '"] .tile-sub').textContent = sub;
  }

  function drawTiles(model) {
    setTile("system", model.systemKw.toFixed(1) + " kW",
      model.panels + " × 440 W panels" + (model.roofLimited ? " — roof-limited" : ""));
    setTile("offset", Math.round(model.offset * 100) + "%",
      "of " + Math.round(model.usage).toLocaleString("en-US") + " kWh used a year");
    setTile("cost", money(model.netCost),
      money(model.grossCost) + " before the " + Math.round(TAX_CREDIT * 100) + "% credit");
    setTile("payback", model.payback ? model.payback.toFixed(1) + " yrs" : "—",
      model.payback ? "until solar overtakes the grid" : "no break-even within " + HORIZON + " years");
    setTile("savings", money(model.lifetimeSavings), "net, after " + HORIZON + " years");
  }

  /* ---------- wire up ---------- */
  function readInput() {
    var exposure = form.elements.exposure;
    var region = form.elements.region;
    var roof = form.elements.roof;
    return {
      monthlyBill: Number(form.elements.bill.value),
      rate: Number(form.elements.rate.value),
      sunHours: Number(region.options[region.selectedIndex].dataset.sun),
      exposure: Number(exposure.options[exposure.selectedIndex].dataset.factor),
      maxPanels: Number(roof.options[roof.selectedIndex].dataset.panels)
    };
  }

  function update() {
    document.getElementById("bill-value").textContent =
      "$" + form.elements.bill.value + "/mo";

    var model = project(readInput());
    drawTiles(model);
    drawTable(model);

    var old = figure.querySelector("svg");
    if (old) old.remove();
    hide();
    drawChart(model);
  }

  form.addEventListener("input", update);
  form.addEventListener("submit", function (event) { event.preventDefault(); });
  var resizeTimer = null;
  window.addEventListener("resize", function () {
    hide();
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(update, 150);
  });
  update();
})();
