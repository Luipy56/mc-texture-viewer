import {
  Scene,
  PerspectiveCamera,
  WebGLRenderer,
  Color,
  Box3,
  Vector3,
  DirectionalLight,
  AmbientLight,
  PCFSoftShadowMap,
  TextureLoader,
  RGBAFormat,
  NearestFilter,
  DoubleSide,
  FrontSide,
  Plane,
  type Group,
  type Mesh,
  type Material,
  type Texture,
  type MeshStandardMaterial,
  type MeshPhongMaterial,
  type MeshLambertMaterial,
  type MeshBasicMaterial,
} from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { TextureManifest, TransitionType } from './types.js';

export interface LoadedModel {
  group: Group;
  meshes: Mesh[];
  materials: Material[];
}

export interface TexturePackResult {
  applied: number;
  fromDefault: number;
  errors: string[];
}

const AUTO_ROTATE_SPEED_BASE = 0.3 * (Math.PI / 180);
const SUN_RADIUS = 20;

const GL_CONTEXT_OPTS: WebGLContextAttributes = {
  alpha: true,
  depth: true,
  stencil: true,
  antialias: true,
  premultipliedAlpha: true,
  preserveDrawingBuffer: false,
  failIfMajorPerformanceCaveat: false,
  powerPreference: 'default',
};

const GL_CONTEXT_OPTS_SOFT: WebGLContextAttributes = {
  ...GL_CONTEXT_OPTS,
  antialias: false,
  powerPreference: 'low-power',
};

/**
 * Acquire a WebGL context without constructing WebGLRenderer (avoids repeated
 * THREE.js console errors when GL is blocked, e.g. sandboxed iframe).
 */
function acquireWebGLContext(
  canvas: HTMLCanvasElement
): WebGLRenderingContext | WebGL2RenderingContext | null {
  return (
    canvas.getContext('webgl2', GL_CONTEXT_OPTS) ??
    canvas.getContext('webgl2', GL_CONTEXT_OPTS_SOFT) ??
    canvas.getContext('webgl', GL_CONTEXT_OPTS) ??
    canvas.getContext('webgl', GL_CONTEXT_OPTS_SOFT) ??
    null
  );
}

/**
 * Wrap an existing GL context in WebGLRenderer. Returns null if Three.js fails.
 */
function createWebGLRenderer(
  canvas: HTMLCanvasElement,
  context: WebGLRenderingContext | WebGL2RenderingContext
): WebGLRenderer | null {
  try {
    return new WebGLRenderer({ canvas, context });
  } catch {
    return null;
  }
}

/** Apply pixel-art style: no blur, crisp texels (Minecraft-style). */
function setTexturePixelFilter(texture: Texture): void {
  texture.magFilter = NearestFilter;
  texture.minFilter = NearestFilter;
}

/** Enable transparency and double-side only for this material (e.g. plants). */
function setMaterialTransparentAndDoubleSide(mat: Material & { transparent?: boolean; alphaTest?: number; side?: number }): void {
  mat.transparent = true;
  mat.alphaTest = 0.01;
  mat.side = DoubleSide;
}

/** True if the texture image has any alpha channel below 255 (used to apply DoubleSide only to foliage). */
function textureHasAlpha(texture: Texture): boolean {
  const img = texture.image as HTMLImageElement | undefined;
  if (!img?.complete || img.naturalWidth === 0) return false;
  try {
    const canvas = document.createElement('canvas');
    canvas.width = Math.min(img.naturalWidth, 64);
    canvas.height = Math.min(img.naturalHeight, 64);
    const ctx = canvas.getContext('2d');
    if (!ctx) return false;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    for (let i = 3; i < data.length; i += 4) if (data[i] < 255) return true;
    return false;
  } catch {
    return false;
  }
}

