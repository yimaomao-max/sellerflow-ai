/**
 * 售价加价规则（M2 / F2.6 精简版）
 * @param {number|string} cost 成本或供应商价
 * @param {{ mode: 'multiply'|'percent'|'fixed'; value: number }} rule
 */
export function applyPriceRule(cost, rule) {
  const c = Number(cost);
  if (!Number.isFinite(c) || c < 0) return "";
  const v = Number(rule.value);
  if (!Number.isFinite(v)) return String(c);

  let price = c;
  switch (rule.mode) {
    case "multiply":
      price = c * v;
      break;
    case "percent":
      price = c * (1 + v / 100);
      break;
    case "fixed":
      price = c + v;
      break;
    default:
      price = c * v;
  }
  return (Math.round(price * 100) / 100).toFixed(2);
}

/** 心理定价：向上取整到 .99 */
export function charmPrice(price) {
  const n = Number(price);
  if (!Number.isFinite(n)) return "";
  const up = Math.ceil(n);
  return (up - 0.01).toFixed(2);
}