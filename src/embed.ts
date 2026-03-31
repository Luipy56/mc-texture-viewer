import {
  McViewerElement,
  MC_TEXTURE_VIEWER_ERROR_EVENT,
} from './viewer/McViewerElement.js';
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
      /** Same string as `MC_TEXTURE_VIEWER_ERROR_EVENT` — use for addEventListener. */
      ERROR_EVENT: typeof MC_TEXTURE_VIEWER_ERROR_EVENT;
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
    ERROR_EVENT: MC_TEXTURE_VIEWER_ERROR_EVENT,
  };
}
