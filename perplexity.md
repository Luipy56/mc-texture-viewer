# Recommended Technologies for a Web‑Embeddable 3D Model Viewer

This document summarizes the recommended technologies and architectural choices for building a 3D model viewer that can run as a standalone web app and as an embeddable widget inside existing websites.

**Core requirements (from product brief):** Embeddable in existing sites; 3D rendering with textures, lights and **shadows**; **hot‑reload texture editing** (changes visible immediately); user texture packs via `.zip` upload; default textures as **fallback** when user pack is missing required textures.

---

## 1. 3D Model Formats

### Primary format: glTF / GLB

- Use **glTF/GLB** as the primary runtime format for the viewer.  
- Prefer **GLB** (binary glTF) for production:
  - Single file containing geometry, materials, and textures.
  - Reduced number of HTTP requests.
  - Designed specifically for efficient web and real‑time use.
- Keep support for OBJ/MTL only in the *content pipeline* (conversion) instead of at runtime if possible.

### Pipeline for existing OBJ/MTL assets

1. Artists deliver models as `file.obj`, `file.mtl` plus a texture directory.
2. A build/conversion step (offline) converts them to GLB:
   - Tools: Blender, `gltf-transform`, or similar.
   - Optionally apply mesh compression (e.g., Draco) and texture compression.
3. The web viewer loads the resulting GLB files at runtime.

This approach gives you a future‑proof, web‑optimized format while still allowing your current OBJ/MTL workflow.

---

## 2. 3D Engine and Core Viewer

### 2.1. Rendering engine

- Use **Three.js** as the core 3D engine:
  - Mature ecosystem and documentation.
  - Built‑in loaders for glTF/GLB.
  - Good control over lights, camera, and materials.
  - Easy integration with common UI frameworks.

### 2.2. Model loading

- Primary loader:
  - `GLTFLoader` to load GLTF/GLB models.
- Optional compatibility:
  - `OBJLoader` + `MTLLoader` only if you want to directly support OBJ/MTL uploads at runtime.
  - Recommended approach: convert uploads to glTF/GLB server‑side instead of loading OBJ/MTL in the browser.

### 2.3. Camera and interactions

Required interactions:

- Rotate the model (user‑driven + auto‑rotation).
- Zoom in/out.
- Pan (optional but recommended for usability).

Implementation suggestions:

- Use **OrbitControls** (Three.js extra) for:
  - Orbit around the object with mouse/touch.
  - Zoom with scroll/pinch.
  - Optional pan.
- Auto‑rotation:
  - In the render loop, increment the model’s rotation (e.g., around the Y axis) when auto‑rotation is enabled.
  - Allow enabling/disabling auto‑rotation via UI or component attributes.

---

## 3. Lighting and “Sun” Control

The viewer must support:

- A light simulating the Sun.
- User can toggle it on/off.
- User can move it around.

Recommendations:

- Use a **DirectionalLight** to represent the Sun.
  - DirectionalLight simulates a light at infinite distance, similar to sunlight.
- Controls:
  - Expose light position/direction as parameters controlled by UI sliders or an on‑screen “sun gizmo”.
  - Allow toggling the light on/off via UI or an attribute of the embeddable component.
- Optional enhancements:
  - Add ambient light for base visibility (so the model is never completely black).
  - Allow controlling intensity and color of the Sun light.

### 3.1. Shadows

Your product requires shadows. In Three.js:

- Enable shadow mapping on the **WebGLRenderer**: `renderer.shadowMap.enabled = true` (and optionally `renderer.shadowMap.type = THREE.PCFSoftShadowMap` for softer edges).
- On the **DirectionalLight**: set `light.castShadow = true`, and configure `light.shadow.mapSize`, `light.shadow.camera.near/far` and orthographic bounds so the model is inside the shadow camera frustum.
- On each **Mesh** that should cast or receive shadows: `mesh.castShadow = true` and/or `mesh.receiveShadow = true`.
- GLB models loaded via GLTFLoader already have meshes; traverse the scene and set `castShadow`/`receiveShadow` on them (or do it once in the loader callback). No extra format or engine is needed; this is standard Three.js.

---

## 4. Texture Packs and User‑Provided Textures

### 4.1. Concept

Requirements:

- Each model has a default texture pack.
- Users can upload their own texture pack (directory/ZIP of `.png` files).
- Model design defines the expected texture names and mapping.
- If a texture is missing in the user’s pack, the default texture is used.

### 4.2. Naming and mapping strategy

