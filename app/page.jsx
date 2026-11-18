"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { emptyProduct, sampleProducts, LANGUAGES, langLabel, guessHandle } from "@/lib/product";
import { validateProducts } from "@/lib/validate";
import { ImportButton, ExportButton, ImportCaptureButton } from "@/components/IoButtons";
import AiPanel from "@/components/AiPanel";
import BulkEditBar from "@/components/BulkEditBar";
import ProductDrawer from "@/components/ProductDrawer";
import ValidationPanel from "@/components/ValidationPanel";
import SettingsModal from "@/components/SettingsModal";

const LS_KEY = "sellerflow.products.v1";
const LS_SETTINGS = "sellerflow.settings.v1";

const DEFAULT_SETTINGS = { baseUrl: "", apiKey: "", model: "", brandVoice: "neutral" };

export default function Home() {
  const [products, setProducts] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all"); // all | issues | clean
  const [aiOpen, setAiOpen] = useState(false);
  const [aiRunning, setAiRunning] = useState(false);
  const [aiTargets, setAiTargets] = useState([]);
  const [aiProgress, setAiProgress] = useState("");
  const [drawerId, setDrawerId] = useState(null);
  const [showValidation, setShowValidation] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [toasts, setToasts] = useState([]);
  const [demoBanner, setDemoBanner] = useState(false);
  const tableEndRef = useRef(null);

  // 初始化：读取 localStorage，空则载入示例数据
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) setProducts(JSON.parse(raw));
      else setProducts(sampleProducts());
      const s = localStorage.getItem(LS_SETTINGS);
      if (s) setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(s) });
    } catch {
      setProducts(sampleProducts());
    }
  }, []);

  useEffect(() => {
    fetch("/api/health")
      .then((r) => r.json())
      .then((h) => setDemoBanner(!!h.demo || !!h.forceMock))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (products.length) {
      try { localStorage.setItem(LS_KEY, JSON.stringify(products)); } catch {}
    }
  }, [products]);

  const toast = (msg, type = "ok") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, msg, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  };

  // ===== 校验 =====
  const validation = useMemo(() => validateProducts(products), [products]);

  // ===== 过滤 =====
  const filtered = useMemo(() => {
    const kw = search.trim().toLowerCase();
    return products.filter((p) => {
      if (kw && !`${p.title} ${p.sku} ${p.vendor} ${p.tags}`.toLowerCase().includes(kw)) return false;
      if (filterStatus === "issues" && !validation.productIdsWithErr.has(p.id)) return false;
      if (filterStatus === "clean" && validation.productIdsWithErr.has(p.id)) return false;
      return true;
    });
  }, [products, search, filterStatus, validation]);

  const rowIssues = useMemo(() => {
    const map = new Map();
    for (const i of validation.issues) {
      if (!map.has(i.productId)) map.set(i.productId, []);
      map.get(i.productId).push(i);
    }
    return map;
  }, [validation]);

  // ===== 基础操作 =====
  const updateProduct = (id, patch) => {
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  };

  const addProduct = () => {
    const p = emptyProduct();
    setProducts((prev) => [...prev, p]);
    setDrawerId(p.id);
  };

  const deleteSelected = () => {
    if (!selected.size) return;
    if (!confirm(`确定删除选中的 ${selected.size} 个商品？`)) return;
    setProducts((prev) => prev.filter((p) => !selected.has(p.id)));
    setSelected(new Set());
    toast(`已删除 ${selected.size} 个商品`);
  };

  const toggleSelectAll = () => {
    setSelected((prev) =>
      prev.size === filtered.length ? new Set() : new Set(filtered.map((p) => p.id))
    );
  };

  // ===== 批量编辑 =====
  const applyBulk = ({ op, field, value, find, replace, lang }) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (!selected.has(p.id)) return p;
        const next = { ...p };

        if (op === "clearTranslation") {
          const t = { ...(p.translations || {}) };
          delete t[lang];
          next.translations = t;
          return next;
        }

        if (field === "status") {
          if (op === "set") next.status = ["active", "draft", "archived"].includes(value.toLowerCase()) ? value.toLowerCase() : p.status;
          return next;
        }

        const cur = String(p[field] ?? "");
        switch (op) {
          case "set": next[field] = value; break;
          case "replace": next[field] = cur.split(find).join(replace); break;
          case "prefix": next[field] = value + cur; break;
          case "suffix": next[field] = cur + value; break;
          case "upper": next[field] = cur.toUpperCase(); break;
          case "lower": next[field] = cur.toLowerCase(); break;
          case "trim": next[field] = cur.trim(); break;
          case "clear": next[field] = ""; break;
          default: return p;
        }
        return next;
      })
    );
    toast(`已对 ${selected.size} 个商品执行批量操作`);
  };

  // ===== AI 处理 =====
  const openAi = (targets) => {
    if (!targets.length) return alert("请先选择商品");
    setAiTargets(targets);
    setAiOpen(true);
  };

  const runAi = async ({ task, titleLang = "en", targetLangs = [], useMock }) => {
    setAiRunning(true);
    const batch = aiTargets;
    try {
      let ok = 0;
      // 分批处理，每批 10 个
      for (let i = 0; i < batch.length; i += 10) {
        const chunk = batch.slice(i, i + 10);
        setAiProgress(`${Math.min(i + 10, batch.length)} / ${batch.length}`);
        const slim = chunk.map((p) => ({
          id: p.id, title: p.title, description: p.description,
          category: p.category, tags: p.tags, vendor: p.vendor,
          translations: p.translations,
        }));
        const resp = await fetch("/api/ai", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            task, products: slim, mock: useMock,
            titleLang, targetLangs,
            brandVoice: settings.brandVoice || "neutral",
            config: { ...settings, useMock: false },
          }),
        });
        const data = await resp.json();
        if (!resp.ok) throw new Error(data.error || "AI 请求失败");

        const byId = new Map(data.results.map((r) => [r.id ?? slim[r.i]?.id, r]));
        setProducts((prev) =>
          prev.map((p) => {
            const r = byId.get(p.id);
            if (!r) return p;
            if (task === "title" && r.title) {
              return {
                ...p,
                sourceTitle: p.sourceTitle || p.title,
                aiTitle: r.title,
                title: r.title,
                titleSource: "ai",
                handle: p.handle || guessHandle(r.title),
              };
            }
            if (task === "rewrite" && r.description) {
              return {
                ...p,
                sourceDescription: p.sourceDescription || p.description,
                aiDescription: r.description,
                description: r.description,
              };
            }
            if (task === "translate" && r.translations) {
              return { ...p, translations: { ...p.translations, ...r.translations } };
            }
            return p;
          })
        );
        ok += chunk.length;
      }
      const label =
        task === "title" ? "标题生成" : task === "rewrite" ? "描述重写" : "翻译";
      toast(`AI ${label}完成：${ok} 个商品`);
      setAiOpen(false);
    } catch (e) {
      toast(`AI 处理失败：${e.message}`, "err");
    } finally {
      setAiRunning(false);
      setAiProgress("");
    }
  };

  const drawerProduct = products.find((p) => p.id === drawerId) || null;

  return (
    <>
      <header className="app-header">
        <div className="logo">
          <span className="logo-badge">SF</span>
          SellerFlow <span style={{ color: "var(--text-3)", fontWeight: 400 }}>AI</span>
        </div>
        <div className="stat-chips">
          <span className="chip info"><b>{products.length}</b> 商品</span>
          <span className="chip err"><b>{validation.errs.length}</b> 错误</span>
          <span className="chip warn"><b>{validation.warns.length}</b> 警告</span>
          {validation.errs.length === 0 && products.length > 0 && (
            <span className="chip ok">✓ 可导出</span>
          )}
        </div>
        <div className="header-actions">
          <Link href="/welcome" style={{ textDecoration: "none" }}>
            <button type="button">关于</button>
          </Link>
          <ImportButton
            onImport={(data, msg) => {
              if (!data) return toast(msg, "err");
              setProducts((prev) => [...prev, ...data.products]);
              toast(msg);
            }}
          />
          <ImportCaptureButton
            onImport={(data, msg) => {
              if (!data) return toast(msg, "err");
              setProducts((prev) => [...prev, ...data.products]);
              toast(msg);
            }}
          />
          <ExportButton
            products={products}
            exportLangs={LANGUAGES.filter((l) =>
              products.some((p) => p.translations?.[l.code]?.title)
            ).map((l) => l.code)}
            onlyValid
            invalidIds={validation.productIdsWithErr}
          />
          <button onClick={() => setShowValidation(true)}>✓ 校验</button>
          <button onClick={() => setShowSettings(true)}>⚙ 设置</button>
        </div>
      </header>

      {demoBanner && (
        <div className="demo-banner">
          演示环境：AI 使用模拟模式。本地部署可配置 API Key；详见{" "}
          <a href="https://github.com/yimaomao-max/sellerflow-ai/issues/new/choose" target="_blank" rel="noreferrer">
            反馈 / 等候名单
          </a>
        </div>
      )}
      <main className="main">
        <div className="toolbar">
          <input
            type="search"
            placeholder="搜索标题 / SKU / 品牌 / 标签…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="all">全部商品</option>
            <option value="issues">仅显示有错误的</option>
            <option value="clean">仅显示无错误的</option>
          </select>
          <button onClick={addProduct}>＋ 新建商品</button>
          <button
            onClick={() =>
              openAi(
                selected.size
                  ? products.filter((p) => selected.has(p.id))
                  : filtered
              )
            }
          >
            🤖 AI 批量处理
          </button>
          <Link href="/extension-demo" style={{ textDecoration: "none" }}>
            <button>🧩 插件演示</button>
          </Link>
          <button className="btn-danger" disabled={!selected.size} onClick={deleteSelected}>
            删除选中
          </button>
          {aiRunning && (
            <span className="progress-note">AI 处理中… {aiProgress}</span>
          )}
        </div>

        <div className="table-card">
          {filtered.length === 0 ? (
            <div className="empty-state">
              <div style={{ fontSize: 36 }}>📦</div>
              <h3>还没有商品</h3>
              <p>导入 Shopify / 平台导出的 CSV，或手动创建商品开始使用。</p>
              <div className="actions">
                <ImportButton
                  onImport={(data, msg) => {
                    if (!data) return toast(msg, "err");
                    setProducts(data.products);
                    toast(msg);
                  }}
                />
                <button className="btn-primary" onClick={() => setProducts(sampleProducts())}>
                  载入示例数据
                </button>
              </div>
            </div>
          ) : (
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th style={{ width: 36 }}>
                      <input
                        type="checkbox"
                        checked={filtered.length > 0 && selected.size === filtered.length}
                        onChange={toggleSelectAll}
                      />
                    </th>
                    <th style={{ width: 24 }}></th>
                    <th style={{ minWidth: 260 }}>标题</th>
                    <th style={{ minWidth: 220 }}>描述</th>
                    <th style={{ width: 90 }}>价格</th>
                    <th style={{ width: 110 }}>SKU</th>
                    <th style={{ width: 64 }}>评分</th>
                    <th style={{ width: 120 }}>翻译</th>
                    <th style={{ width: 70 }}>状态</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p) => {
                    const issues = rowIssues.get(p.id) || [];
                    const hasErr = issues.some((i) => i.level === "err");
                    const translated = Object.keys(p.translations || {}).filter(
                      (c) => p.translations[c]?.title
                    );
                    return (
                      <tr
                        key={p.id}
                        className={`${hasErr ? "row-error" : ""} ${selected.has(p.id) ? "selected" : ""}`}
                      >
                        <td>
                          <input
                            type="checkbox"
                            checked={selected.has(p.id)}
                            onChange={(e) => {
                              const next = new Set(selected);
                              e.target.checked ? next.add(p.id) : next.delete(p.id);
                              setSelected(next);
                            }}
                          />
                        </td>
                        <td>
                          {issues.length > 0 && (
                            <span
                              className={`issue-dot ${hasErr ? "err" : "warn"}`}
                              title={issues.map((i) => i.msg).join("\n")}
                              style={{ display: "inline-block" }}
                            />
                          )}
                        </td>
                        <td>
                          <input
                            className="cell-input"
                            value={p.title}
                            placeholder="商品标题…"
                            onChange={(e) => updateProduct(p.id, { title: e.target.value })}
                          />
                          {p.titleSource === "ai" && <span className="tag tag-ai">AI</span>}
                        </td>
                        <td>
                          <span
                            className="cell-desc"
                            onClick={() => setDrawerId(p.id)}
                            title="点击打开详情编辑"
                          >
                            {p.description || <i style={{ color: "var(--text-3)" }}>（空）点击补充</i>}
                          </span>
                        </td>
                        <td>
                          <input
                            className="cell-input"
                            value={p.price}
                            placeholder="0.00"
                            onChange={(e) => updateProduct(p.id, { price: e.target.value })}
                          />
                        </td>
                        <td>
                          <input
                            className="cell-input"
                            value={p.sku}
                            placeholder="SKU"
                            onChange={(e) => updateProduct(p.id, { sku: e.target.value })}
                          />
                        </td>
                        <td>
                          {(() => {
                            const s = validation.productScores.get(p.id)?.score ?? 100;
                            const cls = s >= 90 ? "ok" : s >= 70 ? "warn" : "err";
                            return (
                              <span
                                className={`chip ${cls}`}
                                title="点击查看发布前检查"
                                style={{ cursor: "pointer" }}
                                onClick={() => { setDrawerId(p.id); }}
                              >
                                <b>{s}</b>
                              </span>
                            );
                          })()}
                        </td>
                        <td>
                          <div className="lang-pills">
                            {translated.length ? (
                              translated.map((c) => (
                                <span key={c} className="lang-pill" title={langLabel(c)}>{c}</span>
                              ))
                            ) : (
                              <span style={{ color: "var(--text-3)", fontSize: 12 }}>—</span>
                            )}
                          </div>
                        </td>
                        <td>
                          <select
                            className="cell-input"
                            style={{ cursor: "pointer" }}
                            value={p.status}
                            onChange={(e) => updateProduct(p.id, { status: e.target.value })}
                          >
                            <option value="draft">draft</option>
                            <option value="active">active</option>
                            <option value="archived">archived</option>
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {selected.size > 0 && (
          <BulkEditBar
            count={selected.size}
            onApply={applyBulk}
            onClear={() => setSelected(new Set())}
            onOpenAi={() => openAi(products.filter((p) => selected.has(p.id)))}
          />
        )}
        <div ref={tableEndRef} />
      </main>

      {aiOpen && (
        <AiPanel
          targets={aiTargets}
          running={aiRunning}
          onClose={() => setAiOpen(false)}
          onRun={runAi}
        />
      )}
      {showValidation && (
        <ValidationPanel
          result={validation}
          products={products}
          onOpenProduct={(id) => {
            setShowValidation(false);
            setDrawerId(id);
          }}
          onClose={() => setShowValidation(false)}
        />
      )}
      {showSettings && (
        <SettingsModal
          settings={settings}
          onClose={() => setShowSettings(false)}
          onSave={(s) => {
            setSettings(s);
            localStorage.setItem(LS_SETTINGS, JSON.stringify(s));
            setShowSettings(false);
            toast("AI 设置已保存");
          }}
        />
      )}
      <ProductDrawer
        product={drawerProduct}
        issues={validation.issues}
        onChange={updateProduct}
        onClose={() => setDrawerId(null)}
      />

      <div className="toast-wrap">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.type}`}>{t.msg}</div>
        ))}
      </div>
    </>
  );
}

