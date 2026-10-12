# Holdings

| Folder | What it is |
| --- | --- |
| [`green-home-store/`](green-home-store) | **Green Home Store**: the WooCommerce theme for [greenhomesystems.co.za](https://greenhomesystems.co.za/). Zip: [`dist/green-home-store.zip`](dist/green-home-store.zip) |
| [`pixelport/`](pixelport) | **PixelPort**: dark gaming WooCommerce theme. Zip: [`dist/pixelport.zip`](dist/pixelport.zip) |
| `index.html`, `games.html`, `arcade.html` | The original static PixelPort site |

## Green Home Store theme

A solar-energy storefront in the Green Home Systems brand (charcoal and lime,
the Green Home logo and copy). Your WooCommerce products show on the home page
(shop-by-category tiles, featured products, DEYE kit packages), in the shop and
category pages, and on product pages, which get WhatsApp and quote buttons.
Complete Kits are quote-only because they include installation; the rest of the
shop sells online, or the whole shop can be switched to "Enquire only". The
quote form saves every request under **Quote requests** in the dashboard and
emails it to you. Home page sections can be switched off, and the promo bar,
hero, stats, FAQ, testimonials, contact details and footer tagline are editable
in **Appearance → Customize → Green Home theme** (the "why us", steps and
services text is fixed in the theme).

### Go live

1. Download [`dist/green-home-store.zip`](dist/green-home-store.zip) (on
   GitHub: open it, then **Download raw file**).
2. **Appearance → Themes → Add Theme → Upload Theme** → choose the zip →
   **Install Now** → **Activate**. The old theme stays installed, so you can
   switch back at any time.
3. **Decide how you sell.** Products show "Add to cart", but customers can only
   pay if a payment method is on under **WooCommerce → Settings → Payments**
   (Direct bank transfer, PayFast, Yoco…) and a shipping method exists under
   **WooCommerce → Settings → Shipping**. To handle every sale by quote for
   now, set **Customize → Green Home theme → Shop & buying** to "Enquire
   only". The dashboard warns you while "Buy online" is on without a payment
   method.
4. **WooCommerce → Settings → Site visibility → Live → Save.** In "Coming soon"
   mode, visitors can't see any products.
5. **Settings → General:** Site Title `Green Home Systems`, a Tagline (e.g.
   `Solar kits, inverters and batteries – supplied and installed`) and Timezone
   `Johannesburg`. The title and tagline currently read "My blog – Just another
   WordPress site" in browser tabs and Google.
6. **Customize → Green Home theme → Contact details & quotes:** check the
   phone, WhatsApp number, WhatsApp opening message and email address. Quote
   requests are emailed there. The old site showed
   `info@greenihomesystems.co.za`, a misspelt domain that cannot receive mail;
   the theme defaults to `info@greenhomesystems.co.za`, so confirm that mailbox
   exists.
7. **Customize → Site Identity → Site Icon:** a square crop of the logo.
8. Recommended: unzip the download, then **Products → All Products → Import**
   (button at the top) → `green-home-store/sample-data/complete-kits.csv` →
   **Continue → Run the importer**. This adds the five DEYE kits as products in
   a "Complete Kits" category; the home page kit section then shows them with
   live prices. Check the "12KWH DEYE Kit – Premium Solution" first: it lists a
   16 kW inverter, as the old site did.
   Then run **WooCommerce → Status → Tools → Regenerate shop thumbnails** once,
   so existing product photos are rebuilt uncropped (WooCommerce also queues
   this itself after activation).
9. Send a test quote from the home page and check it arrives. If the email
   doesn't arrive, the request is still saved; install an SMTP plugin such as
   WP Mail SMTP. The dashboard also shows a warning if quote emails fail.
10. Optional: an SEO plugin (Yoast, Rank Math, SEOPress); delete the leftover
    "Sample Page"; publish a Privacy Policy page (**Settings → Privacy**).
11. Old home-page content not carried over, for you to confirm or drop: the
    trust strip (NRS 097-2-1 / PV GreenCard / "4.9 from 312+ Google Reviews" /
    15-year warranty), the "Why Solar + Battery Wins" table, "Why Go Solar?"
    benefits, the load-shedding stage selector, the savings calculator, the
    before/after bill box, the "Special Offer R5,000" box and social icons.
    Deliberate changes: the third kit is now "12KWH DEYE Kit – Family
    Solution" and inverter sizes read kW instead of KWH.

The quote form can also go on any page with the `[ghstore_quote_form]`
shortcode. To mark a kit "Most popular", give it the product tag `popular`.
Quote requests are visible to Administrators, Editors and Shop managers only.
Behind Cloudflare or a load balancer, add
`define( 'GHSTORE_TRUST_PROXY_HEADERS', true );` to `wp-config.php` so the
quote spam limit sees real visitor addresses.

### Structure

```
green-home-store/
  style.css                  theme header + layout, home sections, footer
  functions.php              theme supports, scripts, image loading
  inc/woocommerce.php        product cards, shop toolbar, header cart, quote-only products, enquiry box, home product sections
  inc/quote-requests.php     quote form, saving to "Quote requests", email, rate limit
  inc/customizer.php         Customizer settings
  inc/template-tags.php      logo, menu fallback, WhatsApp / phone / quote links, meta tags
  inc/icons.php              inline SVG icons
  front-page.php             home page (sections in template-parts/home/)
  assets/css/woocommerce.css shop, product, cart and checkout styling
  assets/js/theme.js         menu, submenus, ticker pause, form marker
  sample-data/complete-kits.csv
```

Rebuild the zip after changes:

```sh
rm -f dist/green-home-store.zip && zip -rq dist/green-home-store.zip green-home-store -x '*.DS_Store'
```

## PixelPort WordPress theme

### Install

1. Download [`dist/pixelport.zip`](dist/pixelport.zip) (on GitHub: open it,
   then click **Download raw file**).
2. In WordPress: **Appearance → Themes → Add New Theme → Upload Theme**, choose
   the zip, then **Install** and **Activate**.
3. Install and activate **WooCommerce** (**Plugins → Add New Plugin**) and run
   its setup.
4. **Make the store visible.** New WooCommerce stores start in "Coming soon"
   mode, which hides the shop and products from visitors (you still see them
   while logged in). Go to **WooCommerce → Settings → Site visibility**, pick
   **Live**, and save.

### Add products

- **Your own:** **Products → Add New Product**. Set a price, a product image,
  a category and a short description; those all appear on the card. Click the
  ☆ in the Products list to feature a product on the home page.
- **The eight demo games:** **Products → Import**, choose
  `pixelport/sample-data/pixelport-products.csv` (it's also inside the zip),
  then **Continue → Run the importer**.

Products without a photo get the PixelPort gradient-and-initials artwork. Pick
its colour per product under **Product data → General → Card colour**.

### Set up the rest

| What | Where |
| --- | --- |
| Arcade page | **Pages → Add New Page**, title "Arcade", **Template → Arcade (Neon Snake)** |
| Header / footer menu | **Appearance → Menus** → assign to "Header menu" / "Footer menu" (until then the header shows Home, Shop, Arcade) |
| Hero text, buttons, stats | **Appearance → Customize → PixelPort theme → Home: hero** |
| Which products the home page shows | **… → Home: products & news** (featured, top rated, best selling, on sale or newest; falls back to newest if empty) |
| Accent colours | **Appearance → Customize → Colors** |
| Logo | **Appearance → Customize → Site Identity** |
| Footer note | **… → PixelPort theme → Footer** |

Requires WordPress 6.4+ and PHP 7.4+. Tested on WordPress 7.1 with
WooCommerce 11.2. Without WooCommerce the theme still works as a blog + arcade.

### Theme structure

```
pixelport/
  style.css                 theme header + base styles (colours, layout, posts, arcade)
  functions.php             theme supports, menus, scripts
  inc/woocommerce.php       product cards, shop toolbar, header cart, home grid, card colour field
  inc/customizer.php        Customizer settings
  inc/template-tags.php     logo/brand, menu fallback, gradient artwork, post meta
  front-page.php            hero → products → page content → latest posts
  index.php / singular.php  blog, archives, search / posts and pages (incl. cart, checkout)
  page-templates/arcade.php Neon Snake
  assets/css/woocommerce.css  dark styling for WooCommerce pages and blocks
  assets/js/                nav toggle, snake game
  sample-data/              demo products CSV
```

### Rebuilding the zip

After changing the theme, rebuild the upload zip from the repository root:

```sh
rm -f dist/pixelport.zip && zip -rq dist/pixelport.zip pixelport -x '*.DS_Store'
```

## Static site

| Page | What's there |
| --- | --- |
| `index.html` | Hero, top-rated titles, news feed |
| `games.html` | Full library with search, genre/platform filters and sorting |
| `arcade.html` | Neon Snake, playable with keyboard or touch |

Open `index.html` in a browser, or serve the folder with
`npx http-server . -p 8080` and visit http://localhost:8080.

To add a game, append an entry to `window.GAMES` in `assets/js/games.js`.
`accent` drives the card artwork gradient; `rating` is a number out of 10.

All titles, scores and news items are fictional demo content.