1. For each model, define a **texture manifest** describing:
   - Expected texture keys (e.g., `body`, `wheels_diffuse`, `glass`).
   - Corresponding file names (e.g., `body.png`, `wheels/diffuse.png`).
   - Which material/slot each texture is applied to.
2. When loading:
   - Build a map `{ expectedFileName -> textureUrlOrBlob }`.
   - For each expected texture:
     - Try to load from user pack.
     - If not present, fall back to default texture.

### 4.3. Handling user uploads

You have two main options depending on file size and architecture:

**Client‑side only (simpler for a first version):**

- User uploads a ZIP in the browser.
- Use a JS ZIP library to:
  - Read and decompress the archive in memory.
  - Build `Blob`/`ObjectURL` for each texture file.
- Use Three.js `TextureLoader` to load from these URLs, then assign them to the relevant materials.

**Server‑side processing (better for larger assets and persistence):**

- User uploads the ZIP to the backend.
- Backend:
  - Unzips and stores textures in a storage bucket.
  - Validates filenames against the manifest.
- Viewer receives URLs from the backend:
  - For each expected texture name, backend returns either the custom texture URL or the default URL.
- Viewer loads textures via `TextureLoader` and applies them.

### 4.4. Applying textures to materials

- For GLB models, you can:
  - Load the model.
  - Traverse the scene graph and identify the materials.
  - Replace material maps (`map`, `normalMap`, etc.) with the loaded textures according to the manifest.
- For OBJ/MTL (if used directly):
  - After loading the mesh, modify the materials similarly.

### 4.5. Hot (live) texture editing

To support **editing textures in real time** without reloading the model:

- Keep a reference to the loaded model and its materials (e.g. from the GLTFLoader result).
- When the user uploads a new ZIP or switches texture pack:
  1. Load new textures with `TextureLoader` (from blob URLs or server URLs).
  2. Traverse materials and **replace** `material.map` (and `normalMap`, etc.) with the new `Texture` instances.
  3. **Dispose** the previous textures: `oldTexture.dispose()` to avoid GPU and memory leaks.
  4. No need to reload the GLB; the next frame will show the new textures.
- Optionally mark materials for update if you change attributes: `material.needsUpdate = true` is for *Material* definition changes; for swapping only the texture reference, assigning a new texture is enough.
- Expose this as a single “apply texture pack” (or per-slot) API on the embeddable component so the host page or your own UI can trigger it (e.g. after ZIP parse or after selecting a pack). This gives you “edit in caliente” with minimal latency.

---

## 5. Embeddable Web Viewer

You need something that can be dropped into any existing page, similar to embedding a video.

### 5.1. Web Component approach (recommended)

Create a **custom element**, e.g. `<x-3d-viewer>`:

- Implementation:
  - Pure JavaScript/TypeScript, using Web Components APIs.
  - Internally, create a `<canvas>` inside the shadow DOM where Three.js renders.
- Usage in host pages:
  - Include a single `<script src="viewer-bundle.js"></script>`.
  - Use the tag directly:  
    ```html
    <x-3d-viewer
      model-url="https://example.com/models/model1.glb"
      auto-rotate="true"
      sun-enabled="true"
    ></x-3d-viewer>
    ```
- Configuration via attributes / properties:
  - `model-url`: currently selected model.
  - `auto-rotate`: enable/disable rotation.
  - `sun-enabled`: toggle Sun light.
  - Optional: `background-color`, `camera-distance`, etc.
- Communication:
  - Custom events for host pages (e.g., `modelLoaded`, `texturePackLoaded`, `error`).

Advantages:

- Framework‑agnostic: works with plain HTML, React, Vue, etc.
- Simple integration: one script + one tag.
- Clear encapsulation via shadow DOM.

### 5.2. React‑based viewer bundle (alternative)

If you build your main app in **React**, you can also:

- Implement the viewer as a React component using **react‑three‑fiber** (React bindings for Three.js) for nicer declarative code.
- Export:
  - A React component (for internal use in your own app).
  - A small loader script that mounts the viewer into a given DOM node, so third‑party sites can embed it by:
    ```html
    <div id="my-3d-viewer"></div>
    <script src="viewer-bundle.js"></script>
    <script>
      create3DViewer('#my-3d-viewer', { modelUrl: '...', autoRotate: true });
    </script>
    ```
This approach is more convenient if most of your environment is React, but the Web Component approach remains the most “universal”.

---

## 6. “Main” Web Application vs. Embedded Viewer

You mentioned both a full application and an embeddable viewer. A clean separation is:

