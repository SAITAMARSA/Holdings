# SA Solar Experts → WooCommerce product import

Exports the full product catalogue from [sasolarexperts.co.za](https://sasolarexperts.co.za)
into a CSV you can load straight into WordPress/WooCommerce, with every product
photo attached.

## What you get

| File | What it is |
| --- | --- |
| `exports/woocommerce-products-import.csv` | **The import file.** 125 products, 172 image URLs. |
| `exports/products-raw.json` | Untouched API snapshot, in case you want to remap fields later. |
| `scripts/sasolarexperts_export.py` | The exporter, so you can re-run it when the source catalogue changes. |

Catalogue breakdown: **Lithium Batteries** 48 · **Inverters** 40 · **Solar Panels** 25 ·
**Accessories** 9 · **Batteries** 6 (three products sit in two categories).
All prices are ZAR, 9 products carry an active sale price, and 27 are marked out of stock.

## How to import

1. In WordPress go to **Products → All Products → Import** (this is WooCommerce's
   built-in *Product CSV Importer*; no plugin needed).
2. Choose `exports/woocommerce-products-import.csv` and click **Continue**.
3. On the column-mapping screen every column should map automatically, because the
   headers match WooCommerce's own sample file. Leave the defaults and click
   **Run the importer**.
4. Wait for it to finish. Importing is slow because WooCommerce downloads all 172
   photos from the source site and rebuilds them into your media library — budget
   a few minutes and do not close the tab.

The first URL in each row's `Images` column becomes the **featured image**; the
rest become the **product gallery**, in the same order the source site uses.

Categories, tags and brands are created automatically if they don't already exist.

## Things worth knowing before you run it

- **Check you're allowed to use this content.** Product descriptions and photos on
  the source site are someone else's work. Make sure you have permission (you're a
  reseller, you own both sites, the supplier supplied them, etc.) before publishing.
- **Photos are pulled from the source site during import.** If that site is offline
  or blocks the request, images silently fail while the products still import. Re-run
  the exporter with `--download-images` to grab local copies as a fallback.
- **Prices are the source site's retail prices**, converted from the API's
  minor-unit integers (e.g. `1690000` → `16900.00`). Review them before going live.
- **58 products have no SKU** because the source site never set one. WooCommerce
  matches on SKU, so if you import this file twice those 58 arrive twice. Either
  import once, or re-run with `--generate-sku` to stamp them `SAS-<id>` first.
- **Stock is not tracked.** Products carry an in-stock/out-of-stock flag only, since
  the source shop doesn't publish quantities.
- Every row keeps `meta:_source_product_id` and `meta:_source_url` so you can always
  trace a product back to its original listing.

## Re-running the export

```bash
python3 scripts/sasolarexperts_export.py                  # refresh the CSV
python3 scripts/sasolarexperts_export.py --generate-sku   # add SKUs to SKU-less products
python3 scripts/sasolarexperts_export.py --download-images # also save photos to exports/images/
```

No dependencies beyond Python 3.9+.

### How it collects the data

The source shop runs WooCommerce with its public Store API enabled, so the exporter
reads structured product data rather than scraping HTML — names, descriptions,
prices, stock, tags, brands and the full image gallery all come through as clean
fields.

Two source-side quirks are corrected on the way out:

- The Store API returns an empty category list on 45 products even though they *are*
  categorised (the whole "Lithium Batteries" category is missing from every product
  record). The exporter queries each category for its members and rebuilds the real
  assignment, so nothing lands uncategorised.
- 18 products list their featured image a second time inside the gallery. Those are
  de-duplicated per product, which is why the export has 172 image URLs rather than 190.
