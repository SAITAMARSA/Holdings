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
  action. Every section can be switched off in the Customizer.
* Your WooCommerce products everywhere: home page, shop, category pages,
  product pages, related products, with sale and sold-out badges.
* Product pages get a "Need it installed?" box with WhatsApp and quote buttons.
* Quote request form that saves every request under "Quote requests" in the
  dashboard and emails it to you. Spam is filtered with a hidden trap field.
* Floating WhatsApp button, header cart with live item count, promo bar.
* Footer links to your real product categories.

== Go-live checklist ==

1. Appearance → Themes → Add New Theme → Upload Theme → choose
   green-home-store.zip → Install → Activate. (Your old theme stays installed;
   you can switch back at any time.)
2. WooCommerce → Settings → Site visibility → choose "Live" → Save.
   While the store is in "Coming soon" mode, visitors cannot see any products.
3. Settings → General → Site Title: "Green Home Systems" (and a tagline).
   This is the name shown in browser tabs and Google results.
4. Appearance → Customize → Green Home theme → Contact details & quotes:
   check the phone, WhatsApp number and email address. Quote requests are
   emailed to that address.
5. Optional: Products → Import → choose sample-data/complete-kits.csv from
   inside the theme folder → Continue → Run the importer. This adds your five
   DEYE kits as products in a "Complete Kits" category; the home page kit
   section then shows them with live prices. Add a photo to each kit.
6. Submit a test quote request from the home page and check that it appears
   under Quote requests and arrives by email. If the email doesn't arrive, the
   request is still saved; install an SMTP plugin (for example WP Mail SMTP)
   so the site can send email reliably.

== Frequently Asked Questions ==

= Where do I change the text at the top of the home page? =

Appearance → Customize → Green Home theme → Home: hero (and Promo bar, Home:
stats).

= Which products appear under "Popular Products"? =

Featured products: click the star next to a product in the Products list.
Change this under Customize → Green Home theme → Home: sections & products.
If nothing is featured, the newest products are shown.

= How do I mark a kit as "Most popular"? =

Give that kit product the tag "popular".

= Can I put the quote form on another page? =

Yes. Add the shortcode [ghstore_quote_form] to any page.

= How do I use my own menu? =

Appearance → Menus: create a menu and assign it to "Header menu" (and
"Footer quick links"). Until then, the theme shows Home, Shop, Solar Kits,
Services, FAQ and Contact.

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
