"use client";

import { useState } from "react";
import { applyPriceRule, charmPrice } from "@/lib/pricing";

/** 选中商品的快速加价（成本 → 售价） */
export default function PricingQuickApply({ count, onApply }) {
  const [mode, setMode] = useState("multiply");
  const [value, setValue] = useState("2.5");
  const [charm, setCharm] = useState(true);

  if (!count) return null;

  const apply = () => {
    onApply((p) => {
      let next = applyPriceRule(p.price, { mode, value: Number(value) });
      if (charm && next) next = charmPrice(next);
      return next;
    });
  };

  return (
    <div className="pricing-quick">
      <span className="label">加价</span>
      <select value={mode} onChange={(e) => setMode(e.target.value)}>
        <option value="multiply">× 倍数</option>
        <option value="percent">+ 毛利 %</option>
        <option value="fixed">+ 固定金额</option>
      </select>
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        style={{ width: 56 }}
      />
      <label className="lang-check" style={{ display: "inline-flex", margin: 0 }}>
        <input type="checkbox" checked={charm} onChange={(e) => setCharm(e.target.checked)} />
        .99
      </label>
      <button type="button" className="btn-sm" onClick={apply}>
        应用到 {count} 项售价
      </button>
    </div>
  );
}