export class SceneManager {
  /**
   * Build a scene manager, or return null if WebGL cannot be initialized.
   */
  static tryCreate(canvas: HTMLCanvasElement): SceneManager | null {
    const gl = acquireWebGLContext(canvas);
    if (!gl) return null;
    const renderer = createWebGLRenderer(canvas, gl);
    if (!renderer) {
      const lose = gl.getExtension('WEBGL_lose_context') as
        | WEBGL_lose_context
        | null;
      lose?.loseContext();
      return null;
    }
    try {
      return new SceneManager(canvas, renderer);
    } catch {
      renderer.dispose();
      return null;
    }
  }

  readonly scene: Scene;
  readonly camera: PerspectiveCamera;
  readonly renderer: WebGLRenderer;
  private controls: OrbitControls | null = null;
  private animationFrameId: number | null = null;
  private _modelGroup: Group | null = null;
  private _loadedModel: LoadedModel | null = null;
  private _onModelLoaded: ((model: LoadedModel) => void) | null = null;
  private _autoRotate = false;
  private _rotationSpeedMultiplier = 1;
  private _sunEnabled = true;
  private _sunAzimuthDeg = 30;
  private _sunElevationDeg = 50;
  private _sunIntensity = 1.4;
  private _sunColor = 0xfff0e0;
  private ambientLight: AmbientLight;
  private directionalLight: DirectionalLight;
  private _textureManifest: TextureManifest | null = null;
  private _defaultTextureBaseUrl = '';
  private readonly _currentTextures = new Map<Material, Texture>();
  private readonly textureLoader = new TextureLoader();
  private _transitionType: TransitionType = 'spin';
  private _transitionOverlay: HTMLDivElement | null = null;

  private constructor(canvas: HTMLCanvasElement, renderer: WebGLRenderer) {
    this.scene = new Scene();
    this.scene.background = new Color(0x1a1a1a);

    this.camera = new PerspectiveCamera(50, 1, 0.1, 1000);
    this.camera.position.set(0, 0, 5);

    this.renderer = renderer;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = 'srgb';
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = PCFSoftShadowMap;
    this.renderer.setSize(canvas.clientWidth, canvas.clientHeight);

    this.ambientLight = new AmbientLight(0xfff5eb, 0.35);
    this.scene.add(this.ambientLight);

    this.directionalLight = new DirectionalLight(this._sunColor, this._sunIntensity);
    this.updateSunPosition();
    this.directionalLight.castShadow = true;
    this.directionalLight.shadow.mapSize.width = 2048;
    this.directionalLight.shadow.mapSize.height = 2048;
    this.directionalLight.shadow.camera.near = 0.5;
    this.directionalLight.shadow.camera.far = 50;
    this.directionalLight.shadow.camera.left = -15;
    this.directionalLight.shadow.camera.right = 15;
    this.directionalLight.shadow.camera.top = 15;
    this.directionalLight.shadow.camera.bottom = -15;
    this.scene.add(this.directionalLight);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.enablePan = true;
    this.controls.target.set(0, 0, 0);
  }

  set onModelLoaded(cb: ((model: LoadedModel) => void) | null) {
    this._onModelLoaded = cb;
  }

  get loadedModel(): LoadedModel | null {
    return this._loadedModel;
  }

  get modelGroup(): Group | null {
    return this._modelGroup;
  }

  set autoRotate(value: boolean) {
    this._autoRotate = value;
  }

  set sunEnabled(value: boolean) {
    this._sunEnabled = value;
    this.directionalLight.visible = value;
  }

  set rotationSpeedMultiplier(value: number) {
    this._rotationSpeedMultiplier = Math.max(0.1, Math.min(3, value));
  }

  get rotationSpeedMultiplier(): number {
    return this._rotationSpeedMultiplier;
  }

  private updateSunPosition(): void {
    const az = (this._sunAzimuthDeg * Math.PI) / 180;
    const el = (this._sunElevationDeg * Math.PI) / 180;
    const r = SUN_RADIUS;
    this.directionalLight.position.set(
      r * Math.cos(el) * Math.sin(az),
      r * Math.sin(el),
      r * Math.cos(el) * Math.cos(az)
    );
  }

