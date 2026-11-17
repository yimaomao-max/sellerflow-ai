import { hasCJK } from "./product";

// Shopify 场景校验 + 完整度评分（PRD F2.8）
// 评分：满分 100，Error -15 / Warning -5，下限 0

export function validateProducts(products) {
  const issues = []; // { productId, field, level: 'err'|'warn', msg }
  const titleCount = new Map();
  const skuMap = new Map();

  for (const p of products) {
    const label = p.title || p.sku || p.id;

    // 标题
    if (!p.title) {
      issues.push({ productId: p.id, field: "title", level: "err", msg: `[${label}] 缺少商品标题（必填）` });
    } else {
      if (p.title.length > 255) {
        issues.push({ productId: p.id, field: "title", level: "err", msg: `[${label}] 标题超过 255 字符（Shopify 上限），当前 ${p.title.length}` });
      } else if (p.title.length < 20) {
        issues.push({ productId: p.id, field: "title", level: "warn", msg: `[${label}] 标题偏短（${p.title.length} 字符），建议包含品牌+核心卖点+规格` });
      }
      const key = p.title.trim().toLowerCase();
      titleCount.set(key, (titleCount.get(key) || 0) + 1);
    }

    // 描述
    if (!p.description) {
      issues.push({ productId: p.id, field: "description", level: "warn", msg: `[${label}] 缺少商品描述，会影响转化与 SEO` });
    } else if (p.description.length < 30) {
      issues.push({ productId: p.id, field: "description", level: "warn", msg: `[${label}] 描述少于 30 字符，建议补充卖点、规格与使用场景` });
    }

    // 价格
    if (p.price === "" || p.price == null) {
      issues.push({ productId: p.id, field: "price", level: "err", msg: `[${label}] 缺少价格（必填）` });
    } else {
      const n = Number(p.price);
      if (Number.isNaN(n) || n < 0) {
        issues.push({ productId: p.id, field: "price", level: "err", msg: `[${label}] 价格不是有效数字: "${p.price}"` });
      } else if (n <= 0) {
        issues.push({ productId: p.id, field: "price", level: "warn", msg: `[${label}] 价格为 0，请确认` });
      }
    }
    if (p.compareAtPrice !== "" && p.compareAtPrice != null) {
      const c = Number(p.compareAtPrice);
      const pr = Number(p.price);
      if (Number.isNaN(c)) {
        issues.push({ productId: p.id, field: "compareAtPrice", level: "err", msg: `[${label}] 原价不是有效数字: "${p.compareAtPrice}"` });
      } else if (!Number.isNaN(pr) && c <= pr) {
        issues.push({ productId: p.id, field: "compareAtPrice", level: "warn", msg: `[${label}] 原价应高于售价` });
      }
    }

    // SKU
    if (!p.sku) {
      issues.push({ productId: p.id, field: "sku", level: "warn", msg: `[${label}] 缺少 SKU，建议补充便于库存管理` });
    } else {
      if (/\s/.test(p.sku)) {
        issues.push({ productId: p.id, field: "sku", level: "warn", msg: `[${label}] SKU 含空格: "${p.sku}"` });
      }
      if (skuMap.has(p.sku)) {
        issues.push({ productId: p.id, field: "sku", level: "err", msg: `[${label}] SKU 重复: "${p.sku}"（与 "${skuMap.get(p.sku)}" 冲突）` });
      } else {
        skuMap.set(p.sku, label);
      }
    }

    // handle
    if (!p.handle) {
      issues.push({ productId: p.id, field: "handle", level: "warn", msg: `[${label}] 缺少 handle（URL 路径），导出时会自动生成` });
    }

    // 翻译完整性
    for (const [code, t] of Object.entries(p.translations || {})) {
      if (!t.title && p.title) {
        issues.push({ productId: p.id, field: `translations.${code}`, level: "warn", msg: `[${label}] 缺少 ${code} 语言标题` });
      }
    }
  }

  // 重复标题（全局）
  for (const [key, count] of titleCount) {
    if (count > 1) {
      for (const p of products) {
        if (p.title && p.title.trim().toLowerCase() === key) {
          issues.push({ productId: p.id, field: "title", level: "warn", msg: `[${p.title}] 标题与其他 ${count - 1} 个商品重复` });
        }
      }
    }
  }

  // 重复 SKU 集合（供评分用）
  const skuSeen = new Map();
  for (const p of products) {
    if (!p.sku) continue;
    skuSeen.set(p.sku, (skuSeen.get(p.sku) || 0) + 1);
  }
  const dupSkuIds = new Set([...skuSeen.entries()].filter(([, n]) => n > 1).map(([s]) => s));

  // ===== 每个商品的检查清单与评分 =====
  const productScores = new Map(); // id -> { score, checks: [{key,label,ok,level}] }
  for (const p of products) {
    const titleLen = (p.title || "").trim().length;
    const descLen = (p.description || "").trim().length;
    const priceNum = p.price === "" || p.price == null ? NaN : Number(p.price);
    const translated = Object.keys(p.translations || {}).filter((c) => p.translations[c]?.title).length;

    const checks = [
      {
        key: "title",
        label: titleLen ? `标题长度：${titleLen} 字符` : "标题缺失",
        ok: titleLen > 0 && titleLen <= 255,
        level: "err",
      },
      {
        key: "titleQuality",
        label: titleLen < 20 ? "标题过短（建议 ≥ 20 字符）" : "标题质量达标",
        ok: titleLen >= 20,
        level: "warn",
        hide: titleLen === 0,
      },
      {
        key: "description",
        label: descLen ? `商品描述：${descLen} 字符` : "商品描述缺失",
        ok: descLen >= 30,
        level: "warn",
      },
      {
        key: "price",
        label: Number.isFinite(priceNum) ? `价格有效：${priceNum}` : "价格缺失或无效",
        ok: Number.isFinite(priceNum) && priceNum > 0,
        level: "err",
      },
      {
        key: "sku",
        label: p.sku ? `SKU：${p.sku}` : "SKU 缺失",
        ok: !!p.sku && !/\s/.test(p.sku),
        level: "warn",
      },
      {
        key: "skuUnique",
        label: p.sku ? "SKU 唯一性" : "（无 SKU，跳过唯一性检查）",
        ok: !p.sku || !dupSkuIds.has(p.sku),
        level: "err",
        hide: !p.sku,
      },
      {
        key: "translation",
        label: translated ? `多语言翻译：${translated} 种语言` : "多语言翻译：暂无（可选）",
        ok: true,
        level: "info",
      },
    ].filter((c) => !c.hide);

    const e = checks.filter((c) => !c.ok && c.level === "err").length;
    const w = checks.filter((c) => !c.ok && c.level === "warn").length;
    const score = Math.max(0, 100 - e * 15 - w * 5);
    productScores.set(p.id, { score, checks });
  }

  const errs = issues.filter((i) => i.level === "err");
  const warns = issues.filter((i) => i.level === "warn");
  const productIdsWithErr = new Set(errs.map((i) => i.productId));

  return { issues, errs, warns, productIdsWithErr, productScores };
}

export function issueStats(result) {
  const scores = [...result.productScores.values()].map((s) => s.score);
  const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 100;
  return {
    total: result.issues.length,
    errs: result.errs.length,
    warns: result.warns.length,
    avgScore: avg,
    valid: result.issues.length === 0,
    exportable: result.errs.length === 0,
  };
}
