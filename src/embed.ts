import { McViewerElement } from './viewer/McViewerElement.js';
import { warpedForestManifest } from './viewer/textureManifest.js';

if (!customElements.get(McViewerElement.tagName)) {
  customElements.define(McViewerElement.tagName, McViewerElement);
}

declare global {
  interface Window {
    McTextureViewer?: { warpedForestManifest: typeof warpedForestManifest };
  }
}
if (typeof window !== 'undefined') {
  window.McTextureViewer = { warpedForestManifest };
}
