/**
 * Web Component: mc-texture-viewer
 * Embeds a 3D viewer for GLB/OBJ models with configurable textures and lighting.
 */
import JSZip from 'jszip';
import { SceneManager } from './SceneManager.js';
import type { LoadedModel } from './SceneManager.js';
import { defaultTextureManifest } from './textureManifest.js';
import type { TextureManifest, CameraPreset } from './types.js';

const HOST_CSS = `
  :host {
    display: flex;
    flex-direction: column;
    position: relative;
    width: 100%;
    height: 100%;
    min-height: 400px;
    min-width: 0;
    box-sizing: border-box;
    overflow: hidden;
  }
  /* Percentage height on canvas is unreliable in shadow roots; flex fills the host vertically */
  canvas {
    display: block;
    flex: 1 1 0;
    min-height: 0;
    min-width: 0;
    width: 100%;
  }
`;

const SPINNER_CSS = `
  @keyframes _mcspin { to { transform: rotate(360deg); } }
  ._mcoverlay {
    position: absolute; inset: 0; display: flex;
    align-items: center; justify-content: center;
    background: rgba(0,0,0,0.45); z-index: 20;
    border-radius: inherit;
  }
  ._mcspinner {
    width: 40px; height: 40px; border-radius: 50%;
    border: 3px solid rgba(255,255,255,0.15);
    border-top-color: #00ffa6;
    animation: _mcspin 0.75s linear infinite;
  }
`;

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
  private _backgroundColor: string | null = null;

  // Loading overlay
  private _loadingOverlay: HTMLDivElement | null = null;

  // Keyboard handler (bound to remove cleanly)
  private _keyHandler: ((e: KeyboardEvent) => void) | null = null;

  static get observedAttributes(): string[] {
    return ['model-url', 'texture-base-url', 'auto-rotate', 'sun-enabled', 'background-color'];
  }

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: 'open' });

    const hostStyle = document.createElement('style');
    hostStyle.textContent = HOST_CSS;
    this.shadow.appendChild(hostStyle);

    const style = document.createElement('style');
    style.textContent = SPINNER_CSS;
    this.shadow.appendChild(style);

    this.canvas = document.createElement('canvas');
    this.shadow.appendChild(this.canvas);

    if (!this.style.minHeight) this.style.minHeight = '400px';
    this.style.display = this.style.display || 'block';
    // Required for overlay positioning
    this.style.position = this.style.position || 'relative';
  }

  connectedCallback(): void {
    this.syncFromAttributes();
    this.sceneManager = new SceneManager(this.canvas);
    this.sceneManager.setTextureManifest(defaultTextureManifest);
    if (this._textureBaseUrl) this.sceneManager.setDefaultTextureBaseUrl(this._textureBaseUrl);
    if (this._backgroundColor) this.sceneManager.setBackground(this._backgroundColor === 'transparent' ? 'transparent' : parseInt(this._backgroundColor.replace('#', ''), 16));
    this.sceneManager.onModelLoaded = (model: LoadedModel) => {
      this._hideLoadingOverlay();
      this.dispatchEvent(new CustomEvent('model-loaded', { detail: { model }, bubbles: true }));
      if (this._textureBaseUrl) this.sceneManager?.applyDefaultTextures();
      requestAnimationFrame(() => {
        this.handleResize();
        this.sceneManager?.refitCurrentModelFrame();
      });
    };
    this.sceneManager.autoRotate = this._autoRotate;
    this.sceneManager.sunEnabled = this._sunEnabled;
    this.sceneManager.startRenderLoop();
    this.resizeObserver = new ResizeObserver(() => this.handleResize());
    this.resizeObserver.observe(this);
    this.handleResize();
    if (this._modelUrl) this.loadModel();

    // Keyboard shortcuts
    this._keyHandler = (e: KeyboardEvent) => this._handleKey(e);
    document.addEventListener('keydown', this._keyHandler);

    // Fullscreen resize
    document.addEventListener('fullscreenchange', () => {
      if (document.fullscreenElement === this || !document.fullscreenElement) {
        requestAnimationFrame(() => this.handleResize());
      }
    });
  }

  disconnectedCallback(): void {
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    this.sceneManager?.dispose();
    this.sceneManager = null;
    if (this._keyHandler) {
      document.removeEventListener('keydown', this._keyHandler);
      this._keyHandler = null;
    }
  }

  private handleResize(): void {
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    if (w > 0 && h > 0 && this.sceneManager) {
      this.sceneManager.setSize(w, h);
    }
  }

  /** After outer layout changes (e.g. toolbar expand/collapse), sync drawing buffer to host size. */
  updateLayout(): void {
    this.handleResize();
  }

  private _showLoadingOverlay(): void {
    if (this._loadingOverlay) return;
    const overlay = document.createElement('div');
    overlay.className = '_mcoverlay';
    const spinner = document.createElement('div');
    spinner.className = '_mcspinner';
    overlay.appendChild(spinner);
    this.shadow.appendChild(overlay);
    this._loadingOverlay = overlay;
    this.setAttribute('loading', '');
  }

  private _hideLoadingOverlay(): void {
    if (this._loadingOverlay) {
      this._loadingOverlay.remove();
      this._loadingOverlay = null;
    }
    this.removeAttribute('loading');
  }

  private async loadModel(): Promise<void> {
    if (!this.sceneManager || !this._modelUrl) return;
    this._showLoadingOverlay();
    try {
      await this.sceneManager.loadModel(this._modelUrl);
    } catch (err) {
      this._hideLoadingOverlay();
      this.dispatchEvent(new CustomEvent('error', {
        detail: { message: String(err), source: 'model-load' },
        bubbles: true,
      }));
    }
  }

  attributeChangedCallback(name: string, _oldValue: string | null, newValue: string | null): void {
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
        if (this.sceneManager) this.sceneManager.autoRotate = this._autoRotate;
        break;
      case 'sun-enabled':
        this._sunEnabled = newValue !== 'false';
        if (this.sceneManager) this.sceneManager.sunEnabled = this._sunEnabled;
        break;
      case 'background-color':
        this._backgroundColor = newValue;
        if (this.sceneManager) {
          this.sceneManager.setBackground(newValue === 'transparent' ? 'transparent' : parseInt(newValue.replace('#', ''), 16));
        }
        break;
    }
  }

  private syncFromAttributes(): void {
    this._modelUrl = this.getAttribute('model-url') ?? '';
    this._textureBaseUrl = this.getAttribute('texture-base-url') ?? '';
    this._autoRotate = this.getAttribute('auto-rotate') === 'true' || this.getAttribute('auto-rotate') === '';
    this._sunEnabled = this.getAttribute('sun-enabled') !== 'false';
    this._backgroundColor = this.getAttribute('background-color');
  }

  // ─── Properties ───────────────────────────────────────────────────────────

  get modelUrl(): string { return this._modelUrl; }
  set modelUrl(value: string) {
    this._modelUrl = value;
    this.setAttribute('model-url', value);
    if (this.isConnected && this.sceneManager) this.loadModel();
  }

  get textureBaseUrl(): string { return this._textureBaseUrl; }
  set textureBaseUrl(value: string) {
    this._textureBaseUrl = value;
    this.setAttribute('texture-base-url', value);
  }

  get autoRotate(): boolean { return this._autoRotate; }
  set autoRotate(value: boolean) {
    this._autoRotate = value;
    this.setAttribute('auto-rotate', value ? 'true' : 'false');
    if (this.sceneManager) this.sceneManager.autoRotate = value;
  }

  get sunEnabled(): boolean { return this._sunEnabled; }
  set sunEnabled(value: boolean) {
    this._sunEnabled = value;
    this.setAttribute('sun-enabled', value ? 'true' : 'false');
    if (this.sceneManager) this.sceneManager.sunEnabled = value;
  }

  get rotationSpeedMultiplier(): number { return this.sceneManager?.rotationSpeedMultiplier ?? 1; }
  set rotationSpeedMultiplier(value: number) {
    if (this.sceneManager) this.sceneManager.rotationSpeedMultiplier = value;
  }

  get wireframe(): boolean { return this.sceneManager?.wireframe ?? false; }
  set wireframe(value: boolean) {
    if (this.sceneManager) this.sceneManager.wireframe = value;
  }

  get hemisphereEnabled(): boolean { return this.sceneManager?.hemisphereEnabled ?? false; }
  set hemisphereEnabled(value: boolean) {
    if (this.sceneManager) this.sceneManager.hemisphereEnabled = value;
  }

  get shadowCatcher(): boolean { return this.sceneManager?.shadowCatcher ?? false; }
  set shadowCatcher(value: boolean) {
    if (this.sceneManager) this.sceneManager.shadowCatcher = value;
  }

  get transitionType(): string { return this.sceneManager?.transitionType ?? 'spin'; }
  set transitionType(value: string) {
    if (this.sceneManager) this.sceneManager.transitionType = value as import('./types.js').TransitionType;
  }

  get loadedModel(): LoadedModel | null { return this.sceneManager?.loadedModel ?? null; }
  get renderTarget(): HTMLCanvasElement { return this.canvas; }

  // Skip next texture transition when switching models
  get skipTransitionForNextApply(): boolean { return this.sceneManager?.skipTransitionForNextApply ?? false; }
  set skipTransitionForNextApply(value: boolean) {
    if (this.sceneManager) this.sceneManager.skipTransitionForNextApply = value;
  }

  // ─── Sun controls ─────────────────────────────────────────────────────────

  setSunDirection(azimuth: number, elevation: number): void { this.sceneManager?.setSunDirection(azimuth, elevation); }
  getSunDirection() { return this.sceneManager?.getSunDirection(); }
  setSunIntensity(v: number): void { this.sceneManager?.setSunIntensity(v); }
  getSunIntensity(): number { return this.sceneManager?.getSunIntensity() ?? 1.4; }
  setSunColor(hex: number): void { this.sceneManager?.setSunColor(hex); }
  getSunColor(): number { return this.sceneManager?.getSunColor() ?? 0xfff0e0; }

  // ─── Public API ───────────────────────────────────────────────────────────

  setTextureManifest(manifest: TextureManifest): void {
    this.sceneManager?.setTextureManifest(manifest);
  }

  async applyDefaultTextures(): Promise<void> {
    await this.sceneManager?.applyDefaultTextures();
  }

  snapshot(): string {
    return this.sceneManager?.captureSnapshot() ?? '';
  }

  async setCameraPreset(preset: CameraPreset): Promise<void> {
    await this.sceneManager?.setCameraPreset(preset);
  }

  async resetCamera(): Promise<void> {
    await this.sceneManager?.resetCamera();
  }

  toggleFullscreen(): void {
    if (document.fullscreenElement === this) {
      document.exitFullscreen();
    } else {
      this.requestFullscreen();
    }
  }

  setBackground(color: number | 'transparent'): void {
    this.sceneManager?.setBackground(color);
  }

  setFog(enabled: boolean, color?: number, near?: number, far?: number): void {
    this.sceneManager?.setFog(enabled, color, near, far);
  }

  async slideOut(direction: 'up' | 'down'): Promise<void> {
    await this.sceneManager?.slideOut(direction);
  }

  async slideIn(direction: 'up' | 'down'): Promise<void> {
    await this.sceneManager?.slideIn(direction);
  }

  async applyTextureZip(zipBlob: Blob): Promise<void> {
    if (!this.sceneManager) return;
    const zip = await JSZip.loadAsync(zipBlob);
    const urlMap: Record<string, string> = {};
    const blobUrls: string[] = [];
    const imageExt = /\.(png|jpg|jpeg|webp)$/i;
    for (const [path, entry] of Object.entries(zip.files)) {
      if (entry.dir || !imageExt.test(path)) continue;
      const blob = await entry.async('blob');
      const url = URL.createObjectURL(blob);
      blobUrls.push(url);
      const filename = path.split('/').pop() ?? path;
      urlMap[filename] = url;
      urlMap[path] = url;
    }
    try {
      const result = await this.sceneManager.applyTexturePack(urlMap);
      this.dispatchEvent(new CustomEvent('texture-pack-applied', { detail: result, bubbles: true }));
    } finally {
      for (const url of blobUrls) URL.revokeObjectURL(url);
    }
  }

  // ─── Keyboard shortcuts ───────────────────────────────────────────────────

  private _handleKey(e: KeyboardEvent): void {
    // Don't fire when typing in inputs
    const tag = (e.target as HTMLElement)?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

    switch (e.key) {
      case 'r': case 'R':
        this.autoRotate = !this.autoRotate;
        this.dispatchEvent(new CustomEvent('shortcut-autorotate', { detail: this.autoRotate, bubbles: true }));
        break;
      case 'w': case 'W':
        this.wireframe = !this.wireframe;
        this.dispatchEvent(new CustomEvent('shortcut-wireframe', { detail: this.wireframe, bubbles: true }));
        break;
      case 'f': case 'F':
        this.toggleFullscreen();
        break;
      case 's': case 'S': {
        const dataUrl = this.snapshot();
        if (dataUrl) {
          const a = document.createElement('a');
          a.download = 'snapshot.png';
          a.href = dataUrl;
          a.click();
        }
        break;
      }
      case ' ':
        e.preventDefault();
        void this.resetCamera();
        break;
      case 'ArrowLeft':
        this.dispatchEvent(new CustomEvent('shortcut-prev-model', { bubbles: true }));
        break;
      case 'ArrowRight':
        this.dispatchEvent(new CustomEvent('shortcut-next-model', { bubbles: true }));
        break;
    }
  }
}