  setSunDirection(azimuthDeg: number, elevationDeg: number): void {
    this._sunAzimuthDeg = azimuthDeg;
    this._sunElevationDeg = Math.max(-90, Math.min(90, elevationDeg));
    this.updateSunPosition();
  }

  getSunDirection(): { azimuthDeg: number; elevationDeg: number } {
    return { azimuthDeg: this._sunAzimuthDeg, elevationDeg: this._sunElevationDeg };
  }

  setSunIntensity(value: number): void {
    this._sunIntensity = Math.max(0, Math.min(5, value));
    this.directionalLight.intensity = this._sunIntensity;
  }

  getSunIntensity(): number {
    return this._sunIntensity;
  }

  setSunColor(hex: number): void {
    this._sunColor = hex;
    this.directionalLight.color.setHex(hex);
  }

  getSunColor(): number {
    return this._sunColor;
  }

  setTextureManifest(manifest: TextureManifest | null): void {
    this._textureManifest = manifest;
  }

  setDefaultTextureBaseUrl(url: string): void {
    this._defaultTextureBaseUrl = url.replace(/\/?$/, '/');
  }

  set transitionType(t: TransitionType) {
    this._transitionType = t;
  }

  get transitionType(): TransitionType {
    return this._transitionType;
  }

  // ─── Transition helpers ──────────────────────────────────────────────────

  /** Collect all materials from the current model group. */
  private getMaterials(): (MeshStandardMaterial | MeshPhongMaterial | MeshLambertMaterial | MeshBasicMaterial)[] {
    if (!this._modelGroup) return [];
    const mats: (MeshStandardMaterial | MeshPhongMaterial | MeshLambertMaterial | MeshBasicMaterial)[] = [];
    const seen = new Set<Material>();
    this._modelGroup.traverse((obj) => {
      const mesh = obj as Mesh;
      if (!mesh.isMesh) return;
      const arr = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      for (const m of arr) {
        if (!seen.has(m)) {
          seen.add(m);
          mats.push(m as MeshStandardMaterial);
        }
      }
    });
    return mats;
  }

  /**
   * Linear interpolation helper. Resolves after `duration` ms, calling `tick(t)` with t in [0,1]
   * each frame. t follows an ease-in-out curve.
   */
  private animate(duration: number, tick: (t: number) => void): Promise<void> {
    return new Promise((resolve) => {
      const start = performance.now();
      const frame = (now: number) => {
        const raw = Math.min((now - start) / duration, 1);
        const t = raw < 0.5 ? 2 * raw * raw : -1 + (4 - 2 * raw) * raw; // ease-in-out
        tick(t);
        if (raw < 1) {
          requestAnimationFrame(frame);
        } else {
          resolve();
        }
      };
      requestAnimationFrame(frame);
    });
  }

  /** Ensure an overlay <div> is ready, attached over the canvas. */
  private ensureOverlay(): HTMLDivElement {
    if (this._transitionOverlay) return this._transitionOverlay;
    const canvas = this.renderer.domElement;
    const parent = canvas.parentElement;
    const overlay = document.createElement('div');
    overlay.style.cssText = [
      'position:absolute',
      'inset:0',
      'pointer-events:none',
      'opacity:0',
      'z-index:10',
      'border-radius:inherit',
    ].join(';');
    if (parent) {
      const ps = getComputedStyle(parent).position;
      if (ps === 'static') parent.style.position = 'relative';
      parent.appendChild(overlay);
    } else {
      // Fallback: overlay the canvas with fixed positioning
      overlay.style.position = 'fixed';
      document.body.appendChild(overlay);
    }
    this._transitionOverlay = overlay;
    return overlay;
  }

  private removeOverlay(): void {
    if (this._transitionOverlay) {
      this._transitionOverlay.remove();
      this._transitionOverlay = null;
    }
  }

