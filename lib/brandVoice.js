// 品牌语气预设 — 注入 AI system prompt（M3.6 精简版）

export const BRAND_VOICES = [
  {
    id: "neutral",
    label: "标准专业",
    labelEn: "Professional",
    hint: "清晰、可信，适合通用品类",
  },
  {
    id: "premium",
    label: "高端精品",
    labelEn: "Premium",
    hint: "偏奢华感，强调材质与工艺，句式精炼",
  },
  {
    id: "friendly",
    label: "亲和年轻",
    labelEn: "Friendly",
    hint: "口语化、有活力，适合生活消费品",
  },
  {
    id: "technical",
    label: "参数导向",
    labelEn: "Technical",
    hint: "突出规格、兼容性、数据，少形容词",
  },
];

export function getBrandVoice(id) {
  return BRAND_VOICES.find((v) => v.id === id) || BRAND_VOICES[0];
}

/** @returns {string} appended to LLM system prompts */
export function brandVoiceInstruction(voiceId) {
  const v = getBrandVoice(voiceId);
  switch (v.id) {
    case "premium":
      return (
        "Brand voice: premium and refined. Emphasize craftsmanship, materials, and exclusivity. " +
        "Avoid hype words like 'best ever'. Short, confident sentences."
      );
    case "friendly":
      return (
        "Brand voice: warm, conversational, youthful. Use you/your, light enthusiasm, everyday language. " +
        "Stay honest — no exaggerated claims."
      );
    case "technical":
      return (
        "Brand voice: spec-forward and precise. Lead with measurable facts, compatibility, and use cases. " +
        "Minimize marketing fluff; keep bullets data-dense."
      );
    default:
      return (
        "Brand voice: professional cross-border retail. Clear, trustworthy, SEO-aware. " +
        "Balance benefits with factual specs."
      );
  }
}