import Papa from "papaparse";
import { emptyProduct, mapHeader, guessHandle } from "./product";

// 解析 CSV 文本 → 商品数组（自动表头映射，未识别表头保留在 extras）
export function parseProductsCsv(text) {
  const result = Papa.parse(text, { header: true, skipEmptyLines: true });
  if (result.errors.length && !result.data.length) {
    throw new Error(`CSV 解析失败: ${result.errors[0].message}`);
  }
  const rows = result.data;
  if (!rows.length) return { products: [], unmapped: [] };

  const headers = Object.keys(rows[0]);
  const fieldByHeader = {};
  const unmapped = [];
  for (const h of headers) {
    const field = mapHeader(h);
    if (field && !Object.values(fieldByHeader).includes(field)) {
      fieldByHeader[h] = field;
    } else {
      unmapped.push(h);
    }
  }

  const products = rows.map((row) => {
    const p = emptyProduct();
    const extras = {};
    for (const [h, v] of Object.entries(row)) {
      const val = String(v ?? "").trim();
      const field = fieldByHeader[h];
      if (field) p[field] = val;
      else if (h && val) extras[h] = val;
    }
    if (!p.handle && p.title) p.handle = guessHandle(p.title);
    if (["active", "draft", "archived"].includes(p.status.toLowerCase())) {
      p.status = p.status.toLowerCase();
    } else {
      p.status = "draft";
    }
    p.extras = extras;
    return p;
  });

  return { products, unmapped };
}

// 导出列：主字段 + 各语言翻译
export function buildExportCsv(products, enabledLangs = []) {
  const extraHeaders = new Set();
  for (const p of products) {
    for (const h of Object.keys(p.extras || {})) extraHeaders.add(h);
  }

  const fields = [
    "handle", "title", "description", "price", "compareAtPrice",
    "sku", "vendor", "category", "tags", "status",
  ];
  for (const code of enabledLangs) {
    fields.push(`title:${code}`, `body_html(${code}):description`);
  }
  fields.push(...extraHeaders);

  const rows = products.map((p) => {
    const row = {
      handle: p.handle,
      title: p.title,
      description: p.description,
      price: p.price,
      compareAtPrice: p.compareAtPrice,
      sku: p.sku,
      vendor: p.vendor,
      category: p.category,
      tags: p.tags,
      status: p.status,
    };
    for (const code of enabledLangs) {
      const t = p.translations?.[code] || {};
      row[`title:${code}`] = t.title || "";
      row[`body_html(${code}):description`] = t.description || "";
    }
    for (const h of extraHeaders) row[h] = p.extras?.[h] ?? "";
    return row;
  });

  return Papa.unparse(rows, { columns: fields });
}