  // ─── Zoom + fade ──────────────────────────────────────────────────────────
  /** Final scale after zoom transition: slightly smaller so it matches the previous zoom-out. */
  private static readonly ZOOM_FINAL_SCALE = 0.92;

  private async transitionZoom(applyTextures: () => Promise<void>): Promise<void> {
    if (!this._modelGroup) { await applyTextures(); return; }
    const group = this._modelGroup;
    const mats = this.getMaterials();
    const origTransparent = mats.map((m) => (m as { transparent?: boolean }).transparent ?? false);

    for (const m of mats) {
      (m as { transparent: boolean }).transparent = true;
      m.needsUpdate = true;
    }

    // Shrink + fade out (1 → ZOOM_FINAL_SCALE)
    await this.animate(380, (t) => {
      const scale = 1 - t * (1 - SceneManager.ZOOM_FINAL_SCALE);
      group.scale.set(scale, scale, scale);
      for (const m of mats) {
        (m as { opacity: number }).opacity = 1 - t;
        m.needsUpdate = true;
      }
    });

    await applyTextures();

    // Fade in at same smaller scale (no grow back to 1)
    await this.animate(380, (t) => {
      group.scale.set(SceneManager.ZOOM_FINAL_SCALE, SceneManager.ZOOM_FINAL_SCALE, SceneManager.ZOOM_FINAL_SCALE);
      for (const m of mats) {
        (m as { opacity: number }).opacity = t;
        m.needsUpdate = true;
      }
    });

    group.scale.set(SceneManager.ZOOM_FINAL_SCALE, SceneManager.ZOOM_FINAL_SCALE, SceneManager.ZOOM_FINAL_SCALE);
    for (let i = 0; i < mats.length; i++) {
      (mats[i] as { opacity: number }).opacity = 1;
      (mats[i] as { transparent: boolean }).transparent = origTransparent[i];
      mats[i].needsUpdate = true;
    }
  }

  // ─── Brush sweep ───────────────────────────────────────────────────────────
  private async transitionBrush(applyTextures: () => Promise<void>): Promise<void> {
    if (!this._modelGroup) { await applyTextures(); return; }

    const box = new Box3().setFromObject(this._modelGroup);
    const minX = box.min.x;
    const maxX = box.max.x;
    const width = maxX - minX || 1;
    const mats = this.getMaterials();

    this.renderer.clippingPlanes = [new Plane(new Vector3(1, 0, 0), -maxX)];
    this.renderer.localClippingEnabled = true;

    await this.animate(500, (t) => {
      const constant = -(minX + width * t);
      this.renderer.clippingPlanes = [new Plane(new Vector3(1, 0, 0), constant)];
    });

    await applyTextures();

    await this.animate(500, (t) => {
      const constant = -(minX + width * (1 - t));
      this.renderer.clippingPlanes = [new Plane(new Vector3(1, 0, 0), constant)];
    });

    this.renderer.clippingPlanes = [];
    this.renderer.localClippingEnabled = false;
    void mats;
  }

  // ─── 5. Spin + crossfade ────────────────────────────────────────────────
  private async transitionSpin(applyTextures: () => Promise<void>): Promise<void> {
    if (!this._modelGroup) { await applyTextures(); return; }
    const group = this._modelGroup;
    const startRotY = group.rotation.y;
    const mats = this.getMaterials();
    const origTransparent = mats.map((m) => (m as { transparent?: boolean }).transparent ?? false);
    let texturesSwapped = false;

    for (const m of mats) {
      (m as { transparent: boolean }).transparent = true;
      m.needsUpdate = true;
    }

    // Full 360° spin over 900 ms; swap textures at the midpoint (180°)
    await this.animate(900, (t) => {
      group.rotation.y = startRotY + 2 * Math.PI * t;

      // Fade out in first half, fade in second half
      const opacity = t < 0.5 ? 1 - t * 2 : (t - 0.5) * 2;
      for (const m of mats) {
        (m as { opacity: number }).opacity = opacity;
        m.needsUpdate = true;
      }

      if (!texturesSwapped && t >= 0.5) {
        texturesSwapped = true;
        // Fire async but we already past the invisible frame
        void applyTextures();
      }
    });

    // Ensure textures were applied even if animation went fast
    if (!texturesSwapped) await applyTextures();

    group.rotation.y = startRotY;
    for (let i = 0; i < mats.length; i++) {
      (mats[i] as { opacity: number }).opacity = 1;
      (mats[i] as { transparent: boolean }).transparent = origTransparent[i];
      mats[i].needsUpdate = true;
    }
  }

