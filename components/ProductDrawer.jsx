"use client";

import { LANGUAGES, langLabel } from "@/lib/product";

// 字段级「原始 | AI 生成 | 当前」对照（PRD 原则 P1：原始数据不可变，人工采纳）
function CompareField({ label, source, ai, current, onAdopt, onRevert }) {
  return (
    <div className="compare-field">
      <div className="compare-label">{label}</div>
      <div className="compare-grid">
        <div className="compare-col">
          <div className="compare-col-head">原始</div>
          <div className="compare-text">{source || "（无）"}</div>
        </div>
        <div className="compare-col ai">
          <div className="compare-col-head">AI 生成</div>
          <div className="compare-text">{ai}</div>
          <button className="btn-sm" onClick={onAdopt}>采纳 AI</button>
        </div>
        <div className="compare-col">
          <div className="compare-col-head">当前</div>
          <div className="compare-text">{current || "（无）"}</div>
          <button className="btn-sm" onClick={onRevert}>恢复原始</button>
        </div>
      </div>
    </div>
  );
}

// 行详情抽屉：完整编辑主字段与各语言翻译
export default function ProductDrawer({ product, issues, onChange, onClose }) {
  if (!product) return null;

  const set = (field, val) => onChange(product.id, { [field]: val });
  const setTranslation = (code, field, val) =>
    onChange(product.id, {
      translations: {
        ...product.translations,
        [code]: { ...(product.translations?.[code] || {}), [field]: val },
      },
    });

  const prodIssues = issues.filter((i) => i.productId === product.id);
  const usedLangs = Object.keys(product.translations || {}).filter(
    (c) => product.translations[c]?.title || product.translations[c]?.description
  );

  return (
    <>
      <div className="drawer-overlay" onClick={onClose} />
      <div className="drawer">
        <div className="modal-head">
          <h3>编辑商品</h3>
          <button className="icon-btn" onClick={onClose}>✕</button>
        </div>
        <div className="drawer-body">
          {prodIssues.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              {prodIssues.map((i, idx) => (
                <div key={idx} className={`issue-item ${i.level}`} style={{ marginBottom: 4 }}>
                  <span className={`issue-dot ${i.level}`} />
                  <span>{i.msg}</span>
                </div>
              ))}
            </div>
          )}

          <div className="form-row">
            <label>商品标题</label>
            <input value={product.title} onChange={(e) => set("title", e.target.value)} />
            <div className="hint">{product.title.length} / 255 字符 · 来源: {product.titleSource === "ai" ? "AI 生成" : "手动"}</div>
          </div>
          <div className="form-row">
            <label>商品描述</label>
            <textarea rows={5} style={{ width: "100%", resize: "vertical" }} value={product.description} onChange={(e) => set("description", e.target.value)} />
          </div>

          {(product.aiTitle || product.aiDescription) && (
            <div className="compare-box">
              <div className="compare-title">原始 | AI 生成 | 当前 对照</div>
              {product.aiTitle && (
                <CompareField
                  label="标题"
                  source={product.sourceTitle}
                  ai={product.aiTitle}
                  current={product.title}
                  onAdopt={() => { set("title", product.aiTitle); set("titleSource", "ai"); }}
                  onRevert={() => set("title", product.sourceTitle || "")}
                />
              )}
              {product.aiDescription && (
                <CompareField
                  label="描述"
                  source={product.sourceDescription}
                  ai={product.aiDescription}
                  current={product.description}
                  onAdopt={() => set("description", product.aiDescription)}
                  onRevert={() => set("description", product.sourceDescription || "")}
                />
              )}
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div className="form-row">
              <label>价格</label>
              <input value={product.price} onChange={(e) => set("price", e.target.value)} />
            </div>
            <div className="form-row">
              <label>原价（划线价）</label>
              <input value={product.compareAtPrice} onChange={(e) => set("compareAtPrice", e.target.value)} />
            </div>
            <div className="form-row">
              <label>SKU</label>
              <input value={product.sku} onChange={(e) => set("sku", e.target.value)} />
            </div>
            <div className="form-row">
              <label>状态</label>
              <select value={product.status} onChange={(e) => set("status", e.target.value)}>
                <option value="draft">draft</option>
                <option value="active">active</option>
                <option value="archived">archived</option>
              </select>
            </div>
            <div className="form-row">
              <label>品牌 / 供应商</label>
              <input value={product.vendor} onChange={(e) => set("vendor", e.target.value)} />
            </div>
            <div className="form-row">
              <label>类目</label>
              <input value={product.category} onChange={(e) => set("category", e.target.value)} />
            </div>
            <div className="form-row">
              <label>标签（逗号分隔）</label>
              <input value={product.tags} onChange={(e) => set("tags", e.target.value)} />
            </div>
            <div className="form-row">
              <label>Handle（URL 路径）</label>
              <input value={product.handle} onChange={(e) => set("handle", e.target.value)} />
            </div>
          </div>

          <h4 style={{ margin: "18px 0 8px", fontSize: 13 }}>多语言翻译</h4>
          {!usedLangs.length && <div className="hint" style={{ marginBottom: 8 }}>暂无翻译，可在表格工具栏使用「AI 翻译」批量生成。</div>}
          {usedLangs.map((code) => (
            <div key={code} style={{ border: "1px solid var(--border)", borderRadius: 10, padding: 12, marginBottom: 10 }}>
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8 }}>{langLabel(code)}</div>
              <input
                style={{ width: "100%", marginBottom: 8 }}
                placeholder="翻译后的标题"
                value={product.translations[code]?.title || ""}
                onChange={(e) => setTranslation(code, "title", e.target.value)}
              />
              <textarea
                rows={3}
                style={{ width: "100%", resize: "vertical" }}
                placeholder="翻译后的描述"
                value={product.translations[code]?.description || ""}
                onChange={(e) => setTranslation(code, "description", e.target.value)}
              />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
