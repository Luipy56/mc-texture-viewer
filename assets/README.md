# Texture assets (Minecraft resource pack layout)

Textures follow the **Minecraft resource pack** structure. All paths start from this `assets/` directory.

- **`assets/minecraft/textures/block/`** — block textures (e.g. `warped_nylium.png`)
- **`assets/minecraft/textures/entity/`** — entity textures
- **`assets/minecraft/textures/item/`** — item textures
- **`assets/minecraft/textures/painting/`** — painting textures
- **`assets/<namespace>/textures/...`** — add other namespaces as needed

The viewer’s `texture-base-url` must point to the **root** of this folder (e.g. `./assets/` or `https://example.com/assets/`). The texture manifest then uses paths relative to `assets/`, e.g. `minecraft/textures/block/warped_nylium.png`.
