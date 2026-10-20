# Visionary Africa: handover

Read this first. It summarises the project so a new session can continue.

## Goal
Visionary Africa is a WordPress news and blog site about entrepreneurs and innovators across Africa, hosted on Hostinger.
Live site: https://olivedrab-donkey-447597.hostingersite.com/ (WordPress, PHP 8.3).

## Editorial rules (decided with the owner)
- No scraping and republishing. Other sites are used only as **topic inspiration**.
- For each lead, AI researches across the web (company site, history, other coverage), then writes an **original** story.
- Every article carries an "AI-assisted" disclosure and a linked **Sources** list.
- Real or clearly labelled bylines ("Visionary Africa Staff"). No invented author personas.
- Cadence: once a day, about 4 stories. Quality over quantity.
- Output is saved as **WordPress drafts**. The owner approves before anything is published.

## Built so far (branch `claude/viraly-wordpress`)
- `viraly/`: the WordPress theme, named "Visionary Africa" (folder name stays `viraly`). Lead story, latest grid, category sections, search, comments, dark mode. Accent colour is `--accent` in `style.css`.
- `visionary-africa-sources/`: plugin with a Sources meta box and automatic AI-disclosure plus source list on posts.
- Other files in the repo root (`index.html`, `arcade.html`, `games.html`, `assets/`) belong to an unrelated gaming site on another branch. Ignore them.

## Not built yet
1. Email digest of the daily drafts with signed, expiring **Preview / Approve / Reject** links. Approve opens a confirmation page with a button (not a direct GET publish, so mail scanners cannot publish). Send with `wp_mail` through a Hostinger mailbox over SMTP.
2. Daily pipeline: read 3 to 5 topic-source sites, pick the best 4 leads, research each, draft with Gemini (Google Search grounding), create WordPress drafts through the REST API.
3. Categories and menus: entrepreneurs, innovators, funding, countries.
4. Deploy the theme and plugin to `wp-content/themes/` and `wp-content/plugins/` on the server.

## Decisions made
- AI: Gemini, because it has built-in web search with citations. DeepSeek is cheaper but needs a separate search API.
- Approval by emailed link, not by replying to the email.

## Needed from the owner
- 3 to 5 topic-source sites.
- Recipient email for the digest, and a Hostinger mailbox for sending.
- Secrets, held outside the repo: `GEMINI_API_KEY`, a WordPress Application Password, and an SSH private key if deploying over SSH.

## Rules
- Never commit secrets, hostnames with credentials, or keys. This repo may be public.
- Confirm with the owner before any upload to the live site.
