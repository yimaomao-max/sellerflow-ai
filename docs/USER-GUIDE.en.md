# SellerFlow AI User Guide

> From zero rows to a Shopify-ready CSV. ~10 min read, ~5 min hands-on.

**中文：[USER-GUIDE.md](./USER-GUIDE.md)**

---

## Table of contents

1. [UI tour](#1-ui-tour)
2. [Import products](#2-import-products)
3. [Edit & bulk operations](#3-edit--bulk-operations)
4. [AI batch processing](#4-ai-batch-processing)
5. [Validation & scoring](#5-validation--scoring)
6. [Export CSV](#6-export-csv)
7. [Extension demo page](#7-extension-demo-page)
8. [FAQ](#8-faq)
9. [Appendix: minimal CSV sample](#9-appendix-minimal-csv-sample)

---

## 1. UI tour

```
┌──────────────────────────────────────────────────────────────────────────┐
│  SF SellerFlow AI    [N items] [errors] [warns] [✓ export]  Import Export… │
├──────────────────────────────────────────────────────────────────────────┤
│  Search │ Filter │ New │ AI batch │ Extension demo │ Delete selected      │
├──────────────────────────────────────────────────────────────────────────┤
│  □ │status│ Title │ Desc │ Price │ SKU │ Score │ langs │ Status          │
│  ... click a row to open the drawer ...                                   │
├──────────────────────────────────────────────────────────────────────────┤
│  (when rows selected) Bulk edit bar: operation + field + value           │
└──────────────────────────────────────────────────────────────────────────┘
```

| Area | Purpose |
| --- | --- |
| Header chips | Live counts; **Ready to export** when no fatal errors |
| Toolbar | Search, filter, create, AI, extension demo |
| Table | Quick inline edits; row click → full drawer |
| Bulk bar | Visible only when one or more rows are selected |

---

## 2. Import products

### 2.1 From CSV

1. Click **Import** → choose a `.csv` file (UTF-8 recommended)  
2. First row = headers; **auto-mapping** for common column names  
3. Unmapped columns land in each row’s `extras` and can export back  

**Tips**

- Import from the header **appends** rows; empty-state import can replace the list  
- Missing `handle` → auto-generated URL slug from title  

### 2.2 Sample data

Click **Load sample data** on an empty list for 3 demo products (mixed EN/ZH).

### 2.3 Extension demo ingest

Open **/extension-demo**, confirm capture, then return to the home page — new product uses the same key `sellerflow.products.v1` as CSV import.

---

## 3. Edit & bulk operations

### 3.1 Inline edit

Edit **title, description, price** in the table; changes persist to localStorage on blur.

### 3.2 Detail drawer

- Core: handle, title, description, price, compare-at, SKU, vendor, category, tags, status  
- **Translations** per language (`title` / `description`)  
- **Layered fields**: `sourceTitle`, `aiTitle`, etc. — compare supplier vs AI; apply AI to current title when ready  

### 3.3 Bulk edit

1. Select one or more rows  
2. Pick an operation in the bulk bar:

| Operation | Use case |
| --- | --- |
| Set to | Same vendor or status `draft` for all |
| Find & replace | Rename supplier name to your brand |
| Prefix / suffix | Add `[NEW]` or season tags to titles |
| Upper / lower | Normalize SKUs |
| Trim | Strip stray spaces from supplier exports |
| Clear field | Wipe tags, etc. |
| Clear translation (lang) | Reset before re-running AI translate |

3. **Apply**, or **Clear selection**

---

## 4. AI batch processing

**AI batch** — if nothing is selected, the current filtered set is used; otherwise only selected rows.

### 4.1 Mock mode (default)

Without an API key, **mockAi** runs:

- Titles: brand + selling point + category style  
- Translate: dictionary swap + “(mock)” marker  
- Rewrite: bullet-list description  

Fine for demos and UI tests — **not for production listings**.

### 4.2 Live models

Enter a key in **Settings** and disable mock mode, or use server `.env.local`.

| Task | Result |
| --- | --- |
| Title | Updates `title`, stores `aiTitle` for diff |
| Translate | Merges into `translations[lang]` |
| Rewrite | Updates `description` / `aiDescription` |

Batched requests show **AI running…** progress; failures surface as toasts (quota, wrong model, timeout).

### 4.3 Suggested flows

| Scenario | Tip |
| --- | --- |
| English primary store | `title` in `en`, then `translate` to `es` / `de` |
| Chinese source → English | `rewrite` then English `title` |
| Large catalogs | Test 5 rows first, then select all |

---

## 5. Validation & scoring

Open **Validate** in the header.

### 5.1 Severity

| Level | Meaning | Export |
| --- | --- | --- |
| **Error** | Typical Shopify hard failures | **Excluded** by default |
| **Warning** | Recommendations | Included — review manually |

### 5.2 Score (0–100 per product)

Derived from a checklist: title length ≤255, suggested ≥20 chars, description ≥30, positive price, unique SKU, etc. The **Score** column gives a quick health scan.

### 5.3 Issue list

All issues grouped by product ID for team fixes.

---

## 6. Export CSV

1. **Export**  
2. Default: rows **without Errors** only (matches header **Ready to export**)  
3. Translated languages add `title:xx` and description columns  

**Shopify import**

1. Admin → Products → Import  
2. Upload file  
3. Map columns (Title / Body / Variant Price / SKU usually align)  

> MVP does not bulk image URLs or full variant matrices — finish complex variants in Shopify or a future release.

---

## 7. Extension demo page

URL: `http://localhost:3000/extension-demo`

| Step | Action |
| --- | --- |
| 1 | Review detected title, price, currency |
| 2 | Select at least one image |
| 3 | Send to workbench |
| 4 | Home page → new row at end of list |

This mirrors PRD **F1 capture preview** UX; not a real MV3 extension yet — see `docs/MVP-TASK-LIST.md` milestone M1.

---

## 8. FAQ

**Q: Will a refresh wipe my data?**  
A: No — products and settings use localStorage. Clearing site data resets it.

**Q: Multi-user collaboration?**  
A: Not in this MVP. Cloud sync is described in `docs/TECH-ARCHITECTURE.md`.

**Q: AI returns 502?**  
A: Check Base URL ends with `/v1`, model name, and key; use mock mode to verify the UI path.

**Q: Export file empty?**  
A: Every row may still have Errors — open Validate and fix red items.

**Q: Excel (.xlsx)?**  
A: Save as **CSV UTF-8** in Excel, then import.

**Q: localStorage limits?**  
A: ~5MB typical. Very large catalogs will move server-side in a later version; MVP suits small/medium batches.

---

## 9. Appendix: minimal CSV sample

Save as `sample-products.csv`:

```csv
Title,Body (HTML),Variant Price,SKU,Vendor,Type,Tags,Status
Demo Thermal Mug,"Double-wall stainless mug, 500ml",29.99,MUG-001,ThermoHome,Drinkware,"mug,travel",draft
Demo Earbuds Pro,"ANC earbuds with charging case",59.99,EAR-002,SoundMax,Electronics,"audio,wireless",draft
```

Suggested flow after import: **AI title (en) → Validate → Export**.

---

*Kept in sync with SellerFlow AI MVP · Open a GitHub Issue for questions.*