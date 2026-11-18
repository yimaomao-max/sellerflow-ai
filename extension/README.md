# SellerFlow AI — Chrome 采集插件（M1 MVP）

## 能力（v0.1.0）

- 支持 **AliExpress** 商品详情页（`/item/*`）
- 用户点击插件图标 → **主动采集** 标题、价格、部分描述、主图 URL
- 导出 **JSON 文件** → 在工作台 **「采集 JSON」** 导入

## 加载方式（开发）

1. Chrome → `chrome://extensions` → 开启「开发者模式」
2. 「加载已解压的扩展程序」→ 选择本目录 `extension/`
3. 打开任意 AliExpress 商品页 → 点击插件 → **下载 JSON**
4. 本地 `npm run dev` → 工作台 → **采集 JSON**

## 目录

```text
manifest.json       # MV3
content.js          # 页面内提取（仅响应 popup 消息，原则 P3）
background.js       # SW 占位
adapters/           # 站点适配器（与 content 逻辑将逐步合并）
popup/              # 采集预览与下载
```

## 下一步（M1 / M2）

- [ ] Alibaba、CJdropshipping 适配器
- [ ] Popup 内编辑字段 + 图片勾选
- [ ] `POST /api/capture` + 登录态（替代 JSON 文件）
- [ ] 失败上报与适配器版本号