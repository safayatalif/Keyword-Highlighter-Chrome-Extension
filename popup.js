document.addEventListener("DOMContentLoaded", () => {
  const textarea = document.getElementById("keywords");
  const saveBtn = document.getElementById("save");

  chrome.storage.sync.get("keywords", (data) => {
    if (data.keywords) textarea.value = data.keywords.join("\n");
  });

  saveBtn.addEventListener("click", () => {
    const keywords = textarea.value
      .split("\n")
      .map(k => k.trim())
      .filter(k => k.length > 0);
    chrome.storage.sync.set({ keywords }, () => {
      chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
        if (tabs[0]?.id) {
          chrome.tabs.sendMessage(tabs[0].id, { action: "reapplyHighlights" });
        }
      });
    });
  });
});
