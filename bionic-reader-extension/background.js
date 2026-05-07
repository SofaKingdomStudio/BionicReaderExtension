/**
 * Bionic Reader — background service worker
 * Handles extension icon badge and cross-tab state sync.
 */

const STORAGE_KEY = "bionicReaderSettings";

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({
    [STORAGE_KEY]: { enabled: false, ratio: 0.4 }
  });
});

// Update badge when tabs change
chrome.tabs.onActivated.addListener(({ tabId }) => {
  updateBadge(tabId);
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.active) {
    updateBadge(tabId);
  }
});

async function updateBadge(tabId) {
  try {
    const data = await chrome.storage.local.get(STORAGE_KEY);
    const enabled = data[STORAGE_KEY]?.enabled ?? false;
    const text = enabled ? "ON" : "";
    await chrome.action.setBadgeText({ text, tabId });
    await chrome.action.setBadgeBackgroundColor({ color: "#185FA5", tabId });
  } catch (e) {
    // Tab may not be accessible (chrome:// pages etc.)
  }
}
