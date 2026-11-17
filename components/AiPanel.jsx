"use client";

import { useState } from "react";
import { LANGUAGES, langLabel, detectTextLang } from "@/lib/product";

// AI 批量处理面板：标题生成 / 多语言翻译
export default function AiPanel({ targets, onClose, onRun, running }) {
  const [tab, setTab] = useState("title");
  const [titleLang, setTitleLang] = useState("en");
  const [targetLangs, setTargetLangs] = useState(["en", "ja"]);
  const [useMock, setUseMock] = useState(true);

  const toggleLang = (code) => {
    setTargetLangs((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  const sourceLang = detectTextLang(targets[0]?.title);

  const run = () => {
    if (tab === "translate" && !targetLangs.length) {
      return alert("请至少选择一种目标语言");
    }
    onRun({
      task: tab,
      titleLang: tab === "title" ? titleLang : undefined,
      targetLangs: tab === "translate" ? targetLangs.filter((c) => c !== sourceLang) : undefined,
      useMock,
    });
  };

  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && !running && onClose()}>
      <div className="modal">
        <div className="modal-head">
          <h3>AI 批量处理 · 已选 {targets.length} 个商品</h3>
          <button className="icon-btn" disabled={running} onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="tabs">
            <button className={`tab ${tab === "title" ? "active" : ""}`} onClick={() => setTab("title")}>
              AI 标题生成
            </button>
            <button className={`tab ${tab === "rewrite" ? "active" : ""}`} onClick={() => setTab("rewrite")}>
              描述重写
            </button>
            <button className={`tab ${tab === "translate" ? "active" : ""}`} onClick={() => setTab("translate")}>
              多语言翻译
            </button>
          </div>

          {tab === "title" ? (
            <div className="form-row">
              <label>生成语言</label>
              <select value={titleLang} onChange={(e) => setTitleLang(e.target.value)}>
                {LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>{l.label}</option>
                ))}
              </select>
              <div className="hint">
                将基于商品名、描述、类目与标签生成 SEO 优化标题（60–120 字符，含品牌与核心卖点）。
              </div>
            </div>
          ) : tab === "rewrite" ? (
            <div className="form-row">
              <label>描述重写说明</label>
              <div className="hint">
                将供应商描述重写为结构化英文文案（要点列表，保留原始规格数值，不虚构参数）。
                结果保存为「AI 生成」版本，可在编辑抽屉中与原始描述对照后采纳。
              </div>
            </div>
          ) : (
            <div className="form-row">
              <label>目标语言（可多选，自动跳过源语言 {sourceLang.toUpperCase()}）</label>
              <div className="lang-grid">
                {LANGUAGES.map((l) => {
                  const on = targetLangs.includes(l.code) && l.code !== sourceLang;
                  return (
                    <label key={l.code} className={`lang-check ${on ? "on" : ""}`}>
                      <input
                        type="checkbox"
                        checked={targetLangs.includes(l.code)}
                        onChange={() => toggleLang(l.code)}
                      />
                      {l.label}
                    </label>
                  );
                })}
              </div>
              <div className="hint">翻译结果将写入各语言的标题与描述字段，导出时会生成对应列。</div>
            </div>
          )}

          <div className="form-row">
            <label className="lang-check" style={{ display: "inline-flex" }}>
              <input type="checkbox" checked={useMock} onChange={(e) => setUseMock(e.target.checked)} />
              使用模拟模式
            </label>
            <div className="hint">
              模拟模式无需 API Key，使用内置规则生成结果，便于快速体验；取消勾选后将在「设置」中使用
              OpenAI 兼容接口真实生成。可在设置中配置 Base URL / API Key / 模型。
            </div>
          </div>
        </div>
        <div className="modal-foot">
          <span className="progress-note" style={{ marginRight: "auto" }}>
            {running ? "处理中…" : `共 ${targets.length} 个商品待处理`}
          </span>
          <button disabled={running} onClick={onClose}>取消</button>
          <button className="btn-primary" disabled={running} onClick={run}>
            {running && <span className="spinner" />}
            {running ? "处理中" : `开始${tab === "title" ? "生成" : tab === "rewrite" ? "重写" : "翻译"}`}
          </button>
        </div>
      </div>
    </div>
  );
}
