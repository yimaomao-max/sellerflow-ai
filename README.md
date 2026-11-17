# SellerFlow AI — 电商商品管理助手

帮助跨境卖家批量处理商品资料的 Web 工具（MVP）：**导入 → AI 标题 → 翻译 → 批量编辑 → 校验 → 导出**。

## 快速开始

```bash
npm install
npm run dev
```

打开 http://localhost:3000 。首次启动会自动载入 3 条示例商品，可直接体验完整流程。

## MVP 功能

| 功能 | 说明 |
| --- | --- |
| 商品资料导入 | 上传 CSV，自动识别 Shopify 及常见平台表头（标题/描述/价格/SKU/品牌/标签/Handle 等），未识别列自动忽略 |
| AI 标题生成 | 基于名称、描述、类目、标签生成 60–120 字符的 SEO 标题，支持指定输出语言 |
| 多语言翻译 | 批量翻译标题与描述到英/中/日/西/德/法，结果随 CSV 导出为对应列 |
| 批量字段编辑 | 选中行后：设置、查找替换、加前后缀、大小写、去空格、清空、清空某语言翻译 |
| CSV 导出与校验 | 按 Shopify 规范校验（标题必填≤255、价格必填且为数字、SKU 唯一、标题不重复、描述建议长度），导出仅含无错误商品，支持导出问题清单 |

## AI 配置

默认使用**模拟模式**（无需 API Key，内置规则生成结果，便于演示）。

接入真实模型：顶部「⚙ 设置」填写任意 OpenAI 兼容接口（Base URL / API Key / 模型名），
或在 `.env.local` 中配置环境变量后取消勾选「使用模拟模式」：

```
OPENAI_API_KEY=sk-...
OPENAI_BASE_URL=https://api.openai.com/v1   # 可选
OPENAI_MODEL=gpt-4o-mini                     # 可选
```

## 技术栈

- Next.js 14（App Router）+ React 18，纯 JavaScript（JSX）
- PapaParse 处理 CSV 导入/导出
- 商品数据持久化在浏览器 localStorage
- `/api/ai` 服务端路由转发 LLM 请求（避免浏览器跨域与密钥暴露）

## 目录结构

```
app/
  page.jsx            # 主界面（表格、工具栏、批量编辑、抽屉）
  api/ai/route.js     # AI 接口（真实 LLM / 模拟模式）
components/           # 导入导出、AI 面板、批量编辑、详情抽屉、校验报告、设置
lib/
  product.js          # 数据模型、表头映射、语言定义
  csv.js              # CSV 解析与导出
  validate.js         # Shopify 规范校验
  mockAi.js           # 模拟 AI + LLM 调用
```
