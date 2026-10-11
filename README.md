# PixelPort

A gaming website in two forms:

- **`pixelport/`: a WordPress theme with WooCommerce support.** Your products
  show as PixelPort cards on the home page, the shop, category pages and
  related products, with a header cart, dark-styled cart, checkout and account
  pages, and the Neon Snake arcade as a page template.
- **The original static site** (`index.html`, `games.html`, `arcade.html`):
  plain HTML/CSS/JS, no build step.

## WordPress theme

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
