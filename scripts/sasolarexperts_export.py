#!/usr/bin/env python3
"""Export a WooCommerce catalogue into a WooCommerce Product CSV Importer file.

Reads the public WooCommerce Store API of a source shop and writes a CSV that
can be fed straight into WooCommerce > Products > Import on the target site.
Image URLs are left pointing at the source shop so WooCommerce sideloads every
photo (featured image first, then the rest of the gallery) during the import.

Usage:
    python3 scripts/sasolarexperts_export.py
    python3 scripts/sasolarexperts_export.py --download-images
"""

from __future__ import annotations

import argparse
import csv
import html
import json
import os
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

DEFAULT_SOURCE = "https://sasolarexperts.co.za"
USER_AGENT = "Mozilla/5.0 (compatible; product-export/1.0)"
PER_PAGE = 100

# Column order used by the WooCommerce Product CSV Importer sample file.
COLUMNS = [
    "ID", "Type", "SKU", "Name", "Published", "Is featured?",
    "Visibility in catalog", "Short description", "Description",
    "Date sale price starts", "Date sale price ends", "Tax status", "Tax class",
    "In stock?", "Stock", "Low stock amount", "Backorders allowed?",
    "Sold individually?", "Weight (kg)", "Length (cm)", "Width (cm)",
    "Height (cm)", "Allow customer reviews?", "Purchase note", "Sale price",
    "Regular price", "Categories", "Tags", "Shipping class", "Images",
    "Download limit", "Download expiry days", "Parent", "Grouped products",
    "Upsells", "Cross-sells", "External URL", "Button text", "Position",
    "Brands", "meta:_source_product_id", "meta:_source_url",
]


def fetch_json(url: str, retries: int = 4):
    """GET a URL and parse JSON, retrying with exponential backoff."""
    delay = 2
    for attempt in range(retries + 1):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
            with urllib.request.urlopen(req, timeout=90) as resp:
                return json.loads(resp.read().decode("utf-8"))
        except (urllib.error.URLError, TimeoutError, json.JSONDecodeError) as exc:
            if attempt == retries:
                raise
            print(f"  ! {exc} - retrying in {delay}s", file=sys.stderr)
            time.sleep(delay)
            delay *= 2


def store_api(base: str, path: str, **params) -> str:
    query = urllib.parse.urlencode(params)
    return f"{base.rstrip('/')}/wp-json/wc/store/v1/{path}?{query}"


def fetch_products(base: str) -> list[dict]:
    """Page through the Store API until every published product is collected."""
    products, page = [], 1
    while True:
        batch = fetch_json(store_api(base, "products", per_page=PER_PAGE, page=page))
        if not batch:
            break
        products.extend(batch)
        print(f"  fetched page {page} ({len(batch)} products)")
        if len(batch) < PER_PAGE:
            break
        page += 1
    return products


def fetch_category_map(base: str) -> tuple[dict[int, list[str]], list[dict]]:
    """Map product id -> category names.

    The source shop's Store API returns an empty ``categories`` array on many
    products even though the category is really assigned (its largest category,
    "Lithium Batteries", is missing from every product record). Querying each
    category for its members recovers the true assignment.
    """
    categories = fetch_json(store_api(base, "products/categories", per_page=PER_PAGE))
    by_id: dict[int, dict] = {c["id"]: c for c in categories}

    def full_path(cat: dict) -> str:
        """Render as 'Parent > Child' so WooCommerce rebuilds the hierarchy."""
        parts, seen = [cat["name"]], {cat["id"]}
        parent = cat.get("parent") or 0
        while parent and parent in by_id and parent not in seen:
            seen.add(parent)
            parts.append(by_id[parent]["name"])
            parent = by_id[parent].get("parent") or 0
        return " > ".join(reversed(parts))

    mapping: dict[int, list[str]] = {}
    for cat in categories:
        members = fetch_json(
            store_api(base, "products", per_page=PER_PAGE, category=cat["id"])
        )
        path = full_path(cat)
        for product in members:
            mapping.setdefault(product["id"], []).append(path)
        print(f"  category '{cat['name']}': {len(members)} products")
    return mapping, categories


def money(minor_units: str | None, minor_unit_digits: int) -> str:
    """Store API prices are integers in minor units (e.g. '1690000' = 16900.00)."""
    if minor_units in (None, ""):
        return ""
    return f"{int(minor_units) / (10 ** minor_unit_digits):.2f}"


