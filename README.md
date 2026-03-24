# mc-texture-viewer

Web-embeddable 3D viewer for Minecraft-style models. Supports **glTF/GLB** and **OBJ+MTL** (e.g. Blockbench export). Renders with textures, lights, and shadows. Supports hot-swapping texture packs via ZIP upload and fallback to default textures.

## Embedding

Add one script and use the custom element:

```html
<script src="https://your-cdn.com/mc-texture-viewer.js"></script>
<mc-texture-viewer
  model-url="https://example.com/model.glb"
  texture-base-url="https://example.com/textures/"
  auto-rotate
  sun-enabled
></mc-texture-viewer>
```

## Attributes

| Attribute | Description |
|-----------|-------------|
| `model-url` | URL of the model to load (`.glb` / `.gltf` or `.obj`). For OBJ, the MTL file must sit next to the OBJ and be referenced by the same base name (e.g. `model.obj` → `model.mtl`). |
| `texture-base-url` | Base URL for the default texture pack (trailing slash optional). Used for initial load and as fallback when the user pack misses a texture. |
| `auto-rotate` | If present or `"true"`, the model rotates automatically around the Y axis. |
| `sun-enabled` | If present or not `"false"`, the directional (sun) light is on. |

## Properties (reflected)

Same as attributes, readable and writable from JavaScript: `modelUrl`, `textureBaseUrl`, `autoRotate`, `sunEnabled`. `loadedModel` is read-only and holds the current loaded model data or `null`.

## Methods

- **`setTextureManifest(manifest: TextureManifest): void`**  
  Sets the texture manifest (material name → texture filename) for the current model. Use for OBJ models or custom packs. The bundle exposes `window.McTextureViewer.warpedForestManifest` for the example Warped Forest model.
- **`applyTextureZip(zipBlob: Blob): Promise<void>`**  
  Applies a texture pack from a ZIP file. The ZIP should contain image files (e.g. `.png`). Filenames are matched to the model’s texture manifest; missing entries use the default pack. Call after a model is loaded.

## Events

- **`model-loaded`** — Fired when the GLB has been loaded. `event.detail.model` contains the loaded model (group, meshes, materials).
- **`error`** — Fired on load or runtime errors. `event.detail.message`, `event.detail.source`.
- **`texture-pack-applied`** — Fired after `applyTextureZip()` finishes applying textures.

## Example with ZIP upload

```html
<mc-texture-viewer id="viewer" model-url="./model.glb" texture-base-url="./textures/"></mc-texture-viewer>
<input type="file" accept=".zip" id="zipInput" />

<script>
  const viewer = document.getElementById('viewer');
  document.getElementById('zipInput').addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (file) await viewer.applyTextureZip(file);
  });
</script>
```

## Directory layout

- **`models/`** — 3D models, one subfolder per model (e.g. `models/warped-forest/warpedForest.obj` + `warpedForest.mtl`).
- **`assets/`** — Default texture pack in **Minecraft resource pack** layout. All paths start at `assets/`:
  - `assets/minecraft/textures/block/` — block textures
  - `assets/minecraft/textures/entity/` — entity textures (if needed)

Set `texture-base-url` to the root of this folder (e.g. `./assets/`). The texture manifest uses paths relative to it (e.g. `minecraft/textures/block/warped_nylium.png`).

## Demo and example model

The repo includes a Warped Forest OBJ+MTL model in `models/warped-forest/` (Blockbench export). The demo loads it and uses `warpedForestManifest` with textures from `assets/minecraft/textures/block/`. Add your PNGs there (or supply a ZIP via the UI). The OBJ’s `mtllib` must point to the MTL next to it (e.g. `warpedForest.mtl`).

## Build

```bash
npm install
npm run build
```

Output:

- **`dist/mc-texture-viewer.js`** — IIFE: custom element + `window.McTextureViewer` manifests only.
- **`dist/mc-texture-viewer-demo.js`** — IIFE that also boots the full toolbar (`initMcTextureViewerDemo`); pair with **`dist/viewer-demo.html`** and **`dist/demo-toolbar.css`**, plus `models/` and `assets/` as in dev.
- **`dist/viewer-embed.html`** — minimal single-model page (no toolbar); omit `auto-rotate` unless you want spin by default.

When the demo lives under a subpath (e.g. `/testing/`), `viewer-demo.html` infers the prefix from the script URL so `/models/…` in `models.json` resolves correctly. Override with `data-asset-base="/your/prefix"` on `#mcDemoRoot` if needed.

## Development

```bash
npm run dev
```

Open the demo page and (optionally) point `model-url` and `texture-base-url` to local assets.
