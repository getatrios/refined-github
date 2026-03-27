# Setup Guide

## Chrome

1. Download the latest release from the [Releases page](https://github.com/refined-github/refined-github/releases) or build from source (see [Development](#development) below)
2. Navigate to `chrome://extensions/`
3. Enable **Developer mode** (toggle in the top right)
4. Click **Load unpacked**
5. Select the `distribution/` folder
6. Navigate to any GitHub page to verify the extension is working

## Safari

1. Install [Xcode](https://developer.apple.com/xcode/) from the Mac App Store
2. Open Xcode at least once to install required components
3. Build the extension (see [Development](#development) below)
4. Open the Xcode project:
   ```bash
   open safari/Refined\ GitHub.xcodeproj
   ```
5. Select the **Refined GitHub** scheme and **My Mac** as the destination
6. Click **Run** (or press `Cmd+R`) to build and launch the host app
7. When the app opens, follow its instructions to enable the extension
8. Open Safari, go to **Settings > Extensions**, and enable **Refined GitHub**

### Safari debugging

Enable the Develop menu in **Safari > Settings > Advanced > Show Develop menu**, then go to **Develop > Web Extension Background Content** to inspect the extension.

---

## Development

### Prerequisites

- Node.js (latest LTS)
- npm
- Xcode (for Safari only)

### Install and Build

```bash
npm install
npm run build
```

For continuous rebuilding during development:

```bash
npm run watch
```

After making changes, reload the extension:

- **Chrome**: Click the refresh icon on the extension card in `chrome://extensions/`, then reload the GitHub tab
- **Safari**: Re-run the Xcode project (`Cmd+R`)

### Running Tests

```bash
npm test          # Full test suite (tests + lint + type check + build)
npm run vitest    # Unit tests only
npm run lint      # Linting only
npm run fix       # Auto-fix lint/formatting issues and update snapshots
```

### Updating Feature Snapshots

After adding or modifying a feature, update the generated snapshot files so the options page picks up the changes:

```bash
npm run vitest -- --update
npm run build
```
