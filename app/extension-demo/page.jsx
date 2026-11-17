"use client";

import { useState } from "react";
import Link from "next/link";
import { emptyProduct, guessHandle } from "@/lib/product";

const LS_KEY = "sellerflow.products.v1";

// 模拟浏览器插件采集弹窗（对应界面建议 1）
// 真实插件为独立 MV3 工程（见 docs/MVP-TASK-LIST.md M1），此页面用于演示采集预览交互与数据流入工作台。
const COLORS = [
  { name: "黑色", css: "#1f2430" },
  { name: "白色", css: "#f4f5f7" },
  { name: "藏青", css: "#2c3e6b" },
  { name: "灰色", css: "#9aa0ab" },
  { name: "粉色", css: "#e8a7bd" },
];
const SIZES = ["XS", "S", "M", "L", "XL", "XXL"];
const IMAGES = ["👕", "🧍", "🧵", "📦"];

export default function ExtensionDemo() {
  const [title, setTitle] = useState("T-Shirt Coton Premium Unisexe");
  const [price, setPrice] = useState("19.99");
  const [currency, setCurrency] = useState("EUR");
  const [origPrice, setOrigPrice] = useState("29.99");
  const [selImages, setSelImages] = useState([0, 1]);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const detected = /t-?shirt|shirt/i.test(title);

  const toggleImage = (i) =>
    setSelImages((prev) => (prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]));

  const send = () => {
    setError("");
    if (!title.trim()) return setError("标题未识别，请手动填写（PRD F1.2）");
    if (!detected) return setError("当前页面不是受支持的商品详情页（模拟演示）");
    if (!selImages.length) return setError("请至少选择 1 张图片");

    let list = [];
    try {
      list = JSON.parse(localStorage.getItem(LS_KEY) || "[]");
    } catch {}
    const desc =
      "Premium cotton unisex T-shirt. Soft breathable fabric, pre-shrunk, available in multiple colors and sizes. " +
      "Supplier price " + price + " " + currency + ", original listed at " + origPrice + ".";
    const p = emptyProduct({
      title: title.trim(),
      description: desc,
      price: (parseFloat(price) * 6.4).toFixed(2), // 演示：粗略换算人民币成本
      compareAtPrice: "",
      sku: "TSH-COT-001-BLK-M",
      vendor: "CottonLab",
      category: "Apparel",
      tags: "T恤,棉质,基础款",
      status: "draft",
    });
    p.extras = { "Source URL": "https://aliexpress.com/item/1005006xxxx.html", Currency: currency };
    localStorage.setItem(LS_KEY, JSON.stringify([...list, p]));
    setSent(true);
  };

  return (
    <div className="ext-page">
      <div className="ext-topbar">
        <Link href="/" style={{ color: "#c7d2fe" }}>← 返回工作台</Link>
        <span className="ext-note">模拟 Chrome 插件 · 真实插件为 MV3 独立工程</span>
      </div>

      <div className="ext-popup">
        <div className="ext-head">
          <span className="logo-badge">SF</span>
          <b>SellerFlow AI</b>
          <span className={`ext-badge ${detected ? "on" : "off"}`}>
            {detected ? "已识别：aliexpress.com" : "未识别页面"}
          </span>
        </div>

        {sent ? (
          <div className="ext-sent">
            <div style={{ fontSize: 40 }}>✅</div>
            <h3>已发送到工作台</h3>
            <p className="ext-note">商品已保存原始数据，去工作台进行 AI 整理、变体处理与价格计算。</p>
            <Link href="/"><button className="btn-primary">打开工作台 →</button></Link>
            <button onClick={() => setSent(false)}>再采集一个</button>
          </div>
        ) : (
          <>
            <div className="ext-product">
              <div className="ext-img">👕</div>
              <div className="ext-fields">
                <label>商品标题（可修改）</label>
                <input value={title} onChange={(e) => setTitle(e.target.value)} />
                <div className="ext-row">
                  <div>
                    <label>售价</label>
                    <input value={price} onChange={(e) => setPrice(e.target.value)} style={{ width: 80 }} />
                  </div>
                  <div>
                    <label>原价</label>
                    <input value={origPrice} onChange={(e) => setOrigPrice(e.target.value)} style={{ width: 80 }} />
                  </div>
                  <div>
                    <label>币种</label>
                    <select value={currency} onChange={(e) => setCurrency(e.target.value)} style={{ width: 76 }}>
                      <option>EUR</option><option>USD</option><option>CNY</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="ext-section">
              <div className="ext-section-title">自动检测 <span className="ext-auto">Automatic</span></div>
              <div className="ext-chips">
                {COLORS.map((c) => (
                  <span key={c.name} className="ext-chip">
                    <i style={{ background: c.css }} />{c.name}
                  </span>
                ))}
              </div>
              <div className="ext-chips" style={{ marginTop: 6 }}>
                {SIZES.map((s) => (
                  <span key={s} className="ext-chip size">{s}</span>
                ))}
              </div>
              <div className="ext-note" style={{ marginTop: 8 }}>
                12 个变体已识别（颜色 × 尺码），含 SKU 与价差 · 发送后可在工作台标准化
              </div>
            </div>

            <div className="ext-section">
              <div className="ext-section-title">选择图片（{selImages.length}/{IMAGES.length}）</div>
              <div className="ext-imgs">
                {IMAGES.map((em, i) => (
                  <button
                    key={i}
                    className={`ext-img-cell ${selImages.includes(i) ? "on" : ""}`}
                    onClick={() => toggleImage(i)}
                  >
                    <span>{em}</span>
                    {selImages.includes(i) && <b>{selImages.indexOf(i) === 0 ? "主图" : selImages.indexOf(i) + 1}</b>}
                  </button>
                ))}
              </div>
            </div>

            {error && <div className="ext-error">{error}</div>}

            <div className="ext-foot">
              <span className="ext-note">本月额度：9/10 次采集 · Free</span>
              <div>
                <button onClick={() => setSent(false)} disabled={!sent}>取消</button>
                <button className="btn-primary" onClick={send}>发送到工作台</button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
