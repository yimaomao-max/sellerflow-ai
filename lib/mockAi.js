import { hasCJK, detectTextLang } from "./product";

// ===== 模拟 AI（无 API Key 时的降级实现，便于离线演示）=====

const EN_ZH = {
  stainless: "不锈钢", steel: "钢", thermal: "保温", coffee: "咖啡", cup: "杯", mug: "马克杯",
  vacuum: "真空", insulated: "隔热", bottle: "水瓶", lid: "杯盖", leakproof: "防漏",
  wireless: "无线", bluetooth: "蓝牙", earbuds: "耳机", headphones: "头戴耳机", noise: "降噪",
  cancelling: "降噪", waterproof: "防水", charging: "充电", case: "盒", pro: "专业版",
  yoga: "瑜伽", mat: "垫", thick: "加厚", nonslip: "防滑", anti: "防", slip: "滑",
  tpe: "TPE", strap: "绑带", fitness: "健身", kitchen: "厨房", dining: "餐具",
  electronics: "电子产品", sports: "运动", home: "家居", car: "车载", office: "办公",
  portable: "便携", mini: "迷你", premium: "高端", durable: "耐用", ecofriendly: "环保",
};
const ZH_EN = Object.fromEntries(Object.entries(EN_ZH).map(([k, v]) => [v, k]));

function mockTranslateText(text, target) {
  const dict = target === "zh" ? EN_ZH : ZH_EN;
  let out = String(text || "");
  for (const [k, v] of Object.entries(dict)) {
    out = out.replace(new RegExp(k, "gi"), v);
  }
  if (!out.trim()) return "";
  return target === "zh" ? `${out}（模拟翻译）` : `${out} (mock)`;
}

function mockTitle(p, targetLang) {
  const cat = p.category || "Essentials";
  const vendor = p.vendor || "OurBrand";
  const feature = (p.tags || "").split(/[,，]/)[0] || "Premium Quality";
  const specs = (p.description || "").match(/[\d.]+\s*(ml|mm|inch|英寸|小时|hour|h\b)/i)?.[0] || "";
  const base = p.title || feature;
  if (targetLang === "zh") {
    return `${vendor} ${base}${specs ? " " + specs : ""} | ${cat} 精选 品质保障`;
  }
  return `${vendor} ${base} — ${feature}${specs ? " " + specs.trim() : ""} | ${cat} Essentials`;
}

function mockRewriteDescription(p) {
  const cat = p.category || "general";
  const tags = (p.tags || "").split(/[,，]/).filter(Boolean);
  const firstSentence = (p.description || "").split(/[。.！!？?\n]/)[0] || p.title || "";
  return [
    `Why you'll love it`,
    `• ${firstSentence || "Thoughtfully designed for everyday use"}`,
    tags.length ? `• Style: ${tags.slice(0, 3).join(" / ")}` : `• Category: ${cat}`,
    `• Quality checked before shipping`,
    `Care & specs preserved from the supplier — verify before publishing. (mock rewrite)`,
  ].join("\n");
}

export function mockGenerate(payload) {
  const { task, products, targetLangs = [], titleLang = "en" } = payload;
  const results = products.map((p) => {
    if (task === "title") {
      return { id: p.id, title: mockTitle(p, titleLang) };
    }
    if (task === "rewrite") {
      return { id: p.id, description: mockRewriteDescription(p) };
    }
    // translate
    const translations = {};
    for (const code of targetLangs) {
      const srcTitle = p.translations?.[code]?.title || p.title;
      const srcDesc = p.translations?.[code]?.description || p.description;
      translations[code] = {
        title: mockTranslateText(srcTitle, code),
        description: mockTranslateText(srcDesc, code),
      };
    }
    return { id: p.id, translations };
  });
  return { results, mock: true };
}

// ===== 真实 LLM 调用（OpenAI 兼容接口）=====

function buildPrompt(payload) {
  const { task, products, targetLangs = [], titleLang = "en" } = payload;

  if (task === "title") {
    const items = products.map((p, i) => ({
      i,
      title: p.title,
      description: (p.description || "").slice(0, 300),
      category: p.category,
      tags: p.tags,
      vendor: p.vendor,
    }));
    return {
      system:
        "You are an expert cross-border e-commerce copywriter for Shopify stores. " +
        `Generate an SEO-optimized product title in ${titleLang} for each product. ` +
        "Rules: 60-120 characters, include brand (if any), core keywords, key spec/feature. No ALL CAPS. No quotes. " +
        'Respond ONLY with JSON: {"results":[{"i":number,"title":"string"}]}',
      user: JSON.stringify({ products: items }),
    };
  }

  if (task === "rewrite") {
    const items = products.map((p, i) => ({
      i,
      title: p.title,
      description: (p.description || "").slice(0, 800),
      category: p.category,
      tags: p.tags,
    }));
    return {
      system:
        "You are an e-commerce listing copywriter. Rewrite each supplier product description into store-ready English copy. " +
        "Rules: 80-150 words, structured with bullet points, keep all numeric specs unchanged, do NOT invent facts, " +
        "start with a 'Why you'll love it' section. " +
        'Respond ONLY with JSON: {"results":[{"i":number,"description":"string"}]}',
      user: JSON.stringify({ products: items }),
    };
  }

  const items = products.map((p, i) => ({
    i,
    title: p.title,
    description: (p.description || "").slice(0, 500),
  }));
  return {
    system:
      "You are a professional e-commerce translator. Translate each product title and description into the target languages, " +
      "keeping product terminology natural for local shoppers. Keep numbers/specs unchanged. " +
      `Target languages: ${targetLangs.join(", ")}. ` +
      'Respond ONLY with JSON: {"results":[{"i":number,"translations":{"<lang>":{"title":"...","description":"..."}}}]}',
    user: JSON.stringify({ products: items }),
  };
}

export async function callLLM(config, payload) {
  const { system, user } = buildPrompt(payload);
  const baseUrl = (config.baseUrl || "https://api.openai.com/v1").replace(/\/+$/, "");
  const model = config.model || "gpt-4o-mini";

  const resp = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.7,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    throw new Error(`LLM 接口返回 ${resp.status}: ${text.slice(0, 300)}`);
  }
  const data = await resp.json();
  const content = data.choices?.[0]?.message?.content || "";
  const jsonText = content.replace(/```json|```/g, "").trim();
  let parsed;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    const m = jsonText.match(/\{[\s\S]*\}/);
    if (!m) throw new Error("LLM 返回内容无法解析为 JSON");
    parsed = JSON.parse(m[0]);
  }
  return { results: parsed.results || [], mock: false };
}
