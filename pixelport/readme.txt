=== PixelPort ===
Contributors: pixelport
Requires at least: 6.4
Tested up to: 7.1
Requires PHP: 7.4
Stable tag: 1.0.0
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

A dark, neon gaming storefront theme with full WooCommerce support.

== Description ==

PixelPort turns the PixelPort gaming site into a WordPress theme. Products from
WooCommerce show as PixelPort cards — artwork, category, star rating, short
description, tags, price and an add-to-cart button — on the home page, the shop,
category and tag pages, and in related products. Products without a photo get
gradient artwork with their initials, in a colour you can pick per product.

* Home page: hero, product grid, the front page's own content, latest posts.
* Shop: category chips, product search, sorting, result count.
* Header cart icon with a live item count.
* Dark styling for product pages, cart, checkout (classic and block) and My account.
* "Arcade (Neon Snake)" page template with the playable browser game.
* Customizer: hero copy and buttons, three stats, which products the home page
  shows, section headings, footer note, and two accent colours.

WooCommerce is optional: without it the theme runs as a blog with the arcade.

== Installation ==

1. Appearance → Themes → Add New Theme → Upload Theme, choose pixelport.zip,
   then Install and Activate.
2. Install and activate WooCommerce (Plugins → Add New Plugin) if it isn't
   already, and run its setup.
   Important: new WooCommerce stores start in "Coming soon" mode, which hides
   the shop and products from visitors (you still see them while logged in).
   When you're ready, go to WooCommerce → Settings → Site visibility, choose
   "Live" and save.
3. Optional sample products: Products → Import → choose
   sample-data/pixelport-products.csv from inside the theme folder → Continue →
   Run the importer. It adds the eight PixelPort games.
4. Optional arcade: Pages → Add New Page, title it "Arcade", and pick
   "Arcade (Neon Snake)" under Template.
5. Appearance → Menus: assign a menu to "Header menu" (and "Footer menu").
   Until you do, the header shows Home, Shop, Arcade and your posts page.

== Frequently Asked Questions ==

= Which products appear on the home page? =

Featured products (click the star in the Products list) by default. Change it
under Appearance → Customize → PixelPort theme → Home: products & news. If the
chosen source has nothing, the newest products are shown instead.

= How do I change a product card's colour? =

Edit the product, and in Product data → General set "Card colour" to a hex
colour such as #ff5c7c. It is used when the product has no image.

= How do I change the accent colours? =

Appearance → Customize → Colors.

== Changelog ==

= 1.0.0 =
* First release: WordPress theme version of the PixelPort static site, with WooCommerce support.

== Copyright ==

PixelPort WordPress Theme, Copyright 2026 PixelPort
PixelPort is distributed under the terms of the GNU GPL.

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 2 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU General Public License for more details.

== Resources ==

* Sample products and the Neon Snake game are original PixelPort content,
  GPLv2 or later. All titles are fictional.
* screenshot.png is a capture of this theme, GPLv2 or later.