def join_terms(names: list[str], field: str, product_name: str) -> str:
    """Join taxonomy terms for the importer, which splits these fields on commas."""
    safe = []
    for name in names:
        if "," in name:
            print(
                f"  ! dropping {field} '{name}' on '{product_name}': "
                "commas break the importer's term splitting",
                file=sys.stderr,
            )
            continue
        safe.append(name)
    return ", ".join(safe)


IMG_TAG_RE = re.compile(r"<img\b[^>]*>", re.I)

# Tags libmagic's HTML sniffer looks for in a file's first 4 KB. A CSV whose
# opening rows contain one is classified as text/html, and WordPress then
# refuses the upload with "Sorry, you are not allowed to upload this file type."
HTML_SNIFF_TRIGGERS = (
    "<!doctype html", "<html", "<head", "<title", "<script", "<style", "<table", "<a href=",
)


def inline_emoji(markup: str) -> str:
    """Turn WordPress's emoji <img> tags back into the characters they stand for.

    The source shop renders emoji in descriptions as <img class="emoji"> tags
    served from wordpress.org. The character itself is in the alt attribute, so
    restoring it lets the destination site render emoji natively instead of
    hot-linking dozens of tiny images.
    """

    def restore(match: re.Match) -> str:
        tag = match.group(0)
        if not re.search(r"""\bclass=["'][^"']*\bemoji\b""", tag):
            return tag
        alt = re.search(r"""\balt=["']([^"']*)["']""", tag)
        return alt.group(1) if alt else tag

    return IMG_TAG_RE.sub(restore, markup or "")


def trips_html_sniffer(product: dict) -> bool:
    """True when the product's HTML contains a tag the sniffer treats as a web page."""
    text = product.get("description", "") + product.get("short_description", "")
    text = re.sub(r"\s+", " ", text.lower())
    return any(trigger in text for trigger in HTML_SNIFF_TRIGGERS)


def product_images(product: dict) -> list[str]:
    """Ordered, de-duplicated image URLs; the first one is the featured image.

    Several source products list their featured image again inside the gallery,
    which would import as a product whose gallery repeats the main photo.
    """
    urls, seen = [], set()
    for image in product.get("images") or []:
        src = image.get("src")
        if src and src not in seen:
            seen.add(src)
            urls.append(src)
    return urls


def build_row(product: dict, categories: list[str], generate_sku: bool) -> dict:
    prices = product.get("prices") or {}
    digits = prices.get("currency_minor_unit", 2)
    regular = money(prices.get("regular_price"), digits)
    sale = money(prices.get("sale_price"), digits)
    # The Store API reports sale_price == regular_price when nothing is discounted.
    if not product.get("on_sale") or sale == regular:
        sale = ""

    sku = (product.get("sku") or "").strip()
    if not sku and generate_sku:
        sku = f"SAS-{product['id']}"

    name = html.unescape(product.get("name") or "")
    dims = product.get("dimensions") or {}

    return {
        "ID": "",  # blank so the importer creates new products instead of overwriting IDs
        "Type": product.get("type") or "simple",
        "SKU": sku,
        "Name": name,
        "Published": 1,
        "Is featured?": 0,
        "Visibility in catalog": "visible",
        "Short description": inline_emoji(product.get("short_description")),
        "Description": inline_emoji(product.get("description")),
        "Date sale price starts": "",
        "Date sale price ends": "",
        "Tax status": "taxable",
        "Tax class": "",
        "In stock?": 1 if product.get("is_in_stock") else 0,
        "Stock": "",
        "Low stock amount": product.get("low_stock_remaining") or "",
        "Backorders allowed?": 0,
        "Sold individually?": 1 if product.get("sold_individually") else 0,
        "Weight (kg)": product.get("weight") or "",
        "Length (cm)": dims.get("length") or "",
        "Width (cm)": dims.get("width") or "",
        "Height (cm)": dims.get("height") or "",
        "Allow customer reviews?": 1,
        "Purchase note": "",
        "Sale price": sale,
        "Regular price": regular,
        "Categories": join_terms(categories, "category", name),
        "Tags": join_terms([t["name"] for t in product.get("tags") or []], "tag", name),
        "Shipping class": "",
        # First URL becomes the featured image, the rest become the gallery.
        "Images": ", ".join(product_images(product)),
        "Download limit": "",
        "Download expiry days": "",
        "Parent": "",
        "Grouped products": "",
        "Upsells": "",
        "Cross-sells": "",
        "External URL": "",
        "Button text": "",
        "Position": 0,
        "Brands": join_terms(
            [b["name"] for b in product.get("brands") or []], "brand", name
        ),
        "meta:_source_product_id": product["id"],
        "meta:_source_url": product.get("permalink") or "",
    }


