// 商品数据模型与通用工具

let idCounter = 1;
export function genId() {
  return `p_${Date.now().toString(36)}_${(idCounter++).toString(36)}`;
}

export function emptyProduct(overrides = {}) {
  return {
    id: genId(),
    handle: "",
    title: "",
    description: "",
    price: "",
    compareAtPrice: "",
    sku: "",
    vendor: "",
    category: "",
    tags: "",
    status: "draft",
    translations: {}, // { zh: { title, description }, ja: {...} }
    titleSource: "manual", // manual | ai
    // 数据分层（PRD 原则 P1）：原始 / AI 生成 / 当前 三版本分离
    sourceTitle: "",
    sourceDescription: "",
    aiTitle: "",
    aiDescription: "",
    ...overrides,
  };
}

// CSV 常见表头 → 字段 自动映射
const HEADER_MAP = [
  [/^(title|name|product\s*name|商品标题|标题|品名)$/i, "title"],
  [/^(body|body_html|description|desc|描述|商品描述|详情)$/i, "description"],
  [/^(price|售价|价格|price\s*usd)$/i, "price"],
  [/^(compare\s*at\s*price|原价|划线价)$/i, "compareAtPrice"],
  [/^(sku|编码|货号)$/i, "sku"],
  [/^(vendor|品牌|供应商|厂商)$/i, "vendor"],
  [/^(category|type|类型|品类|类目)$/i, "category"],
  [/^(tags|tags?\/keywords|标签)$/i, "tags"],
  [/^(handle|url\s*handle|slug)$/i, "handle"],
  [/^(status|状态)$/i, "status"],
];

export function mapHeader(header) {
  const h = String(header || "").trim();
  for (const [re, field] of HEADER_MAP) if (re.test(h)) return field;
  return null;
}

export function guessHandle(title) {
  return String(title || "")
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

// 支持的语言（翻译目标）
export const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "zh", label: "简体中文" },
  { code: "ja", label: "日本語" },
  { code: "es", label: "Español" },
  { code: "de", label: "Deutsch" },
  { code: "fr", label: "Français" },
];

export function langLabel(code) {
  return LANGUAGES.find((l) => l.code === code)?.label || code;
}

export function detectTextLang(text) {
  if (!text) return "en";
  if (/[\u4e00-\u9fa5]/.test(text)) return "zh";
  if (/[\u3040-\u30ff]/.test(text)) return "ja";
  return "en";
}

export function hasCJK(text) {
  return /[\u4e00-\u9fff\u3040-\u30ff\uac00-\ud7af]/.test(text || "");
}

export function sampleProducts() {
  return [
    emptyProduct({
      title: "不锈钢保温咖啡杯 500ml",
      description: "双层真空不锈钢保温杯，保冷 24 小时 / 保温 12 小时，食品级 304 内胆，防漏杯盖，适合车载与办公场景。",
      price: "89.00",
      compareAtPrice: "119.00",
      sku: "CUP-ST-500",
      vendor: "ThermoHome",
      category: "Kitchen & Dining",
      tags: "保温杯,咖啡,车载",
      status: "draft",
    }),
    emptyProduct({
      title: "无线蓝牙耳机 Pro 降噪版",
      description: "主动降噪，蓝牙 5.3，单次续航 8 小时，配合充电盒总续航 32 小时，IPX5 防水，触控操作。",
      price: "199.00",
      sku: "EAR-BT-PRO",
      vendor: "SoundWave",
      category: "Electronics",
      tags: "耳机,降噪,蓝牙",
      status: "draft",
    }),
    emptyProduct({
      title: "瑜伽垫加厚防滑 TPE",
      description: "TPE 环保材质，10mm 加厚，双面防滑纹理，自带绑带，回弹支撑，适合瑜伽、健身、冥想。",
      price: "65.00",
      sku: "YOGA-TPE-10",
      vendor: "FitLife",
      category: "Sports",
      tags: "瑜伽垫,健身,防滑",
      status: "draft",
    }),
  ];
}
