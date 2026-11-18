import Link from "next/link";

const GH = "https://github.com/yimaomao-max/sellerflow-ai";
const ISSUES = "https://github.com/yimaomao-max/sellerflow-ai/issues/new/choose";

export const metadata = {
  title: "SellerFlow AI — Supplier-to-Store Listing Copilot",
  description: "Import, AI titles, translate, validate, export Shopify CSV.",
};

const STEPS = [
  { n: "01", title: "采集 / 导入", desc: "Chrome 插件（AliExpress MVP）或 CSV / 采集 JSON 进入工作台" },
  { n: "02", title: "AI 整理", desc: "标题、描述重写、6 语种翻译；品牌语气可选" },
  { n: "03", title: "质检导出", desc: "Shopify 规则评分，导出问题清单与可上架 CSV" },
];

export default function WelcomePage() {
  return (
    <div className="landing">
      <header className="landing-nav">
        <div className="logo">
          <span className="logo-badge">SF</span>
          SellerFlow <span style={{ color: "var(--text-3)", fontWeight: 400 }}>AI</span>
        </div>
        <div className="landing-nav-actions">
          <a href={GH} target="_blank" rel="noreferrer">
            GitHub
          </a>
          <Link href="/" className="btn-primary landing-cta-sm">
            进入工作台
          </Link>
        </div>
      </header>

      <section className="landing-hero">
        <p className="landing-eyebrow">Supplier-to-Store Listing Copilot</p>
        <h1>
          把供应商商品资料
          <br />
          变成可上架的 Shopify Listing
        </h1>
        <p className="landing-lead">
          开源 MVP：CSV 工作台 + AI + 校验闭环。正在迭代 Chrome 采集插件（AliExpress 首发）。
        </p>
        <div className="landing-hero-actions">
          <Link href="/" className="btn-primary">
            免费试用工作台
          </Link>
          <a href={ISSUES} className="landing-btn-secondary" target="_blank" rel="noreferrer">
            加入等候名单 / 反馈
          </a>
        </div>
      </section>

      <section className="landing-steps">
        {STEPS.map((s) => (
          <div key={s.n} className="landing-step">
            <span className="landing-step-n">{s.n}</span>
            <h3>{s.title}</h3>
            <p>{s.desc}</p>
          </div>
        ))}
      </section>

      <section className="landing-compare">
        <h2>Before → After</h2>
        <ul>
          <li>供应商页散乱字段 → 结构化草稿 + 原始对照</li>
          <li>手搓标题与翻译 → AI 批量 + 人工审核</li>
          <li>导入 Shopify 踩坑 → 内置规则与问题清单 CSV</li>
        </ul>
      </section>

      <section className="landing-footer">
        <p>
          文档：<a href={`${GH}/blob/main/README.md`}>README</a> ·{" "}
          <a href={`${GH}/blob/main/docs/USER-GUIDE.md`}>用户指南</a> ·{" "}
          <a href={`${GH}/blob/main/extension/README.md`}>插件开发</a>
        </p>
        <Link href="/">← 返回工作台</Link>
      </section>
    </div>
  );
}