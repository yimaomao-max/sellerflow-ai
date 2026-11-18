import { NextResponse } from "next/server";
import { parseCapturePayload } from "@/lib/captureImport";

export const runtime = "nodejs";

/**
 * M2 占位：鉴权 + Supabase 落库未实现。
 * 当前仅校验 JSON 并返回规范化商品，供插件/Postman 联调。
 */
export async function POST(req) {
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const raw = body.products ?? body.payload ?? body;
  try {
    const products = parseCapturePayload(raw);
    return NextResponse.json({
      ok: true,
      stub: true,
      message: "M2: persistence & auth not implemented — use workbench JSON import for now.",
      products,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e.message || e) }, { status: 400 });
  }
}