  /**
   * Wrap a texture-apply function with the configured transition animation.
   * Call this instead of calling applyTexturePack directly when a transition is desired.
   */
  async runWithTransition(applyTextures: () => Promise<TexturePackResult>): Promise<TexturePackResult> {
    let result: TexturePackResult = { applied: 0, fromDefault: 0, errors: [] };
    const wrapped = async () => { result = await applyTextures(); };

    switch (this._transitionType) {
      case 'zoom':  await this.transitionZoom(wrapped); break;
      case 'brush': await this.transitionBrush(wrapped); break;
      case 'spin':  await this.transitionSpin(wrapped); break;
      default:      await wrapped(); break;
    }
    return result;
  }

  /**
   * Slide the current model group off screen vertically.
   * direction 'up'  → model moves upward and disappears above.
   * direction 'down' → model moves downward and disappears below.
   * Returns the Y offset used so slideIn can mirror it.
   */
  async slideOut(direction: 'up' | 'down'): Promise<number> {
    if (!this._modelGroup) return 0;
    const group = this._modelGroup;
    const slideY = this._slideDistance();
    const sign = direction === 'up' ? 1 : -1;
    const startY = group.position.y;
    await this.animate(340, (t) => {
      group.position.y = startY + sign * slideY * t;
    });
    group.position.y = startY + sign * slideY;
    return sign * slideY;
  }

  /**
   * Slide the newly loaded model group in from off screen.
   * direction 'up'  → new model enters from below (comes up).
   * direction 'down' → new model enters from above (comes down).
   */
  async slideIn(direction: 'up' | 'down'): Promise<void> {
    if (!this._modelGroup) return;
    const group = this._modelGroup;
    const slideY = this._slideDistance();
    // Entering from opposite side: 'up' means old left upward → new arrives from below (negative Y)
    const sign = direction === 'up' ? -1 : 1;
    const targetY = group.position.y;
    group.position.y = targetY + sign * slideY;
    await this.animate(340, (t) => {
      group.position.y = targetY + sign * slideY * (1 - t);
    });
    group.position.y = targetY;
  }

  /** World-space vertical distance large enough to slide the model fully off screen. */
  private _slideDistance(): number {
    if (this._modelGroup) {
      const box = new Box3().setFromObject(this._modelGroup);
      const size = new Vector3();
      box.getSize(size);
      // Use model height + generous margin so it fully clears the viewport
      return size.y * 3 + 10;
    }
    return 20;
  }

  /**
   * Apply default textures from _defaultTextureBaseUrl using _textureManifest.
   * When skipTransition is true (e.g. after changing model with nav), no zoom/brush/spin runs.
   */
  async applyDefaultTextures(skipTransition = false): Promise<void> {
    if (!this._loadedModel || !this._textureManifest || !this._defaultTextureBaseUrl)
      return;
    const urlMap: Record<string, string> = {};
    for (const slot of this._textureManifest.slots) {
      urlMap[slot.filename] = this._defaultTextureBaseUrl + slot.filename;
      urlMap[slot.key] = urlMap[slot.filename];
    }
    if (skipTransition) {
      await this.applyTexturePack(urlMap);
    } else {
      await this.runWithTransition(() => this.applyTexturePack(urlMap));
    }
  }

