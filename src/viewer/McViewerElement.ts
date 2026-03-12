/**
 * Web Component: mc-texture-viewer
 * Embeds a 3D viewer for GLB/OBJ models with configurable textures and lighting.
 */
import JSZip from 'jszip';
import { SceneManager } from './SceneManager.js';
import type { LoadedModel, TexturePackResult } from './SceneManager.js';
import { defaultTextureManifest } from './textureManifest.js';
import type { TextureManifest, TransitionType } from './types.js';

export class McViewerElement extends HTMLElement {
  static readonly tagName = 'mc-texture-viewer';

  private readonly shadow: ShadowRoot;
  private readonly canvas: HTMLCanvasElement;
  private sceneManager: SceneManager | null = null;
  private resizeObserver: ResizeObserver | null = null;

  private _modelUrl = '';
  private _textureBaseUrl = '';
  private _autoRotate = false;
  private _sunEnabled = true;

  static get observedAttributes(): string[] {
    return ['model-url', 'texture-base-url', 'auto-rotate', 'sun-enabled'];
  }

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: 'open' });
    this.canvas = document.createElement('canvas');
    this.canvas.style.display = 'block';
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    this.shadow.appendChild(this.canvas);
    if (!this.style.minHeight) this.style.minHeight = '400px';
    this.style.display = this.style.display || 'block';
  }

  connectedCallback(): void {
    this.syncFromAttributes();
    this.sceneManager = new SceneManager(this.canvas);
    this.sceneManager.setTextureManifest(defaultTextureManifest);
    if (this._textureBaseUrl) this.sceneManager.setDefaultTextureBaseUrl(this._textureBaseUrl);
    this.sceneManager.onModelLoaded = (model: LoadedModel) => {
      this.dispatchEvent(
        new CustomEvent('model-loaded', { detail: { model }, bubbles: true })
      );
      if (this._textureBaseUrl) this.sceneManager?.applyDefaultTextures();
    };
    this.sceneManager.autoRotate = this._autoRotate;
    this.sceneManager.sunEnabled = this._sunEnabled;
    this.sceneManager.startRenderLoop();
    this.resizeObserver = new ResizeObserver(() => this.handleResize());
    this.resizeObserver.observe(this.canvas);
    this.handleResize();
    if (this._modelUrl) this.loadModel();
  }

  disconnectedCallback(): void {
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    this.sceneManager?.dispose();
    this.sceneManager = null;
  }

  private handleResize(): void {
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    if (w > 0 && h > 0 && this.sceneManager) {
      this.sceneManager.setSize(w, h);
    }
  }

  private async loadModel(): Promise<void> {
    if (!this.sceneManager || !this._modelUrl) return;
    try {
      await this.sceneManager.loadModel(this._modelUrl);
    } catch (err) {
      this.dispatchEvent(
        new CustomEvent('error', {
          detail: { message: String(err), source: 'model-load' },
          bubbles: true,
        })
      );
    }
  }

  attributeChangedCallback(
    name: string,
    _oldValue: string | null,
    newValue: string | null
  ): void {
    if (newValue === null) return;
    switch (name) {
      case 'model-url':
        this._modelUrl = newValue;
        if (this.isConnected && this.sceneManager) this.loadModel();
        break;
      case 'texture-base-url':
        this._textureBaseUrl = newValue;
        if (this.sceneManager) this.sceneManager.setDefaultTextureBaseUrl(newValue);
        break;
      case 'auto-rotate':
        this._autoRotate = newValue === 'true' || newValue === '';
        this.sceneManager && (this.sceneManager.autoRotate = this._autoRotate);
        break;
      case 'sun-enabled':
        this._sunEnabled = newValue !== 'false';
        this.sceneManager && (this.sceneManager.sunEnabled = this._sunEnabled);
        break;
    }
  }

  private syncFromAttributes(): void {
    this._modelUrl = this.getAttribute('model-url') ?? '';
    this._textureBaseUrl = this.getAttribute('texture-base-url') ?? '';
    this._autoRotate =
      this.getAttribute('auto-rotate') === 'true' ||
      this.getAttribute('auto-rotate') === '';
    this._sunEnabled = this.getAttribute('sun-enabled') !== 'false';
  }

  get modelUrl(): string {
    return this._modelUrl;
  }

  set modelUrl(value: string) {
    this._modelUrl = value;
    this.setAttribute('model-url', value);
    if (this.isConnected && this.sceneManager) this.loadModel();
  }

  get textureBaseUrl(): string {
    return this._textureBaseUrl;
  }

  set textureBaseUrl(value: string) {
    this._textureBaseUrl = value;
    this.setAttribute('texture-base-url', value);
  }

  get autoRotate(): boolean {
    return this._autoRotate;
  }

  set autoRotate(value: boolean) {
    this._autoRotate = value;
    this.setAttribute('auto-rotate', value ? 'true' : 'false');
  }

  get sunEnabled(): boolean {
    return this._sunEnabled;
  }

  set sunEnabled(value: boolean) {
    this._sunEnabled = value;
    this.setAttribute('sun-enabled', value ? 'true' : 'false');
  }

  /** Rotation speed multiplier (0.1–3). Default 1. */
  get rotationSpeedMultiplier(): number {
    return this.sceneManager?.rotationSpeedMultiplier ?? 1;
  }

  set rotationSpeedMultiplier(value: number) {
    this.sceneManager && (this.sceneManager.rotationSpeedMultiplier = value);
  }

  /** Set sun direction: azimuth and elevation in degrees. */
  setSunDirection(azimuthDeg: number, elevationDeg: number): void {
    this.sceneManager?.setSunDirection(azimuthDeg, elevationDeg);
  }

  getSunDirection(): { azimuthDeg: number; elevationDeg: number } {
    return this.sceneManager?.getSunDirection() ?? { azimuthDeg: 30, elevationDeg: 50 };
  }

  /** Sun intensity (0–5). */
  setSunIntensity(value: number): void {
    this.sceneManager?.setSunIntensity(value);
  }

  getSunIntensity(): number {
    return this.sceneManager?.getSunIntensity() ?? 1.4;
  }

  /** Sun color as hex number (e.g. 0xfff0e0). */
  setSunColor(hex: number): void {
    this.sceneManager?.setSunColor(hex);
  }

  getSunColor(): number {
    return this.sceneManager?.getSunColor() ?? 0xfff0e0;
  }

  /** Texture-swap transition animation type. */
  get transitionType(): TransitionType {
    return this.sceneManager?.transitionType ?? 'none';
  }

  set transitionType(value: TransitionType) {
    if (this.sceneManager) this.sceneManager.transitionType = value;
  }

  /**
   * Slide the current model off screen vertically.
   * Used to animate model changes from outside the component.
   */
  slideOut(direction: 'up' | 'down'): Promise<number> {
    return this.sceneManager?.slideOut(direction) ?? Promise.resolve(0);
  }

  /**
   * Slide the loaded model in from off screen.
   * Call after loadModel() completes (model-loaded event).
   */
  slideIn(direction: 'up' | 'down'): Promise<void> {
    return this.sceneManager?.slideIn(direction) ?? Promise.resolve();
  }

  /**
   * Set the texture manifest for the current model (material name → texture filename).
   * Call before or after loading a model when using a custom pack (e.g. Warped Forest OBJ).
   */
  setTextureManifest(manifest: TextureManifest): void {
    this.sceneManager?.setTextureManifest(manifest);
  }

  /**
   * Re-apply the default texture pack from texture-base-url using the current manifest.
   * Use when switching back from a custom ZIP pack to the built-in textures.
   */
  async applyDefaultTextures(): Promise<void> {
    await this.sceneManager?.applyDefaultTextures();
  }

  /** Exposed for Three.js: the canvas element where the scene is rendered. */
  get renderTarget(): HTMLCanvasElement {
    return this.canvas;
  }

  get loadedModel(): LoadedModel | null {
    return this.sceneManager?.loadedModel ?? null;
  }

  /**
   * Apply a texture pack from a ZIP blob. The ZIP is expected to use the same layout as the
   * project: assets/minecraft/textures/... (block, entity, etc.). Entries are matched to the
   * manifest by full path (with or without "assets/" prefix) and by bare filename.
   * Missing textures fall back to the default pack. Call after a model is loaded.
   */
  async applyTextureZip(zipBlob: Blob): Promise<void> {
    if (!this.sceneManager) {
      console.warn('[mc-texture-viewer] applyTextureZip: no scene manager');
      return;
    }
    console.log('[mc-texture-viewer] applyTextureZip: loading ZIP…');
    const zip = await JSZip.loadAsync(zipBlob);
    const urlMap: Record<string, string> = {};
    const blobUrls: string[] = [];
    const imageExt = /\.(png|jpg|jpeg|webp)$/i;
    const paths: string[] = [];
    for (const [path, entry] of Object.entries(zip.files)) {
      if (entry.dir || !imageExt.test(path)) continue;
      paths.push(path);
      const blob = await entry.async('blob');
      const url = URL.createObjectURL(blob);
      blobUrls.push(url);
      const filename = path.split('/').pop() ?? path;
      urlMap[filename] = url;
      urlMap[path] = url;
      // Manifest uses paths relative to assets/ (e.g. minecraft/textures/block/foo.png).
      // Register that key so applyTexturePack finds the ZIP texture.
      const withoutAssets = path.replace(/^assets\/?/i, '');
      if (withoutAssets !== path) {
        urlMap[withoutAssets] = url;
      }
    }
    console.log('[mc-texture-viewer] applyTextureZip: extracted', paths.length, 'image(s). Keys (sample):', Object.keys(urlMap).slice(0, 8));
    try {
      const result: TexturePackResult = await this.sceneManager.runWithTransition(
        () => this.sceneManager!.applyTexturePack(urlMap)
      );
      this.dispatchEvent(
        new CustomEvent('texture-pack-applied', {
          bubbles: true,
          detail: result,
        })
      );
      if (result.errors.length > 0) {
        console.warn('[mc-texture-viewer] texture-pack-applied with errors:', result.errors);
      } else {
        console.log('[mc-texture-viewer] texture-pack-applied OK. Applied:', result.applied, '| from default:', result.fromDefault);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('[mc-texture-viewer] applyTextureZip failed:', message);
      this.dispatchEvent(
        new CustomEvent('error', {
          bubbles: true,
          detail: { message, source: 'texture-pack' },
        })
      );
    } finally {
      for (const url of blobUrls) URL.revokeObjectURL(url);
      console.log('[mc-texture-viewer] applyTextureZip: blob URLs revoked');
    }
  }
}
