# 路线图执行状态

> 与运营规划同步更新。最后更新：M1 v0.2 + M2 加价工具。

## 已完成

| 项 | 说明 |
| --- | --- |
| P0 CI | `.github/workflows/ci.yml` — push/PR 跑 `npm run build` |
| P0 反馈 | Issue 模板（Bug / Feature） |
| P0 落地页 | `/welcome` — CTA、等候名单链到 GitHub Issues |
| P0 演示模式 | `SELLERFLOW_FORCE_MOCK`、`NEXT_PUBLIC_SELLERFLOW_DEMO` + `/api/health` |
| P0 品牌语气 | 设置内 4 种预设 → AI system prompt |
| M1 插件骨架 | `extension/` MV3 + AliExpress content 提取 |
| M1 桥接 | 工作台 **采集 JSON** 导入（`lib/captureImport.js`） |
| M1 T1.8 | 插件可编辑 popup + 图片勾选 + **发送到工作台** |
| M2 加价 | `lib/pricing.js` + 选中商品快速加价条 |
| 部署 | `vercel.json` 就绪 |

## 进行中 / 下一步

| 优先级 | 任务 | 里程碑 |
| --- | --- | --- |
| 1 | Vercel 部署 + README Demo 链接 | P0 |
| 2 | Supabase Auth + capture 持久化 | M2 |
| 3 | Alibaba / CJ 适配器 | M1 |
| 4 | GitHub Actions CI（需 workflow 授权） | P0 |
| 5 | Stripe + 额度 | M5 |

## 部署提示（Vercel）

```env
SELLERFLOW_FORCE_MOCK=1
NEXT_PUBLIC_SELLERFLOW_DEMO=1
```

勿在公开 Demo 配置真实 `OPENAI_API_KEY`。