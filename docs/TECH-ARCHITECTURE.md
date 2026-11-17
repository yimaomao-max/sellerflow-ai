# SellerFlow AI 技术架构与数据库设计

| 项 | 内容 |
| --- | --- |
| 版本 | V1.0（基线：计划书 V1.0 / PRD V1.0） |
| 原则 | 模块化单体；先 CSV 后 API；原始数据不可变；站点适配器独立维护 |

## 1. 总体架构

```
┌─────────────────────────┐      ┌──────────────────────────────────┐
│ Chrome Extension (MV3)  │      │ Next.js on Vercel                │
│ popup / content script  │─────▶│ /api/capture   采集接入+鉴权+额度  │
│ background service work.│ HTTPS│ /app           商品工作台 (React) │
└─────────────────────────┘      │ /api/ai        AI 处理            │
                                 │ /api/export     CSV 生成          │
                                 └───────┬──────────────────────────┘
                                         │
                    ┌────────────────────┼─────────────────────┐
                    ▼                    ▼                     ▼
             Supabase               AI Provider            Task Queue
             Postgres (RLS)         OpenAI 兼容接口        Trigger.dev
             Auth / Storage         结构化→生成→翻译        批量任务/重试
```

## 2. Chrome 插件设计

### 2.1 工程结构（`extension/`）

```
extension/
  manifest.json            # MV3, permissions: activeTab, scripting, storage
  src/
    background/index.ts    # SW: 消息路由、队列重试、与 SaaS 通信
    content/
      index.ts             # 注入入口：识别站点 → 调用适配器
    adapters/
      types.ts             # SiteAdapter 接口
      aliexpress.ts
      alibaba.ts
      cjdropshipping.ts
      registry.ts          # 站点匹配表（URL pattern → adapter）
    popup/                 # React popup（预览/编辑/发送）
    shared/
      schema.ts            # CapturePayload zod schema
```

### 2.2 站点适配器（关键技术决策）

```ts
interface SiteAdapter {
  key: string;                       // 'aliexpress'
  version: number;                   // 选择器版本，失败日志按版本统计
  matchUrl(url: URL): boolean;
  extract(): CapturePayload;         // 纯 DOM 提取，禁止整页 HTML 交给 AI
  extractVariants?(): Variant[];
}
```

- 原则：**DOM 选择器提取确定字段，AI 只处理不确定字段**（如规格整理、标题优化）。
- 提取结果整体经 zod 校验；关键字段缺失按 PRD F1.2 处理。
- 失败上报：`{site, adapter_version, url_host, missing_fields}` → 后端日志表，驱动适配器修复。

### 2.3 通信与安全

- content script 仅在用户点击「Capture」后执行提取（用户主动触发，原则 P3）。
- 插件登录：打开 SaaS 授权页 → 签发短期 device token → 存 `chrome.storage.local`。
- 发送失败本地队列：`chrome.storage.local` 暂存 payload，SW 定时重试 3 次。

## 3. Web SaaS 设计（Next.js App Router）

### 3.1 路由结构

```
app/
  (marketing)/            # 落地页、定价、隐私、条款
  (app)/                  # 登录后工作台
    products/             # F2.2 商品列表
    products/[id]/        # F2.3-F2.8 草稿编辑器（含变体/价格/图片/检查）
    exports/              # F2.9 导出历史
    settings/             # F2.10
  api/
    capture/route.ts      # 插件采集接入（device token 鉴权 + 额度扣减）
    ai/route.ts           # 单字段/批量 AI
    export/route.ts       # 生成 CSV → Storage
    stripe/webhook/route.ts
    cron/...
lib/
  db.ts                   # supabase client
  quota.ts                # 额度检查与扣减
  ai/                     # prompt 模板（版本化）、调用封装、结果解析
  shopify-csv.ts          # CSV 列映射（现有 lib/csv.js 演进）
  quality/                # 检查规则引擎（现有 lib/validate.js 演进）
  pricing.ts              # 价格计算（PRD F2.6）
```

### 3.2 数据分层（核心决策）

```
source_products.raw (JSON, 不可变)
        │
        ▼  AI / 用户编辑
product_drafts (可变)  ──▶  generated_contents (每次 AI 生成一条)
        │                       status: accepted / rejected / superseded
        ▼
draft_revisions (字段级变更历史, 保留30天)
```

- 采纳 AI：把 generated_content 写入 draft 对应字段，同时记录 revision。
- 回退：从 revisions 或 source_products 恢复。

### 3.3 AI 服务层

- Prompt 全部模板化并带版本号（`title.v1`、`desc.v1`、`translate.v1`），结果存 prompt_version，便于回归对比。
- 结构化输出：要求模型返回 JSON，经 zod 校验，失败自动重试 1 次。
- 成本控制：优先规则引擎（清洗、标准化、校验），仅在生成/翻译时调用 LLM；按套餐额度限流。

## 4. 数据库设计（PostgreSQL / Supabase）

> 所有业务表带 `workspace_id`，RLS：`workspace_id in (select id from workspaces where owner = auth.uid())`。

