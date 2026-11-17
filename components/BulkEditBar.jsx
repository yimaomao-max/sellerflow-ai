"use client";

import { useState } from "react";
import { LANGUAGES } from "@/lib/product";

const FIELDS = [
  { key: "title", label: "标题" },
  { key: "description", label: "描述" },
  { key: "price", label: "价格" },
  { key: "compareAtPrice", label: "原价" },
  { key: "sku", label: "SKU" },
  { key: "vendor", label: "品牌/供应商" },
  { key: "category", label: "类目" },
  { key: "tags", label: "标签" },
  { key: "status", label: "状态" },
];

// 批量字段编辑工具条（针对选中行）
export default function BulkEditBar({ count, onApply, onClear, onOpenAi }) {
  const [op, setOp] = useState("set");
  const [field, setField] = useState("title");
  const [value, setValue] = useState("");
  const [find, setFind] = useState("");
  const [replace, setReplace] = useState("");
  const [lang, setLang] = useState("en");

  const needsValue = ["set", "prefix", "suffix"].includes(op);
  const needsFind = op === "replace";

  const apply = () => {
    if (needsValue && !value) return alert("请输入内容");
    if (needsFind && !find) return alert("请输入查找内容");
    onApply({ op, field, value, find, replace, lang });
    setValue("");
    setFind("");
    setReplace("");
  };

  return (
    <div className="bulk-bar">
      <span className="label">已选 {count} 项</span>
      <select value={op} onChange={(e) => setOp(e.target.value)}>
        <option value="set">设置为</option>
        <option value="replace">查找替换</option>
        <option value="prefix">添加前缀</option>
        <option value="suffix">添加后缀</option>
        <option value="upper">转大写</option>
        <option value="lower">转小写</option>
        <option value="trim">去除首尾空格</option>
        <option value="clear">清空字段</option>
        <option value="clearTranslation">清空某语言翻译</option>
      </select>

      {op === "clearTranslation" ? (
        <select value={lang} onChange={(e) => setLang(e.target.value)}>
          {LANGUAGES.map((l) => (
            <option key={l.code} value={l.code}>{l.label}</option>
          ))}
        </select>
      ) : (
        <select value={field} onChange={(e) => setField(e.target.value)}>
          {FIELDS.map((f) => (
            <option key={f.key} value={f.key}>{f.label}</option>
          ))}
        </select>
      )}

      {needsFind && (
        <input placeholder="查找…" value={find} onChange={(e) => setFind(e.target.value)} style={{ width: 120 }} />
      )}
      {needsFind && (
        <input placeholder="替换为…" value={replace} onChange={(e) => setReplace(e.target.value)} style={{ width: 120 }} />
      )}
      {needsValue && (
        <input
          placeholder={field === "status" ? "active / draft" : "输入内容…"}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          style={{ width: 160 }}
        />
      )}

      <button className="btn-primary" onClick={apply}>应用</button>
      <button onClick={onOpenAi}>🤖 AI 处理选中项</button>
      <button style={{ marginLeft: "auto" }} onClick={onClear}>取消选择</button>
    </div>
  );
}
