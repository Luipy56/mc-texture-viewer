# 3D models

Each model lives in its own subdirectory so OBJ + MTL (and any local refs) stay together.

- **`warped-forest/`** — Warped Forest scene (Blockbench export: `warpedForest.obj`, `warpedForest.mtl`)
- **`crimson-forest/`** — Crimson Forest scene (`crimson.obj`, `crimson.mtl`)
- **`cherry/`** — Cherry scene (`cherry.obj`, `cherry.mtl`)
- **`hut/`** — Hut scene (`hut.obj`, `hut.mtl`)
- **`chicken/`** — Chicken entity (Blockbench export: `chicken.obj`, `chicken.mtl`)

Use `model-url` pointing to the OBJ file (e.g. `./models/warped-forest/warpedForest.obj`). For OBJ, the MTL must sit next to the OBJ and be referenced by the same base name.

## Dynamic model list (`models.json`)

The demo toolbar populates the Model select from **`models/models.json`**. Add entries there so new models appear in the dropdown without changing the HTML. Each entry:

- **`name`** — Label in the select
- **`url`** — URL of the OBJ (or GLB) file
- **`textureBaseUrl`** — Base URL for default textures (trailing slash optional)
- **`manifestKey`** — Optional. Key on `window.McTextureViewer` for the texture manifest (e.g. `"warpedForestManifest"`, `"chickenManifest"`). Omit to use the default manifest.
