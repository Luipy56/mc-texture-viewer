import { McViewerElement } from './viewer/McViewerElement.js';
import {
  warpedForestManifest,
  chickenManifest,
  cherryManifest,
  hutManifest,
  crimsonForestManifest,
} from './viewer/textureManifest.js';

if (!customElements.get(McViewerElement.tagName)) {
  customElements.define(McViewerElement.tagName, McViewerElement);
}

declare global {
  interface Window {
    McTextureViewer?: {
      warpedForestManifest: typeof warpedForestManifest;
      chickenManifest: typeof chickenManifest;
      cherryManifest: typeof cherryManifest;
      hutManifest: typeof hutManifest;
      crimsonForestManifest: typeof crimsonForestManifest;
    };
  }
}
if (typeof window !== 'undefined') {
  window.McTextureViewer = {
    warpedForestManifest,
    chickenManifest,
    cherryManifest,
    hutManifest,
    crimsonForestManifest,
  };
}