```sql
-- 认证用户（Supabase auth.users 扩展）
create table profiles (
  id uuid primary key references auth.users(id),
  email text not null,
  created_at timestamptz default now()
);

create table workspaces (
  id uuid primary key default gen_random_uuid(),
  owner uuid references profiles(id) not null,
  name text not null default 'My Workspace',
  plan text not null default 'free',            -- free/starter/pro/studio
  settings jsonb default '{}',                  -- 品牌语气、默认价格规则
  created_at timestamptz default now()
);

create table source_sites (
  key text primary key,                          -- 'aliexpress'
  name text not null,
  adapter_version int not null default 1,
  enabled boolean default true
);

create table source_products (                   -- 原始采集数据，不可变
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id) not null,
  site_key text references source_sites(key) not null,
  source_url text not null,
  raw jsonb not null,                            -- CapturePayload 原样保存
  captured_via text not null default 'extension',
  created_at timestamptz default now()
);

create table product_drafts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id) not null,
  source_product_id uuid references source_products(id) not null,
  status text not null default 'captured',       -- captured/processing/ready/exported/error
  title text,
  description text,
  currency text default 'USD',
  pricing jsonb default '{}',                    -- {cost, shipping, rule, suggested, final, overridden}
  images jsonb default '[]',                     -- [{url, alt, position, selected}]
  completeness_score int default 0,
  listing_profile_id uuid,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table product_variants (                  -- 结构化变体（原则：禁止纯文本）
  id uuid primary key default gen_random_uuid(),
  draft_id uuid references product_drafts(id) on delete cascade not null,
  position int not null,
  option1_name text, option1_value text,
  option2_name text, option2_value text,
  option3_name text, option3_value text,
  sku text,
  price numeric,                                 -- null = 用主价格
  image_url text,
  disabled boolean default false,
  source_ref jsonb                               -- 指回 raw 中原始变体
);

create table listing_profiles (                  -- 品牌/渠道模板（P1 起重点使用）
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id) not null,
  name text not null,
  brand_tone text, target_market text,
  keywords text[], banned_words text[],
  default_pricing jsonb
);

create table generated_contents (                -- AI 生成记录，原始≠生成≠最终
  id uuid primary key default gen_random_uuid(),
  draft_id uuid references product_drafts(id) on delete cascade not null,
  field text not null,                           -- title/description/variant_option...
  engine text not null,                          -- model 标识
  prompt_key text not null,                      -- 'title.v1'
  content text not null,
  status text not null default 'pending',        -- pending/accepted/rejected/superseded
  tokens_used int,
  created_at timestamptz default now()
);

create table draft_revisions (
  id uuid primary key default gen_random_uuid(),
  draft_id uuid references product_drafts(id) on delete cascade not null,
  field text not null,
  old_value text, new_value text not null,
  source text not null,                          -- manual/ai/revert
  created_at timestamptz default now()
);

create table quality_checks (
  id uuid primary key default gen_random_uuid(),
  draft_id uuid references product_drafts(id) on delete cascade not null,
  score int not null,
  results jsonb not null,                        -- [{rule, level, field, message}]
  created_at timestamptz default now()
);

create table export_jobs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id) not null,
  draft_ids uuid[] not null,
  type text not null default 'shopify_csv',
  status text not null default 'pending',
  file_url text,
  created_at timestamptz default now()
);

create table usage_events (                      -- 额度统计依据
  id bigint generated always as identity primary key,
  workspace_id uuid references workspaces(id) not null,
  kind text not null,                            -- capture_success / ai_generation / export
  amount int not null default 1,
  meta jsonb,
  created_at timestamptz default now()
);

create table adapter_error_logs (                -- 适配器失败监控
  id bigint generated always as identity primary key,
  site_key text not null,
  adapter_version int not null,
  url_host text,
  missing_fields text[],
  created_at timestamptz default now()
);
```

索引：`product_drafts(workspace_id, updated_at desc)`、`product_variants(draft_id)`、`generated_contents(draft_id, field)`、`usage_events(workspace_id, created_at)`。

## 5. 关键流程

### 5.1 采集流程

```
popup 点击 Capture → content script 提取（adapter） → zod 校验 → 预览编辑
→ POST /api/capture（device token）
→ 鉴权 + 额度检查 + usage_events
→ 写 source_products + 初始化 product_drafts(status=captured)
→ 返回 draft_id → popup 提示成功
```

### 5.2 AI 处理流程

```
用户触发（单字段/批量）→ /api/ai（额度检查）
→ 组装 prompt（listing_profile + draft + source 字段）
→ LLM JSON 输出 → zod 校验 → 写 generated_contents(pending)
→ 用户采纳 → 更新 draft + draft_revisions + quality 重算
```

### 5.3 导出流程

```
选择 drafts → /api/export → 质量检查（Error 存在需确认）
→ shopify-csv 生成（主行 + 变体行）→ Storage → export_jobs(file_url) → 状态 exported
```

### 5.4 支付与额度

- Stripe Checkout（subscription）→ webhook 更新 workspaces.plan → 额度按 PRD F3 表在 quota.ts 中读取。
- 月度额度以自然月 + usage_events 聚合计算（不设计数器字段，避免并发问题）。

## 6. 部署与环境

- Vercel（Web）+ Supabase（DB/Auth/Storage）+ Trigger.dev（批量任务）。
- 环境：dev / prod 两组 Supabase project；`.env.local` 管理 key。
- 监控：Vercel Analytics + PostHog（PRD 第 7 节事件）；adapter_error_logs 周报。

## 7. 技术风险与对策（呼应计划书第十一节）

| 风险 | 对策 |
| --- | --- |
| 站点 DOM 变更 | 适配器版本化 + 失败日志 + 每周兼容性抽查脚本 |
| AI 输出不可靠 | JSON schema 校验 + 重试 + 人工采纳门槛 |
| 额度并发 | usage_events 追加式聚合，不维护计数器 |
| 数据丢失 | source 不可变 + revisions 历史冷备 30 天 |
