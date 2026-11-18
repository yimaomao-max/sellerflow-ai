// SellerFlow — content script (extract only when popup requests)

function normImageUrl(url) {
  if (!url) return "";
  try {
    const u = new URL(url, location.href);
    return u.href.replace(/_\d+x\d+\.(jpg|jpeg|png|webp)/i, ".$1");
  } catch {
    return url;
  }
}

function uniqueImages() {
  const seen = new Set();
  const out = [];
  for (const img of document.querySelectorAll("img")) {
    const raw = img.src || img.getAttribute("data-src") || "";
    const url = normImageUrl(raw);
    if (!url || !/alicdn\.com/i.test(url)) continue;
    if (seen.has(url)) continue;
    seen.add(url);
    if (url.includes("icon") || url.includes("logo")) continue;
    out.push(url);
    if (out.length >= 12) break;
  }
  return out;
}

function extractVariants() {
  const chips = [...document.querySelectorAll(".sku-property-item, [class*='sku-property']")];
  if (!chips.length) return [];
  return chips.slice(0, 24).map((el, i) => ({
    option: el.textContent?.trim().slice(0, 80) || `opt-${i}`,
  }));
}

function extractOnPage() {
  const url = location.href;
  if (!/aliexpress\.com/i.test(url)) {
    return { ok: false, error: "该页面不是受支持的商品详情页（当前仅 AliExpress /item/*）" };
  }
  if (!/\/item\//i.test(url)) {
    return { ok: false, error: "请在商品详情页打开插件（URL 需包含 /item/）" };
  }

  const pick = (selectors) => {
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      const t = el?.textContent?.trim();
      if (t) return t;
    }
    return "";
  };

  const title = pick(["h1[data-pl='product-title']", "h1.product-title-text", "h1"]);
  if (!title) return { ok: false, error: "标题未识别，请手动填写（PRD F1.2）" };

  const priceRaw = pick([
    "[data-pl='product-price']",
    ".product-price-value",
    ".uniform-banner-box-price",
    "[class*='price-current']",
  ]);
  const price = (priceRaw.match(/[\d,.]+/) || [""])[0].replace(/,/g, "");

  const compareRaw = pick(["[class*='price-original']", ".product-price-original"]);
  const compareAtPrice = (compareRaw.match(/[\d,.]+/) || [""])[0].replace(/,/g, "");

  const images = uniqueImages();
  const variants = extractVariants();

  const description =
    pick([".product-description", "#product-description", ".detail-desc", "[data-pl='product-description']"]) ||
    `Supplier listing: ${title}. Review specs and images before publishing.`;

  return {
    ok: true,
    payload: {
      site: "aliexpress",
      sourceUrl: url.split("?")[0],
      title,
      description: description.slice(0, 2000),
      price,
      compareAtPrice,
      currency: "USD",
      vendor: pick(["[class*='store-name']", "a[class*='store']"]) || "",
      sku: "",
      images,
      variants,
    },
  };
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type === "SELLERFLOW_EXTRACT") {
    try {
      sendResponse(extractOnPage());
    } catch (e) {
      sendResponse({ ok: false, error: String(e.message || e) });
    }
  }
  return true;
});