  /**
   * Apply texture pack from a map of filename/key -> URL. Missing entries fall back to default URLs.
   * Returns counts and any errors for logging/UI.
   */
  async applyTexturePack(urlMap: Record<string, string>): Promise<TexturePackResult> {
    const result: TexturePackResult = { applied: 0, fromDefault: 0, errors: [] };
    if (!this._loadedModel || !this._textureManifest) {
      console.warn('[mc-texture-viewer] applyTexturePack: no loaded model or manifest');
      result.errors.push('No model or texture manifest loaded');
      return result;
    }
    const base = this._defaultTextureBaseUrl;
    const load = (url: string): Promise<Texture> =>
      new Promise((resolve, reject) => {
        this.textureLoader.load(url, resolve, undefined, reject);
      });
    console.log('[mc-texture-viewer] applyTexturePack: manifest has', this._textureManifest.slots.length, 'slot(s)');
    for (const slot of this._textureManifest.slots) {
      const fromZip =
        urlMap[slot.filename] ?? urlMap[slot.key];
      const url = fromZip ?? (base ? base + slot.filename : '');
      const source = fromZip ? 'ZIP' : base ? 'default' : 'none';
      if (!url) {
        const msg = `No texture for "${slot.key}" (${slot.filename}) and no default base URL`;
        result.errors.push(msg);
        console.warn('[mc-texture-viewer] applyTexturePack: skip', slot.key, '-', msg);
        continue;
      }
      const material = slot.materialName
        ? this._loadedModel.materials.find((m) => m.name === slot.materialName)
        : this._loadedModel.materials[0];
      if (!material) {
        const msg = `Material "${slot.materialName ?? 'default'}" not found for slot "${slot.key}"`;
        result.errors.push(msg);
        console.warn('[mc-texture-viewer] applyTexturePack: skip', slot.key, '-', msg);
        continue;
      }
      const mat = material as Material & { map?: Texture };
      const old = this._currentTextures.get(material);
      if (old) {
        old.dispose();
        this._currentTextures.delete(material);
      }
      try {
        console.log('[mc-texture-viewer] applyTexturePack: loading', slot.key, 'from', source, '→', url.slice(0, 60) + (url.length > 60 ? '…' : ''));
        const texture = await load(url);
        texture.format = RGBAFormat;
        texture.colorSpace = 'srgb';
        setTexturePixelFilter(texture);
        mat.map = texture;
        const m = material as Material & { transparent?: boolean; alphaTest?: number; depthWrite?: boolean; side?: number };
        if (textureHasAlpha(texture)) {
          m.transparent = true;
          m.alphaTest = 0.01;
          m.depthWrite = true;
          m.side = DoubleSide;
        } else {
          m.transparent = false;
          m.alphaTest = 0;
          m.side = FrontSide;
        }
        this._currentTextures.set(material, texture);
        result.applied++;
        if (!fromZip) result.fromDefault++;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        const msg = `Failed to load "${slot.key}" (${slot.filename}): ${message}`;
        result.errors.push(msg);
        console.error('[mc-texture-viewer] applyTexturePack:', msg);
      }
    }
    console.log('[mc-texture-viewer] applyTexturePack: done. Applied:', result.applied, '| from default:', result.fromDefault, '| errors:', result.errors.length);
    return result;
  }

  private frameModel(group: Group): void {
    const box = new Box3().setFromObject(group);
    const center = new Vector3();
    const size = new Vector3();
    box.getCenter(center);
    box.getSize(size);
    group.position.sub(center);
    const maxDim = Math.max(size.x, size.y, size.z);
    const distance = maxDim * 1.8;
    this.camera.position.set(distance * 0.6, distance * 0.5, distance);
    this.camera.lookAt(0, 0, 0);
    this.camera.updateProjectionMatrix();
    this.controls?.target.set(0, 0, 0);
    this.controls?.update();
  }

