/**
 * Bionic Reader — content script
 * Transforms text nodes on the page by bolding the first N% of each word.
 */

const STORAGE_KEY = "bionicReaderSettings";

const SKIP_TAGS = new Set([
  "SCRIPT", "STYLE", "NOSCRIPT", "TEXTAREA", "INPUT", "SELECT",
  "CODE", "PRE", "KBD", "VAR", "SAMP", "MATH", "SVG",
  "HEAD", "META", "LINK", "TITLE"
]);

const CONTENT_TAGS = new Set([
  "P", "LI", "TD", "TH", "BLOCKQUOTE", "H1", "H2", "H3", "H4", "H5", "H6",
  "ARTICLE", "SECTION", "MAIN", "ASIDE", "FIGCAPTION", "LABEL",
  "A", "SPAN", "DIV", "B", "I", "EM", "STRONG", "CITE", "Q", "S", "U",
  "DD", "DT", "SUMMARY", "CAPTION", "MARK", "SMALL", "DEL", "INS"
]);

let settings = { enabled: false, ratio: 0.4 };
let observer = null;
let isApplied = false;

// ─── Bionic core ────────────────────────────────────────────────────────────

function boldLen(word, ratio) {
  return Math.max(1, Math.ceil(word.length * ratio));
}

function transformTextNode(textNode, ratio) {
  const text = textNode.nodeValue;
  if (!text || !text.trim()) return null;

  // Only transform if there are actual letters
  if (!/[a-zA-Z\u00C0-\u024F]/.test(text)) return null;

  const frag = document.createDocumentFragment();
  // Split on whitespace, keeping the whitespace tokens
  const tokens = text.split(/(\s+)/);

  tokens.forEach(token => {
    if (/^\s+$/.test(token) || token === "") {
      frag.appendChild(document.createTextNode(token));
      return;
    }

    // Split word from surrounding punctuation
    const match = token.match(/^([^a-zA-Z\u00C0-\u024F]*)([a-zA-Z\u00C0-\u024F][a-zA-Z\u00C0-\u024F\-']*)([^a-zA-Z\u00C0-\u024F]*)$/);

    if (!match) {
      frag.appendChild(document.createTextNode(token));
      return;
    }

    const [, pre, word, post] = match;
    if (pre) frag.appendChild(document.createTextNode(pre));

    const bl = boldLen(word, ratio);
    const strong = document.createElement("strong");
    strong.className = "bionic-bold";
    strong.setAttribute("data-bionic", "1");
    strong.textContent = word.slice(0, bl);
    frag.appendChild(strong);
    frag.appendChild(document.createTextNode(word.slice(bl)));

    if (post) frag.appendChild(document.createTextNode(post));
  });

  return frag;
}

function walkAndTransform(root, ratio) {
  const walker = document.createTreeWalker(
    root,
    NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT,
    {
      acceptNode(node) {
        if (node.nodeType === Node.ELEMENT_NODE) {
          if (SKIP_TAGS.has(node.tagName)) return NodeFilter.FILTER_REJECT;
          if (node.hasAttribute("data-bionic-skip")) return NodeFilter.FILTER_REJECT;
          if (node.getAttribute("data-bionic") === "1") return NodeFilter.FILTER_REJECT;
          return NodeFilter.FILTER_SKIP;
        }
        // Text node
        const parent = node.parentElement;
        if (!parent) return NodeFilter.FILTER_REJECT;
        if (SKIP_TAGS.has(parent.tagName)) return NodeFilter.FILTER_REJECT;
        if (parent.getAttribute("data-bionic") === "1") return NodeFilter.FILTER_REJECT;
        if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    }
  );

  const textNodes = [];
  let node;
  while ((node = walker.nextNode())) textNodes.push(node);

  textNodes.forEach(tn => {
    const frag = transformTextNode(tn, ratio);
    if (frag && tn.parentNode) {
      tn.parentNode.replaceChild(frag, tn);
    }
  });
}

// ─── Apply / Revert ──────────────────────────────────────────────────────────

function apply(ratio) {
  if (isApplied) revert();

  // Inject stylesheet
  if (!document.getElementById("bionic-reader-style")) {
    const style = document.createElement("style");
    style.id = "bionic-reader-style";
    style.textContent = `
      .bionic-bold {
        font-weight: 700 !important;
        font-style: normal !important;
      }
    `;
    document.head.appendChild(style);
  }

  walkAndTransform(document.body, ratio);
  isApplied = true;

  // Watch for new content (SPAs, infinite scroll)
  startObserver(ratio);
}

function revert() {
  stopObserver();

  // Remove all <strong data-bionic> and restore text
  document.querySelectorAll("strong[data-bionic='1']").forEach(el => {
    const text = el.textContent;
    const nextSibling = el.nextSibling;
    const parent = el.parentNode;
    if (!parent) return;

    // Reconstruct the original text: bold part + next text node (the rest of the word)
    if (nextSibling && nextSibling.nodeType === Node.TEXT_NODE) {
      const combined = document.createTextNode(text + nextSibling.nodeValue);
      parent.insertBefore(combined, el);
      parent.removeChild(nextSibling);
    } else {
      parent.insertBefore(document.createTextNode(text), el);
    }
    parent.removeChild(el);
  });

  // Normalize text nodes
  try { document.body.normalize(); } catch(e) {}

  // Remove style
  const style = document.getElementById("bionic-reader-style");
  if (style) style.remove();

  isApplied = false;
}

// ─── MutationObserver for dynamic content ───────────────────────────────────

function startObserver(ratio) {
  if (observer) return;
  observer = new MutationObserver(mutations => {
    if (!settings.enabled) return;
    mutations.forEach(m => {
      m.addedNodes.forEach(node => {
        if (node.nodeType === Node.ELEMENT_NODE &&
            !SKIP_TAGS.has(node.tagName) &&
            !node.getAttribute("data-bionic")) {
          walkAndTransform(node, ratio);
        }
      });
    });
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

function stopObserver() {
  if (observer) { observer.disconnect(); observer = null; }
}

// ─── Message bridge ──────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === "TOGGLE") {
    settings.enabled = msg.enabled;
    settings.ratio = msg.ratio ?? settings.ratio;
    if (settings.enabled) apply(settings.ratio);
    else revert();
    sendResponse({ ok: true, isApplied });
  }

  if (msg.type === "UPDATE_RATIO") {
    settings.ratio = msg.ratio;
    if (settings.enabled) apply(settings.ratio);
    sendResponse({ ok: true });
  }

  if (msg.type === "GET_STATE") {
    sendResponse({ enabled: settings.enabled, isApplied });
  }
});

// ─── Init: restore state from storage ────────────────────────────────────────

chrome.storage.local.get(STORAGE_KEY, (data) => {
  const saved = data[STORAGE_KEY];
  if (saved) {
    settings = { ...settings, ...saved };
    if (settings.enabled) apply(settings.ratio);
  }
});
