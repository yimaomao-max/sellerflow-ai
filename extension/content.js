// SellerFlow — content script (user-initiated extract via popup message only)

function extractOnPage() {
  const url = location.href;
  if (!/aliexpress\.com/i.test(url)) {
    return { ok: false, error: "该页面不是受支持的商品详情页（当前仅 AliExpress /item/*）" };
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

  const priceRaw = pick(["[data-pl='product-price']", ".product-price-value", ".uniform-banner-box-price"]);
  const price = (priceRaw.match(/[\d,.]+/) || [""])[0].replace(/,/g, "");

  const images = [...document.querySelectorAll("img")]
    .map((img) => img.src)
    .filter((s) => s && /alicdn\.com/i.test(s))
    .slice(0, 8);

  return {
    ok: true,
    payload: {
      site: "aliexpress",
      sourceUrl: url.split("?")[0],
      title,
      description: (pick([".product-description", "#product-description"]) || title).slice(0, 2000),
      price,
      currency: "USD",
      images,
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