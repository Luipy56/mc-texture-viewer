import {
  Scene,
  PerspectiveCamera,
  WebGLRenderer,
  Color,
  Box3,
  Vector3,
  Sphere,
  MathUtils,
  PCFSoftShadowMap,
  Fog,
  PlaneGeometry,
  MeshStandardMaterial,
  Mesh,
  type Group,
  type Material,
  type Texture,
} from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { TextureManifest, TransitionType } from './types.js';
import { TextureApplicator, setTexturePixelFilter, textureHasAlpha, type TexturePackResult } from './textures/TextureApplicator.js';
import { LightingManager } from './lighting/LightingManager.js';
import { TransitionManager } from './transitions/TransitionManager.js';

export interface LoadedModel {
  group: Group;
  meshes: Mesh[];
  materials: Material[];
}

export { TexturePackResult };

const AUTO_ROTATE_SPEED_BASE = 0.3 * (Math.PI / 180);
const DEFAULT_BG_COLOR = 0x1a1a1a;

export class SceneManager {
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
  private _wireframe = false;

  // Shadow catcher
  private _shadowCatcherMesh: Mesh | null = null;
  private _shadowCatcherEnabled = false;

  // Camera reset state
  private _initialCameraPos = new Vector3(0, 0, 5);
  private _initialCameraTarget = new Vector3(0, 0, 0);

  // Managers
  readonly lighting: LightingManager;
  readonly textureApplicator: TextureApplicator;
  readonly transitions: TransitionManager;

  // Skip next texture transition (e.g. when changing models)
  skipTransitionForNextApply = false;

  constructor(canvas: HTMLCanvasElement) {
    this.scene = new Scene();
    this.scene.background = new Color(DEFAULT_BG_COLOR);

    this.camera = new PerspectiveCamera(50, 1, 0.1, 1000);
    this.camera.position.set(0, 0, 5);

    this.renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = 'srgb';
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = PCFSoftShadowMap;
    this.renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);

