# Helios Solar

A home-solar company site: an equipment catalog with live filtering and a savings
estimator that sizes a system from your power bill and projects 25 years of
cumulative spend. Static HTML, CSS and vanilla JavaScript — no build step, no
dependencies.

## Pages

| Page | What's there |
| --- | --- |
| `index.html` | Hero, install process, benefits, a starter system, testimonials |
| `systems.html` | Equipment catalog with search, category/brand filters and sorting |
| `calculator.html` | Savings estimator — five inputs, five result tiles, a 25-year chart |

## Running it

Open `index.html` directly in a browser, or serve the folder:

```sh
npx http-server . -p 8080
```

Then visit http://localhost:8080.

## Structure

```
index.html  systems.html  calculator.html
assets/css/style.css      theme tokens, layout, components, chart marks, responsive rules
assets/js/products.js     the equipment catalog (plain script so file:// works)
assets/js/app.js          nav, card rendering, catalog filtering
assets/js/calculator.js   the savings model, the SVG chart and its hover layer
```

## The estimator

`calculator.js` sizes the array to cover annual usage, caps it at what the roof
holds, applies the 30% federal credit, then walks 25 years with rates rising 3.5%
a year and panel output falling 0.5%. Payback is where the two cumulative curves
cross, interpolated inside the year. Every assumption is listed on the page under
"How this is calculated" — the model is deliberately conservative (no export
credit, no state incentives, no finance costs) and is demo maths, not a quote.

## Adding a product

Append an entry to `window.SOLAR_PRODUCTS` in `assets/js/products.js`. `accent`
drives the card artwork gradient and `specs` is a free-form object — whatever keys
you use are rendered as the spec table, so panels can list watts while batteries
list kWh. The catalog page picks up new categories and brands automatically.

## Chart colours

The two series use `#3987e5` and `#d95926`, validated against the card surface
(`#161f2d`) for colour-blind separation and contrast. The brand amber is UI-only —
it is too light to work as a data mark. If you restyle, re-validate rather than
eyeball: adjacent-pair CVD ΔE should clear 8, normal-vision ΔE 15.

All brands, prices, specs and testimonials are fictional demo content.
