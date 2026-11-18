/**
 * AliExpress 商品详情页 DOM 提取（适配器 v1 — 选择器随站点改版需维护）
 * @returns {{ ok: boolean, site: string, error?: string, payload?: object }}
 */
export function extractAliExpress(doc = document) {
  const url = doc.location?.href || "";
  if (!/\/item\/\d+\.html/.test(url) && !/\/item\/\d+/.test(url)) {
    return { ok: false, site: "aliexpress", error: "当前页面不是 AliExpress 商品详情页" };
  }

  const pick = (selectors) => {
    for (const sel of selectors) {
      const el = doc.querySelector(sel);
      const t = el?.textContent?.trim();
      if (t) return t;
    }
    return "";
  };

  const title = pick([
    "h1[data-pl='product-title']",
    "h1.product-title-text",
    "h1",
  ]);

  if (!title) {
    return { ok: false, site: "aliexpress", error: "标题未识别，请手动填写（PRD F1.2）" };
  }

  const priceRaw = pick([
    "[data-pl='product-price']",
    ".product-price-value",
    ".uniform-banner-box-price",
  ]);
  const price = (priceRaw.match(/[\d,.]+/) || [""])[0].replace(/,/g, "");

  const images = [...doc.querySelectorAll("img")]
    .map((img) => img.src || img.dataset?.src)
    .filter((s) => s && /alicdn\.com/i.test(s))
    .slice(0, 8);

  const description =
    pick([".product-description", "#product-description", ".detail-desc"]) ||
    `Captured from AliExpress. Review and enrich before publishing.`;

  return {
    ok: true,
    site: "aliexpress",
    payload: {
      site: "aliexpress",
      sourceUrl: url.split("?")[0],
      title,
      description: description.slice(0, 2000),
      price,
      currency: "USD",
      sku: "",
      vendor: "",
      category: "",
      tags: "",
      images,
    },
  };
}