let lastPayload = null;

const statusEl = document.getElementById("status");
const previewEl = document.getElementById("preview");
const btnDownload = document.getElementById("btnDownload");

function setStatus(text, kind = "") {
  statusEl.textContent = text;
  statusEl.className = "status" + (kind ? ` ${kind}` : "");
}

async function extract() {
  setStatus("正在采集…");
  previewEl.classList.add("hidden");
  btnDownload.disabled = true;
  lastPayload = null;

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) {
    setStatus("无法获取当前标签页", "err");
    return;
  }

  try {
    const resp = await chrome.tabs.sendMessage(tab.id, { type: "SELLERFLOW_EXTRACT" });
    if (!resp?.ok) {
      setStatus(resp?.error || "采集失败", "err");
      return;
    }
    lastPayload = resp.payload;
    setStatus(`已识别：${lastPayload.title.slice(0, 48)}…`, "ok");
    previewEl.textContent = JSON.stringify(lastPayload, null, 2);
    previewEl.classList.remove("hidden");
    btnDownload.disabled = false;
  } catch (e) {
    setStatus(
      "无法与页面通信。请刷新商品页后重试，或确认已在 AliExpress 商品详情页。",
      "err"
    );
  }
}

btnDownload.addEventListener("click", () => {
  if (!lastPayload) return;
  const blob = new Blob([JSON.stringify(lastPayload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `sellerflow-capture-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
});

document.getElementById("btnExtract").addEventListener("click", extract);
extract();