# SellerFlow AI — Chrome 采集插件（M1）

## v0.2.0 能力

- AliExpress 商品详情页 `/item/*` 采集
- Popup：**字段可编辑**、**图片多选**（主图标记）、变体数量提示
- **发送到工作台**：向已打开的 `localhost:3000`（可配置）注入商品
- **下载 JSON**：与工作台「采集 JSON」导入兼容

## 安装（开发）

1. Chrome → `chrome://extensions` → 开发者模式
2. **加载已解压的扩展程序** → 选择本目录 `extension/`
3. 本地 `npm run dev` 打开工作台
4. 打开 AliExpress 商品页 → 点击插件图标 → **发送到工作台**

## 配置

插件 → **设置**（或右键扩展选项）→ 填写工作台 URL（如 `https://your-app.vercel.app`）。

> 线上域名需在 `manifest.json` 的 `host_permissions` 中增加对应 origin，并重新加载扩展。

## 流程

```text
商品页 → Capture → 编辑/选图 → 发送到工作台 → AI / 加价 / 校验 / 导出
```

## 目录

```text
manifest.json
content.js          # DOM 提取
popup/              # 预览 UI
options.html        # 工作台 URL
adapters/           # 站点适配（逐步与 content 合并）
```

## 路线图

- [ ] Alibaba / CJ 适配器
- [ ] `optional_host_permissions` + 动态授权线上域名
- [ ] `POST /api/capture` + 登录（M2，替代仅注入 localStorage）