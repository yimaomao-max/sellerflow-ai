"use client";

import { useMemo, useState } from "react";
import { ExportIssuesButton } from "./IoButtons";

// 发布前检查面板（对应界面建议 4：评分 + 检查清单）
export default function ValidationPanel({ result, products, onOpenProduct, onClose }) {
  const [selectedId, setSelectedId] = useState(null);
  const scores = result.productScores;

  const sorted = useMemo(() => {
    return products
      .map((p) => ({ p, s: scores.get(p.id) || { score: 100, checks: [] } }))
      .sort((a, b) => a.s.score - b.s.score);
  }, [products, scores]);

  const current =
    sorted.find(({ p }) => p.id === selectedId) || sorted[0] || null;

  const avg = sorted.length
    ? Math.round(sorted.reduce((acc, { s }) => acc + s.score, 0) / sorted.length)
    : 100;

  const scoreColor = (n) => (n >= 90 ? "ok" : n >= 70 ? "warn" : "err");

  const icon = (c) => {
    if (c.ok) return <span className="check-icon pass">✓</span>;
    if (c.level === "err") return <span className="check-icon fail">✕</span>;
    if (c.level === "warn") return <span className="check-icon warn">!</span>;
    return <span className="check-icon info">ⓘ</span>;
  };

  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal wide">
        <div className="modal-head">
          <h3>发布前检查</h3>
          <button className="icon-btn" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          {/* 总览 */}
          <div className="check-summary">
            <div className={`score-badge ${scoreColor(avg)}`}>
              <span className="score-num">{avg}</span>
              <span className="score-label">平均分</span>
            </div>
            <div className="check-stats">
              <span className="chip ok">{sorted.filter(({ s }) => s.score === 100).length} 个商品可直接发布</span>
              <span className="chip err">{result.errs.length} 个错误</span>
              <span className="chip warn">{result.warns.length} 个警告</span>
            </div>
            <div style={{ marginLeft: "auto" }}>
              <ExportIssuesButton result={result} />
            </div>
          </div>

          {sorted.length === 0 ? (
            <div className="empty-state" style={{ padding: 32 }}>暂无商品</div>
          ) : (
            <>
              {/* 商品选择（按分数升序） */}
              <div className="form-row">
                <label>选择商品（问题多的排在前面）</label>
                <select value={current?.p.id || ""} onChange={(e) => setSelectedId(e.target.value)}>
                  {sorted.map(({ p, s }) => (
                    <option key={p.id} value={p.id}>
                      [{s.score} 分] {p.title || p.sku || p.id}
                    </option>
                  ))}
                </select>
              </div>

              {current && (
                <div className="check-detail">
                  <div className="check-detail-head">
                    <span className={`chip ${scoreColor(current.s.score)}`}>
                      <b>{current.s.score}</b>&nbsp;分
                    </span>
                    <b style={{ flex: 1, marginLeft: 8 }}>{current.p.title || "（无标题）"}</b>
                    <span className="jump" onClick={() => onOpenProduct(current.p.id)}>编辑 →</span>
                  </div>
                  <div className="check-list">
                    {current.s.checks.map((c) => (
                      <div key={c.key} className={`check-row ${c.ok ? "pass" : c.level}`}>
                        {icon(c)}
                        <span className="check-label">{c.label}</span>
                        <span className={`check-verdict ${c.ok ? "pass" : c.level}`}>
                          {c.ok ? "通过" : c.level === "err" ? "必须修复" : c.level === "warn" ? "建议优化" : "提示"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
        <div className="modal-foot">
          <span className="progress-note" style={{ marginRight: "auto" }}>
            评分规则：满分 100 · 错误 -15（标题/价格/SKU 唯一性）· 警告 -5（描述长度/SKU 等）
          </span>
          <button className="btn-primary" onClick={onClose}>知道了</button>
        </div>
      </div>
    </div>
  );
}
