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
  type Group,
  type Mesh,
  type Material,
  type Texture,
} from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { TextureManifest } from './types.js';

export interface LoadedModel {
  group: Group;
  meshes: Mesh[];
  materials: Material[];
}

const AUTO_ROTATE_SPEED_BASE = 0.3 * (Math.PI / 180);
const SUN_RADIUS = 20;

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

  constructor(canvas: HTMLCanvasElement) {
    this.scene = new Scene();
    this.scene.background = new Color(0x1a1a1a);

    this.camera = new PerspectiveCamera(50, 1, 0.1, 1000);
    this.camera.position.set(0, 0, 5);

    this.renderer = new WebGLRenderer({ canvas, antialias: true });
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

  /**
   * Apply default textures from _defaultTextureBaseUrl using _textureManifest.
   * Call after model is loaded when default texture pack is configured.
   */
  async applyDefaultTextures(): Promise<void> {
    if (!this._loadedModel || !this._textureManifest || !this._defaultTextureBaseUrl)
      return;
    const urlMap: Record<string, string> = {};
    for (const slot of this._textureManifest.slots) {
      urlMap[slot.filename] = this._defaultTextureBaseUrl + slot.filename;
      urlMap[slot.key] = urlMap[slot.filename];
    }
    await this.applyTexturePack(urlMap);
  }

  /**
   * Apply texture pack from a map of filename/key -> URL. Missing entries fall back to default URLs.
   */
  async applyTexturePack(urlMap: Record<string, string>): Promise<void> {
    if (!this._loadedModel || !this._textureManifest) return;
    const base = this._defaultTextureBaseUrl;
    const load = (url: string): Promise<Texture> =>
      new Promise((resolve, reject) => {
        this.textureLoader.load(url, resolve, undefined, reject);
      });
    for (const slot of this._textureManifest.slots) {
      const url =
        urlMap[slot.filename] ??
        urlMap[slot.key] ??
        (base ? base + slot.filename : '');
      if (!url) continue;
      const material = slot.materialName
        ? this._loadedModel.materials.find((m) => m.name === slot.materialName)
        : this._loadedModel.materials[0];
      if (!material) continue;
      const mat = material as Material & { map?: Texture };
      const old = this._currentTextures.get(material);
      if (old) {
        old.dispose();
        this._currentTextures.delete(material);
      }
      try {
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
      } catch {
        // keep existing or leave unset
      }
    }
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
  }
}
