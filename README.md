# 🅱 Bionic Reader

> Speed-read any webpage by bolding the first letters of every word.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Manifest Version](https://img.shields.io/badge/Manifest-v3-brightgreen.svg)](manifest.json)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

Bionic Reading is a method that guides your eyes through text using artificial fixation points. By bolding the initial characters of each word, your brain completes the rest — letting you read faster with less effort. This extension brings that to every webpage, with zero tracking and no external dependencies.

---

## Features

- **One-click toggle** — enable or disable on any page instantly
- **Adjustable bold ratio** — control how much of each word gets bolded (20 – 65%)
- **Live preview** — see the effect before applying it to the page
- **Persistent settings** — remembers your preferences across sessions
- **SPA-friendly** — `MutationObserver` watches for dynamically loaded content (infinite scroll, React/Vue apps, etc.)
- **Clean revert** — toggling off fully restores the original DOM with no artifacts
- **Badge indicator** — toolbar icon shows **ON** when active on the current tab
- **Lightweight** — ~5 KB total, no external dependencies, no network requests, no telemetry

---

## Installation

### From source (Developer Mode)

1. Clone this repository:
   ```bash
   git clone https://github.com/your-username/bionic-reader.git
   ```
2. Open Chrome (or any Chromium browser — Edge, Brave, Arc, etc.) and navigate to:
   ```
   chrome://extensions
   ```
3. Enable **Developer mode** using the toggle in the top-right corner.
4. Click **Load unpacked** and select the `bionic-reader-extension` folder.
5. Click the puzzle piece 🧩 in your toolbar, find **Bionic Reader**, and pin it.

### From the Chrome Web Store

> Coming soon.

---

## Usage

1. Navigate to any webpage with text (articles, Wikipedia, docs, etc.)
2. Click the **Bionic Reader** icon in your toolbar
3. Flip the toggle — the page text transforms immediately
4. Adjust the **bold ratio** slider to your preference (40% is a good starting point)
5. Toggle off to restore the original page at any time

> **Note:** The extension cannot run on `chrome://` pages, the Chrome Web Store, or other browser-protected URLs. This is a Chrome security restriction that applies to all extensions.

---

## Project Structure

```
bionic-reader-extension/
├── manifest.json          # Extension manifest (Manifest v3)
├── content.js             # Core bionic engine — injected into every page
├── background.js          # Service worker — manages badge state
├── popup/
│   ├── popup.html         # Popup UI markup
│   ├── popup.css          # Popup styles
│   └── popup.js           # Popup logic & messaging to content script
└── icons/
    ├── icon16.png
    ├── icon32.png
    ├── icon48.png
    └── icon128.png
```

---

## How It Works

### The algorithm

For each word on the page, the extension calculates a **bold length**:

```
boldLen = ceil(word.length × ratio)   // default ratio = 0.4
```

The first `boldLen` characters are wrapped in a `<strong data-bionic="1">` tag; the rest remain as a plain text node.

**Example** at 40% ratio:

| Original | Transformed |
|----------|-------------|
| reading  | **read**ing |
| complex  | **com**plex |
| the      | **t**he     |
| a        | **a**       |

### DOM traversal

The content script uses `TreeWalker` to efficiently visit every text node in the document while skipping elements that shouldn't be transformed:

- **Skipped tags:** `<script>`, `<style>`, `<code>`, `<pre>`, `<textarea>`, `<input>`, `<svg>`, and more
- **Punctuation-aware:** leading and trailing punctuation (quotes, brackets, etc.) is preserved outside the bold span
- **International characters:** handles accented and extended Latin characters (À–ȯ)

### Revert

Toggling off walks every `strong[data-bionic]` element, reconstructs the original text by merging the bold and trailing text nodes, removes the element, then calls `normalize()` to clean up the DOM.

### Dynamic content

A `MutationObserver` watches for newly added DOM nodes and applies the bionic transform to them automatically — so it works on infinite-scroll feeds, SPAs (React, Vue, etc.), and lazy-loaded content.

---

## Permissions

| Permission | Why it's needed |
|------------|-----------------|
| `activeTab` | Read and modify the text of the current tab when the user clicks the toggle |
| `storage` | Save your bold ratio and on/off preference across sessions |

No host permissions. No remote code. No analytics.

---

## Development

### Prerequisites

- Chrome 109+ (Manifest v3 support)
- No build step required — plain HTML, CSS, and JavaScript

### Making changes

1. Edit any file in the extension folder
2. Go to `chrome://extensions`
3. Click the **↺ refresh** button on the Bionic Reader card
4. Reload the tab you're testing on

### Running tests

There are no automated tests yet — contributions welcome! See [Contributing](#contributing).

---

## Roadmap

- [ ] Per-site settings (enable/disable allowlist)
- [ ] Keyboard shortcut (`Alt+B`) to toggle
- [ ] Firefox port (Manifest v2)
- [ ] Custom highlight color instead of bold
- [ ] Reading speed estimator
- [ ] Chrome Web Store release
- [ ] Dark mode popup

---

## Contributing

PRs are welcome! Please open an issue first for significant changes so we can discuss the approach.

1. Fork the repo
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m 'Add my feature'`
4. Push to the branch: `git push origin feature/my-feature`
5. Open a Pull Request

---

## License

[MIT](LICENSE) — free to use, modify, and distribute.

---

## Acknowledgements

Inspired by the [Bionic Reading](https://bionic-reading.com/) concept by Renato Casutt.
