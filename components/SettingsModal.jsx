"use client";

import { useState } from "react";
import { BRAND_VOICES } from "@/lib/brandVoice";

// AI 设置：OpenAI 兼容接口配置
export default function SettingsModal({ settings, onSave, onClose }) {
  const [form, setForm] = useState(settings);

  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-head">
          <h3>AI 设置</h3>
          <button className="icon-btn" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="form-row">
            <label>API Base URL（OpenAI 兼容）</label>
            <input
              value={form.baseUrl}
              placeholder="https://api.openai.com/v1"
              onChange={(e) => setForm({ ...form, baseUrl: e.target.value })}
            />
            <div className="hint">兼容 OpenAI / Azure OpenAI 代理 / DeepSeek / 通义千问等任意 /chat/completions 接口。</div>
          </div>
          <div className="form-row">
            <label>API Key</label>
            <input
              type="password"
              value={form.apiKey}
              placeholder="sk-..."
              onChange={(e) => setForm({ ...form, apiKey: e.target.value })}
            />
            <div className="hint">
              仅保存在浏览器 localStorage，请求经本机 Next.js 服务端转发。留空则使用环境变量
              OPENAI_API_KEY（如已配置）。
            </div>
          </div>
          <div className="form-row">
            <label>模型</label>
            <input
              value={form.model}
              placeholder="gpt-4o-mini"
              onChange={(e) => setForm({ ...form, model: e.target.value })}
            />
          </div>
          <div className="form-row">
            <label>品牌语气（AI 标题 / 描述 / 翻译）</label>
            <select
              value={form.brandVoice || "neutral"}
              onChange={(e) => setForm({ ...form, brandVoice: e.target.value })}
            >
              {BRAND_VOICES.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.label} — {v.hint}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="modal-foot">
          <button onClick={onClose}>取消</button>
          <button className="btn-primary" onClick={() => onSave(form)}>保存</button>
        </div>
      </div>
    </div>
  );
}
