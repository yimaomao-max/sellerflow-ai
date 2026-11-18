import { emptyProduct, guessHandle } from "./product";

/**
 * 将插件采集 JSON 转为工作台商品（M1 过渡：文件导入 / 后续 POST /api/capture）
 * @param {object|object[]} raw
 */
export function parseCapturePayload(raw) {
  const list = Array.isArray(raw) ? raw : [raw];
  const products = [];
  for (const item of list) {
    if (!item || typeof item !== "object") continue;
    const title = String(item.title || "").trim();
    if (!title) continue;
    const p = emptyProduct({
      title,
      description: String(item.description || "").trim(),
      price: item.price != null ? String(item.price) : "",
      compareAtPrice: item.compareAtPrice != null ? String(item.compareAtPrice) : "",
      sku: String(item.sku || "").trim(),
      vendor: String(item.vendor || "").trim(),
      category: String(item.category || "").trim(),
      tags: String(item.tags || "").trim(),
      status: "draft",
    });
    p.sourceTitle = title;
    p.sourceDescription = p.description;
    if (item.handle) p.handle = item.handle;
    else if (title) p.handle = guessHandle(title);
    const imgs = item.selectedImages?.length ? item.selectedImages : item.images;
    if (imgs?.length) {
      p.extras = {
        ...(p.extras || {}),
        images: imgs.join("|"),
        imageCount: String(imgs.length),
      };
    }
    if (item.variants?.length) {
      p.extras = { ...(p.extras || {}), variantsDetected: String(item.variants.length) };
    }
    if (item.sourceUrl) p.extras = { ...(p.extras || {}), "Source URL": item.sourceUrl };
    if (item.currency) p.extras = { ...(p.extras || {}), Currency: item.currency };
    if (item.site) p.extras = { ...(p.extras || {}), site: item.site };
    products.push(p);
  }
  if (!products.length) throw new Error("JSON 中未找到有效商品（需至少包含 title）");
  return products;
}