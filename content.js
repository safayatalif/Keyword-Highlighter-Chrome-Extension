const HIGHLIGHT_CLASS = "__kh_highlight";

function walkAndHighlight(root, regex) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;
      if (!parent) return NodeFilter.FILTER_REJECT;
      const name = parent.nodeName;
      if (name === "SCRIPT" || name === "STYLE" || parent.classList.contains(HIGHLIGHT_CLASS)) {
        return NodeFilter.FILTER_REJECT;
      }
      if (!node.nodeValue || node.nodeValue.trim() === "") return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    }
  });

  const textNodes = [];
  let node;
  while ((node = walker.nextNode())) {
    textNodes.push(node);
  }

  textNodes.forEach(tnode => {
    const parent = tnode.parentNode;
    const text = tnode.nodeValue;
    const frag = document.createDocumentFragment();
    let lastIndex = 0;
    regex.lastIndex = 0;
    let match;
    let hasMatch = false;
    while ((match = regex.exec(text)) !== null) {
      hasMatch = true;
      const before = text.slice(lastIndex, match.index);
      if (before.length > 0) frag.appendChild(document.createTextNode(before));
      const span = document.createElement("span");
      span.className = HIGHLIGHT_CLASS;
      span.textContent = match[0];
      frag.appendChild(span);
      lastIndex = match.index + match[0].length;
      if (match.index === regex.lastIndex) regex.lastIndex++;
    }
    if (hasMatch) {
      const after = text.slice(lastIndex);
      if (after.length > 0) frag.appendChild(document.createTextNode(after));
      parent.replaceChild(frag, tnode);
    }
  });
}

function applyHighlightsFromKeywords(keywords) {
  if (!keywords || keywords.length === 0) return;
  const escaped = keywords.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const pattern = escaped.join("|");
  const regex = new RegExp(pattern, "gi"); 
  try {
    walkAndHighlight(document.body, regex);
  } catch (e) {
    console.error("Highlight error:", e);
  }
}

chrome.storage.sync.get("keywords", (data) => {
  const keywords = data.keywords || [];
  applyHighlightsFromKeywords(keywords);
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg && msg.action === "reapplyHighlights") {
    chrome.storage.sync.get("keywords", (data) => {
      const spans = Array.from(document.querySelectorAll("." + HIGHLIGHT_CLASS));
      spans.forEach(s => {
        const parent = s.parentNode;
        while (s.firstChild) parent.insertBefore(s.firstChild, s);
        parent.removeChild(s);
      });
      applyHighlightsFromKeywords(data.keywords || []);
    });
  }
});
