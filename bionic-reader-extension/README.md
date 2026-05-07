# Bionic Reader — Chrome Extension

Speed-read any webpage by bolding the first letters of every word.

Bionic Reading is a reading method developed to guide the eyes through text using artificial fixation points. By bolding the initial letters of each word, your brain completes the rest — letting you read faster with less fatigue.

---

## Features

- **One-click toggle** — enable/disable on any page instantly
- **Bold ratio slider** — control how much of each word gets bolded (20%–65%)
- **Persistent settings** — remembers your preferences across browser sessions
- **SPA-friendly** — MutationObserver watches for dynamically loaded content
- **Revert cleanly** — toggling off fully restores the original DOM
- **Lightweight** — no external dependencies, no tracking, no network requests

---

## Install (Developer Mode)

1. Clone or download this repository
2. Open Chrome and go to `chrome://extensions`
3. Enable **Developer mode** (top right toggle)
4. Click **Load unpacked** and select this folder
5. The Bionic Reader icon will appear in your toolbar

---

## Project Structure

```
bionic-reader-extension/
├── manifest.json          # Extension manifest (v3)
├── content.js             # Core bionic engine — injected into pages
├── background.js          # Service worker — badge updates
├── popup/
│   ├── popup.html         # Extension popup UI
│   ├── popup.css          # Popup styles
│   └── popup.js           # Popup logic & messaging
└── icons/
    ├── icon16.png
    ├── icon32.png
    ├── icon48.png
    └── icon128.png
```

---

## How It Works

The content script walks the DOM using `TreeWalker`, finding text nodes inside readable elements. For each word it:

1. Splits off leading/trailing punctuation
2. Calculates `boldLen = ceil(word.length × ratio)`
3. Wraps the first `boldLen` characters in a `<strong>` tag
4. Leaves the rest as a plain text node

Toggling off reverses the process: each `<strong data-bionic>` is removed and adjacent text nodes are merged back together, then `normalize()` is called to clean up the DOM.

---

## Contributing

PRs welcome! Some ideas:
- Per-site settings
- Keyboard shortcut toggle
- Firefox (Manifest v2) port
- Custom CSS theming
- Reading speed estimator

---

## License

MIT — free to use, modify, and distribute.
