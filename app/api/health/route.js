import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  const forceMock =
    process.env.SELLERFLOW_FORCE_MOCK === "1" ||
    process.env.SELLERFLOW_FORCE_MOCK === "true";
  const demo =
    process.env.NEXT_PUBLIC_SELLERFLOW_DEMO === "1" ||
    process.env.NEXT_PUBLIC_SELLERFLOW_DEMO === "true";

  return NextResponse.json({
    ok: true,
    version: "0.2.0-mvp",
    forceMock,
    demo,
    gitHub: "https://github.com/yimaomao-max/sellerflow-ai",
  });
}