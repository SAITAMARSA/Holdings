# Green Home Systems — website

A static marketing and catalogue site for [Green Home Systems](https://greenhomesystems.co.za)
(solar, battery backup and hybrid inverter installations, Johannesburg).
Plain HTML, CSS and vanilla JavaScript — no build step, no dependencies.

## Pages

| Page | What's there |
| --- | --- |
| `index.html` | Hero, category tiles, featured products, why solar, process, testimonials, FAQ |
| `products.html` | Full catalogue with search, category/brand filters and price sorting |
| `contact.html` | Quote request form (opens the visitor's mail client) and contact details |

## Running it

Open `index.html` in a browser, or serve the folder:

```sh
npx http-server . -p 8080
```

## Structure

```
index.html  products.html  contact.html
assets/css/style.css     theme tokens, layout, components, responsive rules
assets/js/catalog.js     the product catalogue (plain script so file:// works)
assets/js/app.js         nav, card rendering, filtering, quote form
```

## The catalogue

`assets/js/catalog.js` holds 106 products scraped from the live WooCommerce store,
each with `name`, `category`, `brand`, `spec`, `price` (ZAR, excl. VAT), `blurb`,
`image` and `link` back to the product page on greenhomesystems.co.za.

To refresh it, re-read `https://greenhomesystems.co.za/wp-json/wc/store/v1/products`
and rewrite the `window.PRODUCTS` array in the same shape.

Product images are stored locally in `assets/img/` (downscaled to 900px), so the
site works offline and does not depend on the live store staying up. Each entry
also keeps the original URL in `imageRemote`: if a local file is missing the card
retries the live store, and falls back to a category icon only if that fails too.

Stock flags (`inStock`, shown as the "On order" badge) come from the store's own
WooCommerce stock status.

Prices come from the live store as of the scrape date. Testimonials and the FAQ copy are
placeholder marketing text and should be reviewed before this goes live.