### 6.1. Full application (admin / dashboard)

Responsibilities:

- Model library management.
- Upload and management of texture packs.
- User accounts, permissions, and billing (if applicable).
- Preview and configuration of viewers (e.g., generate embed snippets).

Suggested stack:

- **Frontend:** React + Vite (or Next.js if you need SSR/SEO).
- **3D:** Three.js or React Three Fiber for admin previews.
- **State management:** React Query / Zustand / Redux (depending on your preference).

### 6.2. Embedded viewer module

Responsibilities:

- Fast loading.
- Minimal dependencies.
- No heavy admin UI or routing.
- API through attributes and custom events only.

Suggested stack:

- **Implementation:** Vanilla JS/TS + Three.js, compiled to a single or few small bundles.
- **Exposure:** Web Component custom element.
- **Bundle size:** Use a bundler (e.g. Vite, esbuild) with tree‑shaking and import only the Three.js modules you need (e.g. `import { ... } from 'three'`), so the embed script stays small and does not pull in the whole library.

---

## 7. Backend and Storage

While backend tech is flexible, you do need some minimal services:

### 7.1. API server

Responsibilities:

- Authentication and user management (for the main app).
- Model metadata and texture manifest storage.
- Handling uploads of models and texture packs.
- Returning URLs and manifests for the embedded viewer.

Possible stacks (pick what you know best):

- Python: Django / Django REST Framework.
- PHP: Laravel.
- Node.js: Express / NestJS.
- Others as preferred.

### 7.2. File storage

Requirements:

- Store:
  - GLB model files (and optionally source OBJ/MTL).
  - Default texture packs.
  - User‑uploaded texture packs.

Options:

- S3‑compatible object storage (AWS S3, DigitalOcean Spaces, etc.).
- Static file hosting with CDN for public models and textures.

Patterns:

- Backend stores files and returns public or signed URLs.
- Embedded viewer receives a simple configuration (model URL + list of texture URLs/keys).

---

## 8. Performance and Optimization

Even a first version benefits from some basic optimizations:

- Keep polygon count reasonable for web and mobile devices.
- Use **GLB** for fewer requests and optionally:
  - Mesh compression (e.g., Draco).
  - Compressed textures (WebP, KTX2) where supported.
- Lazy‑load models and textures:
  - Load only one model at a time.
  - Show a loading indicator while switching between models.
- Provide a quality/performance toggle if models are heavy (e.g., switch to lower‑res textures on mobile).

---

## 9. Feature Mapping to Technologies

A quick mapping of your requirements to concrete tools:

- Display and rotate 3D models:
  - Three.js + GLTFLoader + OrbitControls.
- Zoom and pan:
  - OrbitControls configuration.
- Auto‑rotation:
  - Simple rotation in the render loop.
- Sun light on/off and move:
  - DirectionalLight with parameters exposed via UI/component attributes.
- **Shadows:**
  - `renderer.shadowMap.enabled` + `DirectionalLight.castShadow` + mesh `castShadow`/`receiveShadow`.
- **Hot texture editing (editar en caliente):**
  - Replace material maps in memory, dispose old textures; no model reload.
- Single model display with arrows to switch:
  - State management in the viewer (list of model URLs, current index).
- Default and custom texture packs (with fallback):
  - Texture manifest + TextureLoader + fallback logic + live swap (see §4.5).
- Embeddable viewer:
  - Web Component `<x-3d-viewer>` built with Three.js (tree‑shaken bundle).
- Full app (admin side):
  - React frontend + backend API + object storage.

---

## 10. Summary of Recommended Stack

- **Formats**
  - Runtime: glTF/GLB.
  - Pipeline input (optional): OBJ/MTL.
- **Engine**
  - Three.js as the main 3D engine.
- **Rendering**
  - DirectionalLight for “sun”, shadow mapping enabled (cast/receive shadows on meshes).
- **Embeddable viewer**
  - Web Component + Three.js (tree‑shaken bundle), exposing a custom HTML tag.
- **Main web app**
  - React + Three.js / React Three Fiber.
- **Backend & storage**
  - Any RESTful backend (Django, Laravel, Node, etc.) + S3‑like object storage.
- **Textures**
  - Manifest‑driven mapping; client- or server-side handling of ZIP texture packs; fallback to default textures when a slot is missing; **hot swap** (replace material maps in memory and dispose old textures) for real‑time editing.

This combination balances performance, ease of integration into third‑party sites, and maintainability as the project grows and you add features such as user accounts, sharing, or monetization.
