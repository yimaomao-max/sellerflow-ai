import { NextResponse } from "next/server";
import { mockGenerate, callLLM } from "@/lib/mockAi";

export const runtime = "nodejs";

export async function POST(req) {
  let payload;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "请求体不是合法 JSON" }, { status: 400 });
  }

  const { task, products, config, mock, brandVoice } = payload;
  if (!["title", "translate", "rewrite"].includes(task)) {
    return NextResponse.json({ error: "task 必须是 title、translate 或 rewrite" }, { status: 400 });
  }
  if (!Array.isArray(products) || !products.length) {
    return NextResponse.json({ error: "products 不能为空" }, { status: 400 });
  }

  // 优先级：请求指定 mock > 客户端配置了 key > 服务端环境变量 > 模拟模式
  const cfg = config || {};
  const forceMock =
    process.env.SELLERFLOW_FORCE_MOCK === "1" ||
    process.env.SELLERFLOW_FORCE_MOCK === "true";
  const hasKey = !cfg.useMock && (cfg.apiKey || process.env.OPENAI_API_KEY);
  const runMock = mock || forceMock || !hasKey;
  const llmPayload = { ...payload, brandVoice: brandVoice || cfg.brandVoice || "neutral" };

  if (runMock) {
    return NextResponse.json(mockGenerate(llmPayload));
  }

  try {
    const result = await callLLM(
      {
        apiKey: cfg.apiKey || process.env.OPENAI_API_KEY,
        baseUrl: cfg.baseUrl || process.env.OPENAI_BASE_URL,
        model: cfg.model || process.env.OPENAI_MODEL,
      },
      llmPayload
    );
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: String(e.message || e) }, { status: 502 });
  }
}
