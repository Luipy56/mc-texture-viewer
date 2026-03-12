import { McViewerElement } from './viewer/McViewerElement.js';
import {
  warpedForestManifest,
  chickenManifest,
} from './viewer/textureManifest.js';

if (!customElements.get(McViewerElement.tagName)) {
  customElements.define(McViewerElement.tagName, McViewerElement);
}

declare global {
  interface Window {
    McTextureViewer?: {
      warpedForestManifest: typeof warpedForestManifest;
      chickenManifest: typeof chickenManifest;
    };
  }
}
if (typeof window !== 'undefined') {
  window.McTextureViewer = { warpedForestManifest, chickenManifest };
}
