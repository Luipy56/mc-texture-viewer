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

## Demo and example model

The repo includes an example OBJ+MTL model in `ejemploAntiguoModelo/` (Warped Forest, from Blockbench). The demo page loads `warpedForest.obj`. Textures are referenced in the MTL as `default/*.png`; put your texture files in `ejemploAntiguoModelo/default/` so they load. The OBJ’s `mtllib` must point to the correct MTL file (e.g. `warpedForest.mtl`).

## Build

```bash
npm install
npm run build
```

Output: `dist/mc-texture-viewer.js` (IIFE). Serve it and the assets (model, default textures) from your origin or CDN.

## Development

```bash
npm run dev
```

Open the demo page and (optionally) point `model-url` and `texture-base-url` to local assets.