    this.lighting = new LightingManager(this.scene);
    this.textureApplicator = new TextureApplicator();
    this.transitions = new TransitionManager(this.renderer, this.scene);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.enablePan = true;
    this.controls.target.set(0, 0, 0);
  }

  // ─── Model loaded callback ────────────────────────────────────────────────

  set onModelLoaded(cb: ((model: LoadedModel) => void) | null) {
    this._onModelLoaded = cb;
  }

  get loadedModel(): LoadedModel | null {
    return this._loadedModel;
  }

  get modelGroup(): Group | null {
    return this._modelGroup;
  }

  // ─── Delegated lighting setters (for backwards compat with McViewerElement) ─

  set sunEnabled(value: boolean) { this.lighting.sunEnabled = value; }
  get sunEnabled(): boolean { return this.lighting.sunEnabled; }

  setSunDirection(az: number, el: number): void { this.lighting.setSunDirection(az, el); }
  getSunDirection() { return this.lighting.getSunDirection(); }
  setSunIntensity(v: number): void { this.lighting.setSunIntensity(v); }
  getSunIntensity(): number { return this.lighting.getSunIntensity(); }
  setSunColor(hex: number): void { this.lighting.setSunColor(hex); }
  getSunColor(): number { return this.lighting.getSunColor(); }

  set hemisphereEnabled(v: boolean) { this.lighting.hemisphereEnabled = v; }
  get hemisphereEnabled(): boolean { return this.lighting.hemisphereEnabled; }

  // ─── Delegated texture setters ────────────────────────────────────────────

  setTextureManifest(manifest: TextureManifest | null): void {
    this.textureApplicator.setManifest(manifest);
  }

  setDefaultTextureBaseUrl(url: string): void {
    this.textureApplicator.setDefaultBaseUrl(url);
  }

  // ─── Transition ───────────────────────────────────────────────────────────

  set transitionType(t: TransitionType) { this.transitions.type = t; }
  get transitionType(): TransitionType { return this.transitions.type; }

  // ─── Rotation ─────────────────────────────────────────────────────────────

  set autoRotate(value: boolean) { this._autoRotate = value; }
  get autoRotate(): boolean { return this._autoRotate; }

  set rotationSpeedMultiplier(value: number) {
    this._rotationSpeedMultiplier = Math.max(0.1, Math.min(3, value));
  }
  get rotationSpeedMultiplier(): number { return this._rotationSpeedMultiplier; }

  // ─── Wireframe ────────────────────────────────────────────────────────────

  set wireframe(value: boolean) {
    this._wireframe = value;
    this.textureApplicator.applyWireframe(this._loadedModel, value);
  }
  get wireframe(): boolean { return this._wireframe; }

  // ─── Background ───────────────────────────────────────────────────────────

  setBackground(color: number | 'transparent'): void {
    if (color === 'transparent') {
      this.scene.background = null;
    } else {
      this.scene.background = new Color(color);
    }
  }

  // ─── Fog ──────────────────────────────────────────────────────────────────

  setFog(enabled: boolean, color = 0x1a1a1a, near = 10, far = 50): void {
    this.scene.fog = enabled ? new Fog(color, near, far) : null;
  }

  // ─── Shadow catcher ───────────────────────────────────────────────────────

  set shadowCatcher(value: boolean) {
    this._shadowCatcherEnabled = value;
    if (this._shadowCatcherMesh) {
      this._shadowCatcherMesh.visible = value;
    }
  }
  get shadowCatcher(): boolean { return this._shadowCatcherEnabled; }

  private updateShadowCatcher(group: Group): void {
    if (this._shadowCatcherMesh) {
      this.scene.remove(this._shadowCatcherMesh);
      this._shadowCatcherMesh.geometry.dispose();
      this._shadowCatcherMesh = null;
    }
    const box = new Box3().setFromObject(group);
    const size = new Vector3(); box.getSize(size);
    const geo = new PlaneGeometry(size.x * 4, size.z * 4);
    const mat = new MeshStandardMaterial({
      opacity: 0,
      transparent: true,
      depthWrite: false,
    });
    const plane = new Mesh(geo, mat);
    plane.rotation.x = -Math.PI / 2;
    plane.position.y = box.min.y;
    plane.receiveShadow = true;
    plane.visible = this._shadowCatcherEnabled;
    this.scene.add(plane);
    this._shadowCatcherMesh = plane;
  }

  // ─── Camera presets ───────────────────────────────────────────────────────

  async setCameraPreset(preset: 'front' | 'side' | 'top' | 'iso'): Promise<void> {
    if (!this._loadedModel) return;
    const box = new Box3().setFromObject(this._loadedModel.group);
    const dist = this.computeViewDistance(box);

    let targetPos: Vector3;
    switch (preset) {
      case 'front': targetPos = new Vector3(0, 0, dist); break;
      case 'side': targetPos = new Vector3(dist, 0, 0); break;
      case 'top': targetPos = new Vector3(0, dist, Math.max(1e-4, dist * 0.001)); break;
      case 'iso': targetPos = new Vector3(0.55, 0.45, 0.85).normalize().multiplyScalar(dist); break;
    }

    const startPos = this.camera.position.clone();
    const startTarget = this.controls!.target.clone();
    const endTarget = new Vector3(0, 0, 0);

    await this.transitions.animate(400, (t) => {
      this.camera.position.lerpVectors(startPos, targetPos, t);
      this.controls!.target.lerpVectors(startTarget, endTarget, t);
      this.controls!.update();
    });
    this.camera.position.copy(targetPos);
    this.controls!.target.copy(endTarget);
    this.controls!.update();
  }

  // ─── Reset camera ─────────────────────────────────────────────────────────

  async resetCamera(): Promise<void> {
    const startPos = this.camera.position.clone();
    const startTarget = this.controls!.target.clone();
    await this.transitions.animate(400, (t) => {
      this.camera.position.lerpVectors(startPos, this._initialCameraPos, t);
      this.controls!.target.lerpVectors(startTarget, this._initialCameraTarget, t);
      this.controls!.update();
    });
    this.camera.position.copy(this._initialCameraPos);
    this.controls!.target.copy(this._initialCameraTarget);
    this.controls!.update();
  }

  // ─── Screenshot ───────────────────────────────────────────────────────────

  captureSnapshot(): string {
    this.renderer.render(this.scene, this.camera);
    return this.renderer.domElement.toDataURL('image/png');
  }

  // ─── Texture application ─────────────────────────────────────────────────

  async applyDefaultTextures(skipTransition = false): Promise<void> {
    if (!this._loadedModel) return;
    const model = this._loadedModel;
    const skip = skipTransition || this.skipTransitionForNextApply;
    this.skipTransitionForNextApply = false;
    if (skip) {
      await this.textureApplicator.applyDefaultTextures(model);
    } else {
      await this.transitions.runWithTransition(this._modelGroup, async (): Promise<void> => {
        await this.textureApplicator.applyDefaultTextures(model);
      });
    }
  }

  async applyTexturePack(urlMap: Record<string, string>): Promise<TexturePackResult> {
    if (!this._loadedModel) return { applied: 0, fromDefault: 0, errors: ['No model loaded'] };
    const model = this._loadedModel;
    let result: TexturePackResult = { applied: 0, fromDefault: 0, errors: [] };
    await this.transitions.runWithTransition(this._modelGroup, async (): Promise<void> => {
      result = await this.textureApplicator.applyTexturePack(model, urlMap);
    });
    return result;
  }

  // ─── Model loading ────────────────────────────────────────────────────────

  /** Distance from origin so the model's bounding sphere fits the view (vertical + horizontal FOV). */
  private computeViewDistance(box: Box3): number {
    const sphere = new Sphere();
    box.getBoundingSphere(sphere);
    const r = Math.max(sphere.radius, 1e-4);
    const vFovRad = MathUtils.degToRad(this.camera.fov);
    const aspect = Math.max(this.camera.aspect, 1e-4);
    const hFovRad = 2 * Math.atan(Math.tan(vFovRad / 2) * aspect);
    const distV = r / Math.sin(vFovRad / 2);
    const distH = r / Math.sin(hFovRad / 2);
    return Math.max(distV, distH) * 1.12;
  }

  /** Move model so its bounding-box center is at the origin (world). */
  private centerModelOnOrigin(group: Group): void {
    const box = new Box3().setFromObject(group);
    const center = new Vector3();
    box.getCenter(center);
    group.position.sub(center);
  }

  /** Re-apply camera distance after resize or late layout (model already centered at origin). */
  refitCurrentModelFrame(): void {
    if (this._modelGroup) this.fitCameraToModel(this._modelGroup);
  }

  /** Place camera so the framed model fills the viewport; orbit target at origin. */
  private fitCameraToModel(group: Group): void {
    const box = new Box3().setFromObject(group);
    const distance = this.computeViewDistance(box);
    const pos = new Vector3(0.55, 0.45, 0.85).normalize().multiplyScalar(distance);
    this.camera.position.copy(pos);
    this.camera.lookAt(0, 0, 0);
    this.camera.updateProjectionMatrix();
    this.controls?.target.set(0, 0, 0);
    this.controls?.update();
    this._initialCameraPos.copy(pos);
    this._initialCameraTarget.set(0, 0, 0);
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
            mat.map.format = 1023; // RGBAFormat
            setTexturePixelFilter(mat.map);
            if (textureHasAlpha(mat.map)) {
              mat.transparent = true;
              mat.alphaTest = 0.01;
              (mat as { side?: number }).side = 2; // DoubleSide
            }
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
            const arr = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
            for (const mat of arr) {
              if (!seen.has(mat)) { seen.add(mat); materials.push(mat); }
            }
          }
        }
      });
      const loaded: LoadedModel = { group, meshes, materials };
      this._loadedModel = loaded;
      this.centerModelOnOrigin(group);
      this.updateShadowCatcher(group);
      this.fitCameraToModel(group);
      if (this._wireframe) this.textureApplicator.applyWireframe(loaded, true);
      this._onModelLoaded?.(loaded);
      return loaded;
    };

    if (url.toLowerCase().endsWith('.obj')) return this.loadObjModel(url, processGroup);
    return this.loadGlbModel(url, processGroup);
  }

  private loadGlbModel(url: string, processGroup: (g: Group) => LoadedModel): Promise<LoadedModel> {
    const loader = new GLTFLoader();
    return new Promise((resolve, reject) => {
      loader.load(url, (gltf) => resolve(processGroup(gltf.scene)), undefined, reject);
    });
  }

  private loadObjModel(url: string, processGroup: (g: Group) => LoadedModel): Promise<LoadedModel> {
    const basePath = url.substring(0, url.lastIndexOf('/') + 1);
    const baseName = url.split('/').pop()?.replace(/\.obj$/i, '') ?? 'model';
    const mtlLoader = new MTLLoader();
    mtlLoader.setPath(basePath);
    const objLoader = new OBJLoader();
    return new Promise((resolve, reject) => {
      mtlLoader.load(
        baseName + '.mtl',
        (mats) => {
          mats.preload();
          objLoader.setMaterials(mats);
          objLoader.load(url, (group) => resolve(processGroup(group)), undefined, reject);
        },
        undefined,
        reject
      );
    });
  }

  private clearModel(): void {
    this.textureApplicator.disposeAll();
    if (this._shadowCatcherMesh) {
      this.scene.remove(this._shadowCatcherMesh);
      this._shadowCatcherMesh.geometry.dispose();
      this._shadowCatcherMesh = null;
    }
    if (this._modelGroup) {
      this.scene.remove(this._modelGroup);
      this._modelGroup.traverse((obj) => {
        if ((obj as Mesh).isMesh) {
          const mesh = obj as Mesh;
          mesh.geometry?.dispose();
          const mat = mesh.material;
          if (mat) {
            const arr = Array.isArray(mat) ? mat : [mat];
            for (const m of arr) m.dispose();
          }
        }
      });
      this._modelGroup = null;
      this._loadedModel = null;
    }
  }

  // ─── Slide animations (used by McViewerElement for model nav) ─────────────

  async slideOut(direction: 'up' | 'down'): Promise<void> {
    if (!this._modelGroup) return;
    await this.transitions.slideOut(this._modelGroup, direction);
  }

  async slideIn(direction: 'up' | 'down'): Promise<void> {
    if (!this._modelGroup) return;
    await this.transitions.slideIn(this._modelGroup, direction);
  }

  // ─── Resize / render loop ─────────────────────────────────────────────────

  setSize(width: number, height: number): void {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    // false = do not set canvas.style to fixed px; host keeps width/height 100% so layout can grow
    this.renderer.setSize(width, height, false);
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
    this.controls?.dispose();
    this.controls = null;
    this.clearModel();
    this.transitions.dispose();
    this.renderer.dispose();
  }
}
