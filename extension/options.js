const DEFAULT_WB = "http://localhost:3000";

document.getElementById("save").addEventListener("click", async () => {
  const workbenchUrl = document.getElementById("workbenchUrl").value.trim() || DEFAULT_WB;
  await chrome.storage.sync.set({ workbenchUrl });
  document.getElementById("msg").textContent = "已保存";
});

chrome.storage.sync.get({ workbenchUrl: DEFAULT_WB }, (data) => {
  document.getElementById("workbenchUrl").value = data.workbenchUrl;
});