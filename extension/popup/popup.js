const DEFAULT_WB = "http://localhost:3000";

const statusEl = document.getElementById("status");
const formEl = document.getElementById("form");
const siteBadge = document.getElementById("siteBadge");
const imagesEl = document.getElementById("images");
const imgCountEl = document.getElementById("imgCount");
const variantsNote = document.getElementById("variantsNote");
const btnJson = document.getElementById("btnJson");
const btnSend = document.getElementById("btnSend");
const wbUrlEl = document.getElementById("wbUrl");

const fields = {
  title: document.getElementById("title"),
  price: document.getElementById("price"),
  compareAt: document.getElementById("compareAt"),
  currency: document.getElementById("currency"),
  description: document.getElementById("description"),
  sku: document.getElementById("sku"),
  vendor: document.getElementById("vendor"),
};

let imageUrls = [];
let selected = new Set();

function setStatus(text, kind = "") {
  statusEl.textContent = text;
  statusEl.className = "status" + (kind ? ` ${kind}` : "");
}

async function getWorkbenchUrl() {
  const { workbenchUrl } = await chrome.storage.sync.get({ workbenchUrl: DEFAULT_WB });
  return (workbenchUrl || DEFAULT_WB).replace(/\/+$/, "");
}

function normImageUrl(url) {
  if (!url) return "";
  return url.replace(/_\d+x\d+\.(jpg|jpeg|png|webp)/i, ".$1");
}

function renderImages() {
  imagesEl.innerHTML = "";
  imageUrls.forEach((url, i) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "img-cell" + (selected.has(i) ? " on" : "");
    const img = document.createElement("img");
    img.src = url;
    img.alt = "";
    btn.appendChild(img);
    if (selected.has(i)) {
      const tag = document.createElement("span");
      tag.className = "tag";
      const order = [...selected].indexOf(i);
      tag.textContent = order === 0 ? "主图" : String(order + 1);
      btn.appendChild(tag);
    }
    btn.addEventListener("click", () => {
      if (selected.has(i)) selected.delete(i);
      else selected.add(i);
      renderImages();
      updateImgCount();
      syncButtons();
    });
    imagesEl.appendChild(btn);
  });
  updateImgCount();
}

function updateImgCount() {
  imgCountEl.textContent = `${selected.size}/${imageUrls.length}`;
}

function fillForm(payload) {
  fields.title.value = payload.title || "";
  fields.price.value = payload.price || "";
  fields.compareAt.value = payload.compareAtPrice || "";
  fields.currency.value = payload.currency || "USD";
  fields.description.value = payload.description || "";
  fields.sku.value = payload.sku || "";
  fields.vendor.value = payload.vendor || "";

  imageUrls = (payload.images || []).map(normImageUrl).filter(Boolean);
  selected = new Set(imageUrls.map((_, i) => i).slice(0, Math.min(4, imageUrls.length)));
  renderImages();

  if (payload.variants?.length) {
    variantsNote.textContent = `检测到约 ${payload.variants.length} 个变体（发送后可在工作台 M3 标准化）`;
    variantsNote.classList.remove("hidden");
  } else {
    variantsNote.classList.add("hidden");
  }

  formEl.classList.remove("hidden");
  siteBadge.textContent = payload.site || "aliexpress";
  siteBadge.classList.remove("hidden");
}

function buildPayload() {
  const selectedUrls = [...selected]
    .sort((a, b) => a - b)
    .map((i) => imageUrls[i])
    .filter(Boolean);

  return {
    site: "aliexpress",
    sourceUrl: lastSourceUrl,
    title: fields.title.value.trim(),
    description: fields.description.value.trim(),
    price: fields.price.value.trim(),
    compareAtPrice: fields.compareAt.value.trim(),
    currency: fields.currency.value,
    sku: fields.sku.value.trim(),
    vendor: fields.vendor.value.trim(),
    images: imageUrls,
    selectedImages: selectedUrls,
  };
}

function validate() {
  if (!fields.title.value.trim()) return "标题必填（PRD F1.2）";
  if (!selected.size) return "请至少选择 1 张图片";
  return "";
}

let lastSourceUrl = "";

function syncButtons() {
  const err = validate();
  const ok = !err && fields.title.value.trim();
  btnJson.disabled = !ok;
  btnSend.disabled = !ok;
}

Object.values(fields).forEach((el) => el.addEventListener("input", syncButtons));

async function extract() {
  setStatus("正在采集…");
  formEl.classList.add("hidden");
  siteBadge.classList.add("hidden");
  btnJson.disabled = true;
  btnSend.disabled = true;

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
    lastSourceUrl = resp.payload?.sourceUrl || tab.url?.split("?")[0] || "";
    fillForm(resp.payload);
    setStatus("已识别商品，请核对字段后发送", "ok");
    syncButtons();
  } catch {
    setStatus("无法与页面通信。请刷新 AliExpress 商品页后重试。", "err");
  }
}

function downloadJson() {
  const err = validate();
  if (err) return setStatus(err, "err");
  const payload = buildPayload();
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `sellerflow-capture-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
  setStatus("JSON 已下载", "ok");
}

async function findWorkbenchTab(baseUrl) {
  const patterns = [`${baseUrl}/*`, `${baseUrl}`];
  for (const p of patterns) {
    const tabs = await chrome.tabs.query({ url: p });
    if (tabs[0]?.id) return tabs[0];
  }
  return null;
}

function injectCapture(tabId, payload) {
  return chrome.scripting.executeScript({
    target: { tabId },
    func: (data) => {
      window.dispatchEvent(new CustomEvent("sellerflow-capture", { detail: data }));
    },
    args: [payload],
  });
}

async function sendToWorkbench() {
  const err = validate();
  if (err) return setStatus(err, "err");

  const payload = buildPayload();
  const baseUrl = await getWorkbenchUrl();
  setStatus("正在发送到工作台…");

  let tab = await findWorkbenchTab(baseUrl);
  if (!tab) {
    tab = await chrome.tabs.create({ url: baseUrl, active: true });
    await new Promise((resolve) => {
      const fn = (tabId, info) => {
        if (tabId === tab.id && info.status === "complete") {
          chrome.tabs.onUpdated.removeListener(fn);
          resolve();
        }
      };
      chrome.tabs.onUpdated.addListener(fn);
    });
  }

  try {
    await injectCapture(tab.id, payload);
    setStatus("已发送到工作台 ✅", "ok");
    chrome.tabs.update(tab.id, { active: true });
  } catch (e) {
    setStatus("发送失败：请确认工作台地址与权限", "err");
    console.warn(e);
  }

  try {
    await fetch(`${baseUrl}/api/capture`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
    /* 本地未启动时忽略 */
  }
}

document.getElementById("btnExtract").addEventListener("click", extract);
btnJson.addEventListener("click", downloadJson);
btnSend.addEventListener("click", sendToWorkbench);

document.getElementById("openOptions").addEventListener("click", (e) => {
  e.preventDefault();
  if (chrome.runtime.openOptionsPage) chrome.runtime.openOptionsPage();
});

(async () => {
  const u = await getWorkbenchUrl();
  wbUrlEl.textContent = u;
  extract();
})();