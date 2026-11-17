# SellerFlow AI MVP 开发任务清单

> 粒度：每条任务可直接交给 AI 编程工具执行（含输入文件、输出文件、验收）。
> 总量控制：180–260 小时。超出即砍任务，不加时间。
> 里程碑对应 90 天路线（计划书第九/十节）。

## M0 项目初始化（第 11 天前，~6h）

| ID | 任务 | 产出 | 验收 | 估时 |
| --- | --- | --- | --- | --- |
| T0.1 | 创建 monorepo 骨架：`web/`（Next.js+TS，迁移现有原型代码）、`extension/`（MV3+Vite+React+TS）、`docs/` | 目录+README | `npm run dev`（web）与 `npm run build`（extension）通过 | 3h |
| T0.2 | Supabase 项目创建，执行技术文档第 4 节全部建表 SQL + RLS | `web/supabase/migrations/0001_init.sql` | 用 SQL 编辑器验证表与 RLS 生效 | 2h |
| T0.3 | 环境变量与 CI：`.env.local` 模板、GitHub Actions 跑 build+lint | `.github/workflows/ci.yml` | push 后 CI 绿 | 1h |

## M1 浏览器插件（第 11–25 天，~40h）

| ID | 任务 | 产出 | 验收 | 估时 |
| --- | --- | --- | --- | --- |
| T1.1 | MV3 骨架：manifest、popup（React）、background SW、content script 注入 | extension 基础 | 插件可加载，popup 显示 | 4h |
| T1.2 | `shared/schema.ts`：CapturePayload zod schema（PRD F1.2 字段表） | schema+类型 | 单测覆盖必填/可空 | 2h |
| T1.3 | Adapter 接口 + registry（URL 匹配） | adapters/types.ts, registry.ts | 单测：3 站点 URL 匹配正确 | 3h |
| T1.4 | AliExpress 适配器（标题/描述/价格/图片/属性） | aliexpress.ts | 10 个真实页面提取正确率 100% | 6h |
| T1.5 | Alibaba 适配器 | alibaba.ts | 同上 | 5h |
| T1.6 | CJdropshipping 适配器 | cjdropshipping.ts | 同上 | 5h |
| T1.7 | 变体提取（选项矩阵 → 结构化 JSON）+ 脏数据检测（F1.3） | adapter 公共逻辑 | 含重复/空 SKU 用例 | 5h |
| T1.8 | Popup 预览编辑：字段列表、图片勾选与拖拽排序、失败字段标红（F1.2） | popup UI | 手动编辑后 payload 一致 | 6h |
| T1.9 | 登录态与 device token 流程（F1.4） | background+授权页 | 未登录→登录→token 生效 | 4h |
| T1.10 | 发送 + 本地队列重试 + 额度不足提示 | background | 断网重试 3 次后可手动重发 | 3h |
| T1.11 | 兼容性抽查脚本（Node+Playwright 跑样本页面过 adapter） | `web/scripts/adapter-check/` | 20 页面/站点自动化抽查报告 | 3h |

**M1 验收（对应计划书）**：≥20 个目标商品页面稳定采集；不支持页面明确报错；采集数据保存原始 JSON。

## M2 采集接入与商品工作台基础（第 26–40 天，~45h）

| ID | 任务 | 产出 | 验收 | 估时 |
| --- | --- | --- | --- | --- |
| T2.1 | Supabase Auth 接入：魔法链接 + Google OAuth + 新用户自动建 workspace | web (app)/layout+auth 页 | 注册→登录→空工作台 | 5h |
| T2.2 | `POST /api/capture`：device token 鉴权、zod 校验、写 source_products+draft、usage_events | api/capture | 插件采集→工作台出现记录 | 5h |
| T2.3 | quota.ts：按套餐额度检查/扣减（usage_events 聚合） | lib/quota | 超额返回明确错误码 | 3h |
| T2.4 | 商品列表页（F2.2）：行、状态、评分、筛选、搜索、分页 | products 页 | 100 行 ≤2s | 8h |
| T2.5 | 草稿编辑器三栏布局（F2.3）：source/AI/final + 字段来源标记 | products/[id] 页 | 布局与标记正确 | 8h |
| T2.6 | 字段级采纳/回退 + draft_revisions 写入 + 撤销 | 编辑器逻辑 | PRD F2.3 验收闭环 | 6h |
| T2.7 | 自动保存（防抖 2s）+ 乐观更新 | hooks | 断网提示不丢数据 | 3h |
| T2.8 | 迁移现有原型的 AI 调用为 `lib/ai/`（prompt 版本化 + zod 输出校验），改写 `/api/ai`（F2.4 单字段） | lib/ai | 标题生成写入 generated_contents | 5h |
| T2.9 | 价格工具（F2.6）：三种加价方式 + 心理定价 + manual 覆盖 | pricing.ts+UI | 与手算一致 | 4h |
| T2.10 | `adapter_error_logs` 落库与列表页 | api+页面 | 失败采集可查 | 2h |

**M2 验收**：插件采集 → 工作台草稿 → AI 标题/描述 → 价格计算，全流程可走通。

## M3 差异化功能（第 41–55 天，~50h）

