/**
 * Static / IIFE entry: registers the custom element (via embed) and boots the full toolbar demo.
 * Loaded by viewer-demo.html; asset base is inferred from this script URL for subpath deploys.
 */
import './embed.js';
import { initMcTextureViewerDemo } from './demo-toolbar.js';

/** Directory URL of the demo script (e.g. `/testing` for `/testing/mc-texture-viewer-demo.js`). */
function directoryFromScriptSrc(src: string): string {
  if (!src) return '';
  try {
    const u = new URL(src);
    const dir = u.pathname.replace(/\/[^/]+$/, '');
    return dir.replace(/\/$/, '') || '';
  } catch {
    return '';
  }
}

/**
 * `document.currentScript` is only set during synchronous script execution. When `boot` runs on
 * `DOMContentLoaded`, it is always null — so resolve the bundle URL from the script tag in the DOM.
 */
function inferAssetBase(): string {
  const cur = document.currentScript as HTMLScriptElement | null;
  if (cur?.src) return directoryFromScriptSrc(cur.src);
  const tagged = document.querySelector(
    'script[src*="mc-texture-viewer-demo.js"]',
  ) as HTMLScriptElement | null;
  if (tagged?.src) return directoryFromScriptSrc(tagged.src);
  return '';
}

function boot(): void {
  const root = document.getElementById('mcDemoRoot');
  if (!root) return;
  if (!root.hasAttribute('data-asset-base')) {
    const inferred = inferAssetBase();
    if (inferred) root.setAttribute('data-asset-base', inferred);
  }
  initMcTextureViewerDemo(root, 'embed');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