def download_images(products: list[dict], out_dir: str) -> None:
    """Save every photo locally as a fallback if sideloading is blocked."""
    os.makedirs(out_dir, exist_ok=True)
    urls = []
    for product in products:
        urls.extend(product_images(product))
    urls = list(dict.fromkeys(urls))  # de-duplicate by URL, keeping order

    saved, failed = 0, []
    for index, url in enumerate(urls, 1):
        # Mirror the source upload path (e.g. 2023/12/photo.webp). Two different
        # uploads on the source shop can share a bare filename, so flattening
        # everything into one folder would silently drop one of them.
        rel = urllib.parse.urlparse(url).path.split("/wp-content/uploads/")[-1]
        rel = rel.lstrip("/") or os.path.basename(urllib.parse.urlparse(url).path)
        target = os.path.join(out_dir, *rel.split("/"))
        os.makedirs(os.path.dirname(target), exist_ok=True)
        if os.path.exists(target) and os.path.getsize(target) > 0:
            saved += 1
            continue
        try:
            req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
            with urllib.request.urlopen(req, timeout=90) as resp, open(target, "wb") as fh:
                fh.write(resp.read())
            saved += 1
        except Exception as exc:  # noqa: BLE001 - report and continue
            failed.append((url, str(exc)))
        if index % 25 == 0:
            print(f"  downloaded {index}/{len(urls)}")
    print(f"  saved {saved}/{len(urls)} images to {out_dir}")
    for url, err in failed:
        print(f"  ! failed {url}: {err}", file=sys.stderr)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", default=DEFAULT_SOURCE, help="source shop URL")
    parser.add_argument(
        "--out", default="exports/woocommerce-products-import.csv", help="CSV output path"
    )
    parser.add_argument(
        "--raw-json", default="exports/products-raw.json", help="raw API snapshot path"
    )
    parser.add_argument(
        "--generate-sku",
        action="store_true",
        help="give SKU-less products a SAS-<id> SKU so re-imports update instead of duplicating",
    )
    parser.add_argument(
        "--download-images", action="store_true", help="also save every photo locally"
    )
    parser.add_argument(
        "--image-dir", default="exports/images", help="where --download-images writes"
    )
    args = parser.parse_args()

    print(f"Fetching products from {args.source} ...")
    products = fetch_products(args.source)
    print(f"  {len(products)} products total")

    print("Resolving categories ...")
    category_map, _ = fetch_category_map(args.source)

    for directory in {os.path.dirname(args.out), os.path.dirname(args.raw_json)}:
        if directory:
            os.makedirs(directory, exist_ok=True)

    with open(args.raw_json, "w", encoding="utf-8") as fh:
        json.dump(products, fh, indent=1, ensure_ascii=False)

    # Products whose HTML would trip the sniffer go last, so the first 4 KB of
    # the file (all WordPress inspects) can never look like a web page.
    ordered = sorted(products, key=lambda p: (trips_html_sniffer(p), p["id"]))
    rows = [build_row(p, category_map.get(p["id"], []), args.generate_sku) for p in ordered]

    with open(args.out, "w", encoding="utf-8-sig", newline="") as fh:
        writer = csv.DictWriter(fh, fieldnames=COLUMNS, quoting=csv.QUOTE_ALL)
        writer.writeheader()
        writer.writerows(rows)

    images = sum(len(product_images(p)) for p in products)
    uncategorised = sum(1 for r in rows if not r["Categories"])
    print(f"\nWrote {args.out}")
    print(f"  {len(rows)} products, {images} image URLs")
    print(f"  {uncategorised} products without a category")
    print(f"  {sum(1 for r in rows if not r['SKU'])} products without a SKU")
    print(f"  {sum(trips_html_sniffer(p) for p in products)} products with sniffer-sensitive HTML moved to the end")

    if args.download_images:
        print(f"\nDownloading images to {args.image_dir} ...")
        download_images(products, args.image_dir)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
