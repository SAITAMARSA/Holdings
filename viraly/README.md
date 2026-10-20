# Visionary Africa WordPress theme

A mobile-first blog and news theme: lead story, latest grid, category sections, clean article layout, search, comments, dark mode.

## Install

1. Zip this `viraly/` folder (the folder itself, with `style.css` directly inside), or copy it to `wp-content/themes/viraly/` on the server.
2. In `wp-admin` go to Appearance → Themes and activate **Visionary Africa**.
3. Appearance → Menus: create a menu and assign it to **Primary menu** (and optionally **Footer menu**). Without one, the header lists your top categories.
4. Settings → Reading: keep "Your latest posts" for the news-style home page.

## Notes

- Posts, categories and settings live in the WordPress database, not in this repo. Only the theme is versioned here.
- To deploy with Hostinger Git, point the install path at `public_html/wp-content/themes/viraly` and use a repo or branch whose root is this folder's contents.
- Site name, colours and accent are set in `style.css` (`:root` variables). Change `--accent` to rebrand.