| ID | 任务 | 产出 | 验收 | 估时 |
| --- | --- | --- | --- | --- |
| T3.1 | 变体管理页（F2.5）：选项标准化映射、值清洗、批量替换 | 变体 UI+api | Color×Size 10 变体可整理 | 10h |
| T3.2 | 变体禁用与变体级价格 | UI | 禁用变体不导出 | 3h |
| T3.3 | 质量检查引擎（F2.8）：规则表实现（演进现有 lib/validate.js） | lib/quality | PRD 规则全绿/红正确 | 6h |
| T3.4 | 完整度评分 UI + 问题跳转字段 | 编辑器头部 | 修复后评分实时更新 | 3h |
| T3.5 | 图片管理（F2.7）：排序、alt、分辨率/重复检查 | 图片面板 | 检查项生效 | 5h |
| T3.6 | 品牌语气设置（F2.10）+ 注入所有 prompt | settings+lib/ai | 切换语气生成结果变化 | 4h |
| T3.7 | 批量 AI（F2.4 批量行）：任务队列（Trigger.dev）+ 进度 + 单条重试 | jobs+UI | 20 商品批量成功 | 8h |
| T3.8 | 翻译/本地化字段（目标语言选择 + 术语表基础版） | lib/ai+UI | 输出为本地化而非直译 | 6h |
| T3.9 | 列表批量操作：批量 AI、批量删除 | products 页 | 多选生效 | 3h |
| T3.10 | 编辑历史 UI（30 天保留） | 抽屉 | 可恢复任一版本 | 2h |

**M3 验收**：用户无需离开工作台即可完成变体整理、图片、检查、批量处理。

## M4 导出（第 41–55 天内并行，~15h）

| ID | 任务 | 产出 | 验收 | 估时 |
| --- | --- | --- | --- | --- |
| T4.1 | Shopify CSV 列映射与生成（主行+变体行，演进 lib/csv.js） | lib/shopify-csv | 测试店铺导入成功 | 6h |
| T4.2 | 导出对话框 + Error 拦截确认（F2.8/F2.9） | UI | 有 Error 需确认 | 3h |
| T4.3 | export_jobs + Storage 上传 + 导出历史页 | api+页面 | 30 天内可重下载 | 4h |
| T4.4 | 导入 Shopify 测试店铺端到端验证（变体/图片/价格） | 验证记录 | PRD 发布清单通过 | 2h |

## M5 付费与稳定化（第 56–70 天，~35h）

| ID | 任务 | 产出 | 验收 | 估时 |
| --- | --- | --- | --- | --- |
| T5.1 | Stripe 产品/价格创建 + Checkout + webhook 更新 plan | api/stripe | 测试模式订阅成功 | 6h |
| T5.2 | 套餐矩阵落库与升级入口（PRD F3） | billing 页 | 超额提示升级 | 3h |
| T5.3 | 插件端额度展示与用尽状态（F1.4） | popup | 额度 0 时阻断并引导 | 2h |
| T5.4 | 批量任务失败重试 + 采集日志页完善 | jobs | 重试成功可见 | 4h |
| T5.5 | 隐私政策、服务条款、帮助页（英文） | (marketing) 页面 | 法务要素齐全 | 4h |
| T5.6 | PostHog 埋点（PRD 第 7 节事件表） | lib/analytics | 事件漏斗可见 | 4h |
| T5.7 | 邀请码注册限制（Stripe 就绪前控制用户量） | auth 钩子 | 无邀请码不可注册 | 2h |
| T5.8 | 错误监控（Sentry 免费档）+ 关键路径告警 | 集成 | 人为错误可见 | 3h |
| T5.9 | 性能优化与 Lighthouse 检查 | - | 首屏 ≤2s | 3h |
| T5.10 | 界面英文为主/中文切换基础框架 | i18n | 两种语言可切 | 4h |

## M6 发布（第 71–90 天，~20h）

| ID | 任务 | 产出 | 验收 | 估时 |
| --- | --- | --- | --- | --- |
| T6.1 | Chrome Web Store 上架材料：描述、截图 5 张、演示视频、隐私声明 | 商店素材 | 审核提交 | 6h |
| T6.2 | 落地页（计划书首屏文案）+ 定价页 | (marketing) | CTA 指向注册 | 5h |
| T6.3 | Demo 视频脚本与录制（3 分钟全流程） | 视频 | 覆盖 PRD 核心旅程 | 5h |
| T6.4 | Product Hunt 发布材料 + 发布日 checklist | 素材 | 就绪 | 2h |
| T6.5 | 种子用户反馈回流表单 + 周度指标看板 | 表格/看板 | PRD 第 7 节指标可见 | 2h |

## 汇总

| 里程碑 | 估时 |
| --- | --- |
| M0 初始化 | 6h |
| M1 插件 | 40h |
| M2 采集+工作台 | 45h |
| M3 差异化 | 50h |
| M4 导出 | 15h |
| M5 付费稳定化 | 35h |
| M6 发布 | 20h |
| **合计** | **~211h（在 180–260h 范围内）** |

## 依赖关系

- T1.4–T1.7 依赖 T1.2/T1.3；T2.2 依赖 T1.2/T1.9/T2.3；
- T3.x 依赖 T2.5–T2.6；T4.x 依赖 T3.3；T5.2 依赖 T2.3/T5.1；
- M6 依赖 M4 + T5.5/T5.6。

## 明确不做（防止范围蔓延）

订单/库存/物流/财务、Shopify API 写入、多平台发布、图片编辑、移动端、自动采集、绕过访问限制、团队协作（Studio 多项目除外）。
