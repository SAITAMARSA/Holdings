=== Green Home Store ===
Contributors: greenhomesystems
Requires at least: 6.4
Tested up to: 7.1
Requires PHP: 7.4
Stable tag: 1.0.0
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Solar energy storefront theme for Green Home Systems, built for WooCommerce.

== Description ==

* Home page: hero, highlights strip, stats, shop-by-category tiles, featured
  products, DEYE solar kit packages, why choose us, 4-step process, services,
  testimonials, FAQ, contact details with a quote request form, and a call to
  action. Each section can be switched off in the Customizer; the promo bar,
  hero, stats, FAQ, testimonials, contact details and footer tagline are
  editable there too. The "why us", steps and services text is fixed.
* Your WooCommerce products everywhere: home page, shop, category pages,
  product pages, related products, with sale and sold-out badges.
* Product pages get a box with WhatsApp and quote buttons.
* Complete Kits are quote-only (they include installation); the rest of the
  shop sells online, or switch everything to "Enquire only" in the Customizer.
* Quote request form that saves every request under "Quote requests" in the
  dashboard and emails it to you. Spam is limited by a hidden trap field and a
  per-visitor rate limit; the dashboard warns you if emails stop going out.
* Floating WhatsApp button, header cart with live item count, promo bar.
* Footer links to your real product categories.

== Go-live checklist ==

1. Appearance → Themes → Add Theme → Upload Theme → choose
   green-home-store.zip → Install Now → Activate. (Your old theme stays
   installed; you can switch back at any time.)
2. Decide how you sell. The theme shows "Add to cart" on products, but a
   customer can only pay if a payment method is switched on under
   WooCommerce → Settings → Payments (for example Direct bank transfer, or a
   gateway such as PayFast or Yoco) and a shipping method exists under
   WooCommerce → Settings → Shipping. If you would rather handle every sale
   by quote for now, set Appearance → Customize → Green Home theme →
   Shop & buying to "Enquire only". The dashboard shows a warning while
   "Buy online" is on without a payment method.
3. WooCommerce → Settings → Site visibility → choose "Live" → Save.
   While the store is in "Coming soon" mode, visitors cannot see any products.
4. Settings → General: Site Title "Green Home Systems" and a Tagline such as
   "Solar kits, inverters and batteries – supplied and installed". Both
   currently show WordPress defaults ("My blog – Just another WordPress site")
   in browser tabs and Google results. On the same screen set Timezone to
   Johannesburg so quote and order times are in South African time.
5. Appearance → Customize → Green Home theme → Contact details & quotes:
   check the phone number, WhatsApp number, WhatsApp opening message and
   email address. Quote requests are emailed to that address, so make sure
   the mailbox exists: the old site showed info@greenihomesystems.co.za,
   which is a misspelt domain that cannot receive mail; the theme defaults to
   info@greenhomesystems.co.za.
6. Appearance → Customize → Site Identity → Site Icon: upload a square crop
   of the logo so browser tabs and phone bookmarks show it.
7. Recommended: unzip green-home-store.zip on your computer, then in
   WordPress go to Products → All Products → Import (button at the top) →
   choose sample-data/complete-kits.csv → Continue → Run the importer. This
   adds your five DEYE kits as products in a "Complete Kits" category; the
   home page kit section then shows them with their live prices, and you can
   edit prices and add photos like any other product. Before importing,
   check the "12KWH DEYE Kit – Premium Solution": it lists a 16 kW inverter,
   as your old site did.
   Also run WooCommerce → Status → Tools → "Regenerate shop thumbnails" once
   (the theme shows product photos uncropped, so existing thumbnails need
   rebuilding; WooCommerce also starts this by itself after activation and
   it runs in the background).
8. Submit a test quote request from the home page and check that it appears
   under Quote requests and arrives by email. If the email doesn't arrive, the
   request is still saved; install an SMTP plugin (for example WP Mail SMTP)
   so the site can send email reliably.
9. Install an SEO plugin (Yoast SEO, Rank Math or SEOPress) if you want
   control over how pages appear in Google and when links are shared. Until
   then the theme writes a basic description and share image for the home
   page, products and posts.
10. Pages: delete the leftover "Sample Page", and publish a Privacy Policy
    page (Settings → Privacy) because the quote form collects personal
    details.
11. Decide about content from the old home page that is not in the theme:
    the trust strip ("NRS 097-2-1 Compliant Installers", "PV GreenCard
    Registered Installers", "4.9/5 from 312+ Google Reviews", "Up to 15-Year
    Warranty Included"), the "Why Solar + Battery Wins" comparison, the "Why
    Go Solar?" benefits, the load-shedding stage selector, the savings
    calculator, the before/after bill box, the "Special Offer R5,000" box and
    the social icons. Tell your developer which of these are true and wanted
    and they can be added back. Two small changes were made on purpose: the
    third kit is now called "12KWH DEYE Kit – Family Solution" (its old name
    repeated the "Most Popular" label), and inverter sizes read "kW" instead
    of "KWH" (the correct unit).

If you use a caching plugin or Cloudflare caching, nothing extra is needed:
the header cart count refreshes itself and the quote form works on cached
pages.

== Frequently Asked Questions ==

= Where do I change the text at the top of the home page? =

Appearance → Customize → Green Home theme → Home: hero (and Promo bar, Home:
stats). FAQ and testimonials are under Home: FAQ & testimonials.

= Which products appear under "Popular Products"? =

Featured products: click the star next to a product in the Products list.
Change this under Customize → Green Home theme → Home: sections & products.
If nothing is featured, the newest products are shown. Sold-out products are
never shown there.

= How do I mark a kit as "Most popular"? =

Give that kit product the tag "popular".

= Can customers buy kits online? =

Not by default: kits include installation, so they show "Request a quote".
Turn on "Let customers buy Complete Kits online" under Customize → Green
Home theme → Shop & buying to change that.

= Can I put the quote form on another page? =

Yes. Add the shortcode [ghstore_quote_form] to any page.

= How do I use my own menu? =

Appearance → Menus: create a menu and assign it to "Header menu" (and
"Footer quick links"). Until then, the theme shows Home, Shop, Solar Kits,
Services, FAQ and Contact. Drop-down submenus are supported.

= My site is behind Cloudflare or a load balancer. Does the spam limit still work? =

Yes, but it then counts all visitors as one address. Add
define( 'GHSTORE_TRUST_PROXY_HEADERS', true ); to wp-config.php so the theme
reads the real visitor address from the proxy's headers. Don't add it on a
plain host: there those headers can be faked.

= Who can see quote requests? =

Administrators, Editors and Shop managers. Requests are private and never
appear on the site, in search, feeds or the REST API.

== Changelog ==

= 1.0.0 =
* First release.

== Copyright ==

Green Home Store WordPress Theme, Copyright 2026 Green Home Systems
Green Home Store is distributed under the terms of the GNU GPL.

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 2 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU General Public License for more details.

== Resources ==

* Green Home Systems logo (assets/images/logo.webp): © Green Home Systems.
* Icons in inc/icons.php: drawn for this theme, GPLv2 or later.
* screenshot.jpg: capture of this theme, GPLv2 or later.