  loadModel(url: string): Promise<LoadedModel> {
    this.clearModel();
    const processGroup = (group: Group): LoadedModel => {
      group.traverse((obj) => {
        if ((obj as Mesh).isMesh) {
          const mesh = obj as Mesh;
          mesh.castShadow = true;
          mesh.receiveShadow = true;
          const mat = mesh.material as (Material & { map?: Texture; transparent?: boolean; alphaTest?: number; side?: number }) | undefined;
          if (mat?.map) {
            mat.map.format = RGBAFormat;
            setTexturePixelFilter(mat.map);
            if (textureHasAlpha(mat.map)) setMaterialTransparentAndDoubleSide(mat);
          }
        }
      });
      this.scene.add(group);
      this._modelGroup = group;
      const meshes: Mesh[] = [];
      const materials: Material[] = [];
      const seen = new Set<Material>();
      group.traverse((obj) => {
        if ((obj as Mesh).isMesh) {
          const mesh = obj as Mesh;
          meshes.push(mesh);
          if (mesh.material) {
            const arr = Array.isArray(mesh.material)
              ? mesh.material
              : [mesh.material];
            for (const mat of arr) {
              if (!seen.has(mat)) {
                seen.add(mat);
                materials.push(mat);
              }
            }
          }
        }
      });
      const loaded: LoadedModel = { group, meshes, materials };
      this._loadedModel = loaded;
      this.frameModel(group);
      this._onModelLoaded?.(loaded);
      return loaded;
    };

    if (url.toLowerCase().endsWith('.obj')) {
      return this.loadObjModel(url, processGroup);
    }
    return this.loadGlbModel(url, processGroup);
  }

  private loadGlbModel(
    url: string,
    processGroup: (group: Group) => LoadedModel
  ): Promise<LoadedModel> {
    const loader = new GLTFLoader();
    return new Promise((resolve, reject) => {
      loader.load(
        url,
        (gltf) => resolve(processGroup(gltf.scene)),
        undefined,
        (err) => reject(err)
      );
    });
  }

  private loadObjModel(
    url: string,
    processGroup: (group: Group) => LoadedModel
  ): Promise<LoadedModel> {
    const basePath = url.substring(0, url.lastIndexOf('/') + 1);
    const baseName = url.split('/').pop()?.replace(/\.obj$/i, '') ?? 'model';
    const mtlPath = baseName + '.mtl';
    const mtlLoader = new MTLLoader();
    mtlLoader.setPath(basePath);
    const objLoader = new OBJLoader();
    return new Promise((resolve, reject) => {
      mtlLoader.load(
        mtlPath,
        (materials) => {
          materials.preload();
          objLoader.setMaterials(materials);
          objLoader.load(
            url,
            (group) => resolve(processGroup(group)),
            undefined,
            (err) => reject(err)
          );
        },
        undefined,
        (err) => reject(err)
      );
    });
  }

  private clearModel(): void {
    for (const tex of this._currentTextures.values()) tex.dispose();
    this._currentTextures.clear();
    if (this._modelGroup) {
      this.scene.remove(this._modelGroup);
      this._modelGroup.traverse((obj) => {
        if ((obj as Mesh).isMesh) {
          const mesh = obj as Mesh;
          mesh.geometry?.dispose();
          const mat = mesh.material;
          if (mat) {
            const arr = Array.isArray(mat) ? mat : [mat];
            for (const m of arr) {
              m.dispose();
            }
          }
        }
      });
      this._modelGroup = null;
      this._loadedModel = null;
    }
  }

  setSize(width: number, height: number): void {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  startRenderLoop(): void {
    const loop = () => {
      this.animationFrameId = requestAnimationFrame(loop);
      if (this._autoRotate && this._modelGroup) {
        this._modelGroup.rotation.y += AUTO_ROTATE_SPEED_BASE * this._rotationSpeedMultiplier;
      }
      this.controls?.update();
      this.renderer.render(this.scene, this.camera);
    };
    loop();
  }

  stopRenderLoop(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  dispose(): void {
    this.stopRenderLoop();
    if (this.controls) {
      this.controls.dispose();
      this.controls = null;
    }
    this.clearModel();
    this.renderer.dispose();
    this.removeOverlay();
  }
}
