"use client";

import { useRef } from "react";
import { parseProductsCsv, buildExportCsv } from "@/lib/csv";

export function ImportButton({ onImport }) {
  const fileRef = useRef(null);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const text = await file.text();
    try {
      const { products, unmapped } = parseProductsCsv(text);
      if (!products.length) {
        onImport(null, "CSV 中没有数据行");
        return;
      }
      const note = unmapped.length ? `未识别的列: ${unmapped.join(", ")}（已忽略）` : "";
      onImport({ products }, `成功导入 ${products.length} 个商品${note ? "；" + note : ""}`);
    } catch (err) {
      onImport(null, err.message);
    }
  };

  return (
    <>
      <button onClick={() => fileRef.current?.click()}>⬆ 导入 CSV</button>
      <input ref={fileRef} type="file" accept=".csv,text/csv" hidden onChange={handleFile} />
    </>
  );
}

export function ExportButton({ products, exportLangs, onlyValid, invalidIds }) {
  const doExport = () => {
    let list = products;
    if (onlyValid) list = products.filter((p) => !invalidIds.has(p.id));
    if (!list.length) return alert("没有可导出的商品");
    const csv = buildExportCsv(list, exportLangs);
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sellerflow-export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return <button onClick={doExport}>⬇ 导出 CSV</button>;
}

export function ExportIssuesButton({ result }) {
  const doExport = () => {
    if (!result.issues.length) return alert("当前没有校验问题");
    const rows = result.issues.map((i) => ({
      level: i.level === "err" ? "错误" : "警告",
      field: i.field,
      message: i.msg,
      productId: i.productId,
    }));
    const header = "级别,字段,问题描述,商品ID\n";
    const csv =
      header +
      rows
        .map((r) =>
          [r.level, r.field, `"${r.message.replace(/"/g, '""')}"`, r.productId].join(",")
        )
        .join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sellerflow-issues-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <button className="btn-sm" onClick={doExport}>
      导出问题清单
    </button>
  );
}
