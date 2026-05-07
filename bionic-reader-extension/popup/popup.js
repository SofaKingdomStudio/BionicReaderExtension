/**
 * Bionic Reader — popup script
 */

const STORAGE_KEY = "bionicReaderSettings";

const toggleEl     = document.getElementById("toggle");
const statusLabel  = document.getElementById("status-label");
const ratioSlider  = document.getElementById("ratio");
const ratioVal     = document.getElementById("ratio-val");
const previewEl    = document.getElementById("preview");

const PREVIEW_TEXT = "The quick brown fox jumps over the lazy dog.";

// ── Helpers ──────────────────────────────────────────────────────────────────

function boldLen(word, ratio) {
  return Math.max(1, Math.ceil(word.length * ratio));
}

function renderPreview(ratio) {
  const words = PREVIEW_TEXT.split(/(\s+)/);
  previewEl.innerHTML = words.map(token => {
    if (/^\s+$/.test(token) || !token) return token;
    const match = token.match(/^([^a-zA-Z]*)([a-zA-Z]+)([^a-zA-Z]*)$/);
    if (!match) return token;
    const [, pre, word, post] = match;
    const bl = boldLen(word, ratio);
    return `${pre}<strong>${word.slice(0, bl)}</strong>${word.slice(bl)}${post}`;
  }).join("");
}

function setStatus(enabled) {
  if (enabled) {
    statusLabel.textContent = "On — reading this page";
    statusLabel.className = "status on";
  } else {
    statusLabel.textContent = "Off";
    statusLabel.className = "status off";
  }
  toggleEl.checked = enabled;
}

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

async function sendToContent(msg) {
  const tab = await getActiveTab();
  if (!tab?.id) return;
  try {
    await chrome.tabs.sendMessage(tab.id, msg);
  } catch (e) {
    // Content script not yet injected on this page (e.g. chrome:// pages)
    console.warn("Bionic Reader: could not reach content script.", e.message);
  }
}

async function saveSettings(settings) {
  await chrome.storage.local.set({ [STORAGE_KEY]: settings });
}

// ── Init ─────────────────────────────────────────────────────────────────────

(async () => {
  const data = await chrome.storage.local.get(STORAGE_KEY);
  const saved = data[STORAGE_KEY] ?? { enabled: false, ratio: 0.4 };

  const ratioPercent = Math.round(saved.ratio * 100);
  ratioSlider.value = ratioPercent;
  ratioVal.textContent = ratioPercent + "%";
  renderPreview(saved.ratio);
  setStatus(saved.enabled);
})();

// ── Events ───────────────────────────────────────────────────────────────────

toggleEl.addEventListener("change", async () => {
  const enabled = toggleEl.checked;
  const ratio = ratioSlider.value / 100;
  setStatus(enabled);
  await saveSettings({ enabled, ratio });
  await sendToContent({ type: "TOGGLE", enabled, ratio });
});

ratioSlider.addEventListener("input", async () => {
  const percent = parseInt(ratioSlider.value, 10);
  const ratio = percent / 100;
  ratioVal.textContent = percent + "%";
  renderPreview(ratio);
});

ratioSlider.addEventListener("change", async () => {
  const ratio = ratioSlider.value / 100;
  const data = await chrome.storage.local.get(STORAGE_KEY);
  const current = data[STORAGE_KEY] ?? {};
  const updated = { ...current, ratio };
  await saveSettings(updated);
  if (updated.enabled) {
    await sendToContent({ type: "UPDATE_RATIO", ratio });
  }
});
